/**
 * Seed Script: Party Member Evaluations - Đánh giá phân loại đảng viên
 *
 * Mục tiêu:
 * - Phân bổ lại kết quả đánh giá theo tỷ lệ thực tế học viện quân sự:
 *     XUAT_SAC           : ~3%  (cá nhân xuất sắc đặc biệt)
 *     HOAN_THANH_XUAT_SAC: ~22% (hoàn thành xuất sắc)
 *     HOAN_THANH_TOT     : ~52% (đa số đảng viên)
 *     HOAN_THANH         : ~20% (hoàn thành đủ tiêu chí)
 *     KHONG_HOAN_THANH   : ~3%  (vi phạm kỷ luật)
 * - Cập nhật evaluationNotes đa dạng, chi tiết, đúng văn phong
 * - Thêm đánh giá cho năm 2021 (lịch sử)
 */

import { PrismaClient } from '@prisma/client';
import 'dotenv/config';

const prisma = new PrismaClient();

// Realistic grade distribution for 209 members
// Total = 209
const DISTRIBUTION: Record<string, number> = {
  XUAT_SAC:            6,   // ~3%
  HOAN_THANH_XUAT_SAC: 46,  // ~22%
  HOAN_THANH_TOT:      109, // ~52%
  HOAN_THANH:          42,  // ~20%
  KHONG_HOAN_THANH:    6,   // ~3%
};

const NOTES_BY_GRADE: Record<string, string[]> = {
  XUAT_SAC: [
    'Luôn đi đầu trong mọi nhiệm vụ, hoàn thành xuất sắc 100% chỉ tiêu kế hoạch; được chi bộ và tập thể đề nghị khen thưởng cấp trên.',
    'Gương mẫu, tiên phong trong thực hiện nghị quyết; có sáng kiến, cải tiến mang lại hiệu quả thiết thực cho đơn vị; bình xét xuất sắc toàn diện.',
    'Hoàn thành vượt mức mọi nhiệm vụ được giao, là điển hình tiên tiến của chi bộ; được Đảng ủy Học viện biểu dương.',
  ],
  HOAN_THANH_XUAT_SAC: [
    'Chấp hành nghiêm đường lối, chủ trương của Đảng; hoàn thành xuất sắc nhiệm vụ chuyên môn, tích cực tham gia công tác Đảng.',
    'Tư tưởng vững vàng, lối sống lành mạnh; thực hiện tốt nguyên tắc tập trung dân chủ; hoàn thành vượt chỉ tiêu các mặt công tác.',
    'Phát huy vai trò tiên phong, gương mẫu; tham gia đầy đủ các sinh hoạt Đảng; được quần chúng và đảng viên tín nhiệm cao.',
    'Hoàn thành xuất sắc nhiệm vụ nghiên cứu, giảng dạy; tích cực đóng góp xây dựng chi bộ trong sạch vững mạnh.',
    'Nêu cao tinh thần trách nhiệm, tận tụy trong công việc; quan hệ đồng chí tốt; thực hành tiết kiệm, chống lãng phí.',
  ],
  HOAN_THANH_TOT: [
    'Hoàn thành tốt nhiệm vụ được giao; chấp hành đúng các quy định của Đảng, Nhà nước và của đơn vị; tham gia đầy đủ sinh hoạt chi bộ.',
    'Phẩm chất đạo đức tốt; thực hiện đầy đủ nghĩa vụ đảng viên; hoàn thành tốt công tác chuyên môn trong năm.',
    'Chấp hành nghiêm kỷ luật quân đội; hoàn thành các nhiệm vụ theo kế hoạch; tích cực học tập nâng cao trình độ chính trị, chuyên môn.',
    'Không vi phạm kỷ luật; đoàn kết nội bộ tốt; hoàn thành chỉ tiêu công tác; tham gia sinh hoạt Đảng nghiêm túc.',
    'Gương mẫu trong chấp hành mệnh lệnh; tích cực tham gia các phong trào thi đua; được quần chúng tín nhiệm.',
  ],
  HOAN_THANH: [
    'Hoàn thành nhiệm vụ ở mức cơ bản; có một số hạn chế nhỏ trong thực hiện chỉ tiêu; chi bộ đã góp ý, bản thân tiếp thu và có hướng khắc phục.',
    'Hoàn thành nhiệm vụ được giao; còn hạn chế trong một số mặt công tác; cần tích cực hơn trong học tập nâng cao trình độ.',
    'Thực hiện đầy đủ nghĩa vụ đảng viên; tuy nhiên hiệu quả công tác chuyên môn chưa cao; chi bộ lưu ý cần phát huy hơn trong năm tới.',
    'Hoàn thành các nhiệm vụ được phân công; còn một số tồn tại trong sinh hoạt tập thể; đã kiểm điểm và hứa khắc phục.',
  ],
  KHONG_HOAN_THANH: [
    'Không hoàn thành một số chỉ tiêu kế hoạch; có vi phạm kỷ luật đã được xử lý; chi bộ đã giáo dục, nhắc nhở; cần tự kiểm điểm nghiêm túc.',
    'Vi phạm quy định đơn vị, chưa nêu cao tinh thần tự giác; bị chi bộ phê bình; đang trong quá trình kiểm điểm và rút kinh nghiệm.',
    'Không hoàn thành nhiệm vụ được giao; tinh thần trách nhiệm chưa cao; chi bộ xếp loại không hoàn thành và yêu cầu có kế hoạch khắc phục rõ ràng trong năm tới.',
  ],
};

