/**
 * Cron: Cảnh báo niên hạn thăng quân hàm
 * POST /api/cron/promotion-deadline-alert
 *
 * Hàng ngày 06:00 — quét tất cả sĩ quan và quân nhân, tính hạn thăng quân hàm,
 * gửi cảnh báo IN_APP cho:
 *   OVERDUE/CRITICAL (≤30 ngày): chỉ huy đơn vị + trưởng cơ quan quản lý
 *   WARNING (≤90 ngày): chỉ huy đơn vị + trưởng cơ quan quản lý
 *
 * Cron schedule: 0 6 * * *
 * De-dup: không gửi lại nếu đã gửi cùng personnelId + eventType trong 7 ngày.
 *
 * Sentinel WorkflowInstance: entityType=SYSTEM_PROMOTION_ALERT, entityId=singleton
 */

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { verifyCronSecret } from '@/lib/cron/verify-cron-secret'
import { WorkflowNotificationService } from '@/lib/services/workflow/workflow-notification.service'
import {
  calcPromotionDeadline,
  OFFICER_RANK_LABELS,
  SOLDIER_RANK_LABELS,
} from '@/lib/promotion/promotionUtils'

export const dynamic = 'force-dynamic'

const DEDUP_DAYS = 7
const SENTINEL_ENTITY_TYPE = 'SYSTEM_PROMOTION_ALERT'
const SENTINEL_ENTITY_ID   = 'singleton'

const WF_EVENT_CRITICAL = 'PROMOTION_DEADLINE_CRITICAL'
const WF_EVENT_WARNING  = 'PROMOTION_DEADLINE_WARNING'

// ─── Resolve sentinel WorkflowInstance ───────────────────────────────────────

async function getSentinelInstanceId(): Promise<string> {
  const existing = await prisma.workflowInstance.findFirst({
    where: { entityType: SENTINEL_ENTITY_TYPE, entityId: SENTINEL_ENTITY_ID },
    select: { id: true },
  })
  if (existing) return existing.id

  // Create sentinel (only needed once; idempotent)
  const def = await prisma.workflowDefinition.findFirst({ select: { id: true } })
  const created = await prisma.workflowInstance.create({
    data: {
      definitionId: def?.id ?? '',
      entityType: SENTINEL_ENTITY_TYPE,
      entityId: SENTINEL_ENTITY_ID,
      status: 'IN_PROGRESS',
      title: 'Hệ thống cảnh báo niên hạn quân hàm',
      initiatorId: 'system',
    },
  })
  return created.id
}

// ─── De-dup check ─────────────────────────────────────────────────────────────

async function wasNotifiedRecently(
  personnelId: string,
  eventType: string,
): Promise<boolean> {
  const since = new Date(Date.now() - DEDUP_DAYS * 24 * 60 * 60 * 1000)
  const count = await prisma.workflowNotification.count({
    where: {
      eventType,
      createdAt: { gte: since },
      // payloadJson contains personnelId — use raw query for JSON filter
    },
  })
  // Approximation: if any notifications of this type were sent in window, check payload
  if (count === 0) return false

  const rows = await prisma.$queryRaw<{ id: string }[]>`
    SELECT id FROM wf_notifications
    WHERE event_type = ${eventType}
      AND created_at >= ${since}
      AND payload_json->>'personnelId' = ${personnelId}
    LIMIT 1
  `
  return rows.length > 0
}

// ─── Notify recipients ────────────────────────────────────────────────────────

async function notifyRecipients(
  sentinelId: string,
  personnelId: string,
  fullName: string,
  rankLabel: string,
  nextRankLabel: string | null,
  daysUntil: number | null,
  status: string,
  commanderId: string | null,
  managingOrganHeads: string[],
  eventType: string,
) {
  const isOverdue = status === 'OVERDUE'
  const title = isOverdue
    ? `Quá hạn thăng quân hàm: ${fullName}`
    : `Cảnh báo thăng quân hàm: ${fullName}`

  const dayText = isOverdue
    ? `đã quá hạn ${Math.abs(daysUntil ?? 0)} ngày`
    : `còn ${daysUntil} ngày`

  const message = `${fullName} (${rankLabel})${nextRankLabel ? ` → ${nextRankLabel}` : ''}: ${dayText}.`

  const payload = { personnelId, rankLabel, nextRankLabel, daysUntil, status }

  const recipientIds = [
    ...managingOrganHeads,
    ...(commanderId ? [commanderId] : []),
  ].filter(Boolean)

  for (const recipientId of [...new Set(recipientIds)]) {
    await WorkflowNotificationService.send({
      workflowInstanceId: sentinelId,
      recipientId,
      eventType: eventType as any,
      title,
      message,
      payloadJson: payload,
    })
  }
}

// ─── Resolve managing organ heads ─────────────────────────────────────────────

