/**
 * KpiService – CSDL-KHQL Phase 6
 *
 * Aggregate KPI cho một đơn vị theo năm từ:
 *   NckhProject   (M03 – đề tài)
 *   NckhPublication (M03 – bài báo)
 *   ScientificWork  (M04 – công trình)
 *   ResearchBudget  (Phase 5 – kinh phí)
 *
 * Cache Redis 10 phút per (unitId, year).
 */
import 'server-only'
import prisma from '@/lib/db'
import { getCache, setCache } from '@/lib/cache'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UnitKpiData {
  unitId: string
  year: number
  totalProjects: number
  approvedProjects: number
  completedProjects: number
  totalPublications: number
  isiPublications: number
  scopusPublications: number
  totalScientificWorks: number
  totalBudgetApproved: string    // serialized as string — BigInt không JSON-serializable
  totalBudgetUsed: string        // serialized as string — BigInt không JSON-serializable
  budgetUtilizationPct: number   // totalBudgetUsed / totalBudgetApproved * 100
  avgCompletionScore: number
  impactScore: number            // Weighted formula (see below)
  generatedAt: string
}

// ─── Impact score formula ─────────────────────────────────────────────────────
// impactScore = completedProjects * 3
//             + isiPublications  * 5
//             + scopusPublications * 3
//             + (nonISI nonScopus publications) * 1
//             + scientificWorks * 2
//             + (budgetUtilizationPct >= 80 ? 5 : 0)

function calcImpactScore(data: Omit<UnitKpiData, 'impactScore' | 'generatedAt'>): number {
  const otherPubs = data.totalPublications - data.isiPublications - data.scopusPublications
  const budgetBonus = data.budgetUtilizationPct >= 80 ? 5 : 0
  return (
    data.completedProjects * 3 +
    data.isiPublications * 5 +
    data.scopusPublications * 3 +
    Math.max(0, otherPubs) * 1 +
    data.totalScientificWorks * 2 +
    budgetBonus
  )
}

// ─── Aggregation ──────────────────────────────────────────────────────────────

async function aggregate(unitId: string | null, year: number): Promise<UnitKpiData> {
  // unitId = null → academy-wide (no unit filter)
  const unitFilter = unitId ? { unitId } : {}
  const authorUnitFilter = unitId ? { unitRelation: { id: unitId } } : {}
  const projectWhere = { ...unitFilter, budgetYear: year }

  const [
    projectStats,
    pubStats,
    isiCount,
    scopusCount,
    workCount,
    budgetAgg,
    approvedProjects,
    completedProjects,
  ] = await Promise.all([
    prisma.nckhProject.aggregate({
      where: projectWhere,
      _count: { id: true },
      _avg: { completionScore: true },
    }),
    prisma.nckhPublication.count({
      where: { publishedYear: year, author: authorUnitFilter },
    }),
    prisma.nckhPublication.count({
      where: { publishedYear: year, isISI: true, author: authorUnitFilter },
    }),
    prisma.nckhPublication.count({
      where: { publishedYear: year, isScopus: true, author: authorUnitFilter },
    }),
    // ScientificWorkAuthor only has scientistId (no nested relation to user/unit),
    // so unit-scoped filtering for scientificWork is not supported here.
    prisma.scientificWork.count({
      where: { year, isDeleted: false },
    }),
    prisma.researchBudget.aggregate({
      where: { project: projectWhere },
      _sum: { totalApproved: true, totalSpent: true },
    }),
    prisma.nckhProject.count({
      where: {
        ...projectWhere,
        status: { in: ['APPROVED', 'IN_PROGRESS', 'COMPLETED', 'PAUSED'] },
      },
    }),
    prisma.nckhProject.count({
      where: { ...projectWhere, status: 'COMPLETED' },
    }),
  ])

  const rawApproved = budgetAgg._sum.totalApproved ?? BigInt(0)
  const rawUsed     = budgetAgg._sum.totalSpent    ?? BigInt(0)
  const budgetUtilizationPct =
    rawApproved > BigInt(0)
      ? Number((rawUsed * BigInt(1000)) / rawApproved) / 10
      : 0

  const partial: Omit<UnitKpiData, 'impactScore' | 'generatedAt'> = {
    unitId: unitId ?? 'ACADEMY',
    year,
    totalProjects: projectStats._count.id,
    approvedProjects,
    completedProjects,
    totalPublications: pubStats,
    isiPublications: isiCount,
    scopusPublications: scopusCount,
    totalScientificWorks: workCount,
    totalBudgetApproved: rawApproved.toString(),
    totalBudgetUsed:     rawUsed.toString(),
    budgetUtilizationPct,
    avgCompletionScore: projectStats._avg.completionScore ?? 0,
  }

  return {
    ...partial,
    impactScore: calcImpactScore(partial),
    generatedAt: new Date().toISOString(),
  }
}

