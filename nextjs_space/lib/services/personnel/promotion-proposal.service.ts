import 'server-only'
import { logAudit } from '@/lib/audit'
import { PROMOTION } from '@/lib/rbac/function-codes'
import { WorkflowNotificationService, WF_EVENT } from '@/lib/services/workflow/workflow-notification.service'
import {
  createProposal,
  findProposalById,
  listProposals,
  updateProposal,
  type ProposalCreateData,
} from '@/lib/repositories/personnel/promotion-proposal.repo'
import {
  calcPromotionDeadline,
  OFFICER_RANK_LABELS,
  SOLDIER_RANK_LABELS,
} from '@/lib/promotion/promotionUtils'
import db from '@/lib/db'

export async function createPromotionProposal(
  data: ProposalCreateData,
  actorId: string,
) {
  const proposal = await createProposal(data)

  await logAudit({
    userId: actorId,
    functionCode: PROMOTION.CREATE_PROPOSAL,
    action: 'CREATE',
    resourceType: 'PROMOTION_PROPOSAL',
    resourceId: proposal.id,
    newValue: JSON.stringify({ personnelId: data.personnelId, proposedRank: data.proposedRank }),
    result: 'SUCCESS',
  })

  return proposal
}

export async function listPromotionProposals(filter: Parameters<typeof listProposals>[0]) {
  return listProposals(filter)
}

export async function getProposal(id: string) {
  const proposal = await findProposalById(id)
  if (!proposal) throw new Error('NOT_FOUND')
  return proposal
}

export async function submitProposal(id: string, actorId: string) {
  const proposal = await findProposalById(id)
  if (!proposal) throw new Error('NOT_FOUND')
  if (proposal.status !== 'DRAFT') throw new Error('NOT_DRAFT')

  const updated = await updateProposal(id, { status: 'SUBMITTED' })

  // Notify managing organ staff
  const managingOrgan = proposal.personnel.managingOrgan
  if (managingOrgan) {
    const positionCode = managingOrgan === 'BAN_QUAN_LUC' ? 'TRUONG_BAN_QUAN_LUC' : 'TRUONG_BAN_CAN_BO'
    const positions = await db.userPosition.findMany({
      where: { position: { code: positionCode }, isActive: true },
      select: { userId: true },
    })

    const sentinelInstance = await db.workflowInstance.findFirst({
      where: { entityType: 'SYSTEM_PROMOTION_ALERT', entityId: 'singleton' },
      select: { id: true },
    })

    if (sentinelInstance) {
      for (const p of positions) {
        await WorkflowNotificationService.send({
          workflowInstanceId: sentinelInstance.id,
          recipientId: p.userId,
          eventType: WF_EVENT.NEW_TASK,
          title: `Đề nghị thăng quân hàm: ${proposal.personnel.fullName}`,
          message: `${proposal.proposingUnit.name} đề nghị thăng quân hàm ${proposal.proposedRank} cho ${proposal.personnel.fullName}.`,
          payloadJson: { proposalId: id, personnelId: proposal.personnelId },
        })
      }
    }
  }

  await logAudit({
    userId: actorId,
    functionCode: PROMOTION.CREATE_PROPOSAL,
    action: 'SUBMIT',
    resourceType: 'PROMOTION_PROPOSAL',
    resourceId: id,
    result: 'SUCCESS',
  })

  return updated
}

export async function respondToProposal(
  id: string,
  action: 'ACKNOWLEDGE' | 'APPROVE' | 'REJECT',
  responseNote: string | undefined,
  actorId: string,
) {
  const proposal = await findProposalById(id)
  if (!proposal) throw new Error('NOT_FOUND')
  if (proposal.status !== 'SUBMITTED') throw new Error('INVALID_STATUS')

  const newStatus =
    action === 'ACKNOWLEDGE' ? 'ACKNOWLEDGED' :
    action === 'APPROVE'     ? 'APPROVED' : 'REJECTED'

  const updated = await updateProposal(id, {
    status: newStatus,
    respondedAt: new Date(),
    respondedBy: actorId,
    responseNote: responseNote ?? null,
  })

  // If APPROVED — notify the personnel to create a declaration
  if (action === 'APPROVE') {
    const personnel = proposal.personnel as any
    // Find user account linked to this personnel
    const userAccount = await db.user.findFirst({
      where: { personnelId: personnel.id },
      select: { id: true },
    })

    if (userAccount) {
      const sentinelInstance = await db.workflowInstance.findFirst({
        where: { entityType: 'SYSTEM_PROMOTION_ALERT', entityId: 'singleton' },
        select: { id: true },
      })
      if (sentinelInstance) {
        await WorkflowNotificationService.send({
          workflowInstanceId: sentinelInstance.id,
          recipientId: userAccount.id,
          eventType: WF_EVENT.APPROVED,
          title: 'Đề nghị thăng quân hàm được chấp thuận',
          message: `Đề nghị thăng quân hàm ${proposal.proposedRank} của bạn đã được chấp thuận. Vui lòng tạo bản khai quân hàm để hoàn tất thủ tục.`,
          payloadJson: { proposalId: id, createDeclarationUrl: '/dashboard/personnel/rank-declarations/create' },
        })
      }
    }
  }

  await logAudit({
    userId: actorId,
    functionCode: PROMOTION.APPROVE_PROPOSAL,
    action,
    resourceType: 'PROMOTION_PROPOSAL',
    resourceId: id,
    newValue: responseNote ? JSON.stringify({ responseNote }) : undefined,
    result: 'SUCCESS',
  })

  return updated
}

export async function buildEligibilitySnapshot(personnelId: string) {
  const officerCareer = await db.officerCareer.findUnique({
    where: { personnelId },
    include: {
      promotions: { where: { promotionType: 'THANG_CAP' }, orderBy: { effectiveDate: 'desc' }, take: 1 },
      specialCases: { where: { isActive: true }, select: { reductionMonths: true } },
      personnel: { select: { dateOfBirth: true } },
    },
  })

  if (officerCareer) {
    const lastRankDate = officerCareer.lastRankDate ?? officerCareer.promotions[0]?.effectiveDate ?? officerCareer.commissionedDate ?? null
    const totalReduction = officerCareer.specialCases.reduce((s, sc) => s + sc.reductionMonths, 0)
    return {
      rankType: 'OFFICER',
      ...calcPromotionDeadline(officerCareer.currentRank, lastRankDate, totalReduction, officerCareer.personnel.dateOfBirth, 'OFFICER'),
    }
  }

  const soldierProfile = await db.soldierProfile.findUnique({
    where: { personnelId },
    include: {
      specialCases: { where: { isActive: true }, select: { reductionMonths: true } },
      personnel: { select: { dateOfBirth: true } },
    },
  })

  if (soldierProfile) {
    const lastRankDate = soldierProfile.lastRankDate ?? soldierProfile.enlistmentDate ?? null
    const totalReduction = soldierProfile.specialCases.reduce((s, sc) => s + sc.reductionMonths, 0)
    return {
      rankType: 'SOLDIER',
      ...calcPromotionDeadline(soldierProfile.currentRank, lastRankDate, totalReduction, soldierProfile.personnel.dateOfBirth, 'SOLDIER'),
    }
  }

  return null
}
