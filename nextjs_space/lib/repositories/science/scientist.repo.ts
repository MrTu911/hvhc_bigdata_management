/**
 * ScientistRepo – Phase 2
 * Data access cho NckhScientistProfile và 3 sub-tables:
 *   NckhScientistEducation, NckhScientistCareer, NckhScientistAward
 *
 * Không sửa /lib/repositories/research/* – backward compatible.
 */
import 'server-only'
import prisma from '@/lib/db'
import type {
  ScientistListFilter,
  ScientistProfileUpdateInput,
  ScientistEducationCreateInput,
  ScientistEducationUpdateInput,
  ScientistCareerCreateInput,
  ScientistCareerUpdateInput,
  ScientistAwardCreateInput,
  ScientistAwardUpdateInput,
} from '@/lib/validations/science-scientist'

// ─── Shared select – profile + sub-tables + user info ─────────────────────────

const PROFILE_SELECT = {
  id: true,
  userId: true,
  hIndex: true,
  i10Index: true,
  totalCitations: true,
  totalPublications: true,
  primaryField: true,
  secondaryFields: true,
  researchKeywords: true,
  researchFields: true,
  specialization: true,
  orcidId: true,
  scopusAuthorId: true,
  googleScholarId: true,
  bio: true,
  academicRank: true,
  degree: true,
  projectLeadCount: true,
  projectMemberCount: true,
  sensitivityLevel: true,
  researchAreaIds: true,
  maso: true,
  updatedAt: true,
  createdAt: true,
  user: {
    select: {
      id: true,
      name: true,
      rank: true,
      militaryId: true,
      email: true,
      phone: true,
      academicTitle: true,
      unitId: true,
      unitRelation: { select: { id: true, name: true, code: true } },
    },
  },
  education: {
    orderBy: { yearFrom: 'desc' as const },
  },
  career: {
    orderBy: [{ isCurrent: 'desc' as const }, { yearFrom: 'desc' as const }],
  },
  scientistAwards: {
    orderBy: { year: 'desc' as const },
  },
} as const

// ─── Repository ───────────────────────────────────────────────────────────────

