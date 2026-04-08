/**
 * Seed: M10 Demo Data
 * Tạo dữ liệu mẫu cho module Giáo dục Đào tạo (M10):
 *   - ProgramVersion (gắn vào Program hiện có)
 *   - Cập nhật HocVien: currentProgramVersionId, tinChiTichLuy, khoaQuanLy, studyMode, ngayNhapHoc
 *   - StudentConductRecord (điểm rèn luyện 2 kỳ)
 *   - AcademicWarning (cảnh báo học vụ cho học viên GPA thấp)
 *   - ThesisProject (khóa luận cho ~30 học viên)
 *   - GraduationAudit (xét tốt nghiệp cho học viên đã có đề tài bảo vệ xong)
 *
 * Run: npx tsx --require dotenv/config prisma/seed/seed_m10_demo.ts
 */

import { PrismaClient } from '@prisma/client';
import 'dotenv/config';
import { MIN_GPA_FOR_GRADUATION, MIN_CONDUCT_SCORE_FOR_GRADUATION } from '../../lib/constants/graduation-rules';

const prisma = new PrismaClient();

function pick<T>(arr: T[], seed: number): T {
  return arr[Math.abs(seed) % arr.length];
}

function randFloat(min: number, max: number, seed: number): number {
  const r = Math.abs(Math.sin(seed * 127.1 + 311.7) * 43758.5453) % 1;
  return parseFloat((min + r * (max - min)).toFixed(2));
}

const STUDY_MODES = ['CHINH_QUY', 'CHINH_QUY', 'CHINH_QUY', 'SAU_DAI_HOC', 'LIEN_THONG'];
const KHOA_QUAN_LY = ['Khoa Hậu cần', 'Khoa Quân nhu', 'Khoa Vận tải', 'Khoa Xăng dầu', 'Khoa Tài chính'];
const CONDUCT_GRADES = ['Xuất sắc', 'Tốt', 'Tốt', 'Khá', 'Khá', 'Trung bình', 'Yếu'];
const THESIS_TYPES = ['khoa_luan', 'khoa_luan', 'khoa_luan', 'do_an', 'luan_van'];
const THESIS_TITLES = [
  'Nghiên cứu tối ưu hóa hệ thống hậu cần chiến đấu trong điều kiện hiện đại',
  'Ứng dụng công nghệ thông tin trong quản lý quân nhu đơn vị cấp tiểu đoàn',
  'Phân tích hiệu quả vận tải quân sự trên địa bàn miền núi phía Bắc',
  'Xây dựng hệ thống kiểm soát xăng dầu tự động cho đơn vị cấp trung đoàn',
  'Đánh giá thực trạng công tác tài chính quân sự và đề xuất giải pháp',
  'Nghiên cứu mô hình bảo đảm hậu cần chiến đấu cấp chiến lược',
  'Ứng dụng AI trong phân tích nhu cầu vật tư chiến đấu',
  'Xây dựng kế hoạch bảo đảm quân nhu trong tình huống khẩn cấp',
  'Tối ưu hóa lộ trình vận chuyển hàng hóa quân sự đường bộ',
  'Quản lý kho xăng dầu thông minh ứng dụng IoT',
  'Cơ chế phân bổ nguồn lực tài chính trong điều kiện chiến tranh hiện đại',
  'Phân tích rủi ro trong chuỗi cung ứng hậu cần quân sự',
];

