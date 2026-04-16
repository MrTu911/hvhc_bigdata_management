/**
 * PersonnelPlanningService – M02 UC-14
 * Talent search scoring engine.
 *
 * Architecture (per user's chốt decisions):
 *  - Hard filters: eliminate candidates before scoring.
 *    A failed hard filter = candidate excluded entirely.
 *  - Soft scores: weighted signals → rank remaining candidates.
 *    No single soft signal blocks a candidate.
 *  - TalentSearchConfig: internal config object (not UI-editable in Phase 1).
 *    Abstraction point left open for Phase 2 / M19 config override.
 *
 * [M01-RBAC-HOOK] scope normalization follows same pattern as search service.
 */
import 'server-only'
import db from '@/lib/db'
import { PersonnelSearchRepo } from '@/lib/repositories/personnel/personnel-search.repo'
import type {
  PersonnelForScoring,
} from '@/lib/repositories/personnel/personnel-search.repo'
import { talentSearchSchema } from '@/lib/validators/personnel-search.schema'
import type { AuthUser } from '@/lib/rbac/types'
import type { FunctionScope, PersonnelCategory, PersonnelStatus, CareerEventType } from '@prisma/client'

// ─── Internal config object ───────────────────────────────────────────────────

interface TalentSearchConfig {
  hardFilters: {
    /** Exclude candidates that do not meet requiredDegree */
    enforceDegree: boolean
    /** Exclude candidates that do not meet requiredPoliticalTheory */
    enforcePoliticalTheory: boolean
    /** Exclude candidates with < requiredServiceYearsMin service years */
    enforceServiceYears: boolean
    /** Exclude candidates with an active serious discipline record */
    blockActiveSeriousDiscipline: boolean
  }
  softWeights: {
    preferredMajor: number           // max 20
    hasResearch: number              // max 10
    rewardCount: number              // max 5 per reward, capped at 15
    noActiveDiscipline: number       // max 5
    sameUnit: number                 // max 15
    similarPositionExperience: number // max 10
    ageFit: number                   // max 8
    degreeAboveMinimum: number       // max 7
  }
}

const DEFAULT_TALENT_CONFIG: TalentSearchConfig = {
  hardFilters: {
    enforceDegree: false,
    enforcePoliticalTheory: false,
    enforceServiceYears: false,
    blockActiveSeriousDiscipline: true,
  },
  softWeights: {
    preferredMajor: 20,
    hasResearch: 10,
    rewardCount: 5,
    noActiveDiscipline: 5,
    sameUnit: 15,
    similarPositionExperience: 10,
    ageFit: 8,
    degreeAboveMinimum: 7,
  },
}

// ─── Degree ordering (higher index = higher degree) ──────────────────────────

const DEGREE_ORDER = ['', 'cao dang', 'dai hoc', 'thac si', 'tien si', 'pgs.ts', 'gs.ts']

function degreeRank(degree: string | null | undefined): number {
  if (!degree) return 0
  const normalized = degree.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  const idx = DEGREE_ORDER.findIndex((d) => normalized.includes(d))
  return idx < 0 ? 0 : idx
}

// ─── Service-years helper ─────────────────────────────────────────────────────

function computeServiceYears(enlistmentDate: Date | null | undefined): number {
  if (!enlistmentDate) return 0
  return new Date().getFullYear() - new Date(enlistmentDate).getFullYear()
}

// ─── Hard-filter helper ───────────────────────────────────────────────────────

interface HardFilterResult {
  passed: boolean
  failedReasons: string[]
}