export const scientistRepo = {
  async findMany(filter: ScientistListFilter) {
    const { keyword, primaryField, researchAreaId, sensitivityLevel, page, pageSize } = filter
    const skip = (page - 1) * pageSize

    const where = {
      ...(keyword
        ? {
            OR: [
              {
                user: {
                  OR: [
                    { name: { contains: keyword, mode: 'insensitive' as const } },
                    { militaryId: { contains: keyword, mode: 'insensitive' as const } },
                    { email: { contains: keyword, mode: 'insensitive' as const } },
                  ],
                },
              },
              { maso: { contains: keyword, mode: 'insensitive' as const } },
            ],
          }
        : {}),
      ...(primaryField
        ? { primaryField: { contains: primaryField, mode: 'insensitive' as const } }
        : {}),
      ...(researchAreaId ? { researchAreaIds: { has: researchAreaId } } : {}),
      ...(sensitivityLevel ? { sensitivityLevel } : {}),
    }

    const [items, total] = await Promise.all([
      prisma.nckhScientistProfile.findMany({
        where,
        select: PROFILE_SELECT,
        skip,
        take: pageSize,
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.nckhScientistProfile.count({ where }),
    ])

    return { items, total }
  },

  async findById(id: string) {
    return prisma.nckhScientistProfile.findUnique({
      where: { id },
      select: PROFILE_SELECT,
    })
  },

  async findByUserId(userId: string) {
    return prisma.nckhScientistProfile.findUnique({
      where: { userId },
      select: PROFILE_SELECT,
    })
  },

  async updateProfile(id: string, data: ScientistProfileUpdateInput & { maso?: string | null }) {
    return prisma.nckhScientistProfile.update({
      where: { id },
      data,
      select: PROFILE_SELECT,
    })
  },

  /**
   * Dual-write helper: cập nhật maso từ User.militaryId ?? employeeId.
   * Gọi sau khi User thay đổi militaryId/employeeId (hoặc khi tạo profile mới).
   */
  async syncMasoFromUser(profileId: string, militaryId: string | null, employeeId: string | null) {
    const maso = militaryId ?? employeeId ?? null
    if (!maso) return
    await prisma.nckhScientistProfile.update({
      where: { id: profileId },
      data: { maso },
    })
  },

  // ─── Education sub-table ────────────────────────────────────────────────────

  async createEducation(scientistId: string, data: ScientistEducationCreateInput) {
    return prisma.nckhScientistEducation.create({
      data: { ...data, scientistId },
    })
  },

  async updateEducation(id: string, data: ScientistEducationUpdateInput) {
    return prisma.nckhScientistEducation.update({ where: { id }, data })
  },

  async deleteEducation(id: string) {
    return prisma.nckhScientistEducation.delete({ where: { id } })
  },

  async findEducationById(id: string) {
    return prisma.nckhScientistEducation.findUnique({ where: { id } })
  },

  // ─── Career sub-table ───────────────────────────────────────────────────────

  async createCareer(scientistId: string, data: ScientistCareerCreateInput) {
    return prisma.nckhScientistCareer.create({
      data: { ...data, scientistId },
    })
  },

  async updateCareer(id: string, data: ScientistCareerUpdateInput) {
    return prisma.nckhScientistCareer.update({ where: { id }, data })
  },

  async deleteCareer(id: string) {
    return prisma.nckhScientistCareer.delete({ where: { id } })
  },

  async findCareerById(id: string) {
    return prisma.nckhScientistCareer.findUnique({ where: { id } })
  },

  // ─── Award sub-table ────────────────────────────────────────────────────────

  async createAward(scientistId: string, data: ScientistAwardCreateInput) {
    return prisma.nckhScientistAward.create({
      data: { ...data, scientistId },
    })
  },

  async updateAward(id: string, data: ScientistAwardUpdateInput) {
    return prisma.nckhScientistAward.update({ where: { id }, data })
  },

  async deleteAward(id: string) {
    return prisma.nckhScientistAward.delete({ where: { id } })
  },

  async findAwardById(id: string) {
    return prisma.nckhScientistAward.findUnique({ where: { id } })
  },
}

export type ScientistProfileFull = NonNullable<
  Awaited<ReturnType<typeof scientistRepo.findById>>
>

// ─── Unit capacity aggregation ────────────────────────────────────────────────

export interface UnitCapacityItem {
  unitId: string
  unitName: string
  unitCode: string
  scientistCount: number
  doctoralCount: number // TS + TSKH
  masterCount: number   // ThS + CK2
  projectLeadCount: number
  projectMemberCount: number
  totalCitations: number
  totalPublications: number
  topFields: string[]
}

export const unitCapacityRepo = {
  async getAll(): Promise<UnitCapacityItem[]> {
    // Fetch all profiles with user/unit info for aggregation
    const profiles = await prisma.nckhScientistProfile.findMany({
      where: { user: { unitId: { not: null } } },
      select: {
        degree: true,
        projectLeadCount: true,
        projectMemberCount: true,
        totalCitations: true,
        totalPublications: true,
        primaryField: true,
        user: {
          select: {
            unitId: true,
            unitRelation: { select: { id: true, name: true, code: true } },
          },
        },
      },
    })

    // Group by unit
    const map = new Map<string, UnitCapacityItem>()

    for (const p of profiles) {
      const unit = p.user.unitRelation
      if (!unit || !p.user.unitId) continue

      const key = p.user.unitId
      if (!map.has(key)) {
        map.set(key, {
          unitId: unit.id,
          unitName: unit.name,
          unitCode: unit.code ?? '',
          scientistCount: 0,
          doctoralCount: 0,
          masterCount: 0,
          projectLeadCount: 0,
          projectMemberCount: 0,
          totalCitations: 0,
          totalPublications: 0,
          topFields: [],
        })
      }

      const entry = map.get(key)!
      entry.scientistCount += 1
      if (['TS', 'TSKH'].includes(p.degree ?? '')) entry.doctoralCount += 1
      if (['ThS', 'CK2'].includes(p.degree ?? '')) entry.masterCount += 1
      entry.projectLeadCount += p.projectLeadCount ?? 0
      entry.projectMemberCount += p.projectMemberCount ?? 0
      entry.totalCitations += p.totalCitations ?? 0
      entry.totalPublications += p.totalPublications ?? 0
      if (p.primaryField && !entry.topFields.includes(p.primaryField)) {
        entry.topFields.push(p.primaryField)
      }
    }

    return [...map.values()].sort((a, b) => b.scientistCount - a.scientistCount)
  },
}
