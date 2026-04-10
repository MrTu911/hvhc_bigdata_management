/**
 * DashboardService – CSDL-KHQL Phase 7
 *
 * Detects which dashboard layer the caller belongs to (ACADEMY > UNIT > REVIEWER > RESEARCHER)
 * and returns the appropriate aggregated data.
 *
 * Layer detection via RBAC function codes (priority order):
 *   1. ACADEMY  — has PROJECT_APPROVE_ACADEMY
 *   2. UNIT     — has PROJECT_APPROVE_DEPT
 *   3. REVIEWER — has COUNCIL_SUBMIT_REVIEW
 *   4. RESEARCHER (default, requires DASHBOARD_VIEW)
 */
import 'server-only'
import { authorize } from '@/lib/rbac/authorize'
import { SCIENCE } from '@/lib/rbac/function-codes'
import { kpiService } from '@/lib/services/science/kpi.service'
import {
  getAcademyProjectDistribution,
  getTopResearchers,
  getAcademyRecentActivity,
  getUnitProjectSummary,
  getUnitBudgetSummary,
  getUnitWorkCount,
  getResearcherOwnProjects,
  getResearcherPublicationSummary,
  getResearcherProfile,
  getResearcherWorkCount,
  getReviewerCouncils,
  getReviewerPendingReviews,
} from '@/lib/repositories/science/dashboard.repo'
import { getCache, setCache } from '@/lib/cache'

// ─── Types ────────────────────────────────────────────────────────────────────

export type DashboardLayer = 'ACADEMY' | 'UNIT' | 'REVIEWER' | 'RESEARCHER'

export interface AuthUser {
  id: string
  unitId?: string | null
  [key: string]: unknown
}

// Cache TTL: 5 min for dashboard (lower than KPI because it includes real-time council state)
const DASHBOARD_TTL = 5 * 60

// ─── Layer detection ──────────────────────────────────────────────────────────

async function detectLayer(user: AuthUser): Promise<DashboardLayer> {
  const [isAcademy, isUnit, isReviewer] = await Promise.all([
    authorize(user as never, SCIENCE.PROJECT_APPROVE_ACADEMY),
    authorize(user as never, SCIENCE.PROJECT_APPROVE_DEPT),
    authorize(user as never, SCIENCE.COUNCIL_SUBMIT_REVIEW),
  ])

  if (isAcademy.allowed) return 'ACADEMY'
  if (isUnit.allowed)    return 'UNIT'
  if (isReviewer.allowed) return 'REVIEWER'
  return 'RESEARCHER'
}

// ─── Layer data builders ──────────────────────────────────────────────────────

async function buildAcademyDashboard(year: number) {
  const [kpi, distribution, topResearchers, recentActivity] = await Promise.all([
    kpiService.getAcademyPerformance(year),
    getAcademyProjectDistribution(year),
    getTopResearchers(10),
    getAcademyRecentActivity(10),
  ])
  return {
    layer: 'ACADEMY' as const,
    year,
    kpi: kpi.data,
    fromCache: kpi.fromCache,
    distribution,
    topResearchers,
    recentActivity,
  }
}

async function buildUnitDashboard(unitId: string, year: number) {
  const [kpi, projectSummary, budgetSummary, workCount] = await Promise.all([
    kpiService.getUnitPerformance(unitId, year),
    getUnitProjectSummary(unitId, year),
    getUnitBudgetSummary(unitId, year),
    getUnitWorkCount(unitId, year),
  ])
  return {
    layer: 'UNIT' as const,
    unitId,
    year,
    kpi: kpi.data,
    fromCache: kpi.fromCache,
    projectSummary,
    budget: {
      totalApproved: budgetSummary._sum.totalApproved?.toString() ?? '0',
      totalSpent:    budgetSummary._sum.totalSpent?.toString() ?? '0',
      projectCount:  budgetSummary._count.id,
    },
    workCount,
  }
}

async function buildResearcherDashboard(userId: string) {
  const [ownProjects, pubSummary, profile, workCount] = await Promise.all([
    getResearcherOwnProjects(userId),
    getResearcherPublicationSummary(userId),
    getResearcherProfile(userId),
    getResearcherWorkCount(userId),
  ])
  return {
    layer:       'RESEARCHER' as const,
    userId,
    profile,
    ownProjects,
    publications: pubSummary,
    workCount,
  }
}

async function buildReviewerDashboard(userId: string) {
  const [allCouncils, pendingReviews] = await Promise.all([
    getReviewerCouncils(userId),
    getReviewerPendingReviews(userId),
  ])
  return {
    layer:          'REVIEWER' as const,
    userId,
    councils:       allCouncils,
    pendingReviews,
    pendingCount:   pendingReviews.length,
  }
}

// ─── Public service ───────────────────────────────────────────────────────────

export const dashboardService = {
  async getDashboard(user: AuthUser, year: number) {
    const layer = await detectLayer(user)

    // Reviewer layer is real-time (no cache — council state changes frequently)
    if (layer === 'REVIEWER') {
      return buildReviewerDashboard(user.id)
    }

    // Researcher layer: cache per user
    if (layer === 'RESEARCHER') {
      const cacheKey = `science:dashboard:researcher:${user.id}`
      const cached = await getCache<ReturnType<typeof buildResearcherDashboard>>(cacheKey)
      if (cached) return cached
      const data = await buildResearcherDashboard(user.id)
      await setCache(cacheKey, data, DASHBOARD_TTL)
      return data
    }

    // Unit layer: requires unitId
    if (layer === 'UNIT') {
      if (!user.unitId) {
        // No unit assigned — fall back to researcher view
        return buildResearcherDashboard(user.id)
      }
      const cacheKey = `science:dashboard:unit:${user.unitId}:${year}`
      const cached = await getCache<ReturnType<typeof buildUnitDashboard>>(cacheKey)
      if (cached) return cached
      const data = await buildUnitDashboard(user.unitId, year)
      await setCache(cacheKey, data, DASHBOARD_TTL)
      return data
    }

    // Academy layer
    const cacheKey = `science:dashboard:academy:${year}`
    const cached = await getCache<ReturnType<typeof buildAcademyDashboard>>(cacheKey)
    if (cached) return cached
    const data = await buildAcademyDashboard(year)
    await setCache(cacheKey, data, DASHBOARD_TTL)
    return data
  },
}
