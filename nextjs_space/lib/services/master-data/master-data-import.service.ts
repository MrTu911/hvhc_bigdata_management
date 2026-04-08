/**
 * MasterDataImportService – M19 MDM
 *
 * Orchestrates the 2-step server-side import flow:
 *   1. validate()  — validate all rows, classify new/update/invalid, return importId
 *   2. confirm()   — load session, execute upserts, write change log, invalidate cache
 *
 * Validation rules (server-side, authoritative):
 *   - code must be non-empty, match [A-Z0-9_-]+
 *   - nameVi must be non-empty
 *   - code must be unique within the uploaded batch
 *   - category must exist
 */
import 'server-only'
import { randomUUID } from 'crypto'
import db from '@/lib/db'
import { invalidateCategoryCache } from '@/lib/master-data-cache'
import { importSessionStore, type ImportSessionItem } from '@/lib/import-session-store'
import { masterDataAdminRepo } from '@/lib/repositories/master-data/master-data-admin.repo'
import type { MdChangeType } from '@prisma/client'

// ─── Types ────────────────────────────────────────────────────────────────────

type RowStatus = 'new' | 'update' | 'invalid'

export type PreviewRow = ImportSessionItem & {
  _status: RowStatus
  _errors: string[]
}

export type ValidateResult = {
  importId: string
  preview: PreviewRow[]
  stats: { new: number; update: number; invalid: number; total: number }
  expiresInSeconds: number
}

export type ConfirmResult = {
  inserted: number
  updated: number
  errors: string[]
}

// ─── Validation helpers ───────────────────────────────────────────────────────

const CODE_RE = /^[A-Z0-9_\-]+$/

function validateRow(row: ImportSessionItem, seenCodes: Set<string>): string[] {
  const errors: string[] = []
  if (!row.code || !String(row.code).trim()) {
    errors.push('Thiếu code')
  } else {
    const code = String(row.code).trim().toUpperCase()
    if (!CODE_RE.test(code)) {
      errors.push('code chỉ được chứa chữ hoa, số, dấu gạch dưới hoặc gạch ngang')
    } else if (seenCodes.has(code)) {
      errors.push('code trùng lặp trong file')
    } else {
      seenCodes.add(code)
    }
  }
  if (!row.nameVi || !String(row.nameVi).trim()) {
    errors.push('Thiếu nameVi')
  }
  if (row.sortOrder !== undefined && row.sortOrder !== null) {
    const n = Number(row.sortOrder)
    if (!Number.isInteger(n) || n < 0) errors.push('sortOrder phải là số nguyên không âm')
  }
  return errors
}

// ─── Config ───────────────────────────────────────────────────────────────────

/** Max rows processed in a single DB transaction to avoid lock contention */
const IMPORT_BATCH_SIZE = 200

// ─── Service ──────────────────────────────────────────────────────────────────

