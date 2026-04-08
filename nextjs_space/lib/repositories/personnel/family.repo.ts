/**
 * FamilyRepo – M02 Phase 2
 * Data access for FamilyRelation. Primary key: personnelId.
 * family data = sensitive – service layer must enforce scope before calling.
 */
import 'server-only'
import db from '@/lib/db'
import type { FamilyRelationType } from '@prisma/client'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FamilyCreateData {
  personnelId: string
  /** userId bridge – required by schema FK */
  userId: string
  relation: FamilyRelationType
  fullName: string
  dateOfBirth?: Date | null
  /** Sensitive – store plain or encrypted at app layer */
  citizenId?: string | null
  /** Sensitive */
  phoneNumber?: string | null
  occupation?: string | null
  workplace?: string | null
  address?: string | null
  isDeceased?: boolean
  deceasedDate?: Date | null
  dependentFlag?: boolean
  notes?: string | null
}

export type FamilyUpdateData = Partial<
  Omit<FamilyCreateData, 'personnelId' | 'userId'>
>

// ─── Select shapes ────────────────────────────────────────────────────────────

/** Non-sensitive select – for callers without VIEW_SENSITIVE */
const FAMILY_SELECT_PUBLIC = {
  id: true,
  personnelId: true,
  relation: true,
  fullName: true,
  dateOfBirth: true,
  occupation: true,
  workplace: true,
  isDeceased: true,
  deceasedDate: true,
  dependentFlag: true,
  notes: true,
  createdAt: true,
  updatedAt: true,
} as const

/** Full select – only for callers with VIEW_SENSITIVE */
const FAMILY_SELECT_FULL = {
  ...FAMILY_SELECT_PUBLIC,
  citizenId: true,
  phoneNumber: true,
  address: true,
} as const

// ─── Repository ───────────────────────────────────────────────────────────────

export const FamilyRepo = {
  /**
   * List non-deleted family members.
   * @param includeSensitive – pass true only when caller has VIEW_SENSITIVE
   */
  async findByPersonnelId(personnelId: string, includeSensitive: boolean) {
    const select = includeSensitive ? FAMILY_SELECT_FULL : FAMILY_SELECT_PUBLIC
    return db.familyRelation.findMany({
      where: { personnelId, deletedAt: null },
      select,
      orderBy: [{ relation: 'asc' }, { fullName: 'asc' }],
    })
  },

  async findById(id: string, includeSensitive: boolean) {
    const select = includeSensitive ? FAMILY_SELECT_FULL : FAMILY_SELECT_PUBLIC
    return db.familyRelation.findFirst({
      where: { id, deletedAt: null },
      select,
    })
  },

  async create(data: FamilyCreateData) {
    return db.familyRelation.create({ data, select: FAMILY_SELECT_FULL })
  },

  async update(id: string, data: FamilyUpdateData) {
    return db.familyRelation.update({
      where: { id },
      data,
      select: FAMILY_SELECT_FULL,
    })
  },

  async softDelete(id: string, deletedBy: string) {
    return db.familyRelation.update({
      where: { id },
      data: { deletedAt: new Date(), deletedBy },
      select: { id: true, personnelId: true, relation: true, fullName: true },
    })
  },
}