function pickNote(grade: string, seed: number): string {
  const notes = NOTES_BY_GRADE[grade] || ['Đã hoàn thành đánh giá phân loại theo quy định.'];
  return notes[seed % notes.length];
}

// Build grade array with exact count matching DISTRIBUTION
function buildGradeArray(): string[] {
  const grades: string[] = [];
  for (const [grade, count] of Object.entries(DISTRIBUTION)) {
    for (let i = 0; i < count; i++) grades.push(grade);
  }
  // Shuffle deterministically using Fisher-Yates with fixed seed
  let seed = 42;
  for (let i = grades.length - 1; i > 0; i--) {
    seed = (seed * 1664525 + 1013904223) & 0xffffffff;
    const j = Math.abs(seed) % (i + 1);
    [grades[i], grades[j]] = [grades[j], grades[i]];
  }
  return grades;
}

async function main() {
  console.log('=== SEED PARTY EVALUATIONS ===\n');

  const allMembers = await prisma.partyMember.findMany({
    where: { deletedAt: null },
    include: { organization: true },
    orderBy: { createdAt: 'asc' },
  });

  console.log(`Tổng số đảng viên: ${allMembers.length}`);

  const years = [2021, 2022, 2023, 2024, 2025];

  for (const year of years) {
    console.log(`\nNăm ${year}:`);

    // Build fresh grade array for each year (shuffle differently per year)
    const baseGrades = buildGradeArray();
    // Rotate by year offset for variation
    const offset = (year - 2021) * 37;
    const grades: string[] = [
      ...baseGrades.slice(offset % baseGrades.length),
      ...baseGrades.slice(0, offset % baseGrades.length),
    ];

    let created = 0, updated = 0, skipped = 0;

    for (let mi = 0; mi < allMembers.length; mi++) {
      const member = allMembers[mi];
      const grade = grades[mi % grades.length];
      const note = pickNote(grade, mi + year);

      // December 15 each year = official evaluation date
      const evalDate = new Date(`${year}-12-15T08:00:00.000Z`);
      const orgName = member.organization?.name ?? 'Chi bộ đơn vị';

      const existing = await prisma.partyActivity.findFirst({
        where: {
          partyMemberId: member.id,
          activityType: 'EVALUATION',
          evaluationYear: year,
          deletedAt: null,
        },
      });

      if (existing) {
        // Update grade + notes to realistic values
        await prisma.partyActivity.update({
          where: { id: existing.id },
          data: {
            evaluationGrade: grade,
            evaluationNotes: note,
            activityDate: evalDate,
            description: `Đánh giá phân loại chất lượng đảng viên năm ${year}`,
            location: orgName,
          },
        });
        updated++;
      } else {
        await prisma.partyActivity.create({
          data: {
            partyMemberId: member.id,
            activityType: 'EVALUATION',
            activityDate: evalDate,
            description: `Đánh giá phân loại chất lượng đảng viên năm ${year}`,
            location: orgName,
            evaluationYear: year,
            evaluationGrade: grade,
            evaluationNotes: note,
          },
        });
        created++;
      }
    }

    // Print distribution for this year
    const dist = await prisma.partyActivity.groupBy({
      by: ['evaluationGrade'],
      where: { activityType: 'EVALUATION', evaluationYear: year, deletedAt: null },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    });

    const gradeLabels: Record<string, string> = {
      XUAT_SAC: 'Xuất sắc',
      HOAN_THANH_XUAT_SAC: 'HT Xuất sắc',
      HOAN_THANH_TOT: 'HT Tốt',
      HOAN_THANH: 'Hoàn thành',
      KHONG_HOAN_THANH: 'Không HT',
    };

    console.log(`  Tạo mới: ${created}, Cập nhật: ${updated}`);
    for (const d of dist) {
      const pct = ((d._count.id / allMembers.length) * 100).toFixed(1);
      const label = gradeLabels[d.evaluationGrade ?? ''] ?? d.evaluationGrade;
      console.log(`    ${label.padEnd(14)}: ${String(d._count.id).padStart(3)} (${pct}%)`);
    }
  }

  // Final summary
  console.log('\n=== TỔNG KẾT ===');
  const totals = await prisma.partyActivity.groupBy({
    by: ['evaluationGrade'],
    where: { activityType: 'EVALUATION', deletedAt: null },
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
  });

  console.log(`Tổng bản ghi đánh giá: ${totals.reduce((s, r) => s + r._count.id, 0)}`);
  for (const t of totals) {
    console.log(`  ${t.evaluationGrade}: ${t._count.id}`);
  }
  console.log('\n✅ Seed đánh giá phân loại hoàn thành!');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
