/**
 * PersonnelSearchRepo – M02 UC-13 / UC-14
 * Dynamic multi-filter queries against prisma.personnel.
 *
 * Intentionally separate from PersonnelRepo so that the main repo
 * stays focused on CRUD and this one handles complex search queries.
 */
import 'server-only'
import db from '@/lib/db'
import type { PersonnelCategory, PersonnelStatus, PolicyRecordType, AwardWorkflowStatus, PolicyRecordStatus, CareerEventType } from '@prisma/client'

// ─── Input types ──────────────────────────────────────────────────────────────

export interface PersonnelSearchFilter {
  keyword?: string
  category?: PersonnelCategory
  unitId?: string
  /** RBAC: restrict to records whose unitId is in this list */
  allowedUnitIds?: string[]
  /** RBAC SELF scope: restrict to this personnelId */
  selfPersonnelId?: string
  rank?: string
  position?: string
  degree?: string
  academicTitle?: string
  major?: string
  politicalTheory?: string
  status?: PersonnelStatus
  /** Filter: dateOfBirth must be AFTER this date (for ageMax → birth year) */
  dobAfter?: Date
  /** Filter: dateOfBirth must be BEFORE this date (for ageMin → birth year) */
  dobBefore?: Date
  /** enlistmentDate must be on or before this date (for serviceYearsMin) */
  enlistedBefore?: Date
  /** When true, only personnel with a non-null scientificProfile */
  hasResearch?: boolean
  page?: number
  pageSize?: number
}

// ─── Select shape ─────────────────────────────────────────────────────────────

const SEARCH_SELECT = {
  id: true,
  personnelCode: true,
  fullName: true,
  dateOfBirth: true,
  gender: true,
  category: true,
  managingOrgan: true,
  status: true,
  militaryRank: true,
  position: true,
  academicTitle: true,
  academicDegree: true,
  educationLevel: true,
  specialization: true,
  politicalTheory: true,
  enlistmentDate: true,
  unitId: true,
  unit: { select: { id: true, name: true, code: true } },
  scientificProfile: { select: { id: true, isPublic: true } },
  account: { select: { id: true } },
} as const

// ─── Repository ───────────────────────────────────────────────────────────────

export const PersonnelSearchRepo = {
  async search(filter: PersonnelSearchFilter = {}) {
    const {
      keyword,
      category,
      unitId,
      allowedUnitIds,
      selfPersonnelId,
      rank,
      position,
      degree,
      academicTitle,
      major,
      politicalTheory,
      status,
      dobAfter,
      dobBefore,
      enlistedBefore,
      hasResearch,
      page = 1,
      pageSize = 20,
    } = filter

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = { deletedAt: null }

    // ── RBAC scope ────────────────────────────────────────────────────────────
    if (selfPersonnelId) {
      where.id = selfPersonnelId
    } else if (allowedUnitIds) {
      where.unitId = { in: allowedUnitIds }
    }

    // ── Caller-supplied filters ───────────────────────────────────────────────
    if (unitId) where.unitId = unitId
    if (category) where.category = category
    if (status) where.status = status

    if (rank) where.militaryRank = { contains: rank, mode: 'insensitive' }
    if (position) where.position = { contains: position, mode: 'insensitive' }
    if (degree) where.academicDegree = { contains: degree, mode: 'insensitive' }
    if (academicTitle) where.academicTitle = { contains: academicTitle, mode: 'insensitive' }
    if (major) where.specialization = { contains: major, mode: 'insensitive' }
    if (politicalTheory) where.politicalTheory = { contains: politicalTheory, mode: 'insensitive' }

    // Age → date-of-birth range
    if (dobAfter || dobBefore) {
      where.dateOfBirth = {}
      if (dobAfter) where.dateOfBirth.gte = dobAfter
      if (dobBefore) where.dateOfBirth.lte = dobBefore
    }

    // Service years → enlistmentDate must be on or before cutoff
    if (enlistedBefore) {
      where.enlistmentDate = { lte: enlistedBefore }
    }

    // hasResearch: existence check on linked ScientificProfile
    if (hasResearch === true) {
      where.scientificProfile = { isNot: null }
    } else if (hasResearch === false) {
      where.scientificProfile = { is: null }
    }

    // Full-text keyword across key string fields
    if (keyword) {
      where.OR = [
        { fullName: { contains: keyword, mode: 'insensitive' } },
        { personnelCode: { contains: keyword, mode: 'insensitive' } },
        { militaryIdNumber: { contains: keyword, mode: 'insensitive' } },
      ]
    }

    const [data, total] = await Promise.all([
      db.personnel.findMany({
        where,
        select: SEARCH_SELECT,
        orderBy: [{ fullName: 'asc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      db.personnel.count({ where }),
    ])

    return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) }
  },

  /**
   * Fetch a batch of personnel by IDs for the talent scoring pass.
   * Returns full scoring inputs (career histories, education histories, policy records).
   */
  async findForScoring(personnelIds: string[]): Promise<PersonnelForScoring[]> {
    const rows = await db.personnel.findMany({
      where: { id: { in: personnelIds }, deletedAt: null },
      select: {
        id: true,
        fullName: true,
        personnelCode: true,
        dateOfBirth: true,
        category: true,
        status: true,
        militaryRank: true,
        position: true,
        academicDegree: true,
        academicTitle: true,
        educationLevel: true,
        specialization: true,
        politicalTheory: true,
        enlistmentDate: true,
        unitId: true,
        unit: { select: { id: true, name: true, code: true } },
        educationHistories: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          where: { deletedAt: null } as any,
          select: { level: true, major: true, endDate: true },
        },
        careerHistories: {
          where: { deletedAt: null },
          select: { eventType: true, newPosition: true, effectiveDate: true },
        },
        scientificProfile: { select: { id: true } },
        account: {
          select: {
            id: true,
            policyRecords: {
              where: { deletedAt: null },
              select: { recordType: true, workflowStatus: true, status: true },
            },
          },
        },
      },
    })
    return rows as unknown as PersonnelForScoring[]
  },
}

export type PersonnelSearchResult = Awaited<
  ReturnType<typeof PersonnelSearchRepo.search>
>['data'][number]

/**
 * Explicit type for the talent-scoring payload.
 * Must stay in sync with the select clause in findForScoring().
 */
export interface PersonnelForScoring {
  id: string
  fullName: string
  personnelCode: string
  dateOfBirth: Date | null
  category: PersonnelCategory | null
  status: PersonnelStatus
  militaryRank: string | null
  position: string | null
  academicDegree: string | null
  academicTitle: string | null
  educationLevel: string | null
  specialization: string | null
  politicalTheory: string | null
  enlistmentDate: Date | null
  unitId: string | null
  unit: { id: string; name: string; code: string } | null
  educationHistories: Array<{ level: string | null; major: string | null; endDate: Date | null }>
  careerHistories: Array<{ eventType: CareerEventType; newPosition: string | null; effectiveDate: Date | null }>
  scientificProfile: { id: string } | null
  account: {
    id: string
    policyRecords: Array<{
      recordType: PolicyRecordType
      workflowStatus: AwardWorkflowStatus
      status: PolicyRecordStatus
    }>
  } | null
}
