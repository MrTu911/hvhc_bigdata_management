/**
 * ScienceCatalogService – CSDL-KHQL Phase 1 (M01)
 * Business logic cho danh mục KH: tạo mã tự động, validate hierarchy,
 * build path LTREE, cache invalidation.
 *
 * Không phụ thuộc vào /api/research/* hoặc các service M09 cũ.
 */
import 'server-only'
import { scienceCatalogRepo } from '@/lib/repositories/science/catalog.repo'
import { getCache, setCache, deleteCache } from '@/lib/cache'
import { logAudit } from '@/lib/audit'
import type {
  ScienceCatalogCreateInput,
  ScienceCatalogUpdateInput,
  ScienceCatalogType,
  ScienceCatalogListFilter,
} from '@/lib/validations/science-catalog'

export type CatalogListFilter = ScienceCatalogListFilter

// ─── Cache keys ────────────────────────────────────────────────────────────────
const CACHE_TTL_SECONDS = 3600 // 1 giờ per design doc
const cacheKey = (type?: string) =>
  type ? `science:catalog:type:${type}` : 'science:catalog:all'

// ─── Type → short prefix mapping (dùng trong code gen) ────────────────────────
const TYPE_PREFIXES: Record<ScienceCatalogType, string> = {
  FIELD: 'FLD',
  WORK_TYPE: 'WKT',
  PUBLISHER: 'PUB',
  FUND_SOURCE: 'FND',
  LEVEL: 'LVL',
  RESEARCH_AREA: 'RAS',
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const scienceCatalogService = {
  /**
   * Lấy danh sách danh mục với cache.
   * Cache key theo type – nếu không filter type thì cache toàn bộ.
   */
  async listCatalogs(filter: CatalogListFilter) {
    // Chỉ cache khi không có pagination đặc biệt và không có keyword search
    const cacheable = !filter.keyword && filter.page === 1 && (filter.pageSize ?? 50) >= 50
    if (cacheable) {
      const key = cacheKey(filter.type)
      const cached = await getCache<Awaited<ReturnType<typeof scienceCatalogRepo.findMany>>>(key)
      if (cached) return { success: true as const, data: cached }
    }

    const result = await scienceCatalogRepo.findMany(filter)

    if (cacheable) {
      await setCache(cacheKey(filter.type), result, CACHE_TTL_SECONDS)
    }

    return { success: true as const, data: result }
  },

  /**
   * Lấy chi tiết một catalog theo id.
   */
  async getCatalogById(id: string) {
    const item = await scienceCatalogRepo.findById(id)
    if (!item) return { success: false as const, error: 'Không tìm thấy danh mục' }
    return { success: true as const, data: item }
  },

  /**
   * Tạo mã định danh tự động theo format: HVHC-{YEAR}-{PREFIX}-{SEQ:03d}
   * VD: HVHC-2026-FLD-001
   */
  async generateCode(type: ScienceCatalogType, year?: number): Promise<string> {
    const targetYear = year ?? new Date().getFullYear()
    const prefix = TYPE_PREFIXES[type]
    const seq = await scienceCatalogRepo.nextSequence(type, targetYear)
    return `HVHC-${targetYear}-${prefix}-${String(seq).padStart(3, '0')}`
  },

  /**
   * Tạo danh mục mới.
   * - Tự sinh code nếu không có.
   * - Tính level và path dựa trên parent.
   * - Invalidate cache.
   */
  async createCatalog(
    input: ScienceCatalogCreateInput,
    createdById: string,
    ipAddress?: string
  ) {
    // Validate parent nếu có
    let level = 1
    let path = ''

    if (input.parentId) {
      const parent = await scienceCatalogRepo.findById(input.parentId)
      if (!parent) {
        return { success: false as const, error: 'Danh mục cha không tồn tại' }
      }
      if (parent.type !== input.type) {
        return {
          success: false as const,
          error: `Danh mục cha phải cùng loại "${input.type}"`,
        }
      }
      level = parent.level + 1
      path = parent.path ? `${parent.path}.` : ''
    }

    const code = await scienceCatalogService.generateCode(input.type as ScienceCatalogType)
    // Path LTREE: dùng code slug (lowercase, dấu - thay dấu .)
    const slug = code.toLowerCase().replace(/-/g, '_')
    path = `${path}${slug}`

    const created = await scienceCatalogRepo.create({
      ...input,
      code,
      createdById,
      level,
      path,
    })

    await scienceCatalogService._invalidateCache(input.type)

    await logAudit({
      userId: createdById,
      functionCode: 'MANAGE_SCIENCE_CATALOG',
      action: 'CREATE',
      resourceType: 'SCIENCE_CATALOG',
      resourceId: created.id,
      result: 'SUCCESS',
      ipAddress,
    })

    return { success: true as const, data: created }
  },

  /**
   * Cập nhật tên / mô tả / trạng thái.
   * Không cho thay đổi type và parentId.
   */
  async updateCatalog(
    id: string,
    input: ScienceCatalogUpdateInput,
    userId: string,
    ipAddress?: string
  ) {
    const existing = await scienceCatalogRepo.findById(id)
    if (!existing) return { success: false as const, error: 'Không tìm thấy danh mục' }

    const updated = await scienceCatalogRepo.update(id, input)

    await scienceCatalogService._invalidateCache(existing.type)

    await logAudit({
      userId,
      functionCode: 'MANAGE_SCIENCE_CATALOG',
      action: 'UPDATE',
      resourceType: 'SCIENCE_CATALOG',
      resourceId: id,
      result: 'SUCCESS',
      ipAddress,
    })

    return { success: true as const, data: updated }
  },

  /**
   * Soft delete (isActive = false).
   * Không cho xóa nếu còn danh mục con đang active.
   */
  async deleteCatalog(id: string, userId: string, ipAddress?: string) {
    const existing = await scienceCatalogRepo.findById(id)
    if (!existing) return { success: false as const, error: 'Không tìm thấy danh mục' }

    const hasChildren = await scienceCatalogRepo.hasChildren(id)
    if (hasChildren) {
      return {
        success: false as const,
        error: 'Không thể vô hiệu hóa danh mục đang có danh mục con',
      }
    }

    await scienceCatalogRepo.softDelete(id)
    await scienceCatalogService._invalidateCache(existing.type)

    await logAudit({
      userId,
      functionCode: 'MANAGE_SCIENCE_CATALOG',
      action: 'DELETE',
      resourceType: 'SCIENCE_CATALOG',
      resourceId: id,
      result: 'SUCCESS',
      ipAddress,
    })

    return { success: true as const }
  },

  // ─── Internal ───────────────────────────────────────────────────────────────

  async _invalidateCache(type: string) {
    await Promise.all([
      deleteCache(cacheKey(type)),
      deleteCache(cacheKey()), // invalidate "all" cache cũng
    ])
  },
}
