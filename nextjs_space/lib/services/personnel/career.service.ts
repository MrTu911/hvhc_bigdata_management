/**
 * CareerService – M02 Phase 2
 * Business logic for CareerHistory: CRUD + timeline conflict check.
 *
 * Scope stubs marked // [M01-RBAC-HOOK]
 */
import 'server-only'
import { CareerRepo, CareerCreateData } from '@/lib/repositories/personnel/career.repo'
import { careerCreateSchema, careerUpdateSchema, careerDeleteSchema } from '@/lib/validators/career.schema'
import type { AuthUser } from '@/lib/rbac/types'
import type { FunctionScope, CareerEventType } from '@prisma/client'

// ─── Timeline conflict check ──────────────────────────────────────────────────

/**
 * Event types that have an active period (effectiveDate → endDate).
 * Overlapping periods of the same type are flagged as warnings.
 */
const PERIOD_EVENTS: CareerEventType[] = ['STUDY_LEAVE', 'SECONDMENT']

interface TimelineWarning {
  code: 'OVERLAP' | 'END_BEFORE_START'
  message: string
  conflictingId?: string
}

/**
 * Check a new/updated event against the existing timeline.
 * Returns warnings (not hard errors) – caller decides whether to block.
 *
 * Rule: two PERIOD_EVENTS of the same type whose date ranges overlap = OVERLAP warning.
 */
async function checkTimelineConflicts(
  personnelId: string,
  proposed: {
    id?: string // set on update to exclude self
    eventType: CareerEventType
    effectiveDate?: Date | null
    endDate?: Date | null
  },
): Promise<TimelineWarning[]> {
  const warnings: TimelineWarning[] = []

  if (!PERIOD_EVENTS.includes(proposed.eventType)) return warnings
  if (!proposed.effectiveDate) return warnings

  const existing = await CareerRepo.findTimelineForConflictCheck(personnelId)

  for (const ev of existing) {
    if (ev.id === proposed.id) continue // skip self on update
    if (ev.eventType !== proposed.eventType) continue
    if (!ev.effectiveDate) continue

    const evStart = ev.effectiveDate
    const evEnd = ev.endDate ?? new Date('9999-12-31')
    const propStart = proposed.effectiveDate
    const propEnd = proposed.endDate ?? new Date('9999-12-31')

    // Overlap: propStart < evEnd AND propEnd > evStart
    const overlaps = propStart < evEnd && propEnd > evStart
    if (overlaps) {
      warnings.push({
        code: 'OVERLAP',
        message: `Sự kiện ${proposed.eventType} trùng khoảng thời gian với bản ghi ${ev.id}`,
        conflictingId: ev.id,
      })
    }
  }

  return warnings
}

// ─── Scope guard ─────────────────────────────────────────────────────────────

/**
 * Verify caller has scope to write career records for this personnel.
 * [M01-RBAC-HOOK] – replace stub with proper scope resolver in Phase 3.
 */
