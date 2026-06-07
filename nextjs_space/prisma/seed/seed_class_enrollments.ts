/**
 * Seed: ClassEnrollment (M10 backbone — ghi danh học viên vào lớp học phần + điểm)
 *
 * Lý do tồn tại riêng (không gộp vào seed_hocvien_v2.ts):
 *   - seed_hocvien_v2.ts tạo ClassEnrollment BÊN TRONG nhánh "tạo HocVien mới",
 *     nên trên DB đã có học viên thì không bao giờ ghi danh được (idempotency gap).
 *   - ClassSection được seed ở step 52 (sau step 51 students) nên lúc 51 chạy
 *     chưa có lớp học phần → enrollment = 0.
 *   File này ghi danh cho TẤT CẢ HocVien hiện có vào ClassSection hiện có, chạy
 *   được nhiều lần (idempotent qua unique [classSectionId, hocVienId]).
 *
 * Phụ thuộc (phải chạy TRƯỚC file này):
 *   - HocVien   (seed_hocvien_v2.ts — step 51)
 *   - ClassSection (seed_teaching_data.ts — step 52)
 *
 * Là nguồn dữ liệu cho:
 *   - ScoreHistory + StudentGpaHistory (seed_m10_gpa_history.ts — step 53)
 *
 * Run: npx tsx --require dotenv/config prisma/seed/seed_class_enrollments.ts
 */
import { PrismaClient, EnrollmentStatus, GradeStatus } from '@prisma/client';
import 'dotenv/config';

const prisma = new PrismaClient();

/** Số lớp học phần mỗi học viên ghi danh (số môn có điểm). */
const ENROLL_PER_STUDENT = 6;

/** Deterministic pseudo-random trong [min, max) để dữ liệu tái lập được. */
function pseudoRand(seed: number, min: number, max: number): number {
  const r = Math.abs(Math.sin(seed * 127.1 + 311.7) * 43758.5453) % 1;
  return min + r * (max - min);
}

function round1(n: number): number {
  return parseFloat(n.toFixed(1));
}

function toLetterGrade(total: number): string {
  if (total >= 9.0) return 'A+';
  if (total >= 8.5) return 'A';
  if (total >= 8.0) return 'B+';
  if (total >= 7.0) return 'B';
  if (total >= 6.5) return 'C+';
  if (total >= 5.5) return 'C';
  if (total >= 5.0) return 'D';
  return 'F';
}

/** Chọn ENROLL_PER_STUDENT lớp học phần phân tán đều, không trùng, cho 1 học viên. */
function pickSectionsForStudent(studentIndex: number, sectionCount: number): number[] {
  const picked = new Set<number>();
  let step = 0;
  while (picked.size < Math.min(ENROLL_PER_STUDENT, sectionCount)) {
    const idx = Math.abs(
      Math.floor(pseudoRand(studentIndex * 31 + step * 7, 0, sectionCount))
    ) % sectionCount;
    picked.add(idx);
    step++;
    if (step > sectionCount * 3) break; // an toàn vòng lặp
  }
  return [...picked];
}

