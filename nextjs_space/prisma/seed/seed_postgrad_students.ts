/**
 * Seed: Học viên Sau đại học (Hệ 1) — Cao học + Nghiên cứu sinh.
 *
 * SEED ONLY — dev/demo. Idempotent theo prefix mã (CHHC/CHTC/NCS).
 *
 * Ba nhóm (sĩ quan tại chức học sau đại học):
 *   - Cao học Hậu cần quân sự (CHHC): quân hàm Đại úy → Trung tá   → lớp LOP_HE1_CHHCQS
 *   - Cao học Tài chính        (CHTC): quân hàm Thượng úy trở lên   → lớp LOP_HE1_CHTC
 *   - Nghiên cứu sinh          (NCS) : quân hàm Trung tá trở lên    → lớp HE1_XNSC (có sẵn)
 *   Tất cả thuộc trainingSystemUnitId = HE1 (Hệ đào tạo Sau đại học).
 *
 * Quy mô: POSTGRAD_PER_CLASS (env, mặc định 30) học viên/lớp.
 *
 * Run: npx tsx --require dotenv/config prisma/seed/seed_postgrad_students.ts
 */
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import 'dotenv/config'
import {
  CAO_HOC_HCQS_RANKS,
  CAO_HOC_TC_RANKS,
  CourseDef,
  DEFAULT_STUDENT_PASSWORD,
  NCS_RANKS,
  getRequiredPositionId,
  getRequiredUnitByCode,
  seedStudentCohort,
} from './lib/student-seed-helpers'

const prisma = new PrismaClient()

const DEFAULT_PER_CLASS = 30

const CAO_HOC_HCQS_COURSES: CourseDef[] = [
  { ten: 'Lý luận nghệ thuật hậu cần quân sự', ma: 'CH-HC101', tinChi: 3 },
  { ten: 'Bảo đảm hậu cần chiến dịch', ma: 'CH-HC102', tinChi: 3 },
  { ten: 'Quản lý hậu cần cấp chiến thuật', ma: 'CH-HC103', tinChi: 3 },
  { ten: 'Tổ chức bảo đảm vật chất hậu cần', ma: 'CH-HC104', tinChi: 3 },
  { ten: 'Phương pháp nghiên cứu khoa học hậu cần', ma: 'CH-HC105', tinChi: 2 },
  { ten: 'Triết học (sau đại học)', ma: 'CH-COM01', tinChi: 3 },
  { ten: 'Tiếng Anh học thuật', ma: 'CH-COM02', tinChi: 3 },
]

const CAO_HOC_TC_COURSES: CourseDef[] = [
  { ten: 'Tài chính quân sự nâng cao', ma: 'CH-TC101', tinChi: 3 },
  { ten: 'Quản lý ngân sách quốc phòng', ma: 'CH-TC102', tinChi: 3 },
  { ten: 'Kế toán đơn vị dự toán quân đội', ma: 'CH-TC103', tinChi: 3 },
  { ten: 'Kiểm toán nội bộ trong quân đội', ma: 'CH-TC104', tinChi: 3 },
  { ten: 'Phân tích tài chính khu vực công', ma: 'CH-TC105', tinChi: 3 },
  { ten: 'Triết học (sau đại học)', ma: 'CH-COM01', tinChi: 3 },
  { ten: 'Tiếng Anh học thuật', ma: 'CH-COM02', tinChi: 3 },
]

const NCS_COURSES: CourseDef[] = [
  { ten: 'Phương pháp luận nghiên cứu khoa học', ma: 'NCS-001', tinChi: 4 },
  { ten: 'Chuyên đề tiến sĩ 1 — Lý luận hậu cần', ma: 'NCS-CD1', tinChi: 3 },
  { ten: 'Chuyên đề tiến sĩ 2 — Bảo đảm hậu cần', ma: 'NCS-CD2', tinChi: 3 },
  { ten: 'Chuyên đề tiến sĩ 3 — Thực tiễn chuyên ngành', ma: 'NCS-CD3', tinChi: 3 },
  { ten: 'Tiểu luận tổng quan', ma: 'NCS-TLTQ', tinChi: 2 },
]

