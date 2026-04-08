/**
 * Repository – MDM Analytics
 * Prisma queries only. Joining and computation live in the service.
 */
import db from '@/lib/db'

// ─── Types ────────────────────────────────────────────────────────────────────

export type ItemRow = {
  id: string
  categoryCode: string
  code: string
  nameVi: string
  isActive: boolean
  validTo: Date | null
  createdAt: Date
  updatedAt: Date
}

export type ActivityMapEntry = {
  itemId: string
  activityCount: number
  lastActivityAt: Date
}

export type CategoryStat = {
  categoryCode: string
  total: number
  active: number
  inactive: number
}

export type CategoryNameRow = {
  code: string
  nameVi: string
}

// ─── Summary aggregation queries (no row scan) ────────────────────────────────

export async function countActiveItems(categoryCode?: string): Promise<number> {
  return db.masterDataItem.count({
    where: { ...(categoryCode ? { categoryCode } : {}), isActive: true },
  })
}

export async function countExpiredActive(
  now: Date,
  categoryCode?: string
): Promise<number> {
  return db.masterDataItem.count({
    where: {
      ...(categoryCode ? { categoryCode } : {}),
      isActive: true,
      validTo: { lt: now },
    },
  })
}

/** Items that have not been touched since `before` (using updatedAt as proxy). */
export async function countStaleItems(
  before: Date,
  categoryCode?: string
): Promise<number> {
  return db.masterDataItem.count({
    where: {
      ...(categoryCode ? { categoryCode } : {}),
      isActive: true,
      updatedAt: { lt: before },
    },
  })
}

/** Items with at least one ChangeLog entry since `since`. */
export async function countItemsWithRecentActivity(
  since: Date,
  categoryCode?: string
): Promise<number> {
  const result = await db.masterDataChangeLog.findMany({
    where: {
      createdAt: { gte: since },
      ...(categoryCode
        ? { item: { categoryCode } }
        : {}),
    },
    distinct: ['itemId'],
    select: { itemId: true },
  })
  return result.length
}

// ─── Per-category breakdown ───────────────────────────────────────────────────

export async function getCategoryItemCounts(): Promise<CategoryStat[]> {
  const [active, inactive] = await Promise.all([
    db.masterDataItem.groupBy({
      by: ['categoryCode'],
      where: { isActive: true },
      _count: { id: true },
    }),
    db.masterDataItem.groupBy({
      by: ['categoryCode'],
      where: { isActive: false },
      _count: { id: true },
    }),
  ])

  const map = new Map<string, CategoryStat>()
  for (const row of active) {
    map.set(row.categoryCode, {
      categoryCode: row.categoryCode,
      total: row._count.id,
      active: row._count.id,
      inactive: 0,
    })
  }
  for (const row of inactive) {
    const existing = map.get(row.categoryCode)
    if (existing) {
      existing.inactive = row._count.id
      existing.total += row._count.id
    } else {
      map.set(row.categoryCode, {
        categoryCode: row.categoryCode,
        total: row._count.id,
        active: 0,
        inactive: row._count.id,
      })
    }
  }
  return Array.from(map.values())
}

export async function getCategoryNames(
  codes: string[]
): Promise<CategoryNameRow[]> {
  if (codes.length === 0) return []
  return db.masterCategory.findMany({
    where: { code: { in: codes } },
    select: { code: true, nameVi: true },
  })
}

// ─── Per-item queries (scoped to one category) ────────────────────────────────

export async function findItemsByCategoryWithMeta(
  categoryCode: string,
  limit?: number
): Promise<ItemRow[]> {
  return db.masterDataItem.findMany({
    where: { categoryCode },
    select: {
      id: true,
      categoryCode: true,
      code: true,
      nameVi: true,
      isActive: true,
      validTo: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: 'asc' },
    ...(limit !== undefined ? { take: limit } : {}),
  }) as Promise<ItemRow[]>
}

/**
 * Returns ChangeLog activity summary per itemId.
 * Only includes itemIds that have at least one log entry.
 */
export async function findActivityMap(
  itemIds: string[]
): Promise<ActivityMapEntry[]> {
  if (itemIds.length === 0) return []

  const rows = await db.masterDataChangeLog.groupBy({
    by: ['itemId'],
    where: { itemId: { in: itemIds } },
    _count: { id: true },
    _max: { createdAt: true },
  })

  return rows.map(r => ({
    itemId: r.itemId,
    activityCount: r._count.id,
    lastActivityAt: r._max.createdAt as Date,
  }))
}

/** Most recently modified items across all categories. */
export async function findRecentlyModifiedItems(
  since: Date,
  limit: number,
  categoryCode?: string
): Promise<{ itemId: string; activityCount: number; lastActivityAt: Date }[]> {
  const rows = await db.masterDataChangeLog.groupBy({
    by: ['itemId'],
    where: {
      createdAt: { gte: since },
      ...(categoryCode ? { item: { categoryCode } } : {}),
    },
    _count: { id: true },
    _max: { createdAt: true },
    orderBy: { _max: { createdAt: 'desc' } },
    take: limit,
  })

  return rows.map(r => ({
    itemId: r.itemId,
    activityCount: r._count.id,
    lastActivityAt: r._max.createdAt as Date,
  }))
}

