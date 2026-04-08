/**
 * MasterDataSyncService – M19 MDM Phase 1
 * Business logic for sync operations.
 * Only categories with sourceType BQP or NATIONAL may be externally synced.
 */
import * as syncRepo from '@/lib/repositories/master-data/master-data-sync.repo'
import { invalidateCategoryCache } from '@/lib/master-data-cache'
import db from '@/lib/db'
import type { AdminResult } from './types'

export type { AdminResult }

// ─── Types ────────────────────────────────────────────────────────────────────

export type SyncStatusResponse = {
  /**
   * BQP integration placeholder.
   * Will be true/false once BQP API is live and can report queued items.
   * Always null until then — do not use for business logic yet.
   */
  hasPending: null
  lastGlobalSync: Date | null
  last30Days: {
    totalSyncs: number
    added: number
    updated: number
    deactivated: number
    errors: number
    syncJobsWithErrors: number
  }
  perCategory: syncRepo.SyncLogSummary[]
}

export type TriggerSyncInput = {
  categoryCode: string
  triggeredBy: string
  dryRun?: boolean
}

export type TriggerSyncResult = {
  categoryCode: string
  syncStatus: string
  addedCount: number
  updatedCount: number
  deactivatedCount: number
  errorCount: number
  dryRun: boolean
  syncLogId: string
}

// ─── Allowed source types for external sync ───────────────────────────────────

const SYNCABLE_SOURCE_TYPES = ['BQP', 'NATIONAL'] as const
type SyncableSourceType = typeof SYNCABLE_SOURCE_TYPES[number]

function isSyncable(sourceType: string): sourceType is SyncableSourceType {
  return SYNCABLE_SOURCE_TYPES.includes(sourceType as SyncableSourceType)
}

// ─── BQP / External adapter stub ─────────────────────────────────────────────
// TODO: Replace with real integration when BQP API credentials are available.
// Expected interface: { added: Item[], updated: Item[], deactivated: string[] }

type ExternalSyncResult = {
  added: number
  updated: number
  deactivated: number
  errorCount: number
  logDetail: Record<string, unknown>
}

async function callExternalAdapter(
  sourceType: string,
  categoryCode: string,
  dryRun: boolean
): Promise<ExternalSyncResult> {
  // ── INTEGRATION POINT ─────────────────────────────────────────────────────
  // When BQP API is available:
  //   const client = new BqpApiClient(process.env.BQP_API_URL, process.env.BQP_API_KEY)
  //   const payload = await client.fetchCategory(categoryCode)
  //   return applyPayload(payload, dryRun)
  // ─────────────────────────────────────────────────────────────────────────

  // [BQP STUB] Stub active — no real data fetched. Returning errorCount=1 so
  // syncStatus is written as PARTIAL (not SUCCESS) in the sync log, signalling
  // to operators that integration is still pending.
  console.warn(
    `[BQP STUB] Real integration not yet available for sourceType: ${sourceType}, category: ${categoryCode}.` +
    ' Replace callExternalAdapter() with a real BQP API client before go-live.'
  )

  return {
    added: 0,
    updated: 0,
    deactivated: 0,
    errorCount: 1,   // forces syncStatus → FAILED (not SUCCESS) — stub produces no real data
    logDetail: {
      note: `[STUB] ${sourceType} API integration pending — no real data fetched`,
      dryRun,
      timestamp: new Date().toISOString(),
    },
  }
}

// ─── Service methods ──────────────────────────────────────────────────────────

export async function getSyncStatus(): Promise<AdminResult<SyncStatusResponse>> {
  try {
    const [latestPerCategory, last30Days, lastGlobal] = await Promise.all([
      syncRepo.findLatestPerCategory(),
      syncRepo.findLast30DaysAggregates(),
      syncRepo.findLatestGlobalSync(),
    ])

    return {
      success: true,
      data: {
        // TODO: query BQP API for pending-sync items when integration is live
        hasPending: null,
        lastGlobalSync: lastGlobal?.syncedAt ?? null,
        last30Days: {
          totalSyncs: last30Days.totalSyncs,
          added: last30Days.added,
          updated: last30Days.updated,
          deactivated: last30Days.deactivated,
          errors: last30Days.errors,
          syncJobsWithErrors: last30Days.syncJobsWithErrors,
        },
        perCategory: latestPerCategory,
      },
    }
  } catch (e) {
    console.error('[MasterDataSyncService.getSyncStatus]', e)
    return { success: false, error: 'Lỗi hệ thống', status: 500 }
  }
}

