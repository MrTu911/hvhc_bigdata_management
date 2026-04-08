/**
 * M03 – UC-63: Cron — Party Probation Deadline Automation
 * POST /api/cron/party-probation-check
 *
 * Quét toàn bộ đảng viên dự bị (DU_BI), sinh alert sắp đến hạn (≤30 ngày)
 * và alert quá hạn (< 0 ngày) chuyển chính thức 12 tháng.
 *
 * Bảo vệ bằng secret header:
 *   Authorization: Bearer <CRON_SECRET>
 *
 * Cấu hình crontab (mỗi ngày lúc 7h sáng):
 *   0 7 * * * curl -s -X POST \
 *     -H "Authorization: Bearer $CRON_SECRET" \
 *     http://localhost:3000/api/cron/party-probation-check
 *
 * Hoặc trong vercel.json:
 *   { "crons": [{ "path": "/api/cron/party-probation-check", "schedule": "0 7 * * *" }] }
 */

import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { runProbationDeadlineAutomation } from '@/lib/services/party/party-lifecycle.service';
import { logSecurityEvent } from '@/lib/audit';

export async function POST(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json(
      { success: false, error: 'CRON_SECRET chưa được cấu hình' },
      { status: 503 },
    );
  }

  const authHeader = request.headers.get('authorization');
  const providedSecret = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7)
    : request.nextUrl.searchParams.get('secret');

  if (providedSecret !== cronSecret) {
    await logSecurityEvent({
      eventType: 'UNAUTHORIZED_ACCESS',
      severity: 'HIGH',
      ipAddress: request.headers.get('x-forwarded-for') ?? undefined,
      details: {
        endpoint: '/api/cron/party-probation-check',
        reason: 'Invalid CRON_SECRET',
      },
    });
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await db.$transaction((tx) =>
      runProbationDeadlineAutomation(tx, 'SYSTEM_CRON'),
    );

    return NextResponse.json({
      success: true,
      ...result,
      runAt: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 },
    );
  }
}
