/**
 * M12 – Internal: Backup Job Callback
 * POST /api/internal/backup/report
 *
 * Nhận kết quả từ script pg_dump bên ngoài app (backup-pg.sh).
 * Tạo/cập nhật BackupJob record theo vòng đời: started → completed/failed.
 * Khi backup hoàn thành, tự động trigger health check để resolve stale alert nếu có.
 *
 * Bảo vệ bằng CRON_SECRET (Bearer token) — không expose ra public.
 *
 * Event flow:
 *   backup-pg.sh → POST /started  → tạo BackupJob, trả jobId
 *   backup-pg.sh → POST /completed → hoàn thành job, ghi artifact
 *   backup-pg.sh → POST /failed    → đánh dấu job FAILED, ghi lỗi
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyCronSecret } from '@/lib/cron/verify-cron-secret';
import {
  createBackupJob,
  markBackupJobStarted,
  completeBackupJob,
  registerArtifact,
} from '@/lib/services/infrastructure/backup.service';
import { runHealthCheckWithAlerts } from '@/lib/services/infrastructure/health.service';

// ─── Request body types ───────────────────────────────────────────────────────

interface BackupStartedPayload {
  event:      'started';
  backupType: string;
  targetPath: string;
}

interface BackupCompletedPayload {
  event:        'completed';
  jobId:        string;
  sizeBytes?:   number;
  checksumHash?: string;
  storagePath?:  string;
  retentionDays?: number;
}

interface BackupFailedPayload {
  event:        'failed';
  jobId:        string;
  errorMessage: string;
}

type BackupReportPayload = BackupStartedPayload | BackupCompletedPayload | BackupFailedPayload;

// ─── Handlers ─────────────────────────────────────────────────────────────────

async function handleStarted(payload: BackupStartedPayload) {
  const ALLOWED_BACKUP_TYPES = [
    'POSTGRESQL_FULL', 'POSTGRESQL_WAL', 'MINIO_SNAPSHOT',
    'CLICKHOUSE_FULL', 'REDIS_SNAPSHOT', 'CONFIG_BACKUP', 'FULL_SYSTEM',
  ];
  if (!ALLOWED_BACKUP_TYPES.includes(payload.backupType)) {
    return NextResponse.json(
      { success: false, error: `Invalid backupType: ${payload.backupType}` },
      { status: 400 },
    );
  }
  if (!payload.targetPath) {
    return NextResponse.json(
      { success: false, error: 'targetPath is required' },
      { status: 400 },
    );
  }

  const job = await createBackupJob({
    backupType:  payload.backupType as Parameters<typeof createBackupJob>[0]['backupType'],
    targetPath:  payload.targetPath,
    triggeredBy: 'SCHEDULED',
  });

  await markBackupJobStarted(job.id);

  console.log(`[backup/report] job started: ${job.id} type=${payload.backupType}`);
  return NextResponse.json({ success: true, jobId: job.id });
}

async function handleCompleted(payload: BackupCompletedPayload) {
  if (!payload.jobId) {
    return NextResponse.json({ success: false, error: 'jobId is required' }, { status: 400 });
  }

  await completeBackupJob({
    jobId:     payload.jobId,
    status:    'COMPLETED',
    sizeBytes: payload.sizeBytes !== undefined ? BigInt(payload.sizeBytes) : undefined,
  });

  // Ghi artifact nếu script cung cấp storagePath
  if (payload.storagePath && payload.sizeBytes !== undefined) {
    const retentionUntil = payload.retentionDays
      ? new Date(Date.now() + payload.retentionDays * 86_400_000)
      : undefined;

    await registerArtifact({
      jobId:          payload.jobId,
      storagePath:    payload.storagePath,
      sizeBytes:      BigInt(payload.sizeBytes),
      checksumHash:   payload.checksumHash,
      retentionUntil,
    });
  }

  console.log(`[backup/report] job completed: ${payload.jobId} sizeBytes=${payload.sizeBytes}`);

  // Trigger health check để auto-resolve backup_age alert nếu metric đã OK
  try {
    await runHealthCheckWithAlerts();
  } catch (err) {
    // Non-critical — backup đã ghi thành công; health check lỗi chỉ là secondary
    console.warn('[backup/report] post-completion health check failed:', err);
  }

  return NextResponse.json({ success: true, jobId: payload.jobId });
}

async function handleFailed(payload: BackupFailedPayload) {
  if (!payload.jobId) {
    return NextResponse.json({ success: false, error: 'jobId is required' }, { status: 400 });
  }
  if (!payload.errorMessage) {
    return NextResponse.json({ success: false, error: 'errorMessage is required' }, { status: 400 });
  }

  await completeBackupJob({
    jobId:        payload.jobId,
    status:       'FAILED',
    errorMessage: payload.errorMessage,
  });

  console.error(`[backup/report] job failed: ${payload.jobId} error=${payload.errorMessage}`);
  return NextResponse.json({ success: true, jobId: payload.jobId });
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  if (!verifyCronSecret(req)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  let body: BackupReportPayload;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!body?.event) {
    return NextResponse.json({ success: false, error: 'event field is required' }, { status: 400 });
  }

  try {
    switch (body.event) {
      case 'started':   return await handleStarted(body as BackupStartedPayload);
      case 'completed': return await handleCompleted(body as BackupCompletedPayload);
      case 'failed':    return await handleFailed(body as BackupFailedPayload);
      default:
        return NextResponse.json(
          { success: false, error: `Unknown event: ${(body as { event: string }).event}` },
          { status: 400 },
        );
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[backup/report] handler error:', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
