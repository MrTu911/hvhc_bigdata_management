/**
 * MasterDataCacheService – M19 MDM Phase 1
 * Business logic for cache management operations.
 */
import {
  invalidateCategoryCache,
  invalidateAllMasterDataCache,
  getCategoryByCode,
  getItemCacheTtls,
  type CategoryTtlEntry,
} from '@/lib/master-data-cache'
import { getCacheStatus, getCacheStats, type CacheStats } from '@/lib/cache'
import db from '@/lib/db'
import type { AdminResult } from './types'

export type { AdminResult }

// ─── Types ────────────────────────────────────────────────────────────────────

export type CacheStatusResponse = {
  backend: ReturnType<typeof getCacheStatus>
  stats: {
    activeCategories: number
    activeItems: number
  }
  hitStats: CacheStats
  /** TTL remaining per category for the primary active-items key. */
  categoryTtls: CategoryTtlEntry[]
}

export type FlushResult = {
  flushed: 'all' | 'category'
  categoryCode?: string
  keyCount: number
}

// ─── Service methods ──────────────────────────────────────────────────────────

export async function getCacheOverview(): Promise<AdminResult<CacheStatusResponse>> {
  try {
    const cacheStatus = getCacheStatus()
    const [activeCategories, activeItems, hitStats, categoryRows] = await Promise.all([
      db.masterCategory.count({ where: { isActive: true } }),
      db.masterDataItem.count({ where: { isActive: true } }),
      getCacheStats(),
      db.masterCategory.findMany({
        where: { isActive: true },
        select: { code: true },
        orderBy: { sortOrder: 'asc' },
      }),
    ])

    const categoryTtls = await getItemCacheTtls(categoryRows.map(r => r.code))

    return {
      success: true,
      data: {
        backend: cacheStatus,
        stats: { activeCategories, activeItems },
        hitStats,
        categoryTtls,
      },
    }
  } catch (e) {
    console.error('[MasterDataCacheService.getCacheOverview]', e)
    return { success: false, error: 'Lỗi hệ thống', status: 500 }
  }
}

export async function flushAll(
  flushedBy = 'system'
): Promise<AdminResult<FlushResult>> {
  try {
    const keyCount = await invalidateAllMasterDataCache()
    // Write audit log — fire-and-forget (do not block on failure)
    db.masterDataFlushLog.create({
      data: { scope: 'ALL', flushedBy, keyCount },
    }).catch(err => console.warn('[MasterDataCacheService.flushAll] audit log failed:', err))
    return { success: true, data: { flushed: 'all', keyCount } }
  } catch (e) {
    console.error('[MasterDataCacheService.flushAll]', e)
    return { success: false, error: 'Lỗi xóa cache', status: 500 }
  }
}

export async function flushCategory(
  categoryCode: string,
  flushedBy = 'system'
): Promise<AdminResult<FlushResult>> {
  try {
    const cat = await getCategoryByCode(categoryCode)
    if (!cat) {
      return { success: false, error: 'Không tìm thấy danh mục', status: 404 }
    }

    const keyCount = await invalidateCategoryCache(categoryCode)
    // Write audit log — fire-and-forget
    db.masterDataFlushLog.create({
      data: { scope: categoryCode, flushedBy, keyCount },
    }).catch(err => console.warn('[MasterDataCacheService.flushCategory] audit log failed:', err))
    return { success: true, data: { flushed: 'category', categoryCode, keyCount } }
  } catch (e) {
    console.error('[MasterDataCacheService.flushCategory]', e)
    return { success: false, error: 'Lỗi xóa cache danh mục', status: 500 }
  }
}
