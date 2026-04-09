/**
 * Export Worker – M18
 *
 * BullMQ Worker xử lý batch export jobs.
 * Khởi động qua instrumentation.ts khi server boot.
 *
 * Flow:
 *   startBatchExport() → enqueueBatchExport() → [Redis queue]
 *   → Worker.process() → processBatchJob() → MinIO upload → DB update
 *
 * Retry strategy: 3 lần, exponential backoff từ 5s (5s → 10s → 20s).
 * Nếu thất bại toàn bộ: ExportJob status = FAILED.
 */

import { Worker, Job } from 'bullmq';
import { EXPORT_QUEUE_NAME, BatchExportJobData, getRedisConnection } from '@/lib/queue/export-queue';
import prisma from '@/lib/db';
import { resolveEntityData } from '@/lib/services/data-resolver-service';
import { renderFile } from '@/lib/services/export-engine-service';
import { uploadFileToMinio, getPresignedUrl } from '@/lib/minio-client';
import { TEMPLATE_BUCKET } from '@/lib/services/template-service';
import JSZip from 'jszip';

const EXPORT_URL_TTL = 86400; // 24h

let _worker: Worker | null = null;

// ─── Worker initialization ────────────────────────────────────────────────────

/**
 * Mulai worker. Gọi một lần từ instrumentation.ts khi server boot.
 * Idempotent — gọi lần 2 trở đi là no-op.
 */
export function initExportWorker(): void {
  if (_worker) return;

  _worker = new Worker<BatchExportJobData>(
    EXPORT_QUEUE_NAME,
    processBatchExportJob,
    {
      connection: getRedisConnection(),
      concurrency: 2, // tối đa 2 batch jobs chạy song song
      limiter: {
        max: 10,       // max 10 jobs mỗi duration
        duration: 1000, // per 1 second
      },
    },
  );

  _worker.on('completed', (job) => {
    console.info(
      `[export-worker] job completed jobId=${job.id} exportJobId=${job.data.exportJobId}`,
    );
  });

  _worker.on('failed', (job, err) => {
    console.error(
      `[export-worker] job failed jobId=${job?.id} exportJobId=${job?.data.exportJobId} attempt=${job?.attemptsMade}`,
      err.message,
    );
  });

  _worker.on('error', (err) => {
    console.error('[export-worker] worker error:', err.message);
  });

  console.info('[export-worker] initialized — queue:', EXPORT_QUEUE_NAME);
}

/**
 * Graceful shutdown — dùng khi process nhận SIGTERM.
 */
export async function shutdownExportWorker(): Promise<void> {
  if (_worker) {
    await _worker.close();
    _worker = null;
    console.info('[export-worker] shut down cleanly');
  }
}

// ─── Job processor ────────────────────────────────────────────────────────────

async function processBatchExportJob(job: Job<BatchExportJobData>): Promise<void> {
  const { exportJobId, request } = job.data;

  // Mark PROCESSING
  await prisma.exportJob.update({
    where: { id: exportJobId },
    data: { status: 'PROCESSING', progress: 0 },
  });

  const template = await prisma.reportTemplate.findUnique({
    where: { id: request.templateId },
  });

  if (!template) {
    await failJob(exportJobId, [], 0, request.entityIds.length, 'Template không tồn tại');
    throw new Error('Template không tồn tại');
  }

  const dataMap = (template.dataMap as Record<string, unknown>) || {};
  const buffers: { entityId: string; buffer: Buffer; ext: string }[] = [];
  const errors: { entityId: string; reason: string }[] = [];
  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < request.entityIds.length; i++) {
    const entityId = request.entityIds[i];
    try {
      const resolvedData = await resolveEntityData({
        entityId,
        entityType: request.entityType,
        dataMap,
        requestedBy: request.requestedBy,
      });

      const { buffer, ext } = await renderFile(template, resolvedData, request.outputFormat);
      buffers.push({ entityId, buffer, ext });
      successCount++;
    } catch (error) {
      errors.push({ entityId, reason: String(error) });
      failCount++;
    }

    // Update progress (90% = all renders done, 10% reserved for upload)
    const progress = Math.round(((i + 1) / request.entityIds.length) * 90);
    await prisma.exportJob.update({
      where: { id: exportJobId },
      data: { progress, successCount, failCount },
    });

    // Report BullMQ progress so dashboard can track
    await job.updateProgress(progress);
  }

  if (buffers.length === 0) {
    await failJob(exportJobId, errors, 0, failCount, 'Tất cả entity đều thất bại khi render');
    throw new Error('Tất cả entity đều thất bại khi render');
  }

  // Upload output
  let outputKey: string;

  if (buffers.length === 1) {
    outputKey = `exports/${exportJobId}/output.${buffers[0].ext}`;
    await uploadFileToMinio(TEMPLATE_BUCKET, outputKey, buffers[0].buffer, { jobId: exportJobId });
  } else {
    const zip = new JSZip();
    for (const { entityId, buffer, ext } of buffers) {
      const filename = request.zipName
        ? `${request.zipName}_${entityId}.${ext}`
        : `export_${entityId}.${ext}`;
      zip.file(filename, buffer);
    }
    const zipBuffer = Buffer.from(
      await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' }),
    );
    outputKey = `exports/${exportJobId}/${request.zipName || 'batch_export'}.zip`;
    await uploadFileToMinio(TEMPLATE_BUCKET, outputKey, zipBuffer, {
      jobId: exportJobId,
      'Content-Type': 'application/zip',
    });
  }

  const signedUrl = await getPresignedUrl(TEMPLATE_BUCKET, outputKey, EXPORT_URL_TTL);
  const urlExpiresAt = new Date(Date.now() + EXPORT_URL_TTL * 1000);

  await prisma.exportJob.update({
    where: { id: exportJobId },
    data: {
      status: failCount === request.entityIds.length ? 'FAILED' : 'COMPLETED',
      progress: 100,
      successCount,
      failCount,
      errors: errors.length > 0 ? errors : undefined,
      outputKey,
      signedUrl,
      urlExpiresAt,
      completedAt: new Date(),
    },
  });
}

async function failJob(
  exportJobId: string,
  errors: { entityId: string; reason: string }[],
  successCount: number,
  failCount: number,
  reason: string,
): Promise<void> {
  await prisma.exportJob.update({
    where: { id: exportJobId },
    data: {
      status: 'FAILED',
      errors: errors.length > 0 ? errors : [{ entityId: 'batch', reason }],
      successCount,
      failCount,
      completedAt: new Date(),
      progress: 100,
    },
  });
}
