/**
 * @deprecated LEGACY WORKFLOW — Chưa migrate sang M13 engine.
 * Route này vẫn được giữ để không phá module cũ.
 * Mục tiêu: migrate sang /api/workflows/* sau khi module nghiệp vụ dùng M13 engine.
 * Xem: docs/design/module-m13-overview.md và migration plan.
 */
/**
 * API Workflow Transition cho Khen thưởng/Kỷ luật (A3.4)
 * PROPOSED → UNDER_REVIEW → APPROVED / REJECTED
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireFunction } from '@/lib/rbac/middleware';
import { FUNCTION_CODES } from '@/lib/rbac/function-codes';
import { logAudit } from '@/lib/audit';
import { canTransitionAward, AWARD_STATUS_NAMES } from '@/lib/workflow';
import { AwardWorkflowStatus } from '@prisma/client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { recordId, action, note } = body;
    
    if (!recordId || !action) {
      return NextResponse.json(
        { error: 'Thiếu thông tin: recordId, action' },
        { status: 400 }
      );
    }
    
    // Lấy thông tin bản ghi hiện tại
    const record = await prisma.policyRecord.findUnique({
      where: { id: recordId },
      include: { user: true },
    });
    
    if (!record) {
      return NextResponse.json(
        { error: 'Không tìm thấy bản ghi khen thưởng/kỷ luật' },
        { status: 404 }
      );
    }
    
    // Xác định trạng thái mới và quyền cần thiết
    let newStatus: AwardWorkflowStatus;
    let requiredFunction: string;
    
    switch (action) {
      case 'REVIEW':
        newStatus = 'UNDER_REVIEW';
        requiredFunction = FUNCTION_CODES.AWARD.VIEW;
        break;
      case 'APPROVE':
        newStatus = 'APPROVED';
        requiredFunction = FUNCTION_CODES.AWARD.APPROVE;
        break;
      case 'REJECT':
        newStatus = 'REJECTED';
        requiredFunction = FUNCTION_CODES.AWARD.APPROVE;
        break;
      case 'CANCEL':
        newStatus = 'CANCELLED';
        requiredFunction = FUNCTION_CODES.AWARD.DELETE;
        break;
      case 'RESUBMIT':
        newStatus = 'PROPOSED';
        requiredFunction = FUNCTION_CODES.AWARD.CREATE;
        break;
      default:
        return NextResponse.json(
          { error: 'Action không hợp lệ' },
          { status: 400 }
        );
    }
    
    // Kiểm tra quyền
    const authResult = await requireFunction(request, requiredFunction, {
      resourceId: recordId,
    });
    
    if (!authResult.allowed) {
      return NextResponse.json(
        { error: authResult.response ? "Không có quyền" : "Lỗi xác thực" || 'Không có quyền thực hiện' },
        { status: 403 }
      );
    }
    
    const user = authResult.user!;
    
    // Kiểm tra transition hợp lệ
    const currentStatus = record.workflowStatus as AwardWorkflowStatus;
    if (!canTransitionAward(currentStatus, newStatus)) {
      return NextResponse.json(
        { 
          error: `Không thể chuyển từ "${AWARD_STATUS_NAMES[currentStatus]}" sang "${AWARD_STATUS_NAMES[newStatus]}"` 
        },
        { status: 400 }
      );
    }
    
    // Cập nhật trạng thái
    const updateData: Record<string, unknown> = {
      workflowStatus: newStatus,
    };
    
    switch (action) {
      case 'REVIEW':
        updateData.reviewedAt = new Date();
        updateData.reviewedBy = user.id;
        updateData.reviewerNote = note;
        break;
      case 'APPROVE':
        updateData.approvedAt = new Date();
        updateData.approvedBy = user.id;
        updateData.approverNote = note;
        break;
      case 'REJECT':
        updateData.rejectReason = note || 'Không đạt yêu cầu';
        break;
      case 'RESUBMIT':
        updateData.proposedAt = new Date();
        updateData.proposedBy = user.id;
        break;
    }
    
    const updatedRecord = await prisma.policyRecord.update({
      where: { id: recordId },
      data: updateData,
    });
    
    // Ghi audit log
    await logAudit({
      userId: user.id,
      functionCode: requiredFunction,
      action: `WORKFLOW_${action}`,
      resourceType: record.recordType === 'REWARD' ? 'AWARD' : 'DISCIPLINE',
      resourceId: recordId,
      oldValue: { workflowStatus: currentStatus },
      newValue: { workflowStatus: newStatus, note },
      result: 'SUCCESS',
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
    });
    
    return NextResponse.json({
      success: true,
      message: `Chuyển trạng thái thành công: ${AWARD_STATUS_NAMES[newStatus]}`,
      data: updatedRecord,
    });
    
  } catch (error) {
    console.error('Workflow transition error:', error);
    return NextResponse.json(
      { error: 'Lỗi hệ thống khi chuyển trạng thái' },
      { status: 500 }
    );
  }
}
