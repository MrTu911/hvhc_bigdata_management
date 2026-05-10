/**
 * RankDeclarationService – M02 Extension
 * Business logic for rank promotion declaration lifecycle.
 *
 * Flow:
 *   DRAFT → (submit) → PENDING_REVIEW → (workflow) → APPROVED | REJECTED | RETURNED
 *   APPROVED + lockedAt → (amendment request) → DeclarationAmendment
 */
import 'server-only'
import db from '@/lib/db'
import { logAudit } from '@/lib/audit'
import { PROMOTION } from '@/lib/rbac/function-codes'
import type { PromotionType, OfficerRank, SoldierRank, Prisma } from '@prisma/client'
import {
  createRankDeclaration,
  findRankDeclarationById,
  updateRankDeclaration,
  listRankDeclarations,
  createAmendment,
  findAmendmentById,
  updateAmendment,
  type RankDeclarationCreateData,
  type RankDeclarationFilter,
  type AmendmentCreateData,
} from '@/lib/repositories/personnel/rank-declaration.repo'

// ─── Workflow template IDs (matched at seed time) ─────────────────────────────
const WF_TEMPLATE_CAN_BO   = 'RANK_DECLARATION_CAN_BO'
const WF_TEMPLATE_QUAN_LUC = 'RANK_DECLARATION_QUAN_LUC'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DeclareRankInput extends Omit<RankDeclarationCreateData, 'declaredBy'> {
  /** set to true when HR staff creates the declaration on behalf of the person */
  onBehalf?: boolean
}

export interface ActOnDeclarationInput {
  declarationId: string
  action: 'APPROVE' | 'REJECT' | 'RETURN'
  comment?: string
  actorId: string
}

export interface RequestAmendmentInput {
  declarationId: string
  requestedChanges: Record<string, { from: unknown; to: unknown }>
  reason: string
  requestedBy: string
}

export interface ActOnAmendmentInput {
  amendmentId: string
  action: 'APPROVE' | 'REJECT'
  reviewNote?: string
  actorId: string
}

// ─── Create Declaration ───────────────────────────────────────────────────────

export async function createDeclaration(input: DeclareRankInput, actorId: string) {
  const declaration = await createRankDeclaration({
    ...input,
    declaredBy: actorId,
    declaredOnBehalfOf: input.onBehalf ?? false,
    createdBy: actorId,
  })

  await logAudit({
    userId: actorId,
    functionCode: input.onBehalf ? PROMOTION.CREATE_ON_BEHALF : PROMOTION.CREATE_SELF,
    action: 'CREATE',
    resourceType: 'RANK_DECLARATION',
    resourceId: declaration.id,
    newValue: JSON.stringify({ personnelId: input.personnelId, rankType: input.rankType }),
    result: 'SUCCESS',
  })

  return declaration
}

// ─── Get & List ───────────────────────────────────────────────────────────────

export async function getDeclaration(id: string) {
  const declaration = await findRankDeclarationById(id)
  if (!declaration) throw new Error('NOT_FOUND')
  return declaration
}

export async function listDeclarations(filter: RankDeclarationFilter) {
  return listRankDeclarations(filter)
}

// ─── Update Draft ─────────────────────────────────────────────────────────────

export async function updateDeclarationDraft(
  id: string,
  data: Partial<DeclareRankInput>,
  actorId: string,
) {
  const existing = await findRankDeclarationById(id)
  if (!existing) throw new Error('NOT_FOUND')
  if (existing.declarationStatus !== 'DRAFT' && existing.declarationStatus !== 'RETURNED') {
    throw new Error('CANNOT_EDIT_NON_DRAFT')
  }
  if (existing.lockedAt) throw new Error('DECLARATION_LOCKED')

  const updated = await updateRankDeclaration(id, { ...data, updatedBy: actorId })

  await logAudit({
    userId: actorId,
    functionCode: PROMOTION.CREATE_SELF,
    action: 'UPDATE',
    resourceType: 'RANK_DECLARATION',
    resourceId: id,
    result: 'SUCCESS',
  })

  return updated
}

