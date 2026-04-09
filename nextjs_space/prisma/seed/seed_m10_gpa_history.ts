/**
 * Seed: M10 GPA History, Score History & Academic Repository
 * Tạo dữ liệu mẫu theo dõi lịch sử học tập:
 *   - StudentGpaHistory (snapshot GPA theo kỳ, M07 read-model)
 *   - ScoreHistory (audit trail bắt buộc khi sửa điểm ClassEnrollment)
 *   - AcademicRepositoryItem (kho lưu trữ học thuật: bảng điểm, khóa luận, chứng chỉ)
 *
 * Phụ thuộc:
 *   - HocVien (từ seed_hocvien_v2.ts)
 *   - ClassEnrollment (từ seed_hocvien_v2.ts / seed_teaching_data.ts)
 *   - DiplomaRecord / ThesisProject (từ seed_m10_demo.ts) để tạo repo items
 *
 * Run: npx tsx --require dotenv/config prisma/seed/seed_m10_gpa_history.ts
 */

import { PrismaClient } from '@prisma/client';
import 'dotenv/config';

const prisma = new PrismaClient();

function pick<T>(arr: T[], seed: number): T {
  return arr[Math.abs(seed) % arr.length];
}

function pseudoRand(seed: number, min: number, max: number): number {
  const r = Math.abs(Math.sin(seed * 127.1 + 311.7) * 43758.5453) % 1;
  return min + r * (max - min);
}

// Dãy học kỳ để tạo lịch sử
const GPA_SEMESTER_SEQUENCE = [
  { academicYear: '2022-2023', semesterCode: 'HK1' },
  { academicYear: '2022-2023', semesterCode: 'HK2' },
  { academicYear: '2023-2024', semesterCode: 'HK1' },
  { academicYear: '2023-2024', semesterCode: 'HK2' },
  { academicYear: '2024-2025', semesterCode: 'HK1' },
  { academicYear: '2024-2025', semesterCode: 'HK2' },
];

