/**
 * M07 – Cron: Cập nhật FacultyEIS.researchScore khi có công bố mới được PUBLISHED
 * POST /api/cron/eis-research-score
 *
 * Quét các NckhPublication có status=PUBLISHED cập nhật trong 25 giờ qua
 * (25h để có overlap giữa các lần chạy hàng ngày), tìm giảng viên tương ứng
 * và trigger calculateAndSaveEIS cho học kỳ hiện tại.
 *
 * Cron schedule: mỗi ngày lúc 02:00
 * Vercel:    { "path": "/api/cron/eis-research-score", "schedule": "0 2 * * *" }
 * Crontab:   0 2 * * * curl -s -X POST -H "Authorization: Bearer $CRON_SECRET" .../api/cron/eis-research-score
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyCronSecret } from '@/lib/cron/verify-cron-secret';
import { recalculateEISForRecentPublications } from '@/lib/services/science/eis-publication-hook.service';

export const dynamic = 'force-dynamic';

/** Số giờ lookback (overlap để không bỏ sót khi cron lệch nhẹ) */
const LOOKBACK_HOURS = 25;

export async function POST(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const since = new Date(Date.now() - LOOKBACK_HOURS * 60 * 60 * 1000);

  try {
    const result = await recalculateEISForRecentPublications(since);

    console.info('[CRON eis-research-score]', {
      since: since.toISOString(),
      ...result,
    });

    return NextResponse.json({ success: true, data: result });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[CRON eis-research-score] fatal:', err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
