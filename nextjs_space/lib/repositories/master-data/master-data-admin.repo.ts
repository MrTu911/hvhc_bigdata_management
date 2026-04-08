/**
 * MasterDataAdminRepo – M19 MDM
 * Truy cập Prisma cho các tác vụ write của admin:
 * CRUD category, CRUD item, change log, soft delete.
 * Không chứa business logic – service chịu trách nhiệm đó.
 */
import 'server-only'
import db from '@/lib/db'
import type { MdChangeType } from '@prisma/client'

// ─── Category write ────────────────────────────────────────────────────────────

export const masterDataAdminRepo = {
  // ─ Category ─────────────────────────────────────────────────────────────────

  async createCategory(data: {
    code: string
    nameVi: string
    nameEn?: string | null
    groupTag: string
    cacheType: string
    sourceType: string
    description?: string | null
    sortOrder?: number
  }) {
    return db.masterCategory.create({ data })
  },

  async updateCategory(
    code: string,
    data: Partial<{
      nameVi: string
      nameEn: string | null
      groupTag: string
      cacheType: string
      sourceType: string
      description: string | null
      sortOrder: number
      isActive: boolean
    }>
  ) {
    return db.masterCategory.update({ where: { code }, data })
  },

  async findCategoryByCode(code: string) {
    return db.masterCategory.findUnique({ where: { code } })
  },

  async categoryCodeExists(code: string): Promise<boolean> {
    const count = await db.masterCategory.count({ where: { code } })
    return count > 0
  },

  // ─ Item ─────────────────────────────────────────────────────────────────────

  async createItem(data: {
    categoryCode: string
    code: string
    nameVi: string
    nameEn?: string | null
    shortName?: string | null
    parentCode?: string | null
    externalCode?: string | null
    sortOrder?: number
    metadata?: unknown
    createdBy?: string
  }) {
    return db.masterDataItem.create({ data: data as Parameters<typeof db.masterDataItem.create>[0]['data'] })
  },

  async updateItem(
    categoryCode: string,
    code: string,
    data: Partial<{
      nameVi: string
      nameEn: string | null
      shortName: string | null
      parentCode: string | null
      externalCode: string | null
      sortOrder: number
      metadata: unknown
      isActive: boolean
    }>
  ) {
    return db.masterDataItem.update({
      where: { categoryCode_code: { categoryCode, code } },
      data: data as Parameters<typeof db.masterDataItem.update>[0]['data'],
    })
  },

  async findItemByCode(categoryCode: string, code: string) {
    return db.masterDataItem.findUnique({
      where: { categoryCode_code: { categoryCode, code } },
    })
  },

  async itemCodeExistsInCategory(categoryCode: string, code: string): Promise<boolean> {
    const count = await db.masterDataItem.count({
      where: { categoryCode_code: { categoryCode, code } },
    })
    return count > 0
  },

  async findActiveChildren(categoryCode: string, parentCode: string) {
    return db.masterDataItem.findMany({
      where: { categoryCode, parentCode, isActive: true },
      select: { code: true, nameVi: true },
    })
  },

  /** Returns code + current sortOrder for the given codes within a category */
  async findItemSortOrders(categoryCode: string, codes: string[]) {
    return db.masterDataItem.findMany({
      where: { categoryCode, code: { in: codes } },
      select: { id: true, code: true, sortOrder: true },
    })
  },

  /** Returns id + code for all active items in a category (for bulk deactivate log) */
  async findActiveItemIds(categoryCode: string) {
    return db.masterDataItem.findMany({
      where: { categoryCode, isActive: true },
      select: { id: true, code: true },
    })
  },

  async softDeleteCategoryWithItems(code: string) {
    return db.$transaction([
      db.masterCategory.update({ where: { code }, data: { isActive: false } }),
      db.masterDataItem.updateMany({ where: { categoryCode: code }, data: { isActive: false } }),
    ])
  },

  /** Bulk update sortOrder for multiple items within one transaction */
  async bulkUpdateSortOrders(updates: { categoryCode: string; code: string; sortOrder: number }[]) {
    if (updates.length === 0) return
    await db.$transaction(
      updates.map(u =>
        db.masterDataItem.update({
          where: { categoryCode_code: { categoryCode: u.categoryCode, code: u.code } },
          data: { sortOrder: u.sortOrder },
        })
      )
    )
  },

  /** Bulk insert change log entries */
  async bulkWriteChangeLogs(
    entries: {
      itemId: string
      changeType: MdChangeType
      fieldName?: string | null
      oldValue?: unknown
      newValue?: unknown
      changedBy: string
      changeReason?: string | null
    }[]
  ) {
    if (entries.length === 0) return
    await db.masterDataChangeLog.createMany({
      data: entries.map(e => ({
        itemId: e.itemId,
        changeType: e.changeType,
        fieldName: e.fieldName ?? null,
        oldValue: e.oldValue as Parameters<typeof db.masterDataChangeLog.create>[0]['data']['oldValue'],
        newValue: e.newValue as Parameters<typeof db.masterDataChangeLog.create>[0]['data']['newValue'],
        changedBy: e.changedBy,
        changeReason: e.changeReason ?? null,
      })),
    })
  },

  // ─ Change log ────────────────────────────────────────────────────────────────

  async writeChangeLog(data: {
    itemId: string
    changeType: MdChangeType
    fieldName?: string | null
    oldValue?: unknown
    newValue?: unknown
    changedBy: string
    changeReason?: string | null
  }) {
    return db.masterDataChangeLog.create({
      data: {
        itemId: data.itemId,
        changeType: data.changeType,
        fieldName: data.fieldName ?? null,
        oldValue: data.oldValue as Parameters<typeof db.masterDataChangeLog.create>[0]['data']['oldValue'],
        newValue: data.newValue as Parameters<typeof db.masterDataChangeLog.create>[0]['data']['newValue'],
        changedBy: data.changedBy,
        changeReason: data.changeReason ?? null,
      },
    })
  },

  async getChangeLog(
    categoryCode: string,
    options: {
      page?: number
      limit?: number
      changeType?: MdChangeType
      itemCode?: string
    } = {}
  ) {
    const page = Math.max(1, options.page ?? 1)
    const limit = Math.min(options.limit ?? 50, 200)

    const where = {
      item: {
        categoryCode,
        ...(options.itemCode
          ? { code: { contains: options.itemCode, mode: 'insensitive' as const } }
          : {}),
      },
      ...(options.changeType ? { changeType: options.changeType } : {}),
    }

    const [logs, total] = await Promise.all([
      db.masterDataChangeLog.findMany({
        where,
        include: { item: { select: { code: true, nameVi: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.masterDataChangeLog.count({ where }),
    ])
    return { logs, total, page, limit }
  },
}