async function resolveOrganHeads(managingOrgan: string | null): Promise<string[]> {
  if (!managingOrgan) return []

  const positionCode =
    managingOrgan === 'BAN_QUAN_LUC' ? 'TRUONG_BAN_QUAN_LUC' : 'TRUONG_BAN_CAN_BO'

  const positions = await prisma.userPosition.findMany({
    where: {
      position: { code: positionCode },
      isActive: true,
    },
    select: { userId: true },
  })
  return positions.map((p) => p.userId)
}

// ─── Main handler ─────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const sentinelId = await getSentinelInstanceId()
  let notified = 0
  let skipped = 0

  // ── Officers ─────────────────────────────────────────────────────────────
  const officers = await prisma.officerCareer.findMany({
    include: {
      personnel: {
        select: {
          id: true,
          fullName: true,
          dateOfBirth: true,
          managingOrgan: true,
          unit: { select: { commanderId: true } },
        },
      },
      promotions: {
        where: { promotionType: 'THANG_CAP' },
        orderBy: { effectiveDate: 'desc' },
        take: 1,
      },
      specialCases: { where: { isActive: true }, select: { reductionMonths: true } },
    },
  })

  for (const o of officers) {
    const lastRankDate =
      o.lastRankDate ?? o.promotions[0]?.effectiveDate ?? o.commissionedDate ?? null

    const totalReduction = o.specialCases.reduce((s, sc) => s + sc.reductionMonths, 0)
    const deadline = calcPromotionDeadline(
      o.currentRank,
      lastRankDate,
      totalReduction,
      o.personnel.dateOfBirth,
      'OFFICER',
    )

    const status = deadline.status
    if (status !== 'OVERDUE' && status !== 'CRITICAL' && status !== 'WARNING') continue

    const eventType = status === 'WARNING' ? WF_EVENT_WARNING : WF_EVENT_CRITICAL
    if (await wasNotifiedRecently(o.personnel.id, eventType)) {
      skipped++
      continue
    }

    const rankLabel =
      OFFICER_RANK_LABELS[o.currentRank as keyof typeof OFFICER_RANK_LABELS] ?? String(o.currentRank)
    const nextRankLabel =
      deadline.nextRank
        ? (OFFICER_RANK_LABELS[deadline.nextRank as keyof typeof OFFICER_RANK_LABELS] ?? deadline.nextRank)
        : null

    const organHeads = await resolveOrganHeads(o.personnel.managingOrgan)
    await notifyRecipients(
      sentinelId,
      o.personnel.id,
      o.personnel.fullName,
      rankLabel,
      nextRankLabel,
      deadline.daysUntilEligible,
      status,
      o.personnel.unit?.commanderId ?? null,
      organHeads,
      eventType,
    )
    notified++
  }

  // ── Soldiers ──────────────────────────────────────────────────────────────
  const soldiers = await prisma.soldierProfile.findMany({
    include: {
      personnel: {
        select: {
          id: true,
          fullName: true,
          dateOfBirth: true,
          managingOrgan: true,
          unit: { select: { commanderId: true } },
        },
      },
      specialCases: { where: { isActive: true }, select: { reductionMonths: true } },
    },
  })

  for (const s of soldiers) {
    const lastRankDate = s.lastRankDate ?? s.enlistmentDate ?? null
    const totalReduction = s.specialCases.reduce((sum, sc) => sum + sc.reductionMonths, 0)
    const deadline = calcPromotionDeadline(s.currentRank, lastRankDate, totalReduction, s.personnel.dateOfBirth, 'SOLDIER')

    const status = deadline.status
    if (status !== 'OVERDUE' && status !== 'CRITICAL' && status !== 'WARNING') continue

    const eventType = status === 'WARNING' ? WF_EVENT_WARNING : WF_EVENT_CRITICAL
    if (await wasNotifiedRecently(s.personnel.id, eventType)) {
      skipped++
      continue
    }

    const rankLabel = SOLDIER_RANK_LABELS[s.currentRank as keyof typeof SOLDIER_RANK_LABELS] ?? String(s.currentRank)
    const nextRankLabel =
      deadline.nextRank
        ? (SOLDIER_RANK_LABELS[deadline.nextRank as keyof typeof SOLDIER_RANK_LABELS] ?? deadline.nextRank)
        : null

    const organHeads = await resolveOrganHeads(s.personnel.managingOrgan)
    await notifyRecipients(
      sentinelId,
      s.personnel.id,
      s.personnel.fullName,
      rankLabel,
      nextRankLabel,
      deadline.daysUntilEligible,
      status,
      s.personnel.unit?.commanderId ?? null,
      organHeads,
      eventType,
    )
    notified++
  }

  return NextResponse.json({
    success: true,
    summary: { notified, skipped, total: notified + skipped },
  })
}
