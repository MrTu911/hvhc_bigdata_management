/**
 * MasterDataAdminService – M19 MDM
 * Business logic cho admin CRUD:
 * - validate unique constraints
 * - build field diff cho change log
 * - orchestrate repo calls + cache invalidation
 */
import 'server-only'
import { masterDataAdminRepo } from '@/lib/repositories/master-data/master-data-admin.repo'
import { invalidateCategoryCache } from '@/lib/master-data-cache'
import type { MdChangeType } from '@prisma/client'

const VALID_CACHE_TYPES = ['STATIC', 'SEMI', 'DYNAMIC'] as const
const VALID_SOURCE_TYPES = ['LOCAL', 'BQP', 'NATIONAL', 'ISO'] as const

// ─── Types ────────────────────────────────────────────────────────────────────

export type AdminResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string; status: 400 | 401 | 404 | 409 | 500 }

type FieldDiff = { field: string; old: unknown; new: unknown }

/** Trả về mảng field thực sự bị đổi giữa current và incoming. */
function buildDiff<T extends Record<string, unknown>>(
  current: T,
  incoming: Partial<T>,
  fields: (keyof T)[]
): FieldDiff[] {
  const diffs: FieldDiff[] = []
  for (const field of fields) {
    if (field in incoming && incoming[field] !== undefined && incoming[field] !== current[field]) {
      diffs.push({ field: field as string, old: current[field], new: incoming[field] })
    }
  }
  return diffs
}

// ─── Category ─────────────────────────────────────────────────────────────────

