/**
 * POST /api/cron/graduation-batch-trigger
 * Cron job: tự động chạy batch graduation audit cho học viên ACTIVE.
 * Chạy theo lịch — thường vào cuối kỳ học.
 * Requires: CRON_SECRET header hoặc ?secret= query param.
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyCronSecret } from '@/lib/cron/verify-cron-secret';
import { batchRunGraduation } from '@/lib/services/education/graduation-batch.service';
import { createLogger } from '@/lib/logger';

const logger = createLogger('CronGraduationBatch');

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  if (!verifyCronSecret(req)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const khoaHoc = searchParams.get('khoaHoc') ?? undefined;
    const unitId  = searchParams.get('unitId')  ?? undefined;

    logger.info('Graduation batch cron triggered', { khoaHoc, unitId });

    const result = await batchRunGraduation({ khoaHoc, unitId, limit: 50 });

    logger.info('Graduation batch cron completed', result);

    return NextResponse.json({ success: true, data: result, error: null });
  } catch (error: any) {
    logger.error('Graduation batch cron failed', { error: error.message });
    return NextResponse.json({ success: false, data: null, error: 'Cron failed' }, { status: 500 });
  }
}
