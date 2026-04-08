import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireFunction } from '@/lib/rbac/middleware';
import { TRAINING } from '@/lib/rbac/function-codes';
import { logAudit } from '@/lib/audit';
import { checkWorkflowSoD } from '@/lib/rbac/sod';

// POST: Thực hiện hành động workflow
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { action, gradeIds, reason } = data;

    if (!action || !gradeIds || !Array.isArray(gradeIds) || gradeIds.length === 0) {
      return NextResponse.json(
        { error: 'action và gradeIds là bắt buộc' },
        { status: 400 }
      );
    }

    // Determine required function based on action
    let requiredFunction: string;
    let newStatus: string;
    let allowedFromStatus: string[];

    switch (action) {
      case 'SUBMIT':
        requiredFunction = TRAINING.SUBMIT_GRADE;
        newStatus = 'SUBMITTED';
        allowedFromStatus = ['DRAFT', 'REJECTED'];
        break;
      case 'APPROVE':
        requiredFunction = TRAINING.APPROVE_GRADE;
        newStatus = 'APPROVED';
        allowedFromStatus = ['SUBMITTED'];
        break;
      case 'REJECT':
        requiredFunction = TRAINING.APPROVE_GRADE; // Same permission as approve
        newStatus = 'REJECTED';
        allowedFromStatus = ['SUBMITTED'];
        break;
      case 'REVERT':
        requiredFunction = TRAINING.APPROVE_GRADE;
        newStatus = 'DRAFT';
        allowedFromStatus = ['SUBMITTED', 'REJECTED'];
        break;
      default:
        return NextResponse.json(
          { error: 'action không hợp lệ. Các action hợp lệ: SUBMIT, APPROVE, REJECT, REVERT' },
          { status: 400 }
        );
    }

    // Check permission
    const authResult = await requireFunction(request, requiredFunction);
    if (!authResult.allowed) {
      return authResult.response!;
    }
    const user = authResult.user!;

    // SoD Check: Người nộp điểm không được tự duyệt
    if (action === 'APPROVE' || action === 'REJECT') {
      const sodResult = await checkWorkflowSoD(user.id, TRAINING.SUBMIT_GRADE, TRAINING.APPROVE_GRADE);
      if (sodResult.blocked) {
        // Kiểm tra xem user có phải là người đã submit không
        const grades = await prisma.ketQuaHocTap.findMany({
          where: { 
            id: { in: gradeIds },
            submittedBy: user.id 
          },
        });
        
        if (grades.length > 0) {
          await logAudit({
            userId: user.id,
            functionCode: requiredFunction,
            action: action,
            resourceType: 'GRADE_WORKFLOW',
            resourceId: gradeIds.join(','),
            result: 'DENIED',
            newValue: { reason: sodResult.reason },
          });
          
          return NextResponse.json({
            error: 'Separation of Duties: Bạn không được tự duyệt điểm mà bạn đã nộp',
            sodViolation: true,
            reason: sodResult.reason,
          }, { status: 403 });
        }
      }
    }

    // Fetch grades to update
    const grades = await prisma.ketQuaHocTap.findMany({
      where: { id: { in: gradeIds } },
    });

    if (grades.length === 0) {
      return NextResponse.json(
        { error: 'Không tìm thấy kết quả học tập' },
        { status: 404 }
      );
    }

    // Check if all grades are in allowed status
    const invalidGrades = grades.filter(g => !allowedFromStatus.includes(g.workflowStatus));
    if (invalidGrades.length > 0) {
      return NextResponse.json({
        error: `Không thể ${action} điểm ở trạng thái hiện tại`,
        invalidGrades: invalidGrades.map(g => ({
          id: g.id,
          currentStatus: g.workflowStatus,
        })),
      }, { status: 400 });
    }

    // Build update data
    const updateData: any = {
      workflowStatus: newStatus as any,
    };

    if (action === 'SUBMIT') {
      updateData.submittedAt = new Date();
      updateData.submittedBy = user.id;
    } else if (action === 'APPROVE') {
      updateData.approvedAt = new Date();
      updateData.approvedBy = user.id;
      updateData.rejectReason = null;
    } else if (action === 'REJECT') {
      updateData.rejectReason = reason || 'Cần sửa lại';
      updateData.approvedAt = null;
      updateData.approvedBy = null;
    } else if (action === 'REVERT') {
      updateData.submittedAt = null;
      updateData.submittedBy = null;
      updateData.approvedAt = null;
      updateData.approvedBy = null;
      updateData.rejectReason = null;
    }

    // Update all grades
    const result = await prisma.ketQuaHocTap.updateMany({
      where: { id: { in: gradeIds } },
      data: updateData,
    });

    // Audit log
    await logAudit({
      userId: user.id,
      functionCode: requiredFunction,
      action: action,
      resourceType: 'GRADE_WORKFLOW',
      resourceId: gradeIds.join(','),
      newValue: { action, newStatus, count: result.count, reason },
      result: 'SUCCESS',
    });

    return NextResponse.json({
      success: true,
      message: `${action} thành công ${result.count} kết quả`,
      updatedCount: result.count,
      newStatus,
    });
  } catch (error: any) {
    console.error('Grade workflow error:', error);
    return NextResponse.json(
      { error: 'Lỗi xử lý workflow', details: error.message },
      { status: 500 }
    );
  }
}

// GET: Lấy thống kê workflow
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireFunction(request, TRAINING.VIEW_GRADE);
    if (!authResult.allowed) {
      return authResult.response!;
    }

    const { searchParams } = new URL(request.url);
    const namHoc = searchParams.get('namHoc');
    const hocKy = searchParams.get('hocKy');

    const where: any = {};
    if (namHoc) where.namHoc = namHoc;
    if (hocKy) where.hocKy = hocKy;

    const stats = await prisma.ketQuaHocTap.groupBy({
      by: ['workflowStatus'],
      where,
      _count: { id: true },
    });

    const pendingSubmit = await prisma.ketQuaHocTap.findMany({
      where: { ...where, workflowStatus: 'DRAFT' },
      take: 50,
      orderBy: { createdAt: 'desc' },
      include: {
        hocVien: { select: { id: true, hoTen: true, maHocVien: true } },
      },
    });

    const pendingApprove = await prisma.ketQuaHocTap.findMany({
      where: { ...where, workflowStatus: 'SUBMITTED' },
      take: 50,
      orderBy: { submittedAt: 'desc' },
      include: {
        hocVien: { select: { id: true, hoTen: true, maHocVien: true } },
      },
    });

    return NextResponse.json({
      stats: stats.reduce((acc, s) => {
        acc[s.workflowStatus] = s._count.id;
        return acc;
      }, {} as Record<string, number>),
      pendingSubmit,
      pendingApprove,
    });
  } catch (error: any) {
    console.error('Grade workflow stats error:', error);
    return NextResponse.json(
      { error: 'Lỗi lấy thống kê', details: error.message },
      { status: 500 }
    );
  }
}
