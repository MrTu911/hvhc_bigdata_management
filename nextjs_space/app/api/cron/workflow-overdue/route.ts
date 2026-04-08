/**
 * M13 – Cron: Đánh dấu quá hạn và thông báo
 * POST /api/cron/workflow-overdue
 *
 * Quét WorkflowStepInstance đang READY/IN_PROGRESS có dueAt < now.
 * Update status → EXPIRED, thông báo assignee, ghi audit.
 *
 * Cron schedule: mỗi giờ (lệch 30 phút so với reminder)
 * Vercel: { "path": "/api/cron/workflow-overdue", "schedule": "30 * * * *" }
 *
 * Nguyên tắc: KHÔNG tự approve/reject khi timeout — chỉ đánh dấu EXPIRED + notify.
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { WorkflowNotificationService } from '@/lib/services/workflow/workflow-notification.service';
import { logSecurityEvent } from '@/lib/audit';
import { verifyCronSecret } from '@/lib/cron/verify-cron-secret';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    await logSecurityEvent({
      eventType: 'UNAUTHORIZED_ACCESS',
      severity: 'MEDIUM',
      ipAddress: request.headers.get('x-forwarded-for') ?? undefined,
      details: { endpoint: '/api/cron/workflow-overdue' },
    });
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();

  const overdueSteps = await prisma.workflowStepInstance.findMany({
    where: {
      status: { in: ['READY', 'IN_PROGRESS'] },
      dueAt: { lt: now },
    },
    include: {
      workflowInstance: { select: { title: true, status: true } },
    },
    take: 200,
  });

  let processed = 0;
  let skipped = 0;

  for (const step of overdueSteps) {
    // Không xử lý nếu workflow đã ở trạng thái terminal
    const terminalStatuses = ['APPROVED', 'REJECTED', 'CANCELLED', 'EXPIRED', 'FAILED'];
    if (terminalStatuses.includes(step.workflowInstance.status)) {
      skipped++;
      continue;
    }

    await prisma.$transaction(async (tx) => {
      // Mark step EXPIRED
      await tx.workflowStepInstance.update({
        where: { id: step.id },
        data: { status: 'EXPIRED', completedAt: now },
      });

      // Ghi action SYSTEM_TIMEOUT
      await tx.workflowAction.create({
        data: {
          workflowInstanceId: step.workflowInstanceId,
          stepInstanceId: step.id,
          actionCode: 'SYSTEM_TIMEOUT',
          actionBy: 'SYSTEM',
          comment: `Bước quá hạn tự động: ${now.toISOString()}`,
        },
      });

      // Ghi audit
      await tx.workflowAuditLog.create({
        data: {
          workflowInstanceId: step.workflowInstanceId,
          action: 'SYSTEM_TIMEOUT',
          performedBy: 'SYSTEM',
          fromStatus: step.status,
          toStatus: 'EXPIRED',
          comment: `Bước "${step.stepCode}" quá hạn`,
        },
      });
    });

    // Gửi thông báo cho assignee nếu có
    if (step.assigneeId && step.dueAt) {
      await WorkflowNotificationService.notifyOverdue({
        workflowInstanceId: step.workflowInstanceId,
        instanceTitle: step.workflowInstance.title,
        assigneeId: step.assigneeId,
        stepCode: step.stepCode,
        dueAt: step.dueAt,
      });
    }

    processed++;
  }

  return NextResponse.json({
    success: true,
    data: { processed, skipped, runAt: now.toISOString() },
  });
}
