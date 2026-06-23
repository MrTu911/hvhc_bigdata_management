/**
 * Seed: Hệ 2 — Học viên Đào tạo Chủ nhiệm hậu cần trung/lữ đoàn (DÀI HẠN).
 *
 * SEED ONLY — dev/demo. Idempotent theo prefix CNHC.
 *
 * Bản chất: sĩ quan (quân hàm Đại úy trở lên) học chương trình chỉ huy tham mưu hậu cần
 * dài hạn → lớp LOP_HE2_CNHC_DH, thuộc trainingSystemUnitId = HE2 (Hệ Chỉ huy tham mưu).
 *
 * Quy mô: CNHC_PER_CLASS (env, mặc định 30).
 *
 * Run: npx tsx --require dotenv/config prisma/seed/seed_command_logistics_students.ts
 */
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import 'dotenv/config'
import {
  CNHC_DAIHAN_RANKS,
  CourseDef,
  DEFAULT_STUDENT_PASSWORD,
  getRequiredPositionId,
  getRequiredUnitByCode,
  seedStudentCohort,
} from './lib/student-seed-helpers'

const prisma = new PrismaClient()

const DEFAULT_PER_CLASS = 30

const CNHC_COURSES: CourseDef[] = [
  { ten: 'Công tác tham mưu hậu cần trung/lữ đoàn', ma: 'CNHC-201', tinChi: 4 },
  { ten: 'Tổ chức bảo đảm hậu cần trong chiến đấu', ma: 'CNHC-202', tinChi: 4 },
  { ten: 'Quản lý ngành hậu cần cấp trung/lữ đoàn', ma: 'CNHC-203', tinChi: 3 },
  { ten: 'Chỉ huy hậu cần trong hành quân', ma: 'CNHC-204', tinChi: 3 },
  { ten: 'Bảo đảm kỹ thuật và vật chất hậu cần', ma: 'CNHC-205', tinChi: 3 },
  { ten: 'Công tác đảng, công tác chính trị trong ngành hậu cần', ma: 'CNHC-206', tinChi: 2 },
]

async function main() {
  console.log('🎖️  Seeding Hệ 2 — Chủ nhiệm hậu cần trung/lữ đoàn (dài hạn)...\n')

  const perClass = Number(process.env.CNHC_PER_CLASS ?? DEFAULT_PER_CLASS)
  if (!Number.isInteger(perClass) || perClass <= 0) {
    throw new Error(`CNHC_PER_CLASS không hợp lệ: ${process.env.CNHC_PER_CLASS}`)
  }

  const positionId = await getRequiredPositionId(prisma, 'HOC_VIEN_QUAN_SU')
  const he2 = await getRequiredUnitByCode(prisma, 'HE2')
  const lop = await getRequiredUnitByCode(prisma, 'LOP_HE2_CNHC_DH')

  const passwordHash = await bcrypt.hash(DEFAULT_STUDENT_PASSWORD, 10)

  const res = await seedStudentCohort(prisma, passwordHash, {
    count: perClass,
    prefix: 'CNHC',
    positionId,
    positionLabel: 'Học viên',
    personnelType: 'HOC_VIEN_QUAN_SU',
    unit: lop,
    trainingSystemUnitId: he2.id,
    departmentLabel: he2.name,
    ranks: CNHC_DAIHAN_RANKS,
    nganh: 'Chỉ huy tham mưu hậu cần',
    khoaHoc: 'Khóa dài hạn 2024',
    studyMode: 'CHINH_QUY',
    courses: CNHC_COURSES,
    ngayNhapHoc: new Date('2024-09-05'),
    khoaQuanLy: he2.name,
    birthYearBase: 1985,
  })

  console.log(`✓ Chủ nhiệm hậu cần (dài hạn): +${res.created} (skip ${res.skipped}), điểm ${res.gradesCreated}`)
  const totalHe2 = await prisma.hocVien.count({ where: { trainingSystemUnitId: he2.id } })
  console.log(`Tổng học viên thuộc Hệ 2 (HE2): ${totalHe2}`)
  console.log('Mật khẩu mặc định: ' + DEFAULT_STUDENT_PASSWORD + '\n')
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
