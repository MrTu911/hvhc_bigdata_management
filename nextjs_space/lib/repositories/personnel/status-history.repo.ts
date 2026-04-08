/**
 * StatusHistoryRepo – M02 UC-09
 * Data access for PersonnelStatusHistory.
 */
import 'server-only'
import { prisma } from '@/lib/prisma'
import type { WorkStatus } from '@prisma/client'

export interface CreateStatusHistoryInput {
  personnelId: string
  fromStatus?: WorkStatus | null
  toStatus: WorkStatus
  effectiveDate: Date
  decisionNumber?: string | null
  reason?: string | null
  notes?: string | null
  recordedBy?: string | null
}

export const StatusHistoryRepo = {
  /** List all status changes for a personnel, newest first */
  async listByPersonnel(personnelId: string) {
    return prisma.personnelStatusHistory.findMany({
      where: { personnelId },
      orderBy: { effectiveDate: 'desc' },
    })
  },

  /** Create a new status change entry */
  async create(input: CreateStatusHistoryInput) {
    return prisma.personnelStatusHistory.create({
      data: {
        personnelId:    input.personnelId,
        fromStatus:     input.fromStatus ?? null,
        toStatus:       input.toStatus,
        effectiveDate:  input.effectiveDate,
        decisionNumber: input.decisionNumber ?? null,
        reason:         input.reason ?? null,
        notes:          input.notes ?? null,
        recordedBy:     input.recordedBy ?? null,
      },
    })
  },

  /** Delete a single entry (audit-sensitive: prefer soft-delete when M02 audit is wired) */
  async delete(id: string) {
    return prisma.personnelStatusHistory.delete({ where: { id } })
  },
}