function applyHardFilters(
  p: PersonnelForScoring,
  input: ReturnType<typeof talentSearchSchema.parse>,
  config: TalentSearchConfig,
): HardFilterResult {
  const reasons: string[] = []

  // Block active serious discipline (DISCIPLINE type + ACTIVE status)
  if (config.hardFilters.blockActiveSeriousDiscipline) {
    const hasActiveDiscipline = p.account?.policyRecords?.some(
      (r) => r.recordType === 'DISCIPLINE' && r.status === 'ACTIVE',
    )
    if (hasActiveDiscipline) {
      reasons.push('Đang trong thời gian kỷ luật')
    }
  }

  // Enforce degree
  if (config.hardFilters.enforceDegree && input.requiredDegree) {
    const candidateRank = degreeRank(p.academicDegree)
    const requiredRank = degreeRank(input.requiredDegree)
    if (candidateRank < requiredRank) {
      reasons.push(`Chưa đạt trình độ học vấn yêu cầu (${input.requiredDegree})`)
    }
  }

  // Enforce political theory
  if (config.hardFilters.enforcePoliticalTheory && input.requiredPoliticalTheory) {
    if (!p.politicalTheory || !p.politicalTheory.toLowerCase().includes(
      input.requiredPoliticalTheory.toLowerCase(),
    )) {
      reasons.push(`Chưa đạt lý luận chính trị yêu cầu (${input.requiredPoliticalTheory})`)
    }
  }

  // Enforce service years
  if (config.hardFilters.enforceServiceYears && input.requiredServiceYearsMin !== undefined) {
    const years = computeServiceYears(p.enlistmentDate)
    if (years < input.requiredServiceYearsMin) {
      reasons.push(`Chưa đủ ${input.requiredServiceYearsMin} năm công tác`)
    }
  }

  return { passed: reasons.length === 0, failedReasons: reasons }
}

// ─── Soft-scoring helper ──────────────────────────────────────────────────────

interface ScoreDetail {
  criterion: string
  points: number
  max: number
}

interface SoftScoreResult {
  total: number
  details: ScoreDetail[]
  /** Criteria present in the candidate but not required → shown as strengths */
  strengths: string[]
  /** Required criteria that the candidate lacks but not hard-blocked */
  missingCriteria: string[]
}

function applySoftScores(
  p: PersonnelForScoring,
  input: ReturnType<typeof talentSearchSchema.parse>,
  requestedUnitId: string | undefined,
  config: TalentSearchConfig,
): SoftScoreResult {
  const details: ScoreDetail[] = []
  const strengths: string[] = []
  const missingCriteria: string[] = []
  const w = config.softWeights

  // 1. Preferred major match
  if (input.preferredMajor && input.preferredMajor.length > 0) {
    const spec = (p.specialization ?? '').toLowerCase()
    const hit = input.preferredMajor.some((m) => spec.includes(m.toLowerCase()))
    details.push({ criterion: 'Chuyên ngành phù hợp', points: hit ? w.preferredMajor : 0, max: w.preferredMajor })
    if (!hit) missingCriteria.push('Chuyên ngành ưu tiên')
  }

  // 2. Has research (scientific profile exists)
  const hasResearch = !!p.scientificProfile
  details.push({ criterion: 'Có hồ sơ nghiên cứu khoa học', points: hasResearch ? w.hasResearch : 0, max: w.hasResearch })
  if (hasResearch) strengths.push('Nghiên cứu khoa học')

  // 3. Reward count (EMULATION / REWARD type, APPROVED workflow)
  const rewardCount = p.account?.policyRecords?.filter(
    (r) => (r.recordType === 'EMULATION' || r.recordType === 'REWARD') && r.workflowStatus === 'APPROVED',
  ).length ?? 0
  const rewardPoints = Math.min(rewardCount * w.rewardCount, 15)
  details.push({ criterion: 'Khen thưởng', points: rewardPoints, max: 15 })
  if (rewardCount > 0) strengths.push(`${rewardCount} khen thưởng`)

  // 4. No active discipline
  const hasActiveDiscipline = p.account?.policyRecords?.some(
    (r) => r.recordType === 'DISCIPLINE' && r.status === 'ACTIVE',
  )
  details.push({
    criterion: 'Không có kỷ luật đang hiệu lực',
    points: hasActiveDiscipline ? 0 : w.noActiveDiscipline,
    max: w.noActiveDiscipline,
  })

  // 5. Same unit bonus
  if (requestedUnitId) {
    const sameUnit = p.unitId === requestedUnitId
    details.push({ criterion: 'Cùng đơn vị yêu cầu', points: sameUnit ? w.sameUnit : 0, max: w.sameUnit })
    if (sameUnit) strengths.push('Cùng đơn vị')
  }

  // 6. Similar position experience (career events: APPOINTMENT / POSITION_CHANGE)
  const POSITION_EVENT_TYPES: CareerEventType[] = ['APPOINTMENT', 'POSITION_CHANGE']
  const hasPositionExp = input.targetPosition
    ? p.careerHistories?.some(
        (c) =>
          POSITION_EVENT_TYPES.includes(c.eventType) &&
          c.newPosition &&
          input.targetPosition &&
          c.newPosition.toLowerCase().includes(input.targetPosition.toLowerCase()),
      )
    : false
  details.push({
    criterion: 'Kinh nghiệm chức vụ tương tự',
    points: hasPositionExp ? w.similarPositionExperience : 0,
    max: w.similarPositionExperience,
  })
  if (hasPositionExp) strengths.push('Kinh nghiệm chức vụ tương tự')

  // 7. Age fit: prefer 30–50 for command positions (generic heuristic, Phase 2 can be refined)
  const birthYear = p.dateOfBirth ? new Date(p.dateOfBirth).getFullYear() : null
  const age = birthYear ? new Date().getFullYear() - birthYear : null
  const ageFitPoints = age !== null && age >= 30 && age <= 55 ? w.ageFit : 0
  details.push({ criterion: 'Tuổi phù hợp (30–55)', points: ageFitPoints, max: w.ageFit })

  // 8. Degree above minimum
  if (input.requiredDegree) {
    const candidateRank = degreeRank(p.academicDegree)
    const requiredRank = degreeRank(input.requiredDegree)
    const aboveMin = candidateRank > requiredRank
    details.push({
      criterion: 'Trình độ vượt yêu cầu tối thiểu',
      points: aboveMin ? w.degreeAboveMinimum : 0,
      max: w.degreeAboveMinimum,
    })
    if (aboveMin) strengths.push('Trình độ vượt yêu cầu')
    else if (candidateRank < requiredRank) missingCriteria.push(`Trình độ (cần ${input.requiredDegree})`)
  }

  const total = details.reduce((sum, d) => sum + d.points, 0)
  return { total, details, strengths, missingCriteria }
}