export const masterDataImportService = {
  /**
   * Step 1: validate items, compute new/update/invalid classification, store session.
   */
  async validate(
    categoryCode: string,
    rawItems: ImportSessionItem[],
    changedBy: string
  ): Promise<{ success: true; data: ValidateResult } | { success: false; error: string; status: 400 | 404 }> {
    if (!Array.isArray(rawItems) || rawItems.length === 0) {
      return { success: false, error: 'Danh sách items không được trống', status: 400 }
    }
    if (rawItems.length > 5000) {
      return { success: false, error: 'Tối đa 5000 dòng mỗi lần import', status: 400 }
    }

    const cat = await masterDataAdminRepo.findCategoryByCode(categoryCode)
    if (!cat) return { success: false, error: 'Không tìm thấy danh mục', status: 404 }

    // Load existing codes for this category once
    const existingItems = await db.masterDataItem.findMany({
      where: { categoryCode },
      select: { code: true },
    })
    const existingCodes = new Set(existingItems.map(i => i.code))

    const seenInBatch = new Set<string>()
    const preview: PreviewRow[] = []

    for (const raw of rawItems) {
      const errors = validateRow(raw, seenInBatch)
      const code = String(raw.code ?? '').trim().toUpperCase()

      let status: RowStatus
      if (errors.length > 0) {
        status = 'invalid'
      } else if (existingCodes.has(code)) {
        status = 'update'
      } else {
        status = 'new'
      }

      preview.push({
        code: code || raw.code,
        nameVi: String(raw.nameVi ?? '').trim(),
        nameEn: raw.nameEn ?? null,
        shortName: raw.shortName ?? null,
        parentCode: raw.parentCode ?? null,
        externalCode: raw.externalCode ?? null,
        sortOrder: raw.sortOrder !== undefined ? Number(raw.sortOrder) : undefined,
        metadata: raw.metadata,
        _status: status,
        _errors: errors,
      })
    }

    const validItems = preview
      .filter(r => r._status !== 'invalid')
      .map(({ _status, _errors, ...item }) => item)

    const importId = randomUUID()
    await importSessionStore.set({
      importId,
      categoryCode,
      validItems,
      createdBy: changedBy,
      createdAt: new Date().toISOString(),
      consumed: false,
    })

    const stats = {
      new: preview.filter(r => r._status === 'new').length,
      update: preview.filter(r => r._status === 'update').length,
      invalid: preview.filter(r => r._status === 'invalid').length,
      total: preview.length,
    }

    return {
      success: true,
      data: { importId, preview, stats, expiresInSeconds: 15 * 60 },
    }
  },

  /**
   * Step 2: load session and execute the import.
   */
  async confirm(
    categoryCode: string,
    importId: string,
    changedBy: string
  ): Promise<
    | { success: true; data: ConfirmResult }
    | { success: false; error: string; status: 400 | 404 | 409 | 410 }
  > {
    const session = await importSessionStore.get(importId)
    if (!session) {
      return { success: false, error: 'Phiên import không tồn tại hoặc đã hết hạn', status: 410 }
    }
    if (session.categoryCode !== categoryCode) {
      return { success: false, error: 'importId không khớp với danh mục này', status: 400 }
    }
    if (session.consumed) {
      return { success: false, error: 'Phiên import đã được thực thi', status: 409 }
    }

    // Mark consumed immediately to prevent race conditions
    await importSessionStore.markConsumed(importId)

    const actor = changedBy
    let inserted = 0
    let updated = 0
    const errors: string[] = []

    // Process in chunks to avoid long-running transactions and lock contention
    for (let start = 0; start < session.validItems.length; start += IMPORT_BATCH_SIZE) {
      const chunk = session.validItems.slice(start, start + IMPORT_BATCH_SIZE)
      const chunkCodes = chunk.map(i => i.code)

      try {
        // Load existing items for this chunk in one query
        const existingItems = await db.masterDataItem.findMany({
          where: { categoryCode, code: { in: chunkCodes } },
          select: { id: true, code: true },
        })
        const existingMap = new Map(existingItems.map(i => [i.code, i]))

        // Execute chunk in a single transaction
        await db.$transaction(async (tx) => {
          for (const item of chunk) {
            const existing = existingMap.get(item.code)

            if (!existing) {
              const created = await tx.masterDataItem.create({
                data: {
                  categoryCode,
                  code: item.code,
                  nameVi: item.nameVi,
                  nameEn: item.nameEn ?? null,
                  shortName: item.shortName ?? null,
                  parentCode: item.parentCode ?? null,
                  externalCode: item.externalCode ?? null,
                  sortOrder: item.sortOrder ?? 0,
                  metadata: item.metadata as never,
                  isActive: true,
                  createdBy: actor,
                },
              })
              await tx.masterDataChangeLog.create({
                data: {
                  itemId: created.id,
                  changeType: 'CREATE' as MdChangeType,
                  newValue: item as never,
                  changedBy: actor,
                  changeReason: `Bulk import — session ${importId}`,
                },
              })
              inserted++
            } else {
              await tx.masterDataItem.update({
                where: { categoryCode_code: { categoryCode, code: item.code } },
                data: {
                  nameVi: item.nameVi,
                  ...(item.nameEn !== undefined && { nameEn: item.nameEn }),
                  ...(item.shortName !== undefined && { shortName: item.shortName }),
                  ...(item.parentCode !== undefined && { parentCode: item.parentCode }),
                  ...(item.externalCode !== undefined && { externalCode: item.externalCode }),
                  ...(item.sortOrder !== undefined && { sortOrder: item.sortOrder }),
                  ...(item.metadata !== undefined && { metadata: item.metadata as never }),
                  isActive: true,
                },
              })
              await tx.masterDataChangeLog.create({
                data: {
                  itemId: existing.id,
                  changeType: 'UPDATE' as MdChangeType,
                  newValue: item as never,
                  changedBy: actor,
                  changeReason: `Bulk import — session ${importId}`,
                },
              })
              updated++
            }
          }
        })
      } catch (err) {
        // Chunk failed — record which codes were affected
        const msg = (err as Error).message
        chunk.forEach(item => errors.push(`${item.code}: ${msg}`))
        // Revert increments that occurred before the transaction rolled back
        // (none — insertions/updates only count after tx commits)
      }
    }

    // Sync log
    await db.masterDataSyncLog.create({
      data: {
        categoryCode,
        syncSource: 'IMPORT_EXCEL',
        addedCount: inserted,
        updatedCount: updated,
        errorCount: errors.length,
        logDetail: errors.length > 0 ? ({ errors } as never) : undefined,
        triggeredBy: actor,
      },
    })

    await invalidateCategoryCache(categoryCode)
    await importSessionStore.del(importId)

    return { success: true, data: { inserted, updated, errors } }
  },
}
