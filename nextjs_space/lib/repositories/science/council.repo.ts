/**
 * CouncilRepo – Phase 5
 * Data access cho ScientificCouncil + Members + Reviews.
 * Vote field visibility enforced at service layer (not here).
 */
import 'server-only'
import { db } from '@/lib/db'
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
    return db.scientificCouncil.findUnique({
      where: { id },
      select: COUNCIL_SELECT_BASE,
    })
  },

  /** Full record including votes – only for chairman/admin */
  async findByIdWithVotes(id: string) {
    return db.scientificCouncil.findUnique({
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
    return db.scientificCouncil.findMany({
      where: { projectId },
      select: COUNCIL_SELECT_BASE,
      orderBy: { createdAt: 'asc' },
    })
  },

  async create(input: CouncilCreateInput) {
    const { members, ...councilData } = input
    return db.scientificCouncil.create({
      data: {
        ...councilData,
        members: { create: members },
      },
      select: COUNCIL_SELECT_BASE,
    })
  },

  async findMember(councilId: string, userId: string) {
    return db.scientificCouncilMember.findUnique({
      where: { councilId_userId: { councilId, userId } },
    })
  },

  async submitMemberVote(memberId: string, vote: string) {
    return db.scientificCouncilMember.update({
      where: { id: memberId },
      data: { vote },
    })
  },

  async createReviews(
    councilId: string,
    memberId: string,
    scores: { criteria: string; score: number; comment?: string }[]
  ) {
    return db.scientificCouncilReview.createMany({
      data: scores.map((s) => ({ councilId, memberId, ...s })),
      skipDuplicates: true,
    })
  },

  async finalize(id: string, input: CouncilAcceptanceInput) {
    return db.scientificCouncil.update({
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
    const agg = await db.scientificCouncilReview.aggregate({
      where: { councilId },
      _avg: { score: true },
    })
    return agg._avg.score
  },
}

export type CouncilRecord = NonNullable<Awaited<ReturnType<typeof councilRepo.findById>>>