// ─── Cancel Draft ─────────────────────────────────────────────────────────────

export async function cancelDeclaration(id: string, actorId: string) {
  const existing = await findRankDeclarationById(id)
  if (!existing) throw new Error('NOT_FOUND')
  if (existing.declarationStatus !== 'DRAFT') throw new Error('CANNOT_CANCEL_NON_DRAFT')

  const updated = await updateRankDeclaration(id, {
    declarationStatus: 'CANCELLED',
    updatedBy: actorId,
  })

  await logAudit({
    userId: actorId,
    functionCode: PROMOTION.SUBMIT,
    action: 'CANCEL',
    resourceType: 'RANK_DECLARATION',
    resourceId: id,
    result: 'SUCCESS',
  })

  return updated
}

// ─── Submit Declaration ───────────────────────────────────────────────────────

export async function submitDeclaration(id: string, actorId: string) {
  const declaration = await findRankDeclarationById(id)
  if (!declaration) throw new Error('NOT_FOUND')

  if (
    declaration.declarationStatus !== 'DRAFT' &&
    declaration.declarationStatus !== 'RETURNED'
  ) {
    throw new Error('CANNOT_SUBMIT_FROM_CURRENT_STATUS')
  }

  const managingOrgan = declaration.personnel.managingOrgan
  if (!managingOrgan) {
    throw new Error('PERSONNEL_NO_MANAGING_ORGAN')
  }

  const templateId =
    managingOrgan === 'BAN_QUAN_LUC' ? WF_TEMPLATE_QUAN_LUC : WF_TEMPLATE_CAN_BO

  // Try to start M13 workflow; fallback gracefully if workflow engine unavailable
  let workflowInstanceId: string | null = null
  try {
    const wfDef = await db.workflowDefinition.findFirst({
      where: { code: templateId, isActive: true },
    })
    if (wfDef) {
      const wfInstance = await db.workflowInstance.create({
        data: {
          definitionId: wfDef.id,
          entityType: 'RankDeclaration',
          entityId: id,
          status: 'PENDING',
          initiatorId: actorId,
          title: `Duyệt khai báo quân hàm – ${declaration.personnel.fullName}`,
        },
      })
      workflowInstanceId = wfInstance.id
    }
  } catch (_) {
    // Workflow engine optional; declaration proceeds without it
  }

  const updated = await updateRankDeclaration(id, {
    declarationStatus: 'PENDING_REVIEW',
    workflowInstanceId,
    updatedBy: actorId,
  })

  await logAudit({
    userId: actorId,
    functionCode: PROMOTION.SUBMIT,
    action: 'SUBMIT',
    resourceType: 'RANK_DECLARATION',
    resourceId: id,
    newValue: JSON.stringify({ templateId, workflowInstanceId }),
    result: 'SUCCESS',
  })

  return updated
}

// ─── Act on Declaration (Approve / Reject / Return) ──────────────────────────

export async function actOnDeclaration(input: ActOnDeclarationInput) {
  const { declarationId, action, comment, actorId } = input

  const declaration = await findRankDeclarationById(declarationId)
  if (!declaration) throw new Error('NOT_FOUND')

  if (
    declaration.declarationStatus !== 'PENDING_REVIEW' &&
    declaration.declarationStatus !== 'UNDER_REVIEW'
  ) {
    throw new Error('INVALID_STATUS_FOR_ACTION')
  }

  if (action === 'APPROVE') {
    await commitDeclaration(declarationId, actorId)
    return findRankDeclarationById(declarationId)
  }

  const newStatus = action === 'REJECT' ? 'REJECTED' : 'RETURNED'
  const updated = await updateRankDeclaration(declarationId, {
    declarationStatus: newStatus,
    updatedBy: actorId,
  })

  await logAudit({
    userId: actorId,
    functionCode: PROMOTION.APPROVE,
    action,
    resourceType: 'RANK_DECLARATION',
    resourceId: declarationId,
    newValue: comment ? JSON.stringify({ comment }) : undefined,
    result: 'SUCCESS',
  })

  return updated
}

