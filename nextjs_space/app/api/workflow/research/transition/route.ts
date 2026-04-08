/**
 * @deprecated LEGACY WORKFLOW — Chưa migrate sang M13 engine.
 * Route này vẫn được giữ để không phá module cũ.
 * Mục tiêu: migrate sang /api/workflows/* sau khi module nghiệp vụ dùng M13 engine.
 * Xem: docs/design/module-m13-overview.md và migration plan.
 */
/**
 * API Workflow Transition cho Đề tài NCKH (A3.2)
 * DRAFT → SUBMITTED → UNDER_REVIEW → APPROVED → IN_PROGRESS → COMPLETED
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireFunction } from '@/lib/rbac/middleware';
import { FUNCTION_CODES } from '@/lib/rbac/function-codes';
import { logAudit } from '@/lib/audit';
import { canTransitionResearch, RESEARCH_STATUS_NAMES } from '@/lib/workflow';
import { ResearchWorkflowStatus } from '@prisma/client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, action, note } = body;
    
    if (!projectId || !action) {
      return NextResponse.json(
        { error: 'Thiếu thông tin: projectId, action' },
        { status: 400 }
      );
    }
    
    // Lấy thông tin đề tài hiện tại
    const project = await prisma.researchProject.findUnique({
      where: { id: projectId },
      include: { faculty: true },
    });
    
    if (!project) {
      return NextResponse.json(
        { error: 'Không tìm thấy đề tài NCKH' },
        { status: 404 }
      );
    }
    
    // Xác định trạng thái mới và quyền cần thiết
    let newStatus: ResearchWorkflowStatus;
    let requiredFunction: string;
    
    switch (action) {
      case 'SUBMIT':
        newStatus = 'SUBMITTED';
        requiredFunction = FUNCTION_CODES.RESEARCH.SUBMIT;
        break;
      case 'REVIEW':
        newStatus = 'UNDER_REVIEW';
        requiredFunction = FUNCTION_CODES.RESEARCH.REVIEW;
        break;
      case 'APPROVE':
        newStatus = 'APPROVED';
        requiredFunction = FUNCTION_CODES.RESEARCH.APPROVE;
        break;
      case 'REJECT':
        newStatus = 'REJECTED';
        requiredFunction = FUNCTION_CODES.RESEARCH.APPROVE;
        break;
      case 'START':
        newStatus = 'IN_PROGRESS';
        requiredFunction = FUNCTION_CODES.RESEARCH.UPDATE;
        break;
      case 'REQUEST_REVIEW':
        newStatus = 'PENDING_REVIEW';
        requiredFunction = FUNCTION_CODES.RESEARCH.SUBMIT;
        break;
      case 'COMPLETE':
        newStatus = 'COMPLETED';
        requiredFunction = FUNCTION_CODES.RESEARCH.APPROVE;
        break;
      case 'CANCEL':
        newStatus = 'CANCELLED';
        requiredFunction = FUNCTION_CODES.RESEARCH.DELETE;
        break;
      default:
        return NextResponse.json(
          { error: 'Action không hợp lệ' },
          { status: 400 }
        );
    }
    
    // Kiểm tra quyền
    const authResult = await requireFunction(request, requiredFunction, {
      resourceId: projectId,
    });
    
    if (!authResult.allowed) {
      return NextResponse.json(
        { error: authResult.response ? "Không có quyền" : "Lỗi xác thực" || 'Không có quyền thực hiện' },
        { status: 403 }
      );
    }
    
    const user = authResult.user!;
    
    // Kiểm tra transition hợp lệ
    const currentStatus = project.workflowStatus as ResearchWorkflowStatus;
    if (!canTransitionResearch(currentStatus, newStatus)) {
      return NextResponse.json(
        { 
          error: `Không thể chuyển từ "${RESEARCH_STATUS_NAMES[currentStatus]}" sang "${RESEARCH_STATUS_NAMES[newStatus]}"` 
        },
        { status: 400 }
      );
    }
    
    // Cập nhật trạng thái
    const updateData: Record<string, unknown> = {
      workflowStatus: newStatus,
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
        updateData.rejectReason = note || 'Không đạt yêu cầu';
        break;
      case 'COMPLETE':
        updateData.completedAt = new Date();
        updateData.completedBy = user.id;
        break;
    }
    
    const updatedProject = await prisma.researchProject.update({
      where: { id: projectId },
      data: updateData,
    });
    
    // Ghi audit log
    await logAudit({
      userId: user.id,
      functionCode: requiredFunction,
      action: `WORKFLOW_${action}`,
      resourceType: 'RESEARCH_PROJECT',
      resourceId: projectId,
      oldValue: { workflowStatus: currentStatus },
      newValue: { workflowStatus: newStatus, note },
      result: 'SUCCESS',
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
    });
    
    return NextResponse.json({
      success: true,
      message: `Chuyển trạng thái thành công: ${RESEARCH_STATUS_NAMES[newStatus]}`,
      data: updatedProject,
    });
    
  } catch (error) {
    console.error('Workflow transition error:', error);
    return NextResponse.json(
      { error: 'Lỗi hệ thống khi chuyển trạng thái' },
      { status: 500 }
    );
  }
}
