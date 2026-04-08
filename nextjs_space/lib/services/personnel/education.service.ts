/**
 * EducationService – M02 Phase 2
 * Business logic for EducationHistory CRUD.
 *
 * Scope stubs marked // [M01-RBAC-HOOK]
 */
import 'server-only'
import {
  EducationRepo,
  EducationCreateData,
} from '@/lib/repositories/personnel/education.repo'
import {
  educationCreateSchema,
  educationUpdateSchema,
} from '@/lib/validators/education.schema'
import type { AuthUser } from '@/lib/rbac/types'
import type { FunctionScope } from '@prisma/client'

// ─── Scope guard ─────────────────────────────────────────────────────────────

function assertWriteScope(
  _user: AuthUser,
  scope: FunctionScope,
): { allowed: boolean; reason?: string } {
  if (scope === 'ACADEMY') return { allowed: true }
  // [M01-RBAC-HOOK] UNIT/DEPARTMENT: verify unit hierarchy
  if (scope === 'UNIT' || scope === 'DEPARTMENT') return { allowed: true }
  return { allowed: true }
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const EducationService = {

  async list(personnelId: string) {
    const data = await EducationRepo.findByPersonnelId(personnelId)
    return { success: true as const, data }
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

    const parsed = educationCreateSchema.safeParse(rawInput)
    if (!parsed.success) {
      return { success: false as const, error: parsed.error.flatten().fieldErrors, status: 400 }
    }

    const createData: EducationCreateData = {
      personnelId,
      userId: user.id, // bridge FK
      level: parsed.data.level,
      institution: parsed.data.institution,
      studyMode: parsed.data.studyMode ?? null,
      major: parsed.data.major ?? null,
      trainingSystem: parsed.data.trainingSystem ?? null,
      startDate: parsed.data.startDate ? new Date(parsed.data.startDate) : null,
      endDate: parsed.data.endDate ? new Date(parsed.data.endDate) : null,
      gpa: parsed.data.gpa ?? null,
      thesisTitle: parsed.data.thesisTitle ?? null,
      supervisor: parsed.data.supervisor ?? null,
      certificateCode: parsed.data.certificateCode ?? null,
      certificateDate: parsed.data.certificateDate
        ? new Date(parsed.data.certificateDate)
        : null,
      defenseDate: parsed.data.defenseDate ? new Date(parsed.data.defenseDate) : null,
      defenseLocation: parsed.data.defenseLocation ?? null,
      examSubject: parsed.data.examSubject ?? null,
      classification: parsed.data.classification ?? null,
      notes: parsed.data.notes ?? null,
    }

    const created = await EducationRepo.create(createData)
    return { success: true as const, data: created }
  },

  async update(
    user: AuthUser,
    scope: FunctionScope,
    educationId: string,
    rawInput: unknown,
  ) {
    const existing = await EducationRepo.findById(educationId)
    if (!existing) {
      return { success: false as const, error: 'Không tìm thấy bản ghi học vấn', status: 404 }
    }

    const scopeCheck = assertWriteScope(user, scope)
    if (!scopeCheck.allowed) {
      return { success: false as const, error: scopeCheck.reason ?? 'Không có quyền', status: 403 }
    }

    const parsed = educationUpdateSchema.safeParse(rawInput)
    if (!parsed.success) {
      return { success: false as const, error: parsed.error.flatten().fieldErrors, status: 400 }
    }

    const updated = await EducationRepo.update(educationId, {
      ...parsed.data,
      startDate:
        parsed.data.startDate !== undefined
          ? parsed.data.startDate ? new Date(parsed.data.startDate) : null
          : undefined,
      endDate:
        parsed.data.endDate !== undefined
          ? parsed.data.endDate ? new Date(parsed.data.endDate) : null
          : undefined,
      certificateDate:
        parsed.data.certificateDate !== undefined
          ? parsed.data.certificateDate ? new Date(parsed.data.certificateDate) : null
          : undefined,
      defenseDate:
        parsed.data.defenseDate !== undefined
          ? parsed.data.defenseDate ? new Date(parsed.data.defenseDate) : null
          : undefined,
    })

    return { success: true as const, data: updated }
  },

  async delete(
    user: AuthUser,
    scope: FunctionScope,
    educationId: string,
  ) {
    const existing = await EducationRepo.findById(educationId)
    if (!existing) {
      return { success: false as const, error: 'Không tìm thấy bản ghi học vấn', status: 404 }
    }

    // [M01-RBAC-HOOK] Only ACADEMY scope can permanently delete education records
    if (scope !== 'ACADEMY') {
      return {
        success: false as const,
        error: 'Chỉ quản trị học viện mới có thể xóa bản ghi học vấn',
        status: 403,
      }
    }

    const deleted = await EducationRepo.delete(educationId)
    return { success: true as const, data: deleted }
  },
}
