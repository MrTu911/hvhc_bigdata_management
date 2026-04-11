/**
 * Science Worker – CSDL-KHQL Sprint 02
 *
 * BullMQ Worker xử lý các background jobs của module Khoa học:
 *   - ORCID_SYNC:         Đồng bộ publications/citations từ ORCID Public API v3.0
 *   - LIBRARY_INDEX:      Đánh dấu tài liệu đã index; text extraction thật để Sprint 05
 *   - EMBEDDING_BACKFILL: DEFERRED (stub) – kích hoạt khi pgvector được xác nhận trên DB
 *
 * Pattern giống export-worker.ts: khởi động qua instrumentation.ts, graceful shutdown
 * tự động khi process nhận SIGTERM.
 *
 * Run by: instrumentation.ts → initScienceWorker()
 */

import { Worker, Job } from 'bullmq'
import type { ScienceJobData } from '@/lib/queue/science-queue'
import { SCIENCE_QUEUE_NAME, getScienceRedisConnection } from '@/lib/queue/science-queue'
import prisma from '@/lib/db'

// ─── Job handlers ─────────────────────────────────────────────────────────────

/**
 * ORCID_SYNC – Lấy danh sách works + citation từ ORCID Public API v3.0 và
 * cập nhật NckhScientistProfile.
 *
 * ORCID Public API:
 *   GET https://pub.orcid.org/v3.0/{orcid-id}/works
 *   GET https://pub.orcid.org/v3.0/{orcid-id}/person  (để lấy giới thiệu nếu thiếu)
 *
 * Xử lý lỗi:
 *   - 404 ORCID: ORCID ID không tồn tại → ghi log, không retry
 *   - Network/5xx: throw để BullMQ retry theo exponential backoff (3 lần)
 *   - Profile không tồn tại: skip (không throw)
 */
async function handleOrcidSync(data: Extract<ScienceJobData, { jobType: 'ORCID_SYNC' }>) {
  const { scientistProfileId, orcidId } = data

  const profile = await prisma.nckhScientistProfile.findUnique({
    where: { id: scientistProfileId },
    select: { id: true, userId: true },
  })

  if (!profile) {
    // Profile bị xoá sau khi job được enqueue – skip bình thường
    console.warn(`[science-worker/ORCID_SYNC] Profile ${scientistProfileId} không tồn tại – skip`)
    return
  }

  const ORCID_API = `https://pub.orcid.org/v3.0/${orcidId}`
  const headers = { Accept: 'application/json' }

  // Fetch works summary
  const worksRes = await fetch(`${ORCID_API}/works`, { headers })

  if (worksRes.status === 404) {
    // ORCID ID không tồn tại – ghi cảnh báo, không retry
    console.warn(`[science-worker/ORCID_SYNC] ORCID ID ${orcidId} không tồn tại (404) – bỏ qua`)
    return
  }

  if (!worksRes.ok) {
    // 5xx hoặc network error – throw để BullMQ retry
    throw new Error(`[science-worker/ORCID_SYNC] ORCID API trả ${worksRes.status} cho ${orcidId}`)
  }

  const worksJson = await worksRes.json()

  // ORCID v3.0 works response: { group: [ { 'work-summary': [...] } ] }
  const groups: any[] = worksJson?.group ?? []
  const totalPublications = groups.length

  // Tổng citation count từ tất cả works (citation-count trả về trong work-summary[0])
  const totalCitations = groups.reduce((sum: number, g: any) => {
    const summary = g['work-summary']?.[0]
    return sum + (summary?.['citation-count'] ?? 0)
  }, 0)

  // Cập nhật NckhScientistProfile – chỉ update các chỉ số từ ORCID, không overwrite fields khác
  await prisma.nckhScientistProfile.update({
    where: { id: scientistProfileId },
    data: {
      totalPublications,
      totalCitations,
      updatedAt: new Date(),
    },
  })

  console.log(
    `[science-worker/ORCID_SYNC] Profile ${scientistProfileId}: ${totalPublications} works, ${totalCitations} citations`,
  )
}

