/**
 * DataQualityService – CSDL-KHQL Phase 8
 *
 * Computes DataQualityScore for PROJECT, PUBLICATION, and SCIENTIST entity types.
 *
 * Three dimensions, weighted 40/40/20:
 *   completeness — % of required fields that are non-null/non-empty
 *   accuracy     — % of validation rules that pass (cross-field consistency)
 *   timeliness   — % of sampled records updated within the configured threshold
 *
 * Evaluation runs on recent records (last N per type) to keep latency manageable.
 */
import 'server-only'
import prisma from '@/lib/db'
import { getCache, setCache } from '@/lib/cache'

// ─── Config ───────────────────────────────────────────────────────────────────

const SAMPLE_SIZE        = 200     // records evaluated per entity type
const TIMELINESS_DAYS    = { PROJECT: 90, PUBLICATION: 180, SCIENTIST: 365 }
const CACHE_TTL_SECONDS  = 30 * 60 // 30 min (data quality is expensive)

// ─── Types ────────────────────────────────────────────────────────────────────

export type QualityEntityType = 'PROJECT' | 'PUBLICATION' | 'SCIENTIST'

export interface DataQualityScore {
  entityType:   QualityEntityType
  completeness: number   // 0–100 %
  accuracy:     number   // 0–100 %
  timeliness:   number   // 0–100 %
  overallScore: number   // 0.40*completeness + 0.40*accuracy + 0.20*timeliness
  sampleSize:   number
  evaluatedAt:  string
}

export interface DataQualityReport {
  scores:      DataQualityScore[]
  overallAvg:  number   // avg of all entity overallScores
  generatedAt: string
  fromCache:   boolean
}

// ─── Project quality ──────────────────────────────────────────────────────────

async function scoreProject(unitId?: string): Promise<DataQualityScore> {
  const where = unitId ? { unitId } : {}
  const records = await prisma.nckhProject.findMany({
    where,
    orderBy: { updatedAt: 'desc' },
    take: SAMPLE_SIZE,
    select: {
      title: true, abstract: true, keywords: true,
      startDate: true, endDate: true, budgetYear: true,
      field: true, category: true, researchType: true,
      budgetRequested: true, updatedAt: true,
    },
  })

  if (records.length === 0) return emptyScore('PROJECT')

  const threshold = daysAgo(TIMELINESS_DAYS.PROJECT)
  let compTotal = 0, accTotal = 0, timelyCount = 0

  for (const r of records) {
    // Completeness: 6 required-quality fields
    const filled = [
      r.abstract, r.keywords.length > 0 ? 'ok' : null,
      r.startDate, r.endDate, r.budgetYear,
      r.budgetRequested,
    ].filter(Boolean).length
    compTotal += filled / 6

    // Accuracy: cross-field rules
    let rulesPassed = 0, rulesTotal = 2
    if (r.startDate && r.endDate) {
      rulesTotal++
      if (r.startDate < r.endDate) rulesPassed++
    }
    if (r.budgetRequested !== null && r.budgetRequested !== undefined) {
      rulesPassed += r.budgetRequested >= 0 ? 1 : 0
    } else {
      rulesPassed += 1 // no budget = not a violation
    }
    rulesPassed += r.title.length >= 10 ? 1 : 0 // title meaningful
    accTotal += rulesPassed / rulesTotal

    // Timeliness
    if (r.updatedAt >= threshold) timelyCount++
  }

  const n = records.length
  return buildScore('PROJECT', n, compTotal / n, accTotal / n, timelyCount / n)
}

// ─── Publication quality ──────────────────────────────────────────────────────

async function scorePublication(unitId?: string): Promise<DataQualityScore> {
  const where = unitId ? { unitId } : {}
  const records = await prisma.nckhPublication.findMany({
    where,
    orderBy: { updatedAt: 'desc' },
    take: SAMPLE_SIZE,
    select: {
      title: true, abstract: true, publishedYear: true, pubType: true,
      journal: true, conferenceName: true, keywords: true,
      citationCount: true, updatedAt: true,
    },
  })

  if (records.length === 0) return emptyScore('PUBLICATION')

  const threshold = daysAgo(TIMELINESS_DAYS.PUBLICATION)
  let compTotal = 0, accTotal = 0, timelyCount = 0
  const currentYear = new Date().getFullYear()

  for (const r of records) {
    // Completeness: abstract, year, venue (journal or conference), keywords
    const venue = r.journal ?? r.conferenceName
    const filled = [
      r.abstract,
      r.publishedYear,
      venue,
      r.keywords.length > 0 ? 'ok' : null,
    ].filter(Boolean).length
    compTotal += filled / 4

    // Accuracy: year in range, citationCount >= 0
    const yearOk = r.publishedYear != null && r.publishedYear >= 1900 && r.publishedYear <= currentYear + 1
    const citeOk = r.citationCount >= 0
    accTotal += ((yearOk ? 1 : 0) + (citeOk ? 1 : 0)) / 2

    if (r.updatedAt >= threshold) timelyCount++
  }

  const n = records.length
  return buildScore('PUBLICATION', n, compTotal / n, accTotal / n, timelyCount / n)
}

