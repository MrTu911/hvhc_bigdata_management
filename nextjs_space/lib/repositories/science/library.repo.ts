/**
 * LibraryRepo – Phase 4
 * Data access cho LibraryItem + LibraryAccessLog.
 * Semantic search dùng raw SQL (pgvector <=> cosine distance).
 */
import 'server-only'
import prisma from '@/lib/db'
import type { LibraryListFilter } from '@/lib/validations/science-library'

// ─── Shared select ────────────────────────────────────────────────────────────

const ITEM_SELECT = {
  id: true,
  title: true,
  filePath: true,
  fileSize: true,
  mimeType: true,
  checksumSha256: true,
  sensitivity: true,
  accessCount: true,
  downloadCount: true,
  isIndexed: true,
  indexedAt: true,
  createdAt: true,
  workId: true,
  work: { select: { id: true, code: true, title: true, type: true } },
  createdBy: { select: { id: true, name: true } },
} as const

// ─── Repository ───────────────────────────────────────────────────────────────

export const libraryRepo = {
  async findMany(filter: LibraryListFilter, allowedSensitivities: string[]) {
    const { keyword, sensitivity, workId, isIndexed, page, pageSize } = filter
    const skip = (page - 1) * pageSize

    // Giao nhau với allowedSensitivities để enforce scope
    const sensitivityFilter = sensitivity
      ? allowedSensitivities.includes(sensitivity)
        ? [sensitivity]
        : []
      : allowedSensitivities

    const where = {
      isDeleted: false,
      sensitivity: { in: sensitivityFilter },
      ...(workId ? { workId } : {}),
      ...(isIndexed !== undefined ? { isIndexed } : {}),
      ...(keyword
        ? { title: { contains: keyword, mode: 'insensitive' as const } }
        : {}),
    }

    const [items, total] = await Promise.all([
      prisma.libraryItem.findMany({
        where,
        select: ITEM_SELECT,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.libraryItem.count({ where }),
    ])

    return { items, total }
  },

  async findById(id: string) {
    return prisma.libraryItem.findFirst({
      where: { id, isDeleted: false },
      select: ITEM_SELECT,
    })
  },

  async create(data: {
    title: string
    filePath: string
    fileSize: bigint
    mimeType: string
    checksumSha256: string
    sensitivity: string
    workId?: string
    createdById: string
  }) {
    return prisma.libraryItem.create({ data, select: ITEM_SELECT })
  },

  async softDelete(id: string) {
    return prisma.libraryItem.update({ where: { id }, data: { isDeleted: true } })
  },

  async markIndexed(id: string) {
    return prisma.libraryItem.update({
      where: { id },
      data: { isIndexed: true, indexedAt: new Date() },
    })
  },

  async incrementAccess(id: string, action: 'VIEW' | 'DOWNLOAD') {
    return prisma.libraryItem.update({
      where: { id },
      data:
        action === 'DOWNLOAD'
          ? { downloadCount: { increment: 1 }, accessCount: { increment: 1 } }
          : { accessCount: { increment: 1 } },
    })
  },

  async logAccess(itemId: string, userId: string, action: string, ipAddress?: string) {
    return prisma.libraryAccessLog.create({
      data: { itemId, userId, action, ipAddress },
    })
  },

  /**
   * Semantic search dùng pgvector cosine distance (<=>).
   * Chỉ trả về items đã được index (isIndexed=true) và trong allowedSensitivities.
   * Yêu cầu column textEmbedding đã tồn tại (migration Phase 5).
   *
   * Fallback khi chưa có embedding: trả empty array.
   */
  async semanticSearch(
    queryEmbedding: number[],
    allowedSensitivities: string[],
    limit: number,
    sensitivityFilter?: string
  ) {
    const sensitivities = sensitivityFilter
      ? allowedSensitivities.includes(sensitivityFilter) ? [sensitivityFilter] : []
      : allowedSensitivities

    if (sensitivities.length === 0) return []

    const pgVecLiteral = `[${queryEmbedding.join(',')}]`
    const sensitivityPlaceholders = sensitivities.map((_, i) => `$${i + 2}`).join(', ')

    try {
      const rows = await prisma.$queryRawUnsafe<
        { id: string; title: string; sensitivity: string; distance: number }[]
      >(
        `SELECT id, title, sensitivity,
                (text_embedding <=> $1::vector) AS distance
         FROM library_items
         WHERE is_deleted = false
           AND is_indexed = true
           AND sensitivity IN (${sensitivityPlaceholders})
         ORDER BY distance ASC
         LIMIT ${limit}`,
        pgVecLiteral,
        ...sensitivities
      )

      return rows
    } catch (err: any) {
      // textEmbedding column chưa migrate → graceful fallback
      if (err.message?.includes('column') || err.message?.includes('operator')) {
        console.warn('[library-repo] pgvector column not ready, returning empty:', err.message)
        return []
      }
      throw err
    }
  },
}

export type LibraryItemRecord = NonNullable<Awaited<ReturnType<typeof libraryRepo.findById>>>