/**
 * LIBRARY_INDEX – Sprint 02: Đánh dấu LibraryItem là đã index (isIndexed = true).
 *
 * Sprint 05 TODO: Thay stub này bằng logic thật:
 *   1. Download file từ MinIO (getObject)
 *   2. Extract text theo mimeType (pdfjs-dist cho PDF, mammoth cho DOCX, v.v.)
 *   3. Lưu text vào một text-store hoặc index table
 *   4. Enqueue EMBEDDING_BACKFILL job cho entity này
 *
 * Hiện tại chỉ cập nhật isIndexed = true và indexedAt = now() để:
 *   - Upload flow hoàn chỉnh (không bị treo job mãi mãi)
 *   - Search có thể filter `isIndexed = true` khi semantic search chưa kích hoạt
 */
async function handleLibraryIndex(data: Extract<ScienceJobData, { jobType: 'LIBRARY_INDEX' }>) {
  const { libraryItemId } = data

  const item = await prisma.libraryItem.findUnique({
    where: { id: libraryItemId },
    select: { id: true, isIndexed: true, isDeleted: true },
  })

  if (!item || item.isDeleted) {
    console.warn(`[science-worker/LIBRARY_INDEX] Item ${libraryItemId} không tồn tại hoặc đã xoá – skip`)
    return
  }

  if (item.isIndexed) {
    // Đã index rồi – idempotent, skip
    return
  }

  // Sprint 05 TODO: thay bằng text extraction thật ở đây
  await prisma.libraryItem.update({
    where: { id: libraryItemId },
    data: {
      isIndexed: true,
      indexedAt: new Date(),
    },
  })

  console.log(`[science-worker/LIBRARY_INDEX] Item ${libraryItemId} đánh dấu isIndexed = true (stub)`)
}

/**
 * EMBEDDING_BACKFILL – DEFERRED đến Sprint 06.
 *
 * Lý do: pgvector extension chưa xác nhận trên production DB.
 * Khi Sprint 06 bắt đầu: implement text-to-vector embedding và update
 * NckhProject.embedding / ScientificWork.abstractEmbedding / LibraryItem.textEmbedding.
 */
async function handleEmbeddingBackfill(
  _data: Extract<ScienceJobData, { jobType: 'EMBEDDING_BACKFILL' }>,
) {
  // Sprint 06 TODO: activate pgvector embedding pipeline
  console.log('[science-worker/EMBEDDING_BACKFILL] Deferred – pgvector chưa kích hoạt (Sprint 06)')
}

// ─── Main processor ───────────────────────────────────────────────────────────

async function processScienceJob(job: Job<ScienceJobData>) {
  const { jobType } = job.data

  switch (jobType) {
    case 'ORCID_SYNC':
      await handleOrcidSync(job.data as Extract<ScienceJobData, { jobType: 'ORCID_SYNC' }>)
      break
    case 'LIBRARY_INDEX':
      await handleLibraryIndex(job.data as Extract<ScienceJobData, { jobType: 'LIBRARY_INDEX' }>)
      break
    case 'EMBEDDING_BACKFILL':
      await handleEmbeddingBackfill(
        job.data as Extract<ScienceJobData, { jobType: 'EMBEDDING_BACKFILL' }>,
      )
      break
    default: {
      const exhaustive: never = jobType
      console.error(`[science-worker] Job type không nhận ra: ${exhaustive}`)
    }
  }
}

// ─── Worker initialization ────────────────────────────────────────────────────

let _worker: Worker | null = null

/**
 * Khởi động Science Worker. Gọi một lần từ instrumentation.ts khi server boot.
 * Idempotent – gọi lần 2 trở đi là no-op.
 */
export function initScienceWorker(): void {
  if (_worker) return

  const connection = getScienceRedisConnection()

  _worker = new Worker<ScienceJobData>(SCIENCE_QUEUE_NAME, processScienceJob, {
    connection,
    concurrency: 3, // ORCID + library jobs có thể chạy song song nhẹ
    limiter: {
      max: 5,        // max 5 jobs
      duration: 1000, // per 1 second – tránh flood ORCID API
    },
  })

  _worker.on('completed', (job) => {
    console.log(`[science-worker] Job ${job.id} (${job.data.jobType}) hoàn thành`)
  })

  _worker.on('failed', (job, err) => {
    console.error(
      `[science-worker] Job ${job?.id} (${job?.data.jobType}) thất bại (attempt ${job?.attemptsMade}):`,
      err.message,
    )
  })

  _worker.on('error', (err) => {
    console.error('[science-worker] Worker error:', err.message)
  })

  console.log(`[science-worker] Đã khởi động – queue: ${SCIENCE_QUEUE_NAME}, concurrency: 3`)
}
