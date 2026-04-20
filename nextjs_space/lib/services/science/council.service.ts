/**
 * CouncilService – CSDL-KHQL Phase 5 / Sprint 02
 * Business logic cho ScientificCouncil:
 *   - Tạo hội đồng + chỉ định thành viên (Sprint 02: conflict-of-interest guard)
 *   - Thành viên nộp điểm chấm + phiếu bầu kín
 *   - Chairman finalize kết quả PASS/FAIL/REVISE
 *
 * Security:
 *   - vote field chỉ expose khi caller là CHAIRMAN hoặc có COUNCIL_FINALIZE.
 *   - Sprint 02: PI của đề tài và thành viên nghiên cứu không được tham gia hội đồng đánh giá đề tài đó.
 */
import 'server-only'
import { councilRepo, type VoteSummary } from '@/lib/repositories/science/council.repo'
import { logAudit } from '@/lib/audit'
import prisma from '@/lib/db'
import type {
  CouncilCreateInput,
  CouncilReviewSubmitInput,
  CouncilAcceptanceInput,
} from '@/lib/validations/science-council'

// ─── Conflict-of-interest check ──────────────────────────────────────────────

/**
 * Kiểm tra xung đột lợi ích khi thêm thành viên vào hội đồng.
 *
 * Quy tắc:
 *   - Principal Investigator của đề tài không được tham gia hội đồng đánh giá đề tài đó.
 *   - Thành viên nghiên cứu chính thức (NckhMember) của đề tài không được tham gia hội đồng.
 *
 * Trả về mảng userId vi phạm kèm lý do để caller có thể log rõ ràng.
 */
async function checkConflictOfInterest(
  projectId: string,
  proposedMemberIds: string[],
): Promise<{ userId: string; reason: 'PI' | 'RESEARCH_MEMBER' }[]> {
  const [project, researchMembers] = await Promise.all([
    prisma.nckhProject.findUnique({
      where: { id: projectId },
      select: { principalInvestigatorId: true },
    }),
    prisma.nckhMember.findMany({
      where: { projectId },
      select: { userId: true },
    }),
  ])

  if (!project) return []

  const piId = project.principalInvestigatorId
  const researchMemberIds = new Set(researchMembers.map((m) => m.userId))

  const conflicts: { userId: string; reason: 'PI' | 'RESEARCH_MEMBER' }[] = []

  for (const userId of proposedMemberIds) {
    if (userId === piId) {
      conflicts.push({ userId, reason: 'PI' })
    } else if (researchMemberIds.has(userId)) {
      conflicts.push({ userId, reason: 'RESEARCH_MEMBER' })
    }
  }

  return conflicts
}

