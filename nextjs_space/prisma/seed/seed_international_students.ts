/**
 * Seed: Hệ 4 — Học viên quốc tế (Lưu học viên Lào + Campuchia).
 *
 * SEED ONLY — dev/demo. Idempotent theo prefix LHSL (Lào) / LHSC (Campuchia).
 *
 * Bản chất: học viên quân sự nước bạn học tại HVHC → 2 lớp LOP_HE4_LAO / LOP_HE4_CPC,
 * thuộc trainingSystemUnitId = HE4 (Hệ Quốc tế).
 * Quân hàm dùng FOREIGN_RANKS — KHÔNG có cấp "Thượng úy"/"Thượng tá" (khác cơ cấu
 * quân hàm Việt Nam). Quốc tịch đánh dấu qua tên lớp + khoaQuanLy + diaChi (model
 * HocVien không có field quốc tịch).
 *
 * Quy mô: INTL_PER_CLASS (env, mặc định 30) mỗi nước.
 *
 * Run: npx tsx --require dotenv/config prisma/seed/seed_international_students.ts
 */
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import 'dotenv/config'
import {
  CAMBODIA_FULLNAMES,
  CourseDef,
  DEFAULT_STUDENT_PASSWORD,
  FOREIGN_RANKS,
  LAO_FULLNAMES,
  getRequiredPositionId,
  getRequiredUnitByCode,
  seedStudentCohort,
} from './lib/student-seed-helpers'

const prisma = new PrismaClient()

const DEFAULT_PER_CLASS = 30

const INTL_COURSES: CourseDef[] = [
  { ten: 'Tiếng Việt cơ sở', ma: 'INTL-VN1', tinChi: 4 },
  { ten: 'Lý luận hậu cần quân sự', ma: 'INTL-HC1', tinChi: 3 },
  { ten: 'Tổ chức bảo đảm hậu cần', ma: 'INTL-HC2', tinChi: 3 },
  { ten: 'Quản lý ngành hậu cần', ma: 'INTL-HC3', tinChi: 3 },
  { ten: 'Công tác hậu cần trong chiến đấu', ma: 'INTL-HC4', tinChi: 3 },
]

async function main() {
  console.log('🌏 Seeding Hệ 4 — Học viên quốc tế (Lào + Campuchia)...\n')

  const perClass = Number(process.env.INTL_PER_CLASS ?? DEFAULT_PER_CLASS)
  if (!Number.isInteger(perClass) || perClass <= 0) {
    throw new Error(`INTL_PER_CLASS không hợp lệ: ${process.env.INTL_PER_CLASS}`)
  }

  const positionId = await getRequiredPositionId(prisma, 'HOC_VIEN_QUAN_SU')
  const he4 = await getRequiredUnitByCode(prisma, 'HE4')
  const [lopLao, lopCpc] = await Promise.all([
    getRequiredUnitByCode(prisma, 'LOP_HE4_LAO'),
    getRequiredUnitByCode(prisma, 'LOP_HE4_CPC'),
  ])

  const passwordHash = await bcrypt.hash(DEFAULT_STUDENT_PASSWORD, 10)
  const ngayNhapHoc = new Date('2024-09-05')

  const cohorts = [
    { unit: lopLao, prefix: 'LHSL', names: LAO_FULLNAMES, country: 'Lào', emailDomain: 'intl.hvhc.edu.vn' },
    { unit: lopCpc, prefix: 'LHSC', names: CAMBODIA_FULLNAMES, country: 'Campuchia', emailDomain: 'intl.hvhc.edu.vn' },
  ]

  let totalCreated = 0
  for (const c of cohorts) {
    const res = await seedStudentCohort(prisma, passwordHash, {
      count: perClass,
      prefix: c.prefix,
      positionId,
      positionLabel: 'Học viên quốc tế',
      personnelType: 'HOC_VIEN_QUAN_SU',
      unit: c.unit,
      trainingSystemUnitId: he4.id,
      departmentLabel: he4.name,
      ranks: FOREIGN_RANKS,
      nganh: 'Chỉ huy hậu cần (quốc tế)',
      khoaHoc: 'Khóa quốc tế 2024',
      studyMode: 'CHINH_QUY',
      courses: INTL_COURSES,
      ngayNhapHoc,
      khoaQuanLy: `${he4.name} — ${c.country}`,
      fullNamePool: c.names,
      emailDomain: c.emailDomain,
      diaChiLabel: `Ký túc xá quốc tế (${c.country})`,
      birthYearBase: 1990,
    })
    totalCreated += res.created
    console.log(`✓ ${c.unit.name}: +${res.created} (skip ${res.skipped}), điểm ${res.gradesCreated}`)
  }

  const totalHe4 = await prisma.hocVien.count({ where: { trainingSystemUnitId: he4.id } })
  console.log('\n===== SEED HỆ 4 — QUỐC TẾ =====')
  console.log(`Học viên quốc tế tạo mới: ${totalCreated}`)
  console.log(`Tổng học viên Hệ 4:       ${totalHe4}`)
  console.log('Mật khẩu mặc định: ' + DEFAULT_STUDENT_PASSWORD)
  console.log('=================================\n')
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
