/**
 * M13 – Thực hiện action tại bước hiện tại
 * POST /api/workflows/:id/actions
 *
 * Body: { actionCode, comment?, payloadJson? }
 * actionCode: APPROVE | REJECT | RETURN | CANCEL | COMMENT | SIGN | REASSIGN | ESCALATE
 *
 * Sau khi act thành công:
 *  - Gửi thông báo cho assignee bước tiếp (nếu có)
 *  - Gửi thông báo kết quả cho initiator nếu terminal
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireFunction, sessionToAuthUser } from '@/lib/rbac/middleware';
import { WORKFLOW } from '@/lib/rbac/function-codes';
import {
  WorkflowEngineService,
  WorkflowError,
} from '@/lib/services/workflow/workflow-engine.service';
import { WorkflowNotificationService } from '@/lib/services/workflow/workflow-notification.service';
import { SignatureService } from '@/lib/services/workflow/signature-adapter';
import { WorkflowActionCode, WorkflowInstanceStatus } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

const VALID_ACTION_CODES = new Set(Object.values(WorkflowActionCode));

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Phải parse body trước để biết actionCode, rồi mới check quyền đúng
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Request body không hợp lệ' }, { status: 400 });
  }

  const { actionCode, comment, payloadJson } = body as Record<string, unknown>;

  if (typeof actionCode !== 'string' || !VALID_ACTION_CODES.has(actionCode as WorkflowActionCode)) {
    return NextResponse.json(
      {
        success: false,
        error: `actionCode không hợp lệ. Giá trị hợp lệ: ${Array.from(VALID_ACTION_CODES).join(', ')}`,
      },
      { status: 400 }
    );
  }

  // Check quyền đúng theo actionCode: SIGN cần WF.SIGN, còn lại cần WF.ACT
  const requiredCode = actionCode === WorkflowActionCode.SIGN ? WORKFLOW.SIGN : WORKFLOW.ACT;
  const auth = await requireFunction(request, requiredCode);
  if (!auth.allowed) return auth.response!;

  try {
    const session = await getServerSession(authOptions);
    const actor = sessionToAuthUser(session)!;

    // Nếu action là SIGN, delegate sang SignatureService trước
    if (actionCode === WorkflowActionCode.SIGN) {
      return await handleSignAction(params.id, actor.id, payloadJson as Record<string, unknown> | undefined);
    }

    const result = await WorkflowEngineService.actOnWorkflow(
      {
        workflowInstanceId: params.id,
        actionCode: actionCode as WorkflowActionCode,
        comment: typeof comment === 'string' ? comment : undefined,
        payloadJson: payloadJson as Record<string, unknown> | undefined,
      },
      actor
    );

    // Gửi thông báo sau khi act thành công
    await sendPostActionNotifications(result, actor.id);

    return NextResponse.json({ success: true, data: result });
  } catch (err) {
    if (err instanceof WorkflowError) {
      const status = err.code === 'FORBIDDEN' ? 403
        : err.code === 'NOT_FOUND' ? 404
        : err.code === 'INVALID_TRANSITION' ? 422
        : err.code === 'COMMENT_REQUIRED' ? 422
        : err.code === 'INVALID_STATE' ? 409
        : 500;
      return NextResponse.json({ success: false, error: err.message, code: err.code }, { status });
    }
    console.error('[POST /api/workflows/:id/actions]', err);
    return NextResponse.json({ success: false, error: 'Lỗi khi thực hiện hành động' }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function handleSignAction(
  instanceId: string,
  signerId: string,
  payloadJson?: Record<string, unknown>
): Promise<NextResponse> {
  const instance = await prisma.workflowInstance.findUnique({
    where: { id: instanceId },
    select: { templateVersionId: true, currentStepCode: true },
  });
  if (!instance) {
    return NextResponse.json({ success: false, error: 'Workflow instance không tồn tại' }, { status: 404 });
  }

  // Kiểm tra step hiện tại có requiresSignature không
  const stepTemplate = instance.currentStepCode
    ? await prisma.workflowStepTemplate.findFirst({
        where: {
          templateVersionId: instance.templateVersionId,
          code: instance.currentStepCode,
        },
        select: { requiresSignature: true },
      })
    : null;

  if (!stepTemplate?.requiresSignature) {
    return NextResponse.json(
      { success: false, error: 'Bước hiện tại không yêu cầu ký số' },
      { status: 422 }
    );
  }

  const currentStep = await prisma.workflowStepInstance.findFirst({
    where: { workflowInstanceId: instanceId, stepCode: instance.currentStepCode ?? '' },
    orderBy: { assignedAt: 'desc' },
    select: { id: true },
  });
  if (!currentStep) {
    return NextResponse.json({ success: false, error: 'Không tìm thấy bước hiện tại' }, { status: 422 });
  }

  const signResult = await SignatureService.requestSign({
    workflowInstanceId: instanceId,
    stepInstanceId: currentStep.id,
    signerId,
    signatureType: (payloadJson?.signatureType as string) ?? 'STANDARD',
    providerCode: (payloadJson?.providerCode as string) ?? 'STUB',
    documentHash: (payloadJson?.documentHash as string) ?? instanceId,
    context: payloadJson,
  });

  const eventType = signResult.status === 'SIGNED' ? 'SIGN_SUCCESS' : 'SIGN_FAILED';
  await prisma.workflowNotification.create({
    data: {
      workflowInstanceId: instanceId,
      recipientId: signerId,
      channel: 'IN_APP',
      eventType,
      title: signResult.status === 'SIGNED' ? 'Ký số thành công' : 'Ký số thất bại',
      message: signResult.status === 'SIGNED'
        ? 'Chữ ký số đã được ghi nhận thành công.'
        : 'Ký số thất bại. Vui lòng thử lại.',
      status: 'SENT',
      sentAt: new Date(),
    },
  });

  return NextResponse.json({ success: true, data: signResult });
}

async function sendPostActionNotifications(
  result: {
    workflowInstanceId: string;
    newStatus: WorkflowInstanceStatus;
    currentStepCode: string | null;
  },
  actorId: string
) {
  const instance = await prisma.workflowInstance.findUnique({
    where: { id: result.workflowInstanceId },
    select: { initiatorId: true, title: true, currentAssigneeId: true },
  });
  if (!instance) return;

  const terminalMap: Partial<Record<WorkflowInstanceStatus, 'APPROVED' | 'REJECTED' | 'RETURNED' | 'CANCELLED'>> = {
    [WorkflowInstanceStatus.APPROVED]: 'APPROVED',
    [WorkflowInstanceStatus.REJECTED]: 'REJECTED',
    [WorkflowInstanceStatus.RETURNED]: 'RETURNED',
    [WorkflowInstanceStatus.CANCELLED]: 'CANCELLED',
  };

  const terminalEvent = terminalMap[result.newStatus];

  if (terminalEvent) {
    // Thông báo kết quả cho initiator (không báo lại nếu chính mình approve)
    if (instance.initiatorId !== actorId) {
      await WorkflowNotificationService.notifyInitiator({
        workflowInstanceId: result.workflowInstanceId,
        instanceTitle: instance.title,
        initiatorId: instance.initiatorId,
        eventType: terminalEvent,
      });
    }
  } else if (result.currentStepCode && instance.currentAssigneeId) {
    // Workflow vẫn IN_PROGRESS — thông báo cho assignee bước mới
    await WorkflowNotificationService.notifyNewTask({
      workflowInstanceId: result.workflowInstanceId,
      instanceTitle: instance.title,
      assigneeId: instance.currentAssigneeId,
      stepName: result.currentStepCode,
    });
  }
}
