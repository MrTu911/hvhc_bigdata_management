/**
 * Seed: M10 Exam Data
 * Tạo dữ liệu mẫu hệ thống thi cử (M10 UC-58):
 *   - ExamPlan (kế hoạch thi cho từng học kỳ)
 *   - ExamSession (ca thi: môn, ngày, phòng, giám thị)
 *   - ExamRegistration (học viên đăng ký dự thi)
 *
 * Phụ thuộc:
 *   - Term (HK1-2025, HK2-2025 từ seed_education.ts)
 *   - Room (P101, P102, TH01... từ seed_education.ts)
 *   - HocVien (từ seed_hocvien_v2.ts)
 *   - FacultyProfile (từ seed_faculty_profiles.ts)
 *
 * Run: npx tsx --require dotenv/config prisma/seed/seed_m10_exam_data.ts
 */

import { PrismaClient } from '@prisma/client';
import 'dotenv/config';

const prisma = new PrismaClient();

function pick<T>(arr: T[], seed: number): T {
  return arr[Math.abs(seed) % arr.length];
}

// Tập môn thi căn bản của chương trình CNTT-DH
const EXAM_SUBJECTS = [
  { code: 'CNTT101', name: 'Tin học đại cương' },
  { code: 'CNTT201', name: 'Lập trình cơ bản' },
  { code: 'CNTT202', name: 'Cấu trúc dữ liệu và giải thuật' },
  { code: 'CNTT301', name: 'Cơ sở dữ liệu' },
  { code: 'CNTT302', name: 'Mạng máy tính' },
  { code: 'CNTT403', name: 'An toàn thông tin' },
  { code: 'KHCB101', name: 'Toán cao cấp' },
  { code: 'KHCB201', name: 'Xác suất thống kê' },
  { code: 'NN101',   name: 'Tiếng Anh cơ bản 1' },
  { code: 'NN102',   name: 'Tiếng Anh cơ bản 2' },
  { code: 'LLCT101', name: 'Triết học Mác-Lênin' },
  { code: 'LLCT102', name: 'Kinh tế chính trị Mác-Lênin' },
];

// Các ca thi trong ngày
const TIME_SLOTS = [
  { start: '07:30', end: '09:30' },
  { start: '10:00', end: '12:00' },
  { start: '13:30', end: '15:30' },
  { start: '16:00', end: '18:00' },
];

