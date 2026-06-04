/**
 * Workflow Escalation Worker — M13
 *
 * Logic tách khỏi cron route để có thể unit test.
 * Route gọi worker; worker không import NextRequest/NextResponse.
 */

import prisma from '@/lib/db';
import { WorkflowNotificationService, WF_EVENT } from '@/lib/services/workflow/workflow-notification.service';

export interface EscalationRunResult {
  escalated: number;
  alreadyEscalated: number;
  errors: { stepId: string; message: string }[];
  runAt: string;
}

export class WorkflowEscalationWorker {
  /**
   * Quét WorkflowStepInstance EXPIRED chưa có escalation, tạo WorkflowEscalation + thông báo.
   * Idempotent: bỏ qua step đã có escalation SYSTEM trước đó.
   * @param limit Số bản ghi xử lý tối đa mỗi lần chạy (mặc định 100)
   */
  async processExpiredSteps(limit = 100): Promise<EscalationRunResult> {
    const safeLimit = Math.min(limit, 100);
    const runAt = new Date().toISOString();
    const result: EscalationRunResult = {
      escalated: 0,
      alreadyEscalated: 0,
      errors: [],
      runAt,
    };

    const expiredSteps = await prisma.workflowStepInstance.findMany({
      where: {
        status: 'EXPIRED',
        workflowInstance: {
          status: { in: ['PENDING', 'IN_PROGRESS'] },
        },
      },
      include: {
        workflowInstance: { select: { id: true, title: true, initiatorId: true } },
      },
      take: safeLimit,
    });

    for (const step of expiredSteps) {
      try {
        const existingEscalation = await prisma.workflowEscalation.findFirst({
          where: {
            workflowInstanceId: step.workflowInstanceId,
            stepInstanceId: step.id,
            escalatedBy: 'SYSTEM',
          },
          select: { id: true },
        });

        if (existingEscalation) {
          result.alreadyEscalated++;
          continue;
        }

        await prisma.workflowEscalation.create({
          data: {
            workflowInstanceId: step.workflowInstanceId,
            stepInstanceId: step.id,
            escalatedBy: 'SYSTEM',
            reason: `Bước "${step.stepCode}" đã EXPIRED, chưa có người xử lý leo thang`,
          },
        });

        await WorkflowNotificationService.send({
          workflowInstanceId: step.workflowInstanceId,
          recipientId: step.workflowInstance.initiatorId,
          eventType: WF_EVENT.ESCALATED,
          title: 'Quy trình cần chú ý',
          message: `Bước "${step.stepCode}" trong quy trình "${step.workflowInstance.title}" đã quá hạn.`,
          payloadJson: { stepCode: step.stepCode, stepInstanceId: step.id },
        });

        result.escalated++;
      } catch (err: any) {
        result.errors.push({ stepId: step.id, message: err.message ?? String(err) });
      }
    }

    return result;
  }

  /**
   * Phase 2: tìm supervisor theo M02 org chart.
   * Hiện tại placeholder — trả về null nếu không tìm được.
   */
  async getEscalationSupervisor(userId: string): Promise<string | null> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { unitId: true },
    });
    if (!user?.unitId) return null;

    const unit = await prisma.unit.findUnique({
      where: { id: user.unitId },
      select: { commanderId: true },
    });

    return unit?.commanderId ?? null;
  }
}

// Singleton instance
export const workflowEscalationWorker = new WorkflowEscalationWorker();
