/**
 * M12 – Cron: Infrastructure Health Check
 * GET /api/cron/infra-health-check
 *
 * Probe PostgreSQL connections, Redis memory, MinIO connectivity và backup age.
 * Tự động raise ServiceAlert khi metric vượt ngưỡng.
 * Tự động resolve alert khi metric trở về OK.
 * Cập nhật BigDataService.status từ kết quả probe.
 *
 * Bảo vệ bằng CRON_SECRET — không expose ra public.
 *
 * Crontab (mỗi 5 phút):
 *   0/5 * * * * curl -s -H "Authorization: Bearer $CRON_SECRET" \
 *     http://localhost:3000/api/cron/infra-health-check
 *
 * Vercel cron (vercel.json):
 *   { "path": "/api/cron/infra-health-check", "schedule": "0/5 * * * *" }
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyCronSecret } from '@/lib/cron/verify-cron-secret';
import { runHealthCheckWithAlerts } from '@/lib/services/infrastructure/health.service';

export async function GET(req: NextRequest) {
  if (!verifyCronSecret(req)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const startedAt = Date.now();

  try {
    const { snapshot, alertActions, serviceUpdates } = await runHealthCheckWithAlerts();

    const raised   = alertActions.filter((a) => a.action === 'raised').length;
    const resolved = alertActions.filter((a) => a.action === 'resolved').length;

    console.log(
      `[infra-health-check] overall=${snapshot.overall} ` +
      `raised=${raised} resolved=${resolved} ` +
      `durationMs=${Date.now() - startedAt}`,
    );

    return NextResponse.json({
      success: true,
      runAt:          snapshot.checkedAt,
      overall:        snapshot.overall,
      durationMs:     Date.now() - startedAt,
      alertsRaised:   raised,
      alertsResolved: resolved,
      serviceUpdates,
      metrics: snapshot.metrics.map((m) => ({
        name:  m.metricName,
        value: m.value,
        unit:  m.unit,
        level: m.level,
      })),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[infra-health-check] failed:', message);
    return NextResponse.json(
      { success: false, error: message, runAt: new Date().toISOString() },
      { status: 500 },
    );
  }
}
