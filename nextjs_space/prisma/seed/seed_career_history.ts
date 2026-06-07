/**
 * Seed CareerHistory (Quá trình công tác) — dữ liệu demo cho trang cá nhân
 * /dashboard/personal/my-career và file xuất "Bản quá trình công tác".
 *
 * Sinh một dòng thời gian hợp lý cho mỗi cán bộ có chức vụ đang hiệu lực: nhập ngũ →
 * đào tạo → bổ nhiệm → các lần thăng quân hàm theo thang bậc → điều động → bổ nhiệm
 * chức vụ hiện tại → khen thưởng. Sự kiện cuối khớp với chức vụ/đơn vị/cấp bậc hiện
 * tại để timeline thống nhất với thẻ tóm tắt.
 *
 * Idempotent: bỏ qua user đã có CareerHistory (không trùng lặp khi chạy lại).
 *
 * Run: npx tsx --require dotenv/config prisma/seed/seed_career_history.ts
 */

import { PrismaClient, CareerEventType, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

// Thang quân hàm sĩ quan (tăng dần) — dùng để dựng các lần thăng cấp.
const OFFICER_LADDER = [
  'Thiếu úy', 'Trung úy', 'Thượng úy', 'Đại úy',
  'Thiếu tá', 'Trung tá', 'Thượng tá', 'Đại tá',
  'Thiếu tướng', 'Trung tướng', 'Thượng tướng', 'Đại tướng',
];
// Thang quân hàm hạ sĩ quan/chiến sĩ.
const NCO_LADDER = ['Binh nhì', 'Binh nhất', 'Hạ sĩ', 'Trung sĩ', 'Thượng sĩ'];

const TRAINING_SCHOOLS = [
  'Trường Sĩ quan Lục quân 1',
  'Học viện Hậu cần',
  'Học viện Quốc phòng',
  'Trường Sĩ quan Chính trị',
];
const AWARD_TITLES = [
  'Bằng khen của Bộ trưởng Bộ Quốc phòng',
  'Chiến sĩ thi đua cấp cơ sở',
  'Huân chương Chiến công hạng Ba',
  'Giấy khen của Giám đốc Học viện',
];

function pick<T>(arr: T[], i: number): T {
  return arr[i % arr.length];
}

/** Định vị cấp bậc trong thang phù hợp. */
function locateRank(rank: string | null): { ladder: string[]; index: number } | null {
  if (!rank) return null;
  const clean = rank.replace(/\s*CN$/i, '').trim(); // "Trung tá CN" → "Trung tá"
  const oIdx = OFFICER_LADDER.indexOf(clean);
  if (oIdx >= 0) return { ladder: OFFICER_LADDER, index: oIdx };
  const nIdx = NCO_LADDER.indexOf(clean);
  if (nIdx >= 0) return { ladder: NCO_LADDER, index: nIdx };
  return null;
}

interface SelectedUser {
  id: string;
  name: string;
  rank: string | null;
  enlistmentDate: Date | null;
  position: string | null;
  unit: string | null;
}

/** Một sự kiện công tác ở dạng "milestone" trước khi gán mốc thời gian. */
type Milestone = Omit<Prisma.CareerHistoryCreateManyInput, 'userId' | 'eventDate' | 'decisionDate'> & {
  decisionSeq?: number;
};

/** Dựng chuỗi milestone theo thứ tự thời gian cho 1 cán bộ. */
function buildMilestones(user: SelectedUser, seqStart: number): Milestone[] {
  const milestones: Milestone[] = [];
  let seq = seqStart;
  const located = locateRank(user.rank);
  const isOfficer = located?.ladder === OFFICER_LADDER;
  const currentUnit = user.unit ?? 'Học viện Hậu cần';
  const currentPosition = user.position ?? 'Trợ lý';

  // 1) Nhập ngũ
  milestones.push({
    eventType: CareerEventType.ENLISTMENT,
    title: 'Nhập ngũ',
    newUnit: isOfficer ? pick(TRAINING_SCHOOLS, seq) : currentUnit,
    reason: 'Tuyển chọn, gọi nhập ngũ phục vụ Quân đội',
    notes: 'Bắt đầu quá trình phục vụ trong Quân đội nhân dân Việt Nam.',
  });

  // 2) Đào tạo (sĩ quan)
  if (isOfficer) {
    milestones.push({
      eventType: CareerEventType.TRAINING,
      title: 'Đào tạo cơ bản',
      trainingName: 'Đào tạo sĩ quan chỉ huy tham mưu cấp phân đội',
      trainingInstitution: pick(TRAINING_SCHOOLS, seq),
      trainingResult: pick(['Giỏi', 'Khá', 'Xuất sắc'], seq),
      certificateNumber: `BC-${1000 + seq}`,
    });
  }

  // 3) Bổ nhiệm chức vụ đầu tiên
  const firstPositions = ['Trung đội trưởng', 'Phân đội trưởng', 'Trợ lý', 'Giáo viên'];
  milestones.push({
    eventType: CareerEventType.APPOINTMENT,
    title: 'Bổ nhiệm chức vụ',
    newPosition: pick(firstPositions, seq),
    newUnit: currentUnit,
    decisionAuthority: 'Giám đốc Học viện Hậu cần',
    decisionNumber: `${seq++}/QĐ-HVHC`,
    decisionSeq: 1,
  });

  // 4) Các lần thăng quân hàm theo thang bậc (tối đa 4 bước gần nhất)
  if (located) {
    const { ladder, index } = located;
    const start = Math.max(1, index - 4);
    for (let i = start; i <= index; i++) {
      milestones.push({
        eventType: CareerEventType.PROMOTION,
        title: `Thăng quân hàm ${ladder[i]}`,
        oldRank: ladder[i - 1],
        newRank: ladder[i],
        decisionAuthority: i >= 8 ? 'Chủ tịch nước' : 'Bộ Quốc phòng',
        decisionNumber: `${seq++}/QĐ-BQP`,
      });
    }
  }

  // 5) Điều động (giữa chặng) — chỉ với sĩ quan để timeline phong phú
  if (isOfficer) {
    milestones.push({
      eventType: CareerEventType.TRANSFER,
      title: 'Điều động công tác',
      oldUnit: pick(TRAINING_SCHOOLS, seq),
      newUnit: currentUnit,
      reason: 'Điều động theo yêu cầu nhiệm vụ',
      decisionAuthority: 'Giám đốc Học viện Hậu cần',
      decisionNumber: `${seq++}/QĐ-HVHC`,
    });
  }

  // 6) Bổ nhiệm chức vụ hiện tại (khớp dữ liệu hiện hành)
  milestones.push({
    eventType: CareerEventType.APPOINTMENT,
    title: 'Bổ nhiệm chức vụ hiện tại',
    newPosition: currentPosition,
    newUnit: currentUnit,
    decisionAuthority: 'Giám đốc Học viện Hậu cần',
    decisionNumber: `${seq++}/QĐ-HVHC`,
    signerName: 'Trung tướng Nguyễn Văn T',
    signerPosition: 'Giám đốc Học viện',
  });

  // 7) Khen thưởng
  milestones.push({
    eventType: CareerEventType.AWARD,
    title: pick(AWARD_TITLES, seq),
    reason: 'Hoàn thành xuất sắc nhiệm vụ',
    decisionAuthority: 'Bộ Quốc phòng',
    decisionNumber: `${seq++}/QĐ-KT`,
  });

  return milestones;
}

/** Gán mốc thời gian tăng dần cho chuỗi milestone, trải đều theo cả quá trình. */
function assignDates(
  user: SelectedUser,
  milestones: Milestone[],
): Prisma.CareerHistoryCreateManyInput[] {
  const now = new Date();
  const recent = new Date(now.getFullYear() - 1, 5, 1); // ~1 năm trước (timeline không tới tương lai)
  const enlist = user.enlistmentDate
    ? new Date(user.enlistmentDate)
    : new Date(now.getFullYear() - (milestones.length * 3 + 4), 8, 5);

  const span = Math.max(recent.getTime() - enlist.getTime(), milestones.length * 365 * 24 * 3600 * 1000);
  const gap = span / Math.max(milestones.length - 1, 1);

  return milestones.map((m, i) => {
    const eventDate = i === 0 ? enlist : new Date(enlist.getTime() + i * gap);
    const decisionDate = m.decisionNumber ? new Date(eventDate.getTime() - 7 * 24 * 3600 * 1000) : null;
    // Đào tạo: endDate = +4 năm; sự kiện khác không có endDate.
    const endDate =
      m.eventType === CareerEventType.TRAINING
        ? new Date(eventDate.getFullYear() + 4, 5, 30)
        : null;
    const { decisionSeq: _omit, ...rest } = m;
    return {
      ...rest,
      userId: user.id,
      eventDate,
      effectiveDate: eventDate,
      endDate,
      decisionDate,
    };
  });
}

async function main() {
  console.log('🎖️  Seeding CareerHistory (quá trình công tác demo)...');

  const users = (await prisma.user.findMany({
    where: { userPositions: { some: { isActive: true } } },
    select: {
      id: true,
      name: true,
      rank: true,
      enlistmentDate: true,
      unitRelation: { select: { name: true } },
      userPositions: {
        where: { isActive: true },
        orderBy: { startDate: 'desc' },
        take: 1,
        select: { position: { select: { name: true } }, unit: { select: { name: true } } },
      },
    },
  })).map<SelectedUser>((u) => ({
    id: u.id,
    name: u.name,
    rank: u.rank,
    enlistmentDate: u.enlistmentDate,
    position: u.userPositions[0]?.position?.name ?? null,
    unit: u.userPositions[0]?.unit?.name ?? u.unitRelation?.name ?? null,
  }));

  console.log(`   Tìm thấy ${users.length} cán bộ có chức vụ đang hiệu lực.`);

  // Idempotent: bỏ qua user đã có CareerHistory.
  const existing = await prisma.careerHistory.groupBy({
    by: ['userId'],
    where: { userId: { in: users.map((u) => u.id) } },
  });
  const seeded = new Set(existing.map((e) => e.userId));

  let created = 0;
  let skipped = 0;
  let seq = 100;

  for (const user of users) {
    if (seeded.has(user.id)) {
      skipped++;
      continue;
    }
    const milestones = buildMilestones(user, seq);
    seq += milestones.length + 2;
    const rows = assignDates(user, milestones);
    await prisma.careerHistory.createMany({ data: rows });
    created += rows.length;
  }

  console.log(`   ✓ Đã tạo ${created} sự kiện cho ${users.length - skipped} cán bộ (bỏ qua ${skipped} đã có).`);
  console.log('✅ Hoàn thành seed CareerHistory.');
}

main()
  .catch((e) => {
    console.error('❌ Seed CareerHistory error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