export const masterDataAdminService = {
  async createCategory(
    body: {
      code: string
      nameVi: string
      nameEn?: string | null
      groupTag: string
      cacheType?: string
      sourceType?: string
      description?: string | null
      sortOrder?: number
    }
  ): Promise<AdminResult<{ code: string }>> {
    if (!body.code || !body.nameVi || !body.groupTag) {
      return { success: false, error: 'Thiếu trường bắt buộc: code, nameVi, groupTag', status: 400 }
    }

    const exists = await masterDataAdminRepo.categoryCodeExists(body.code)
    if (exists) {
      return { success: false, error: `Mã danh mục '${body.code}' đã tồn tại`, status: 409 }
    }

    const cat = await masterDataAdminRepo.createCategory({
      code: body.code.toUpperCase(),
      nameVi: body.nameVi,
      nameEn: body.nameEn ?? null,
      groupTag: body.groupTag,
      cacheType: body.cacheType ?? 'SEMI',
      sourceType: body.sourceType ?? 'LOCAL',
      description: body.description ?? null,
      sortOrder: body.sortOrder ?? 0,
    })

    await invalidateCategoryCache()
    return { success: true, data: cat as { code: string } }
  },

  async updateCategory(
    code: string,
    body: Partial<{
      nameVi: string
      nameEn: string | null
      groupTag: string
      cacheType: string
      sourceType: string
      description: string | null
      sortOrder: number
      isActive: boolean
    }>
  ): Promise<AdminResult> {
    const cat = await masterDataAdminRepo.findCategoryByCode(code)
    if (!cat) return { success: false, error: 'Không tìm thấy danh mục', status: 404 }

    if (body.cacheType !== undefined && !(VALID_CACHE_TYPES as readonly string[]).includes(body.cacheType)) {
      return { success: false, error: `cacheType không hợp lệ. Giá trị cho phép: ${VALID_CACHE_TYPES.join(', ')}`, status: 400 }
    }
    if (body.sourceType !== undefined && !(VALID_SOURCE_TYPES as readonly string[]).includes(body.sourceType)) {
      return { success: false, error: `sourceType không hợp lệ. Giá trị cho phép: ${VALID_SOURCE_TYPES.join(', ')}`, status: 400 }
    }

    await masterDataAdminRepo.updateCategory(code, body)
    await invalidateCategoryCache(code)
    return { success: true, data: undefined }
  },

  async deactivateCategory(code: string, changedBy: string): Promise<AdminResult> {
    const cat = await masterDataAdminRepo.findCategoryByCode(code)
    if (!cat) return { success: false, error: 'Không tìm thấy danh mục', status: 404 }

    // Collect active items before deactivating for change log
    const activeItems = await masterDataAdminRepo.findActiveItemIds(code)

    await masterDataAdminRepo.softDeleteCategoryWithItems(code)

    // Write DEACTIVATE change log for every affected item
    if (activeItems.length > 0) {
      await masterDataAdminRepo.bulkWriteChangeLogs(
        activeItems.map(item => ({
          itemId: item.id,
          changeType: 'DEACTIVATE' as MdChangeType,
          oldValue: { isActive: true },
          newValue: { isActive: false },
          changedBy,
          changeReason: `Danh mục ${code} bị vô hiệu hóa`,
        }))
      )
    }

    await invalidateCategoryCache(code)
    return { success: true, data: undefined }
  },

  // ─── Item ──────────────────────────────────────────────────────────────────

  async createItem(
    categoryCode: string,
    body: {
      code: string
      nameVi: string
      nameEn?: string | null
      shortName?: string | null
      parentCode?: string | null
      externalCode?: string | null
      sortOrder?: number
      metadata?: unknown
    },
    changedBy: string
  ): Promise<AdminResult> {
    if (!body.code || !body.nameVi) {
      return { success: false, error: 'Thiếu trường bắt buộc: code, nameVi', status: 400 }
    }

    const cat = await masterDataAdminRepo.findCategoryByCode(categoryCode)
    if (!cat) return { success: false, error: 'Không tìm thấy danh mục', status: 404 }

    const exists = await masterDataAdminRepo.itemCodeExistsInCategory(categoryCode, body.code)
    if (exists) {
      return { success: false, error: `Mã '${body.code}' đã tồn tại trong danh mục này`, status: 409 }
    }

    const item = await masterDataAdminRepo.createItem({
      categoryCode,
      code: body.code,
      nameVi: body.nameVi,
      nameEn: body.nameEn ?? null,
      shortName: body.shortName ?? null,
      parentCode: body.parentCode ?? null,
      externalCode: body.externalCode ?? null,
      sortOrder: body.sortOrder ?? 0,
      metadata: body.metadata,
      createdBy: changedBy,
    })

    await masterDataAdminRepo.writeChangeLog({
      itemId: item.id,
      changeType: 'CREATE' as MdChangeType,
      newValue: item,
      changedBy,
    })

    await invalidateCategoryCache(categoryCode)
    return { success: true, data: undefined }
  },

  async updateItem(
    categoryCode: string,
    code: string,
    body: Partial<{
      nameVi: string
      nameEn: string | null
      shortName: string | null
      parentCode: string | null
      externalCode: string | null
      sortOrder: number
      metadata: unknown
    }> & { changeReason?: string },
    changedBy: string
  ): Promise<AdminResult> {
    const item = await masterDataAdminRepo.findItemByCode(categoryCode, code)
    if (!item) return { success: false, error: 'Không tìm thấy mục', status: 404 }

    // Build complete diff across ALL editable fields
    const TRACKED_FIELDS = [
      'nameVi', 'nameEn', 'shortName', 'parentCode',
      'externalCode', 'sortOrder', 'metadata',
    ] as const

    const diffs = buildDiff(
      item as Record<string, unknown>,
      body as Record<string, unknown>,
      TRACKED_FIELDS as unknown as string[]
    )

    const { changeReason, ...updateData } = body
    await masterDataAdminRepo.updateItem(categoryCode, code, updateData)

    if (diffs.length > 0) {
      await masterDataAdminRepo.writeChangeLog({
        itemId: item.id,
        changeType: 'UPDATE' as MdChangeType,
        oldValue: Object.fromEntries(diffs.map(d => [d.field, d.old])),
        newValue: Object.fromEntries(diffs.map(d => [d.field, d.new])),
        changedBy,
        changeReason: changeReason ?? null,
      })
    }

    await invalidateCategoryCache(categoryCode)
    return { success: true, data: undefined }
  },

  async toggleItemStatus(
    categoryCode: string,
    code: string,
    changedBy: string,
    changeReason?: string
  ): Promise<AdminResult> {
    const item = await masterDataAdminRepo.findItemByCode(categoryCode, code)
    if (!item) return { success: false, error: 'Không tìm thấy mục', status: 404 }

    if (item.isActive) {
      // Deactivating: block if active children exist
      const activeChildren = await masterDataAdminRepo.findActiveChildren(categoryCode, code)
      if (activeChildren.length > 0) {
        return {
          success: false,
          error: 'Không thể vô hiệu hóa: có mục con đang hoạt động phụ thuộc vào mục này',
          status: 409,
        }
      }
    } else {
      // Reactivating: category must be active
      const cat = await masterDataAdminRepo.findCategoryByCode(categoryCode)
      if (!cat?.isActive) {
        return { success: false, error: 'Danh mục cha đã bị vô hiệu hóa', status: 409 }
      }
      // Parent item must be active
      if (item.parentCode) {
        const parent = await masterDataAdminRepo.findItemByCode(categoryCode, item.parentCode)
        if (parent && !parent.isActive) {
          return {
            success: false,
            error: `Mục cha "${item.parentCode}" đang bị vô hiệu hóa. Hãy kích hoạt mục cha trước.`,
            status: 409,
          }
        }
      }
    }

    const newStatus = !item.isActive
    await masterDataAdminRepo.updateItem(categoryCode, code, { isActive: newStatus })

    await masterDataAdminRepo.writeChangeLog({
      itemId: item.id,
      changeType: (newStatus ? 'REACTIVATE' : 'DEACTIVATE') as MdChangeType,
      oldValue: { isActive: item.isActive },
      newValue: { isActive: newStatus },
      changedBy,
      changeReason: changeReason ?? null,
    })

    await invalidateCategoryCache(categoryCode)
    return { success: true, data: undefined }
  },

  // ─── Sort ──────────────────────────────────────────────────────────────────

  /**
   * Reorder items by updating sortOrder (index+1) for each code in `order`.
   * Only writes change log for items whose sortOrder actually changed.
   */
  async sortItems(
    categoryCode: string,
    order: string[],
    changedBy: string
  ): Promise<AdminResult> {
    if (!Array.isArray(order) || order.length === 0) {
      return { success: false, error: 'Thiếu mảng order', status: 400 }
    }

    // Validate all codes belong to this category
    const existing = await masterDataAdminRepo.findItemSortOrders(categoryCode, order)
    const existingMap = new Map(existing.map(i => [i.code, i]))

    const unknown = order.filter(c => !existingMap.has(c))
    if (unknown.length > 0) {
      return {
        success: false,
        error: `Mã không tồn tại trong danh mục: ${unknown.slice(0, 5).join(', ')}${unknown.length > 5 ? '...' : ''}`,
        status: 400,
      }
    }

    // Compute new sortOrders (1-based) and find only the changed ones
    const updates: { categoryCode: string; code: string; sortOrder: number }[] = []
    const logEntries: Parameters<typeof masterDataAdminRepo.bulkWriteChangeLogs>[0] = []

    order.forEach((code, idx) => {
      const newOrder = idx + 1
      const current = existingMap.get(code)!
      if (current.sortOrder !== newOrder) {
        updates.push({ categoryCode, code, sortOrder: newOrder })
        logEntries.push({
          itemId: current.id,
          changeType: 'UPDATE' as MdChangeType,
          fieldName: 'sortOrder',
          oldValue: { sortOrder: current.sortOrder },
          newValue: { sortOrder: newOrder },
          changedBy,
        })
      }
    })

    if (updates.length > 0) {
      await masterDataAdminRepo.bulkUpdateSortOrders(updates)
      await masterDataAdminRepo.bulkWriteChangeLogs(logEntries)
    }

    await invalidateCategoryCache(categoryCode)
    return { success: true, data: undefined }
  },

  // ─── Change log ────────────────────────────────────────────────────────────

  async getChangeLog(
    categoryCode: string,
    page?: number,
    limit?: number,
    filters?: { changeType?: string; itemCode?: string }
  ) {
    return masterDataAdminRepo.getChangeLog(categoryCode, {
      page,
      limit,
      changeType: filters?.changeType as MdChangeType | undefined,
      itemCode: filters?.itemCode,
    })
  },
}