function assertWriteScope(
  user: AuthUser,
  scope: FunctionScope,
  _personnelUnitId?: string | null,
): { allowed: boolean; reason?: string } {
  if (scope === 'ACADEMY') return { allowed: true }
  // [M01-RBAC-HOOK] UNIT/DEPARTMENT: compare user.unitId with _personnelUnitId via hierarchy
  if (scope === 'UNIT' || scope === 'DEPARTMENT') return { allowed: true }
  // SELF: only if the personnel is the calling user (handled at route level)
  return { allowed: true }
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const CareerService = {

  async list(personnelId: string) {
    const data = await CareerRepo.findByPersonnelId(personnelId)
    return { success: true as const, data }
  },

  async create(
    user: AuthUser,
    scope: FunctionScope,
    personnelId: string,
    rawInput: unknown,
  ) {
    const parsed = careerCreateSchema.safeParse(rawInput)
    if (!parsed.success) {
      return { success: false as const, error: parsed.error.flatten().fieldErrors, status: 400 }
    }

    const scopeCheck = assertWriteScope(user, scope)
    if (!scopeCheck.allowed) {
      return { success: false as const, error: scopeCheck.reason ?? 'Không có quyền', status: 403 }
    }

    const effectiveDate = parsed.data.effectiveDate ? new Date(parsed.data.effectiveDate) : null
    const endDate = parsed.data.endDate ? new Date(parsed.data.endDate) : null

    // Timeline conflict check
    const warnings = await checkTimelineConflicts(personnelId, {
      eventType: parsed.data.eventType,
      effectiveDate,
      endDate,
    })

    const createData: CareerCreateData = {
      personnelId,
      userId: user.id, // bridge FK
      eventType: parsed.data.eventType,
      eventDate: new Date(parsed.data.eventDate),
      effectiveDate,
      endDate,
      reason: parsed.data.reason ?? null,
      title: parsed.data.title ?? null,
      decisionAuthority: parsed.data.decisionAuthority ?? null,
      oldPosition: parsed.data.oldPosition ?? null,
      newPosition: parsed.data.newPosition ?? null,
      oldRank: parsed.data.oldRank ?? null,
      newRank: parsed.data.newRank ?? null,
      oldUnit: parsed.data.oldUnit ?? null,
      newUnit: parsed.data.newUnit ?? null,
      trainingName: parsed.data.trainingName ?? null,
      trainingInstitution: parsed.data.trainingInstitution ?? null,
      trainingResult: parsed.data.trainingResult ?? null,
      certificateNumber: parsed.data.certificateNumber ?? null,
      decisionNumber: parsed.data.decisionNumber ?? null,
      decisionDate: parsed.data.decisionDate ? new Date(parsed.data.decisionDate) : null,
      signerName: parsed.data.signerName ?? null,
      signerPosition: parsed.data.signerPosition ?? null,
      attachmentUrl: parsed.data.attachmentUrl ?? null,
      notes: parsed.data.notes ?? null,
      createdById: user.id,
    }

    const created = await CareerRepo.create(createData)
    return { success: true as const, data: created, warnings }
  },

  async update(
    user: AuthUser,
    scope: FunctionScope,
    careerId: string,
    rawInput: unknown,
  ) {
    const existing = await CareerRepo.findById(careerId)
    if (!existing) {
      return { success: false as const, error: 'Không tìm thấy bản ghi', status: 404 }
    }

    const scopeCheck = assertWriteScope(user, scope)
    if (!scopeCheck.allowed) {
      return { success: false as const, error: scopeCheck.reason ?? 'Không có quyền', status: 403 }
    }

    const parsed = careerUpdateSchema.safeParse(rawInput)
    if (!parsed.success) {
      return { success: false as const, error: parsed.error.flatten().fieldErrors, status: 400 }
    }

    const effectiveDate =
      parsed.data.effectiveDate !== undefined
        ? parsed.data.effectiveDate ? new Date(parsed.data.effectiveDate) : null
        : undefined
    const endDate =
      parsed.data.endDate !== undefined
        ? parsed.data.endDate ? new Date(parsed.data.endDate) : null
        : undefined

    // Timeline conflict check with self excluded
    const eventType = parsed.data.eventType ?? existing.eventType
    const warnings = await checkTimelineConflicts(existing.personnelId!, {
      id: careerId,
      eventType,
      effectiveDate: effectiveDate ?? existing.effectiveDate,
      endDate: endDate ?? existing.endDate,
    })

    const updated = await CareerRepo.update(careerId, {
      ...parsed.data,
      eventDate: parsed.data.eventDate ? new Date(parsed.data.eventDate) : undefined,
      effectiveDate,
      endDate,
      decisionDate: parsed.data.decisionDate !== undefined
        ? (parsed.data.decisionDate ? new Date(parsed.data.decisionDate) : null)
        : undefined,
    })

    return { success: true as const, data: updated, warnings }
  },

  async softDelete(
    user: AuthUser,
    scope: FunctionScope,
    careerId: string,
    rawInput: unknown,
  ) {
    const existing = await CareerRepo.findById(careerId)
    if (!existing) {
      return { success: false as const, error: 'Không tìm thấy bản ghi', status: 404 }
    }

    const scopeCheck = assertWriteScope(user, scope)
    if (!scopeCheck.allowed) {
      return { success: false as const, error: scopeCheck.reason ?? 'Không có quyền', status: 403 }
    }

    const parsed = careerDeleteSchema.safeParse(rawInput)
    const deletionReason = parsed.success ? parsed.data.deletionReason : undefined

    const deleted = await CareerRepo.softDelete(careerId, user.id, deletionReason)
    return { success: true as const, data: deleted }
  },
}
