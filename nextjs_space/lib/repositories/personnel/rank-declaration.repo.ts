import 'server-only'
import db from '@/lib/db'
import type { RankDeclarationStatus, AmendmentStatus, PromotionType, Prisma } from '@prisma/client'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RankDeclarationCreateData {
  personnelId: string
  rankType: string
  promotionType: PromotionType
  previousRank?: string | null
  newRank?: string | null
  effectiveDate: Date
  decisionNumber?: string | null
  decisionDate?: Date | null
  previousPosition?: string | null
  newPosition?: string | null
  reason?: string | null
  notes?: string | null
  attachments?: Prisma.InputJsonValue | null
  declaredBy: string
  declaredOnBehalfOf?: boolean
  createdBy?: string | null
}

export interface RankDeclarationFilter {
  personnelId?: string
  declarationStatus?: RankDeclarationStatus | RankDeclarationStatus[]
  rankType?: string
  declaredBy?: string
  unitId?: string
  keyword?: string
  page?: number
  limit?: number
}

export interface AmendmentCreateData {
  declarationId: string
  requestedChanges: Prisma.InputJsonValue
  reason: string
  requestedBy: string
}

const declarationInclude = {
  personnel: {
    select: {
      id: true,
      fullName: true,
      personnelCode: true,
      militaryRank: true,
      managingOrgan: true,
      unit: { select: { id: true, name: true, commanderId: true } },
    },
  },
  declarer: { select: { id: true, name: true, email: true } },
} satisfies Prisma.RankDeclarationInclude

// ─── Rank Declaration ─────────────────────────────────────────────────────────

export async function createRankDeclaration(data: RankDeclarationCreateData) {
  return db.rankDeclaration.create({
    data: {
      personnelId: data.personnelId,
      rankType: data.rankType,
      promotionType: data.promotionType,
      previousRank: data.previousRank ?? null,
      newRank: data.newRank ?? null,
      effectiveDate: data.effectiveDate,
      decisionNumber: data.decisionNumber ?? null,
      decisionDate: data.decisionDate ?? null,
      previousPosition: data.previousPosition ?? null,
      newPosition: data.newPosition ?? null,
      reason: data.reason ?? null,
      notes: data.notes ?? null,
      attachments: data.attachments ?? undefined,
      declaredBy: data.declaredBy,
      declaredOnBehalfOf: data.declaredOnBehalfOf ?? false,
      createdBy: data.createdBy ?? null,
    },
    include: declarationInclude,
  })
}

export async function findRankDeclarationById(id: string) {
  return db.rankDeclaration.findUnique({
    where: { id },
    include: {
      ...declarationInclude,
      amendments: {
        orderBy: { createdAt: 'desc' },
        include: { requester: { select: { id: true, name: true } } },
      },
    },
  })
}

export async function findRankDeclarationsByPersonnel(personnelId: string) {
  return db.rankDeclaration.findMany({
    where: { personnelId },
    include: declarationInclude,
    orderBy: { effectiveDate: 'desc' },
  })
}

export async function listRankDeclarations(filter: RankDeclarationFilter) {
  const page = Math.max(1, filter.page ?? 1)
  const limit = Math.min(100, filter.limit ?? 20)
  const skip = (page - 1) * limit

  const where: Prisma.RankDeclarationWhereInput = {}

  if (filter.personnelId) {
    where.personnelId = filter.personnelId
  }

  if (filter.declarationStatus) {
    if (Array.isArray(filter.declarationStatus)) {
      where.declarationStatus = { in: filter.declarationStatus }
    } else {
      where.declarationStatus = filter.declarationStatus
    }
  }

  if (filter.rankType) {
    where.rankType = filter.rankType
  }

  if (filter.declaredBy) {
    where.declaredBy = filter.declaredBy
  }

  if (filter.unitId) {
    where.personnel = { unitId: filter.unitId }
  }

  if (filter.keyword) {
    where.personnel = {
      ...((where.personnel as object) ?? {}),
      OR: [
        { fullName: { contains: filter.keyword, mode: 'insensitive' } },
        { personnelCode: { contains: filter.keyword, mode: 'insensitive' } },
      ],
    }
  }

  const [total, items] = await Promise.all([
    db.rankDeclaration.count({ where }),
    db.rankDeclaration.findMany({
      where,
      include: declarationInclude,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
  ])

  return { items, total, page, limit, totalPages: Math.ceil(total / limit) }
}

export async function updateRankDeclaration(
  id: string,
  data: Partial<Omit<RankDeclarationCreateData, 'personnelId' | 'declaredBy'>> & {
    declarationStatus?: RankDeclarationStatus
    workflowInstanceId?: string | null
    lockedAt?: Date | null
    lockedBy?: string | null
    committedPromotionId?: string | null
    committedServiceRecordId?: string | null
    updatedBy?: string | null
  },
) {
  return db.rankDeclaration.update({
    where: { id },
    data: {
      ...data,
      updatedAt: new Date(),
    },
    include: declarationInclude,
  })
}

// ─── Declaration Amendment ────────────────────────────────────────────────────

export async function createAmendment(data: AmendmentCreateData) {
  return db.declarationAmendment.create({
    data: {
      declarationId: data.declarationId,
      requestedChanges: data.requestedChanges,
      reason: data.reason,
      requestedBy: data.requestedBy,
    },
    include: { requester: { select: { id: true, name: true } } },
  })
}

export async function findAmendmentById(id: string) {
  return db.declarationAmendment.findUnique({
    where: { id },
    include: {
      declaration: { include: declarationInclude },
      requester: { select: { id: true, name: true } },
    },
  })
}

export async function listAmendmentsByDeclaration(declarationId: string) {
  return db.declarationAmendment.findMany({
    where: { declarationId },
    include: { requester: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'desc' },
  })
}

export async function updateAmendment(
  id: string,
  data: {
    amendmentStatus?: AmendmentStatus
    workflowInstanceId?: string | null
    reviewedAt?: Date | null
    reviewedBy?: string | null
    reviewNote?: string | null
  },
) {
  return db.declarationAmendment.update({
    where: { id },
    data,
    include: { requester: { select: { id: true, name: true } } },
  })
}
