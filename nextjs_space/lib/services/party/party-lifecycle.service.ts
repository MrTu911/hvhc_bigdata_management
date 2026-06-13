import type { PartyMember, PartyMemberStatus, Prisma } from '@prisma/client';
// Bản đồ transition là source of truth dùng chung với UI (xem party.labels.ts).
import { PARTY_LIFECYCLE_TRANSITIONS } from '@/lib/constants/party.labels';

const PROBATION_MONTHS = 12;
const DUE_SOON_DAYS = 30;

export function assertPartyLifecycleTransition(from: PartyMemberStatus, to: PartyMemberStatus) {
  if (from === to) return;
  const allowed = PARTY_LIFECYCLE_TRANSITIONS[from] ?? [];
  if (!allowed.includes(to)) {
    throw new Error(`Transition không hợp lệ: ${from} -> ${to}`);
  }
}

export function computeProbationDueDate(joinDate: Date): Date {
  const due = new Date(joinDate);
  due.setMonth(due.getMonth() + PROBATION_MONTHS);
  return due;
}

function daysBetween(a: Date, b: Date): number {
  const oneDay = 24 * 60 * 60 * 1000;
  return Math.floor((b.getTime() - a.getTime()) / oneDay);
}

export async function createLifecycleTransitionTrail(
  tx: Prisma.TransactionClient,
  payload: {
    partyMemberId: string;
    fromStatus: PartyMemberStatus;
    toStatus: PartyMemberStatus;
    actorId?: string | null;
    reason?: string | null;
    joinDate?: Date | null;
    officialDate?: Date | null;
  },
) {
  const now = new Date();

  await tx.partyLifecycleEvent.create({
    data: {
      partyMemberId: payload.partyMemberId,
      eventType: 'STATUS_TRANSITION',
      fromStatus: payload.fromStatus,
      toStatus: payload.toStatus,
      eventDate: now,
      note: payload.reason ?? null,
      triggeredBy: payload.actorId ?? null,
      metadata: {
        joinDate: payload.joinDate ?? null,
        officialDate: payload.officialDate ?? null,
      },
    },
  });

  if (payload.toStatus === 'DU_BI' && payload.joinDate) {
    const dueDate = computeProbationDueDate(payload.joinDate);
    await tx.partyLifecycleEvent.create({
      data: {
        partyMemberId: payload.partyMemberId,
        eventType: 'DEADLINE_COMPUTED',
        fromStatus: payload.fromStatus,
        toStatus: payload.toStatus,
        eventDate: now,
        dueDate,
        note: 'Auto-compute hạn chuyển chính thức 12 tháng (DU_BI)',
        triggeredBy: payload.actorId ?? null,
      },
    });

    const daysToDue = daysBetween(now, dueDate);
    if (daysToDue <= DUE_SOON_DAYS && daysToDue >= 0) {
      await tx.partyLifecycleAlert.upsert({
        where: {
          partyMemberId_alertType_dueDate: {
            partyMemberId: payload.partyMemberId,
            alertType: 'DU_BI_DUE_SOON',
            dueDate,
          },
        },
        update: {
          daysToDue,
          status: 'ACTIVE',
          message: `Đảng viên dự bị còn ${daysToDue} ngày đến hạn chuyển chính thức`,
          metadata: { generatedAt: now.toISOString() },
        },
        create: {
          partyMemberId: payload.partyMemberId,
          alertType: 'DU_BI_DUE_SOON',
          dueDate,
          daysToDue,
          message: `Đảng viên dự bị còn ${daysToDue} ngày đến hạn chuyển chính thức`,
          metadata: { generatedAt: now.toISOString() },
        },
      });
    }
  }

  if (payload.toStatus === 'CHINH_THUC') {
    await tx.partyLifecycleAlert.updateMany({
      where: {
        partyMemberId: payload.partyMemberId,
        status: 'ACTIVE',
      },
      data: {
        status: 'RESOLVED',
        resolvedAt: now,
        resolvedBy: payload.actorId ?? null,
      },
    });

    await tx.partyLifecycleEvent.create({
      data: {
        partyMemberId: payload.partyMemberId,
        eventType: 'DEADLINE_RESOLVED',
        fromStatus: payload.fromStatus,
        toStatus: payload.toStatus,
        eventDate: now,
        note: 'Đã chuyển chính thức, đóng các cảnh báo dự bị',
        triggeredBy: payload.actorId ?? null,
      },
    });
  }
}

