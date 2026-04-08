/**
 * M01 – UC-06: Cron — Expire Old Sessions
 * GET /api/cron/expire-sessions
 *
 * Đánh dấu hết hạn các AuthSession đã quá expiresAt.
 * Phải được gọi định kỳ bởi hệ thống cron ngoài (ví dụ: crontab, Vercel Cron).
 *
 * Bảo vệ bằng secret header để tránh gọi công khai:
 *   Authorization: Bearer <CRON_SECRET>
 *
 * Cấu hình crontab (mỗi 1 giờ):
 *   0 * * * * curl -s -H "Authorization: Bearer $CRON_SECRET" \
 *     http://localhost:3000/api/cron/expire-sessions
 *
 * Hoặc trong vercel.json:
 *   { "crons": [{ "path": "/api/cron/expire-sessions", "schedule": "0 * * * *" }] }
 *   (kèm CRON_SECRET verification qua header hoặc query param)
 */

import { NextRequest, NextResponse } from 'next/server';
import { expireOldSessions } from '@/lib/services/auth/auth-session.service';
import { logSecurityEvent } from '@/lib/audit';

export async function GET(request: NextRequest) {
  // Verify cron secret
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    // Nếu chưa cấu hình CRON_SECRET, từ chối toàn bộ để tránh expose
    return NextResponse.json({ success: false, error: 'CRON_SECRET chưa được cấu hình' }, { status: 503 });
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
        endpoint: '/api/cron/expire-sessions',
        reason: 'Invalid CRON_SECRET',
      },
    });
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const count = await expireOldSessions();

  return NextResponse.json({
    success: true,
    expiredCount: count,
    runAt: new Date().toISOString(),
  });
}
