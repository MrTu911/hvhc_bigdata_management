/**
 * NckhMilestoneService – Module M09 UC-45
 * Business logic cho mốc tiến độ (milestone) của đề tài NCKH.
 */
import 'server-only'
import { BaseService, ScopedQueryOptions, ServiceResult } from './base-service'
import { nckhProjectRepo } from '@/lib/repositories/nckh/nckh-project.repo'
import { nckhMilestoneRepo } from '@/lib/repositories/nckh/nckh-milestone.repo'
import {
  nckhMilestoneCreateSchema,
  nckhMilestoneUpdateSchema,
  type NckhMilestoneCreateInput,
  type NckhMilestoneUpdateInput,
} from '@/lib/validations/nckh-project'
import type { NckhMilestoneStatus } from '@prisma/client'

class NckhMilestoneServiceClass extends BaseService {
  protected readonly resourceType = 'NCKH_MILESTONE'

  async listMilestones(
    options: ScopedQueryOptions,
    projectId: string
  ): Promise<ServiceResult<unknown[]>> {
    try {
      const project = await nckhProjectRepo.findById(projectId)
      if (!project) return { success: false, error: 'Không tìm thấy đề tài' }

      const access = await this.canAccessResource(
        options,
        project.principalInvestigatorId,
        project.unit?.id
      )
      if (!access.allowed) return { success: false, error: 'Không có quyền xem đề tài này' }

      // Sync OVERDUE trước khi trả kết quả
      await nckhMilestoneRepo.markOverdueByProjectId(projectId)

      const milestones = await nckhMilestoneRepo.findByProject(projectId)
      return { success: true, data: milestones }
    } catch (error) {
      console.error('[NckhMilestoneService.listMilestones]', error)
      return { success: false, error: 'Lỗi khi tải danh sách mốc tiến độ' }
    }
  }

  async createMilestone(
    options: ScopedQueryOptions,
    projectId: string,
    rawInput: NckhMilestoneCreateInput
  ): Promise<ServiceResult<unknown>> {
    try {
      const project = await nckhProjectRepo.findById(projectId)
      if (!project) return { success: false, error: 'Không tìm thấy đề tài' }

      // Business rule: chỉ tạo milestone khi đề tài đang active
      if (['COMPLETED', 'CANCELLED', 'REJECTED'].includes(project.status)) {
        return { success: false, error: 'Không thể thêm mốc tiến độ cho đề tài đã kết thúc hoặc bị từ chối' }
      }

      const access = await this.canAccessResource(
        options,
        project.principalInvestigatorId,
        project.unit?.id
      )
      if (!access.allowed) return { success: false, error: 'Không có quyền thêm mốc tiến độ' }

      const parsed = nckhMilestoneCreateSchema.safeParse(rawInput)
      if (!parsed.success) {
        return { success: false, error: parsed.error.errors[0].message }
      }
      const input = parsed.data

      const milestone = await nckhMilestoneRepo.create({
        projectId,
        title: input.title,
        dueDate: new Date(input.dueDate),
        note: input.note ?? null,
        attachmentUrl: input.attachmentUrl ?? null,
      })
      return { success: true, data: milestone }
    } catch (error) {
      console.error('[NckhMilestoneService.createMilestone]', error)
      return { success: false, error: 'Lỗi khi tạo mốc tiến độ' }
    }
  }

  async updateMilestone(
    options: ScopedQueryOptions,
    projectId: string,
    milestoneId: string,
    rawInput: NckhMilestoneUpdateInput
  ): Promise<ServiceResult<unknown>> {
    try {
      const project = await nckhProjectRepo.findById(projectId)
      if (!project) return { success: false, error: 'Không tìm thấy đề tài' }

      const milestone = await nckhMilestoneRepo.findById(milestoneId)
      if (!milestone || milestone.projectId !== projectId) {
        return { success: false, error: 'Không tìm thấy mốc tiến độ' }
      }

      // Không cho sửa milestone đã CANCELLED
      if (milestone.status === 'CANCELLED') {
        return { success: false, error: 'Không thể sửa mốc tiến độ đã hủy' }
      }

      const access = await this.canAccessResource(
        options,
        project.principalInvestigatorId,
        project.unit?.id
      )
      if (!access.allowed) return { success: false, error: 'Không có quyền cập nhật mốc tiến độ' }

      const parsed = nckhMilestoneUpdateSchema.safeParse(rawInput)
      if (!parsed.success) {
        return { success: false, error: parsed.error.errors[0].message }
      }
      const input = parsed.data

      // Business rule: nếu đánh dấu COMPLETED thì tự động set completedAt = now nếu chưa có
      const completedAt =
        input.status === 'COMPLETED' && !input.completedAt
          ? new Date()
          : input.completedAt
          ? new Date(input.completedAt)
          : undefined

      const updated = await nckhMilestoneRepo.update(milestoneId, {
        title: input.title,
        dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
        status: input.status as NckhMilestoneStatus | undefined,
        completedAt,
        note: input.note,
        attachmentUrl: input.attachmentUrl,
      })
      return { success: true, data: updated }
    } catch (error) {
      console.error('[NckhMilestoneService.updateMilestone]', error)
      return { success: false, error: 'Lỗi khi cập nhật mốc tiến độ' }
    }
  }

  async deleteMilestone(
    options: ScopedQueryOptions,
    projectId: string,
    milestoneId: string
  ): Promise<ServiceResult<null>> {
    try {
      const project = await nckhProjectRepo.findById(projectId)
      if (!project) return { success: false, error: 'Không tìm thấy đề tài' }

      const milestone = await nckhMilestoneRepo.findById(milestoneId)
      if (!milestone || milestone.projectId !== projectId) {
        return { success: false, error: 'Không tìm thấy mốc tiến độ' }
      }

      // Không xóa milestone đã COMPLETED
      if (milestone.status === 'COMPLETED') {
        return { success: false, error: 'Không thể xóa mốc tiến độ đã hoàn thành' }
      }

      const access = await this.canAccessResource(
        options,
        project.principalInvestigatorId,
        project.unit?.id
      )
      if (!access.allowed) return { success: false, error: 'Không có quyền xóa mốc tiến độ' }

      await nckhMilestoneRepo.delete(milestoneId)
      return { success: true, data: null }
    } catch (error) {
      console.error('[NckhMilestoneService.deleteMilestone]', error)
      return { success: false, error: 'Lỗi khi xóa mốc tiến độ' }
    }
  }

  /** Tính % hoàn thành dựa trên số milestone COMPLETED / tổng */
  async getProgress(projectId: string): Promise<ServiceResult<{ percent: number; byStatus: Record<string, number> }>> {
    try {
      const counts = await nckhMilestoneRepo.countByProject(projectId)
      const byStatus = counts.reduce(
        (acc, c) => ({ ...acc, [c.status]: c._count.id }),
        {} as Record<string, number>
      )
      const total = Object.values(byStatus).reduce((a, b) => a + b, 0)
      const completed = byStatus['COMPLETED'] ?? 0
      const percent = total > 0 ? Math.round((completed / total) * 100) : 0
      return { success: true, data: { percent, byStatus } }
    } catch (error) {
      console.error('[NckhMilestoneService.getProgress]', error)
      return { success: false, error: 'Lỗi khi tính tiến độ' }
    }
  }
}

export const nckhMilestoneService = new NckhMilestoneServiceClass()