async function main() {
  console.log('📈 Bắt đầu seed M10 GPA History & Academic Repository...\n');

  // Load HocVien
  const allHocVien = await prisma.hocVien.findMany({
    where: { deletedAt: null },
    select: {
      id: true,
      maHocVien: true,
      diemTrungBinh: true,
      tinChiTichLuy: true,
      ngayNhapHoc: true,
    },
    orderBy: { maHocVien: 'asc' },
  });

  if (allHocVien.length === 0) {
    throw new Error('Không có HocVien. Hãy chạy seed_hocvien_v2.ts trước.');
  }

  // Load ClassEnrollment để tạo ScoreHistory
  const enrollments = await prisma.classEnrollment.findMany({
    where: {
      gradeStatus: { in: ['FINALIZED', 'GRADED', 'PENDING'] },
    },
    select: {
      id: true,
      hocVienId: true,
      totalScore: true,
      midtermScore: true,
      finalScore: true,
      assignmentScore: true,
      attendanceScore: true,
    },
    take: 200,
  });

  // ─── 1. StudentGpaHistory ─────────────────────────────────────────────────────
  console.log('1️⃣  Tạo StudentGpaHistory (snapshot GPA theo kỳ)...');
  let gpaCreated = 0;

  for (let i = 0; i < allHocVien.length; i++) {
    const hv = allHocVien[i];
    const cumulativeGpa = hv.diemTrungBinh || pseudoRand(i + 1, 5.0, 9.5);

    // Mỗi học viên tạo lịch sử 4–6 kỳ (tùy thâm niên)
    const ngayNhapHoc = hv.ngayNhapHoc ?? new Date('2022-09-01');
    const yearEnrolled = ngayNhapHoc.getFullYear();
    const startSemIdx = yearEnrolled <= 2022 ? 0 : yearEnrolled <= 2023 ? 2 : 4;

    let accumulatedCredits = 0;

    for (let s = startSemIdx; s < GPA_SEMESTER_SEQUENCE.length; s++) {
      const sem = GPA_SEMESTER_SEQUENCE[s];

      // StudentGpaHistory chưa được generate vào Prisma client, dùng raw SQL
      // (chạy `npx prisma generate` sau khi seed nếu muốn dùng ORM)
      const existingRows = await prisma.$queryRaw<Array<{ id: string; total_credits_accumulated: number }>>`
        SELECT id, total_credits_accumulated
        FROM student_gpa_histories
        WHERE hoc_vien_id = ${hv.id}
          AND academic_year = ${sem.academicYear}
          AND semester_code = ${sem.semesterCode}
        LIMIT 1
      `;
      if (existingRows.length > 0) {
        accumulatedCredits = existingRows[0].total_credits_accumulated ?? accumulatedCredits;
        continue;
      }

      // GPA từng kỳ có biến động tự nhiên xung quanh GPA tích lũy
      const semOffset = pseudoRand(i * 100 + s * 17, -0.8, 0.8);
      const semesterGpa = parseFloat(Math.min(10, Math.max(2.0, cumulativeGpa + semOffset)).toFixed(2));
      const creditsThisSem = 15 + Math.round(pseudoRand(i + s * 11, 0, 5)); // 15–20 tín chỉ/kỳ
      accumulatedCredits = Math.min(accumulatedCredits + creditsThisSem, hv.tinChiTichLuy ?? 130);

      // GPA tích lũy trending về cumulativeGpa theo thời gian
      const cumulativeGpaNow = parseFloat(
        Math.min(10, Math.max(2.0, cumulativeGpa + pseudoRand(i * 50 + s * 3, -0.3, 0.3))).toFixed(2)
      );

      let academicStatus: 'NORMAL' | 'WARNING' | 'PROBATION' | 'SUSPENDED';
      if (cumulativeGpaNow >= 5.0) {
        academicStatus = 'NORMAL';
      } else if (cumulativeGpaNow >= 4.0) {
        academicStatus = 'WARNING';
      } else if (cumulativeGpaNow >= 3.0) {
        academicStatus = 'PROBATION';
      } else {
        academicStatus = 'SUSPENDED';
      }

      const newId = `sgpa_${Date.now()}_${i}_${s}`;
      const now = new Date();
      await prisma.$executeRaw`
        INSERT INTO student_gpa_histories (
          id, hoc_vien_id, academic_year, semester_code,
          semester_gpa, cumulative_gpa, credits_earned,
          total_credits_accumulated, academic_status,
          built_at, created_at, updated_at
        ) VALUES (
          ${newId}, ${hv.id}, ${sem.academicYear}, ${sem.semesterCode},
          ${semesterGpa}, ${cumulativeGpaNow}, ${creditsThisSem},
          ${accumulatedCredits}, ${academicStatus}::"AcademicPerformanceStatus",
          ${now}, ${now}, ${now}
        )
        ON CONFLICT (hoc_vien_id, academic_year, semester_code) DO NOTHING
      `;
      gpaCreated++;
    }
  }
  console.log(`  ✔ StudentGpaHistory tạo: ${gpaCreated}\n`);

  // ─── 2. ScoreHistory (audit trail khi sửa điểm) ───────────────────────────────
  console.log('2️⃣  Tạo ScoreHistory (audit trail điểm)...');
  let scoreHistCreated = 0;

  // Tạo lịch sử sửa điểm cho ~30% số enrollment (giả lập việc GV sửa điểm 1-2 lần)
  const enrollmentSample = enrollments.slice(0, Math.min(60, enrollments.length));

  for (let i = 0; i < enrollmentSample.length; i++) {
    const enroll = enrollmentSample[i];

    // Kiểm tra đã có ScoreHistory chưa
    const existingCount = await prisma.scoreHistory.count({ where: { enrollmentId: enroll.id } });
    if (existingCount > 0) continue;

    // Lần 1: sửa điểm giữa kỳ (GV nhập sai rồi sửa lại)
    const oldMidterm = enroll.midtermScore ? parseFloat((enroll.midtermScore - pseudoRand(i + 1, 0.5, 1.5)).toFixed(1)) : null;
    const oldTotal = enroll.totalScore
      ? parseFloat((enroll.totalScore - pseudoRand(i + 1, 0.2, 0.8)).toFixed(2))
      : null;

    await prisma.scoreHistory.create({
      data: {
        enrollmentId: enroll.id,
        changedBy: null, // system hoặc không có userId trong seed
        oldValues: {
          attendanceScore: enroll.attendanceScore,
          assignmentScore: enroll.assignmentScore,
          midtermScore: oldMidterm,
          finalScore: enroll.finalScore,
          totalScore: oldTotal,
        },
        newValues: {
          attendanceScore: enroll.attendanceScore,
          assignmentScore: enroll.assignmentScore,
          midtermScore: enroll.midtermScore,
          finalScore: enroll.finalScore,
          totalScore: enroll.totalScore,
        },
        reason: i % 5 === 0
          ? 'Đính chính điểm giữa kỳ theo phúc khảo của học viên'
          : i % 3 === 0
            ? 'Cập nhật điểm chuyên cần sau kiểm tra lại danh sách'
            : 'Sửa điểm do nhập sai lần đầu',
        changedAt: new Date(`2025-11-${10 + (i % 20)}`),
      },
    });
    scoreHistCreated++;

    // 20% enrollment có sửa điểm lần 2 (phúc khảo)
    if (i % 5 === 0 && enroll.finalScore !== null) {
      const oldFinal = parseFloat((enroll.finalScore - pseudoRand(i + 7, 0.25, 1.0)).toFixed(1));
      await prisma.scoreHistory.create({
        data: {
          enrollmentId: enroll.id,
          changedBy: null,
          oldValues: {
            attendanceScore: enroll.attendanceScore,
            assignmentScore: enroll.assignmentScore,
            midtermScore: enroll.midtermScore,
            finalScore: oldFinal,
            totalScore: oldTotal,
          },
          newValues: {
            attendanceScore: enroll.attendanceScore,
            assignmentScore: enroll.assignmentScore,
            midtermScore: enroll.midtermScore,
            finalScore: enroll.finalScore,
            totalScore: enroll.totalScore,
          },
          reason: 'Cập nhật điểm cuối kỳ sau phúc khảo - kết quả hội đồng chấm phúc khảo ngày 15/01/2026',
          changedAt: new Date('2026-01-15'),
        },
      });
      scoreHistCreated++;
    }
  }
  console.log(`  ✔ ScoreHistory tạo: ${scoreHistCreated}\n`);

  // ─── 3. AcademicRepositoryItem ────────────────────────────────────────────────
  console.log('3️⃣  Tạo AcademicRepositoryItem (kho học thuật)...');
  let repoCreated = 0;

  // 3a. Bảng điểm toàn khóa cho tất cả học viên
  for (let i = 0; i < allHocVien.length; i++) {
    const hv = allHocVien[i];

    const existing = await prisma.academicRepositoryItem.findFirst({
      where: { hocVienId: hv.id, itemType: 'transcript' },
    });
    if (existing) continue;

    await prisma.academicRepositoryItem.create({
      data: {
        hocVienId: hv.id,
        itemType: 'transcript',
        title: `Bảng điểm học tập toàn khóa - Học viên ${hv.maHocVien}`,
        fileUrl: `/repository/transcripts/${hv.maHocVien}_transcript_2025.pdf`,
        metadataJson: {
          academicYear: '2024-2025',
          generatedAt: '2025-06-30',
          totalCredits: hv.tinChiTichLuy,
          gpa: hv.diemTrungBinh,
        },
        isPublic: false,
        createdBy: 'system',
        indexedAt: new Date('2025-07-01'),
      },
    });
    repoCreated++;
  }

  // 3b. Khóa luận đã bảo vệ thành công
  const defendedTheses = await prisma.thesisProject.findMany({
    where: { status: 'DEFENDED' },
    select: {
      id: true,
      hocVienId: true,
      title: true,
      defenseDate: true,
      defenseScore: true,
    },
  });

  for (const thesis of defendedTheses) {
    const existing = await prisma.academicRepositoryItem.findFirst({
      where: { hocVienId: thesis.hocVienId, itemType: 'thesis' },
    });
    if (existing) continue;

    const hv = allHocVien.find(h => h.id === thesis.hocVienId);
    if (!hv) continue;

    await prisma.academicRepositoryItem.create({
      data: {
        hocVienId: thesis.hocVienId,
        itemType: 'thesis',
        title: thesis.title,
        fileUrl: `/repository/theses/${hv.maHocVien}_thesis_full.pdf`,
        metadataJson: {
          defenseDate: thesis.defenseDate?.toISOString().split('T')[0],
          defenseScore: thesis.defenseScore,
          thesisId: thesis.id,
        },
        isPublic: true, // Khóa luận được phép công khai sau khi bảo vệ
        createdBy: 'system',
        indexedAt: thesis.defenseDate ?? new Date('2025-06-20'),
      },
    });
    repoCreated++;
  }

  // 3c. Bằng tốt nghiệp (DiplomaRecord đã cấp)
  const diplomas = await prisma.diplomaRecord.findMany({
    select: { id: true, hocVienId: true, diplomaNo: true, issuedAt: true, classification: true },
  });

  for (const diploma of diplomas) {
    const existing = await prisma.academicRepositoryItem.findFirst({
      where: { hocVienId: diploma.hocVienId, itemType: 'certificate' },
    });
    if (existing) continue;

    const hv = allHocVien.find(h => h.id === diploma.hocVienId);
    if (!hv) continue;

    await prisma.academicRepositoryItem.create({
      data: {
        hocVienId: diploma.hocVienId,
        itemType: 'certificate',
        title: `Bằng tốt nghiệp - ${diploma.diplomaNo} - ${hv.maHocVien}`,
        fileUrl: `/repository/diplomas/${diploma.diplomaNo}_scan.pdf`,
        metadataJson: {
          diplomaNo: diploma.diplomaNo,
          issuedAt: diploma.issuedAt?.toISOString().split('T')[0],
          classification: diploma.classification,
          diplomaId: diploma.id,
        },
        isPublic: false,
        createdBy: 'system',
        indexedAt: diploma.issuedAt ?? new Date('2025-07-15'),
      },
    });
    repoCreated++;
  }

  // 3d. Hồ sơ tuyển sinh (dossier) cho học viên năm đầu
  const freshStudents = allHocVien
    .filter(hv => {
      const enrolled = hv.ngayNhapHoc ?? new Date('2024-09-01');
      return enrolled.getFullYear() >= 2024;
    })
    .slice(0, 20);

  for (const hv of freshStudents) {
    const existing = await prisma.academicRepositoryItem.findFirst({
      where: { hocVienId: hv.id, itemType: 'dossier' },
    });
    if (existing) continue;

    await prisma.academicRepositoryItem.create({
      data: {
        hocVienId: hv.id,
        itemType: 'dossier',
        title: `Hồ sơ tuyển sinh - ${hv.maHocVien}`,
        fileUrl: `/repository/dossiers/${hv.maHocVien}_admission_dossier.pdf`,
        metadataJson: {
          admissionYear: 2024,
          documentList: [
            'Đơn đăng ký nhập học',
            'Bằng tốt nghiệp THPT',
            'Kết quả thi tuyển sinh',
            'Sơ yếu lý lịch',
            'Giấy khám sức khỏe',
          ],
        },
        isPublic: false,
        createdBy: 'system',
        indexedAt: new Date('2024-09-05'),
      },
    });
    repoCreated++;
  }

  // 3e. Tài liệu chứng chỉ ngoại ngữ (chứng nhận) cho học viên có GPA cao
  const highGpaStudents = allHocVien
    .filter(hv => (hv.diemTrungBinh ?? 0) >= 8.0)
    .slice(0, 25);

  for (const hv of highGpaStudents) {
    const existing = await prisma.academicRepositoryItem.findFirst({
      where: { hocVienId: hv.id, itemType: 'other' },
    });
    if (existing) continue;

    await prisma.academicRepositoryItem.create({
      data: {
        hocVienId: hv.id,
        itemType: 'other',
        title: `Chứng nhận đạt chuẩn ngoại ngữ đầu ra - ${hv.maHocVien}`,
        fileUrl: `/repository/certificates/${hv.maHocVien}_language_cert.pdf`,
        metadataJson: {
          certType: 'VSTEP',
          level: 'B2',
          issuedBy: 'Trung tâm Ngoại ngữ HVHC',
          issuedAt: '2025-05-20',
        },
        isPublic: false,
        createdBy: 'system',
        indexedAt: new Date('2025-05-20'),
      },
    });
    repoCreated++;
  }

  console.log(`  ✔ AcademicRepositoryItem tạo: ${repoCreated}\n`);

  // ─── Summary ──────────────────────────────────────────────────────────────
  console.log('📊 TỔNG KẾT:');
  const gpaCountRows = await prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*)::bigint AS count FROM student_gpa_histories
  `;
  const gpaCount = Number(gpaCountRows[0]?.count ?? 0);
  const [scoreHistCount, repoCount] = await Promise.all([
    prisma.scoreHistory.count(),
    prisma.academicRepositoryItem.count(),
  ]);
  console.log(`  StudentGpaHistory:      ${gpaCount}`);
  console.log(`  ScoreHistory:           ${scoreHistCount}`);
  console.log(`  AcademicRepositoryItem: ${repoCount}`);
  console.log('\n✅ Seed M10 GPA History & Repository hoàn tất!');
}

main()
  .catch(e => { console.error('❌ Error:', e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