// ─── Scope normalization (same pattern as search service) ─────────────────────

async function resolveScope(
  user: AuthUser,
  scope: FunctionScope,
  requestedUnitId?: string,
): Promise<{ allowedUnitIds?: string[]; effectiveUnitId?: string }> {
  switch (scope) {
    case 'ACADEMY':
      return { effectiveUnitId: requestedUnitId }
    case 'DEPARTMENT': {
      // [M01-RBAC-HOOK] Replace with department-level unit list from unit hierarchy.
      // Fallback to UNIT-equivalent (user's own unit) to prevent cross-department data leak.
      console.warn(
        '[RBAC][DEPARTMENT-SCOPE-STUB] Unit hierarchy not implemented. ' +
        `Restricting talent search to user.unitId=${user.unitId ?? 'null'}. ` +
        'Implement unit hierarchy query in [M01-RBAC-HOOK] to enable full DEPARTMENT scope.',
      )
      const unitId = user.unitId ?? undefined
      if (!unitId) return { allowedUnitIds: [] }
      return { allowedUnitIds: [unitId], effectiveUnitId: unitId }
    }
    case 'UNIT': {
      const unitId = user.unitId ?? undefined
      if (!unitId) return { allowedUnitIds: [] }
      return { allowedUnitIds: [unitId], effectiveUnitId: unitId }
    }
    case 'SELF':
      return { allowedUnitIds: [] } // SELF scope → empty result for planning
  }
}

// ─── Service ──────────────────────────────────────────────────────────────────

export interface TalentCandidate {
  id: string
  fullName: string
  personnelCode: string
  category: PersonnelCategory | null
  militaryRank: string | null
  position: string | null
  academicDegree: string | null
  academicTitle: string | null
  specialization: string | null
  unitId: string | null
  unitName: string | null
  score: number
  scoreDetails: ScoreDetail[]
  strengths: string[]
  missingCriteria: string[]
  hardFilterPassed: boolean
  hardFilterReasons: string[]
}

