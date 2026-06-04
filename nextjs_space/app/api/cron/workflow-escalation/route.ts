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
import { logSecurityEvent } from '@/lib/audit';
import { verifyCronSecret } from '@/lib/cron/verify-cron-secret';
import { workflowEscalationWorker } from '@/lib/workers/workflow-escalation-worker';

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

  const result = await workflowEscalationWorker.processExpiredSteps(100);

  return NextResponse.json({ success: true, data: result });
}
