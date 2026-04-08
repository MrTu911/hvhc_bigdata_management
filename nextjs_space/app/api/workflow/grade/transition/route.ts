/**
 * @deprecated LEGACY WORKFLOW — Chưa migrate sang M13 engine.
 * Route này vẫn được giữ để không phá module cũ.
 * Mục tiêu: migrate sang /api/workflows/* sau khi module nghiệp vụ dùng M13 engine.
 * Xem: docs/design/module-m13-overview.md và migration plan.
 */
/**
 * API Workflow Transition cho Điểm học tập (A3.1)
 * DRAFT → SUBMITTED → APPROVED / REJECTED
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireFunction } from '@/lib/rbac/middleware';
import { FUNCTION_CODES } from '@/lib/rbac/function-codes';
import { logAudit } from '@/lib/audit';
import { canTransitionGrade, GRADE_STATUS_NAMES } from '@/lib/workflow';
import { GradeWorkflowStatus } from '@prisma/client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { gradeId, action, note } = body;
    
    if (!gradeId || !action) {
      return NextResponse.json(
        { error: 'Thiếu thông tin: gradeId, action' },
        { status: 400 }
      );
    }
    
    // Lấy thông tin điểm hiện tại
    const grade = await prisma.ketQuaHocTap.findUnique({
      where: { id: gradeId },
      include: { hocVien: true },
    });
    
    if (!grade) {
      return NextResponse.json(
        { error: 'Không tìm thấy kết quả học tập' },
        { status: 404 }
      );
    }
    
    // Xác định trạng thái mới và quyền cần thiết
    let newStatus: GradeWorkflowStatus;
    let requiredFunction: string;
    
    switch (action) {
      case 'SUBMIT':
        newStatus = 'SUBMITTED';
        requiredFunction = FUNCTION_CODES.TRAINING.SUBMIT_GRADE;
        break;
      case 'APPROVE':
        newStatus = 'APPROVED';
        requiredFunction = FUNCTION_CODES.TRAINING.APPROVE_GRADE;
        break;
      case 'REJECT':
        newStatus = 'REJECTED';
        requiredFunction = FUNCTION_CODES.TRAINING.APPROVE_GRADE;
        break;
      case 'RESUBMIT':
        newStatus = 'SUBMITTED';
        requiredFunction = FUNCTION_CODES.TRAINING.SUBMIT_GRADE;
        break;
      default:
        return NextResponse.json(
          { error: 'Action không hợp lệ' },
          { status: 400 }
        );
    }
    
    // Kiểm tra quyền
    const authResult = await requireFunction(request, requiredFunction, {
      resourceId: gradeId,
    });
    
    if (!authResult.allowed) {
      return NextResponse.json(
        { error: authResult.response ? "Không có quyền" : "Lỗi xác thực" || 'Không có quyền thực hiện' },
        { status: 403 }
      );
    }
    
    const user = authResult.user!;
    
    // Kiểm tra transition hợp lệ
    const currentStatus = grade.workflowStatus as GradeWorkflowStatus;
    if (!canTransitionGrade(currentStatus, newStatus)) {
      return NextResponse.json(
        { 
          error: `Không thể chuyển từ "${GRADE_STATUS_NAMES[currentStatus]}" sang "${GRADE_STATUS_NAMES[newStatus]}"` 
        },
        { status: 400 }
      );
    }
    
    // Cập nhật trạng thái
    const updateData: Record<string, unknown> = {
      workflowStatus: newStatus,
    };
    
    if (action === 'SUBMIT' || action === 'RESUBMIT') {
      updateData.submittedAt = new Date();
      updateData.submittedBy = user.id;
    } else if (action === 'APPROVE') {
      updateData.approvedAt = new Date();
      updateData.approvedBy = user.id;
    } else if (action === 'REJECT') {
      updateData.rejectReason = note || 'Không đạt yêu cầu';
    }
    
    const updatedGrade = await prisma.ketQuaHocTap.update({
      where: { id: gradeId },
      data: updateData,
    });
    
    // Ghi audit log
    await logAudit({
      userId: user.id,
      functionCode: requiredFunction,
      action: `WORKFLOW_${action}`,
      resourceType: 'GRADE',
      resourceId: gradeId,
      oldValue: { workflowStatus: currentStatus },
      newValue: { workflowStatus: newStatus, note },
      result: 'SUCCESS',
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
    });
    
    return NextResponse.json({
      success: true,
      message: `Chuyển trạng thái thành công: ${GRADE_STATUS_NAMES[newStatus]}`,
      data: updatedGrade,
    });
    
  } catch (error) {
    console.error('Workflow transition error:', error);
    return NextResponse.json(
      { error: 'Lỗi hệ thống khi chuyển trạng thái' },
      { status: 500 }
    );
  }
}
