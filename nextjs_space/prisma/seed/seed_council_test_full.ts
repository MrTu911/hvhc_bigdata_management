/**
 * Seed: Dữ liệu mẫu đầy đủ để test chức năng hội đồng khoa học
 *
 * Thực hiện:
 *   1. Thêm VIEW_SCIENTIST_PROFILE (và các science functions còn thiếu)
 *      vào Position SYSTEM_ADMIN, GIAM_DOC, PHO_GIAM_DOC
 *   2. Tạo 2 đề tài UNDER_REVIEW (test HĐ thẩm định đề cương)
 *   3. Tạo 2 đề tài IN_PROGRESS (test HĐ nghiệm thu)
 *      → PI là nhà khoa học KHÁC admin, để tránh conflict-of-interest
 *
 * Idempotent: upsert/createIfNotExists — an toàn chạy nhiều lần.
 *
 * Run: npx tsx --require dotenv/config prisma/seed/seed_council_test_full.ts
 */

import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

// ─── ID cố định ────────────────────────────────────────────────────────────────
const ADMIN_USER_ID = 'cmmuk9py600ae8i27ciojecph'  // Nguyễn Đức Tú – SYSTEM_ADMIN

// Nhà khoa học dùng làm PI (không phải admin)
const PI_REVIEW_1   = 'cmmuk9r14008f8i46tnzjqnaj'  // Bùi Huy Hoàng
const PI_REVIEW_2   = 'cmmuk9rr801nn8i467xz2i758'  // Bùi Thị Như Quỳnh
const PI_ACCEPT_1   = 'cmmuk9qz200578i46uxhoiim3'  // Đặng Chính Nghĩa
const PI_ACCEPT_2   = 'cmmuk9r5200fj8i46186r3jnh'  // Đào Văn Tùng

// ─── Functions cần thêm vào SYSTEM_ADMIN / GIAM_DOC / PHO_GIAM_DOC ───────────
const SCIENCE_FUNCTION_CODES = [
  'VIEW_SCIENTIST_PROFILE',   // Xem danh sách nhà khoa học (dùng bởi /api/science/scientists + /api/science/projects GET)
  'MANAGE_SCIENTIST_PROFILE', // Cập nhật hồ sơ nhà KH
  'VIEW_SCIENCE_LIBRARY',     // Thư viện KH
  'VIEW_SCIENCE_BUDGET',      // Xem ngân sách
  'VIEW_LIBRARY_NORMAL',      // Thư viện thường
]

const POSITION_CODES_TO_UPDATE = ['SYSTEM_ADMIN', 'GIAM_DOC', 'PHO_GIAM_DOC', 'TRUONG_KHOA']

async function addScienceFunctionsToPositions() {
  console.log('  → Đồng bộ SCIENCE functions cho các chức vụ...')

  for (const posCode of POSITION_CODES_TO_UPDATE) {
    const position = await db.position.findFirst({ where: { code: posCode } })
    if (!position) { console.log(`    ⚠ Position ${posCode} không tồn tại, bỏ qua`); continue }

    for (const fnCode of SCIENCE_FUNCTION_CODES) {
      const fn = await db.function.findFirst({ where: { code: fnCode } })
      if (!fn) { console.log(`    ⚠ Function ${fnCode} không tồn tại, bỏ qua`); continue }

      // Kiểm tra đã có chưa
      const existing = await db.positionFunction.findFirst({
        where: { positionId: position.id, functionId: fn.id },
      })
      if (!existing) {
        await db.positionFunction.create({
          data: {
            positionId: position.id,
            functionId: fn.id,
            scopeType:  posCode === 'SYSTEM_ADMIN' ? 'ACADEMY' : 'DEPARTMENT',
            isActive:   true,
          },
        })
        console.log(`    ✓ ${posCode} ← ${fnCode}`)
      }
    }
  }
}

// ─── Tạo đề tài test ──────────────────────────────────────────────────────────
interface ProjectSeed {
  projectCode: string
  title: string
  status: 'UNDER_REVIEW' | 'IN_PROGRESS'
  phase: 'PROPOSAL' | 'EXECUTION'
  category: 'CAP_HOC_VIEN' | 'CAP_TONG_CUC' | 'CAP_BO_QUOC_PHONG'
  field: 'CNTT' | 'HOC_THUAT_QUAN_SU' | 'HAU_CAN_KY_THUAT' | 'KHOA_HOC_XA_HOI'
  researchType: 'CO_BAN' | 'UNG_DUNG' | 'TRIEN_KHAI'
  piUserId: string
  abstract: string
}

