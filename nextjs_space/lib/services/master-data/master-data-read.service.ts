/**
 * MasterDataReadService – M19 MDM
 * Lớp service cho read layer của MDM.
 * - Dùng cache helper (Redis) cho reads thông thường
 * - Dùng repo khi bypass cache cần thiết
 * - Shapes output thành ServiceResult chuẩn
 *
 * Cache hook-points được đặt tại đây để Phase 3 (analytics/sync)
 * có thể thêm invalidation mà không phải sửa route.
 */
import 'server-only'
import {
  getCategoryByCode,
  getItemsByCategory,
  getItemTree,
  type MdCategory,
  type MdItem,
  type MdItemNode,
} from '@/lib/master-data-cache'
import { masterDataReadRepo } from '@/lib/repositories/master-data/master-data-read.repo'

// ─── Response types ───────────────────────────────────────────────────────────

export type CategoryWithItems = {
  category: MdCategory
  items: MdItem[]
}

export type CategoryWithTree = {
  category: MdCategory
  tree: MdItemNode[]
}

export type MdReadResult<T> =
  | { success: true; data: T; error: null }
  | { success: false; data: null; error: string }

// ─── Service ─────────────────────────────────────────────────────────────────

export const masterDataReadService = {
  /**
   * getCategoryWithItems
   * Trả về category + danh sách items đang active.
   * Cache hook-point: getItemsByCategory() dùng Redis với TTL theo cacheType.
   * Route: GET /api/master-data/[categoryCode]
   */
  async getCategoryWithItems(
    categoryCode: string,
    onlyActive = true
  ): Promise<MdReadResult<CategoryWithItems>> {
    try {
      // Cache hook-point #1: category lookup (TTL STATIC 24h)
      const category = await getCategoryByCode(categoryCode)
      if (!category) {
        return { success: false, data: null, error: `Không tìm thấy danh mục: ${categoryCode}` }
      }

      // Cache hook-point #2: items by category (TTL theo cacheType)
      const items = await getItemsByCategory(categoryCode, onlyActive)
      return { success: true, data: { category, items }, error: null }
    } catch (e) {
      console.error('[masterDataReadService.getCategoryWithItems]', e)
      return { success: false, data: null, error: 'Lỗi đọc dữ liệu danh mục' }
    }
  },

  /**
   * getCategoryTree
   * Trả về category + tree phân cấp.
   * Cache hook-point: getItemTree() dùng cùng cache với getCategoryWithItems.
   * Route: GET /api/master-data/[categoryCode]/tree
   */
  async getCategoryTree(
    categoryCode: string
  ): Promise<MdReadResult<CategoryWithTree>> {
    try {
      // Cache hook-point #1: category lookup
      const category = await getCategoryByCode(categoryCode)
      if (!category) {
        return { success: false, data: null, error: `Không tìm thấy danh mục: ${categoryCode}` }
      }

      // Cache hook-point #3: tree build (derived từ cache items)
      const tree = await getItemTree(categoryCode)
      return { success: true, data: { category, tree }, error: null }
    } catch (e) {
      console.error('[masterDataReadService.getCategoryTree]', e)
      return { success: false, data: null, error: 'Lỗi đọc cây danh mục' }
    }
  },

  /**
   * getCategoryByCodeDirect
   * Bypass cache – dùng cho admin/seed/sync cần dữ liệu fresh.
   * Gọi thẳng repo, không qua Redis.
   */
  async getCategoryByCodeDirect(categoryCode: string) {
    return masterDataReadRepo.findCategoryByCode(categoryCode)
  },
}
