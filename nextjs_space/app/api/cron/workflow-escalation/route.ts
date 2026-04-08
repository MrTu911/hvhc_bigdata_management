/**
 * M13 – Cron: Leo thang khi bước bị treo quá lâu
 * POST /api/cron/workflow-escalation
 *
 * Quét WorkflowStepInstance đang EXPIRED mà chưa có WorkflowEscalation.
 * Tạo WorkflowEscalation + thông báo cho initiator (lãnh đạo sẽ thấy trong dashboard).
 *
 * Cron schedule: mỗi 6 giờ
 * Vercel: schedule "0 star-slash-6 * * *" (every 6 hours)
 *
 * Nguyên tắc:
 *  - Escalation KHÔNG tự thay đổi dữ liệu nghiệp vụ gốc
 *  - Chỉ tạo bản ghi WorkflowEscalation + thông báo
 *  - Phase 2 sẽ thêm "escalate to supervisor" theo M02 org chart
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { WorkflowNotificationService, WF_EVENT } from '@/lib/services/workflow/workflow-notification.service';
import { logSecurityEvent } from '@/lib/audit';
import { verifyCronSecret } from '@/lib/cron/verify-cron-secret';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    await logSecurityEvent({
      eventType: 'UNAUTHORIZED_ACCESS',
      severity: 'MEDIUM',
      ipAddress: request.headers.get('x-forwarded-for') ?? undefined,
      details: { endpoint: '/api/cron/workflow-escalation' },
    });
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();

  // Tìm instances còn đang chạy nhưng có step EXPIRED chưa được escalate
  const expiredSteps = await prisma.workflowStepInstance.findMany({
    where: {
      status: 'EXPIRED',
      // Chưa có escalation cho step này
      workflowInstance: {
        status: { in: ['PENDING', 'IN_PROGRESS'] },
      },
    },
    include: {
      workflowInstance: { select: { id: true, title: true, initiatorId: true } },
      // Check escalations via raw query để tránh relation phức tạp Phase 1
    },
    take: 100,
  });

  let escalated = 0;
  let alreadyEscalated = 0;

  for (const step of expiredSteps) {
    // Kiểm tra đã có escalation cho step này chưa
    const existingEscalation = await prisma.workflowEscalation.findFirst({
      where: {
        workflowInstanceId: step.workflowInstanceId,
        stepInstanceId: step.id,
        escalatedBy: 'SYSTEM',
      },
      select: { id: true },
    });

    if (existingEscalation) {
      alreadyEscalated++;
      continue;
    }

    // Tạo escalation record
    await prisma.workflowEscalation.create({
      data: {
        workflowInstanceId: step.workflowInstanceId,
        stepInstanceId: step.id,
        escalatedBy: 'SYSTEM',
        reason: `Bước "${step.stepCode}" đã EXPIRED, chưa có người xử lý leo thang`,
      },
    });

    // Thông báo cho initiator (Phase 2 sẽ thêm supervisor theo M02)
    await WorkflowNotificationService.send({
      workflowInstanceId: step.workflowInstanceId,
      recipientId: step.workflowInstance.initiatorId,
      eventType: WF_EVENT.ESCALATED,
      title: 'Quy trình cần chú ý',
      message: `Bước "${step.stepCode}" trong quy trình "${step.workflowInstance.title}" đã quá hạn và cần được xử lý hoặc leo thang.`,
      payloadJson: { stepCode: step.stepCode, stepInstanceId: step.id },
    });

    escalated++;
  }

  return NextResponse.json({
    success: true,
    data: {
      escalated,
      alreadyEscalated,
      runAt: now.toISOString(),
    },
  });
}