// ─── Trend analysis ───────────────────────────────────────────────────────────

const APPROVED_STATUSES_FOR_TRENDS = ['APPROVED', 'IN_PROGRESS', 'COMPLETED']

export interface TrendsData {
  byField: { field: string | null; count: number }[]
  byYear: { year: number; count: number }[]
  byFieldYear: { field: string | null; year: number; count: number }[]
  topKeywords: { keyword: string; count: number }[]
  publicationsByYear: { year: number; count: number }[]
  meta: { yearFrom: number; yearTo: number; statuses: string[] }
}

async function aggregateTrends(yearSpan: number): Promise<TrendsData> {
  const currentYear = new Date().getFullYear()
  const yearFrom    = currentYear - yearSpan + 1

  const [byField, byYear, byFieldYearRaw, keywordsRaw, pubsByYear] = await Promise.all([
    prisma.nckhProject.groupBy({
      by: ['field'],
      where: { status: { in: APPROVED_STATUSES_FOR_TRENDS as any } },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    }),
    prisma.nckhProject.groupBy({
      by: ['budgetYear'],
      where: {
        status:     { in: APPROVED_STATUSES_FOR_TRENDS as any },
        budgetYear: { gte: yearFrom, lte: currentYear },
      },
      _count: { id: true },
      orderBy: { budgetYear: 'asc' },
    }),
    prisma.nckhProject.groupBy({
      by: ['field', 'budgetYear'],
      where: {
        status:     { in: APPROVED_STATUSES_FOR_TRENDS as any },
        budgetYear: { gte: yearFrom, lte: currentYear },
      },
      _count: { id: true },
    }),
    prisma.nckhProject.findMany({
      where: { status: { in: APPROVED_STATUSES_FOR_TRENDS as any } },
      select: { keywords: true },
      take: 500,
    }),
    prisma.nckhPublication.groupBy({
      by: ['publishedYear'],
      where: { publishedYear: { gte: yearFrom, lte: currentYear } },
      _count: { id: true },
      orderBy: { publishedYear: 'asc' },
    }),
  ])

  const kwFreq = new Map<string, number>()
  for (const row of keywordsRaw) {
    for (const kw of row.keywords) {
      const k = kw.trim().toLowerCase()
      if (k.length >= 3) kwFreq.set(k, (kwFreq.get(k) ?? 0) + 1)
    }
  }
  const topKeywords = [...kwFreq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([keyword, count]) => ({ keyword, count }))

  return {
    byField:            byField.map((r) => ({ field: r.field as string | null, count: r._count.id })),
    byYear:             byYear
                          .filter((r): r is typeof r & { budgetYear: number } => r.budgetYear !== null)
                          .map((r) => ({ year: r.budgetYear, count: r._count.id })),
    byFieldYear:        byFieldYearRaw
                          .filter((r): r is typeof r & { budgetYear: number } => r.budgetYear !== null)
                          .map((r) => ({ field: r.field as string | null, year: r.budgetYear, count: r._count.id })),
    topKeywords,
    publicationsByYear: pubsByYear
                          .filter((r): r is typeof r & { publishedYear: number } => r.publishedYear !== null)
                          .map((r) => ({ year: r.publishedYear, count: r._count.id })),
    meta:               { yearFrom, yearTo: currentYear, statuses: APPROVED_STATUSES_FOR_TRENDS },
  }
}

// ─── Service ──────────────────────────────────────────────────────────────────

const CACHE_TTL_SECONDS = 10 * 60 // 10 phút

export const kpiService = {
  async getUnitPerformance(unitId: string, year: number) {
    const cacheKey = `science:kpi:unit:${unitId}:${year}`

    const cached = await getCache<UnitKpiData>(cacheKey)
    if (cached) return { success: true as const, data: cached, fromCache: true }

    const data = await aggregate(unitId, year)
    await setCache(cacheKey, data, CACHE_TTL_SECONDS)

    return { success: true as const, data, fromCache: false }
  },

  /** Academy-wide aggregate: no unit filter */
  async getAcademyPerformance(year: number) {
    const cacheKey = `science:kpi:academy:${year}`

    const cached = await getCache<UnitKpiData>(cacheKey)
    if (cached) return { success: true as const, data: cached, fromCache: true }

    const data = await aggregate(null, year)
    await setCache(cacheKey, data, CACHE_TTL_SECONDS)

    return { success: true as const, data, fromCache: false }
  },

  /** Trend analysis for AI/analytics layer (M26) — cached 10 min */
  async getTrends(yearSpan = 5) {
    const cacheKey = `science:kpi:trends:${yearSpan}`

    const cached = await getCache<TrendsData>(cacheKey)
    if (cached) return { success: true as const, data: cached, fromCache: true }

    const data = await aggregateTrends(yearSpan)
    await setCache(cacheKey, data, CACHE_TTL_SECONDS)

    return { success: true as const, data, fromCache: false }
  },
}
