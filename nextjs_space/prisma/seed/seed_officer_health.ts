/**
 * Seed: Dữ liệu sức khỏe sĩ quan
 * Cập nhật healthCategory, healthNotes, lastHealthCheckDate cho tất cả OfficerCareer hiện có
 *
 * Chạy: npx tsx --require dotenv/config prisma/seed/seed_officer_health.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ── Dữ liệu mẫu phân phối thực tế ─────────────────────────────────────────────
// Loại 1: 45% — sức khỏe tốt, phù hợp hoàn toàn
// Loại 2: 30% — sức khỏe khá, đủ tiêu chuẩn
// Loại 3: 15% — sức khỏe trung bình, cần theo dõi
// Loại 4: 5%  — sức khỏe yếu, cần điều trị
// null:   5%  — chưa được kiểm tra định kỳ

const HEALTH_DISTRIBUTION: Array<{ category: string | null; weight: number }> = [
  { category: 'Loại 1', weight: 45 },
  { category: 'Loại 2', weight: 30 },
  { category: 'Loại 3', weight: 15 },
  { category: 'Loại 4', weight: 5  },
  { category: null,      weight: 5  },
];

const HEALTH_NOTES: Record<string, string[]> = {
  'Loại 1': [
    'Sức khỏe tốt, đủ điều kiện tham gia mọi hoạt động quân sự',
    'Thể lực vượt tiêu chuẩn, không có bệnh lý nền',
    'Kết quả kiểm tra đạt toàn diện, thị lực và thính lực tốt',
    'Đủ tiêu chuẩn sức khỏe bậc 1 theo quy định',
    'Không có vấn đề sức khỏe, cân nặng và huyết áp ổn định',
  ],
  'Loại 2': [
    'Sức khỏe đạt yêu cầu, huyết áp tăng nhẹ trong tầm kiểm soát',
    'Đủ điều kiện công tác, cần tái kiểm tra sau 6 tháng',
    'Một số chỉ số cận lâm sàng cần theo dõi định kỳ',
    'Thể lực đạt tiêu chuẩn, có tiền sử dị ứng nhẹ',
    'Đủ sức khỏe công tác, khuyến nghị tập thể dục thường xuyên',
  ],
  'Loại 3': [
    'Huyết áp cao độ 1, đang điều trị và kiểm soát tốt',
    'Đái tháo đường type 2, dùng thuốc theo phác đồ',
    'Thị lực giảm, đã đeo kính điều chỉnh',
    'Bệnh lý khớp gối mạn tính, hạn chế hoạt động thể chất nặng',
    'Suy giảm chức năng thận độ nhẹ, cần theo dõi 3 tháng/lần',
    'Loãng xương giai đoạn sớm, đang điều trị bổ sung canxi',
  ],
  'Loại 4': [
    'Bệnh tim mạch phức tạp, đang điều trị tích cực tại bệnh viện',
    'Ung thư giai đoạn sớm, đang trong quá trình điều trị',
    'Rối loạn tâm lý nghiêm trọng, cần nghỉ dưỡng và điều trị',
    'Chấn thương cột sống sau tai nạn, đang phục hồi chức năng',
    'Suy gan mạn tính, cần kiêng cữ và theo dõi chặt',
  ],
};

function pickCategory(): string | null {
  const rand = Math.random() * 100;
  let cumulative = 0;
  for (const { category, weight } of HEALTH_DISTRIBUTION) {
    cumulative += weight;
    if (rand < cumulative) return category;
  }
  return 'Loại 1';
}

function pickNote(category: string): string {
  const notes = HEALTH_NOTES[category] ?? [];
  return notes[Math.floor(Math.random() * notes.length)] ?? '';
}

function randomDateWithin(daysBack: number): Date {
  const now  = new Date();
  const past = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);
  return new Date(past.getTime() + Math.random() * (now.getTime() - past.getTime()));
}

async function main() {
  console.log('🏥  Seeding officer health data...\n');

  const officers = await prisma.officerCareer.findMany({
    select: { id: true, currentRank: true },
  });

  if (officers.length === 0) {
    console.log('⚠️  Không có OfficerCareer nào. Hãy chạy seed_officer_careers.ts trước.');
    return;
  }

  let updated = 0;
  let skipped = 0;

  for (const officer of officers) {
    const category = pickCategory();

    // Sĩ quan cấp cao (tướng) ưu tiên loại 1-2
    const isGeneral = ['DAI_TUONG', 'THUONG_TUONG', 'TRUNG_TUONG', 'THIEU_TUONG'].includes(
      officer.currentRank ?? '',
    );
    const adjustedCategory =
      isGeneral && (category === 'Loại 4' || category === null)
        ? 'Loại 2'
        : category;

    // 5% chưa được kiểm tra → không có ngày
    const wasChecked = adjustedCategory !== null;
    const lastHealthCheckDate = wasChecked
      ? randomDateWithin(365) // trong vòng 1 năm
      : null;

    const healthNotes = adjustedCategory ? pickNote(adjustedCategory) : null;

    await prisma.officerCareer.update({
      where: { id: officer.id },
      data: {
        healthCategory:      adjustedCategory,
        healthNotes,
        lastHealthCheckDate,
      },
    });

    updated++;

    if (updated % 20 === 0) {
      process.stdout.write(`  Đã cập nhật ${updated}/${officers.length}...\r`);
    }
  }

  console.log(`\n✅  Đã cập nhật sức khỏe cho ${updated} sĩ quan (bỏ qua: ${skipped})`);

  // Summary
  const grouped = await prisma.officerCareer.groupBy({
    by: ['healthCategory'],
    _count: { id: true },
    orderBy: { healthCategory: 'asc' },
  });

  console.log('\n📊  Phân bố sức khỏe:');
  for (const row of grouped) {
    const cat = row.healthCategory ?? 'Chưa kiểm tra';
    console.log(`   ${cat.padEnd(18)} : ${row._count.id}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