export const PersonnelPlanningService = {
  async talentSearch(
    user: AuthUser,
    scope: FunctionScope,
    rawInput: unknown,
    /** Override config – reserved for Phase 2 UI config injection */
    configOverride?: Partial<TalentSearchConfig>,
  ) {
    // SELF scope cannot access planning — requires at minimum UNIT scope
    if (scope === 'SELF') {
      return {
        success: false as const,
        error: 'Không đủ quyền thực hiện tìm kiếm quy hoạch. Yêu cầu tối thiểu phạm vi đơn vị (UNIT).',
        status: 403,
      }
    }

    const parsed = talentSearchSchema.safeParse(rawInput)
    if (!parsed.success) {
      return {
        success: false as const,
        error: parsed.error.flatten().fieldErrors,
        status: 400,
      }
    }

    const input = parsed.data
    const config: TalentSearchConfig = {
      hardFilters: { ...DEFAULT_TALENT_CONFIG.hardFilters, ...(configOverride?.hardFilters ?? {}) },
      softWeights: { ...DEFAULT_TALENT_CONFIG.softWeights, ...(configOverride?.softWeights ?? {}) },
    }

    const scopeConstraints = await resolveScope(user, scope, input.requiredUnitId)

    // ── Step 1: broad filter via repo (pre-scoring) ───────────────────────────
    // Load up to topN * 4 candidates to score, then trim to topN
    const batchSize = Math.min(input.topN * 4, 400)

    const searchResult = await PersonnelSearchRepo.search({
      category: input.category,
      unitId: scopeConstraints.effectiveUnitId,
      allowedUnitIds: scopeConstraints.allowedUnitIds,
      // Only plan for active personnel — exclude retired, transferred, discharged
      status: 'DANG_CONG_TAC' as PersonnelStatus,
      // degree & politicalTheory are intentionally NOT used as pre-filter WHERE clauses:
      // these fields are sparsely populated; qualitative evaluation is done in applySoftScores /
      // applyHardFilters (Step 3) via degreeRank() comparison and includes() matching.
      enlistedBefore: input.requiredServiceYearsMin !== undefined
        ? serviceYearsToEnlistedBefore(input.requiredServiceYearsMin)
        : undefined,
      page: 1,
      pageSize: batchSize,
    })

    if (searchResult.data.length === 0) {
      return {
        success: true as const,
        data: [],
        total: 0,
        meta: { topN: input.topN, totalScanned: 0, hardFiltered: 0 },
      }
    }

    // ── Step 2: fetch full scoring payload ───────────────────────────────────
    const ids = searchResult.data.map((p) => p.id)
    const detailed = await PersonnelSearchRepo.findForScoring(ids)

    // ── Step 3: score each candidate ─────────────────────────────────────────
    const candidates: TalentCandidate[] = detailed.map((p) => {
      const hardResult = applyHardFilters(p, input, config)
      const softResult = applySoftScores(
        p,
        input,
        scopeConstraints.effectiveUnitId ?? input.requiredUnitId,
        config,
      )

      return {
        id: p.id,
        fullName: p.fullName,
        personnelCode: p.personnelCode,
        category: p.category,
        militaryRank: p.militaryRank,
        position: p.position,
        academicDegree: p.academicDegree,
        academicTitle: p.academicTitle,
        specialization: p.specialization,
        unitId: p.unitId,
        unitName: p.unit?.name ?? null,
        score: hardResult.passed ? softResult.total : 0,
        scoreDetails: softResult.details,
        strengths: softResult.strengths,
        missingCriteria: softResult.missingCriteria,
        hardFilterPassed: hardResult.passed,
        hardFilterReasons: hardResult.failedReasons,
      }
    })

    // ── Step 4: sort and trim ─────────────────────────────────────────────────
    const sorted = candidates
      .filter((c) => c.hardFilterPassed)
      .sort((a, b) => b.score - a.score)
      .slice(0, input.topN)

    return {
      success: true as const,
      data: sorted,
      total: sorted.length,
      meta: {
        topN: input.topN,
        totalScanned: candidates.length,
        hardFiltered: candidates.filter((c) => !c.hardFilterPassed).length,
      },
    }
  },
}

function serviceYearsToEnlistedBefore(years: number): Date {
  const d = new Date()
  d.setFullYear(d.getFullYear() - years)
  return d
}
