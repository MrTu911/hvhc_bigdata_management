/**
 * PersonnelProfileService – M02 Phase 2
 * Business logic: scope enforcement + Personnel CRUD.
 *
 * Scope stubs are marked:
 *   // [M01-RBAC-HOOK] – wire authorize() / getAccessibleUnitIds() here in Phase 3+
 */
import 'server-only'
import {
  PersonnelRepo,
  PersonnelCreateData,
  PersonnelUpdateData,
  PersonnelListFilter,
} from '@/lib/repositories/personnel/personnel.repo'
import {
  personnelCreateSchema,
  personnelUpdateSchema,
} from '@/lib/validators/personnel.schema'
import type { AuthUser } from '@/lib/rbac/types'
import type { FunctionScope } from '@prisma/client'

// ─── Scope → unit filter ──────────────────────────────────────────────────────

/**
 * [M01-RBAC-HOOK] Translate RBAC scope into PersonnelRepo filter keys.
 *
 * Current stub:
 *   ACADEMY   → no restriction
 *   UNIT/DEPT → restrict to user's own unitId (single unit, no hierarchy)
 *   SELF      → restrict to Personnel whose account.id === user.id
 *
 * Phase 3 wiring: replace UNIT/DEPT branch with getAccessibleUnitIds(user, scope)
 * from lib/rbac/scope.ts to expand to child units.
 */
async function buildScopeUnitFilter(
  user: AuthUser,
  scope: FunctionScope,
): Promise<Pick<PersonnelListFilter, 'allowedUnitIds' | 'selfPersonnelId'>> {
  if (scope === 'ACADEMY') return {}

  if (scope === 'SELF') {
    // [M01-RBAC-HOOK] scope SELF: find Personnel where account.id === user.id
    // For now return empty list (no Personnel → User linkage resolved here yet)
    return { allowedUnitIds: [] }
  }

  // UNIT or DEPARTMENT scope
  if (user.unitId) {
    // [M01-RBAC-HOOK] replace with: const ids = await getAccessibleUnitIds(user, scope)
    return { allowedUnitIds: [user.unitId] }
  }

  return { allowedUnitIds: [] }
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const PersonnelProfileService = {

  async list(
    user: AuthUser,
    scope: FunctionScope,
    filter: Omit<PersonnelListFilter, 'allowedUnitIds' | 'selfPersonnelId'>,
  ) {
    // [M01-RBAC-HOOK] checkScopeAccess point: unit restrictions applied below
    const scopeFilter = await buildScopeUnitFilter(user, scope)
    const result = await PersonnelRepo.findMany({ ...filter, ...scopeFilter })
    return { success: true as const, ...result }
  },

  async getDetail(
    user: AuthUser,
    scope: FunctionScope,
    personnelId: string,
  ) {
    const personnel = await PersonnelRepo.findById(personnelId)
    if (!personnel) {
      return { success: false as const, error: 'Không tìm thấy cán bộ', status: 404 }
    }

    // [M01-RBAC-HOOK] checkScopeAccess(user.id, personnelId, 'PERSONNEL.VIEW_DETAIL')
    // When wiring: verify personnel.unitId is in getAccessibleUnitIds(user, scope)
    if (scope === 'SELF' && personnel.account?.id !== user.id) {
      return { success: false as const, error: 'Không có quyền xem hồ sơ này', status: 403 }
    }

    return { success: true as const, data: personnel }
  },

  async create(
    user: AuthUser,
    rawInput: unknown,
  ) {
    const parsed = personnelCreateSchema.safeParse(rawInput)
    if (!parsed.success) {
      return { success: false as const, error: parsed.error.flatten().fieldErrors, status: 400 }
    }

    const existing = await PersonnelRepo.findByPersonnelCode(parsed.data.personnelCode)
    if (existing) {
      return { success: false as const, error: 'Mã cán bộ đã tồn tại', status: 409 }
    }

    const data: PersonnelCreateData = {
      ...parsed.data,
      dateOfBirth: parsed.data.dateOfBirth ? new Date(parsed.data.dateOfBirth) : null,
      rankDate: parsed.data.rankDate ? new Date(parsed.data.rankDate) : null,
      positionDate: parsed.data.positionDate ? new Date(parsed.data.positionDate) : null,
      enlistmentDate: parsed.data.enlistmentDate ? new Date(parsed.data.enlistmentDate) : null,
    }

    const created = await PersonnelRepo.create(data)
    return { success: true as const, data: created }
  },

  async update(
    user: AuthUser,
    scope: FunctionScope,
    personnelId: string,
    rawInput: unknown,
  ) {
    const existing = await PersonnelRepo.findById(personnelId)
    if (!existing) {
      return { success: false as const, error: 'Không tìm thấy cán bộ', status: 404 }
    }

    // [M01-RBAC-HOOK] checkScopeAccess(user.id, personnelId, 'PERSONNEL.UPDATE')
    if (scope === 'SELF' && existing.account?.id !== user.id) {
      return { success: false as const, error: 'Không có quyền cập nhật hồ sơ này', status: 403 }
    }

    const parsed = personnelUpdateSchema.safeParse(rawInput)
    if (!parsed.success) {
      return { success: false as const, error: parsed.error.flatten().fieldErrors, status: 400 }
    }

    const data: PersonnelUpdateData = {
      ...parsed.data,
      dateOfBirth: parsed.data.dateOfBirth !== undefined
        ? (parsed.data.dateOfBirth ? new Date(parsed.data.dateOfBirth) : null)
        : undefined,
      rankDate: parsed.data.rankDate !== undefined
        ? (parsed.data.rankDate ? new Date(parsed.data.rankDate) : null)
        : undefined,
      positionDate: parsed.data.positionDate !== undefined
        ? (parsed.data.positionDate ? new Date(parsed.data.positionDate) : null)
        : undefined,
      enlistmentDate: parsed.data.enlistmentDate !== undefined
        ? (parsed.data.enlistmentDate ? new Date(parsed.data.enlistmentDate) : null)
        : undefined,
    }

    const updated = await PersonnelRepo.update(personnelId, data)
    return { success: true as const, data: updated }
  },

  async softDelete(
    user: AuthUser,
    scope: FunctionScope,
    personnelId: string,
  ) {
    const existing = await PersonnelRepo.findById(personnelId)
    if (!existing) {
      return { success: false as const, error: 'Không tìm thấy cán bộ', status: 404 }
    }

    // [M01-RBAC-HOOK] only ACADEMY scope can hard-delete Personnel records
    if (scope !== 'ACADEMY') {
      return {
        success: false as const,
        error: 'Chỉ quản trị học viện mới có thể xóa hồ sơ cán bộ',
        status: 403,
      }
    }

    const deleted = await PersonnelRepo.softDelete(personnelId, user.id)
    return { success: true as const, data: deleted }
  },
}
