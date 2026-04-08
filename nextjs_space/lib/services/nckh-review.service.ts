/**
 * NckhReviewService – Module M09 UC-45
 * Business logic cho phiên nghiệm thu.
 * Kết quả nghiệm thu ảnh hưởng đến status/phase của đề tài.
 */
import 'server-only'
import { BaseService, ScopedQueryOptions, ServiceResult } from './base-service'
import { nckhProjectRepo } from '@/lib/repositories/nckh/nckh-project.repo'
import { nckhReviewRepo } from '@/lib/repositories/nckh/nckh-review.repo'
import {
  nckhReviewCreateSchema,
  type NckhReviewCreateInput,
} from '@/lib/validations/nckh-project'

// ─── Phase/Status transition sau nghiệm thu ────────────────────────────────────
// Theo thiết kế: PASSED tại NGHIEM_THU_CAP_HV → COMPLETED + ACCEPTED
// PASSED tại NGHIEM_THU_CO_SO → phase chuyển sang FINAL_REVIEW (chờ cấp HV)
// FAILED hoặc REVISION_REQUIRED → giữ nguyên, để PI chỉnh sửa

interface ReviewOutcome {
  newStatus?: 'COMPLETED' | 'IN_PROGRESS'
  newPhase?: 'FINAL_REVIEW' | 'ACCEPTED'
  completionGrade?: string
  completionScore?: number
}

function determineOutcome(
  reviewType: string,
  decision: string,
  score?: number | null,
  grade?: string | null
): ReviewOutcome | null {
  if (decision === 'PASSED') {
    if (reviewType === 'NGHIEM_THU_CAP_HV' || reviewType === 'NGHIEM_THU_CAP_TREN') {
      // Nghiệm thu cấp HV hoặc cấp trên PASSED → đề tài hoàn thành
      return {
        newStatus: 'COMPLETED',
        newPhase: 'ACCEPTED',
        completionGrade: grade ?? undefined,
        completionScore: score ?? undefined,
      }
    }
    if (reviewType === 'NGHIEM_THU_CO_SO') {
      // Nghiệm thu cơ sở PASSED → chuyển lên chờ nghiệm thu cấp HV
      return { newStatus: 'IN_PROGRESS', newPhase: 'FINAL_REVIEW' }
    }
    if (reviewType === 'THAM_DINH_DE_CUONG') {
      // Thẩm định đề cương xong → chuyển sang ký hợp đồng
      return { newStatus: 'APPROVED', newPhase: 'CONTRACT' } as unknown as ReviewOutcome
    }
  }
  // FAILED hoặc REVISION_REQUIRED → không thay đổi phase (PI tự chỉnh sửa)
  return null
}

// ─── Service Class ────────────────────────────────────────────────────────────

class NckhReviewServiceClass extends BaseService {
  protected readonly resourceType = 'NCKH_REVIEW'

