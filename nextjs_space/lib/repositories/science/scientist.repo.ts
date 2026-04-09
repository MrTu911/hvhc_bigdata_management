/**
 * ScientistRepo – Phase 2
 * Data access cho NckhScientistProfile và 3 sub-tables:
 *   NckhScientistEducation, NckhScientistCareer, NckhScientistAward
 *
 * Không sửa /lib/repositories/research/* – backward compatible.
 */
import 'server-only'
import { db } from '@/lib/db'
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
            user: {
              OR: [
                { name: { contains: keyword, mode: 'insensitive' as const } },
                { militaryId: { contains: keyword, mode: 'insensitive' as const } },
                { email: { contains: keyword, mode: 'insensitive' as const } },
              ],
            },
          }
        : {}),
      ...(primaryField
        ? { primaryField: { contains: primaryField, mode: 'insensitive' as const } }
        : {}),
      ...(researchAreaId ? { researchAreaIds: { has: researchAreaId } } : {}),
      ...(sensitivityLevel ? { sensitivityLevel } : {}),
    }

    const [items, total] = await Promise.all([
      db.nckhScientistProfile.findMany({
        where,
        select: PROFILE_SELECT,
        skip,
        take: pageSize,
        orderBy: { updatedAt: 'desc' },
      }),
      db.nckhScientistProfile.count({ where }),
    ])

    return { items, total }
  },

  async findById(id: string) {
    return db.nckhScientistProfile.findUnique({
      where: { id },
      select: PROFILE_SELECT,
    })
  },

  async findByUserId(userId: string) {
    return db.nckhScientistProfile.findUnique({
      where: { userId },
      select: PROFILE_SELECT,
    })
  },

  async updateProfile(id: string, data: ScientistProfileUpdateInput) {
    return db.nckhScientistProfile.update({
      where: { id },
      data,
      select: PROFILE_SELECT,
    })
  },

  // ─── Education sub-table ────────────────────────────────────────────────────

  async createEducation(scientistId: string, data: ScientistEducationCreateInput) {
    return db.nckhScientistEducation.create({
      data: { ...data, scientistId },
    })
  },

  async updateEducation(id: string, data: ScientistEducationUpdateInput) {
    return db.nckhScientistEducation.update({ where: { id }, data })
  },

  async deleteEducation(id: string) {
    return db.nckhScientistEducation.delete({ where: { id } })
  },

  async findEducationById(id: string) {
    return db.nckhScientistEducation.findUnique({ where: { id } })
  },

  // ─── Career sub-table ───────────────────────────────────────────────────────

  async createCareer(scientistId: string, data: ScientistCareerCreateInput) {
    return db.nckhScientistCareer.create({
      data: { ...data, scientistId },
    })
  },

  async updateCareer(id: string, data: ScientistCareerUpdateInput) {
    return db.nckhScientistCareer.update({ where: { id }, data })
  },

  async deleteCareer(id: string) {
    return db.nckhScientistCareer.delete({ where: { id } })
  },

  async findCareerById(id: string) {
    return db.nckhScientistCareer.findUnique({ where: { id } })
  },

  // ─── Award sub-table ────────────────────────────────────────────────────────

  async createAward(scientistId: string, data: ScientistAwardCreateInput) {
    return db.nckhScientistAward.create({
      data: { ...data, scientistId },
    })
  },

  async updateAward(id: string, data: ScientistAwardUpdateInput) {
    return db.nckhScientistAward.update({ where: { id }, data })
  },

  async deleteAward(id: string) {
    return db.nckhScientistAward.delete({ where: { id } })
  },

  async findAwardById(id: string) {
    return db.nckhScientistAward.findUnique({ where: { id } })
  },
}

export type ScientistProfileFull = NonNullable<
  Awaited<ReturnType<typeof scientistRepo.findById>>
>
