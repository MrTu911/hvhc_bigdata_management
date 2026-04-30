/**
 * M12 – Internal: Pipeline Run Callback
 * POST /api/internal/pipeline/report
 *
 * Nhận kết quả từ Airflow DAG (hoặc ETL worker) sau khi chạy xong.
 * Airflow gọi endpoint này qua PythonOperator hoặc HttpSensor cuối DAG.
 *
 * Bảo vệ bằng CRON_SECRET (Bearer token) — không expose ra public.
 *
 * Airflow DAG ví dụ:
 *   callback = SimpleHttpOperator(
 *     task_id='callback_to_app',
 *     http_conn_id='hvhc_app',
 *     endpoint='/api/internal/pipeline/report',
 *     method='POST',
 *     headers={'Authorization': 'Bearer {{ var.value.HVHC_CRON_SECRET }}'},
 *     data=json.dumps({
 *       'event':       'completed',
 *       'runId':       '{{ dag_run.conf["hvhc_run_id"] }}',
 *       'recordsRead': ...,
 *       ...
 *     }),
 *   )
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyCronSecret } from '@/lib/cron/verify-cron-secret';
import {
  markRunStarted,
  completeRun,
  cancelRun,
} from '@/lib/services/infrastructure/pipeline.service';

// ─── Request body types ───────────────────────────────────────────────────────

interface RunStartedPayload {
  event:  'started';
  runId:  string;
}

interface RunCompletedPayload {
  event:          'completed';
  runId:          string;
  recordsRead?:   number;
  recordsWritten?: number;
  recordsSkipped?: number;
  errorCount?:    number;
  logPath?:       string;
  metadata?:      Record<string, unknown>;
}

interface RunFailedPayload {
  event:        'failed';
  runId:        string;
  errorMessage: string;
  errorCount?:  number;
  logPath?:     string;
  metadata?:    Record<string, unknown>;
}

interface RunCancelledPayload {
  event:   'cancelled';
  runId:   string;
  reason?: string;
}

type PipelineReportPayload =
  | RunStartedPayload
  | RunCompletedPayload
  | RunFailedPayload
  | RunCancelledPayload;

// ─── Handlers ─────────────────────────────────────────────────────────────────

async function handleStarted(p: RunStartedPayload) {
  if (!p.runId) return error400('runId required');
  await markRunStarted(p.runId);
  console.log(`[pipeline/report] started: runId=${p.runId}`);
  return NextResponse.json({ success: true, runId: p.runId });
}

async function handleCompleted(p: RunCompletedPayload) {
  if (!p.runId) return error400('runId required');
  await completeRun({
    runId:          p.runId,
    status:         'COMPLETED',
    recordsRead:    p.recordsRead,
    recordsWritten: p.recordsWritten,
    recordsSkipped: p.recordsSkipped,
    errorCount:     p.errorCount ?? 0,
    logPath:        p.logPath,
    metadata:       p.metadata,
  });
  console.log(
    `[pipeline/report] completed: runId=${p.runId} read=${p.recordsRead} written=${p.recordsWritten}`,
  );
  return NextResponse.json({ success: true, runId: p.runId });
}

async function handleFailed(p: RunFailedPayload) {
  if (!p.runId) return error400('runId required');
  if (!p.errorMessage) return error400('errorMessage required');
  await completeRun({
    runId:        p.runId,
    status:       'FAILED',
    errorMessage: p.errorMessage,
    errorCount:   p.errorCount ?? 1,
    logPath:      p.logPath,
    metadata:     p.metadata,
  });
  console.error(`[pipeline/report] failed: runId=${p.runId} error=${p.errorMessage}`);
  return NextResponse.json({ success: true, runId: p.runId });
}

async function handleCancelled(p: RunCancelledPayload) {
  if (!p.runId) return error400('runId required');
  await cancelRun(p.runId, p.reason);
  console.log(`[pipeline/report] cancelled: runId=${p.runId}`);
  return NextResponse.json({ success: true, runId: p.runId });
}

function error400(msg: string) {
  return NextResponse.json({ success: false, error: msg }, { status: 400 });
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  if (!verifyCronSecret(req)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  let body: PipelineReportPayload;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!body?.event) {
    return NextResponse.json({ success: false, error: 'event field required' }, { status: 400 });
  }

  try {
    switch (body.event) {
      case 'started':   return await handleStarted(body as RunStartedPayload);
      case 'completed': return await handleCompleted(body as RunCompletedPayload);
      case 'failed':    return await handleFailed(body as RunFailedPayload);
      case 'cancelled': return await handleCancelled(body as RunCancelledPayload);
      default:
        return NextResponse.json(
          { success: false, error: `Unknown event: ${(body as { event: string }).event}` },
          { status: 400 },
        );
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    // cancelRun throws khi run không còn PENDING — đây là idempotency issue, không phải lỗi server
    const status = message.includes('Cannot cancel') || message.includes('not found') ? 409 : 500;
    console.error('[pipeline/report] handler error:', message);
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
