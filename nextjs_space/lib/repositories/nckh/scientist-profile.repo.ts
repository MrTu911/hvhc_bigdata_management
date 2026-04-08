/**
 * ScientistProfileRepo – Module M09 UC-47
 * Data access layer cho NckhScientistProfile.
 * Không chứa business logic.
 */
import 'server-only'
import db from '@/lib/db'
import { NckhMemberRole } from '@prisma/client'

// ─── Filter ───────────────────────────────────────────────────────────────────

export interface ScientistFilter {
  keyword?: string         // tìm theo tên người dùng
  unitId?: string
  specialization?: string
  researchField?: string   // lọc theo 1 lĩnh vực trong researchFields[]
  degree?: string
  academicRank?: string
  /** RBAC SELF: chỉ xem profile của userId này */
  scopeUserId?: string
  /** RBAC UNIT/DEPT: chỉ xem trong danh sách unit */
  unitIds?: string[]
  page?: number
  limit?: number
}

export interface CapacityMapFilter {
  unitId?: string
  researchField?: string
  academicRank?: string
}

// ─── Repository ───────────────────────────────────────────────────────────────

export const scientistProfileRepo = {
  // ── List with filter ───────────────────────────────────────────────────────

  async findMany(filter: ScientistFilter) {
    const {
      keyword, unitId, specialization, researchField, degree, academicRank,
      scopeUserId, unitIds, page = 1, limit = 20,
    } = filter

    const userWhere: Record<string, unknown> = {}
    if (unitId) {
      userWhere.unitId = unitId
    } else if (unitIds && unitIds.length > 0) {
      userWhere.unitId = { in: unitIds }
    }
    if (keyword) {
      userWhere.name = { contains: keyword, mode: 'insensitive' }
    }

    const where: Record<string, unknown> = {}
    if (scopeUserId) where.userId = scopeUserId
    if (Object.keys(userWhere).length > 0) where.user = userWhere
    if (specialization) where.specialization = { contains: specialization, mode: 'insensitive' }
    if (degree) where.degree = { contains: degree, mode: 'insensitive' }
    if (academicRank) where.academicRank = { contains: academicRank, mode: 'insensitive' }
    if (researchField) where.researchFields = { has: researchField }

    const [items, total] = await db.$transaction([
      db.nckhScientistProfile.findMany({
        where,
        select: {
          id: true,
          userId: true,
          academicRank: true,
          degree: true,
          specialization: true,
          researchFields: true,
          researchKeywords: true,
          hIndex: true,
          i10Index: true,
          totalCitations: true,
          totalPublications: true,
          projectLeadCount: true,
          projectMemberCount: true,
          orcidId: true,
          bio: true,
          updatedAt: true,
          user: {
            select: {
              id: true,
              name: true,
              rank: true,
              militaryId: true,
              email: true,
              unitId: true,
              unitRelation: { select: { id: true, name: true } },
            },
          },
        },
        orderBy: [{ hIndex: 'desc' }, { totalPublications: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.nckhScientistProfile.count({ where }),
    ])

    return { items, total }
  },

  // ── Find by id (profile id) ────────────────────────────────────────────────

  async findById(id: string) {
    return db.nckhScientistProfile.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        academicRank: true,
        degree: true,
        specialization: true,
        researchFields: true,
        primaryField: true,
        secondaryFields: true,
        researchKeywords: true,
        hIndex: true,
        i10Index: true,
        totalCitations: true,
        totalPublications: true,
        projectLeadCount: true,
        projectMemberCount: true,
        orcidId: true,
        scopusAuthorId: true,
        googleScholarId: true,
        awards: true,
        bio: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            id: true,
            name: true,
            rank: true,
            militaryId: true,
            email: true,
            phone: true,
            unitId: true,
            academicTitle: true,
            unitRelation: { select: { id: true, name: true } },
            facultyProfile: {
              select: {
                academicRank: true,
                academicDegree: true,
                specialization: true,
                researchInterests: true,
                orcidId: true,
                googleScholarUrl: true,
              },
            },
            scientificProfile: {
              select: {
                summary: true,
                pdfPath: true,
                isPublic: true,
              },
            },
          },
        },
      },
    })
  },

  // ── Find by userId (canonical lookup) ─────────────────────────────────────

  async findByUserId(userId: string) {
    return db.nckhScientistProfile.findUnique({
      where: { userId },
      select: {
        id: true,
        userId: true,
        academicRank: true,
        degree: true,
        specialization: true,
        researchFields: true,
        primaryField: true,
        secondaryFields: true,
        researchKeywords: true,
        hIndex: true,
        i10Index: true,
        totalCitations: true,
        totalPublications: true,
        projectLeadCount: true,
        projectMemberCount: true,
        orcidId: true,
        scopusAuthorId: true,
        googleScholarId: true,
        awards: true,
        bio: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            id: true,
            name: true,
            rank: true,
            militaryId: true,
            email: true,
            phone: true,
            unitId: true,
            academicTitle: true,
            unitRelation: { select: { id: true, name: true } },
            facultyProfile: {
              select: {
                academicRank: true,
                academicDegree: true,
                specialization: true,
                researchInterests: true,
                orcidId: true,
                googleScholarUrl: true,
              },
            },
            scientificProfile: {
              select: {
                summary: true,
                pdfPath: true,
                isPublic: true,
              },
            },
          },
        },
      },
    })
  },

  // ── Upsert (create or update) ──────────────────────────────────────────────

  async upsert(userId: string, data: Record<string, unknown>) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return db.nckhScientistProfile.upsert({
      where: { userId },
      create: { userId, ...data } as never,
      update: data as never,
      select: { id: true, userId: true, updatedAt: true },
    })
  },

  // ── Update computed stats only ─────────────────────────────────────────────

  async updateStats(
    userId: string,
    stats: {
      totalPublications: number
      projectLeadCount: number
      projectMemberCount: number
    }
  ) {
    return db.nckhScientistProfile.upsert({
      where: { userId },
      create: { userId, ...stats },
      update: stats,
      select: { id: true, userId: true },
    })
  },

  // ── Capacity map – raw records for service aggregation ─────────────────────

  async findAllForCapacityMap(filter: CapacityMapFilter) {
    const where: Record<string, unknown> = {}

    if (filter.unitId) where.user = { unitId: filter.unitId }
    if (filter.academicRank) where.academicRank = { contains: filter.academicRank, mode: 'insensitive' }
    if (filter.researchField) where.researchFields = { has: filter.researchField }

    return db.nckhScientistProfile.findMany({
      where,
      select: {
        id: true,
        userId: true,
        academicRank: true,
        degree: true,
        researchFields: true,
        hIndex: true,
        totalPublications: true,
        user: {
          select: {
            unitId: true,
            unitRelation: { select: { id: true, name: true } },
          },
        },
      },
    })
  },

  // ── Count publications for a user ──────────────────────────────────────────

  async countUserPublications(userId: string): Promise<number> {
    return db.nckhPublication.count({ where: { authorId: userId } })
  },

  // ── Count project memberships ──────────────────────────────────────────────

  async countUserProjectMemberships(userId: string): Promise<{
    leadCount: number
    memberCount: number
  }> {
    const [leadCount, memberCount] = await db.$transaction([
      db.nckhMember.count({ where: { userId, role: NckhMemberRole.CHU_NHIEM } }),
      db.nckhMember.count({ where: { userId } }),
    ])
    return { leadCount, memberCount }
  },

  // ── Recent publications for profile page ──────────────────────────────────

  async findRecentPublications(userId: string, limit = 5) {
    return db.nckhPublication.findMany({
      where: { authorId: userId },
      select: {
        id: true,
        title: true,
        pubType: true,
        publishedYear: true,
        journal: true,
        isISI: true,
        isScopus: true,
        citationCount: true,
        doi: true,
      },
      orderBy: { publishedYear: 'desc' },
      take: limit,
    })
  },

  // ── Recent projects for profile page ──────────────────────────────────────

  async findRecentProjects(userId: string, limit = 5) {
    return db.nckhMember.findMany({
      where: { userId },
      select: {
        role: true,
        project: {
          select: {
            id: true,
            title: true,
            projectCode: true,
            status: true,
            category: true,
            budgetYear: true,
          },
        },
      },
      orderBy: { joinDate: 'desc' },
      take: limit,
    })
  },

  // ── Awards for profile page ────────────────────────────────────────────────

  async findAwardsRecord(userId: string) {
    return db.awardsRecord.findMany({
      where: { userId },
      select: {
        id: true,
        type: true,
        category: true,
        description: true,
        year: true,
        awardedBy: true,
      },
      orderBy: { year: 'desc' },
    })
  },

  // ── All userIds (for batch refresh) ───────────────────────────────────────

  async findAllUserIds(): Promise<string[]> {
    const rows = await db.nckhScientistProfile.findMany({
      select: { userId: true },
    })
    return rows.map((r) => r.userId)
  },

  // ── FacultyProfile fields for sync ────────────────────────────────────────

  async findFacultyProfileForSync(userId: string) {
    return db.facultyProfile.findUnique({
      where: { userId },
      select: {
        academicRank: true,
        academicDegree: true,
        specialization: true,
        orcidId: true,
      },
    })
  },
}
