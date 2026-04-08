/**
 * NckhProjectService – Module M09 UC-45
 * Business logic + workflow state machine cho đề tài NCKH.
 * Kế thừa BaseService để có RBAC scope filter sẵn.
 */
import 'server-only'
import db from '@/lib/db'
import { BaseService, ScopedQueryOptions, PaginationOptions, ServiceResult } from './base-service'
import { nckhProjectRepo, NckhProjectListFilter } from '@/lib/repositories/nckh/nckh-project.repo'
import { nckhReviewRepo } from '@/lib/repositories/nckh/nckh-review.repo'
import { logAudit } from '@/lib/audit'
import {
  nckhProjectCreateSchema,
  nckhProjectUpdateSchema,
  nckhMemberAddSchema,
  type NckhProjectCreateInput,
  type NckhProjectUpdateInput,
} from '@/lib/validations/nckh-project'
import type { NckhProjectStatus, NckhProjectPhase, NckhMemberRole } from '@prisma/client'

// ─── Workflow State Machine ────────────────────────────────────────────────────
// Mỗi action định nghĩa: fromStatus cho phép, toStatus, toPhase (nếu thay đổi)

interface WorkflowTransition {
  fromStatus: NckhProjectStatus[]
  toStatus: NckhProjectStatus
  toPhase?: NckhProjectPhase
}

const WORKFLOW_TRANSITIONS: Record<string, WorkflowTransition> = {
  SUBMIT: {
    fromStatus: ['DRAFT', 'REJECTED'],
    toStatus: 'SUBMITTED',
    // phase giữ nguyên PROPOSAL
  },
  START_REVIEW: {
    fromStatus: ['SUBMITTED'],
    toStatus: 'UNDER_REVIEW',
  },
  APPROVE: {
    fromStatus: ['UNDER_REVIEW', 'SUBMITTED'],
    toStatus: 'APPROVED',
    toPhase: 'CONTRACT',
  },
  REJECT: {
    fromStatus: ['SUBMITTED', 'UNDER_REVIEW'],
    toStatus: 'REJECTED',
  },
  START_EXECUTION: {
    fromStatus: ['APPROVED'],
    toStatus: 'IN_PROGRESS',
    toPhase: 'EXECUTION',
  },
  PAUSE: {
    fromStatus: ['IN_PROGRESS'],
    toStatus: 'PAUSED',
  },
  RESUME: {
    fromStatus: ['PAUSED'],
    toStatus: 'IN_PROGRESS',
  },
  ENTER_MIDTERM_REVIEW: {
    fromStatus: ['IN_PROGRESS'],
    toStatus: 'IN_PROGRESS',
    toPhase: 'MIDTERM_REVIEW',
  },
  ENTER_FINAL_REVIEW: {
    fromStatus: ['IN_PROGRESS'],
    toStatus: 'IN_PROGRESS',
    toPhase: 'FINAL_REVIEW',
  },
  COMPLETE: {
    fromStatus: ['IN_PROGRESS'],
    toStatus: 'COMPLETED',
    toPhase: 'ACCEPTED',
  },
  ARCHIVE: {
    fromStatus: ['COMPLETED'],
    toStatus: 'COMPLETED',
    toPhase: 'ARCHIVED',
  },
  CANCEL: {
    fromStatus: ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'IN_PROGRESS', 'PAUSED'],
    toStatus: 'CANCELLED',
  },
}

// ─── Service Class ────────────────────────────────────────────────────────────

class NckhProjectServiceClass extends BaseService {
  protected readonly resourceType = 'NCKH_PROJECT'

  // ─ Queries ────────────────────────────────────────────────────────────────

