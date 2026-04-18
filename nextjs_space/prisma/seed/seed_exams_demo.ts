/**
 * seed_exams_demo.ts
 *
 * Tạo dữ liệu thi cho M10:
 *  1. Exam (lịch thi theo học phần courses) — bảng exams hiện tại rỗng
 *  2. ExamRegistration (đăng ký thi vào ExamSession) — thêm học viên chưa có
 *
 * Prerequisites: courses, rooms, faculty_profiles, exam_plans, exam_sessions,
 *                hoc_vien đã có dữ liệu
 * Run: npx tsx --require dotenv/config prisma/seed/seed_exams_demo.ts
 */

import { PrismaClient } from '@prisma/client'
import 'dotenv/config'

const db = new PrismaClient()

function daysFromNow(n: number): Date {
  const d = new Date()
  d.setDate(d.getDate() + n)
  d.setHours(8, 0, 0, 0)
  return d
}

function daysAgo(n: number): Date {
  const d = new Date()
  d.setDate(d.getDate() - n)
  d.setHours(8, 0, 0, 0)
  return d
}

async function main() {
  console.log('📝 seed_exams_demo.ts — Tạo lịch thi demo cho M10')

  // ── Part 1: Seed bảng `exams` (Exam model) ──────────────────────────────────
  await db.examRegistration.deleteMany({})
  await db.exam.deleteMany({})
  console.log('  → Đã xóa exams cũ')

  const courses = await db.course.findMany({
    where: { facultyId: { not: null }, isActive: true },
    select: { id: true, code: true, name: true, semester: true, facultyId: true, maxStudents: true },
    take: 15,
    orderBy: { code: 'asc' },
  })

  const rooms = await db.room.findMany({ select: { id: true } })
  const faculties = await db.facultyProfile.findMany({ select: { id: true }, take: 8 })

  const pickRoom = () => rooms[Math.floor(Math.random() * rooms.length)]?.id ?? null
  const pickFaculty = () => faculties[Math.floor(Math.random() * faculties.length)]?.id ?? null

  // Thi giữa kỳ đã qua + cuối kỳ sắp tới + thực hành
  const examSpecs = [
    ...courses.slice(0, 8).map((c, i) => ({
      courseId: c.id, examType: 'MIDTERM' as const,
      examDate: daysAgo(20 + i * 3), duration: 60, isPublished: true,
    })),
    ...courses.slice(0, 8).map((c, i) => ({
      courseId: c.id, examType: 'FINAL' as const,
      examDate: daysFromNow(7 + i * 2), duration: 90, isPublished: i < 5,
    })),
    ...courses.slice(0, 4).map((c, i) => ({
      courseId: c.id, examType: 'PRACTICAL' as const,
      examDate: daysFromNow(30 + i * 5), duration: 120, isPublished: false,
    })),
    ...courses.slice(0, 3).map((c, i) => ({
      courseId: c.id, examType: 'ORAL' as const,
      examDate: daysFromNow(40 + i * 3), duration: 20, isPublished: false,
    })),
  ]

  let examCount = 0
  for (const spec of examSpecs) {
    await db.exam.create({
      data: {
        courseId: spec.courseId,
        examType: spec.examType,
        examDate: spec.examDate,
        duration: spec.duration,
        roomId: pickRoom(),
        invigilatorId: pickFaculty(),
        maxStudents: 50,
        instructions: spec.examType === 'FINAL'
          ? 'Học viên mang thẻ học viên. Không được sử dụng tài liệu. Thời gian 90 phút.'
          : spec.examType === 'MIDTERM'
          ? 'Kiểm tra 60 phút. Được phép tham khảo 1 tờ A4 ghi chú.'
          : spec.examType === 'PRACTICAL'
          ? 'Thi thực hành 120 phút — chuẩn bị đủ dụng cụ theo yêu cầu.'
          : 'Thi vấn đáp — bốc thăm câu hỏi, chuẩn bị 10 phút.',
        isPublished: spec.isPublished,
      },
    })
    examCount++
  }
  console.log(`  → Đã tạo ${examCount} exam records`)

  // ── Part 2: ExamRegistration cho ExamSession đã có ──────────────────────────
  const examSessions = await db.examSession.findMany({
    select: { id: true, registeredCount: true, maxStudents: true },
    where: { status: { in: ['SCHEDULED', 'ONGOING'] } },
    take: 10,
  })

  const hocVienList = await db.hocVien.findMany({
    select: { id: true },
    take: 30,
  })

  if (hocVienList.length === 0 || examSessions.length === 0) {
    console.log('  ⚠️  Không có exam sessions hoặc học viên để tạo registrations')
    console.log(`  ✅ Hoàn thành: ${examCount} exams tạo mới`)
    return
  }

  let regCount = 0
  for (const session of examSessions) {
    const capacity = Math.min(session.maxStudents, 20)
    const students = hocVienList.slice(0, capacity)

    for (const hv of students) {
      const exists = await db.examRegistration.findFirst({
        where: { examSessionId: session.id, hocVienId: hv.id },
      })
      if (exists) continue

      await db.examRegistration.create({
        data: {
          examSessionId: session.id,
          hocVienId: hv.id,
          seatNumber: `${String(regCount % 50 + 1).padStart(2, '0')}`,
          status: 'REGISTERED',
        },
      })
      regCount++
    }
  }
  console.log(`  → Đã tạo ${regCount} exam registrations`)

  // Tóm tắt
  const byType = await db.exam.groupBy({ by: ['examType'], _count: { id: true } })
  console.log('\n  ✅ Exams theo loại:')
  for (const e of byType) {
    console.log(`     ${e.examType}: ${e._count.id}`)
  }
  const pubCount = await db.exam.count({ where: { isPublished: true } })
  console.log(`  Published: ${pubCount}/${examCount}`)
  console.log(`  Exam registrations mới: ${regCount}`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => db.$disconnect())