async function main() {
  console.log('🎓 Bắt đầu seed M10 Demo Data...\n');

  // ─── 1. ProgramVersion ─────────────────────────────────────────────────────
  console.log('1️⃣  Tạo ProgramVersion...');
  const programs = await prisma.program.findMany({
    where: { isActive: true },
    select: { id: true, code: true, name: true, totalCredits: true },
  });

  if (programs.length === 0) {
    console.log('  ⚠️  Không tìm thấy Program. Bỏ qua bước 1.');
  }

  const versionMap = new Map<string, string>(); // programId -> versionId
  let pvCreated = 0;

  for (const prog of programs) {
    const existing = await prisma.programVersion.findFirst({
      where: { programId: prog.id, status: 'PUBLISHED' },
    });
    if (existing) {
      versionMap.set(prog.id, existing.id);
      continue;
    }

    const pv = await prisma.programVersion.create({
      data: {
        programId: prog.id,
        versionCode: `${prog.code}-2023`,
        effectiveFromCohort: 'K45',
        totalCredits: prog.totalCredits || 130,
        status: 'PUBLISHED',
        notes: `Chương trình đào tạo ${prog.name} áp dụng từ khóa K45`,
        requiredCoursesJson: {
          coreCredits: Math.round((prog.totalCredits || 130) * 0.6),
          electiveCredits: Math.round((prog.totalCredits || 130) * 0.3),
          thesisCredits: Math.round((prog.totalCredits || 130) * 0.1),
        },
      },
    });
    versionMap.set(prog.id, pv.id);
    pvCreated++;
  }
  console.log(`  ✔ ProgramVersion tạo: ${pvCreated} (bỏ qua ${programs.length - pvCreated} đã có)\n`);

  // ─── 2. Cập nhật HocVien ──────────────────────────────────────────────────
  console.log('2️⃣  Cập nhật HocVien (programVersion, tín chỉ, khoa quản lý)...');
  const allHocVien = await prisma.hocVien.findMany({
    where: { deletedAt: null },
    select: {
      id: true, maHocVien: true, diemTrungBinh: true,
      currentProgramVersionId: true, currentStatus: true,
    },
    orderBy: { maHocVien: 'asc' },
  });

  const programIds = [...versionMap.keys()];
  let hvUpdated = 0;

  for (let i = 0; i < allHocVien.length; i++) {
    const hv = allHocVien[i];
    if (hv.currentProgramVersionId) continue; // already set

    const progId = pick(programIds, i);
    const versionId = versionMap.get(progId);
    if (!versionId) continue;

    const gpa = hv.diemTrungBinh || randFloat(5.0, 9.0, i + 1);
    const tinChi = Math.min(Math.round(gpa * 14 + randFloat(0, 15, i + 91)), 130);

    await prisma.hocVien.update({
      where: { id: hv.id },
      data: {
        currentProgramVersionId: versionId,
        tinChiTichLuy: tinChi,
        khoaQuanLy: pick(KHOA_QUAN_LY, i),
        studyMode: pick(STUDY_MODES, i),
        ngayNhapHoc: new Date(`${2021 + (i % 3)}-09-01`),
        diemTrungBinh: gpa,
      },
    });
    hvUpdated++;
  }
  console.log(`  ✔ HocVien cập nhật: ${hvUpdated}\n`);

  // ─── 3. StudentConductRecord ──────────────────────────────────────────────
  console.log('3️⃣  Tạo StudentConductRecord (điểm rèn luyện)...');
  const hocVienList = await prisma.hocVien.findMany({
    where: { deletedAt: null },
    select: { id: true, diemTrungBinh: true },
    orderBy: { maHocVien: 'asc' },
  });

  let conductCreated = 0;
  const semesterPairs = [
    { academicYear: '2024-2025', semesterCode: 'HK1' },
    { academicYear: '2024-2025', semesterCode: 'HK2' },
  ];

  for (let i = 0; i < hocVienList.length; i++) {
    const hv = hocVienList[i];
    for (const sem of semesterPairs) {
      const existing = await prisma.studentConductRecord.findUnique({
        where: {
          hocVienId_academicYear_semesterCode: {
            hocVienId: hv.id,
            academicYear: sem.academicYear,
            semesterCode: sem.semesterCode,
          },
        },
      });
      if (existing) continue;

      // Score correlated with GPA but with variance
      const baseSeed = i * 31 + semesterPairs.indexOf(sem) * 1000;
      const conductScore = parseFloat(
        Math.min(100, Math.max(30,
          (hv.diemTrungBinh || 7.0) * 9 + randFloat(-10, 10, baseSeed)
        )).toFixed(1)
      );
      const gradeIdx = conductScore >= 90 ? 0 : conductScore >= 80 ? 1 : conductScore >= 70 ? 3 : conductScore >= 60 ? 4 : 5;

      await prisma.studentConductRecord.create({
        data: {
          hocVienId: hv.id,
          academicYear: sem.academicYear,
          semesterCode: sem.semesterCode,
          conductScore,
          conductGrade: CONDUCT_GRADES[gradeIdx],
          rewardSummary: conductScore >= 85 ? 'Hoàn thành xuất sắc nhiệm vụ học tập và rèn luyện' : null,
          disciplineSummary: conductScore < 60 ? 'Có vi phạm kỷ luật nhẹ trong kỳ học' : null,
        },
      });
      conductCreated++;
    }
  }
  console.log(`  ✔ StudentConductRecord tạo: ${conductCreated}\n`);

  // ─── 4. AcademicWarning ───────────────────────────────────────────────────
  console.log('4️⃣  Tạo AcademicWarning (cảnh báo học vụ cho GPA thấp)...');
  const lowGpaStudents = await prisma.hocVien.findMany({
    where: { deletedAt: null, diemTrungBinh: { lt: 6.5 } },
    select: { id: true, diemTrungBinh: true, tinChiTichLuy: true },
    orderBy: { diemTrungBinh: 'asc' },
  });

  let warningCreated = 0;

  for (let i = 0; i < lowGpaStudents.length; i++) {
    const hv = lowGpaStudents[i];
    const gpa = hv.diemTrungBinh || 5.0;
    const failedCredits = Math.round(randFloat(3, 20, i + 7));

    let warningLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    let suggestedAction: string;

    if (gpa < 4.5 || failedCredits >= 20) {
      warningLevel = 'CRITICAL';
      suggestedAction = 'Xem xét đình chỉ học và tư vấn học vụ khẩn cấp';
    } else if (gpa < 5.5 || failedCredits >= 12) {
      warningLevel = 'HIGH';
      suggestedAction = 'Yêu cầu tư vấn học vụ, theo dõi sát trong kỳ tiếp theo';
    } else if (gpa < 6.0 || failedCredits >= 6) {
      warningLevel = 'MEDIUM';
      suggestedAction = 'Thông báo đến giảng viên cố vấn, tăng cường hỗ trợ học tập';
    } else {
      warningLevel = 'LOW';
      suggestedAction = 'Theo dõi kết quả học tập kỳ tiếp theo';
    }

    const existing = await prisma.academicWarning.findUnique({
      where: {
        hocVienId_academicYear_semesterCode: {
          hocVienId: hv.id,
          academicYear: '2024-2025',
          semesterCode: 'HK2',
        },
      },
    });
    if (existing) continue;

    await prisma.academicWarning.create({
      data: {
        hocVienId: hv.id,
        academicYear: '2024-2025',
        semesterCode: 'HK2',
        warningLevel,
        warningReasonJson: { gpa, failedCredits },
        suggestedAction,
        isResolved: i % 4 === 0, // 25% đã xử lý
        resolvedAt: i % 4 === 0 ? new Date('2025-03-15') : null,
      },
    });
    warningCreated++;
  }
  console.log(`  ✔ AcademicWarning tạo: ${warningCreated}\n`);

  // ─── 5. ThesisProject ─────────────────────────────────────────────────────
  console.log('5️⃣  Tạo ThesisProject (khóa luận)...');
  // Lấy học viên cuối khóa (GPA >= 6.0, tín chỉ >= 80)
  const thesisEligible = await prisma.hocVien.findMany({
    where: {
      deletedAt: null,
      diemTrungBinh: { gte: 6.0 },
      tinChiTichLuy: { gte: 80 },
    },
    select: { id: true, diemTrungBinh: true },
    orderBy: { diemTrungBinh: 'desc' },
    take: 40,
  });

  const facultyList = await prisma.facultyProfile.findMany({
    where: { isActive: true },
    select: { id: true },
    take: 50,
  });

  let thesisCreated = 0;
  // First 15 → DEFENDED (ready for graduation); next 15 → IN_PROGRESS; remaining → DRAFT
  for (let i = 0; i < thesisEligible.length; i++) {
    const hv = thesisEligible[i];
    const existing = await prisma.thesisProject.findFirst({ where: { hocVienId: hv.id } });

    const status: 'DEFENDED' | 'IN_PROGRESS' | 'DRAFT' =
      i < 15 ? 'DEFENDED' : i < 30 ? 'IN_PROGRESS' : 'DRAFT';
    const isDefended = status === 'DEFENDED';
    const gpa = hv.diemTrungBinh || 7.0;

    const defenseScore = isDefended
      ? parseFloat(Math.min(10, gpa * 0.9 + randFloat(0, 0.8, i + 500)).toFixed(1))
      : null;
    const defenseDate = isDefended
      ? new Date(2025, i % 5, 10 + (i % 18))
      : null;

    if (existing) {
      // Update status if it was created in a previous partial run
      await prisma.thesisProject.update({
        where: { id: existing.id },
        data: {
          status,
          defenseScore,
          defenseDate,
          abstractText: isDefended
            ? 'Đề tài nghiên cứu các giải pháp nâng cao hiệu quả công tác hậu cần trong điều kiện hiện đại, ứng dụng các phương pháp phân tích khoa học và công nghệ tiên tiến.'
            : null,
          keywords: isDefended ? 'hậu cần, quân sự, hiện đại hóa, hiệu quả' : null,
        },
      });
    } else {
      await prisma.thesisProject.create({
        data: {
          hocVienId: hv.id,
          thesisType: pick(THESIS_TYPES, i),
          title: pick(THESIS_TITLES, i),
          advisorId: pick(facultyList, i).id,
          reviewerId: facultyList.length > 1 ? pick(facultyList, i + 7).id : null,
          status,
          defenseScore,
          defenseDate,
          abstractText: isDefended
            ? 'Đề tài nghiên cứu các giải pháp nâng cao hiệu quả công tác hậu cần trong điều kiện hiện đại, ứng dụng các phương pháp phân tích khoa học và công nghệ tiên tiến.'
            : null,
          keywords: isDefended ? 'hậu cần, quân sự, hiện đại hóa, hiệu quả' : null,
        },
      });
      thesisCreated++;
    }
  }
  console.log(`  ✔ ThesisProject tạo: ${thesisCreated}\n`);

  // ─── 6. GraduationAudit ───────────────────────────────────────────────────
  console.log('6️⃣  Tạo GraduationAudit (xét tốt nghiệp)...');
  const defendedTheses = await prisma.thesisProject.findMany({
    where: { status: 'DEFENDED' },
    include: {
      hocVien: {
        select: {
          id: true, diemTrungBinh: true, tinChiTichLuy: true,
          currentProgramVersionId: true,
        },
      },
    },
  });

  // Fetch conduct scores to compute avg
  let gradCreated = 0;

  for (let i = 0; i < defendedTheses.length; i++) {
    const thesis = defendedTheses[i];
    const hv = thesis.hocVien;

    const existing = await prisma.graduationAudit.findFirst({ where: { hocVienId: hv.id } });
    if (existing) continue;

    const gpa = hv.diemTrungBinh || 0;
    const credits = hv.tinChiTichLuy || 0;

    // Fetch latest conduct score
    const latestConduct = await prisma.studentConductRecord.findFirst({
      where: { hocVienId: hv.id },
      orderBy: [{ academicYear: 'desc' }, { semesterCode: 'desc' }],
    });
    const conductScore = latestConduct?.conductScore || 0;

    // Get required credits from programVersion
    let requiredCredits = 120;
    if (hv.currentProgramVersionId) {
      const pv = await prisma.programVersion.findUnique({
        where: { id: hv.currentProgramVersionId },
        select: { totalCredits: true },
      });
      requiredCredits = pv?.totalCredits || 120;
    }

    const gpaEligible = gpa >= MIN_GPA_FOR_GRADUATION;
    const conductEligible = conductScore >= MIN_CONDUCT_SCORE_FOR_GRADUATION;
    const thesisEligible = true;     // already DEFENDED

    const failureReasons: string[] = [];
    if (!gpaEligible) failureReasons.push(`GPA chưa đạt (${gpa.toFixed(2)} < 5.0)`);
    if (!conductEligible) failureReasons.push(`Điểm rèn luyện chưa đạt (${conductScore} < 50)`);
    if (credits < requiredCredits) failureReasons.push(`Chưa đủ tín chỉ (${credits}/${requiredCredits})`);

    const graduationEligible = gpaEligible && conductEligible && credits >= requiredCredits && thesisEligible;

    const audit = await prisma.graduationAudit.create({
      data: {
        hocVienId: hv.id,
        auditDate: new Date('2025-06-15'),
        totalCreditsEarned: credits,
        gpa,
        conductEligible,
        thesisEligible,
        languageEligible: true,
        graduationEligible,
        status: graduationEligible ? 'ELIGIBLE' : 'INELIGIBLE',
        failureReasonsJson: failureReasons.length > 0 ? { reasons: failureReasons } : null,
      },
    });
    gradCreated++;

    // Nếu đủ điều kiện → tạo DiplomaRecord
    if (graduationEligible) {
      const existingDiploma = await prisma.diplomaRecord.findFirst({ where: { hocVienId: hv.id } });
      if (!existingDiploma) {
        await prisma.diplomaRecord.create({
          data: {
            hocVienId: hv.id,
            graduationAuditId: audit.id,
            diplomaNo: `VB-2025-${String(i + 1).padStart(4, '0')}`,
            diplomaType: 'dai_hoc',
            graduationDate: new Date('2025-07-01'),
            issuedAt: new Date('2025-07-15'),
            classification: gpa >= 9.0 ? 'Xuất sắc' : gpa >= 8.0 ? 'Giỏi' : gpa >= 7.0 ? 'Khá' : 'Trung bình',
          },
        });
      }
    }
  }
  console.log(`  ✔ GraduationAudit tạo: ${gradCreated}\n`);

  // ─── Summary ──────────────────────────────────────────────────────────────
  console.log('📊 TỔNG KẾT SAU SEED:');
  const [pvCount, conductCount, warningCount, thesisCount, gradCount, diplomaCount] = await Promise.all([
    prisma.programVersion.count(),
    prisma.studentConductRecord.count(),
    prisma.academicWarning.count(),
    prisma.thesisProject.count(),
    prisma.graduationAudit.count(),
    prisma.diplomaRecord.count(),
  ]);
  console.log(`  ProgramVersion:        ${pvCount}`);
  console.log(`  StudentConductRecord:  ${conductCount}`);
  console.log(`  AcademicWarning:       ${warningCount}`);
  console.log(`  ThesisProject:         ${thesisCount}`);
  console.log(`  GraduationAudit:       ${gradCount}`);
  console.log(`  DiplomaRecord:         ${diplomaCount}`);
  console.log('\n✅ Seed M10 Demo hoàn tất!');
}

main()
  .catch(e => { console.error('❌ Error:', e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
