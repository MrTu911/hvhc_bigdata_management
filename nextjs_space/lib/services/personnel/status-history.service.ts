/**
 * StatusHistoryService – M02 UC-09
 *
 * Business rules:
 * - toStatus must differ from the personnel's current workStatus.
 * - effectiveDate cannot be in the future by more than 30 days (soft guard).
 * - Creating a record does NOT automatically update Personnel.workStatus —
 *   the caller (API route) must do that in a transaction if needed.
 *   Keeping them separate allows back-dated corrections without side effects.
 */
import 'server-only'
import { prisma } from '@/lib/prisma'
import { StatusHistoryRepo } from '@/lib/repositories/personnel/status-history.repo'
import type { WorkStatus } from '@prisma/client'

const VALID_STATUSES: WorkStatus[] = ['ACTIVE', 'TRANSFERRED', 'RETIRED', 'SUSPENDED', 'RESIGNED']

export interface CreateStatusHistoryParams {
  personnelId: string
  toStatus: WorkStatus
  effectiveDate: string    // ISO date string from client
  decisionNumber?: string
  reason?: string
  notes?: string
  recordedById: string     // userId of the actor
}

export const StatusHistoryService = {
  async list(personnelId: string) {
    const rows = await StatusHistoryRepo.listByPersonnel(personnelId)
    return { success: true as const, data: rows }
  },

  async create(params: CreateStatusHistoryParams) {
    const { personnelId, toStatus, effectiveDate, decisionNumber, reason, notes, recordedById } = params

    if (!VALID_STATUSES.includes(toStatus)) {
      return { success: false as const, error: `Trạng thái không hợp lệ: ${toStatus}`, status: 400 }
    }

    const effectiveDateObj = new Date(effectiveDate)
    if (isNaN(effectiveDateObj.getTime())) {
      return { success: false as const, error: 'effectiveDate không hợp lệ', status: 400 }
    }

    // Soft guard: no more than 30 days in the future
    const thirtyDaysAhead = new Date()
    thirtyDaysAhead.setDate(thirtyDaysAhead.getDate() + 30)
    if (effectiveDateObj > thirtyDaysAhead) {
      return {
        success: false as const,
        error: 'effectiveDate không được vượt quá 30 ngày trong tương lai',
        status: 400,
      }
    }

    // Capture current status to record as fromStatus
    const personnel = await prisma.personnel.findUnique({
      where: { id: personnelId },
      select: { workStatus: true },
    })
    if (!personnel) {
      return { success: false as const, error: 'Không tìm thấy cán bộ', status: 404 }
    }

    const record = await StatusHistoryRepo.create({
      personnelId,
      fromStatus: personnel.workStatus,
      toStatus,
      effectiveDate: effectiveDateObj,
      decisionNumber,
      reason,
      notes,
      recordedBy: recordedById,
    })

    return { success: true as const, data: record }
  },

  async delete(id: string) {
    try {
      await StatusHistoryRepo.delete(id)
      return { success: true as const }
    } catch {
      return { success: false as const, error: 'Không xóa được mục', status: 500 }
    }
  },
}
