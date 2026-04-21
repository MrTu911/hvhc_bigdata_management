/**
 * seed_science_proposal_demo.ts
 *
 * Dữ liệu mẫu để kiểm thử:
 *   - /dashboard/personal/my-research      (đề tài cá nhân)
 *   - /dashboard/science/projects/new      (tạo đề xuất mới)
 *   - /dashboard/science/projects/[id]/edit (tiếp tục soạn / chỉnh sửa lại)
 *   - Upload & xem file đính kèm
 *
 * Tài khoản test: giangvien@demo.hvhc.edu.vn / Demo@2025
 *
 * Run: npx tsx --require dotenv/config prisma/seed/seed_science_proposal_demo.ts
 */

import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

// ─── IDs cố định (từ DB hiện tại) ────────────────────────────────────────────
const GIANGVIEN_ID   = 'cmn3upe18071q8iunwkhu11lw'   // giangvien@demo.hvhc.edu.vn
const GIAMDOC_ID     = 'cmn3upe0v071h8iunmxhffzzv'   // giamdoc@demo.hvhc.edu.vn
const UNIT_ID        = 'cmmuk87oz001b8i5ts0ssmqmy'   // Bộ môn Hậu cần chiến đấu
const FUND_HV_ID     = 'cmnsfbl3i00018i9logmpymtl'   // Kinh phí Học viện Hậu cần
const FUND_BQP_ID    = 'cmnsfbl3k00038i9lby5tmj6x'   // Kinh phí Bộ Quốc phòng

// ─── Helpers ──────────────────────────────────────────────────────────────────

function codeOf(n: number) { return `NCKH-DEMO-2025-${String(n).padStart(3, '0')}` }

async function ensureScientistProfile(userId: string) {
  const existing = await db.nckhScientistProfile.findFirst({ where: { userId } })
  if (existing) return existing.id

  const profile = await db.nckhScientistProfile.create({
    data: {
      userId,
      primaryField:    'HAU_CAN_KY_THUAT',
      secondaryFields: ['HOC_THUAT_QUAN_SU'],
      degree:          'Tiến sĩ',
      academicRank:    'Phó Giáo sư',
      hIndex:          2,
    },
  })
  return profile.id
}

async function ensureScienceFunctions() {
  const required = [
    { code: 'CREATE_RESEARCH_PROJECT',   name: 'Tạo đề tài NCKH' },
    { code: 'VIEW_SCIENCE_ATTACHMENT',   name: 'Xem file minh chứng KH' },
    { code: 'UPLOAD_SCIENCE_ATTACHMENT', name: 'Upload file minh chứng KH' },
    { code: 'VIEW_RESEARCH_PROJECT',     name: 'Xem đề tài NCKH' },
    { code: 'VIEW_SCIENCE_DASHBOARD',    name: 'Xem dashboard KHQL' },
    { code: 'VIEW_MY_RESEARCH',          name: 'Xem đề tài cá nhân' },
    { code: 'USE_SCIENCE_SEARCH',        name: 'Tìm kiếm khoa học' },
    { code: 'VIEW_SCIENCE_CATALOG',      name: 'Xem danh mục khoa học' },
  ]

  for (const fn of required) {
    await db.functionCodeMaster.upsert({
      where:  { id: fn.code },
      create: { id: fn.code, name: fn.name, moduleId: 'M20', isActive: true },
      update: { name: fn.name, isActive: true },
    })
  }
}

async function grantDirectPermission(userId: string, functionCode: string) {
  // Thử dùng UserDirectPermission nếu có, không thì bỏ qua
  try {
    await (db as any).userDirectPermission.upsert({
      where:  { userId_functionCode: { userId, functionCode } },
      create: { userId, functionCode, isActive: true, grantedAt: new Date() },
      update: { isActive: true },
    })
  } catch {
    // Model không tồn tại — bỏ qua, permissions có thể đến từ position/role
  }
}

