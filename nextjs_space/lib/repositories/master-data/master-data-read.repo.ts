/**
 * MasterDataReadRepo – M19 MDM
 * Truy cập Prisma trực tiếp, không qua cache.
 * Dùng bởi service khi cần bypass cache (admin, seed, sync).
 * Cho đọc thông thường, dùng service (có cache).
 */
import 'server-only'
import db from '@/lib/db'

// ─── Types ────────────────────────────────────────────────────────────────────

export type RawCategory = {
  id: string
  code: string
  nameVi: string
  nameEn: string | null
  groupTag: string
  cacheType: string
  sourceType: string
  isActive: boolean
  description: string | null
  sortOrder: number
  createdAt: Date
}

export type RawItem = {
  id: string
  categoryCode: string
  code: string
  nameVi: string
  nameEn: string | null
  shortName: string | null
  parentCode: string | null
  level: number | null
  externalCode: string | null
  sortOrder: number
  metadata: unknown
  isActive: boolean
  validFrom: Date | null
  validTo: Date | null
  createdBy: string | null
  createdAt: Date
  updatedAt: Date
}

// ─── Category queries ─────────────────────────────────────────────────────────

export const masterDataReadRepo = {
  async findCategoryByCode(code: string): Promise<RawCategory | null> {
    return db.masterCategory.findUnique({
      where: { code },
    }) as Promise<RawCategory | null>
  },

  async findAllCategories(onlyActive = true): Promise<RawCategory[]> {
    return db.masterCategory.findMany({
      where: onlyActive ? { isActive: true } : undefined,
      orderBy: { sortOrder: 'asc' },
    }) as Promise<RawCategory[]>
  },

  // ─── Item queries ─────────────────────────────────────────────────────────

  async findItemsByCategory(
    categoryCode: string,
    onlyActive = true
  ): Promise<RawItem[]> {
    return db.masterDataItem.findMany({
      where: {
        categoryCode,
        ...(onlyActive ? { isActive: true } : {}),
      },
      orderBy: [{ sortOrder: 'asc' }, { nameVi: 'asc' }],
    }) as Promise<RawItem[]>
  },

  async findItemByCode(
    categoryCode: string,
    code: string
  ): Promise<RawItem | null> {
    return db.masterDataItem.findUnique({
      where: { categoryCode_code: { categoryCode, code } },
    }) as Promise<RawItem | null>
  },
}
