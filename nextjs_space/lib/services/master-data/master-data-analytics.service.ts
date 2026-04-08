/**
 * MasterDataAnalyticsService – M19 MDM Phase 3
 *
 * Usage analytics via proxy signals (no schema migration needed):
 *   - updatedAt / ChangeLog createdAt  → activity signal
 *   - validTo < now && isActive=true   → expired candidates
 *   - isActive=false                   → deactivated items
 *   - no ChangeLog AND old createdAt   → never-touched / unused candidates
 *
 * Global mode (no categoryCode): aggregation only, no row-level listing.
 * Per-category mode: full item-level breakdown + unusedCandidates list.
 */
import * as analyticsRepo from '@/lib/repositories/master-data/master-data-analytics.repo'
import * as syncRepo from '@/lib/repositories/master-data/master-data-sync.repo'
import { getCacheStats, type CacheStats } from '@/lib/cache'
import type { AdminResult } from './types'

export type { AdminResult }

// ─── Types ────────────────────────────────────────────────────────────────────

export type UsageSummary = {
  totalActiveItems: number
  itemsWithRecentActivity: number // has ChangeLog within staleThresholdDays
  staleItems: number              // active, updatedAt older than staleThresholdDays
  expiredItems: number            // isActive=true AND validTo < now
}

export type CategoryUsageStat = {
  categoryCode: string
  nameVi: string
  total: number
  active: number
  inactive: number
  expired: number
  stale: number
  recentActivity: number
}

export type UnusedCandidate = {
  id: string
  categoryCode: string
  code: string
  nameVi: string
  isActive: boolean
  isExpired: boolean
  activityCount: number
  lastActivityAt: string | null // ISO string
  createdAt: string
  updatedAt: string
  reason: 'never_modified' | 'stale' | 'expired'
}

export type RecentlyModifiedItem = {
  id: string
  categoryCode: string
  code: string
  nameVi: string
  activityCount: number
  lastActivityAt: string // ISO string
}

export type WeeklyTrendEntry = analyticsRepo.WeeklyTrendEntry

export type UsageAnalyticsResponse = {
  generatedAt: string
  scope: {
    categoryCode: string | null
    staleAfterDays: number
    startDate: string | null
    endDate: string | null
  }
  summary: UsageSummary
  byCategory: CategoryUsageStat[]  // empty when categoryCode specified
  unusedCandidates: UnusedCandidate[]
  recentlyModified: RecentlyModifiedItem[]
  /** ChangeLog activity per ISO week for the past 12 weeks. Weeks with no activity are omitted. */
  weeklyTrend: WeeklyTrendEntry[]
}

export type AnalyticsOverviewResponse = {
  summary: {
    totalCategories: number
    activeCategories: number
    totalItems: number
    activeItems: number
    inactiveItems: number
    recentChanges7d: number
  }
  byGroup: { groupTag: string | null; count: number }[]
  topCategories: { categoryCode: string; nameVi: string; itemCount: number }[]
  recentSyncs: syncRepo.SyncLogWithCategory[]
  cacheStats: CacheStats & { derived: { hitRate: string | null; totalRequests: number } }
}

// ─── Service methods ──────────────────────────────────────────────────────────

/** Overview statistics for the main analytics dashboard. */
export async function getAnalyticsOverview(): Promise<AdminResult<AnalyticsOverviewResponse>> {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

    const [counts, byGroup, topCats, recentSyncs, cacheStats] = await Promise.all([
      analyticsRepo.getOverviewCounts(sevenDaysAgo),
      analyticsRepo.getCategoriesByGroup(),
      analyticsRepo.getTopCategoriesByItemCount(10),
      syncRepo.findRecentSyncLogs(5),
      getCacheStats(),
    ])

    const nameRows = await analyticsRepo.getCategoryNames(topCats.map(c => c.categoryCode))
    const nameMap = Object.fromEntries(nameRows.map(r => [r.code, r.nameVi]))

    const { hits, misses } = cacheStats.inProcess
    const total = hits + misses
    const hitRate = total > 0 ? Math.round((hits / total) * 10000) / 100 : null

    return {
      success: true,
      data: {
        summary: {
          totalCategories: counts.totalCategories,
          activeCategories: counts.activeCategories,
          totalItems: counts.totalItems,
          activeItems: counts.activeItems,
          inactiveItems: counts.totalItems - counts.activeItems,
          recentChanges7d: counts.recentChanges7d,
        },
        byGroup,
        topCategories: topCats.map(c => ({
          categoryCode: c.categoryCode,
          nameVi: nameMap[c.categoryCode] ?? c.categoryCode,
          itemCount: c.itemCount,
        })),
        recentSyncs,
        cacheStats: {
          ...cacheStats,
          derived: {
            hitRate: hitRate !== null ? `${hitRate}%` : null,
            totalRequests: total,
          },
        },
      },
    }
  } catch (e) {
    console.error('[MasterDataAnalyticsService.getAnalyticsOverview]', e)
    return { success: false, error: 'Lỗi hệ thống', status: 500 }
  }
}

