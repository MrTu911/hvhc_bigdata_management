import 'server-only'
import db from '@/lib/db'
import type { PromotionProposalStatus, Prisma } from '@prisma/client'

export interface ProposalCreateData {
  personnelId: string
  proposedById: string
  proposingUnitId: string
  proposedRank: string
  justification: string
  eligibilitySnap?: Prisma.InputJsonValue | null
}

const proposalInclude = {
  personnel: {
    select: {
      id: true,
      fullName: true,
      personnelCode: true,
      militaryRank: true,
      managingOrgan: true,
      unit: { select: { id: true, name: true } },
    },
  },
  proposedBy: { select: { id: true, name: true } },
  proposingUnit: { select: { id: true, name: true } },
} satisfies Prisma.PromotionProposalInclude

export async function createProposal(data: ProposalCreateData) {
  return db.promotionProposal.create({
    data: {
      personnelId:     data.personnelId,
      proposedById:    data.proposedById,
      proposingUnitId: data.proposingUnitId,
      proposedRank:    data.proposedRank,
      justification:   data.justification,
      eligibilitySnap: data.eligibilitySnap ?? undefined,
    },
    include: proposalInclude,
  })
}

export async function findProposalById(id: string) {
  return db.promotionProposal.findUnique({ where: { id }, include: proposalInclude })
}

export async function listProposals(filter: {
  personnelId?: string
  proposingUnitId?: string
  status?: PromotionProposalStatus
  page?: number
  limit?: number
}) {
  const page  = Math.max(1, filter.page ?? 1)
  const limit = Math.min(100, filter.limit ?? 20)
  const skip  = (page - 1) * limit

  const where: Prisma.PromotionProposalWhereInput = {}
  if (filter.personnelId)    where.personnelId    = filter.personnelId
  if (filter.proposingUnitId) where.proposingUnitId = filter.proposingUnitId
  if (filter.status)         where.status         = filter.status

  const [total, items] = await Promise.all([
    db.promotionProposal.count({ where }),
    db.promotionProposal.findMany({
      where,
      include: proposalInclude,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
  ])

  return { items, total, page, limit, totalPages: Math.ceil(total / limit) }
}

export async function updateProposal(
  id: string,
  data: {
    status?: PromotionProposalStatus
    workflowInstanceId?: string | null
    respondedAt?: Date | null
    respondedBy?: string | null
    responseNote?: string | null
  },
) {
  return db.promotionProposal.update({ where: { id }, data, include: proposalInclude })
}