/** Fetch minimal item data for a list of item ids. */
export async function findItemsByIds(
  ids: string[]
): Promise<Pick<ItemRow, 'id' | 'categoryCode' | 'code' | 'nameVi'>[]> {
  if (ids.length === 0) return []
  return db.masterDataItem.findMany({
    where: { id: { in: ids } },
    select: { id: true, categoryCode: true, code: true, nameVi: true },
  }) as Promise<Pick<ItemRow, 'id' | 'categoryCode' | 'code' | 'nameVi'>[]>
}

// ─── Overview aggregation queries (for analytics dashboard) ───────────────────

export type OverviewCounts = {
  totalCategories: number
  activeCategories: number
  totalItems: number
  activeItems: number
  recentChanges7d: number
}

export async function getOverviewCounts(recentSince: Date): Promise<OverviewCounts> {
  const [totalCategories, activeCategories, totalItems, activeItems, recentChanges] =
    await Promise.all([
      db.masterCategory.count(),
      db.masterCategory.count({ where: { isActive: true } }),
      db.masterDataItem.count(),
      db.masterDataItem.count({ where: { isActive: true } }),
      db.masterDataChangeLog.count({ where: { createdAt: { gte: recentSince } } }),
    ])
  return { totalCategories, activeCategories, totalItems, activeItems, recentChanges7d: recentChanges }
}

export type GroupCount = { groupTag: string | null; count: number }

export async function getCategoriesByGroup(): Promise<GroupCount[]> {
  const rows = await db.masterCategory.groupBy({
    by: ['groupTag'],
    _count: { id: true },
    where: { isActive: true },
  })
  return rows.map(g => ({ groupTag: g.groupTag, count: g._count.id }))
}

export type TopCategoryRow = { categoryCode: string; itemCount: number }

export async function getTopCategoriesByItemCount(limit: number): Promise<TopCategoryRow[]> {
  const rows = await db.masterDataItem.groupBy({
    by: ['categoryCode'],
    _count: { id: true },
    where: { isActive: true },
    orderBy: { _count: { id: 'desc' } },
    take: limit,
  })
  return rows.map(r => ({ categoryCode: r.categoryCode, itemCount: r._count.id }))
}

// ─── Per-category breakdown helpers (moved from analytics service) ─────────────

export type CategoryCountEntry = { categoryCode: string; count: number }

export async function getExpiredPerCategory(now: Date): Promise<CategoryCountEntry[]> {
  const rows = await db.masterDataItem.groupBy({
    by: ['categoryCode'],
    where: { isActive: true, validTo: { lt: now } },
    _count: { id: true },
  })
  return rows.map(r => ({ categoryCode: r.categoryCode, count: r._count.id }))
}

export async function getStalePerCategory(before: Date): Promise<CategoryCountEntry[]> {
  const rows = await db.masterDataItem.groupBy({
    by: ['categoryCode'],
    where: { isActive: true, updatedAt: { lt: before } },
    _count: { id: true },
  })
  return rows.map(r => ({ categoryCode: r.categoryCode, count: r._count.id }))
}

/**
 * Items with at least one ChangeLog entry since `since`, grouped by category.
 * Uses two queries because Prisma doesn't support distinct-count in groupBy.
 */
// ─── Time-series trend ────────────────────────────────────────────────────────

export type WeeklyTrendEntry = { week: string; count: number }

/**
 * Returns ChangeLog activity grouped by ISO week (Monday-based).
 * Uses a raw PostgreSQL query with date_trunc for efficiency.
 * Weeks with zero activity are omitted — fill gaps on the client if needed.
 */
export async function getChangeLogWeeklyTrend(
  since: Date,
  categoryCode?: string,
  until?: Date,
): Promise<WeeklyTrendEntry[]> {
  // Default upper bound = now
  const upperBound = until ?? new Date()
  if (categoryCode) {
    const rows = await db.$queryRaw<{ week: Date; count: bigint }[]>`
      SELECT date_trunc('week', cl.created_at)::date AS week,
             COUNT(*)::int                            AS count
      FROM   master_data_change_logs cl
      JOIN   master_data_items i ON i.id = cl.item_id
      WHERE  cl.created_at >= ${since}
        AND  cl.created_at <= ${upperBound}
        AND  i.category_code = ${categoryCode}
      GROUP  BY 1
      ORDER  BY 1
    `
    return rows.map(r => ({ week: r.week.toISOString().slice(0, 10), count: Number(r.count) }))
  }
  const rows = await db.$queryRaw<{ week: Date; count: bigint }[]>`
    SELECT date_trunc('week', created_at)::date AS week,
           COUNT(*)::int                        AS count
    FROM   master_data_change_logs
    WHERE  created_at >= ${since}
      AND  created_at <= ${upperBound}
    GROUP  BY 1
    ORDER  BY 1
  `
  return rows.map(r => ({ week: r.week.toISOString().slice(0, 10), count: Number(r.count) }))
}

export async function getRecentActivityPerCategory(since: Date): Promise<CategoryCountEntry[]> {
  const recentItemIds = await db.masterDataChangeLog.findMany({
    where: { createdAt: { gte: since } },
    distinct: ['itemId'],
    select: { itemId: true },
  })
  if (recentItemIds.length === 0) return []

  const rows = await db.masterDataItem.groupBy({
    by: ['categoryCode'],
    where: { id: { in: recentItemIds.map(r => r.itemId) } },
    _count: { id: true },
  })
  return rows.map(r => ({ categoryCode: r.categoryCode, count: r._count.id }))
}