export async function runProbationDeadlineAutomation(
  tx: Prisma.TransactionClient,
  actorId = 'SYSTEM',
) {
  const now = new Date();
  const probationMembers = await tx.partyMember.findMany({
    where: {
      deletedAt: null,
      status: 'DU_BI',
      joinDate: { not: null },
    },
    select: {
      id: true,
      joinDate: true,
      status: true,
    },
  });

  let dueSoon = 0;
  let overdue = 0;

  for (const member of probationMembers) {
    if (!member.joinDate) continue;
    const dueDate = computeProbationDueDate(member.joinDate);
    const daysToDue = daysBetween(now, dueDate);

    if (daysToDue >= 0 && daysToDue <= DUE_SOON_DAYS) {
      dueSoon += 1;
      await tx.partyLifecycleAlert.upsert({
        where: {
          partyMemberId_alertType_dueDate: {
            partyMemberId: member.id,
            alertType: 'DU_BI_DUE_SOON',
            dueDate,
          },
        },
        update: {
          daysToDue,
          status: 'ACTIVE',
          message: `Đảng viên dự bị còn ${daysToDue} ngày đến hạn chuyển chính thức`,
          metadata: { generatedAt: now.toISOString() },
        },
        create: {
          partyMemberId: member.id,
          alertType: 'DU_BI_DUE_SOON',
          dueDate,
          daysToDue,
          status: 'ACTIVE',
          message: `Đảng viên dự bị còn ${daysToDue} ngày đến hạn chuyển chính thức`,
          metadata: { generatedAt: now.toISOString() },
        },
      });

      await tx.partyLifecycleEvent.create({
        data: {
          partyMemberId: member.id,
          eventType: 'DEADLINE_ALERT',
          fromStatus: member.status,
          toStatus: member.status,
          eventDate: now,
          dueDate,
          note: `Cảnh báo sắp đến hạn chuyển chính thức (${daysToDue} ngày)`,
          triggeredBy: actorId,
        },
      });
    }

    if (daysToDue < 0) {
      overdue += 1;
      await tx.partyLifecycleAlert.upsert({
        where: {
          partyMemberId_alertType_dueDate: {
            partyMemberId: member.id,
            alertType: 'DU_BI_OVERDUE',
            dueDate,
          },
        },
        update: {
          daysToDue,
          status: 'ACTIVE',
          message: `Đảng viên dự bị quá hạn chuyển chính thức ${Math.abs(daysToDue)} ngày`,
          metadata: { generatedAt: now.toISOString() },
        },
        create: {
          partyMemberId: member.id,
          alertType: 'DU_BI_OVERDUE',
          dueDate,
          daysToDue,
          status: 'ACTIVE',
          message: `Đảng viên dự bị quá hạn chuyển chính thức ${Math.abs(daysToDue)} ngày`,
          metadata: { generatedAt: now.toISOString() },
        },
      });

      await tx.partyLifecycleEvent.create({
        data: {
          partyMemberId: member.id,
          eventType: 'DEADLINE_OVERDUE',
          fromStatus: member.status,
          toStatus: member.status,
          eventDate: now,
          dueDate,
          note: `Quá hạn chuyển chính thức ${Math.abs(daysToDue)} ngày`,
          triggeredBy: actorId,
        },
      });
    }
  }

  return {
    scanned: probationMembers.length,
    dueSoon,
    overdue,
  };
}

export function shouldEnforceTransition(current: PartyMemberStatus, next: PartyMemberStatus) {
  return current !== next;
}

export type PartyLifecycleMemberSnapshot = Pick<PartyMember, 'id' | 'status' | 'joinDate' | 'officialDate'>;
