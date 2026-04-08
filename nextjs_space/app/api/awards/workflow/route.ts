import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireFunction } from '@/lib/rbac/middleware';
import { AWARDS } from '@/lib/rbac/function-codes';
import { logAudit } from '@/lib/audit';
import { checkWorkflowSoD } from '@/lib/rbac/sod';

// POST: Thực hiện hành động workflow Khen thưởng/Kỷ luật (PolicyRecord)
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { action, recordIds, reason } = data;

    if (!action || !recordIds || !Array.isArray(recordIds) || recordIds.length === 0) {
      return NextResponse.json(
        { error: 'action và recordIds là bắt buộc' },
        { status: 400 }
      );
    }

    let requiredFunction: string;
    let newStatus: string;
    let allowedFromStatus: string[];

    switch (action) {
      case 'REVIEW':
        requiredFunction = AWARDS.APPROVE;
        newStatus = 'UNDER_REVIEW';
        allowedFromStatus = ['PROPOSED'];
        break;
      case 'APPROVE':
        requiredFunction = AWARDS.APPROVE;
        newStatus = 'APPROVED';
        allowedFromStatus = ['PROPOSED', 'UNDER_REVIEW'];
        break;
      case 'REJECT':
        requiredFunction = AWARDS.APPROVE;
        newStatus = 'REJECTED';
        allowedFromStatus = ['PROPOSED', 'UNDER_REVIEW'];
        break;
      case 'CANCEL':
        requiredFunction = AWARDS.APPROVE;
        newStatus = 'CANCELLED';
        allowedFromStatus = ['PROPOSED', 'UNDER_REVIEW', 'REJECTED'];
        break;
      case 'REVERT':
        requiredFunction = AWARDS.APPROVE;
        newStatus = 'PROPOSED';
        allowedFromStatus = ['UNDER_REVIEW', 'REJECTED', 'CANCELLED'];
        break;
      default:
        return NextResponse.json(
          { error: 'action không hợp lệ: REVIEW, APPROVE, REJECT, CANCEL, REVERT' },
          { status: 400 }
        );
    }

    const authResult = await requireFunction(request, requiredFunction);
    if (!authResult.allowed) {
      return authResult.response!;
    }
    const user = authResult.user!;

    // SoD Check: Người đề xuất khen thưởng không được tự duyệt
    if (action === 'APPROVE' || action === 'REJECT') {
      const sodResult = await checkWorkflowSoD(user.id, AWARDS.CREATE, AWARDS.APPROVE);
      if (sodResult.blocked) {
        // Kiểm tra xem user có phải là người đã tạo hồ sơ không
        const ownRecords = await prisma.policyRecord.findMany({
          where: { 
            id: { in: recordIds },
            proposedBy: user.id,
            deletedAt: null,
          },
        });
        
        if (ownRecords.length > 0) {
          await logAudit({
            userId: user.id,
            functionCode: requiredFunction,
            action: action,
            resourceType: 'POLICY_RECORD_WORKFLOW',
            resourceId: recordIds.join(','),
            result: 'DENIED',
            newValue: { reason: sodResult.reason },
          });
          
          return NextResponse.json({
            error: 'Separation of Duties: Bạn không được tự duyệt hồ sơ mà bạn đã đề xuất',
            sodViolation: true,
            reason: sodResult.reason,
          }, { status: 403 });
        }
      }
    }

    const records = await prisma.policyRecord.findMany({
      where: { id: { in: recordIds }, deletedAt: null },
    });

    if (records.length === 0) {
      return NextResponse.json(
        { error: 'Không tìm thấy hồ sơ' },
        { status: 404 }
      );
    }

    const invalidRecords = records.filter(r => !allowedFromStatus.includes(r.workflowStatus));
    if (invalidRecords.length > 0) {
      return NextResponse.json({
        error: `Không thể ${action} hồ sơ ở trạng thái hiện tại`,
        invalidRecords: invalidRecords.map(r => ({
          id: r.id,
          currentStatus: r.workflowStatus,
        })),
      }, { status: 400 });
    }

    const updateData: any = {
      workflowStatus: newStatus as any,
    };

    if (action === 'REVIEW') {
      updateData.reviewedAt = new Date();
      updateData.reviewedBy = user.id;
    } else if (action === 'APPROVE') {
      updateData.approvedAt = new Date();
      updateData.approvedBy = user.id;
      updateData.rejectReason = null;
    } else if (action === 'REJECT') {
      updateData.rejectReason = reason || 'Không đủ điều kiện';
    } else if (action === 'REVERT') {
      updateData.reviewedAt = null;
      updateData.reviewedBy = null;
      updateData.approvedAt = null;
      updateData.approvedBy = null;
      updateData.rejectReason = null;
    }

    const result = await prisma.policyRecord.updateMany({
      where: { id: { in: recordIds } },
      data: updateData,
    });

    await logAudit({
      userId: user.id,
      functionCode: requiredFunction,
      action: action,
      resourceType: 'POLICY_RECORD_WORKFLOW',
      resourceId: recordIds.join(','),
      newValue: { action, newStatus, count: result.count, reason },
      result: 'SUCCESS',
    });

    return NextResponse.json({
      success: true,
      message: `${action} thành công ${result.count} hồ sơ`,
      updatedCount: result.count,
      newStatus,
    });
  } catch (error: any) {
    console.error('Award workflow error:', error);
    return NextResponse.json(
      { error: 'Lỗi xử lý workflow', details: error.message },
      { status: 500 }
    );
  }
}

// GET: Thống kê workflow khen thưởng/kỷ luật
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireFunction(request, AWARDS.VIEW);
    if (!authResult.allowed) {
      return authResult.response!;
    }

    const { searchParams } = new URL(request.url);
    const recordType = searchParams.get('type'); // REWARD or DISCIPLINE

    const where: any = { deletedAt: null };
    if (recordType) where.recordType = recordType;

    const stats = await prisma.policyRecord.groupBy({
      by: ['workflowStatus'],
      where,
      _count: { id: true },
    });

    const pendingApprove = await prisma.policyRecord.findMany({
      where: { ...where, workflowStatus: { in: ['PROPOSED', 'UNDER_REVIEW'] } },
      take: 20,
      orderBy: { proposedAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, employeeId: true } },
      },
    });

    return NextResponse.json({
      stats: stats.reduce((acc, s) => {
        acc[s.workflowStatus] = s._count.id;
        return acc;
      }, {} as Record<string, number>),
      pendingApprove,
    });
  } catch (error: any) {
    console.error('Award workflow stats error:', error);
    return NextResponse.json(
      { error: 'Lỗi lấy thống kê', details: error.message },
      { status: 500 }
    );
  }
}
