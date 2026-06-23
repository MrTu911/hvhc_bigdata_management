/**
 * Seed: Đào tạo ngắn hạn — Chủ nhiệm hậu cần trung/lữ đoàn (lớp B155 A–F).
 *
 * SEED ONLY — dev/demo. Idempotent theo prefix B155A..B155F (mỗi lớp một dải mã).
 *
 * Bản chất: sĩ quan (quân hàm Đại úy trở lên) học lớp bồi dưỡng/đào tạo ngắn hạn chủ
 * nhiệm hậu cần cấp trung/lữ đoàn → 6 lớp B155 A–F thuộc HE_BD (Hệ Đào tạo ngắn hạn).
 *
 * Quy mô: B155_PER_CLASS (env, mặc định 30) × 6 lớp.
 *
 * Run: npx tsx --require dotenv/config prisma/seed/seed_short_course_b155.ts
 */
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import 'dotenv/config'
import {
  B155_RANKS,
  CourseDef,
  DEFAULT_STUDENT_PASSWORD,
  getRequiredPositionId,
  getRequiredUnitByCode,
  seedStudentCohort,
} from './lib/student-seed-helpers'

const prisma = new PrismaClient()

const DEFAULT_PER_CLASS = 30
const CLASS_SUFFIXES = ['A', 'B', 'C', 'D', 'E', 'F'] as const

const B155_COURSES: CourseDef[] = [
  { ten: 'Nghiệp vụ chủ nhiệm hậu cần trung/lữ đoàn', ma: 'B155-01', tinChi: 3 },
  { ten: 'Tổ chức bảo đảm hậu cần phân đội', ma: 'B155-02', tinChi: 3 },
  { ten: 'Quản lý vật chất, tài chính hậu cần', ma: 'B155-03', tinChi: 2 },
  { ten: 'Bảo đảm quân nhu, quân y, xăng dầu', ma: 'B155-04', tinChi: 2 },
  { ten: 'Thực hành chỉ huy bảo đảm hậu cần', ma: 'B155-05', tinChi: 2 },
]

async function main() {
  console.log('🎖️  Seeding lớp ngắn hạn B155 A–F (chủ nhiệm hậu cần trung/lữ đoàn)...\n')

  const perClass = Number(process.env.B155_PER_CLASS ?? DEFAULT_PER_CLASS)
  if (!Number.isInteger(perClass) || perClass <= 0) {
    throw new Error(`B155_PER_CLASS không hợp lệ: ${process.env.B155_PER_CLASS}`)
  }

  const positionId = await getRequiredPositionId(prisma, 'HOC_VIEN_QUAN_SU')
  const heBd = await getRequiredUnitByCode(prisma, 'HE_BD')

  const passwordHash = await bcrypt.hash(DEFAULT_STUDENT_PASSWORD, 10)

  let totalCreated = 0
  let totalGrades = 0
  for (const suffix of CLASS_SUFFIXES) {
    const lop = await getRequiredUnitByCode(prisma, `B155_${suffix}`)
    const res = await seedStudentCohort(prisma, passwordHash, {
      count: perClass,
      prefix: `B155${suffix}`,
      positionId,
      positionLabel: 'Học viên',
      personnelType: 'HOC_VIEN_QUAN_SU',
      unit: lop,
      trainingSystemUnitId: heBd.id,
      departmentLabel: heBd.name,
      ranks: B155_RANKS,
      nganh: 'Chủ nhiệm hậu cần (ngắn hạn)',
      khoaHoc: 'Khóa B155',
      studyMode: 'BOI_DUONG',
      courses: B155_COURSES,
      ngayNhapHoc: new Date('2025-03-03'),
      khoaQuanLy: heBd.name,
      birthYearBase: 1984,
    })
    totalCreated += res.created
    totalGrades += res.gradesCreated
    console.log(`✓ Lớp B155 ${suffix}: +${res.created} (skip ${res.skipped}), điểm ${res.gradesCreated}`)
  }

  const totalBd = await prisma.hocVien.count({ where: { trainingSystemUnitId: heBd.id } })
  console.log('\n===== SEED LỚP NGẮN HẠN B155 =====')
  console.log(`Tạo mới tổng:               ${totalCreated}`)
  console.log(`Điểm tạo:                   ${totalGrades}`)
  console.log(`Tổng học viên Hệ Bồi dưỡng: ${totalBd}`)
  console.log('Mật khẩu mặc định: ' + DEFAULT_STUDENT_PASSWORD)
  console.log('===================================\n')
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
