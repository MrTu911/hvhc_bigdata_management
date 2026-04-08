/**
 * Seed: teaching_statistics – Thống kê giảng dạy theo giảng viên
 * ----------------------------------------------------------------
 * Tổng hợp dữ liệu thực từ class_sections + class_enrollments
 * để tạo bản ghi teaching_statistics cho từng giảng viên / học kỳ.
 *
 * Chạy: npx tsx --require dotenv/config prisma/seed/seed_teaching_statistics.ts
 */

import { PrismaClient } from '@prisma/client';
import 'dotenv/config';

const prisma = new PrismaClient();

function rand(min: number, max: number, seed: number): number {
  const r = Math.abs(Math.sin(seed * 7919 + 1234) * 9999) % 1;
  return parseFloat((min + r * (max - min)).toFixed(2));
}

async function main() {
  console.log('=== Seed: teaching_statistics ===\n');

  const TERM_HK1 = 'cmmuk91cs00018i4g3akr27ov'; // HK1-2025-2026
  const TERM_HK2 = 'cmmuk91cx00038i4g06fvmbie'; // HK2-2025-2026
  const ACADEMIC_YEAR_ID = 'cmmuk90rv00008i26sm2sjmqi';

  // Lấy danh sách giảng viên có class_sections
  const facultyWithSections = await prisma.facultyProfile.findMany({
    where: {
      classSections: { some: {} },
    },
    select: {
      id: true,
      classSections: {
        select: {
          id: true,
          termId: true,
          currentStudents: true,
          enrollments: {
            select: {
              totalScore: true,
              gradeStatus: true,
            },
          },
        },
      },
    },
  });

  console.log(`Giảng viên có lớp học: ${facultyWithSections.length}`);

  let created = 0;
  let skipped = 0;

  for (const faculty of facultyWithSections) {
    // Nhóm sections theo termId
    const termGroups = new Map<string, typeof faculty.classSections>();
    for (const section of faculty.classSections) {
      const termId = section.termId;
      if (!termGroups.has(termId)) termGroups.set(termId, []);
      termGroups.get(termId)!.push(section);
    }

    // Chỉ seed cho HK1 và HK2 của năm học 2025-2026
    for (const termId of [TERM_HK1, TERM_HK2]) {
      const sections = termGroups.get(termId) || [];

      // Nếu không có sections trong kỳ này, tạo bản ghi rỗng (tránh FK thiếu)
      const totalCourses = sections.length;
      const totalStudents = sections.reduce((sum, s) => sum + (s.currentStudents || 0), 0);

      // Tính pass rate từ enrollments thực tế
      const allEnrollments = sections.flatMap(s => s.enrollments);
      const graded = allEnrollments.filter(e => e.totalScore !== null);
      const passed = graded.filter(e => (e.totalScore ?? 0) >= 5).length;
      const avgPassRate = graded.length > 0 ? passed / graded.length : rand(0.75, 0.95, faculty.id.charCodeAt(0));
      const avgGrade = graded.length > 0
        ? graded.reduce((sum, e) => sum + (e.totalScore ?? 0), 0) / graded.length
        : rand(6.5, 8.5, faculty.id.charCodeAt(2));

      const seed = faculty.id.charCodeAt(0) + (termId === TERM_HK1 ? 0 : 100);

      try {
        await prisma.teachingStatistics.upsert({
          where: { facultyId_termId: { facultyId: faculty.id, termId } },
          create: {
            facultyId: faculty.id,
            termId,
            academicYearId: ACADEMIC_YEAR_ID,
            totalCourses,
            totalStudents,
            totalSessions: totalCourses * rand(15, 30, seed),
            totalHours: totalCourses * rand(30, 45, seed + 1),
            avgAttendanceRate: rand(0.88, 0.98, seed + 2),
            avgPassRate: parseFloat(avgPassRate.toFixed(3)),
            avgGrade: parseFloat(avgGrade.toFixed(2)),
            evaluationScore: rand(7.5, 9.5, seed + 3),
            evaluationCount: Math.floor(rand(10, 40, seed + 4)),
            calculatedAt: new Date(),
          },
          update: {
            totalCourses,
            totalStudents,
            avgPassRate: parseFloat(avgPassRate.toFixed(3)),
            avgGrade: parseFloat(avgGrade.toFixed(2)),
            calculatedAt: new Date(),
          },
        });
        created++;
      } catch (err: any) {
        console.warn(`  ⚠ Bỏ qua ${faculty.id} / ${termId}: ${err.message}`);
        skipped++;
      }
    }
  }

  const total = await prisma.teachingStatistics.count();
  console.log(`\n✓ Đã tạo/cập nhật: ${created} bản ghi (bỏ qua: ${skipped})`);
  console.log(`✓ Tổng teaching_statistics: ${total}`);
  console.log('\nHoàn thành!');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
