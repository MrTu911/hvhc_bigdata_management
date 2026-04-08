/**
 * @deprecated LEGACY WORKFLOW — Chưa migrate sang M13 engine.
 * Route này vẫn được giữ để không phá module cũ.
 * Mục tiêu: migrate sang /api/workflows/* sau khi module nghiệp vụ dùng M13 engine.
 * Xem: docs/design/module-m13-overview.md và migration plan.
 */
/**
 * API Workflow Transition cho Hồ sơ Chính sách (A3.3)
 * DRAFT → SUBMITTED → UNDER_REVIEW → APPROVED / REJECTED
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireFunction } from '@/lib/rbac/middleware';
import { FUNCTION_CODES } from '@/lib/rbac/function-codes';
import { logAudit } from '@/lib/audit';
import { canTransitionPolicyRequest, POLICY_REQUEST_STATUS_NAMES } from '@/lib/workflow';
import { PolicyRequestStatus, PolicyWorkflowAction } from '@prisma/client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { requestId, action, note } = body;
    
    if (!requestId || !action) {
      return NextResponse.json(
        { error: 'Thiếu thông tin: requestId, action' },
        { status: 400 }
      );
    }
    
    // Lấy thông tin hồ sơ hiện tại
    const policyRequest = await prisma.policyRequest.findUnique({
      where: { id: requestId },
      include: { category: true, requester: true },
    });
    
    if (!policyRequest) {
      return NextResponse.json(
        { error: 'Không tìm thấy hồ sơ chính sách' },
        { status: 404 }
      );
    }
    
    // Xác định trạng thái mới và quyền cần thiết
    let newStatus: PolicyRequestStatus;
    let requiredFunction: string;
    let workflowAction: PolicyWorkflowAction;
    
    switch (action) {
      case 'SUBMIT':
        newStatus = 'SUBMITTED';
        requiredFunction = FUNCTION_CODES.POLICY.CREATE_REQUEST;
        workflowAction = 'SUBMIT';
        break;
      case 'REVIEW':
        newStatus = 'UNDER_REVIEW';
        requiredFunction = FUNCTION_CODES.POLICY.VIEW;
        workflowAction = 'REVIEW';
        break;
      case 'APPROVE':
        newStatus = 'APPROVED';
        requiredFunction = FUNCTION_CODES.POLICY.APPROVE;
        workflowAction = 'APPROVE';
        break;
      case 'REJECT':
        newStatus = 'REJECTED';
        requiredFunction = FUNCTION_CODES.POLICY.REJECT;
        workflowAction = 'REJECT';
        break;
      case 'CANCEL':
        newStatus = 'CANCELLED';
        requiredFunction = FUNCTION_CODES.POLICY.CREATE_REQUEST;
        workflowAction = 'CANCEL';
        break;
      case 'COMPLETE':
        newStatus = 'COMPLETED';
        requiredFunction = FUNCTION_CODES.POLICY.APPROVE;
        workflowAction = 'COMPLETE';
        break;
      default:
        return NextResponse.json(
          { error: 'Action không hợp lệ' },
          { status: 400 }
        );
    }
    
    // Kiểm tra quyền
    const authResult = await requireFunction(request, requiredFunction, {
      resourceId: requestId,
    });
    
    if (!authResult.allowed) {
      return NextResponse.json(
        { error: authResult.response ? "Không có quyền" : "Lỗi xác thực" || 'Không có quyền thực hiện' },
        { status: 403 }
      );
    }
    
    const user = authResult.user!;
    
    // Kiểm tra transition hợp lệ
    const currentStatus = policyRequest.status as PolicyRequestStatus;
    if (!canTransitionPolicyRequest(currentStatus, newStatus)) {
      return NextResponse.json(
        { 
          error: `Không thể chuyển từ "${POLICY_REQUEST_STATUS_NAMES[currentStatus]}" sang "${POLICY_REQUEST_STATUS_NAMES[newStatus]}"` 
        },
        { status: 400 }
      );
    }
    
    // Cập nhật trạng thái
    const updateData: Record<string, unknown> = {
      status: newStatus,
    };
    
    switch (action) {
      case 'SUBMIT':
        updateData.submittedAt = new Date();
        updateData.submittedBy = user.id;
        break;
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
        updateData.rejectedAt = new Date();
        updateData.rejectedBy = user.id;
        updateData.rejectReason = note || 'Không đạt yêu cầu';
        break;
    }
    
    const updatedRequest = await prisma.policyRequest.update({
      where: { id: requestId },
      data: updateData,
    });
    
    // Ghi workflow log
    await prisma.policyWorkflowLog.create({
      data: {
        requestId,
        action: workflowAction,
        fromStatus: currentStatus,
        toStatus: newStatus,
        performedBy: user.id,
        performerName: authResult.session?.user?.name || user.email,
        performerRole: user.role,
        note,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    });
    
    // Ghi audit log
    await logAudit({
      userId: user.id,
      functionCode: requiredFunction,
      action: `WORKFLOW_${action}`,
      resourceType: 'POLICY_REQUEST',
      resourceId: requestId,
      oldValue: { status: currentStatus },
      newValue: { status: newStatus, note },
      result: 'SUCCESS',
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
    });
    
    return NextResponse.json({
      success: true,
      message: `Chuyển trạng thái thành công: ${POLICY_REQUEST_STATUS_NAMES[newStatus]}`,
      data: updatedRequest,
    });
    
  } catch (error) {
    console.error('Workflow transition error:', error);
    return NextResponse.json(
      { error: 'Lỗi hệ thống khi chuyển trạng thái' },
      { status: 500 }
    );
  }
}
