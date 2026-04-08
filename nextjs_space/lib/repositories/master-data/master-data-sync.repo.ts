/**
 * Repository – MasterDataSyncLog
 * Data access only. No business logic.
 */
import db from '@/lib/db'

export type SyncLogRow = {
  id: string
  categoryCode: string
  syncSource: string
  syncStatus: string
  syncedAt: Date
  addedCount: number
  updatedCount: number
  deactivatedCount: number
  errorCount: number
  logDetail: unknown
  triggeredBy: string
}

export type SyncLogSummary = {
  categoryCode: string
  syncSource: string
  syncStatus: string
  syncedAt: Date
  addedCount: number
  updatedCount: number
  deactivatedCount: number
  errorCount: number
  triggeredBy: string
}

export type CreateSyncLogInput = {
  categoryCode: string
  syncSource: string
  syncStatus: string
  addedCount?: number
  updatedCount?: number
  deactivatedCount?: number
  errorCount?: number
  logDetail?: unknown
  triggeredBy: string
}

export type SyncAggregateTotals = {
  added: number
  updated: number
  deactivated: number
  errors: number
  totalSyncs: number
  syncJobsWithErrors: number
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export async function findLatestPerCategory(): Promise<SyncLogSummary[]> {
  return db.masterDataSyncLog.findMany({
    orderBy: { syncedAt: 'desc' },
    distinct: ['categoryCode'],
    select: {
      categoryCode: true,
      syncSource: true,
      syncStatus: true,
      syncedAt: true,
      addedCount: true,
      updatedCount: true,
      deactivatedCount: true,
      errorCount: true,
      triggeredBy: true,
    },
  }) as Promise<SyncLogSummary[]>
}

export async function findLatestGlobalSync(): Promise<{ syncedAt: Date } | null> {
  return db.masterDataSyncLog.findFirst({
    orderBy: { syncedAt: 'desc' },
    select: { syncedAt: true },
  })
}

export async function findLast30DaysAggregates(): Promise<SyncAggregateTotals> {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  const [totals, syncJobsWithErrors, totalSyncs] = await Promise.all([
    db.masterDataSyncLog.aggregate({
      where: { syncedAt: { gte: since } },
      _sum: {
        addedCount: true,
        updatedCount: true,
        deactivatedCount: true,
        errorCount: true,
      },
    }),
    db.masterDataSyncLog.count({
      where: { errorCount: { gt: 0 }, syncedAt: { gte: since } },
    }),
    db.masterDataSyncLog.count({ where: { syncedAt: { gte: since } } }),
  ])

  return {
    added: totals._sum.addedCount ?? 0,
    updated: totals._sum.updatedCount ?? 0,
    deactivated: totals._sum.deactivatedCount ?? 0,
    errors: totals._sum.errorCount ?? 0,
    totalSyncs,
    syncJobsWithErrors,
  }
}

export async function findByCategory(
  categoryCode: string,
  limit: number
): Promise<SyncLogRow[]> {
  return db.masterDataSyncLog.findMany({
    where: { categoryCode },
    orderBy: { syncedAt: 'desc' },
    take: limit,
  }) as Promise<SyncLogRow[]>
}

export type SyncLogWithCategory = SyncLogRow & {
  category: { code: string; nameVi: string } | null
}

/** Most recent N sync log entries with category name, across all categories. */
export async function findRecentSyncLogs(limit: number): Promise<SyncLogWithCategory[]> {
  const rows = await db.masterDataSyncLog.findMany({
    orderBy: { syncedAt: 'desc' },
    take: limit,
    include: { category: { select: { code: true, nameVi: true } } },
  })
  return rows as unknown as SyncLogWithCategory[]
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export async function createSyncLog(input: CreateSyncLogInput): Promise<SyncLogRow> {
  return db.masterDataSyncLog.create({
    data: {
      categoryCode: input.categoryCode,
      syncSource: input.syncSource,
      syncStatus: input.syncStatus,
      addedCount: input.addedCount ?? 0,
      updatedCount: input.updatedCount ?? 0,
      deactivatedCount: input.deactivatedCount ?? 0,
      errorCount: input.errorCount ?? 0,
      logDetail: (input.logDetail ?? null) as any,
      triggeredBy: input.triggeredBy,
    },
  }) as Promise<SyncLogRow>
}
