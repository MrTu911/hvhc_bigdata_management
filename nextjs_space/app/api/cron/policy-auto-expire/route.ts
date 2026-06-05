/**
 * POST /api/cron/policy-auto-expire
 * Cron job: tự động chuyển PolicyRecord đã hết hạn expiryDate sang EXPIRED.
 * Idempotent — an toàn khi chạy nhiều lần.
 * Requires: CRON_SECRET
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyCronSecret } from '@/lib/cron/verify-cron-secret';
import { expireOverduePolicyRecords } from '@/lib/services/policy-calculation.service';
import { createLogger } from '@/lib/logger';

const logger = createLogger('CronPolicyAutoExpire');

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  if (!verifyCronSecret(req)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    logger.info('Policy auto-expire cron triggered');
    const expired = await expireOverduePolicyRecords();
    logger.info(`Policy auto-expire completed: ${expired} records expired`);
    return NextResponse.json({ success: true, data: { expired }, error: null });
  } catch (error) {
    logger.error(
      'Policy auto-expire cron failed',
      error instanceof Error ? error : new Error(String(error)),
    );
    return NextResponse.json({ success: false, data: null, error: 'Cron failed' }, { status: 500 });
  }
}
