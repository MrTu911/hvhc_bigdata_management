/**
 * FamilyService – M02 Phase 2
 * Business logic for FamilyRelation CRUD.
 *
 * Sensitive scope guard:
 *   - READ  requires PERSONNEL.VIEW_SENSITIVE to expose citizenId / phoneNumber / address
 *   - WRITE always requires at least PERSONNEL.UPDATE scope
 *   - Sensitive fields (citizenId, phoneNumber) are stripped on write if caller
 *     lacks VIEW_SENSITIVE → prevents inadvertent overwrite
 *
 * Scope stubs marked // [M01-RBAC-HOOK]
 */
import 'server-only'
import {
  FamilyRepo,
  FamilyCreateData,
} from '@/lib/repositories/personnel/family.repo'
import {
  familyCreateSchema,
  familyUpdateSchema,
} from '@/lib/validators/family.schema'
import type { AuthUser } from '@/lib/rbac/types'
import type { FunctionScope } from '@prisma/client'

// ─── Sensitive check ─────────────────────────────────────────────────────────

/**
 * [M01-RBAC-HOOK] Replace with authorize(user, 'PERSONNEL.VIEW_SENSITIVE') in Phase 3.
 * Currently: ACADEMY always gets sensitive; others do not.
 */
function hasSensitiveAccess(_user: AuthUser, scope: FunctionScope): boolean {
  // [M01-RBAC-HOOK] check function code PERSONNEL.VIEW_SENSITIVE
  return scope === 'ACADEMY'
}

function assertWriteScope(
  _user: AuthUser,
  scope: FunctionScope,
): { allowed: boolean; reason?: string } {
  if (scope === 'ACADEMY') return { allowed: true }
  // [M01-RBAC-HOOK] UNIT/DEPARTMENT: unit hierarchy check
  if (scope === 'UNIT' || scope === 'DEPARTMENT') return { allowed: true }
  return { allowed: true }
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const FamilyService = {

  /**
   * List family members.
   * Sensitive fields (citizenId, phoneNumber, address) only returned
   * when caller has VIEW_SENSITIVE scope.
   */
  async list(user: AuthUser, scope: FunctionScope, personnelId: string) {
    const includeSensitive = hasSensitiveAccess(user, scope)
    const data = await FamilyRepo.findByPersonnelId(personnelId, includeSensitive)
    return { success: true as const, data, meta: { includeSensitive } }
  },

  async create(
    user: AuthUser,
    scope: FunctionScope,
    personnelId: string,
    rawInput: unknown,
  ) {
    const scopeCheck = assertWriteScope(user, scope)
    if (!scopeCheck.allowed) {
      return { success: false as const, error: scopeCheck.reason ?? 'Không có quyền', status: 403 }
    }

    const parsed = familyCreateSchema.safeParse(rawInput)
    if (!parsed.success) {
      return { success: false as const, error: parsed.error.flatten().fieldErrors, status: 400 }
    }

    const canWriteSensitive = hasSensitiveAccess(user, scope)

    const createData: FamilyCreateData = {
      personnelId,
      userId: user.id, // bridge FK
      relation: parsed.data.relation,
      fullName: parsed.data.fullName,
      dateOfBirth: parsed.data.dateOfBirth ? new Date(parsed.data.dateOfBirth) : null,
      /** Strip sensitive fields if caller lacks VIEW_SENSITIVE */
      citizenId: canWriteSensitive ? (parsed.data.citizenId ?? null) : null,
      phoneNumber: canWriteSensitive ? (parsed.data.phoneNumber ?? null) : null,
      occupation: parsed.data.occupation ?? null,
      workplace: parsed.data.workplace ?? null,
      /** Strip address if caller lacks VIEW_SENSITIVE */
      address: canWriteSensitive ? (parsed.data.address ?? null) : null,
      isDeceased: parsed.data.isDeceased ?? false,
      deceasedDate: parsed.data.deceasedDate ? new Date(parsed.data.deceasedDate) : null,
      dependentFlag: parsed.data.dependentFlag ?? false,
      notes: parsed.data.notes ?? null,
    }

    const created = await FamilyRepo.create(createData)
    return { success: true as const, data: created }
  },

  async update(
    user: AuthUser,
    scope: FunctionScope,
    familyId: string,
    rawInput: unknown,
  ) {
    const existing = await FamilyRepo.findById(familyId, true)
    if (!existing) {
      return { success: false as const, error: 'Không tìm thấy thành viên gia đình', status: 404 }
    }

    const scopeCheck = assertWriteScope(user, scope)
    if (!scopeCheck.allowed) {
      return { success: false as const, error: scopeCheck.reason ?? 'Không có quyền', status: 403 }
    }

    const parsed = familyUpdateSchema.safeParse(rawInput)
    if (!parsed.success) {
      return { success: false as const, error: parsed.error.flatten().fieldErrors, status: 400 }
    }

    const canWriteSensitive = hasSensitiveAccess(user, scope)

    // Build update payload – sensitive fields only included when caller has access
    const updatePayload = {
      ...parsed.data,
      dateOfBirth:
        parsed.data.dateOfBirth !== undefined
          ? parsed.data.dateOfBirth ? new Date(parsed.data.dateOfBirth) : null
          : undefined,
      deceasedDate:
        parsed.data.deceasedDate !== undefined
          ? parsed.data.deceasedDate ? new Date(parsed.data.deceasedDate) : null
          : undefined,
      ...(canWriteSensitive
        ? {
            citizenId: parsed.data.citizenId,
            phoneNumber: parsed.data.phoneNumber,
            address: parsed.data.address,
          }
        : {
            // Preserve existing values; caller cannot touch sensitive fields
            citizenId: undefined,
            phoneNumber: undefined,
            address: undefined,
          }),
    }

    const updated = await FamilyRepo.update(familyId, updatePayload)
    return { success: true as const, data: updated }
  },

  async softDelete(
    user: AuthUser,
    scope: FunctionScope,
    familyId: string,
  ) {
    const existing = await FamilyRepo.findById(familyId, false)
    if (!existing) {
      return { success: false as const, error: 'Không tìm thấy thành viên gia đình', status: 404 }
    }

    const scopeCheck = assertWriteScope(user, scope)
    if (!scopeCheck.allowed) {
      return { success: false as const, error: scopeCheck.reason ?? 'Không có quyền', status: 403 }
    }

    const deleted = await FamilyRepo.softDelete(familyId, user.id)
    return { success: true as const, data: deleted }
  },
}
