/**
 * Seed: Command Dashboard Sample Data
 * - Registrations (HocVien → Courses)
 * - GradeRecords (realistic distribution)
 * - WorkStatus diversity for users
 *
 * Run: npx tsx --require dotenv/config prisma/seed/seed_command_dashboard.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Fisher-Yates shuffle
function shuffle<T>(arr: T[], seed: number): T[] {
  const a = [...arr];
  let s = seed;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    const j = Math.abs(s) % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Realistic grade distribution (Vietnamese military academy)
// Score ranges: Xuất sắc ≥8.5 (20%), Giỏi 7-8.4 (35%), Khá 5.5-6.9 (30%), TB 4-5.4 (10%), Yếu <4 (5%)
function randomScore(seed: number): number {
  const s = (seed * 1664525 + 1013904223) & 0xffffffff;
  const r = (Math.abs(s) % 1000) / 1000;
  if (r < 0.20) return 8.5 + ((Math.abs(s >> 8) % 15) / 10);   // 8.5–10.0
  if (r < 0.55) return 7.0 + ((Math.abs(s >> 4) % 14) / 10);   // 7.0–8.4
  if (r < 0.85) return 5.5 + ((Math.abs(s >> 2) % 14) / 10);   // 5.5–6.8
  if (r < 0.95) return 4.0 + ((Math.abs(s >> 6) % 15) / 10);   // 4.0–5.4
  return 2.0 + ((Math.abs(s >> 10) % 20) / 10);                  // 2.0–3.9
}

function letterGrade(score: number): string {
  if (score >= 9.0) return 'A+';
  if (score >= 8.5) return 'A';
  if (score >= 8.0) return 'B+';
  if (score >= 7.0) return 'B';
  if (score >= 6.5) return 'C+';
  if (score >= 5.5) return 'C';
  if (score >= 5.0) return 'D+';
  if (score >= 4.0) return 'D';
  return 'F';
}

async function main() {
  console.log('=== Seed: Command Dashboard Data ===\n');

  // ── 1. WorkStatus diversity ──────────────────────────────────────────────
  console.log('1. Updating workStatus diversity…');

  const allUsers = await prisma.user.findMany({
    select: { id: true, role: true },
    orderBy: { id: 'asc' },
  });

  // Non-command roles can have varied statuses (exclude admins/command)
  const eligibleUsers = allUsers.filter(u =>
    !['QUAN_TRI_HE_THONG', 'ADMIN', 'CHI_HUY_HOC_VIEN'].includes(u.role)
  );

  // Distribution: ACTIVE 78%, TRANSFERRED 10%, RETIRED 7%, SUSPENDED 3%, RESIGNED 2%
  const total = eligibleUsers.length;
  const counts = {
    TRANSFERRED: Math.round(total * 0.10),
    RETIRED:     Math.round(total * 0.07),
    SUSPENDED:   Math.round(total * 0.03),
    RESIGNED:    Math.round(total * 0.02),
  };

  const shuffled = shuffle(eligibleUsers, 20260319);
  let idx = 0;

  for (const [status, count] of Object.entries(counts)) {
    const slice = shuffled.slice(idx, idx + count);
    if (slice.length > 0) {
      await prisma.user.updateMany({
        where: { id: { in: slice.map(u => u.id) } },
        data: { workStatus: status as any },
      });
      console.log(`   ${status}: ${slice.length} users`);
    }
    idx += count;
  }
  const remaining = total - idx;
  console.log(`   ACTIVE: ${remaining} users (unchanged)`);

  // ── 2. Registrations + GradeRecords ─────────────────────────────────────
  console.log('\n2. Creating registrations and grade records…');

  const existingRegCount = await prisma.registration.count();
  if (existingRegCount > 0) {
    console.log(`   Already have ${existingRegCount} registrations — skipping`);
  } else {
    const hocViens = await prisma.hocVien.findMany({ select: { id: true } });
    const courses   = await prisma.course.findMany({
      select: { id: true, semester: true, year: true, departmentId: true },
    });

    const hk1Courses = courses.filter(c => c.semester === 'HK1' && c.year === 2025);
    const hk2Courses = courses.filter(c => c.semester === 'HK2' && c.year === 2025);

    console.log(`   HocVien: ${hocViens.length}, HK1 courses: ${hk1Courses.length}, HK2 courses: ${hk2Courses.length}`);

    // Get a grader userId
    const graderUser = await prisma.user.findFirst({
      where: { role: { in: ['GIANG_VIEN', 'CHU_NHIEM_BO_MON'] } },
      select: { id: true },
    });
    const graderId = graderUser?.id ?? null;

    let regCreated = 0;
    let gradeCreated = 0;

    // Each HocVien registers for ~8 HK1 courses + ~7 HK2 courses
    const COURSES_PER_HV_HK1 = 8;
    const COURSES_PER_HV_HK2 = 7;

    const registrationData: {
      id: string; hocVienId: string; courseId: string;
      status: string; registeredAt: Date; approvedAt: Date | null;
    }[] = [];

    const gradeData: {
      id: string; registrationId: string;
      midtermScore: number; finalScore: number;
      assignmentScore: number; attendanceScore: number;
      totalScore: number; letterGrade: string;
      status: string; gradedBy: string | null; gradedAt: Date;
    }[] = [];

    for (let hi = 0; hi < hocViens.length; hi++) {
      const hv = hocViens[hi];

      // HK1 2025 — COMPLETED (past semester)
      const hk1Shuffled = shuffle(hk1Courses, hi * 7 + 1);
      const hk1Selected = hk1Shuffled.slice(0, Math.min(COURSES_PER_HV_HK1, hk1Shuffled.length));

      for (let ci = 0; ci < hk1Selected.length; ci++) {
        const course = hk1Selected[ci];
        const regId = `reg_hk1_${hi}_${ci}_${Date.now()}`.replace(/[^a-z0-9_]/g, '').slice(0, 30);
        const regDate = new Date(2025, 1, 1 + (hi % 20)); // Feb 2025
        const approveDate = new Date(2025, 1, 5 + (hi % 15));

        registrationData.push({
          id: regId,
          hocVienId: hv.id,
          courseId: course.id,
          status: 'COMPLETED',
          registeredAt: regDate,
          approvedAt: approveDate,
        });

        // Grade
        const seed = hi * 1000 + ci * 37 + 42;
        const total = Math.min(10, Math.max(0, +randomScore(seed).toFixed(1)));
        const midterm  = Math.min(10, Math.max(0, +(total * 0.9 + (Math.abs(seed >> 3) % 20) / 10 - 1.0).toFixed(1)));
        const final    = Math.min(10, Math.max(0, +(total * 1.1 - (Math.abs(seed >> 5) % 15) / 10 + 0.5).toFixed(1)));
        const assign   = Math.min(10, Math.max(0, +(total * 0.95 + (Math.abs(seed >> 7) % 10) / 10 - 0.5).toFixed(1)));
        const attend   = Math.min(10, Math.max(7, +(8 + (Math.abs(seed >> 9) % 20) / 10).toFixed(1)));
        const gradeDate = new Date(2025, 5, 15 + (hi % 10)); // Jun 2025

        gradeData.push({
          id: `grade_hk1_${hi}_${ci}_${Date.now()}`.replace(/[^a-z0-9_]/g, '').slice(0, 30),
          registrationId: regId,
          midtermScore: midterm,
          finalScore: final,
          assignmentScore: assign,
          attendanceScore: attend,
          totalScore: total,
          letterGrade: letterGrade(total),
          status: 'FINALIZED',
          gradedBy: graderId,
          gradedAt: gradeDate,
        });
        regCreated++;
        gradeCreated++;
      }

      // HK2 2025 — APPROVED (current semester, no grades yet for ~30%)
      const hk2Shuffled = shuffle(hk2Courses, hi * 11 + 3);
      const hk2Selected = hk2Shuffled.slice(0, Math.min(COURSES_PER_HV_HK2, hk2Shuffled.length));

      for (let ci = 0; ci < hk2Selected.length; ci++) {
        const course = hk2Selected[ci];
        const regId = `reg_hk2_${hi}_${ci}_${Date.now() + 1}`.replace(/[^a-z0-9_]/g, '').slice(0, 30);
        const regDate = new Date(2025, 7, 1 + (hi % 20)); // Aug 2025
        const hasGrade = (hi * 7 + ci) % 10 < 7; // 70% graded

        registrationData.push({
          id: regId,
          hocVienId: hv.id,
          courseId: course.id,
          status: hasGrade ? 'COMPLETED' : 'APPROVED',
          registeredAt: regDate,
          approvedAt: new Date(2025, 7, 5 + (hi % 15)),
        });

        if (hasGrade) {
          const seed = hi * 2000 + ci * 53 + 99;
          const total = Math.min(10, Math.max(0, +randomScore(seed).toFixed(1)));
          const midterm  = Math.min(10, Math.max(0, +(total * 0.9 + (Math.abs(seed >> 3) % 20) / 10 - 1.0).toFixed(1)));
          const final    = Math.min(10, Math.max(0, +(total * 1.1 - (Math.abs(seed >> 5) % 15) / 10 + 0.5).toFixed(1)));
          const assign   = Math.min(10, Math.max(0, +(total * 0.95 + (Math.abs(seed >> 7) % 10) / 10 - 0.5).toFixed(1)));
          const attend   = Math.min(10, Math.max(7, +(8 + (Math.abs(seed >> 9) % 20) / 10).toFixed(1)));
          const gradeDate = new Date(2026, 0, 10 + (hi % 20)); // Jan 2026

          gradeData.push({
            id: `grade_hk2_${hi}_${ci}_${Date.now() + 1}`.replace(/[^a-z0-9_]/g, '').slice(0, 30),
            registrationId: regId,
            midtermScore: midterm,
            finalScore: final,
            assignmentScore: assign,
            attendanceScore: attend,
            totalScore: total,
            letterGrade: letterGrade(total),
            status: 'FINALIZED',
            gradedBy: graderId,
            gradedAt: gradeDate,
          });
          gradeCreated++;
        }
        regCreated++;
      }
    }

    // Batch insert registrations
    console.log(`   Inserting ${registrationData.length} registrations…`);
    for (let i = 0; i < registrationData.length; i += 200) {
      await prisma.registration.createMany({
        data: registrationData.slice(i, i + 200) as any,
        skipDuplicates: true,
      });
      process.stdout.write(`\r   Progress: ${Math.min(i + 200, registrationData.length)}/${registrationData.length}`);
    }
    console.log(`\n   ✓ ${regCreated} registrations created`);

    // Batch insert grades
    console.log(`   Inserting ${gradeData.length} grade records…`);
    for (let i = 0; i < gradeData.length; i += 200) {
      await prisma.gradeRecord.createMany({
        data: gradeData.slice(i, i + 200) as any,
        skipDuplicates: true,
      });
      process.stdout.write(`\r   Progress: ${Math.min(i + 200, gradeData.length)}/${gradeData.length}`);
    }
    console.log(`\n   ✓ ${gradeCreated} grade records created`);
  }

  // ── 3. Verify final counts ───────────────────────────────────────────────
  console.log('\n3. Verifying final counts…');
  const [regCount, gradeCount, workDist] = await Promise.all([
    prisma.registration.count(),
    prisma.gradeRecord.count(),
    prisma.user.groupBy({ by: ['workStatus'], _count: { id: true } }),
  ]);

  console.log(`   Registrations : ${regCount}`);
  console.log(`   Grade records : ${gradeCount}`);
  console.log('   WorkStatus distribution:');
  for (const w of workDist) {
    console.log(`     ${w.workStatus}: ${w._count.id}`);
  }

  // ── 4. Compute and show training metrics ─────────────────────────────────
  const grades = await prisma.gradeRecord.findMany({
    where: { totalScore: { not: null } },
    select: { totalScore: true },
  });
  if (grades.length > 0) {
    const avg = grades.reduce((s, g) => s + (g.totalScore ?? 0), 0) / grades.length;
    const passRate = (grades.filter(g => (g.totalScore ?? 0) >= 5.0).length / grades.length) * 100;
    const excRate  = (grades.filter(g => (g.totalScore ?? 0) >= 8.5).length / grades.length) * 100;
    console.log(`\n   Training metrics:`);
    console.log(`     Average grade   : ${avg.toFixed(2)}/10`);
    console.log(`     Pass rate       : ${passRate.toFixed(1)}%`);
    console.log(`     Excellence rate : ${excRate.toFixed(1)}%`);
  }

  console.log('\n✅ Seed complete!');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
