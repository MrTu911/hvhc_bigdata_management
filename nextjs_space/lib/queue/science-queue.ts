/**
 * Science Queue – CSDL-KHQL Phase 2
 *
 * BullMQ Queue cho các background jobs của module Khoa học:
 *   - ORCID sync: lấy publications/citations từ ORCID Public API v3.0
 *
 * Pattern giống export-queue.ts – dùng chung Redis connection pool nếu có thể,
 * nhưng tách queue riêng để không ảnh hưởng export queue M18.
 */

import { Queue } from 'bullmq'
import IORedis from 'ioredis'

export const SCIENCE_QUEUE_NAME = 'csdl-khql:science'

// ─── Job types ────────────────────────────────────────────────────────────────

export type OrcidSyncJobData = {
  jobType: 'ORCID_SYNC'
  scientistProfileId: string
  orcidId: string
  requestedByUserId: string
}

export type LibraryIndexJobData = {
  jobType: 'LIBRARY_INDEX'
  libraryItemId: string
  filePath: string          // MinIO object key
  mimeType: string
  requestedByUserId: string
}

export type ScienceJobData = OrcidSyncJobData | LibraryIndexJobData

// ─── Redis connection (lazy singleton) ───────────────────────────────────────

let _scienceConn: IORedis | null = null

function getScienceRedisConnection(): IORedis {
  if (!_scienceConn) {
    const url = process.env.REDIS_URL || 'redis://localhost:6379'
    _scienceConn = new IORedis(url, {
      maxRetriesPerRequest: null, // BullMQ requirement
      enableReadyCheck: false,
      lazyConnect: false,
    })
    _scienceConn.on('error', (err) => {
      console.error('[science-queue] Redis connection error:', err.message)
    })
  }
  return _scienceConn
}

// ─── Queue instance (producer side) ──────────────────────────────────────────

let _scienceQueue: Queue<ScienceJobData> | null = null

export function getScienceQueue(): Queue<ScienceJobData> {
  if (!_scienceQueue) {
    _scienceQueue = new Queue<ScienceJobData>(SCIENCE_QUEUE_NAME, {
      connection: getScienceRedisConnection(),
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 10000, // 10s → 20s → 40s
        },
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 200 },
      },
    })
  }
  return _scienceQueue
}

/**
 * Enqueue ORCID sync job cho một nhà khoa học.
 * Dùng scientistProfileId làm idempotency key để tránh enqueue trùng.
 */
export async function enqueueOrcidSync(data: OrcidSyncJobData): Promise<string> {
  const queue = getScienceQueue()
  const jobId = `orcid-sync:${data.scientistProfileId}`

  // Kiểm tra job đã đang chờ / chạy chưa trước khi thêm
  const existing = await queue.getJob(jobId)
  if (existing) {
    const state = await existing.getState()
    if (state === 'waiting' || state === 'active' || state === 'delayed') {
      return jobId
    }
  }

  const job = await queue.add('orcid-sync', data, { jobId })
  return job.id ?? jobId
}

/**
 * Enqueue library indexing job (text extraction + embedding).
 * Mỗi libraryItemId chỉ có 1 job active tại một thời điểm.
 */
export async function enqueueLibraryIndex(data: LibraryIndexJobData): Promise<string> {
  const queue = getScienceQueue()
  const jobId = `library-index:${data.libraryItemId}`

  const existing = await queue.getJob(jobId)
  if (existing) {
    const state = await existing.getState()
    if (state === 'waiting' || state === 'active' || state === 'delayed') {
      return jobId
    }
  }

  const job = await queue.add('library-index', data, { jobId })
  return job.id ?? jobId
}
