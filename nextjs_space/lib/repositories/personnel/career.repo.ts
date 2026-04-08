/**
 * CareerRepo – M02 Phase 2
 * Data access for CareerHistory. Primary key: personnelId.
 * userId remains as bridge FK for legacy records.
 */
import 'server-only'
import db from '@/lib/db'
import type { CareerEventType } from '@prisma/client'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CareerCreateData {
  personnelId: string
  /** userId bridge – required by schema FK */
  userId: string
  eventType: CareerEventType
  /** Ngày sự kiện (recorded date) */
  eventDate: Date
  /** Ngày hiệu lực quyết định */
  effectiveDate?: Date | null
  /** Ngày kết thúc (STUDY_LEAVE, SECONDMENT…) */
  endDate?: Date | null
  /** Lý do sự kiện */
  reason?: string | null
  title?: string | null
  decisionAuthority?: string | null
  oldPosition?: string | null
  newPosition?: string | null
  oldRank?: string | null
  newRank?: string | null
  oldUnit?: string | null
  newUnit?: string | null
  trainingName?: string | null
  trainingInstitution?: string | null
  trainingResult?: string | null
  certificateNumber?: string | null
  decisionNumber?: string | null
  decisionDate?: Date | null
  signerName?: string | null
  signerPosition?: string | null
  attachmentUrl?: string | null
  notes?: string | null
  createdById?: string | null
}

export type CareerUpdateData = Partial<
  Omit<CareerCreateData, 'personnelId' | 'userId'>
>

// ─── Select shape ─────────────────────────────────────────────────────────────

const CAREER_SELECT = {
  id: true,
  personnelId: true,
  eventType: true,
  eventDate: true,
  effectiveDate: true,
  endDate: true,
  reason: true,
  title: true,
  decisionAuthority: true,
  oldPosition: true,
  newPosition: true,
  oldRank: true,
  newRank: true,
  oldUnit: true,
  newUnit: true,
  trainingName: true,
  trainingInstitution: true,
  trainingResult: true,
  certificateNumber: true,
  decisionNumber: true,
  decisionDate: true,
  signerName: true,
  signerPosition: true,
  attachmentUrl: true,
  notes: true,
  createdById: true,
  createdAt: true,
  updatedAt: true,
} as const

// ─── Repository ───────────────────────────────────────────────────────────────

export const CareerRepo = {
  /**
   * List all non-deleted events for a personnel, ordered by effectiveDate desc.
   */
  async findByPersonnelId(personnelId: string) {
    return db.careerHistory.findMany({
      where: { personnelId, deletedAt: null },
      select: CAREER_SELECT,
      orderBy: [{ effectiveDate: 'desc' }, { eventDate: 'desc' }],
    })
  },

  async findById(id: string) {
    return db.careerHistory.findFirst({
      where: { id, deletedAt: null },
      select: CAREER_SELECT,
    })
  },

  async create(data: CareerCreateData) {
    return db.careerHistory.create({ data, select: CAREER_SELECT })
  },

  async update(id: string, data: CareerUpdateData) {
    return db.careerHistory.update({
      where: { id },
      data,
      select: CAREER_SELECT,
    })
  },

  /**
   * Soft delete – preserves record for audit trail.
   */
  async softDelete(id: string, deletedBy: string, deletionReason?: string) {
    return db.careerHistory.update({
      where: { id },
      data: { deletedAt: new Date(), deletedBy, deletionReason: deletionReason ?? null },
      select: { id: true, personnelId: true, eventType: true, effectiveDate: true },
    })
  },

  /**
   * Return all non-deleted events for timeline conflict check.
   * Ordered by effectiveDate asc for sequential analysis.
   */
  async findTimelineForConflictCheck(personnelId: string) {
    return db.careerHistory.findMany({
      where: { personnelId, deletedAt: null },
      select: {
        id: true,
        eventType: true,
        effectiveDate: true,
        endDate: true,
      },
      orderBy: { effectiveDate: 'asc' },
    })
  },
}