  async listProjects(
    options: ScopedQueryOptions,
    filter: Omit<NckhProjectListFilter, 'scopeUserId'> = {},
    pagination: PaginationOptions = {}
  ): Promise<ServiceResult<unknown[]>> {
    try {
      const scopedFilter: NckhProjectListFilter = { ...filter, ...pagination }

      // SELF scope: chỉ xem project mình là PI hoặc thành viên
      if (options.scope === 'SELF') {
        scopedFilter.scopeUserId = options.user.id
      }

      // UNIT scope: chỉ xem project của đơn vị mình
      if (options.scope === 'UNIT' && options.user.unitId) {
        scopedFilter.unitId = options.user.unitId
      }

      // DEPARTMENT và ACADEMY: không filter thêm

      const result = await nckhProjectRepo.findMany(scopedFilter)
      return {
        success: true,
        data: result.projects,
        meta: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
        },
      }
    } catch (error) {
      console.error('[NckhProjectService.listProjects]', error)
      return { success: false, error: 'Lỗi khi tải danh sách đề tài' }
    }
  }

  async getProjectById(options: ScopedQueryOptions, id: string): Promise<ServiceResult<unknown>> {
    try {
      const project = await nckhProjectRepo.findById(id)
      if (!project) return { success: false, error: 'Không tìm thấy đề tài' }

      const access = await this.canAccessResource(
        options,
        project.principalInvestigatorId,
        project.unit?.id
      )
      if (!access.allowed) return { success: false, error: 'Không có quyền xem đề tài này' }

      return { success: true, data: project }
    } catch (error) {
      console.error('[NckhProjectService.getProjectById]', error)
      return { success: false, error: 'Lỗi khi tải đề tài' }
    }
  }

  // ─ Create ─────────────────────────────────────────────────────────────────

  async createProject(
    options: ScopedQueryOptions,
    rawInput: NckhProjectCreateInput
  ): Promise<ServiceResult<unknown>> {
    try {
      // 1. Validate input
      const parsed = nckhProjectCreateSchema.safeParse(rawInput)
      if (!parsed.success) {
        return { success: false, error: parsed.error.errors[0].message }
      }
      const input = parsed.data

      // 2. Business rule: projectCode unique
      const codeExists = await nckhProjectRepo.projectCodeExists(input.projectCode)
      if (codeExists) {
        return { success: false, error: `Mã đề tài "${input.projectCode}" đã tồn tại` }
      }

      // 3. Business rule: budget không âm (validator đã xử lý nhưng double-check)
      if (input.budgetRequested !== null && input.budgetRequested !== undefined && input.budgetRequested < 0) {
        return { success: false, error: 'Kinh phí đề nghị không được âm' }
      }

      // 4. Tạo project + member CHU_NHIEM trong 1 transaction
      const project = await db.$transaction(async (tx) => {
        const created = await tx.nckhProject.create({
          data: {
            projectCode: input.projectCode,
            title: input.title,
            titleEn: input.titleEn ?? null,
            abstract: input.abstract ?? null,
            keywords: input.keywords ?? [],
            category: input.category,
            field: input.field,
            researchType: input.researchType,
            principalInvestigatorId: input.principalInvestigatorId,
            unitId: input.unitId ?? null,
            budgetRequested: input.budgetRequested ?? null,
            budgetYear: input.budgetYear ?? null,
            startDate: input.startDate ? new Date(input.startDate) : null,
            endDate: input.endDate ? new Date(input.endDate) : null,
            status: 'DRAFT',
            phase: 'PROPOSAL',
          },
        })

        // Tạo NckhMember cho PI với role CHU_NHIEM
        await tx.nckhMember.create({
          data: {
            projectId: created.id,
            userId: input.principalInvestigatorId,
            role: 'CHU_NHIEM',
            joinDate: new Date(),
          },
        })

        return created
      })

      const full = await nckhProjectRepo.findById(project.id)
      return { success: true, data: full }
    } catch (error) {
      console.error('[NckhProjectService.createProject]', error)
      return { success: false, error: 'Lỗi khi tạo đề tài' }
    }
  }

  // ─ Update ─────────────────────────────────────────────────────────────────

  async updateProject(
    options: ScopedQueryOptions,
    id: string,
    rawInput: NckhProjectUpdateInput
  ): Promise<ServiceResult<unknown>> {
    try {
      const project = await nckhProjectRepo.findById(id)
      if (!project) return { success: false, error: 'Không tìm thấy đề tài' }

      // Chỉ PI hoặc DEPARTMENT/ACADEMY scope mới được sửa
      const access = await this.canAccessResource(
        options,
        project.principalInvestigatorId,
        project.unit?.id
      )
      if (!access.allowed) return { success: false, error: 'Không có quyền sửa đề tài này' }

      // Không cho sửa khi đề tài đã COMPLETED/CANCELLED
      if (['COMPLETED', 'CANCELLED'].includes(project.status)) {
        return { success: false, error: 'Không thể sửa đề tài đã hoàn thành hoặc hủy' }
      }

      const parsed = nckhProjectUpdateSchema.safeParse(rawInput)
      if (!parsed.success) {
        return { success: false, error: parsed.error.errors[0].message }
      }

      const input = parsed.data
      const updated = await nckhProjectRepo.update(id, {
        title: input.title,
        titleEn: input.titleEn,
        abstract: input.abstract,
        keywords: input.keywords,
        field: input.field,
        researchType: input.researchType,
        unitId: input.unitId,
        budgetRequested: input.budgetRequested,
        budgetApproved: input.budgetApproved,
        budgetUsed: input.budgetUsed,
        budgetYear: input.budgetYear,
        startDate: input.startDate ? new Date(input.startDate) : undefined,
        endDate: input.endDate ? new Date(input.endDate) : undefined,
        actualEndDate: input.actualEndDate ? new Date(input.actualEndDate) : undefined,
      })
      return { success: true, data: updated }
    } catch (error) {
      console.error('[NckhProjectService.updateProject]', error)
      return { success: false, error: 'Lỗi khi cập nhật đề tài' }
    }
  }

  // ─ Delete ─────────────────────────────────────────────────────────────────

  async deleteProject(options: ScopedQueryOptions, id: string): Promise<ServiceResult<null>> {
    try {
      const project = await nckhProjectRepo.findById(id)
      if (!project) return { success: false, error: 'Không tìm thấy đề tài' }

      // Business rule: chỉ xóa khi DRAFT
      if (project.status !== 'DRAFT') {
        return { success: false, error: 'Chỉ được xóa đề tài ở trạng thái Nháp (DRAFT)' }
      }

      const access = await this.canAccessResource(
        options,
        project.principalInvestigatorId,
        project.unit?.id
      )
      if (!access.allowed) return { success: false, error: 'Không có quyền xóa đề tài này' }

      await nckhProjectRepo.delete(id)
      return { success: true, data: null }
    } catch (error) {
      console.error('[NckhProjectService.deleteProject]', error)
      return { success: false, error: 'Lỗi khi xóa đề tài' }
    }
  }

  // ─ Workflow ───────────────────────────────────────────────────────────────

  /**
   * Thực hiện workflow transition.
   * @param actorId - userId của người thực hiện hành động (dùng để SoD check)
   * @param action  - tên hành động theo WORKFLOW_TRANSITIONS
   * @param reason  - lý do từ chối hoặc ghi chú (tùy chọn)
   * @param approverNote - ghi chú phê duyệt (cho APPROVE)
   */
  async transition(
    options: ScopedQueryOptions,
    id: string,
    action: string,
    opts: { reason?: string; approverNote?: string } = {}
  ): Promise<ServiceResult<unknown>> {
    try {
      const txDef = WORKFLOW_TRANSITIONS[action]
      if (!txDef) {
        return {
          success: false,
          error: `Hành động không hợp lệ. Các hành động hỗ trợ: ${Object.keys(WORKFLOW_TRANSITIONS).join(', ')}`,
        }
      }

      const project = await nckhProjectRepo.findById(id)
      if (!project) return { success: false, error: 'Không tìm thấy đề tài' }

      // Kiểm tra fromStatus
      if (!txDef.fromStatus.includes(project.status as NckhProjectStatus)) {
        return {
          success: false,
          error: `Không thể ${action} đề tài đang ở trạng thái "${project.status}". Trạng thái cho phép: ${txDef.fromStatus.join(', ')}`,
        }
      }

      // SoD: người đã nộp không được tự duyệt
      if (action === 'APPROVE' || action === 'START_REVIEW') {
        if (project.submittedBy && project.submittedBy === options.user.id) {
          return {
            success: false,
            error: 'Separation of Duties: Người đã nộp đề tài không được tự phê duyệt',
          }
        }
      }

      // Guard COMPLETE: bắt buộc phải có phiên nghiệm thu cấp HV/cao hơn đạt yêu cầu
      if (action === 'COMPLETE') {
        const reviews = await nckhReviewRepo.findByProject(id)
        const hasPassedFinalReview = reviews.some(
          (r) =>
            ['NGHIEM_THU_CAP_HV', 'NGHIEM_THU_CAP_TREN'].includes(r.reviewType) &&
            r.decision === 'PASSED'
        )
        if (!hasPassedFinalReview) {
          return {
            success: false,
            error:
              'Đề tài chỉ được hoàn thành sau khi có phiên nghiệm thu cấp Học viện (hoặc cao hơn) đạt yêu cầu',
          }
        }
      }

      // Xây update data
      const updateData: Parameters<typeof nckhProjectRepo.updateWorkflowState>[1] = {
        status: txDef.toStatus,
        ...(txDef.toPhase ? { phase: txDef.toPhase } : {}),
      }

      if (action === 'SUBMIT') {
        updateData.submittedAt = new Date()
        updateData.submittedBy = options.user.id
      }

      if (action === 'APPROVE') {
        updateData.approvedAt = new Date()
        updateData.approvedBy = options.user.id
        updateData.approverNote = opts.approverNote ?? null
        updateData.rejectReason = null
      }

      if (action === 'REJECT') {
        updateData.rejectedAt = new Date()
        updateData.rejectedBy = options.user.id
        updateData.rejectReason = opts.reason ?? 'Không đạt yêu cầu'
      }

      await nckhProjectRepo.updateWorkflowState(id, updateData)

      // Audit log – ghi sau khi thành công
      logAudit({
        userId: options.user.id,
        functionCode: `RESEARCH_TRANSITION_${action}`,
        action,
        resourceType: 'NCKH_PROJECT',
        resourceId: id,
        newValue: {
          action,
          toStatus: txDef.toStatus,
          toPhase: txDef.toPhase,
          ...(opts.approverNote ? { approverNote: opts.approverNote } : {}),
          ...(opts.reason ? { reason: opts.reason } : {}),
        },
        result: 'SUCCESS',
      }).catch((e) => console.error('[NckhProjectService.transition] audit fail', e))

      const updated = await nckhProjectRepo.findById(id)
      return { success: true, data: updated }
    } catch (error) {
      console.error('[NckhProjectService.transition]', error)
      return { success: false, error: 'Lỗi khi thực hiện thao tác workflow' }
    }
  }

  // ─ Member management ──────────────────────────────────────────────────────

  async addMember(
    options: ScopedQueryOptions,
    projectId: string,
    rawInput: { userId: string; role: NckhMemberRole; contribution?: number | null }
  ): Promise<ServiceResult<unknown>> {
    try {
      const project = await nckhProjectRepo.findById(projectId)
      if (!project) return { success: false, error: 'Không tìm thấy đề tài' }

      const parsed = nckhMemberAddSchema.safeParse(rawInput)
      if (!parsed.success) {
        return { success: false, error: parsed.error.errors[0].message }
      }

      // Không cho thêm thành viên khi đề tài COMPLETED/CANCELLED
      if (['COMPLETED', 'CANCELLED'].includes(project.status)) {
        return { success: false, error: 'Không thể thêm thành viên vào đề tài đã kết thúc' }
      }

      // Không được trùng thành viên
      const exists = await nckhProjectRepo.memberExists(projectId, rawInput.userId)
      if (exists) {
        return { success: false, error: 'Người dùng này đã là thành viên của đề tài' }
      }

      const member = await nckhProjectRepo.addMember({
        projectId,
        userId: rawInput.userId,
        role: rawInput.role,
        contribution: rawInput.contribution ?? null,
      })
      return { success: true, data: member }
    } catch (error) {
      console.error('[NckhProjectService.addMember]', error)
      return { success: false, error: 'Lỗi khi thêm thành viên' }
    }
  }

  async removeMember(
    options: ScopedQueryOptions,
    projectId: string,
    memberId: string
  ): Promise<ServiceResult<null>> {
    try {
      const project = await nckhProjectRepo.findById(projectId)
      if (!project) return { success: false, error: 'Không tìm thấy đề tài' }

      if (['COMPLETED', 'CANCELLED'].includes(project.status)) {
        return { success: false, error: 'Không thể xóa thành viên khỏi đề tài đã kết thúc' }
      }

      // Không cho xóa CHU_NHIEM
      const member = project.members.find((m) => m.id === memberId)
      if (!member) return { success: false, error: 'Không tìm thấy thành viên' }
      if (member.role === 'CHU_NHIEM') {
        return { success: false, error: 'Không thể xóa Chủ nhiệm đề tài khỏi nhóm' }
      }

      await nckhProjectRepo.removeMember(memberId)
      return { success: true, data: null }
    } catch (error) {
      console.error('[NckhProjectService.removeMember]', error)
      return { success: false, error: 'Lỗi khi xóa thành viên' }
    }
  }

  // ─ Dashboard stats ────────────────────────────────────────────────────────

  async getDashboardStats(options?: ScopedQueryOptions): Promise<ServiceResult<unknown>> {
    try {
      // Xác định filter scope
      let scopeUnitId: string | undefined
      let scopeUserId: string | undefined

      if (options) {
        if (options.scope === 'SELF') {
          scopeUserId = options.user.id
        } else if (options.scope === 'UNIT' && options.user.unitId) {
          scopeUnitId = options.user.unitId
        }
        // DEPARTMENT / ACADEMY: không filter thêm
      }

      const [byStatus, overdue] = await Promise.all([
        nckhProjectRepo.countByStatus(scopeUnitId, scopeUserId),
        nckhProjectRepo.findOverdueProjects(scopeUnitId, scopeUserId),
      ])

      return {
        success: true,
        data: {
          byStatus: byStatus.reduce(
            (acc, s) => ({ ...acc, [s.status]: s._count.id }),
            {} as Record<string, number>
          ),
          overdueCount: overdue.length,
        },
      }
    } catch (error) {
      console.error('[NckhProjectService.getDashboardStats]', error)
      return { success: false, error: 'Lỗi khi tải thống kê' }
    }
  }
}

export const nckhProjectService = new NckhProjectServiceClass()
