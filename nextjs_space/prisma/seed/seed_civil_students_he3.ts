/**
 * Seed: Hệ 3 — Sinh viên hệ Dân sự (thi đỗ vào trường, đào tạo 4 năm).
 *
 * SEED ONLY — dev/demo. Idempotent theo prefix DS2024A/DS2024B.
 *
 * Hai việc:
 *   1. Tạo MỚI sinh viên dân sự (có tài khoản, không quân hàm) → 2 lớp LOP_HE3_DS1/DS2,
 *      thuộc trainingSystemUnitId = HE3 (Hệ Đào tạo Dân sự).
 *   2. Backfill: gán 60 sinh viên dân sự cũ (SV2024####) vào Hệ 3 — set
 *      trainingSystemUnitId = HE3 (trước đây để null). Không tạo lại, không phá dữ liệu.
 *
 * Quy mô tạo mới: CIVIL_HE3_PER_CLASS (env, mặc định 30) × 2 lớp.
 *
 * Run: npx tsx --require dotenv/config prisma/seed/seed_civil_students_he3.ts
 */
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import 'dotenv/config'
import {
  CourseDef,
  DEFAULT_STUDENT_PASSWORD,
  getRequiredPositionId,
  getRequiredUnitByCode,
  seedStudentCohort,
} from './lib/student-seed-helpers'

const prisma = new PrismaClient()

const DEFAULT_PER_CLASS = 30

const CIVIL_COURSES: CourseDef[] = [
  { ten: 'Toán cao cấp', ma: 'MATH101', tinChi: 3 },
  { ten: 'Kinh tế vi mô', ma: 'ECON101', tinChi: 3 },
  { ten: 'Kinh tế vĩ mô', ma: 'ECON102', tinChi: 3 },
  { ten: 'Kế toán đại cương', ma: 'ACCT101', tinChi: 3 },
  { ten: 'Tài chính doanh nghiệp', ma: 'FIN201', tinChi: 3 },
  { ten: 'Tin học văn phòng', ma: 'IT101', tinChi: 2 },
  { ten: 'Tiếng Anh giao tiếp', ma: 'ENG201', tinChi: 3 },
  { ten: 'Quản trị học', ma: 'MGT201', tinChi: 3 },
]

async function main() {
  console.log('🎓 Seeding Hệ 3 — Sinh viên hệ Dân sự (4 năm)...\n')

  const perClass = Number(process.env.CIVIL_HE3_PER_CLASS ?? DEFAULT_PER_CLASS)
  if (!Number.isInteger(perClass) || perClass <= 0) {
    throw new Error(`CIVIL_HE3_PER_CLASS không hợp lệ: ${process.env.CIVIL_HE3_PER_CLASS}`)
  }

  const positionId = await getRequiredPositionId(prisma, 'SINH_VIEN_DAN_SU')
  const he3 = await getRequiredUnitByCode(prisma, 'HE3')
  const [ds1, ds2] = await Promise.all([
    getRequiredUnitByCode(prisma, 'LOP_HE3_DS1'),
    getRequiredUnitByCode(prisma, 'LOP_HE3_DS2'),
  ])

  const passwordHash = await bcrypt.hash(DEFAULT_STUDENT_PASSWORD, 10)
  const ngayNhapHoc = new Date('2024-09-01')

  const classes = [
    { unit: ds1, prefix: 'DS2024A', nganh: 'Kinh tế', birthYearBase: 2003 },
    { unit: ds2, prefix: 'DS2024B', nganh: 'Công nghệ thông tin', birthYearBase: 2003 },
  ]

  let totalCreated = 0
  for (const c of classes) {
    const res = await seedStudentCohort(prisma, passwordHash, {
      count: perClass,
      prefix: c.prefix,
      positionId,
      positionLabel: 'Sinh viên dân sự',
      personnelType: 'SINH_VIEN_DAN_SU',
      unit: c.unit,
      trainingSystemUnitId: he3.id,
      departmentLabel: he3.name,
      ranks: [], // dân sự — không quân hàm
      nganh: c.nganh,
      khoaHoc: 'Khóa 2024 (4 năm)',
      studyMode: 'CHINH_QUY',
      courses: CIVIL_COURSES,
      ngayNhapHoc,
      khoaQuanLy: he3.name,
      femaleRatio: 0.45,
      birthYearBase: c.birthYearBase,
    })
    totalCreated += res.created
    console.log(`✓ ${c.unit.name}: +${res.created} (skip ${res.skipped}), điểm ${res.gradesCreated}`)
  }

  // Backfill: đưa sinh viên dân sự cũ (SV2024####) vào Hệ 3.
  const backfill = await prisma.hocVien.updateMany({
    where: { maHocVien: { startsWith: 'SV2024' }, trainingSystemUnitId: null },
    data: { trainingSystemUnitId: he3.id, khoaQuanLy: he3.name },
  })
  console.log(`↻ Backfill SV2024 cũ vào Hệ 3: ${backfill.count}`)

  const totalHe3 = await prisma.hocVien.count({ where: { trainingSystemUnitId: he3.id } })
  console.log('\n===== SEED HỆ 3 — DÂN SỰ =====')
  console.log(`Sinh viên tạo mới:    ${totalCreated}`)
  console.log(`Tổng học viên Hệ 3:   ${totalHe3}`)
  console.log('Mật khẩu mặc định: ' + DEFAULT_STUDENT_PASSWORD)
  console.log('================================\n')
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
