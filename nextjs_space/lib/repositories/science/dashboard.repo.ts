/**
 * DashboardRepo – CSDL-KHQL Phase 7
 *
 * Role-scoped DB queries for 4 dashboard layers:
 *   ACADEMY   — academy-wide KPI, top researchers, distribution
 *   UNIT      — unit projects/works/budget
 *   RESEARCHER — own projects/publications/profile
 *   REVIEWER   — council memberships + pending reviews
 */
import 'server-only'
import prisma from '@/lib/db'

// ─── Academy layer ────────────────────────────────────────────────────────────

export async function getAcademyProjectDistribution(year: number) {
  const [byStatus, byField] = await Promise.all([
    prisma.nckhProject.groupBy({
      by: ['status'],
      where: { budgetYear: year },
      _count: { id: true },
    }),
    prisma.nckhProject.groupBy({
      by: ['field'],
      where: { budgetYear: year },
      _count: { id: true },
    }),
  ])
  return { byStatus, byField }
}

export async function getTopResearchers(limit = 10) {
  return prisma.nckhScientistProfile.findMany({
    orderBy: [{ hIndex: 'desc' }, { totalCitations: 'desc' }],
    take: limit,
    select: {
      id: true,
      hIndex: true,
      i10Index: true,
      totalCitations: true,
      totalPublications: true,
      primaryField: true,
      projectLeadCount: true,
      academicRank: true,
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
          unitRelation: { select: { id: true, name: true } },
        },
      },
    },
  })
}

export async function getAcademyRecentActivity(limit = 10) {
  return prisma.nckhProjectWorkflowLog.findMany({
    orderBy: { actedAt: 'desc' },
    take: limit,
    select: {
      id: true,
      fromStatus: true,
      toStatus: true,
      actedAt: true,
      comment: true,
      actionBy: { select: { id: true, fullName: true } },
      project: { select: { id: true, title: true, projectCode: true } },
    },
  })
}

// ─── Unit layer ───────────────────────────────────────────────────────────────

export async function getUnitProjectSummary(unitId: string, year: number) {
  const [byStatus, recentProjects] = await Promise.all([
    prisma.nckhProject.groupBy({
      by: ['status'],
      where: { unitId, budgetYear: year },
      _count: { id: true },
    }),
    prisma.nckhProject.findMany({
      where: { unitId, budgetYear: year },
      orderBy: { updatedAt: 'desc' },
      take: 5,
      select: {
        id: true,
        projectCode: true,
        title: true,
        status: true,
        phase: true,
        endDate: true,
        principalInvestigator: { select: { id: true, fullName: true } },
      },
    }),
  ])
  return { byStatus, recentProjects }
}

export async function getUnitBudgetSummary(unitId: string, year: number) {
  return prisma.researchBudget.aggregate({
    where: { project: { unitId, budgetYear: year } },
    _sum: { totalApproved: true, totalSpent: true },
    _count: { id: true },
  })
}

export async function getUnitWorkCount(unitId: string, year: number) {
  return prisma.scientificWork.count({
    where: {
      year,
      isDeleted: false,
      authors: {
        some: {
          scientist: {
            isNot: null,
            user: { unitRelation: { id: unitId } },
          },
        },
      },
    },
  })
}

// ─── Researcher layer ─────────────────────────────────────────────────────────

export async function getResearcherOwnProjects(userId: string) {
  return prisma.nckhProject.findMany({
    where: { principalInvestigatorId: userId },
    orderBy: { updatedAt: 'desc' },
    take: 10,
    select: {
      id: true,
      projectCode: true,
      title: true,
      status: true,
      phase: true,
      startDate: true,
      endDate: true,
      field: true,
    },
  })
}

export async function getResearcherPublicationSummary(userId: string) {
  const [total, isi, scopus, recentPubs] = await Promise.all([
    prisma.nckhPublication.count({ where: { authorId: userId } }),
    prisma.nckhPublication.count({ where: { authorId: userId, isISI: true } }),
    prisma.nckhPublication.count({ where: { authorId: userId, isScopus: true } }),
    prisma.nckhPublication.findMany({
      where: { authorId: userId },
      orderBy: { publishedYear: 'desc' },
      take: 5,
      select: {
        id: true,
        title: true,
        journalName: true,
        publishedYear: true,
        isISI: true,
        isScopus: true,
      },
    }),
  ])
  return { total, isi, scopus, recentPubs }
}

export async function getResearcherProfile(userId: string) {
  return prisma.nckhScientistProfile.findUnique({
    where: { userId },
    select: {
      id: true,
      hIndex: true,
      i10Index: true,
      totalCitations: true,
      totalPublications: true,
      primaryField: true,
      researchKeywords: true,
      academicRank: true,
      orcidId: true,
      projectLeadCount: true,
      projectMemberCount: true,
    },
  })
}

export async function getResearcherWorkCount(userId: string) {
  return prisma.scientificWork.count({
    where: {
      isDeleted: false,
      authors: { some: { scientist: { user: { id: userId } } } },
    },
  })
}

// ─── Reviewer layer ───────────────────────────────────────────────────────────

export async function getReviewerCouncils(userId: string) {
  return prisma.scientificCouncilMember.findMany({
    where: { userId },
    select: {
      id: true,
      role: true,
      council: {
        select: {
          id: true,
          type: true,
          type: true,
          result: true,      // null = pending, PASS|FAIL|REVISE = concluded
          meetingDate: true,
          project: { select: { id: true, title: true, projectCode: true } },
        },
      },
    },
  })
}

export async function getReviewerPendingReviews(userId: string) {
  // Step 1: Get all member IDs for this user
  const myMemberships = await prisma.scientificCouncilMember.findMany({
    where: { userId, council: { result: null } }, // result=null → council not yet concluded
    select: { id: true, council: { select: { id: true, name: true, meetingDate: true, project: { select: { id: true, title: true } } } } },
  })

  if (myMemberships.length === 0) return []

  const myMemberIds = myMemberships.map((m) => m.id)

  // Step 2: Find which member IDs already have at least one review entry
  const reviewedIds = await prisma.$queryRawUnsafe<{ member_id: string }[]>(
    `SELECT DISTINCT "memberId" AS member_id FROM "scientific_council_reviews" WHERE "memberId" = ANY($1::text[])`,
    myMemberIds,
  )
  const reviewedSet = new Set(reviewedIds.map((r) => r.member_id))

  // Step 3: Return memberships where the member has NOT yet submitted any review
  return myMemberships.filter((m) => !reviewedSet.has(m.id))
}
