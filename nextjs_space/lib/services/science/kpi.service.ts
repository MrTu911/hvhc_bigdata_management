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
import { db } from '@/lib/db'
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
  totalBudgetApproved: bigint
  totalBudgetUsed: bigint
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
    db.nckhProject.aggregate({
      where: projectWhere,
      _count: { id: true },
      _avg: { completionScore: true },
    }),
    db.nckhPublication.count({
      where: { publishedYear: year, author: authorUnitFilter },
    }),
    db.nckhPublication.count({
      where: { publishedYear: year, isISI: true, author: authorUnitFilter },
    }),
    db.nckhPublication.count({
      where: { publishedYear: year, isScopus: true, author: authorUnitFilter },
    }),
    db.scientificWork.count({
      where: {
        year,
        isDeleted: false,
        ...(unitId
          ? {
              authors: {
                some: {
                  scientist: { isNot: null, user: { unitRelation: { id: unitId } } },
                },
              },
            }
          : {}),
      },
    }),
    db.researchBudget.aggregate({
      where: { project: projectWhere },
      _sum: { totalApproved: true, totalSpent: true },
    }),
    db.nckhProject.count({
      where: {
        ...projectWhere,
        status: { in: ['APPROVED', 'IN_PROGRESS', 'COMPLETED', 'PAUSED'] },
      },
    }),
    db.nckhProject.count({
      where: { ...projectWhere, status: 'COMPLETED' },
    }),
  ])

  const totalBudgetApproved = budgetAgg._sum.totalApproved ?? BigInt(0)
  const totalBudgetUsed = budgetAgg._sum.totalSpent ?? BigInt(0)
  const budgetUtilizationPct =
    totalBudgetApproved > BigInt(0)
      ? Number((totalBudgetUsed * BigInt(1000)) / totalBudgetApproved) / 10
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
    totalBudgetApproved,
    totalBudgetUsed,
    budgetUtilizationPct,
    avgCompletionScore: projectStats._avg.completionScore ?? 0,
  }

  return {
    ...partial,
    impactScore: calcImpactScore(partial),
    generatedAt: new Date().toISOString(),
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
}