export const councilService = {
  async listCouncils(filter: {
    type?: string
    result?: string
    projectId?: string
    page: number
    pageSize: number
  }) {
    const data = await councilRepo.findMany(filter)
    return { success: true as const, data }
  },

  async getCouncilsByProject(projectId: string) {
    const councils = await councilRepo.findByProjectId(projectId)
    return { success: true as const, data: councils }
  },

  async getCouncilById(
    id: string,
    options: {
      canSeeVotes: boolean
      /** userId của caller – nếu cung cấp, reviews sẽ được lọc chỉ trả review của member này (closed-review). Bỏ qua khi canSeeVotes=true. */
      callerUserId?: string
    }
  ) {
    const { canSeeVotes, callerUserId } = options
    const council = canSeeVotes
      ? await councilRepo.findByIdWithVotes(id)
      : await councilRepo.findById(id)

    if (!council) return { success: false as const, error: 'Không tìm thấy hội đồng' }

    if (!canSeeVotes && callerUserId) {
      // Closed-review: mỗi thành viên chỉ thấy review của chính mình.
      const memberRecord = await councilRepo.findMember(id, callerUserId)
      const ownReviews = memberRecord
        ? await councilRepo.getReviewsByMember(id, memberRecord.id)
        : []

      return {
        success: true as const,
        data: {
          ...council,
          reviews: ownReviews,
        },
      }
    }

    return { success: true as const, data: council }
  },

  /**
   * Lấy tổng hợp phiếu bầu. Chỉ dành cho CHAIRMAN / COUNCIL_FINALIZE.
   * Áp dụng quy tắc 2/3: PASS >= 2/3 tổng phiếu có giá trị → gợi ý PASS.
   */
  async getVoteSummary(councilId: string): Promise<{ success: true; data: VoteSummary } | { success: false; error: string }> {
    const council = await councilRepo.findById(councilId)
    if (!council) return { success: false, error: 'Không tìm thấy hội đồng' }
    const summary = await councilRepo.getVoteSummary(councilId)
    return { success: true, data: summary }
  },

  async createCouncil(input: CouncilCreateInput, userId: string, ipAddress?: string) {
    // ─── Guard: validate trạng thái đề tài phù hợp với loại hội đồng ─────
    const project = await prisma.nckhProject.findUnique({
      where: { id: input.projectId },
      select: { status: true, projectCode: true },
    })

    if (!project) {
      return { success: false as const, error: 'Đề tài không tồn tại' }
    }

    const ALLOWED_STATUS: Record<string, string[]> = {
      REVIEW:     ['SUBMITTED', 'UNDER_REVIEW'],
      ACCEPTANCE: ['IN_PROGRESS', 'PAUSED', 'COMPLETED'],
      FINAL:      ['COMPLETED'],
    }

    const allowed = ALLOWED_STATUS[input.type]
    if (allowed && !allowed.includes(project.status)) {
      const typeLabel: Record<string, string> = {
        REVIEW:     'Thẩm định đề cương',
        ACCEPTANCE: 'Nghiệm thu kết quả',
        FINAL:      'Kết luận cuối cùng',
      }
      return {
        success: false as const,
        error: `Không thể lập hội đồng "${typeLabel[input.type] ?? input.type}" cho đề tài ${project.projectCode} đang ở trạng thái "${project.status}". Trạng thái hợp lệ: ${allowed.join(', ')}.`,
      }
    }

    // Chairman và Secretary phải nằm trong danh sách members (hoặc tự động thêm)
    const memberIds = new Set(input.members.map((m) => m.userId))
    if (!memberIds.has(input.chairmanId)) {
      input.members.push({ userId: input.chairmanId, role: 'CHAIRMAN' })
    }
    if (!memberIds.has(input.secretaryId)) {
      input.members.push({ userId: input.secretaryId, role: 'SECRETARY' })
    }

    // ─── Conflict-of-interest check (Sprint 02) ───────────────────────────
    // PI và thành viên nghiên cứu không được tham gia hội đồng đánh giá đề tài của chính mình.
    const proposedIds = input.members.map((m) => m.userId)
    const conflicts = await checkConflictOfInterest(input.projectId, proposedIds)

    if (conflicts.length > 0) {
      const details = conflicts
        .map((c) =>
          c.reason === 'PI'
            ? `userId=${c.userId} là Chủ nhiệm đề tài`
            : `userId=${c.userId} là thành viên nghiên cứu đề tài`,
        )
        .join('; ')

      await logAudit({
        userId,
        functionCode: 'MANAGE_COUNCIL',
        action: 'CREATE',
        resourceType: 'SCIENTIFIC_COUNCIL',
        resourceId: 'N/A',
        result: 'FAIL',
        ipAddress,
        metadata: {
          projectId: input.projectId,
          type: input.type,
          reason: 'CONFLICT_OF_INTEREST',
          conflicts: conflicts,
        },
      })

      return {
        success: false as const,
        error: `Xung đột lợi ích: ${details}. Chủ nhiệm đề tài và thành viên nghiên cứu không được tham gia hội đồng đánh giá đề tài của mình.`,
      }
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