export async function getUsageAnalytics(
  categoryCode?: string,
  staleAfterDays = 90,
  limit = 50,
  startDate?: Date,
  endDate?: Date,
): Promise<AdminResult<UsageAnalyticsResponse>> {
  try {
    const now = endDate ?? new Date()
    const staleThreshold = new Date(now.getTime() - staleAfterDays * 24 * 60 * 60 * 1000)
    // recentSince: use startDate if provided, else default stale window
    const recentSince = startDate ?? staleThreshold

    // ── Global summary (always computed) ─────────────────────────────────────
    const [totalActiveItems, expiredItems, staleItems, itemsWithRecentActivity] =
      await Promise.all([
        analyticsRepo.countActiveItems(categoryCode),
        analyticsRepo.countExpiredActive(now, categoryCode),
        analyticsRepo.countStaleItems(staleThreshold, categoryCode),
        analyticsRepo.countItemsWithRecentActivity(recentSince, categoryCode),
      ])

    const summary: UsageSummary = {
      totalActiveItems,
      itemsWithRecentActivity,
      staleItems,
      expiredItems,
    }

    // ── Per-category breakdown (global mode only) ─────────────────────────────
    let byCategory: CategoryUsageStat[] = []
    if (!categoryCode) {
      const [catStats, expiredByCategory, staleByCategory, recentByCategory] =
        await Promise.all([
          analyticsRepo.getCategoryItemCounts(),
          analyticsRepo.getExpiredPerCategory(now),
          analyticsRepo.getStalePerCategory(staleThreshold),
          analyticsRepo.getRecentActivityPerCategory(recentSince),
        ])

      const codes = catStats.map(s => s.categoryCode)
      const nameRows = await analyticsRepo.getCategoryNames(codes)
      const nameMap = Object.fromEntries(nameRows.map(r => [r.code, r.nameVi]))
      const expiredMap = Object.fromEntries(expiredByCategory.map(r => [r.categoryCode, r.count]))
      const staleMap = Object.fromEntries(staleByCategory.map(r => [r.categoryCode, r.count]))
      const recentMap = Object.fromEntries(recentByCategory.map(r => [r.categoryCode, r.count]))

      byCategory = catStats.map(s => ({
        categoryCode: s.categoryCode,
        nameVi: nameMap[s.categoryCode] ?? s.categoryCode,
        total: s.total,
        active: s.active,
        inactive: s.inactive,
        expired: expiredMap[s.categoryCode] ?? 0,
        stale: staleMap[s.categoryCode] ?? 0,
        recentActivity: recentMap[s.categoryCode] ?? 0,
      }))
    }

    // ── Per-item detail (per-category mode) ────────────────────────────────────
    let unusedCandidates: UnusedCandidate[] = []
    if (categoryCode) {
      const items = await analyticsRepo.findItemsByCategoryWithMeta(categoryCode)
      const itemIds = items.map(i => i.id)
      const activityMap = new Map(
        (await analyticsRepo.findActivityMap(itemIds)).map(a => [a.itemId, a])
      )

      const candidates: UnusedCandidate[] = []
      for (const item of items) {
        const activity = activityMap.get(item.id)
        const isExpired = !!item.validTo && item.validTo < now
        const isStale = item.isActive && item.updatedAt < staleThreshold
        const neverModified = !activity && item.isActive

        let reason: UnusedCandidate['reason'] | null = null
        if (isExpired) reason = 'expired'
        else if (neverModified) reason = 'never_modified'
        else if (isStale) reason = 'stale'

        if (reason) {
          candidates.push({
            id: item.id,
            categoryCode: item.categoryCode,
            code: item.code,
            nameVi: item.nameVi,
            isActive: item.isActive,
            isExpired,
            activityCount: activity?.activityCount ?? 0,
            lastActivityAt: activity?.lastActivityAt?.toISOString() ?? null,
            createdAt: item.createdAt.toISOString(),
            updatedAt: item.updatedAt.toISOString(),
            reason,
          })
        }
      }

      // Sort: expired first, then never_modified, then stale
      const ORDER = { expired: 0, never_modified: 1, stale: 2 }
      candidates.sort((a, b) => ORDER[a.reason] - ORDER[b.reason])
      unusedCandidates = candidates.slice(0, limit)
    }

    // ── Weekly trend: use date range if specified, else past 12 weeks ──────────
    const trendSince = startDate ?? new Date(now.getTime() - 12 * 7 * 24 * 60 * 60 * 1000)
    const weeklyTrend = await analyticsRepo.getChangeLogWeeklyTrend(trendSince, categoryCode, endDate)

    // ── Recently modified (top N, scoped or global) ────────────────────────────
    const recentRows = await analyticsRepo.findRecentlyModifiedItems(
      recentSince,
      Math.min(limit, 20),
      categoryCode
    )
    const recentItemRows = await analyticsRepo.findItemsByIds(recentRows.map(r => r.itemId))
    const recentItemMap = new Map(recentItemRows.map(i => [i.id, i]))

    const recentlyModified: RecentlyModifiedItem[] = recentRows
      .map(r => {
        const item = recentItemMap.get(r.itemId)
        if (!item) return null
        return {
          id: item.id,
          categoryCode: item.categoryCode,
          code: item.code,
          nameVi: item.nameVi,
          activityCount: r.activityCount,
          lastActivityAt: r.lastActivityAt.toISOString(),
        }
      })
      .filter((r): r is RecentlyModifiedItem => r !== null)

    return {
      success: true,
      data: {
        generatedAt: now.toISOString(),
        scope: {
          categoryCode: categoryCode ?? null,
          staleAfterDays,
          startDate: startDate?.toISOString() ?? null,
          endDate: endDate?.toISOString() ?? null,
        },
        summary,
        byCategory,
        unusedCandidates,
        recentlyModified,
        weeklyTrend,
      },
    }
  } catch (e) {
    console.error('[MasterDataAnalyticsService.getUsageAnalytics]', e)
    return { success: false, error: 'Lỗi hệ thống', status: 500 }
  }
}