async function main() {
  console.log('🎓 Seeding ClassEnrollment (ghi danh + điểm học phần)...\n');

  const students = await prisma.hocVien.findMany({
    where: { deletedAt: null },
    select: { id: true, maHocVien: true, diemTrungBinh: true, trangThai: true },
    orderBy: { maHocVien: 'asc' },
  });
  const sections = await prisma.classSection.findMany({
    select: { id: true, maxStudents: true },
    orderBy: { code: 'asc' },
  });

  if (students.length === 0) throw new Error('Không có HocVien. Chạy seed_hocvien_v2.ts trước.');
  if (sections.length === 0) throw new Error('Không có ClassSection. Chạy seed_teaching_data.ts trước.');

  // Idempotency: nạp các cặp đã ghi danh + sức chứa còn lại của từng lớp.
  const existing = await prisma.classEnrollment.findMany({
    select: { classSectionId: true, hocVienId: true },
  });
  const enrolledPairs = new Set(existing.map(e => `${e.classSectionId}|${e.hocVienId}`));
  const sectionLoad = new Map<string, number>();
  for (const e of existing) {
    sectionLoad.set(e.classSectionId, (sectionLoad.get(e.classSectionId) ?? 0) + 1);
  }

  let created = 0;
  let skippedExisting = 0;
  let skippedFull = 0;
  const touchedSections = new Set<string>();

  for (let i = 0; i < students.length; i++) {
    const student = students[i];
    const sectionIdxs = pickSectionsForStudent(i, sections.length);
    const baseGpa = student.diemTrungBinh ?? pseudoRand(i + 1, 5.5, 9.0);
    const isGraduated = student.trangThai === 'Tốt nghiệp';

    for (let k = 0; k < sectionIdxs.length; k++) {
      const section = sections[sectionIdxs[k]];
      const pairKey = `${section.id}|${student.id}`;

      if (enrolledPairs.has(pairKey)) { skippedExisting++; continue; }
      if ((sectionLoad.get(section.id) ?? 0) >= section.maxStudents) { skippedFull++; continue; }

      // Điểm dao động quanh GPA của học viên (giữ trong [3.0, 10.0]).
      const jitter = (s: number) => pseudoRand(i * 100 + k * 13 + s, -1.2, 1.2);
      const attendanceScore = round1(Math.min(10, Math.max(5, baseGpa + jitter(1))));
      const assignmentScore = round1(Math.min(10, Math.max(3, baseGpa + jitter(2))));
      const midtermScore = round1(Math.min(10, Math.max(3, baseGpa + jitter(3))));
      const finalScore = round1(Math.min(10, Math.max(3, baseGpa + jitter(4))));
      // Trọng số: chuyên cần 10% + thực hành 20% + giữa kỳ 20% + cuối kỳ 50%
      const totalScore = parseFloat(
        (attendanceScore * 0.1 + assignmentScore * 0.2 + midtermScore * 0.2 + finalScore * 0.5).toFixed(2)
      );
      const passFlag = totalScore >= 5.0;

      await prisma.classEnrollment.create({
        data: {
          classSectionId: section.id,
          hocVienId: student.id,
          status: isGraduated ? EnrollmentStatus.COMPLETED : EnrollmentStatus.ENROLLED,
          attendanceScore,
          assignmentScore,
          midtermScore,
          finalScore,
          totalScore,
          passFlag,
          letterGrade: toLetterGrade(totalScore),
          gradeStatus: passFlag ? GradeStatus.FINALIZED : GradeStatus.GRADED,
          gradedAt: new Date('2025-06-15'),
        },
      });

      enrolledPairs.add(pairKey);
      sectionLoad.set(section.id, (sectionLoad.get(section.id) ?? 0) + 1);
      touchedSections.add(section.id);
      created++;
    }
  }

  // Đồng bộ currentStudents để UI hiển thị sĩ số đúng.
  let sectionsUpdated = 0;
  for (const sectionId of touchedSections) {
    await prisma.classSection.update({
      where: { id: sectionId },
      data: { currentStudents: sectionLoad.get(sectionId) ?? 0 },
    });
    sectionsUpdated++;
  }

  const total = await prisma.classEnrollment.count();
  console.log('===== ENROLLMENT SUMMARY =====');
  console.log(`Học viên xét:            ${students.length}`);
  console.log(`Lớp học phần khả dụng:   ${sections.length}`);
  console.log(`Enrollment tạo mới:      ${created}`);
  console.log(`Bỏ qua (đã ghi danh):    ${skippedExisting}`);
  console.log(`Bỏ qua (lớp đầy):        ${skippedFull}`);
  console.log(`ClassSection cập nhật sĩ số: ${sectionsUpdated}`);
  console.log(`--- DB TOTAL ClassEnrollment: ${total} ---`);
  console.log('==============================\n');
}

main()
  .catch(e => { console.error('❌', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
