/**
 * PersonnelRepo – M02 Phase 2
 * Data access layer for Personnel master entity.
 * Chỉ làm query/filter/pagination – không chứa business logic.
 */
import 'server-only'
import db from '@/lib/db'
import type { PersonnelCategory, PersonnelStatus, ManagingOrgan, BloodType } from '@prisma/client'

// ─── Filter / Input Types ─────────────────────────────────────────────────────

export interface PersonnelListFilter {
  search?: string
  unitId?: string
  category?: PersonnelCategory
  status?: PersonnelStatus
  managingOrgan?: ManagingOrgan
  /** RBAC: restrict to records whose unitId is in this list */
  allowedUnitIds?: string[]
  /** RBAC SELF scope: restrict to exactly this personnelId */
  selfPersonnelId?: string
  page?: number
  limit?: number
}

export interface PersonnelCreateData {
  personnelCode: string
  fullName: string
  fullNameEn?: string | null
  dateOfBirth?: Date | null
  gender?: string | null
  bloodType?: BloodType | null
  placeOfOrigin?: string | null
  birthPlace?: string | null
  permanentAddress?: string | null
  temporaryAddress?: string | null
  ethnicity?: string | null
  religion?: string | null
  category: PersonnelCategory
  managingOrgan: ManagingOrgan
  unitId?: string | null
  militaryIdNumber?: string | null
  militaryRank?: string | null
  rankDate?: Date | null
  position?: string | null
  positionDate?: Date | null
  enlistmentDate?: Date | null
  educationLevel?: string | null
  specialization?: string | null
  politicalTheory?: string | null
  academicTitle?: string | null
  academicDegree?: string | null
  status?: PersonnelStatus
}

export type PersonnelUpdateData = Partial<Omit<PersonnelCreateData, 'personnelCode'>>

// ─── Select shapes ────────────────────────────────────────────────────────────

const PERSONNEL_LIST_SELECT = {
  id: true,
  personnelCode: true,
  fullName: true,
  fullNameEn: true,
  dateOfBirth: true,
  gender: true,
  category: true,
  managingOrgan: true,
  status: true,
  militaryRank: true,
  position: true,
  academicTitle: true,
  academicDegree: true,
  unitId: true,
  unit: { select: { id: true, name: true, code: true } },
  createdAt: true,
  updatedAt: true,
} as const

const PERSONNEL_DETAIL_SELECT = {
  id: true,
  personnelCode: true,
  fullName: true,
  fullNameEn: true,
  dateOfBirth: true,
  gender: true,
  bloodType: true,
  placeOfOrigin: true,
  birthPlace: true,
  permanentAddress: true,
  temporaryAddress: true,
  ethnicity: true,
  religion: true,
  category: true,
  managingOrgan: true,
  managingOrganAssignedBy: true,
  managingOrganAssignedAt: true,
  militaryIdNumber: true,
  militaryRank: true,
  rankDate: true,
  position: true,
  positionDate: true,
  enlistmentDate: true,
  dischargeDate: true,
  educationLevel: true,
  specialization: true,
  politicalTheory: true,
  academicTitle: true,
  academicDegree: true,
  status: true,
  unitId: true,
  unit: {
    select: {
      id: true,
      name: true,
      code: true,
      type: true,
      level: true,
      parent: { select: { id: true, name: true, code: true } },
    },
  },
  account: {
    select: { id: true, email: true, name: true, status: true },
  },
  createdAt: true,
  updatedAt: true,
} as const

// ─── Repository ───────────────────────────────────────────────────────────────

export const PersonnelRepo = {
  async findMany(filter: PersonnelListFilter = {}) {
    const {
      search, unitId, category, status, managingOrgan,
      allowedUnitIds, selfPersonnelId,
      page = 1, limit = 20,
    } = filter

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = { deletedAt: null }

    // RBAC scope restrictions (set by service layer)
    if (selfPersonnelId) {
      where.id = selfPersonnelId
    } else if (allowedUnitIds) {
      where.unitId = { in: allowedUnitIds }
    }

    // Caller-supplied filters
    if (unitId) where.unitId = unitId
    if (category) where.category = category
    if (status) where.status = status
    if (managingOrgan) where.managingOrgan = managingOrgan
    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { personnelCode: { contains: search, mode: 'insensitive' } },
        { militaryIdNumber: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [data, total] = await Promise.all([
      db.personnel.findMany({
        where,
        select: PERSONNEL_LIST_SELECT,
        orderBy: [{ fullName: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.personnel.count({ where }),
    ])

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) }
  },

  async findById(id: string) {
    return db.personnel.findUnique({
      where: { id, deletedAt: null },
      select: PERSONNEL_DETAIL_SELECT,
    })
  },

  async findByPersonnelCode(code: string) {
    return db.personnel.findUnique({
      where: { personnelCode: code },
      select: { id: true, personnelCode: true, fullName: true },
    })
  },

  async create(data: PersonnelCreateData) {
    return db.personnel.create({ data, select: PERSONNEL_DETAIL_SELECT })
  },

  async update(id: string, data: PersonnelUpdateData) {
    return db.personnel.update({
      where: { id },
      data,
      select: PERSONNEL_DETAIL_SELECT,
    })
  },

  async softDelete(id: string, deletedBy: string) {
    return db.personnel.update({
      where: { id },
      data: { deletedAt: new Date(), deletedBy },
      select: { id: true, personnelCode: true, fullName: true },
    })
  },
}