// ─── Scientist quality ────────────────────────────────────────────────────────

async function scoreScientist(unitId?: string): Promise<DataQualityScore> {
  const where = unitId
    ? { user: { unitRelation: { id: unitId } } }
    : {}
  const records = await prisma.nckhScientistProfile.findMany({
    where,
    orderBy: { updatedAt: 'desc' },
    take: SAMPLE_SIZE,
    select: {
      primaryField: true, bio: true, orcidId: true,
      googleScholarId: true, researchKeywords: true,
      hIndex: true, totalCitations: true, updatedAt: true,
    },
  })

  if (records.length === 0) return emptyScore('SCIENTIST')

  const threshold = daysAgo(TIMELINESS_DAYS.SCIENTIST)
  let compTotal = 0, accTotal = 0, timelyCount = 0

  for (const r of records) {
    // Completeness: primaryField, bio, at least one external ID, keywords
    const hasExternalId = !!(r.orcidId ?? r.googleScholarId)
    const filled = [
      r.primaryField, r.bio,
      hasExternalId ? 'ok' : null,
      r.researchKeywords.length > 0 ? 'ok' : null,
    ].filter(Boolean).length
    compTotal += filled / 4

    // Accuracy: hIndex >= 0, totalCitations >= 0, consistent
    const hOk   = r.hIndex >= 0
    const citOk = r.totalCitations >= 0
    const consistent = r.hIndex <= r.totalCitations  // h-index ≤ citations is always true
    accTotal += ((hOk ? 1 : 0) + (citOk ? 1 : 0) + (consistent ? 1 : 0)) / 3

    if (r.updatedAt >= threshold) timelyCount++
  }

  const n = records.length
  return buildScore('SCIENTIST', n, compTotal / n, accTotal / n, timelyCount / n)
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function daysAgo(days: number): Date {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d
}

function pct(ratio: number): number {
  return Math.round(ratio * 1000) / 10  // one decimal place
}

function buildScore(
  entityType: QualityEntityType,
  sampleSize: number,
  completeness: number,
  accuracy: number,
  timeliness: number,
): DataQualityScore {
  const c = pct(completeness), a = pct(accuracy), t = pct(timeliness)
  const overall = Math.round((0.40 * c + 0.40 * a + 0.20 * t) * 10) / 10
  return { entityType, completeness: c, accuracy: a, timeliness: t, overallScore: overall, sampleSize, evaluatedAt: new Date().toISOString() }
}

function emptyScore(entityType: QualityEntityType): DataQualityScore {
  return { entityType, completeness: 0, accuracy: 0, timeliness: 0, overallScore: 0, sampleSize: 0, evaluatedAt: new Date().toISOString() }
}

// ─── Public service ───────────────────────────────────────────────────────────

export const dataQualityService = {
  async getReport(unitId?: string): Promise<DataQualityReport> {
    const cacheKey = `science:data-quality:${unitId ?? 'academy'}`
    const cached = await getCache<DataQualityReport>(cacheKey)
    if (cached) return { ...cached, fromCache: true }

    const [projectScore, pubScore, scientistScore] = await Promise.all([
      scoreProject(unitId),
      scorePublication(unitId),
      scoreScientist(unitId),
    ])

    const scores = [projectScore, pubScore, scientistScore]
    const overallAvg = Math.round(scores.reduce((s, sc) => s + sc.overallScore, 0) / scores.length * 10) / 10

    const report: DataQualityReport = {
      scores,
      overallAvg,
      generatedAt: new Date().toISOString(),
      fromCache: false,
    }

    await setCache(cacheKey, report, CACHE_TTL_SECONDS)
    return report
  },
}
