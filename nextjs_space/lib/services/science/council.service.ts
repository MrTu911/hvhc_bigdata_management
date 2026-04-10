/**
 * CouncilService – CSDL-KHQL Phase 5
 * Business logic cho ScientificCouncil:
 *   - Tạo hội đồng + chỉ định thành viên
 *   - Thành viên nộp điểm chấm + phiếu bầu kín
 *   - Chairman finalize kết quả PASS/FAIL/REVISE
 *
 * Security: vote field chỉ expose khi caller là CHAIRMAN hoặc có COUNCIL_FINALIZE.
 */
import 'server-only'
import { councilRepo } from '@/lib/repositories/science/council.repo'
import { logAudit } from '@/lib/audit'
import type {
  CouncilCreateInput,
  CouncilReviewSubmitInput,
  CouncilAcceptanceInput,
} from '@/lib/validations/science-council'

export const councilService = {
  async getCouncilsByProject(projectId: string) {
    const councils = await councilRepo.findByProjectId(projectId)
    return { success: true as const, data: councils }
  },

  async getCouncilById(id: string, canSeeVotes: boolean) {
    const council = canSeeVotes
      ? await councilRepo.findByIdWithVotes(id)
      : await councilRepo.findById(id)

    if (!council) return { success: false as const, error: 'Không tìm thấy hội đồng' }
    return { success: true as const, data: council }
  },

  async createCouncil(input: CouncilCreateInput, userId: string, ipAddress?: string) {
    // Chairman và Secretary phải nằm trong danh sách members (hoặc tự động thêm)
    const memberIds = new Set(input.members.map((m) => m.userId))
    if (!memberIds.has(input.chairmanId)) {
      input.members.push({ userId: input.chairmanId, role: 'CHAIRMAN' })
    }
    if (!memberIds.has(input.secretaryId)) {
      input.members.push({ userId: input.secretaryId, role: 'SECRETARY' })
    }

    const council = await councilRepo.create(input)

    await logAudit({
      userId,
      functionCode: 'MANAGE_COUNCIL',
      action: 'CREATE',
      resourceType: 'SCIENTIFIC_COUNCIL',
      resourceId: council.id,
      result: 'SUCCESS',
      ipAddress,
      metadata: {
        projectId: input.projectId,
        type: input.type,
        memberCount: council.members.length,
      },
    })

    return { success: true as const, data: council }
  },

  async submitMemberReview(
    councilId: string,
    callerId: string,
    input: CouncilReviewSubmitInput,
    ipAddress?: string
  ) {
    // Caller phải là thành viên của hội đồng
    const membership = await councilRepo.findMember(councilId, callerId)
    if (!membership) {
      return {
        success: false as const,
        error: 'Bạn không phải thành viên của hội đồng này',
      }
    }

    await Promise.all([
      councilRepo.createReviews(councilId, membership.id, input.scores),
      councilRepo.submitMemberVote(membership.id, input.vote),
    ])

    await logAudit({
      userId: callerId,
      functionCode: 'SUBMIT_REVIEW',
      action: 'CREATE',
      resourceType: 'COUNCIL_REVIEW',
      resourceId: councilId,
      result: 'SUCCESS',
      ipAddress,
      metadata: { memberId: membership.id, vote: input.vote },
    })

    return { success: true as const }
  },

  async finalizeAcceptance(
    councilId: string,
    input: CouncilAcceptanceInput,
    userId: string,
    ipAddress?: string
  ) {
    const council = await councilRepo.findById(councilId)
    if (!council) return { success: false as const, error: 'Không tìm thấy hội đồng' }

    if (council.result) {
      return {
        success: false as const,
        error: `Hội đồng đã có kết quả: ${council.result}`,
      }
    }

    // Tính điểm trung bình nếu overallScore không được cung cấp
    let overallScore = input.overallScore
    if (overallScore === undefined) {
      overallScore = (await councilRepo.computeAverageScore(councilId)) ?? undefined
    }

    const updated = await councilRepo.finalize(councilId, {
      ...input,
      overallScore,
    })

    await logAudit({
      userId,
      functionCode: 'FINALIZE_ACCEPTANCE',
      action: 'UPDATE',
      resourceType: 'SCIENTIFIC_COUNCIL',
      resourceId: councilId,
      result: 'SUCCESS',
      ipAddress,
      metadata: {
        result: input.result,
        overallScore,
        projectId: council.projectId,
      },
    })

    return { success: true as const, data: updated }
  },
}