async function upsertProject(data: {
  id:          string
  projectCode: string
  title:       string
  status:      string
  phase:       string
  category:    string
  field:       string
  researchType: string
  sensitivity: string
  abstract?:   string
  keywords?:   string[]
  startDate?:  Date
  endDate?:    Date
  budgetRequested?: number
  budgetApproved?:  number
  budgetYear?:  number
  unitId?:      string
  fundSourceId?: string
  completionScore?: number
  completionGrade?: string
  actualEndDate?: Date
  rejectReason?: string
}) {
  await db.nckhProject.upsert({
    where:  { id: data.id },
    create: {
      ...data,
      principalInvestigatorId: GIANGVIEN_ID,
      keywords: data.keywords ?? [],
    },
    update: {
      title: data.title,
      status: data.status,
      phase:  data.phase,
      abstract: data.abstract,
      keywords: data.keywords ?? [],
    },
  })
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🌱 seed_science_proposal_demo.ts — bắt đầu')

  // 0. Đảm bảo function permissions tồn tại
  await ensureScienceFunctions()
  console.log('  ✓ Function permissions đã được đảm bảo')

  // 1. Tạo NckhScientistProfile cho giangvien
  await ensureScientistProfile(GIANGVIEN_ID)
  console.log('  ✓ NckhScientistProfile cho giangvien')

  // 2. Tạo các đề tài mẫu ở nhiều trạng thái

  // 2a. DRAFT — chưa nộp (để test "Tiếp tục soạn")
  await upsertProject({
    id:           'demo-proj-draft-001',
    projectCode:  codeOf(1),
    title:        'Nghiên cứu cải tiến hệ thống bảo đảm hậu cần kỹ thuật cấp tiểu đoàn',
    status:       'DRAFT',
    phase:        'PROPOSAL',
    category:     'CAP_HOC_VIEN',
    field:        'HAU_CAN_KY_THUAT',
    researchType: 'UNG_DUNG',
    sensitivity:  'NORMAL',
    abstract:     'Đề tài nghiên cứu nhằm đánh giá và đề xuất các giải pháp cải tiến hệ thống bảo đảm hậu cần kỹ thuật cho cấp tiểu đoàn, áp dụng trong điều kiện huấn luyện và sẵn sàng chiến đấu hiện đại.',
    keywords:     ['hậu cần', 'kỹ thuật', 'tiểu đoàn', 'cải tiến'],
    startDate:    new Date('2025-03-01'),
    endDate:      new Date('2026-03-01'),
    budgetRequested: 150_000_000,
    budgetYear:   2025,
    unitId:       UNIT_ID,
    fundSourceId: FUND_HV_ID,
  })

  // 2b. DRAFT thứ 2 — vừa tạo, chưa điền đủ (để test form chưa hoàn chỉnh)
  await upsertProject({
    id:           'demo-proj-draft-002',
    projectCode:  codeOf(2),
    title:        'Xây dựng mô hình tổ chức bảo đảm vật tư kỹ thuật trong chiến tranh hiện đại',
    status:       'DRAFT',
    phase:        'PROPOSAL',
    category:     'CAP_HOC_VIEN',
    field:        'HOC_THUAT_QUAN_SU',
    researchType: 'CO_BAN',
    sensitivity:  'NORMAL',
    budgetYear:   2025,
    unitId:       UNIT_ID,
  })

  // 2c. REJECTED — bị từ chối (để test "Chỉnh sửa lại")
  await upsertProject({
    id:           'demo-proj-rejected-001',
    projectCode:  codeOf(3),
    title:        'Ứng dụng trí tuệ nhân tạo trong quản lý kho vật tư quân sự',
    status:       'REJECTED',
    phase:        'PROPOSAL',
    category:     'CAP_HOC_VIEN',
    field:        'CNTT',
    researchType: 'UNG_DUNG',
    sensitivity:  'NORMAL',
    abstract:     'Nghiên cứu ứng dụng các thuật toán AI/ML vào hệ thống quản lý kho vật tư, giúp tối ưu hóa công tác dự báo nhu cầu và cấp phát.',
    keywords:     ['AI', 'kho vật tư', 'quản lý', 'dự báo'],
    budgetRequested: 200_000_000,
    budgetYear:   2025,
    unitId:       UNIT_ID,
    fundSourceId: FUND_BQP_ID,
    rejectReason: 'Đề xuất cần bổ sung cơ sở lý luận về tính khả thi của AI trong môi trường quân sự. Yêu cầu chỉnh sửa mục 2.3 (Phương pháp nghiên cứu) và bổ sung danh sách tài liệu tham khảo quốc tế.',
  })

  // 2d. SUBMITTED — đã nộp, chờ duyệt
  await upsertProject({
    id:           'demo-proj-submitted-001',
    projectCode:  codeOf(4),
    title:        'Nghiên cứu đặc điểm địa hình và ảnh hưởng đến công tác vận chuyển tiếp tế',
    status:       'SUBMITTED',
    phase:        'PROPOSAL',
    category:     'CAP_HOC_VIEN',
    field:        'HAU_CAN_KY_THUAT',
    researchType: 'UNG_DUNG',
    sensitivity:  'NORMAL',
    abstract:     'Phân tích các đặc điểm địa hình khu vực miền núi phía Bắc và ảnh hưởng đến công tác vận chuyển, tiếp tế trong tác chiến.',
    budgetRequested: 120_000_000,
    budgetYear:   2025,
    unitId:       UNIT_ID,
    fundSourceId: FUND_HV_ID,
  })

  // 2e. IN_PROGRESS — đang thực hiện
  await upsertProject({
    id:           'demo-proj-active-001',
    projectCode:  codeOf(5),
    title:        'Hoàn thiện quy trình bảo dưỡng phương tiện cơ giới trong điều kiện khí hậu nhiệt đới',
    status:       'IN_PROGRESS',
    phase:        'EXECUTION',
    category:     'CAP_HOC_VIEN',
    field:        'HAU_CAN_KY_THUAT',
    researchType: 'TRIEN_KHAI',
    sensitivity:  'NORMAL',
    abstract:     'Nghiên cứu, đề xuất và thử nghiệm quy trình bảo dưỡng định kỳ phương tiện cơ giới phù hợp với điều kiện khí hậu nóng ẩm nhiệt đới Việt Nam.',
    keywords:     ['bảo dưỡng', 'phương tiện cơ giới', 'nhiệt đới', 'quy trình'],
    startDate:    new Date('2024-06-01'),
    endDate:      new Date('2025-12-31'),
    budgetRequested: 180_000_000,
    budgetApproved:  175_000_000,
    budgetYear:   2024,
    unitId:       UNIT_ID,
    fundSourceId: FUND_HV_ID,
  })

  // 2f. COMPLETED — hoàn thành
  await upsertProject({
    id:           'demo-proj-done-001',
    projectCode:  codeOf(6),
    title:        'Xây dựng tiêu chuẩn định lượng lương thực thực phẩm trong huấn luyện dã ngoại',
    status:       'COMPLETED',
    phase:        'ACCEPTED',
    category:     'CAP_HOC_VIEN',
    field:        'HAU_CAN_KY_THUAT',
    researchType: 'UNG_DUNG',
    sensitivity:  'NORMAL',
    startDate:    new Date('2023-01-01'),
    endDate:      new Date('2024-06-30'),
    actualEndDate:new Date('2024-05-15'),
    budgetRequested: 100_000_000,
    budgetApproved:  98_000_000,
    budgetYear:   2023,
    unitId:       UNIT_ID,
    fundSourceId: FUND_HV_ID,
    completionScore: 88,
    completionGrade: 'Tốt',
  })

  console.log('  ✓ 6 đề tài mẫu (DRAFT×2, REJECTED, SUBMITTED, IN_PROGRESS, COMPLETED)')

  // 3. Tạo NckhMember — giangvien tham gia đề tài của người khác
  // Lấy 1 đề tài do giamdoc làm PI (nếu có)
  const othersProject = await db.nckhProject.findFirst({
    where: {
      principalInvestigatorId: { not: GIANGVIEN_ID },
      status: { in: ['IN_PROGRESS', 'APPROVED'] },
    },
    select: { id: true },
  })

  if (othersProject) {
    await db.nckhMember.upsert({
      where: { projectId_userId: { projectId: othersProject.id, userId: GIANGVIEN_ID } },
      create: {
        projectId:    othersProject.id,
        userId:       GIANGVIEN_ID,
        role:         'THANH_VIEN_CHINH',
        joinDate:     new Date('2024-06-01'),
        contribution: 25,
      },
      update: { role: 'THANH_VIEN_CHINH' },
    })
    console.log(`  ✓ NckhMember: giangvien tham gia đề tài ${othersProject.id}`)
  } else {
    console.log('  ⚠ Không tìm thấy đề tài của người khác để thêm member — bỏ qua')
  }

  // 4. Tạo milestones cho đề tài đang thực hiện
  const milestoneData = [
    { title: 'Khảo sát thực trạng', dueDate: new Date('2024-09-30'), status: 'COMPLETED' },
    { title: 'Phân tích số liệu và xây dựng mô hình', dueDate: new Date('2025-03-31'), status: 'COMPLETED' },
    { title: 'Thử nghiệm quy trình tại đơn vị', dueDate: new Date('2025-08-31'), status: 'IN_PROGRESS' },
    { title: 'Viết báo cáo tổng kết', dueDate: new Date('2025-11-30'), status: 'PENDING' },
  ]

  const existingMilestones = await db.nckhMilestone.count({ where: { projectId: 'demo-proj-active-001' } })
  if (existingMilestones === 0) {
    await db.nckhMilestone.createMany({
      data: milestoneData.map(ms => ({
        projectId: 'demo-proj-active-001',
        title:     ms.title,
        dueDate:   ms.dueDate,
        status:    ms.status as any,
      })),
    })
  }
  console.log('  ✓ 4 milestones cho đề tài IN_PROGRESS')

  // 5. ScienceAttachment mẫu cho đề tài DRAFT đầu tiên (không cần file MinIO thật)
  const attachmentData = [
    {
      id:           'demo-att-001',
      entityType:   'PROJECT',
      entityId:     'demo-proj-draft-001',
      docCategory:  'THUYET_MINH_DE_TAI',
      title:        'Thuyết minh đề tài - Bảo đảm hậu cần kỹ thuật.pdf',
      filePath:     'science-attachments/project/demo-att-001.pdf',
      fileSize:     BigInt(512_000),
      mimeType:     'application/pdf',
      checksumSha256: 'abc123demo0000000000000000000000000000000000000000000000000000001',
    },
    {
      id:           'demo-att-002',
      entityType:   'PROJECT',
      entityId:     'demo-proj-draft-001',
      docCategory:  'CV_CHU_NHIEM',
      title:        'CV Trung tá Nguyễn Văn Bình.docx',
      filePath:     'science-attachments/project/demo-att-002.docx',
      fileSize:     BigInt(128_000),
      mimeType:     'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      checksumSha256: 'abc123demo0000000000000000000000000000000000000000000000000000002',
    },
  ]

  for (const att of attachmentData) {
    await db.scienceAttachment.upsert({
      where:  { id: att.id },
      create: { ...att, uploadedById: GIANGVIEN_ID, sensitivity: 'NORMAL' },
      update: { title: att.title },
    })
  }
  console.log('  ✓ 2 ScienceAttachment mẫu cho đề tài DRAFT')

  // 6. ScienceAttachment cho đề tài REJECTED
  await db.scienceAttachment.upsert({
    where:  { id: 'demo-att-003' },
    create: {
      id:           'demo-att-003',
      entityType:   'PROJECT',
      entityId:     'demo-proj-rejected-001',
      docCategory:  'THUYET_MINH_DE_TAI',
      title:        'Thuyết minh đề tài AI kho vật tư (phiên bản 1).pdf',
      filePath:     'science-attachments/project/demo-att-003.pdf',
      fileSize:     BigInt(720_000),
      mimeType:     'application/pdf',
      checksumSha256: 'abc123demo0000000000000000000000000000000000000000000000000000003',
      uploadedById: GIANGVIEN_ID,
      sensitivity:  'NORMAL',
    },
    update: { title: 'Thuyết minh đề tài AI kho vật tư (phiên bản 1).pdf' },
  })
  console.log('  ✓ 1 ScienceAttachment mẫu cho đề tài REJECTED')

  // 7. Tóm tắt kết quả
  const allProjects = await db.nckhProject.findMany({
    where: { principalInvestigatorId: GIANGVIEN_ID },
    select: { id: true, projectCode: true, title: true, status: true },
    orderBy: { createdAt: 'asc' },
  })

  const memberProjects = await db.nckhMember.findMany({
    where: { userId: GIANGVIEN_ID },
    include: { project: { select: { projectCode: true, title: true, status: true } } },
  })

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('✅  seed_science_proposal_demo.ts hoàn thành!')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('\nTài khoản test:')
  console.log('  Email : giangvien@demo.hvhc.edu.vn')
  console.log('  Mật khẩu: Demo@2025')
  console.log('\nĐề tài của giangvien (PI):')
  for (const p of allProjects) {
    console.log(`  [${p.status.padEnd(12)}] ${p.projectCode} — ${p.title.slice(0, 60)}`)
  }
  console.log('\nĐề tài tham gia (member):')
  for (const m of memberProjects) {
    console.log(`  [${m.project.status.padEnd(12)}] ${m.project.projectCode} — ${m.project.title.slice(0, 60)}`)
  }
  console.log('\nURL để kiểm tra:')
  console.log('  /dashboard/personal/my-research                    → Tổng quan đề tài cá nhân')
  console.log('  /dashboard/science/activities/proposals             → Danh sách đề xuất')
  console.log('  /dashboard/science/projects/new                     → Tạo đề xuất mới')
  console.log(`  /dashboard/science/projects/demo-proj-draft-001/edit     → Tiếp tục soạn (DRAFT)`)
  console.log(`  /dashboard/science/projects/demo-proj-rejected-001/edit  → Chỉnh sửa lại (REJECTED)`)
  console.log(`  /dashboard/science/projects/demo-proj-active-001         → Chi tiết đề tài đang TH`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
}

main().catch(console.error).finally(() => db.$disconnect())