export async function getCategorySyncHistory(
  categoryCode: string,
  limit: number
): Promise<AdminResult<syncRepo.SyncLogRow[]>> {
  try {
    const cat = await db.masterCategory.findUnique({
      where: { code: categoryCode },
      select: { code: true },
    })
    if (!cat) {
      return { success: false, error: 'Không tìm thấy danh mục', status: 404 }
    }

    const logs = await syncRepo.findByCategory(categoryCode, limit)
    return { success: true, data: logs }
  } catch (e) {
    console.error('[MasterDataSyncService.getCategorySyncHistory]', e)
    return { success: false, error: 'Lỗi hệ thống', status: 500 }
  }
}

export async function triggerSync(
  input: TriggerSyncInput
): Promise<AdminResult<TriggerSyncResult>> {
  const { categoryCode, triggeredBy, dryRun = false } = input

  // Track sourceType here so the catch block can write a valid SyncLog
  // without risk of DB enum violation from 'UNKNOWN'.
  let resolvedSourceType: string | null = null

  try {
    // Load category and validate
    const cat = await db.masterCategory.findUnique({
      where: { code: categoryCode },
      select: { code: true, sourceType: true, isActive: true },
    })
    if (!cat) {
      return { success: false, error: 'Không tìm thấy danh mục', status: 404 }
    }
    if (!cat.isActive) {
      return { success: false, error: 'Danh mục đã bị vô hiệu hóa', status: 400 }
    }

    // Guard: only BQP/NATIONAL categories may trigger external sync
    if (!isSyncable(cat.sourceType)) {
      return {
        success: false,
        error: `Danh mục có sourceType="${cat.sourceType}" không hỗ trợ sync ngoài. Chỉ BQP hoặc NATIONAL mới được phép.`,
        status: 422,
      }
    }

    resolvedSourceType = cat.sourceType

    // Call external adapter (stub)
    const adapterResult = await callExternalAdapter(cat.sourceType, categoryCode, dryRun)

    // Determine status
    const syncStatus =
      adapterResult.errorCount > 0
        ? adapterResult.added + adapterResult.updated + adapterResult.deactivated > 0
          ? 'PARTIAL'
          : 'FAILED'
        : 'SUCCESS'

    // Write sync log (even for dryRun, so operators can see attempts)
    const syncLog = await syncRepo.createSyncLog({
      categoryCode,
      syncSource: cat.sourceType,
      syncStatus,
      addedCount: adapterResult.added,
      updatedCount: adapterResult.updated,
      deactivatedCount: adapterResult.deactivated,
      errorCount: adapterResult.errorCount,
      logDetail: { ...adapterResult.logDetail, dryRun },
      triggeredBy,
    })

    // Invalidate cache so next read picks up fresh data
    if (!dryRun) {
      await invalidateCategoryCache(categoryCode)
    }

    return {
      success: true,
      data: {
        categoryCode,
        syncStatus,
        addedCount: adapterResult.added,
        updatedCount: adapterResult.updated,
        deactivatedCount: adapterResult.deactivated,
        errorCount: adapterResult.errorCount,
        dryRun,
        syncLogId: syncLog.id,
      },
    }
  } catch (e) {
    console.error('[MasterDataSyncService.triggerSync]', e)

    // Best-effort failure log — only if we successfully resolved sourceType,
    // so we never write an invalid enum value ('UNKNOWN') to the DB.
    if (resolvedSourceType) {
      try {
        await syncRepo.createSyncLog({
          categoryCode,
          syncSource: resolvedSourceType,
          syncStatus: 'FAILED',
          errorCount: 1,
          logDetail: { error: String(e), dryRun },
          triggeredBy,
        })
      } catch {
        // ignore secondary failure — primary error already logged above
      }
    }

    return { success: false, error: 'Lỗi hệ thống khi sync', status: 500 }
  }
}
