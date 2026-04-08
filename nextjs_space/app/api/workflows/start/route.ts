/**
 * M13 – Khởi tạo workflow instance
 * POST /api/workflows/start
 *
 * Module nghiệp vụ gọi endpoint này để bắt đầu một quy trình phê duyệt.
 * Truyền templateCode, entityType, entityId, title.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireFunction, sessionToAuthUser } from '@/lib/rbac/middleware';
import { WORKFLOW } from '@/lib/rbac/function-codes';
import { WorkflowEngineService, WorkflowError } from '@/lib/services/workflow/workflow-engine.service';
import { WorkflowNotificationService, WF_EVENT } from '@/lib/services/workflow/workflow-notification.service';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const auth = await requireFunction(request, WORKFLOW.INITIATE);
  if (!auth.allowed) return auth.response!;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Request body không hợp lệ' }, { status: 400 });
  }

  const { templateCode, entityType, entityId, title, summary, priority } =
    body as Record<string, unknown>;

  if (
    typeof templateCode !== 'string' || !templateCode.trim() ||
    typeof entityType !== 'string' || !entityType.trim() ||
    typeof entityId !== 'string' || !entityId.trim() ||
    typeof title !== 'string' || !title.trim()
  ) {
    return NextResponse.json(
      { success: false, error: 'templateCode, entityType, entityId, title là bắt buộc' },
      { status: 400 }
    );
  }

  try {
    const session = await getServerSession(authOptions);
    const actor = sessionToAuthUser(session)!;

    const result = await WorkflowEngineService.startWorkflow(
      {
        templateCode: templateCode.trim(),
        entityType: entityType.trim(),
        entityId: entityId.trim(),
        title: title.trim(),
        summary: typeof summary === 'string' ? summary : undefined,
        priority: typeof priority === 'number' ? priority : 0,
      },
      actor
    );

    // Lấy thông tin instance để gửi thông báo (assigneeId có thể null Phase 1)
    const instance = await prisma.workflowInstance.findUnique({
      where: { id: result.workflowInstanceId },
      select: { currentAssigneeId: true, currentStepCode: true, title: true },
    });

    // Gửi thông báo cho assignee nếu đã có
    if (instance?.currentAssigneeId) {
      await WorkflowNotificationService.notifyNewTask({
        workflowInstanceId: result.workflowInstanceId,
        instanceTitle: instance.title,
        assigneeId: instance.currentAssigneeId,
        stepName: instance.currentStepCode ?? 'bước đầu',
      });
    }

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (err) {
    if (err instanceof WorkflowError) {
      const status = err.code === 'FORBIDDEN' ? 403
        : err.code === 'NOT_FOUND' ? 404
        : err.code === 'TEMPLATE_NOT_PUBLISHED' ? 409
        : 422;
      return NextResponse.json({ success: false, error: err.message }, { status });
    }
    console.error('[POST /api/workflows/start]', err);
    return NextResponse.json({ success: false, error: 'Lỗi khi khởi tạo quy trình' }, { status: 500 });
  }
}