async function main() {
  console.log('🎓 Seeding học viên Sau đại học (Cao học + NCS)...\n')

  const perClass = Number(process.env.POSTGRAD_PER_CLASS ?? DEFAULT_PER_CLASS)
  if (!Number.isInteger(perClass) || perClass <= 0) {
    throw new Error(`POSTGRAD_PER_CLASS không hợp lệ: ${process.env.POSTGRAD_PER_CLASS}`)
  }

  const positionId = await getRequiredPositionId(prisma, 'HOC_VIEN_CAO_HOC')
  const he1 = await getRequiredUnitByCode(prisma, 'HE1')
  const [lopHcqs, lopTc, lopNcs] = await Promise.all([
    getRequiredUnitByCode(prisma, 'LOP_HE1_CHHCQS'),
    getRequiredUnitByCode(prisma, 'LOP_HE1_CHTC'),
    getRequiredUnitByCode(prisma, 'HE1_XNSC'),
  ])

  const passwordHash = await bcrypt.hash(DEFAULT_STUDENT_PASSWORD, 10)
  const ngayNhapHoc = new Date('2024-09-05')

  const hcqs = await seedStudentCohort(prisma, passwordHash, {
    count: perClass,
    prefix: 'CHHC',
    positionId,
    positionLabel: 'Học viên cao học',
    personnelType: 'HOC_VIEN_QUAN_SU',
    unit: lopHcqs,
    trainingSystemUnitId: he1.id,
    departmentLabel: he1.name,
    ranks: CAO_HOC_HCQS_RANKS,
    nganh: 'Hậu cần quân sự',
    khoaHoc: 'Cao học K2024',
    studyMode: 'CHINH_QUY',
    courses: CAO_HOC_HCQS_COURSES,
    ngayNhapHoc,
    khoaQuanLy: he1.name,
    birthYearBase: 1986,
  })
  console.log(`✓ Cao học Hậu cần quân sự: +${hcqs.created} (skip ${hcqs.skipped}), điểm ${hcqs.gradesCreated}`)

  const tc = await seedStudentCohort(prisma, passwordHash, {
    count: perClass,
    prefix: 'CHTC',
    positionId,
    positionLabel: 'Học viên cao học',
    personnelType: 'HOC_VIEN_QUAN_SU',
    unit: lopTc,
    trainingSystemUnitId: he1.id,
    departmentLabel: he1.name,
    ranks: CAO_HOC_TC_RANKS,
    nganh: 'Tài chính quân sự',
    khoaHoc: 'Cao học K2024',
    studyMode: 'CHINH_QUY',
    courses: CAO_HOC_TC_COURSES,
    ngayNhapHoc,
    khoaQuanLy: he1.name,
    femaleRatio: 0.2,
    birthYearBase: 1987,
  })
  console.log(`✓ Cao học Tài chính: +${tc.created} (skip ${tc.skipped}), điểm ${tc.gradesCreated}`)

  const ncs = await seedStudentCohort(prisma, passwordHash, {
    count: perClass,
    prefix: 'NCS',
    positionId,
    positionLabel: 'Học viên cao học',
    personnelType: 'HOC_VIEN_QUAN_SU',
    unit: lopNcs,
    trainingSystemUnitId: he1.id,
    departmentLabel: he1.name,
    ranks: NCS_RANKS,
    nganh: 'Hậu cần quân sự (NCS)',
    khoaHoc: 'NCS K2024',
    studyMode: 'NGHIEN_CUU_SINH',
    courses: NCS_COURSES,
    ngayNhapHoc,
    khoaQuanLy: he1.name,
    birthYearBase: 1978,
  })
  console.log(`✓ Nghiên cứu sinh: +${ncs.created} (skip ${ncs.skipped}), điểm ${ncs.gradesCreated}`)

  const totalHe1 = await prisma.hocVien.count({ where: { trainingSystemUnitId: he1.id } })
  console.log('\n===== SEED HỌC VIÊN SAU ĐẠI HỌC =====')
  console.log(`Tổng học viên thuộc Hệ 1 (HE1): ${totalHe1}`)
  console.log('Mật khẩu mặc định: ' + DEFAULT_STUDENT_PASSWORD)
  console.log('======================================\n')
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
