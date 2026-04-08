/**
 * API: Policy Request Workflow
 * POST /api/policy/requests/[id]/workflow - Transition workflow state
 * Actions: SUBMIT, APPROVE, REJECT, CANCEL, REVIEW
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import { POLICY } from '@/lib/rbac/function-codes';
import { requireFunction } from '@/lib/rbac/middleware';
import { logAudit } from '@/lib/audit';
import { PolicyRequestStatus, PolicyWorkflowAction } from '@prisma/client';

type ActionType = 'SUBMIT' | 'APPROVE' | 'REJECT' | 'CANCEL' | 'REVIEW';

const VALID_TRANSITIONS: Record<string, { actions: ActionType[]; nextStatus: Record<string, PolicyRequestStatus> }> = {
  DRAFT: {
    actions: ['SUBMIT'],
    nextStatus: {
      SUBMIT: PolicyRequestStatus.SUBMITTED,
    },
  },
  SUBMITTED: {
    actions: ['APPROVE', 'REJECT', 'REVIEW'],
    nextStatus: {
      APPROVE: PolicyRequestStatus.APPROVED,
      REJECT: PolicyRequestStatus.REJECTED,
      REVIEW: PolicyRequestStatus.DRAFT,
    },
  },
  UNDER_REVIEW: {
    actions: ['APPROVE', 'REJECT', 'REVIEW'],
    nextStatus: {
      APPROVE: PolicyRequestStatus.APPROVED,
      REJECT: PolicyRequestStatus.REJECTED,
      REVIEW: PolicyRequestStatus.DRAFT,
    },
  },
  APPROVED: {
    actions: ['CANCEL'],
    nextStatus: {
      CANCEL: PolicyRequestStatus.CANCELLED,
    },
  },
};

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, note } = body;

    if (!action) {
      return NextResponse.json({ error: 'Action là bắt buộc' }, { status: 400 });
    }

    // Get existing request
    const existingRequest = await prisma.policyRequest.findUnique({
      where: { id: params.id },
      include: { category: true },
    });

    if (!existingRequest || existingRequest.deletedAt) {
      return NextResponse.json({ error: 'Không tìm thấy hồ sơ' }, { status: 404 });
    }

    const currentStatus = existingRequest.status;
    const transitions = VALID_TRANSITIONS[currentStatus];

    if (!transitions) {
      return NextResponse.json(
        { error: `Không thể thực hiện thao tác từ trạng thái ${currentStatus}` },
        { status: 400 }
      );
    }

    const actionStr = action as ActionType;
    if (!transitions.actions.includes(actionStr)) {
      return NextResponse.json(
        { error: `Thao tác ${action} không hợp lệ cho trạng thái ${currentStatus}` },
        { status: 400 }
      );
    }

    // Check permissions
    let requiredFunction: string = POLICY.VIEW;
    if (actionStr === 'SUBMIT') {
      // Owner can submit
      if (existingRequest.requesterId !== session.user.id) {
        return NextResponse.json(
          { error: 'Chỉ người tạo mới có thể gửi yêu cầu' },
          { status: 403 }
        );
      }
    } else if (actionStr === 'APPROVE' || actionStr === 'REJECT' || actionStr === 'REVIEW') {
      requiredFunction = POLICY.APPROVE;
      const authResult = await requireFunction(request, requiredFunction);
      if (!authResult.allowed) {
        return authResult.response;
      }
    } else if (actionStr === 'CANCEL') {
      // Owner or admin can cancel
      if (existingRequest.requesterId !== session.user.id) {
        const authResult = await requireFunction(request, POLICY.APPROVE);
        if (!authResult.allowed) {
          return NextResponse.json(
            { error: 'Không có quyền hủy yêu cầu của người khác' },
            { status: 403 }
          );
        }
      }
    }

    // Reject requires note
    if (actionStr === 'REJECT' && !note?.trim()) {
      return NextResponse.json(
        { error: 'Vui lòng nhập lý do từ chối' },
        { status: 400 }
      );
    }

    const nextStatus = transitions.nextStatus[actionStr];

    // Update request
    const updatedRequest = await prisma.$transaction(async (tx) => {
      const updateData: any = {
        status: nextStatus,
      };

      // Set workflow dates
      if (actionStr === 'SUBMIT') {
        updateData.submittedAt = new Date();
        updateData.submittedBy = session.user.id;
      } else if (actionStr === 'APPROVE') {
        updateData.approvedAt = new Date();
        updateData.approvedBy = session.user.id;
        updateData.approverNote = note || null;
      } else if (actionStr === 'REJECT') {
        updateData.rejectedAt = new Date();
        updateData.rejectedBy = session.user.id;
        updateData.rejectReason = note;
      } else if (actionStr === 'REVIEW') {
        updateData.reviewedAt = new Date();
        updateData.reviewedBy = session.user.id;
        updateData.reviewerNote = note || null;
      }

      const updated = await tx.policyRequest.update({
        where: { id: params.id },
        data: updateData,
        include: {
          requester: { select: { id: true, name: true, email: true } },
          category: { select: { id: true, code: true, name: true } },
        },
      });

      // Map action string to PolicyWorkflowAction enum
      const actionEnumMap: Record<ActionType, PolicyWorkflowAction> = {
        SUBMIT: 'SUBMIT' as PolicyWorkflowAction,
        APPROVE: 'APPROVE' as PolicyWorkflowAction,
        REJECT: 'REJECT' as PolicyWorkflowAction,
        CANCEL: 'CANCEL' as PolicyWorkflowAction,
        REVIEW: 'REVIEW' as PolicyWorkflowAction,
      };

      // Create workflow log
      await tx.policyWorkflowLog.create({
        data: {
          requestId: params.id,
          action: actionEnumMap[actionStr],
          fromStatus: currentStatus as PolicyRequestStatus,
          toStatus: nextStatus,
          performedBy: session.user.id,
          performerName: session.user.name || undefined,
          note: note || null,
        },
      });

      return updated;
    });

    // Log audit
    await logAudit({
      userId: session.user.id,
      functionCode: requiredFunction,
      action: action,
      resourceType: 'POLICY_REQUEST',
      resourceId: params.id,
      oldValue: JSON.stringify({ status: currentStatus }),
      newValue: JSON.stringify({ status: nextStatus }),
      result: 'SUCCESS',
    });

    return NextResponse.json({
      success: true,
      request: updatedRequest,
      message: `Thực hiện ${action} thành công`,
    });
  } catch (error) {
    console.error('Error processing workflow:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