async function createTestProjects() {
  console.log('  → Tạo đề tài mẫu cho từng kịch bản...')

  // Lấy unitId của PI để gán đúng
  const piUsers = await db.user.findMany({
    where: { id: { in: [PI_REVIEW_1, PI_REVIEW_2, PI_ACCEPT_1, PI_ACCEPT_2] } },
    select: { id: true, name: true, unitId: true },
  })
  const piMap = Object.fromEntries(piUsers.map(u => [u.id, u]))

  const projects: ProjectSeed[] = [
    {
      projectCode:  'THAM-DINH-2026-001',
      title:        '[DEMO] Nghiên cứu phương pháp huấn luyện kỹ năng tác chiến số hóa',
      status:       'UNDER_REVIEW',
      phase:        'PROPOSAL',
      category:     'CAP_HOC_VIEN',
      field:        'HOC_THUAT_QUAN_SU',
      researchType: 'UNG_DUNG',
      piUserId:     PI_REVIEW_1,
      abstract:     'Nghiên cứu các phương pháp và mô hình huấn luyện kỹ năng tác chiến trong môi trường số hóa hiện đại.',
    },
    {
      projectCode:  'THAM-DINH-2026-002',
      title:        '[DEMO] Xây dựng khung năng lực số cho cán bộ kỹ thuật quân sự',
      status:       'UNDER_REVIEW',
      phase:        'PROPOSAL',
      category:     'CAP_HOC_VIEN',
      field:        'CNTT',
      researchType: 'CO_BAN',
      piUserId:     PI_REVIEW_2,
      abstract:     'Xây dựng bộ tiêu chí đánh giá và khung phát triển năng lực số cho cán bộ kỹ thuật trong lực lượng vũ trang.',
    },
    {
      projectCode:  'NGHIEM-THU-2026-001',
      title:        '[DEMO] Ứng dụng IoT trong quản lý trang thiết bị hậu cần chiến thuật',
      status:       'IN_PROGRESS',
      phase:        'EXECUTION',
      category:     'CAP_TONG_CUC',
      field:        'HAU_CAN_KY_THUAT',
      researchType: 'TRIEN_KHAI',
      piUserId:     PI_ACCEPT_1,
      abstract:     'Triển khai hệ thống IoT để theo dõi, quản lý và điều phối trang thiết bị hậu cần trong môi trường chiến thuật.',
    },
    {
      projectCode:  'NGHIEM-THU-2026-002',
      title:        '[DEMO] Mô hình đánh giá hiệu quả đào tạo chính trị tư tưởng trong thời đại số',
      status:       'IN_PROGRESS',
      phase:        'EXECUTION',
      category:     'CAP_HOC_VIEN',
      field:        'KHOA_HOC_XA_HOI',
      researchType: 'CO_BAN',
      piUserId:     PI_ACCEPT_2,
      abstract:     'Xây dựng bộ chỉ số và mô hình đánh giá hiệu quả công tác giáo dục chính trị tư tưởng trong bối cảnh chuyển đổi số.',
    },
  ]

  for (const p of projects) {
    const existing = await db.nckhProject.findUnique({ where: { projectCode: p.projectCode } })
    if (existing) {
      console.log(`    ↳ ${p.projectCode} đã tồn tại, bỏ qua`)
      continue
    }

    const pi = piMap[p.piUserId]
    await db.nckhProject.create({
      data: {
        projectCode:             p.projectCode,
        title:                   p.title,
        status:                  p.status,
        phase:                   p.phase,
        category:                p.category,
        field:                   p.field,
        researchType:            p.researchType,
        principalInvestigatorId: p.piUserId,
        unitId:                  pi?.unitId ?? undefined,
        abstract:                p.abstract,
        budgetRequested:         500_000_000,
        budgetYear:              2026,
        sensitivity:             'NORMAL',
        keywords:                ['demo', 'test', 'hội đồng'],
        submittedAt:             new Date(),
      },
    })
    console.log(`    ✓ Tạo ${p.projectCode} [${p.status}] — PI: ${pi?.name ?? p.piUserId}`)
  }
}

// ─── Summary ──────────────────────────────────────────────────────────────────
async function printSummary() {
  const [underReview, inProgress, councils, scientists] = await Promise.all([
    db.nckhProject.count({ where: { status: 'UNDER_REVIEW' } }),
    db.nckhProject.count({ where: { status: 'IN_PROGRESS' } }),
    db.scientificCouncil.count(),
    db.nckhScientistProfile.count(),
  ])

  console.log('\n✅ Seed hoàn thành:')
  console.log(`   NckhProject UNDER_REVIEW : ${underReview}`)
  console.log(`   NckhProject IN_PROGRESS  : ${inProgress}`)
  console.log(`   ScientificCouncil        : ${councils}`)
  console.log(`   NckhScientistProfile     : ${scientists}`)

  console.log('\n📋 Hướng dẫn test:')
  console.log('   1. Đăng nhập bằng tài khoản admin (Nguyễn Đức Tú)')
  console.log('   2. Trang Thẩm định:  http://localhost:3000/dashboard/science/activities/review')
  console.log('      → Tìm đề tài THAM-DINH-2026-001 / 002')
  console.log('      → Nhấn "Lập HĐ thẩm định" → wizard pre-fill sẵn đề tài + loại REVIEW')
  console.log('      → Chọn ≥3 thành viên (KHÔNG chọn PI của đề tài đó)')
  console.log('   3. Trang Thực hiện:  http://localhost:3000/dashboard/science/activities/execution')
  console.log('      → Tìm đề tài NGHIEM-THU-2026-001 / 002')
  console.log('      → Nhấn "Lập HĐ nghiệm thu" → wizard pre-fill loại ACCEPTANCE')
  console.log('   4. Trang Hội đồng:   http://localhost:3000/dashboard/science/activities/councils')
  console.log('   5. Guard test: Thử tạo HĐ REVIEW cho đề tài IN_PROGRESS → phải báo lỗi')
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🏛  Seed Council Test Full...\n')

  await addScienceFunctionsToPositions()
  console.log('')
  await createTestProjects()

  await printSummary()
}

main()
  .catch((e) => { console.error('❌ Seed thất bại:', e.message); process.exit(1) })
  .finally(() => db.$disconnect())