// ─── Commit Declaration (called internally on APPROVE) ────────────────────────

async function commitDeclaration(declarationId: string, actorId: string) {
  const declaration = await findRankDeclarationById(declarationId)
  if (!declaration) throw new Error('NOT_FOUND')

  await db.$transaction(async (tx) => {
    let committedPromotionId: string | null = null
    let committedServiceRecordId: string | null = null

    if (declaration.rankType === 'OFFICER') {
      // Resolve officerCareerId
      const officerCareer = await tx.officerCareer.findUnique({
        where: { personnelId: declaration.personnelId },
      })
      if (!officerCareer) throw new Error('OFFICER_CAREER_NOT_FOUND')

      // Create committed OfficerPromotion record
      const promotion = await tx.officerPromotion.create({
        data: {
          officerCareerId: officerCareer.id,
          promotionType: declaration.promotionType,
          effectiveDate: declaration.effectiveDate,
          decisionNumber: declaration.decisionNumber,
          decisionDate: declaration.decisionDate,
          previousRank: declaration.previousRank as OfficerRank | null | undefined,
          newRank: declaration.newRank as OfficerRank | null | undefined,
          previousPosition: declaration.previousPosition,
          newPosition: declaration.newPosition,
          reason: declaration.reason,
          notes: declaration.notes,
          attachments: declaration.attachments as Prisma.InputJsonValue | undefined,
          createdBy: actorId,
        },
      })
      committedPromotionId = promotion.id

      // Update OfficerCareer with new rank/position/lastRankDate when THANG_CAP
      if (declaration.promotionType === 'THANG_CAP' && declaration.newRank) {
        await tx.officerCareer.update({
          where: { id: officerCareer.id },
          data: {
            currentRank: declaration.newRank as OfficerRank,
            lastRankDate: declaration.effectiveDate,
            lastRankDecisionNo: declaration.decisionNumber,
            updatedBy: actorId,
          },
        })
      } else if (declaration.newPosition) {
        await tx.officerCareer.update({
          where: { id: officerCareer.id },
          data: { currentPosition: declaration.newPosition, updatedBy: actorId },
        })
      }
    } else {
      // SOLDIER
      const soldierProfile = await tx.soldierProfile.findUnique({
        where: { personnelId: declaration.personnelId },
      })
      if (!soldierProfile) throw new Error('SOLDIER_PROFILE_NOT_FOUND')

      const serviceRecord = await tx.soldierServiceRecord.create({
        data: {
          soldierProfileId: soldierProfile.id,
          eventType: declaration.promotionType,
          eventDate: declaration.effectiveDate,
          decisionNumber: declaration.decisionNumber,
          previousRank: declaration.previousRank as SoldierRank | null | undefined,
          newRank: declaration.newRank as SoldierRank | null | undefined,
          description: declaration.reason,
          notes: declaration.notes,
          createdBy: actorId,
        },
      })
      committedServiceRecordId = serviceRecord.id

      if (declaration.promotionType === 'THANG_CAP' && declaration.newRank) {
        await tx.soldierProfile.update({
          where: { id: soldierProfile.id },
          data: {
            currentRank: declaration.newRank as SoldierRank,
            lastRankDate: declaration.effectiveDate,
            updatedBy: actorId,
          },
        })
      }
    }

    // Lock the declaration
    await tx.rankDeclaration.update({
      where: { id: declarationId },
      data: {
        declarationStatus: 'APPROVED',
        lockedAt: new Date(),
        lockedBy: actorId,
        committedPromotionId,
        committedServiceRecordId,
        updatedBy: actorId,
      },
    })

    await logAudit({
      userId: actorId,
      functionCode: PROMOTION.APPROVE,
      action: 'APPROVE',
      resourceType: 'RANK_DECLARATION',
      resourceId: declarationId,
      newValue: JSON.stringify({ committedPromotionId, committedServiceRecordId }),
      result: 'SUCCESS',
    })
  })
}

// ─── Request Amendment ────────────────────────────────────────────────────────

