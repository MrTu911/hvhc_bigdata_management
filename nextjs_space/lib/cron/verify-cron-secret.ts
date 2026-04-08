/**
 * Helper dùng chung cho tất cả cron endpoints.
 *
 * Nếu CRON_SECRET không được set, cron sẽ bị block và in warning rõ ràng
 * thay vì silent-fail. Điều này bảo vệ khỏi việc SLA/reminder không chạy
 * mà không ai biết.
 */

import { NextRequest } from 'next/server';

export function verifyCronSecret(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error(
      '[CRON] CRON_SECRET chưa được cấu hình trong environment variables. ' +
      'Tất cả cron jobs sẽ bị từ chối. Vui lòng set CRON_SECRET trong .env.'
    );
    return false;
  }

  const authHeader = request.headers.get('authorization');
  const provided = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7)
    : request.nextUrl.searchParams.get('secret');

  return provided === cronSecret;
}
