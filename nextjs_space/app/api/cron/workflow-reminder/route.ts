/**
 * M13 – Cron: Nhắc việc sắp đến hạn
 * POST /api/cron/workflow-reminder
 *
 * Quét tất cả WorkflowStepInstance đang READY/IN_PROGRESS có dueAt
 * trong khoảng [now, now + REMIND_BEFORE_HOURS] mà chưa được nhắc gần đây.
 *
 * Cron schedule: mỗi giờ
 * Vercel: { "path": "/api/cron/workflow-reminder", "schedule": "0 * * * *" }
 * Systemd/crontab: 0 * * * * curl -s -X POST -H "Authorization: Bearer $CRON_SECRET" .../api/cron/workflow-reminder
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { WorkflowNotificationService } from '@/lib/services/workflow/workflow-notification.service';
import { logSecurityEvent } from '@/lib/audit';
import { verifyCronSecret } from '@/lib/cron/verify-cron-secret';

export const dynamic = 'force-dynamic';

/** Nhắc trước bao nhiêu giờ khi sắp đến hạn */
const REMIND_BEFORE_HOURS = 24;

export async function POST(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    await logSecurityEvent({
      eventType: 'UNAUTHORIZED_ACCESS',
      severity: 'MEDIUM',
      ipAddress: request.headers.get('x-forwarded-for') ?? undefined,
      details: { endpoint: '/api/cron/workflow-reminder' },
    });
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  const windowEnd = new Date(now.getTime() + REMIND_BEFORE_HOURS * 60 * 60 * 1000);

  // Tìm steps sắp đến hạn, chưa quá hạn, còn đang xử lý
  const nearDueSteps = await prisma.workflowStepInstance.findMany({
    where: {
      status: { in: ['READY', 'IN_PROGRESS'] },
      assigneeId: { not: null },
      dueAt: { gte: now, lte: windowEnd },
    },
    include: {
      workflowInstance: { select: { title: true } },
    },
    take: 200, // giới hạn batch size
  });

  let reminded = 0;
  let skipped = 0;

  for (const step of nearDueSteps) {
    if (!step.assigneeId || !step.dueAt) { skipped++; continue; }

    // Kiểm tra đã gửi NEAR_DUE trong 2 giờ qua chưa (tránh spam)
    const recentNotif = await prisma.workflowNotification.findFirst({
      where: {
        workflowInstanceId: step.workflowInstanceId,
        recipientId: step.assigneeId,
        eventType: 'NEAR_DUE',
        createdAt: { gte: new Date(now.getTime() - 2 * 60 * 60 * 1000) },
      },
      select: { id: true },
    });
    if (recentNotif) { skipped++; continue; }

    const hoursLeft = Math.ceil((step.dueAt.getTime() - now.getTime()) / (60 * 60 * 1000));

    await WorkflowNotificationService.notifyNearDue({
      workflowInstanceId: step.workflowInstanceId,
      instanceTitle: step.workflowInstance.title,
      assigneeId: step.assigneeId,
      stepCode: step.stepCode,
      dueAt: step.dueAt,
      hoursLeft,
    });
    reminded++;
  }

  return NextResponse.json({
    success: true,
    data: { reminded, skipped, runAt: now.toISOString() },
  });
}