export async function requestAmendment(input: RequestAmendmentInput) {
  const declaration = await findRankDeclarationById(input.declarationId)
  if (!declaration) throw new Error('NOT_FOUND')
  if (declaration.declarationStatus !== 'APPROVED' || !declaration.lockedAt) {
    throw new Error('DECLARATION_NOT_APPROVED_OR_NOT_LOCKED')
  }

  const amendment = await createAmendment({
    declarationId: input.declarationId,
    requestedChanges: input.requestedChanges as Prisma.InputJsonValue,
    reason: input.reason,
    requestedBy: input.requestedBy,
  })

  await logAudit({
    userId: input.requestedBy,
    functionCode: PROMOTION.REQUEST_AMENDMENT,
    action: 'REQUEST_AMENDMENT',
    resourceType: 'DECLARATION_AMENDMENT',
    resourceId: amendment.id,
    newValue: JSON.stringify({ declarationId: input.declarationId }),
    result: 'SUCCESS',
  })

  return amendment
}

// ─── Act on Amendment ─────────────────────────────────────────────────────────

export async function actOnAmendment(input: ActOnAmendmentInput) {
  const { amendmentId, action, reviewNote, actorId } = input

  const amendment = await findAmendmentById(amendmentId)
  if (!amendment) throw new Error('NOT_FOUND')
  if (amendment.amendmentStatus !== 'SUBMITTED' && amendment.amendmentStatus !== 'DRAFT') {
    throw new Error('INVALID_AMENDMENT_STATUS')
  }

  if (action === 'APPROVE') {
    await applyAmendment(amendment, actorId)
  }

  const updated = await updateAmendment(amendmentId, {
    amendmentStatus: action === 'APPROVE' ? 'APPROVED' : 'REJECTED',
    reviewedAt: new Date(),
    reviewedBy: actorId,
    reviewNote: reviewNote ?? null,
  })

  await logAudit({
    userId: actorId,
    functionCode: PROMOTION.APPROVE_AMENDMENT,
    action: action === 'APPROVE' ? 'APPLY_AMENDMENT' : 'REJECT_AMENDMENT',
    resourceType: 'DECLARATION_AMENDMENT',
    resourceId: amendmentId,
    result: 'SUCCESS',
  })

  return updated
}

// ─── Apply Amendment to committed record ─────────────────────────────────────

async function applyAmendment(
  amendment: Awaited<ReturnType<typeof findAmendmentById>>,
  actorId: string,
) {
  if (!amendment) return

  const changes = amendment.requestedChanges as Record<string, { from: unknown; to: unknown }>
  const declaration = amendment.declaration
  const patchData: Record<string, unknown> = {}

  for (const [field, { to }] of Object.entries(changes)) {
    patchData[field] = to
  }

  await db.$transaction(async (tx) => {
    if (declaration.committedPromotionId) {
      await tx.officerPromotion.update({
        where: { id: declaration.committedPromotionId },
        data: patchData as Prisma.OfficerPromotionUpdateInput,
      })
    } else if (declaration.committedServiceRecordId) {
      await tx.soldierServiceRecord.update({
        where: { id: declaration.committedServiceRecordId },
        data: patchData as Prisma.SoldierServiceRecordUpdateInput,
      })
    }

    await logAudit({
      userId: actorId,
      functionCode: PROMOTION.APPROVE_AMENDMENT,
      action: 'APPLY_AMENDMENT',
      resourceType: declaration.committedPromotionId ? 'OFFICER_PROMOTION' : 'SOLDIER_SERVICE_RECORD',
      resourceId: (declaration.committedPromotionId ?? declaration.committedServiceRecordId)!,
      newValue: JSON.stringify(patchData),
      result: 'SUCCESS',
    })
  })
}

export async function submitAmendment(amendmentId: string, actorId: string) {
  const amendment = await findAmendmentById(amendmentId)
  if (!amendment) throw new Error('NOT_FOUND')
  if (amendment.amendmentStatus !== 'DRAFT') throw new Error('AMENDMENT_NOT_DRAFT')

  return updateAmendment(amendmentId, { amendmentStatus: 'SUBMITTED' })
}