  async listReviews(
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

      const reviews = await nckhReviewRepo.findByProject(projectId)
      return { success: true, data: reviews }
    } catch (error) {
      console.error('[NckhReviewService.listReviews]', error)
      return { success: false, error: 'Lỗi khi tải danh sách nghiệm thu' }
    }
  }

  async getReviewById(
    options: ScopedQueryOptions,
    projectId: string,
    reviewId: string
  ): Promise<ServiceResult<unknown>> {
    try {
      const review = await nckhReviewRepo.findById(reviewId)
      if (!review || review.projectId !== projectId) {
        return { success: false, error: 'Không tìm thấy phiên nghiệm thu' }
      }
      return { success: true, data: review }
    } catch (error) {
      console.error('[NckhReviewService.getReviewById]', error)
      return { success: false, error: 'Lỗi khi tải nghiệm thu' }
    }
  }

  /**
   * Tạo phiên nghiệm thu và áp dụng kết quả lên project.
   * Đây là điểm duy nhất review tác động ngược lại sang NckhProject.
   */
  async createReview(
    options: ScopedQueryOptions,
    projectId: string,
    rawInput: NckhReviewCreateInput
  ): Promise<ServiceResult<unknown>> {
    try {
      const project = await nckhProjectRepo.findById(projectId)
      if (!project) return { success: false, error: 'Không tìm thấy đề tài' }

      // Business rule: chỉ tạo review khi đề tài đang IN_PROGRESS hoặc APPROVED (thẩm định đề cương)
      const allowedStatuses = ['APPROVED', 'IN_PROGRESS']
      if (!allowedStatuses.includes(project.status)) {
        return {
          success: false,
          error: `Chỉ tạo nghiệm thu khi đề tài đang ở trạng thái: ${allowedStatuses.join(', ')}`,
        }
      }

      const parsed = nckhReviewCreateSchema.safeParse(rawInput)
      if (!parsed.success) {
        return { success: false, error: parsed.error.errors[0].message }
      }
      const input = parsed.data

      // Tạo review
      const review = await nckhReviewRepo.create({
        projectId,
        reviewType: input.reviewType,
        reviewDate: new Date(input.reviewDate),
        score: input.score ?? null,
        grade: input.grade ?? null,
        decision: input.decision,
        comments: input.comments ?? null,
        minutesUrl: input.minutesUrl ?? null,
      })

      // Áp dụng outcome lên project nếu có
      const outcome = determineOutcome(input.reviewType, input.decision, input.score, input.grade)
      if (outcome) {
        await nckhProjectRepo.updateWorkflowState(projectId, {
          ...(outcome.newStatus ? { status: outcome.newStatus as 'COMPLETED' | 'IN_PROGRESS' } : {}),
          ...(outcome.newPhase ? { phase: outcome.newPhase as 'FINAL_REVIEW' | 'ACCEPTED' } : {}),
          ...(outcome.completionScore !== undefined ? { completionScore: outcome.completionScore } : {}),
          ...(outcome.completionGrade !== undefined ? { completionGrade: outcome.completionGrade } : {}),
        })
      }

      return { success: true, data: review }
    } catch (error) {
      console.error('[NckhReviewService.createReview]', error)
      return { success: false, error: 'Lỗi khi tạo phiên nghiệm thu' }
    }
  }

  /** Cập nhật biên bản sau khi nghiệm thu (chỉ minutesUrl + comments) */
  async updateMinutes(
    options: ScopedQueryOptions,
    projectId: string,
    reviewId: string,
    data: { minutesUrl?: string | null; comments?: string | null }
  ): Promise<ServiceResult<unknown>> {
    try {
      const review = await nckhReviewRepo.findById(reviewId)
      if (!review || review.projectId !== projectId) {
        return { success: false, error: 'Không tìm thấy phiên nghiệm thu' }
      }

      const updated = await nckhReviewRepo.updateMinutes(reviewId, data)
      return { success: true, data: updated }
    } catch (error) {
      console.error('[NckhReviewService.updateMinutes]', error)
      return { success: false, error: 'Lỗi khi cập nhật biên bản' }
    }
  }

  async getProjectReviewSummary(
    options: ScopedQueryOptions,
    projectId: string
  ): Promise<ServiceResult<unknown>> {
    try {
      const [summary, latest] = await Promise.all([
        nckhReviewRepo.summarizeByProject(projectId),
        nckhReviewRepo.findLatestByProject(projectId),
      ])
      return {
        success: true,
        data: {
          summary,
          latestDecision: latest?.decision ?? null,
          latestScore: latest?.score ?? null,
          latestGrade: latest?.grade ?? null,
        },
      }
    } catch (error) {
      console.error('[NckhReviewService.getProjectReviewSummary]', error)
      return { success: false, error: 'Lỗi khi tải tóm tắt nghiệm thu' }
    }
  }
}

export const nckhReviewService = new NckhReviewServiceClass()
