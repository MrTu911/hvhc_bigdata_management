/**
 * ScientistService – CSDL-KHQL Phase 2
 * Business logic cho hồ sơ Nhà Khoa học:
 *   - list / get profile với sensitivity guard
 *   - update profile + sub-tables (education, career, award)
 *   - enqueue ORCID sync job
 *
 * Không sửa /lib/services/research/* – backward compatible.
 */
import 'server-only'
import { scientistRepo } from '@/lib/repositories/science/scientist.repo'
import { logAudit } from '@/lib/audit'
import type {
  ScientistListFilter,
  ScientistProfileUpdateInput,
  ScientistEducationCreateInput,
  ScientistEducationUpdateInput,
  ScientistCareerCreateInput,
  ScientistCareerUpdateInput,
  ScientistAwardCreateInput,
  ScientistAwardUpdateInput,
} from '@/lib/validations/science-scientist'

// ─── Sensitivity guard ────────────────────────────────────────────────────────
// CONFIDENTIAL profiles chỉ được xem bởi user có SCIENTIST_VIEW + scope phù hợp.
// Service nhận canViewConfidential flag từ route (route đã check RBAC).

function filterBySensitivity<T extends { sensitivityLevel: string }>(
  profile: T,
  canViewConfidential: boolean
): T | null {
  if (profile.sensitivityLevel === 'CONFIDENTIAL' && !canViewConfidential) return null
  return profile
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const scientistService = {
  async listScientists(filter: ScientistListFilter, canViewConfidential: boolean) {
    const result = await scientistRepo.findMany(filter)

    const items = result.items.filter(
      (p) => filterBySensitivity(p, canViewConfidential) !== null
    )

    return { success: true as const, data: { items, total: result.total } }
  },

  async getScientistById(id: string, canViewConfidential: boolean) {
    const profile = await scientistRepo.findById(id)
    if (!profile) return { success: false as const, error: 'Không tìm thấy hồ sơ nhà khoa học' }

    if (filterBySensitivity(profile, canViewConfidential) === null) {
      return { success: false as const, error: 'Không có quyền xem hồ sơ mật' }
    }

    return { success: true as const, data: profile }
  },

  async updateProfile(
    id: string,
    input: ScientistProfileUpdateInput,
    userId: string,
    ipAddress?: string
  ) {
    const existing = await scientistRepo.findById(id)
    if (!existing) return { success: false as const, error: 'Không tìm thấy hồ sơ nhà khoa học' }

    const updated = await scientistRepo.updateProfile(id, input)

    await logAudit({
      userId,
      functionCode: 'MANAGE_SCIENTIST_PROFILE',
      action: 'UPDATE',
      resourceType: 'SCIENTIST_PROFILE',
      resourceId: id,
      result: 'SUCCESS',
      ipAddress,
    })

    return { success: true as const, data: updated }
  },

  // ─── Education ─────────────────────────────────────────────────────────────

  async addEducation(
    scientistId: string,
    input: ScientistEducationCreateInput,
    userId: string,
    ipAddress?: string
  ) {
    const existing = await scientistRepo.findById(scientistId)
    if (!existing) return { success: false as const, error: 'Không tìm thấy hồ sơ nhà khoa học' }

    const record = await scientistRepo.createEducation(scientistId, input)

    await logAudit({
      userId,
      functionCode: 'MANAGE_SCIENTIST_PROFILE',
      action: 'CREATE',
      resourceType: 'SCIENTIST_EDUCATION',
      resourceId: record.id,
      result: 'SUCCESS',
      ipAddress,
    })

    return { success: true as const, data: record }
  },

  async updateEducation(
    id: string,
    scientistId: string,
    input: ScientistEducationUpdateInput,
    userId: string,
    ipAddress?: string
  ) {
    const record = await scientistRepo.findEducationById(id)
    if (!record || record.scientistId !== scientistId) {
      return { success: false as const, error: 'Không tìm thấy bản ghi học vị' }
    }

    const updated = await scientistRepo.updateEducation(id, input)

    await logAudit({
      userId,
      functionCode: 'MANAGE_SCIENTIST_PROFILE',
      action: 'UPDATE',
      resourceType: 'SCIENTIST_EDUCATION',
      resourceId: id,
      result: 'SUCCESS',
      ipAddress,
    })

    return { success: true as const, data: updated }
  },

  async deleteEducation(id: string, scientistId: string, userId: string, ipAddress?: string) {
    const record = await scientistRepo.findEducationById(id)
    if (!record || record.scientistId !== scientistId) {
      return { success: false as const, error: 'Không tìm thấy bản ghi học vị' }
    }

    await scientistRepo.deleteEducation(id)

    await logAudit({
      userId,
      functionCode: 'MANAGE_SCIENTIST_PROFILE',
      action: 'DELETE',
      resourceType: 'SCIENTIST_EDUCATION',
      resourceId: id,
      result: 'SUCCESS',
      ipAddress,
    })

    return { success: true as const }
  },

  // ─── Career ────────────────────────────────────────────────────────────────

  async addCareer(
    scientistId: string,
    input: ScientistCareerCreateInput,
    userId: string,
    ipAddress?: string
  ) {
    const existing = await scientistRepo.findById(scientistId)
    if (!existing) return { success: false as const, error: 'Không tìm thấy hồ sơ nhà khoa học' }

    const record = await scientistRepo.createCareer(scientistId, input)

    await logAudit({
      userId,
      functionCode: 'MANAGE_SCIENTIST_PROFILE',
      action: 'CREATE',
      resourceType: 'SCIENTIST_CAREER',
      resourceId: record.id,
      result: 'SUCCESS',
      ipAddress,
    })

    return { success: true as const, data: record }
  },

  async updateCareer(
    id: string,
    scientistId: string,
    input: ScientistCareerUpdateInput,
    userId: string,
    ipAddress?: string
  ) {
    const record = await scientistRepo.findCareerById(id)
    if (!record || record.scientistId !== scientistId) {
      return { success: false as const, error: 'Không tìm thấy bản ghi công tác' }
    }

    const updated = await scientistRepo.updateCareer(id, input)

    await logAudit({
      userId,
      functionCode: 'MANAGE_SCIENTIST_PROFILE',
      action: 'UPDATE',
      resourceType: 'SCIENTIST_CAREER',
      resourceId: id,
      result: 'SUCCESS',
      ipAddress,
    })

    return { success: true as const, data: updated }
  },

  async deleteCareer(id: string, scientistId: string, userId: string, ipAddress?: string) {
    const record = await scientistRepo.findCareerById(id)
    if (!record || record.scientistId !== scientistId) {
      return { success: false as const, error: 'Không tìm thấy bản ghi công tác' }
    }

    await scientistRepo.deleteCareer(id)

    await logAudit({
      userId,
      functionCode: 'MANAGE_SCIENTIST_PROFILE',
      action: 'DELETE',
      resourceType: 'SCIENTIST_CAREER',
      resourceId: id,
      result: 'SUCCESS',
      ipAddress,
    })

    return { success: true as const }
  },

  // ─── Award ─────────────────────────────────────────────────────────────────

  async addAward(
    scientistId: string,
    input: ScientistAwardCreateInput,
    userId: string,
    ipAddress?: string
  ) {
    const existing = await scientistRepo.findById(scientistId)
    if (!existing) return { success: false as const, error: 'Không tìm thấy hồ sơ nhà khoa học' }

    const record = await scientistRepo.createAward(scientistId, input)

    await logAudit({
      userId,
      functionCode: 'MANAGE_SCIENTIST_PROFILE',
      action: 'CREATE',
      resourceType: 'SCIENTIST_AWARD',
      resourceId: record.id,
      result: 'SUCCESS',
      ipAddress,
    })

    return { success: true as const, data: record }
  },

  async updateAward(
    id: string,
    scientistId: string,
    input: ScientistAwardUpdateInput,
    userId: string,
    ipAddress?: string
  ) {
    const record = await scientistRepo.findAwardById(id)
    if (!record || record.scientistId !== scientistId) {
      return { success: false as const, error: 'Không tìm thấy bản ghi khen thưởng' }
    }

    const updated = await scientistRepo.updateAward(id, input)

    await logAudit({
      userId,
      functionCode: 'MANAGE_SCIENTIST_PROFILE',
      action: 'UPDATE',
      resourceType: 'SCIENTIST_AWARD',
      resourceId: id,
      result: 'SUCCESS',
      ipAddress,
    })

    return { success: true as const, data: updated }
  },

  async deleteAward(id: string, scientistId: string, userId: string, ipAddress?: string) {
    const record = await scientistRepo.findAwardById(id)
    if (!record || record.scientistId !== scientistId) {
      return { success: false as const, error: 'Không tìm thấy bản ghi khen thưởng' }
    }

    await scientistRepo.deleteAward(id)

    await logAudit({
      userId,
      functionCode: 'MANAGE_SCIENTIST_PROFILE',
      action: 'DELETE',
      resourceType: 'SCIENTIST_AWARD',
      resourceId: id,
      result: 'SUCCESS',
      ipAddress,
    })

    return { success: true as const }
  },
}