async function main() {
  console.log('📝 Bắt đầu seed M10 Exam Data...\n');

  // ─── Load dependencies ──────────────────────────────────────────────────────
  const terms = await prisma.term.findMany({
    where: { code: { in: ['HK1-2025', 'HK2-2025'] } },
  });
  if (terms.length === 0) {
    throw new Error('Không tìm thấy Term. Hãy chạy seed_education.ts trước.');
  }

  const rooms = await prisma.room.findMany({
    where: { isActive: true },
    orderBy: { code: 'asc' },
  });
  if (rooms.length === 0) {
    throw new Error('Không tìm thấy Room. Hãy chạy seed_education.ts trước.');
  }

  const faculty = await prisma.facultyProfile.findMany({
    where: { isActive: true },
    select: { id: true },
    take: 30,
  });

  const allHocVien = await prisma.hocVien.findMany({
    where: { deletedAt: null },
    select: { id: true },
    orderBy: { maHocVien: 'asc' },
  });
  if (allHocVien.length === 0) {
    throw new Error('Không có HocVien. Hãy chạy seed_hocvien_v2.ts trước.');
  }

  // ─── 1. ExamPlan ─────────────────────────────────────────────────────────────
  console.log('1️⃣  Tạo ExamPlan...');

  const examPlanDefs = [
    {
      termCode: 'HK1-2025',
      plans: [
        {
          code: 'KHT-GK-HK1-2025',
          name: 'Kế hoạch thi giữa kỳ HK1 năm học 2025-2026',
          examType: 'MIDTERM' as const,
          startDate: new Date('2025-10-15'),
          endDate: new Date('2025-10-20'),
          registrationDeadline: new Date('2025-10-10'),
          description: 'Kỳ thi giữa kỳ học kỳ 1 năm học 2025-2026',
          rules: 'Học viên phải có thẻ sinh viên. Không được mang tài liệu vào phòng thi trừ khi được phép.',
        },
        {
          code: 'KHT-CK-HK1-2025',
          name: 'Kế hoạch thi cuối kỳ HK1 năm học 2025-2026',
          examType: 'FINAL' as const,
          startDate: new Date('2025-12-15'),
          endDate: new Date('2025-12-25'),
          registrationDeadline: new Date('2025-12-10'),
          description: 'Kỳ thi cuối học kỳ 1 năm học 2025-2026',
          rules: 'Học viên phải đảm bảo điều kiện dự thi: chuyên cần >= 80%, nộp đủ bài tập.',
        },
      ],
    },
    {
      termCode: 'HK2-2025',
      plans: [
        {
          code: 'KHT-GK-HK2-2025',
          name: 'Kế hoạch thi giữa kỳ HK2 năm học 2025-2026',
          examType: 'MIDTERM' as const,
          startDate: new Date('2026-03-15'),
          endDate: new Date('2026-03-20'),
          registrationDeadline: new Date('2026-03-10'),
          description: 'Kỳ thi giữa kỳ học kỳ 2 năm học 2025-2026',
          rules: 'Học viên phải có thẻ sinh viên. Không được mang tài liệu vào phòng thi trừ khi được phép.',
        },
        {
          code: 'KHT-CK-HK2-2025',
          name: 'Kế hoạch thi cuối kỳ HK2 năm học 2025-2026',
          examType: 'FINAL' as const,
          startDate: new Date('2026-05-25'),
          endDate: new Date('2026-06-05'),
          registrationDeadline: new Date('2026-05-20'),
          description: 'Kỳ thi cuối học kỳ 2 năm học 2025-2026',
          rules: 'Học viên phải đảm bảo điều kiện dự thi: chuyên cần >= 80%, nộp đủ bài tập.',
        },
        {
          code: 'KHT-BX-HK2-2025',
          name: 'Kế hoạch thi bổ sung HK2 năm học 2025-2026',
          examType: 'SUPPLEMENTARY' as const,
          startDate: new Date('2026-06-20'),
          endDate: new Date('2026-06-25'),
          registrationDeadline: new Date('2026-06-15'),
          description: 'Kỳ thi bổ sung dành cho học viên thi lại các môn chưa đạt',
          rules: 'Chỉ học viên có kết quả thi lần đầu không đạt (dưới 5.0) mới được đăng ký.',
        },
      ],
    },
  ];

  const examPlanMap = new Map<string, string>(); // code → id
  let planCreated = 0;

  for (const termDef of examPlanDefs) {
    const term = terms.find(t => t.code === termDef.termCode);
    if (!term) continue;

    for (const plan of termDef.plans) {
      const existing = await prisma.examPlan.findUnique({ where: { code: plan.code } });
      if (existing) {
        examPlanMap.set(plan.code, existing.id);
        continue;
      }

      const created = await prisma.examPlan.create({
        data: {
          ...plan,
          termId: term.id,
          status: 'PUBLISHED',
          isPublished: true,
          publishedAt: new Date(),
        },
      });
      examPlanMap.set(plan.code, created.id);
      planCreated++;
    }
  }
  console.log(`  ✔ ExamPlan tạo: ${planCreated} (bỏ qua đã có)\n`);

  // ─── 2. ExamSession ───────────────────────────────────────────────────────────
  console.log('2️⃣  Tạo ExamSession...');

  // Phòng lý thuyết dùng cho thi viết
  const theoryRooms = rooms.filter(r => r.roomType === 'THEORY' || r.roomType === 'SEMINAR');
  const computerRooms = rooms.filter(r => r.roomType === 'COMPUTER');
  const langRooms = rooms.filter(r => r.roomType === 'LANGUAGE');

  type ExamSessionDef = {
    planCode: string;
    subject: { code: string; name: string };
    examDate: Date;
    slotIdx: number;
    examFormat: 'WRITTEN' | 'MULTIPLE_CHOICE' | 'ORAL' | 'PRACTICAL' | 'PROJECT' | 'MIXED';
    duration: number;
    maxStudents: number;
  };

  // Tạo ca thi cho mỗi môn trong kế hoạch CK-HK1 và GK-HK1
  const sessionDefs: ExamSessionDef[] = [];

  // Cuối kỳ HK1: tất cả môn, thi viết
  for (let i = 0; i < EXAM_SUBJECTS.length; i++) {
    const dayOffset = Math.floor(i / 4); // 4 môn/ngày
    const slot = i % 4;
    sessionDefs.push({
      planCode: 'KHT-CK-HK1-2025',
      subject: EXAM_SUBJECTS[i],
      examDate: new Date(2025, 11, 15 + dayOffset), // Dec 15+
      slotIdx: slot,
      examFormat: EXAM_SUBJECTS[i].code.startsWith('NN') ? 'MIXED' :
                  EXAM_SUBJECTS[i].code.startsWith('CNTT4') ? 'PRACTICAL' : 'WRITTEN',
      duration: 90,
      maxStudents: 50,
    });
  }

  // Giữa kỳ HK1: 6 môn đầu
  for (let i = 0; i < 6; i++) {
    sessionDefs.push({
      planCode: 'KHT-GK-HK1-2025',
      subject: EXAM_SUBJECTS[i],
      examDate: new Date(2025, 9, 15 + Math.floor(i / 3)), // Oct 15+
      slotIdx: i % 3,
      examFormat: 'WRITTEN',
      duration: 60,
      maxStudents: 50,
    });
  }

  // Cuối kỳ HK2: 8 môn, thi trắc nghiệm + tự luận
  for (let i = 0; i < 8; i++) {
    const dayOffset = Math.floor(i / 4);
    const slot = i % 4;
    sessionDefs.push({
      planCode: 'KHT-CK-HK2-2025',
      subject: EXAM_SUBJECTS[i],
      examDate: new Date(2026, 4, 25 + dayOffset), // May 25+
      slotIdx: slot,
      examFormat: i % 3 === 0 ? 'MULTIPLE_CHOICE' : 'WRITTEN',
      duration: 90,
      maxStudents: 50,
    });
  }

  // Bổ sung HK2: 4 môn khó
  const HARD_SUBJECTS = [EXAM_SUBJECTS[1], EXAM_SUBJECTS[2], EXAM_SUBJECTS[6], EXAM_SUBJECTS[7]];
  for (let i = 0; i < HARD_SUBJECTS.length; i++) {
    sessionDefs.push({
      planCode: 'KHT-BX-HK2-2025',
      subject: HARD_SUBJECTS[i],
      examDate: new Date(2026, 5, 20 + i), // Jun 20+
      slotIdx: 0,
      examFormat: 'WRITTEN',
      duration: 90,
      maxStudents: 30,
    });
  }

  const examSessionMap = new Map<string, string>(); // code → id
  let sessionCreated = 0;

  for (let i = 0; i < sessionDefs.length; i++) {
    const def = sessionDefs[i];
    const planId = examPlanMap.get(def.planCode);
    if (!planId) continue;

    const sessionCode = `${def.planCode}-${def.subject.code}-${i}`;
    const timeSlot = TIME_SLOTS[def.slotIdx % TIME_SLOTS.length];

    // Chọn phòng phù hợp với loại thi
    let roomPool = theoryRooms;
    if (def.examFormat === 'PRACTICAL' || def.examFormat === 'MULTIPLE_CHOICE') {
      roomPool = computerRooms.length > 0 ? computerRooms : theoryRooms;
    } else if (def.subject.code.startsWith('NN')) {
      roomPool = langRooms.length > 0 ? langRooms : theoryRooms;
    }
    const room = roomPool.length > 0 ? pick(roomPool, i) : pick(rooms, i);
    const supervisor = faculty.length > 0 ? pick(faculty, i) : null;

    const existing = await prisma.examSession.findUnique({ where: { code: sessionCode } });
    if (existing) {
      examSessionMap.set(sessionCode, existing.id);
      continue;
    }

    const created = await prisma.examSession.create({
      data: {
        code: sessionCode,
        examPlanId: planId,
        subjectCode: def.subject.code,
        subjectName: def.subject.name,
        examDate: def.examDate,
        startTime: timeSlot.start,
        endTime: timeSlot.end,
        duration: def.duration,
        roomId: room.id,
        maxStudents: def.maxStudents,
        supervisorId: supervisor?.id ?? null,
        examFormat: def.examFormat,
        status: def.examDate < new Date() ? 'COMPLETED' : 'SCHEDULED',
        instructions: `Học viên cần mang thẻ học viên. Vào phòng thi trước 15 phút. Không sử dụng điện thoại trong phòng thi.`,
      },
    });
    examSessionMap.set(sessionCode, created.id);
    sessionCreated++;
  }
  console.log(`  ✔ ExamSession tạo: ${sessionCreated}\n`);

  // ─── 3. ExamRegistration ──────────────────────────────────────────────────────
  console.log('3️⃣  Tạo ExamRegistration...');
  let regCreated = 0;

  // Mỗi ca thi CK-HK1 nhận 30–45 học viên
  const ckHk1Sessions = Array.from(examSessionMap.entries())
    .filter(([code]) => code.startsWith('KHT-CK-HK1-2025'));

  for (let si = 0; si < ckHk1Sessions.length; si++) {
    const [, sessionId] = ckHk1Sessions[si];
    const studentCount = 30 + (si % 16); // 30–45 học viên / ca
    const sessionStudents = allHocVien.slice(
      (si * 30) % Math.max(1, allHocVien.length - 30),
      (si * 30) % Math.max(1, allHocVien.length - 30) + studentCount,
    );

    for (let k = 0; k < sessionStudents.length; k++) {
      const hv = sessionStudents[k];
      const existing = await prisma.examRegistration.findUnique({
        where: { examSessionId_hocVienId: { examSessionId: sessionId, hocVienId: hv.id } },
      });
      if (existing) continue;

      // Phân bổ kết quả: 80% hoàn thành (COMPLETED), 10% vắng (ABSENT), 10% đã đăng ký (REGISTERED)
      const rand = (si * 31 + k * 17) % 10;
      const status: 'COMPLETED' | 'ABSENT' | 'REGISTERED' =
        rand < 8 ? 'COMPLETED' : rand < 9 ? 'ABSENT' : 'REGISTERED';
      const score =
        status === 'COMPLETED'
          ? parseFloat(Math.min(10, Math.max(3, 5 + ((si * 7 + k * 13) % 50) / 10)).toFixed(1))
          : null;

      await prisma.examRegistration.create({
        data: {
          examSessionId: sessionId,
          hocVienId: hv.id,
          seatNumber: `${String.fromCharCode(65 + (k % 5))}${String(k + 1).padStart(2, '0')}`,
          status,
          checkInTime: status !== 'REGISTERED' ? new Date('2025-12-15T07:25:00') : null,
          score,
          notes: status === 'ABSENT' ? 'Vắng có phép/không phép' : null,
        },
      });
      regCreated++;
    }
  }

  // Ca thi bổ sung: chỉ học viên có điểm thấp đăng ký
  const bxSessions = Array.from(examSessionMap.entries())
    .filter(([code]) => code.startsWith('KHT-BX-HK2-2025'));

  for (let si = 0; si < bxSessions.length; si++) {
    const [, sessionId] = bxSessions[si];
    // 10–15 học viên thi lại
    const startIdx = (si * 10) % Math.max(1, allHocVien.length - 15);
    const bxStudents = allHocVien.slice(startIdx, startIdx + 12);

    for (let k = 0; k < bxStudents.length; k++) {
      const hv = bxStudents[k];
      const existing = await prisma.examRegistration.findUnique({
        where: { examSessionId_hocVienId: { examSessionId: sessionId, hocVienId: hv.id } },
      });
      if (existing) continue;

      await prisma.examRegistration.create({
        data: {
          examSessionId: sessionId,
          hocVienId: hv.id,
          seatNumber: `BX-${String(k + 1).padStart(2, '0')}`,
          status: 'REGISTERED',
          notes: 'Đăng ký thi bổ sung lần 1',
        },
      });
      regCreated++;
    }
  }

  console.log(`  ✔ ExamRegistration tạo: ${regCreated}\n`);

  // Cập nhật registeredCount cho từng ExamSession
  console.log('4️⃣  Cập nhật registeredCount cho ExamSession...');
  for (const [, sessionId] of Array.from(examSessionMap)) {
    const count = await prisma.examRegistration.count({ where: { examSessionId: sessionId } });
    await prisma.examSession.update({
      where: { id: sessionId },
      data: { registeredCount: count },
    });
  }
  console.log('  ✔ registeredCount cập nhật xong\n');

  // ─── Summary ──────────────────────────────────────────────────────────────
  console.log('📊 TỔNG KẾT:');
  const [planCount, sessionCount, regCount] = await Promise.all([
    prisma.examPlan.count(),
    prisma.examSession.count(),
    prisma.examRegistration.count(),
  ]);
  console.log(`  ExamPlan:         ${planCount}`);
  console.log(`  ExamSession:      ${sessionCount}`);
  console.log(`  ExamRegistration: ${regCount}`);
  console.log('\n✅ Seed M10 Exam Data hoàn tất!');
}

main()
  .catch(e => { console.error('❌ Error:', e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
