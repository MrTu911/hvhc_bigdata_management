/**
 * Seed Script: Party Activities
 *
 * Mục tiêu:
 * - Tạo sinh hoạt Đảng / học tập / đánh giá cho PartyMember
 * - Chạy lại nhiều lần không bị phình dữ liệu không kiểm soát
 */

import {
  PrismaClient,
  PartyActivityType,
} from '@prisma/client';
import 'dotenv/config';

const prisma = new PrismaClient();

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function buildActivityDate(seed: number): Date {
  const base = new Date('2025-01-15');
  return addDays(base, seed * 15);
}

function buildActivityType(seed: number): PartyActivityType {
  const arr: PartyActivityType[] = [
    'MEETING',
    'STUDY',
    'VOLUNTEER',
    'EVALUATION',
    'CRITICISM',
    'OTHER',
  ];
  return arr[seed % arr.length];
}

function buildDescription(type: PartyActivityType, orgName?: string | null): string {
  switch (type) {
    case 'MEETING':
      return `Sinh hoạt chi bộ định kỳ tại ${orgName ?? 'đơn vị'}`;
    case 'STUDY':
      return 'Học tập nghị quyết và quán triệt nhiệm vụ chính trị';
    case 'VOLUNTEER':
      return 'Tham gia hoạt động tình nguyện, dân vận';
    case 'EVALUATION':
      return 'Đánh giá chất lượng đảng viên cuối năm';
    case 'CRITICISM':
      return 'Kiểm điểm, tự phê bình và phê bình';
    default:
      return 'Hoạt động Đảng khác';
  }
}

async function ensureActivity(params: {
  partyMemberId: string;
  activityType: PartyActivityType;
  activityDate: Date;
  description: string;
  location?: string | null;
  result?: string | null;
  evaluationYear?: number | null;
  evaluationGrade?: string | null;
  evaluationNotes?: string | null;
}) {
  const existing = await prisma.partyActivity.findFirst({
    where: {
      partyMemberId: params.partyMemberId,
      activityType: params.activityType,
      activityDate: params.activityDate,
    },
  });

  const payload = {
    partyMemberId: params.partyMemberId,
    activityType: params.activityType,
    activityDate: params.activityDate,
    description: params.description,
    location: params.location ?? null,
    result: params.result ?? null,
    evaluationYear: params.evaluationYear ?? null,
    evaluationGrade: params.evaluationGrade ?? null,
    evaluationNotes: params.evaluationNotes ?? null,
    attachmentUrl: null as string | null,
    deletedAt: null as Date | null,
  };

  if (!existing) {
    await prisma.partyActivity.create({ data: payload });
    return 'created';
  }

  await prisma.partyActivity.update({
    where: { id: existing.id },
    data: payload,
  });
  return 'updated';
}

async function main() {
  console.log('📚 Seeding Party Activities...');

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
    const activityCount = 3 + (i % 3);

    for (let j = 0; j < activityCount; j++) {
      const seed = i * 10 + j;
      const activityType = buildActivityType(seed);
      const activityDate = buildActivityDate(seed);

      const result = activityType === 'EVALUATION'
        ? 'Hoàn thành tốt nhiệm vụ'
        : activityType === 'VOLUNTEER'
        ? 'Tham gia đầy đủ'
        : 'Đạt yêu cầu';

      const evaluationYear = activityType === 'EVALUATION' ? 2025 : null;
      const evaluationGrade = activityType === 'EVALUATION' ? 'Hoàn thành tốt' : null;
      const evaluationNotes = activityType === 'EVALUATION'
        ? 'Chấp hành tốt kỷ luật, tích cực tham gia sinh hoạt Đảng'
        : null;

      const state = await ensureActivity({
        partyMemberId: m.id,
        activityType,
        activityDate,
        description: buildDescription(activityType, m.organization?.name),
        location: m.organization?.name ?? 'Học viện Hậu cần',
        result,
        evaluationYear,
        evaluationGrade,
        evaluationNotes,
      });

      state === 'created' ? created++ : updated++;
    }

    console.log(`✅ ${m.user.email} -> ${activityCount} activities`);
  }

  const total = await prisma.partyActivity.count();

  console.log('\n================ PARTY ACTIVITIES ================');
  console.log(`Created : ${created}`);
  console.log(`Updated : ${updated}`);
  console.log(`Total   : ${total}`);
  console.log('==================================================\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });