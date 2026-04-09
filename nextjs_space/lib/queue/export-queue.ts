/**
 * Export Queue – M18
 *
 * BullMQ Queue cho batch export jobs.
 * Producer: startBatchExport() trong export-engine-service.ts
 * Consumer: export-worker.ts (khởi động qua instrumentation.ts)
 *
 * Dùng ioredis (đã có trong dependencies) làm Redis adapter cho BullMQ.
 */

import { Queue, QueueEvents } from 'bullmq';
import IORedis from 'ioredis';
import type { BatchExportRequest } from '@/lib/services/export-engine-service';

export const EXPORT_QUEUE_NAME = 'm18:export-batch';

// ─── Job data shape ───────────────────────────────────────────────────────────

export interface BatchExportJobData {
  /** ID của ExportJob record đã tạo trong DB trước khi enqueue */
  exportJobId: string;
  request: BatchExportRequest;
}

// ─── Redis connection ─────────────────────────────────────────────────────────
//
// BullMQ yêu cầu maxRetriesPerRequest: null để hoạt động đúng.
// Dùng lazy singleton để không kết nối khi chưa cần.

let _connection: IORedis | null = null;

export function getRedisConnection(): IORedis {
  if (!_connection) {
    const url = process.env.REDIS_URL || 'redis://localhost:6379';
    _connection = new IORedis(url, {
      maxRetriesPerRequest: null, // BullMQ requirement
      enableReadyCheck: false,
      lazyConnect: false,
    });
    _connection.on('error', (err) => {
      console.error('[export-queue] Redis connection error:', err.message);
    });
    _connection.on('connect', () => {
      console.info('[export-queue] Redis connected');
    });
  }
  return _connection;
}

// ─── Queue instance (producer side) ──────────────────────────────────────────

let _queue: Queue<BatchExportJobData> | null = null;

export function getExportQueue(): Queue<BatchExportJobData> {
  if (!_queue) {
    _queue = new Queue<BatchExportJobData>(EXPORT_QUEUE_NAME, {
      connection: getRedisConnection(),
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000, // 5s initial delay, doubles each retry
        },
        removeOnComplete: { count: 200 }, // giữ 200 completed jobs gần nhất
        removeOnFail: { count: 500 },     // giữ 500 failed jobs để debug
      },
    });
  }
  return _queue;
}

/**
 * Thêm batch export job vào queue.
 * Returns BullMQ job ID (khác với exportJobId trong DB).
 */
export async function enqueueBatchExport(data: BatchExportJobData): Promise<string> {
  const queue = getExportQueue();
  const job = await queue.add('batch-export', data, {
    jobId: `export:${data.exportJobId}`, // idempotency key = DB job ID
  });
  return job.id ?? data.exportJobId;
}

/**
 * Lấy vị trí trong queue của một job.
 * Dùng để trả `queuePosition` cho client.
 */
export async function getQueueDepth(): Promise<number> {
  const queue = getExportQueue();
  const counts = await queue.getJobCounts('waiting', 'active');
  return (counts.waiting ?? 0) + (counts.active ?? 0);
}
