/**
 * M12 – Internal: Restore Job Callback
 * POST /api/internal/restore/report
 *
 * Nhận callback từ restore worker sau mỗi giai đoạn khôi phục.
 * Bảo vệ bằng CRON_SECRET — không expose public.
 *
 * Restore worker ví dụ:
 *   curl -X POST http://app/api/internal/restore/report \
 *     -H "Authorization: Bearer $CRON_SECRET" \
 *     -H "Content-Type: application/json" \
 *     -d '{"event":"completed","restoreJobId":"xxx","verificationStatus":"VERIFIED_OK"}'
 *
 * Events:
 *   started   → chuyển IN_PROGRESS
 *   completed → chuyển COMPLETED + ghi verificationStatus nếu có
 *   failed    → chuyển FAILED + errorMessage
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyCronSecret } from '@/lib/cron/verify-cron-secret';
import {
  updateRestoreJobStatus,
  verifyRestoreJob,
} from '@/lib/services/infrastructure/backup.service';

type RestoreEvent = 'started' | 'completed' | 'failed';

const VALID_VERIFY_STATUSES = new Set(['VERIFIED_OK', 'VERIFIED_PARTIAL', 'VERIFICATION_FAILED', 'NOT_VERIFIED']);

export async function POST(req: NextRequest) {
  if (!verifyCronSecret(req)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  let body: {
    event:              RestoreEvent;
    restoreJobId:       string;
    errorMessage?:      string;
    verificationStatus?: string;
    verificationNote?:  string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  const { event, restoreJobId } = body;

  if (!restoreJobId) {
    return NextResponse.json({ success: false, error: 'restoreJobId required' }, { status: 400 });
  }
  if (!['started', 'completed', 'failed'].includes(event)) {
    return NextResponse.json(
      { success: false, error: 'event must be started|completed|failed' },
      { status: 400 },
    );
  }

  try {
    if (event === 'started') {
      await updateRestoreJobStatus(restoreJobId, 'IN_PROGRESS');
      console.log(`[restore/report] started restoreJobId=${restoreJobId}`);
      return NextResponse.json({ success: true });
    }

    if (event === 'failed') {
      await updateRestoreJobStatus(restoreJobId, 'FAILED', body.errorMessage);
      console.log(`[restore/report] failed restoreJobId=${restoreJobId} error=${body.errorMessage ?? '(none)'}`);
      return NextResponse.json({ success: true });
    }

    // event === 'completed'
    await updateRestoreJobStatus(restoreJobId, 'COMPLETED');

    if (body.verificationStatus) {
      if (!VALID_VERIFY_STATUSES.has(body.verificationStatus)) {
        return NextResponse.json(
          {
            success: false,
            error:   'verificationStatus must be VERIFIED_OK|VERIFIED_PARTIAL|VERIFICATION_FAILED|NOT_VERIFIED',
          },
          { status: 400 },
        );
      }
      await verifyRestoreJob({
        restoreJobId,
        verificationStatus: body.verificationStatus as 'VERIFIED_OK' | 'VERIFIED_PARTIAL' | 'VERIFICATION_FAILED' | 'NOT_VERIFIED',
        verificationNote:   body.verificationNote,
      });
    }

    console.log(
      `[restore/report] completed restoreJobId=${restoreJobId} verification=${body.verificationStatus ?? 'not-set'}`,
    );
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[restore/report] handler error restoreJobId=${restoreJobId}:`, message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
