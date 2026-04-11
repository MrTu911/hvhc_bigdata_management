/**
 * CouncilRepo – Phase 5
 * Data access cho ScientificCouncil + Members + Reviews.
 * Vote field visibility enforced at service layer (not here).
 */
import 'server-only'
import prisma from '@/lib/db'
import type {
  CouncilCreateInput,
  CouncilAcceptanceInput,
} from '@/lib/validations/science-council'

// ─── Shared select (no votes – service adds them conditionally) ───────────────

const COUNCIL_SELECT_BASE = {
  id: true,
  projectId: true,
  type: true,
  meetingDate: true,
  result: true,
  overallScore: true,
  conclusionText: true,
  minutesFilePath: true,
  createdAt: true,
  updatedAt: true,
  project: { select: { id: true, projectCode: true, title: true } },
  chairman: { select: { id: true, name: true, rank: true } },
  secretary: { select: { id: true, name: true, rank: true } },
  members: {
    select: {
      id: true,
      role: true,
      // vote omitted – added conditionally by service
      user: { select: { id: true, name: true, rank: true, academicTitle: true } },
    },
  },
  reviews: {
    select: {
      id: true,
      memberId: true,
      criteria: true,
      score: true,
      comment: true,
      createdAt: true,
    },
  },
} as const

export const councilRepo = {
  async findById(id: string) {
    return prisma.scientificCouncil.findUnique({
      where: { id },
      select: COUNCIL_SELECT_BASE,
    })
  },

  /** Full record including votes – only for chairman/admin */
  async findByIdWithVotes(id: string) {
    return prisma.scientificCouncil.findUnique({
      where: { id },
      select: {
        ...COUNCIL_SELECT_BASE,
        members: {
          select: {
            id: true,
            role: true,
            vote: true,
            user: { select: { id: true, name: true, rank: true, academicTitle: true } },
          },
        },
      },
    })
  },

  async findByProjectId(projectId: string) {
    return prisma.scientificCouncil.findMany({
      where: { projectId },
      select: COUNCIL_SELECT_BASE,
      orderBy: { createdAt: 'asc' },
    })
  },

  async findMany(filter: {
    type?: string
    result?: string
    projectId?: string
    page: number
    pageSize: number
  }) {
    const { type, result, projectId, page, pageSize } = filter
    const skip  = (page - 1) * pageSize
    const where = {
      ...(type      ? { type }      : {}),
      ...(result    ? { result }    : {}),
      ...(projectId ? { projectId } : {}),
    }

    const LIST_SELECT = {
      id:           true,
      type:         true,
      meetingDate:  true,
      result:       true,
      overallScore: true,
      createdAt:    true,
      project: { select: { id: true, projectCode: true, title: true } },
      chairman: { select: { id: true, name: true } },
      _count: { select: { members: true, reviews: true } },
    } as const

    const [items, total] = await Promise.all([
      prisma.scientificCouncil.findMany({
        where,
        select: LIST_SELECT,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.scientificCouncil.count({ where }),
    ])

    return { items, total }
  },

  async create(input: CouncilCreateInput) {
    const { members, ...councilData } = input
    return prisma.scientificCouncil.create({
      data: {
        ...councilData,
        members: { create: members },
      },
      select: COUNCIL_SELECT_BASE,
    })
  },

  async findMember(councilId: string, userId: string) {
    return prisma.scientificCouncilMember.findUnique({
      where: { councilId_userId: { councilId, userId } },
    })
  },

  async submitMemberVote(memberId: string, vote: string) {
    return prisma.scientificCouncilMember.update({
      where: { id: memberId },
      data: { vote },
    })
  },

  async createReviews(
    councilId: string,
    memberId: string,
    scores: { criteria: string; score: number; comment?: string }[]
  ) {
    return prisma.scientificCouncilReview.createMany({
      data: scores.map((s) => ({ councilId, memberId, ...s })),
      skipDuplicates: true,
    })
  },

  async finalize(id: string, input: CouncilAcceptanceInput) {
    return prisma.scientificCouncil.update({
      where: { id },
      data: {
        result: input.result,
        overallScore: input.overallScore,
        conclusionText: input.conclusionText,
        minutesFilePath: input.minutesFilePath,
      },
      select: COUNCIL_SELECT_BASE,
    })
  },

  async computeAverageScore(councilId: string) {
    const agg = await prisma.scientificCouncilReview.aggregate({
      where: { councilId },
      _avg: { score: true },
    })
    return agg._avg.score
  },

  /**
   * Tổng hợp phiếu bầu của hội đồng – chỉ dùng khi caller có quyền xem vote.
   * Trả về số lượng PASS/FAIL/REVISE và gợi ý kết quả theo quy tắc 2/3.
   */
  async getVoteSummary(councilId: string): Promise<VoteSummary> {
    const members = await prisma.scientificCouncilMember.findMany({
      where: { councilId },
      select: { id: true, vote: true, role: true, user: { select: { id: true, name: true } } },
    })

    const total = members.length
    const voteCounts = { PASS: 0, FAIL: 0, REVISE: 0, PENDING: 0 }
    const voteDetails: VoteSummary['voteDetails'] = []

    for (const m of members) {
      const vote = (m.vote ?? 'PENDING') as keyof typeof voteCounts
      if (vote in voteCounts) voteCounts[vote]++
      voteDetails.push({
        memberId: m.id,
        userId: m.user.id,
        userName: m.user.name,
        role: m.role,
        vote: m.vote ?? null,
      })
    }

    const voted = total - voteCounts.PENDING
    // Quy tắc 2/3: khi đủ túc số và PASS >= 2/3 thành viên có mặt thì gợi ý PASS
    const suggestedResult =
      voted > 0 && voteCounts.PASS >= Math.ceil((voted * 2) / 3)
        ? 'PASS'
        : voted > 0 && voteCounts.FAIL >= Math.ceil((voted * 2) / 3)
          ? 'FAIL'
          : null

    return { total, voted, voteCounts, suggestedResult, voteDetails }
  },

  /** Lấy review của một thành viên cụ thể trong hội đồng (closed-review). */
  async getReviewsByMember(councilId: string, memberId: string) {
    return prisma.scientificCouncilReview.findMany({
      where: { councilId, memberId },
      select: { id: true, criteria: true, score: true, comment: true, createdAt: true },
    })
  },
}

export type VoteSummary = {
  total: number
  voted: number
  voteCounts: { PASS: number; FAIL: number; REVISE: number; PENDING: number }
  suggestedResult: 'PASS' | 'FAIL' | null
  voteDetails: {
    memberId: string
    userId: string
    userName: string
    role: string
    vote: string | null
  }[]
}

export type CouncilRecord = NonNullable<Awaited<ReturnType<typeof councilRepo.findById>>>
