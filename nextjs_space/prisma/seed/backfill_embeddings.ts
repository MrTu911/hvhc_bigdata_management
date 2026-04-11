/**
 * Backfill: pgvector embeddings
 *
 * Enqueue tất cả NckhProject, ScientificWork, LibraryItem chưa có embedding
 * vào BullMQ queue để worker xử lý embedding generation.
 *
 * Yêu cầu trước khi chạy:
 *   1. postgresql-16-pgvector đã cài  (sudo apt-get install postgresql-16-pgvector)
 *   2. Migration 20260411000002_add_pgvector_embedding đã apply  (npx prisma migrate deploy)
 *   3. Redis đang chạy
 *   4. Science worker đang chạy (hoặc sẽ được khởi động sau)
 *
 * Chạy:
 *   npx tsx --require dotenv/config prisma/seed/backfill_embeddings.ts
 *
 * Worker xử lý job 'embedding-backfill' phải implement:
 *   - gọi AI embedding API (OpenAI ada-002 hoặc local model)
 *   - UPDATE row tương ứng với vector kết quả
 *   - cập nhật LibraryItem.isIndexed = true sau khi xong
 */

import prisma from '@/lib/db'
import { enqueueEmbeddingBackfill } from '@/lib/queue/science-queue'

const BATCH_SIZE = 50

async function enqueueProjects() {
  let count = 0
  let cursor: string | undefined

  while (true) {
    const rows = await prisma.$queryRawUnsafe<{ id: string }[]>(
      `SELECT id FROM nckh_projects WHERE embedding IS NULL AND "isDeleted" = false
       ${cursor ? `AND id > '${cursor}'` : ''}
       ORDER BY id LIMIT ${BATCH_SIZE}`
    )
    if (rows.length === 0) break

    for (const row of rows) {
      await enqueueEmbeddingBackfill({ jobType: 'EMBEDDING_BACKFILL', entityType: 'NCKH_PROJECT', entityId: row.id })
      count++
    }
    cursor = rows[rows.length - 1].id
    if (rows.length < BATCH_SIZE) break
  }
  return count
}

async function enqueueWorks() {
  let count = 0
  let cursor: string | undefined

  while (true) {
    const rows = await prisma.$queryRawUnsafe<{ id: string }[]>(
      `SELECT id FROM scientific_works WHERE "abstractEmbedding" IS NULL AND "isDeleted" = false
       ${cursor ? `AND id > '${cursor}'` : ''}
       ORDER BY id LIMIT ${BATCH_SIZE}`
    )
    if (rows.length === 0) break

    for (const row of rows) {
      await enqueueEmbeddingBackfill({ jobType: 'EMBEDDING_BACKFILL', entityType: 'SCIENTIFIC_WORK', entityId: row.id })
      count++
    }
    cursor = rows[rows.length - 1].id
    if (rows.length < BATCH_SIZE) break
  }
  return count
}

async function enqueueLibraryItems() {
  let count = 0
  let cursor: string | undefined

  while (true) {
    const rows = await prisma.$queryRawUnsafe<{ id: string }[]>(
      `SELECT id FROM library_items WHERE "textEmbedding" IS NULL AND "isDeleted" = false AND "isIndexed" = true
       ${cursor ? `AND id > '${cursor}'` : ''}
       ORDER BY id LIMIT ${BATCH_SIZE}`
    )
    if (rows.length === 0) break

    for (const row of rows) {
      await enqueueEmbeddingBackfill({ jobType: 'EMBEDDING_BACKFILL', entityType: 'LIBRARY_ITEM', entityId: row.id })
      count++
    }
    cursor = rows[rows.length - 1].id
    if (rows.length < BATCH_SIZE) break
  }
  return count
}

async function main() {
  console.log('[backfill_embeddings] Starting embedding backfill enqueue...')

  const [projects, works, items] = await Promise.all([
    enqueueProjects(),
    enqueueWorks(),
    enqueueLibraryItems(),
  ])

  console.log('[backfill_embeddings] Enqueued:')
  console.log(`  NckhProject:    ${projects}`)
  console.log(`  ScientificWork: ${works}`)
  console.log(`  LibraryItem:    ${items}`)
  console.log(`  Total:          ${projects + works + items}`)
  console.log('[backfill_embeddings] Done. Workers will process jobs asynchronously.')
}

main()
  .catch((e) => { console.error('[backfill_embeddings] Error:', e); process.exit(1) })
  .finally(() => prisma.$disconnect())
