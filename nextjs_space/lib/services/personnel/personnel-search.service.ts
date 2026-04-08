/**
 * PersonnelSearchService – M02 UC-13 / UC-14
 * Scope-aware search for Personnel.
 *
 * Scope enforcement follows the [M01-RBAC-HOOK] pattern:
 *  ACADEMY   → unrestricted
 *  DEPARTMENT → allowedUnitIds from unit hierarchy (stub)
 *  UNIT      → allowedUnitIds = [user.unitId]
 *  SELF      → selfPersonnelId = personnel linked to user
 */
import 'server-only'
import { PersonnelSearchRepo } from '@/lib/repositories/personnel/personnel-search.repo'
import { personnelSearchSchema } from '@/lib/validators/personnel-search.schema'
import type { AuthUser } from '@/lib/rbac/types'
import type { FunctionScope } from '@prisma/client'

// ─── Scope normalization ──────────────────────────────────────────────────────

/**
 * Normalise M01 scope into repo filter constraints.
 *
 * [M01-RBAC-HOOK] UNIT / DEPARTMENT: real hierarchy lookup needed.
 * For now UNIT returns allowedUnitIds = [user.unitId].
 * DEPARTMENT stub returns unrestricted (replace with hierarchy query).
 */
async function normalizeTalentSearchScope(
  user: AuthUser,
  scope: FunctionScope,
  requestedUnitId?: string,
): Promise<{
  allowedUnitIds?: string[]
  selfPersonnelId?: string
  /** Final unitId to apply (may be overridden by scope) */
  effectiveUnitId?: string
}> {
  switch (scope) {
    case 'ACADEMY':
      return { effectiveUnitId: requestedUnitId }

    case 'DEPARTMENT': {
      // [M01-RBAC-HOOK] Replace with department-level unit list from unit hierarchy.
      // Until the hierarchy query is implemented, fall back to UNIT-equivalent
      // (user's own unit only) to prevent cross-department data exposure.
      // DO NOT fall back to ACADEMY-equivalent (unrestricted) here.
      console.warn(
        '[RBAC][DEPARTMENT-SCOPE-STUB] Unit hierarchy not implemented. ' +
        `Restricting search to user.unitId=${user.unitId ?? 'null'} to prevent data leak. ` +
        'Implement unit hierarchy query in [M01-RBAC-HOOK] to enable full DEPARTMENT scope.',
      )
      const unitId = user.unitId ?? undefined
      if (!unitId) return { allowedUnitIds: [] }
      return { allowedUnitIds: [unitId], effectiveUnitId: unitId }
    }

    case 'UNIT': {
      const unitId = user.unitId ?? undefined
      if (!unitId) return { allowedUnitIds: [] } // no unit → empty result
      // UNIT scope cannot search outside own unit; override requestedUnitId
      return { allowedUnitIds: [unitId], effectiveUnitId: unitId }
    }

    case 'SELF':
      // [M01-RBAC-HOOK] Resolve user.id → Personnel.id (bridge)
      // Returning selfPersonnelId = user.id is a stub; real impl queries Personnel.account
      return { selfPersonnelId: user.id }
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Convert ageMin → the latest acceptable date-of-birth */
function ageToDobBefore(ageMin: number): Date {
  const d = new Date()
  d.setFullYear(d.getFullYear() - ageMin)
  return d
}

/** Convert ageMax → the earliest acceptable date-of-birth */
function ageToDobAfter(ageMax: number): Date {
  const d = new Date()
  d.setFullYear(d.getFullYear() - ageMax - 1)
  return d
}

/** Convert serviceYearsMin → the latest acceptable enlistmentDate */
function serviceYearsToEnlistedBefore(years: number): Date {
  const d = new Date()
  d.setFullYear(d.getFullYear() - years)
  return d
}

// ─── Service ─────────────────────────────────────────────────────────────────

export const PersonnelSearchService = {
  async search(user: AuthUser, scope: FunctionScope, rawInput: unknown) {
    const parsed = personnelSearchSchema.safeParse(rawInput)
    if (!parsed.success) {
      return {
        success: false as const,
        error: parsed.error.flatten().fieldErrors,
        status: 400,
      }
    }

    const {
      keyword, category, unitId, rank, position,
      degree, academicTitle, major, politicalTheory,
      status, ageMin, ageMax, serviceYearsMin, hasResearch,
      page, pageSize,
    } = parsed.data

    const scopeConstraints = await normalizeTalentSearchScope(user, scope, unitId)

    const result = await PersonnelSearchRepo.search({
      keyword,
      category,
      // Scope takes precedence over caller-supplied unitId for UNIT scope
      unitId: scopeConstraints.effectiveUnitId,
      allowedUnitIds: scopeConstraints.allowedUnitIds,
      selfPersonnelId: scopeConstraints.selfPersonnelId,
      rank,
      position,
      degree,
      academicTitle,
      major,
      politicalTheory,
      status,
      dobBefore: ageMin !== undefined ? ageToDobBefore(ageMin) : undefined,
      dobAfter: ageMax !== undefined ? ageToDobAfter(ageMax) : undefined,
      enlistedBefore: serviceYearsMin !== undefined
        ? serviceYearsToEnlistedBefore(serviceYearsMin)
        : undefined,
      hasResearch,
      page,
      pageSize,
    })

    return { success: true as const, ...result }
  },
}
