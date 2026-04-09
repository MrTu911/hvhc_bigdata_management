/**
 * Seed: Thesis Demo Data
 * Creates realistic ThesisProject records for demo/testing.
 *
 * Run: npx tsx --require dotenv/config prisma/seed/seed_thesis_demo.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const THESIS_TITLES: { title: string; titleEn: string; thesisType: string; keywords: string }[] = [
  {
    thesisType: 'khoa_luan',
    title: 'Nghiên cứu ứng dụng trí tuệ nhân tạo trong quản lý hậu cần quân sự',
    titleEn: 'Application of Artificial Intelligence in Military Logistics Management',
    keywords: 'trí tuệ nhân tạo, hậu cần, quân sự, tối ưu hóa',
  },
  {
    thesisType: 'khoa_luan',
    title: 'Phân tích và thiết kế hệ thống thông tin quản lý kho vật tư',
    titleEn: 'Analysis and Design of Material Warehouse Information Management System',
    keywords: 'hệ thống thông tin, kho vật tư, quản lý',
  },
  {
    thesisType: 'khoa_luan',
    title: 'Ứng dụng học máy trong dự báo nhu cầu hậu cần',
    titleEn: 'Machine Learning Application in Logistics Demand Forecasting',
    keywords: 'học máy, dự báo, hậu cần',
  },
  {
    thesisType: 'khoa_luan',
    title: 'Mô hình tối ưu hóa phân phối vật tư quân sự trong điều kiện chiến đấu',
    titleEn: 'Optimization Model for Military Supply Distribution in Combat Conditions',
    keywords: 'tối ưu hóa, phân phối, vật tư quân sự',
  },
  {
    thesisType: 'luan_van',
    title: 'Xây dựng hệ thống hỗ trợ ra quyết định trong chỉ huy hậu cần',
    titleEn: 'Building Decision Support System for Logistics Command',
    keywords: 'hỗ trợ ra quyết định, chỉ huy, hậu cần',
  },
  {
    thesisType: 'luan_van',
    title: 'Nghiên cứu tích hợp công nghệ blockchain trong chuỗi cung ứng quân sự',
    titleEn: 'Research on Blockchain Integration in Military Supply Chain',
    keywords: 'blockchain, chuỗi cung ứng, bảo mật',
  },
  {
    thesisType: 'luan_van',
    title: 'Đánh giá hiệu quả sử dụng nguồn lực hậu cần trong thời bình',
    titleEn: 'Evaluation of Logistics Resource Utilization Efficiency in Peacetime',
    keywords: 'hiệu quả, nguồn lực, thời bình',
  },
  {
    thesisType: 'luan_van',
    title: 'Mô hình quản lý bảo dưỡng phương tiện kỹ thuật trong đơn vị quân đội',
    titleEn: 'Vehicle Maintenance Management Model in Military Units',
    keywords: 'bảo dưỡng, phương tiện kỹ thuật, quân đội',
  },
  {
    thesisType: 'luan_an',
    title: 'Lý thuyết và thực tiễn tổ chức hậu cần tác chiến trong điều kiện hiện đại',
    titleEn: 'Theory and Practice of Operational Logistics Organization in Modern Conditions',
    keywords: 'hậu cần tác chiến, lý thuyết, hiện đại',
  },
  {
    thesisType: 'luan_an',
    title: 'Phát triển mô hình quản lý tổng hợp nguồn lực quốc phòng',
    titleEn: 'Developing Integrated Management Model for Defense Resources',
    keywords: 'quản lý tổng hợp, nguồn lực quốc phòng',
  },
  {
    thesisType: 'do_an',
    title: 'Thiết kế hệ thống giám sát và theo dõi phương tiện quân sự sử dụng GPS',
    titleEn: 'Design of GPS-based Military Vehicle Monitoring and Tracking System',
    keywords: 'GPS, giám sát, phương tiện quân sự',
  },
  {
    thesisType: 'do_an',
    title: 'Xây dựng phần mềm quản lý hồ sơ học viên trường quân sự',
    titleEn: 'Developing Student Profile Management Software for Military School',
    keywords: 'phần mềm, hồ sơ học viên, quân sự',
  },
  {
    thesisType: 'do_an',
    title: 'Thiết kế và triển khai mạng LAN bảo mật cho đơn vị quân đội',
    titleEn: 'Design and Implementation of Secure LAN for Military Units',
    keywords: 'mạng LAN, bảo mật, quân đội',
  },
  {
    thesisType: 'do_an',
    title: 'Ứng dụng IoT trong theo dõi tình trạng kỹ thuật trang bị quân sự',
    titleEn: 'IoT Application in Monitoring Technical Status of Military Equipment',
    keywords: 'IoT, trang bị quân sự, kỹ thuật',
  },
  {
    thesisType: 'khoa_luan',
    title: 'Phân tích hiệu quả logistics ngược trong quản lý trang bị hậu cần',
    titleEn: 'Analyzing Reverse Logistics Efficiency in Logistics Equipment Management',
    keywords: 'logistics ngược, trang bị, hiệu quả',
  },
  {
    thesisType: 'luan_van',
    title: 'Hệ thống dự báo và cảnh báo sớm trong đảm bảo hậu cần',
    titleEn: 'Early Warning and Forecasting System in Logistics Support',
    keywords: 'dự báo, cảnh báo sớm, hậu cần',
  },
];

// Defense scores distribution: realistic distribution for military academy
const DEFENSE_SCORES = [9.5, 9.0, 8.8, 8.5, 8.5, 8.0, 8.0, 7.8, 7.5, 7.5, 7.0, 6.5];

async function main() {
  console.log('🎓 Seeding thesis demo data...');

  // Get existing HocVien records
  const students = await prisma.hocVien.findMany({
    where: { deletedAt: null, trangThai: { in: ['active', 'ACTIVE', 'dang_hoc'] } },
    select: { id: true, maHocVien: true, hoTen: true },
    take: 50,
  });

  if (students.length === 0) {
    console.log('⚠️  No HocVien found with active status, trying any non-deleted students...');
    const fallback = await prisma.hocVien.findMany({
      where: { deletedAt: null },
      select: { id: true, maHocVien: true, hoTen: true },
      take: 50,
    });
    if (fallback.length === 0) {
      console.error('❌ No HocVien records found. Run student seed first.');
      process.exit(1);
    }
    students.push(...fallback);
  }

  // Get FacultyProfile records for advisors/reviewers
  const faculty = await prisma.facultyProfile.findMany({
    select: { id: true, user: { select: { name: true } } },
    take: 10,
  });

  if (faculty.length === 0) {
    console.error('❌ No FacultyProfile records found. Run faculty seed first.');
    process.exit(1);
  }

  console.log(`  Found ${students.length} students and ${faculty.length} faculty`);

  // Remove any existing demo thesis records
  const deleted = await prisma.thesisProject.deleteMany({
    where: { notes: { contains: '[DEMO]' } },
  });
  if (deleted.count > 0) {
    console.log(`  Removed ${deleted.count} existing demo thesis records`);
  }

  // Assign thesis statuses: aim for realistic distribution
  // DRAFT: 20%, IN_PROGRESS: 30%, DEFENDED: 35%, ARCHIVED: 15%
  const thesisCount = Math.min(students.length, THESIS_TITLES.length);
  const statusPlan: string[] = [];

  for (let i = 0; i < thesisCount; i++) {
    const ratio = i / thesisCount;
    if (ratio < 0.15)      statusPlan.push('ARCHIVED');
    else if (ratio < 0.50) statusPlan.push('DEFENDED');
    else if (ratio < 0.80) statusPlan.push('IN_PROGRESS');
    else                   statusPlan.push('DRAFT');
  }

  let created = 0;
  const now = new Date();

  for (let i = 0; i < thesisCount; i++) {
    const student   = students[i];
    const titleData = THESIS_TITLES[i % THESIS_TITLES.length];
    const status    = statusPlan[i];
    const advisor   = faculty[i % faculty.length];
    const reviewer  = faculty[(i + 1) % faculty.length];

    let defenseDate: Date | null = null;
    let defenseScore: number | null = null;

    if (status === 'DEFENDED' || status === 'ARCHIVED') {
      // Defense date: 1–18 months ago
      const monthsAgo = 1 + (i % 18);
      defenseDate = new Date(now);
      defenseDate.setMonth(defenseDate.getMonth() - monthsAgo);
      defenseScore = DEFENSE_SCORES[i % DEFENSE_SCORES.length];
    }

    // Check for duplicate (one thesis per student is typical)
    const existing = await prisma.thesisProject.findFirst({
      where: { hocVienId: student.id, notes: { contains: '[DEMO]' } },
    });
    if (existing) continue;

    await prisma.thesisProject.create({
      data: {
        hocVienId:    student.id,
        thesisType:   titleData.thesisType,
        title:        titleData.title,
        titleEn:      titleData.titleEn,
        advisorId:    advisor.id,
        reviewerId:   status === 'DEFENDED' || status === 'ARCHIVED' ? reviewer.id : null,
        status:       status as any,
        defenseDate,
        defenseScore,
        keywords:     titleData.keywords,
        abstractText: `Đề tài nghiên cứu về ${titleData.keywords.split(',')[0].trim()} trong lĩnh vực hậu cần quân sự. Công trình đóng góp vào việc nâng cao hiệu quả quản lý và vận hành đơn vị.`,
        notes:        '[DEMO] Dữ liệu mẫu dùng để kiểm thử chức năng',
      },
    });
    created++;
  }

  console.log(`✅ Created ${created} thesis demo records`);

  // Summary
  const summary = await prisma.thesisProject.groupBy({
    by: ['status'],
    _count: { _all: true },
  });
  console.log('  Distribution:');
  for (const row of summary) {
    console.log(`    ${row.status}: ${row._count._all}`);
  }

  const byType = await prisma.thesisProject.groupBy({
    by: ['thesisType'],
    _count: { _all: true },
  });
  console.log('  By type:');
  for (const row of byType) {
    console.log(`    ${row.thesisType}: ${row._count._all}`);
  }
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
