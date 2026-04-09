/**
 * ScienceCatalogRepo – CSDL-KHQL Phase 1 (M01)
 * Data access layer cho ScienceCatalog và ScienceIdSequence.
 * Chỉ làm query/filter/pagination – không chứa business logic.
 */
import 'server-only'
import db from '@/lib/db'
import type { ScienceCatalogCreateInput, ScienceCatalogUpdateInput } from '@/lib/validations/science-catalog'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CatalogListFilter {
  type?: string
  parentId?: string | null
  keyword?: string
  isActive?: boolean
  page?: number
  pageSize?: number
}

// Select shape trả về cho list (không lấy children lồng nhau sâu)
const catalogListSelect = {
  id: true,
  code: true,
  name: true,
  type: true,
  parentId: true,
  level: true,
  path: true,
  description: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  createdBy: {
    select: { id: true, hoTen: true },
  },
  parent: {
    select: { id: true, code: true, name: true },
  },
  _count: {
    select: { children: true },
  },
} as const

// ─── Repository ───────────────────────────────────────────────────────────────

export const scienceCatalogRepo = {
  async findMany(filter: CatalogListFilter) {
    const { type, parentId, keyword, isActive, page = 1, pageSize = 50 } = filter
    const skip = (page - 1) * pageSize

    const where = {
      ...(type ? { type } : {}),
      // parentId: null → root items; parentId: string → children
      ...(parentId !== undefined ? { parentId: parentId ?? null } : {}),
      ...(isActive !== undefined ? { isActive } : {}),
      ...(keyword
        ? {
            OR: [
              { name: { contains: keyword, mode: 'insensitive' as const } },
              { code: { contains: keyword, mode: 'insensitive' as const } },
              { description: { contains: keyword, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    }

    const [items, total] = await db.$transaction([
      db.scienceCatalog.findMany({
        where,
        select: catalogListSelect,
        orderBy: [{ level: 'asc' }, { name: 'asc' }],
        skip,
        take: pageSize,
      }),
      db.scienceCatalog.count({ where }),
    ])

    return { items, total }
  },

  async findById(id: string) {
    return db.scienceCatalog.findUnique({
      where: { id },
      select: {
        ...catalogListSelect,
        children: {
          select: { id: true, code: true, name: true, isActive: true },
          orderBy: { name: 'asc' },
        },
      },
    })
  },

  async findByCode(code: string) {
    return db.scienceCatalog.findUnique({ where: { code } })
  },

  async create(data: ScienceCatalogCreateInput & { code: string; createdById: string; level: number; path: string }) {
    return db.scienceCatalog.create({
      data: {
        code: data.code,
        name: data.name,
        type: data.type,
        parentId: data.parentId ?? null,
        description: data.description ?? null,
        level: data.level,
        path: data.path,
        createdById: data.createdById,
      },
      select: catalogListSelect,
    })
  },

  async update(id: string, data: ScienceCatalogUpdateInput) {
    return db.scienceCatalog.update({
      where: { id },
      data: {
        ...(data.name ? { name: data.name } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
      },
      select: catalogListSelect,
    })
  },

  async softDelete(id: string) {
    // Soft delete: set isActive = false. Không hard delete để giữ FK integrity.
    return db.scienceCatalog.update({
      where: { id },
      data: { isActive: false },
    })
  },

  async hasChildren(id: string) {
    const count = await db.scienceCatalog.count({ where: { parentId: id, isActive: true } })
    return count > 0
  },

  // ─── ID Sequence ─────────────────────────────────────────────────────────────

  async nextSequence(entityType: string, year: number): Promise<number> {
    // Upsert + increment atomically
    const result = await db.scienceIdSequence.upsert({
      where: { entityType_year: { entityType, year } },
      create: { entityType, year, lastSeq: 1 },
      update: { lastSeq: { increment: 1 } },
    })
    return result.lastSeq
  },
}
