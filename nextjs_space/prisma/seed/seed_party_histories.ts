/**
 * Seed Script: Party Member Histories
 *
 * Mục tiêu:
 * - Tạo timeline Đảng cho PartyMember
 * - Bao gồm:
 *   + ADMITTED
 *   + OFFICIAL_CONFIRMED
 *   + APPOINTED (nếu có chức vụ)
 *   + TRANSFER_IN / TRANSFER_OUT (một phần demo)
 * - Chạy lại nhiều lần không bị trùng logic chính
 */

import {
  PrismaClient,
  PartyHistoryType,
  PartyPosition,
} from '@prisma/client';
import 'dotenv/config';

const prisma = new PrismaClient();

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

function buildDecisionNumber(prefix: string, seed: number): string {
  return `${prefix}-${String(1000 + seed)}`;
}

async function ensureHistory(params: {
  partyMemberId: string;
  organizationId?: string | null;
  historyType: PartyHistoryType;
  position?: PartyPosition | null;
  decisionNumber?: string | null;
  decisionDate?: Date | null;
  effectiveDate?: Date | null;
  fromOrganization?: string | null;
  toOrganization?: string | null;
  reason?: string | null;
  notes?: string | null;
}) {
  const existing = await prisma.partyMemberHistory.findFirst({
    where: {
      partyMemberId: params.partyMemberId,
      historyType: params.historyType,
      effectiveDate: params.effectiveDate ?? undefined,
    },
  });

  const payload = {
    partyMemberId: params.partyMemberId,
    organizationId: params.organizationId ?? null,
    historyType: params.historyType,
    position: params.position ?? null,
    decisionNumber: params.decisionNumber ?? null,
    decisionDate: params.decisionDate ?? null,
    effectiveDate: params.effectiveDate ?? null,
    fromOrganization: params.fromOrganization ?? null,
    toOrganization: params.toOrganization ?? null,
    reason: params.reason ?? null,
    notes: params.notes ?? null,
  };

  if (!existing) {
    await prisma.partyMemberHistory.create({ data: payload });
    return 'created';
  }

  await prisma.partyMemberHistory.update({
    where: { id: existing.id },
    data: payload,
  });
  return 'updated';
}

async function main() {
  console.log('📜 Seeding Party Member Histories...');

  const members = await prisma.partyMember.findMany({
    include: {
      organization: true,
      user: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  if (members.length === 0) {
    throw new Error('Chưa có PartyMember. Hãy chạy seed_party_members.ts trước.');
  }

  let created = 0;
  let updated = 0;

  for (let i = 0; i < members.length; i++) {
    const m = members[i];
    const seed = i + 1;

    if (m.joinDate) {
      const r1 = await ensureHistory({
        partyMemberId: m.id,
        organizationId: m.organizationId,
        historyType: 'ADMITTED',
        position: 'DANG_VIEN',
        decisionNumber: buildDecisionNumber('KN', seed),
        decisionDate: m.joinDate,
        effectiveDate: m.joinDate,
        toOrganization: m.organization?.name ?? null,
        notes: 'Kết nạp Đảng',
      });
      r1 === 'created' ? created++ : updated++;
    }

    if (m.officialDate) {
      const r2 = await ensureHistory({
        partyMemberId: m.id,
        organizationId: m.organizationId,
        historyType: 'OFFICIAL_CONFIRMED',
        position: 'DANG_VIEN',
        decisionNumber: buildDecisionNumber('CT', seed),
        decisionDate: m.officialDate,
        effectiveDate: m.officialDate,
        toOrganization: m.organization?.name ?? null,
        notes: 'Chuyển đảng viên chính thức',
      });
      r2 === 'created' ? created++ : updated++;
    }

    if (m.currentPosition && m.currentPosition !== 'DANG_VIEN') {
      const appointedDate = m.officialDate
        ? addMonths(m.officialDate, 12 + (seed % 18))
        : addMonths(m.joinDate ?? new Date(), 18);

      const r3 = await ensureHistory({
        partyMemberId: m.id,
        organizationId: m.organizationId,
        historyType: 'APPOINTED',
        position: m.currentPosition,
        decisionNumber: buildDecisionNumber('BN', seed),
        decisionDate: appointedDate,
        effectiveDate: appointedDate,
        toOrganization: m.organization?.name ?? null,
        notes: `Bổ nhiệm chức vụ Đảng: ${m.currentPosition}`,
      });
      r3 === 'created' ? created++ : updated++;
    }

    if (seed % 7 === 0 && m.organization?.name) {
      const transferDate = addMonths(m.officialDate ?? m.joinDate ?? new Date(), 24);

      const r4 = await ensureHistory({
        partyMemberId: m.id,
        organizationId: m.organizationId,
        historyType: 'TRANSFER_IN',
        position: m.currentPosition ?? 'DANG_VIEN',
        decisionNumber: buildDecisionNumber('CG', seed),
        decisionDate: transferDate,
        effectiveDate: transferDate,
        fromOrganization: 'Đơn vị cũ',
        toOrganization: m.organization.name,
        notes: 'Chuyển sinh hoạt Đảng đến đơn vị hiện tại',
      });
      r4 === 'created' ? created++ : updated++;
    }

    console.log(`✅ ${m.user.email} -> history seeded`);
  }

  const total = await prisma.partyMemberHistory.count();

  console.log('\n================ PARTY HISTORIES ================');
  console.log(`Created : ${created}`);
  console.log(`Updated : ${updated}`);
  console.log(`Total   : ${total}`);
  console.log('=================================================\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });