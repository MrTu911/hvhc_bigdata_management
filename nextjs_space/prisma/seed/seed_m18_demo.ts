/**
 * Seed Demo Data for M18 – Template Management & Export Engine
 *
 * Tạo:
 *   - 12 ReportTemplate (6 nhóm nghiệp vụ, nhiều format)
 *   - 24 ReportTemplateVersion (version rows – con của root template)
 *   - 10 ExportJob (các trạng thái: COMPLETED, FAILED, PENDING, PROCESSING)
 *   - 4 TemplateSchedule (lịch xuất định kỳ)
 *   - 30 TemplateAnalyticsDaily (thống kê 30 ngày gần nhất)
 *
 * Run: npx tsx --require dotenv/config prisma/seed/seed_m18_demo.ts
 */

import { PrismaClient, ExportJobStatus } from '@prisma/client'
import { subDays } from 'date-fns'

const db = new PrismaClient()

// ─── Template definitions ─────────────────────────────────────────────────────

const TEMPLATES = [
  // NHÂN SỰ
  {
    code: 'TPL_NS_DANHSACH',
    name: 'Danh sách cán bộ đơn vị',
    description: 'Danh sách toàn bộ cán bộ theo đơn vị, bao gồm quân hàm, chức vụ, thời gian công tác.',
    category: 'NHAN_SU',
    moduleSource: ['M02'],
    outputFormats: ['DOCX', 'XLSX'],
    rbacCode: 'EXPORT_DATA',
    placeholders: ['{donVi}', '{ngayLap}', '{danhSach[]}', '{tongSo}', '{chuKy}'],
    dataMap: {
      donVi: { source: 'M02', field: 'unit.name' },
      ngayLap: { source: 'SYSTEM', field: 'currentDate' },
      'danhSach[]': { source: 'M02', field: 'personnel.list' },
      tongSo: { source: 'M02', field: 'personnel.count' },
      chuKy: { source: 'M02', field: 'commander.name' },
    },
    version: 2,
  },
  {
    code: 'TPL_NS_HOSOCA',
    name: 'Hồ sơ cá nhân cán bộ',
    description: 'Hồ sơ tóm tắt cán bộ: lý lịch, quá trình công tác, khen thưởng, kỷ luật.',
    category: 'NHAN_SU',
    moduleSource: ['M02', 'M05'],
    outputFormats: ['DOCX', 'PDF'],
    rbacCode: 'EXPORT_DATA',
    placeholders: ['{hoTen}', '{ngaySinh}', '{quanHam}', '{chucVu}', '{donVi}', '{quaTrinhCongTac[]}', '{khenThuong[]}'],
    dataMap: {
      hoTen: { source: 'M02', field: 'personnel.fullName' },
      ngaySinh: { source: 'M02', field: 'personnel.dateOfBirth' },
      quanHam: { source: 'M02', field: 'personnel.rank' },
      chucVu: { source: 'M02', field: 'personnel.position' },
      donVi: { source: 'M02', field: 'unit.name' },
      'quaTrinhCongTac[]': { source: 'M02', field: 'workHistory.list' },
      'khenThuong[]': { source: 'M05', field: 'awards.list' },
    },
    version: 3,
  },
  // ĐẢNG VIÊN
  {
    code: 'TPL_DV_DANHSACH',
    name: 'Danh sách đảng viên chi bộ',
    description: 'Danh sách đảng viên theo chi bộ, ngày kết nạp, chức vụ đảng.',
    category: 'DANG_VIEN',
    moduleSource: ['M03'],
    outputFormats: ['DOCX', 'XLSX'],
    rbacCode: 'EXPORT_DATA',
    placeholders: ['{tenChiBo}', '{ngayLap}', '{danhSachDangVien[]}', '{tongSoDangVien}'],
    dataMap: {
      tenChiBo: { source: 'M03', field: 'partyCell.name' },
      ngayLap: { source: 'SYSTEM', field: 'currentDate' },
      'danhSachDangVien[]': { source: 'M03', field: 'members.list' },
      tongSoDangVien: { source: 'M03', field: 'members.count' },
    },
    version: 1,
  },
  {
    code: 'TPL_DV_XETKET',
    name: 'Biên bản xét kết nạp đảng viên',
    description: 'Biên bản cuộc họp chi bộ xét kết nạp đảng viên mới.',
    category: 'DANG_VIEN',
    moduleSource: ['M03'],
    outputFormats: ['DOCX'],
    rbacCode: 'EXPORT_DATA',
    placeholders: ['{hoTenDuBi}', '{ngayHop}', '{tenChiBo}', '{ketQua}', '{ghiChu}', '{thuKy}'],
    dataMap: {
      hoTenDuBi: { source: 'M03', field: 'candidate.fullName' },
      ngayHop: { source: 'M03', field: 'meeting.date' },
      tenChiBo: { source: 'M03', field: 'partyCell.name' },
      ketQua: { source: 'M03', field: 'meeting.result' },
      ghiChu: { source: 'M03', field: 'meeting.notes' },
      thuKy: { source: 'M03', field: 'meeting.secretary' },
    },
    version: 2,
  },
  // BẢO HIỂM
  {
    code: 'TPL_BH_THONGTIN',
    name: 'Thông tin BHXH cán bộ',
    description: 'Tổng hợp thông tin bảo hiểm xã hội của cán bộ theo đơn vị.',
    category: 'BAO_HIEM',
    moduleSource: ['M05', 'M02'],
    outputFormats: ['XLSX'],
    rbacCode: 'EXPORT_DATA',
    placeholders: [],
    dataMap: {
      donVi: { source: 'M02', field: 'unit.name' },
      'danhSach[]': { source: 'M05', field: 'insurance.list' },
    },
    version: 1,
  },
  // CHẾ ĐỘ CHÍNH SÁCH
  {
    code: 'TPL_CD_QUYETDINH',
    name: 'Quyết định chế độ chính sách',
    description: 'Mẫu quyết định giải quyết chế độ BHXH, nghỉ phép, phụ cấp.',
    category: 'CHE_DO',
    moduleSource: ['M05'],
    outputFormats: ['DOCX'],
    rbacCode: 'EXPORT_DATA',
    placeholders: ['{soQuyetDinh}', '{ngayKy}', '{hoTen}', '{loaiCheDoc}', '{soTien}', '{nguoiKy}', '{chucVuNguoiKy}'],
    dataMap: {
      soQuyetDinh: { source: 'M05', field: 'policyRecord.decisionNumber' },
      ngayKy: { source: 'M05', field: 'policyRecord.signedDate' },
      hoTen: { source: 'M02', field: 'personnel.fullName' },
      loaiCheDoc: { source: 'M05', field: 'policyRecord.type' },
      soTien: { source: 'M05', field: 'policyRecord.amount' },
      nguoiKy: { source: 'M02', field: 'commander.fullName' },
      chucVuNguoiKy: { source: 'M02', field: 'commander.position' },
    },
    version: 4,
  },
  // KHEN THƯỞNG - KỶ LUẬT
  {
    code: 'TPL_KT_QUYETDINH',
    name: 'Quyết định khen thưởng',
    description: 'Mẫu quyết định khen thưởng cá nhân và tập thể.',
    category: 'KHEN_THUONG',
    moduleSource: ['M05'],
    outputFormats: ['DOCX'],
    rbacCode: 'EXPORT_DATA',
    placeholders: ['{soQuyetDinh}', '{ngayKy}', '{loaiKhen}', '{doiTuong}', '{lyDo}', '{nguoiKy}'],
    dataMap: {
      soQuyetDinh: { source: 'M05', field: 'award.decisionNumber' },
      ngayKy: { source: 'M05', field: 'award.signedDate' },
      loaiKhen: { source: 'M05', field: 'award.type' },
      doiTuong: { source: 'M05', field: 'award.recipientName' },
      lyDo: { source: 'M05', field: 'award.reason' },
      nguoiKy: { source: 'M02', field: 'commander.fullName' },
    },
    version: 3,
  },
  {
    code: 'TPL_KT_BANGTONGKET',
    name: 'Bảng tổng kết thi đua khen thưởng',
    description: 'Tổng hợp danh hiệu thi đua khen thưởng toàn đơn vị theo năm.',
    category: 'KHEN_THUONG',
    moduleSource: ['M05'],
    outputFormats: ['XLSX', 'DOCX'],
    rbacCode: 'EXPORT_BATCH',
    placeholders: ['{nam}', '{donVi}', '{danhSach[]}', '{tongKhen}', '{tongKyLuat}'],
    dataMap: {
      nam: { source: 'SYSTEM', field: 'currentYear' },
      donVi: { source: 'M02', field: 'unit.name' },
      'danhSach[]': { source: 'M05', field: 'awards.summary' },
      tongKhen: { source: 'M05', field: 'awards.rewardCount' },
      tongKyLuat: { source: 'M05', field: 'awards.disciplineCount' },
    },
    version: 2,
  },
  // ĐÀO TẠO
  {
    code: 'TPL_DT_BANGDIEM',
    name: 'Bảng điểm học viên',
    description: 'Bảng điểm từng môn học của học viên theo học kỳ.',
    category: 'DAO_TAO',
    moduleSource: ['M10'],
    outputFormats: ['DOCX', 'PDF'],
    rbacCode: 'EXPORT_DATA',
    placeholders: ['{hoTenHocVien}', '{maSinhVien}', '{hocKy}', '{namHoc}', '{danhSachMon[]}', '{diemTrungBinh}', '{xepLoai}'],
    dataMap: {
      hoTenHocVien: { source: 'M10', field: 'student.fullName' },
      maSinhVien: { source: 'M10', field: 'student.studentId' },
      hocKy: { source: 'M10', field: 'term.name' },
      namHoc: { source: 'M10', field: 'academicYear.name' },
      'danhSachMon[]': { source: 'M10', field: 'grades.list' },
      diemTrungBinh: { source: 'M10', field: 'grades.gpa' },
      xepLoai: { source: 'M10', field: 'grades.classification' },
    },
    version: 2,
  },
  {
    code: 'TPL_DT_DANGSACH_HV',
    name: 'Danh sách học viên lớp học phần',
    description: 'Danh sách học viên đăng ký lớp học phần kèm thông tin cơ bản.',
    category: 'DAO_TAO',
    moduleSource: ['M10'],
    outputFormats: ['XLSX'],
    rbacCode: 'EXPORT_DATA',
    placeholders: [],
    dataMap: {
      tenLop: { source: 'M10', field: 'classSection.name' },
      'danhSach[]': { source: 'M10', field: 'enrollments.list' },
      tongSo: { source: 'M10', field: 'enrollments.count' },
    },
    version: 1,
  },
  // NGHIÊN CỨU KHOA HỌC
  {
    code: 'TPL_NCKH_DANHSACH',
    name: 'Danh sách đề tài NCKH',
    description: 'Tổng hợp đề tài nghiên cứu khoa học theo năm và đơn vị chủ trì.',
    category: 'NCKH',
    moduleSource: ['M09'],
    outputFormats: ['XLSX', 'DOCX'],
    rbacCode: 'EXPORT_DATA',
    placeholders: ['{nam}', '{donVi}', '{danhSachDeTai[]}', '{tongSoDeTai}'],
    dataMap: {
      nam: { source: 'SYSTEM', field: 'currentYear' },
      donVi: { source: 'M02', field: 'unit.name' },
      'danhSachDeTai[]': { source: 'M09', field: 'projects.list' },
      tongSoDeTai: { source: 'M09', field: 'projects.count' },
    },
    version: 1,
  },
  {
    code: 'TPL_NCKH_CONGBO',
    name: 'Danh mục công bố khoa học',
    description: 'Danh mục bài báo, tạp chí, sách chuyên khảo của cán bộ nghiên cứu.',
    category: 'NCKH',
    moduleSource: ['M09'],
    outputFormats: ['XLSX'],
    rbacCode: 'EXPORT_DATA',
    placeholders: [],
    dataMap: {
      'danhSach[]': { source: 'M09', field: 'publications.list' },
      tongSo: { source: 'M09', field: 'publications.count' },
    },
    version: 1,
  },
]

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('📦 Seeding M18 Demo Data...\n')

  // Lấy system admin làm createdBy
  const adminUser = await db.user.findFirst({
    where: { userPositions: { some: { position: { code: 'SYSTEM_ADMIN' } } } },
    select: { id: true },
  })
  const createdBy = adminUser?.id ?? (await db.user.findFirst({ select: { id: true } }))?.id
  if (!createdBy) throw new Error('Không tìm thấy user nào để seed')

  // ── 1. Upsert ReportTemplate (root rows) ─────────────────────────────────────

  console.log('1. Tạo ReportTemplate...')
  const templateIdMap = new Map<string, string>()

  for (const t of TEMPLATES) {
    const root = await db.reportTemplate.upsert({
      where: { code_version: { code: t.code, version: t.version } },
      create: {
        code: t.code,
        name: t.name,
        description: t.description,
        category: t.category,
        moduleSource: t.moduleSource,
        outputFormats: t.outputFormats,
        rbacCode: t.rbacCode,
        dataMap: t.dataMap,
        placeholders: t.placeholders,
        version: t.version,
        isActive: true,
        isLatest: true,
        createdBy,
      },
      update: {
        name: t.name,
        description: t.description,
        dataMap: t.dataMap,
        placeholders: t.placeholders,
        isActive: true,
        isLatest: true,
      },
    })
    templateIdMap.set(t.code, root.id)
    console.log(`   ✓ ${t.code} v${t.version} (${root.id})`)
  }

  // ── 2. Tạo version rows (lịch sử phiên bản) ──────────────────────────────────

  console.log('\n2. Tạo version rows...')
  let versionCount = 0

  for (const t of TEMPLATES) {
    if (t.version <= 1) continue // chỉ tạo version cho template có version > 1
    const rootId = templateIdMap.get(t.code)
    if (!rootId) continue

    // Tạo các version trước (version 1 → t.version - 1)
    for (let v = 1; v < t.version; v++) {
      const existing = await db.reportTemplate.findFirst({
        where: { parentId: rootId, version: v },
      })
      if (existing) continue

      const changeNotes: Record<number, string> = {
        1: 'Phiên bản khởi tạo',
        2: 'Cập nhật placeholder theo mẫu BQP 2023',
        3: 'Bổ sung trường chữ ký và dấu đơn vị',
      }

      await db.reportTemplate.create({
        data: {
          code: t.code,
          name: t.name,
          description: t.description,
          category: t.category,
          moduleSource: t.moduleSource,
          outputFormats: t.outputFormats,
          rbacCode: t.rbacCode,
          dataMap: t.dataMap,
          placeholders: v === 1 ? [] : t.placeholders.slice(0, -1), // version cũ ít placeholder hơn
          version: v,
          isActive: true,
          isLatest: false,
          parentId: rootId,
          changeNote: changeNotes[v] ?? `Cập nhật lần ${v}`,
          createdBy,
          createdAt: subDays(new Date(), (t.version - v) * 30),
        },
      })
      versionCount++
    }
  }
  console.log(`   ✓ ${versionCount} version rows tạo mới`)

  // ── 3. Tạo ExportJob ─────────────────────────────────────────────────────────

  console.log('\n3. Tạo ExportJob...')

  const allTemplates = await db.reportTemplate.findMany({
    where: { isLatest: true, parentId: null },
    select: { id: true, code: true, version: true },
  })

  const jobDefs: Array<{
    templateCode: string
    status: ExportJobStatus
    entityType: string
    outputFormat: string
    successCount: number
    failCount: number
    progress: number
    daysAgo: number
    callerType?: string
  }> = [
    { templateCode: 'TPL_NS_DANHSACH',   status: 'COMPLETED',   entityType: 'UNIT',       outputFormat: 'XLSX',  successCount: 42, failCount: 0,  progress: 100, daysAgo: 1 },
    { templateCode: 'TPL_NS_HOSOCA',      status: 'COMPLETED',   entityType: 'PERSONNEL',  outputFormat: 'DOCX',  successCount: 1,  failCount: 0,  progress: 100, daysAgo: 2 },
    { templateCode: 'TPL_DV_DANHSACH',   status: 'COMPLETED',   entityType: 'PARTY_CELL', outputFormat: 'DOCX',  successCount: 18, failCount: 0,  progress: 100, daysAgo: 3 },
    { templateCode: 'TPL_KT_BANGTONGKET', status: 'FAILED',      entityType: 'UNIT',       outputFormat: 'XLSX',  successCount: 0,  failCount: 1,  progress: 0,   daysAgo: 4 },
    { templateCode: 'TPL_DT_BANGDIEM',   status: 'COMPLETED',   entityType: 'STUDENT',    outputFormat: 'PDF',   successCount: 1,  failCount: 0,  progress: 100, daysAgo: 5 },
    { templateCode: 'TPL_KT_QUYETDINH', status: 'COMPLETED',   entityType: 'AWARD',      outputFormat: 'DOCX',  successCount: 5,  failCount: 0,  progress: 100, daysAgo: 6 },
    { templateCode: 'TPL_CD_QUYETDINH', status: 'COMPLETED',   entityType: 'POLICY',     outputFormat: 'DOCX',  successCount: 3,  failCount: 0,  progress: 100, daysAgo: 7 },
    { templateCode: 'TPL_NS_DANHSACH',   status: 'PROCESSING',  entityType: 'UNIT',       outputFormat: 'DOCX',  successCount: 12, failCount: 0,  progress: 45,  daysAgo: 0 },
    { templateCode: 'TPL_NCKH_DANHSACH', status: 'PENDING',     entityType: 'UNIT',       outputFormat: 'XLSX',  successCount: 0,  failCount: 0,  progress: 0,   daysAgo: 0 },
    { templateCode: 'TPL_DT_BANGDIEM',   status: 'COMPLETED',   entityType: 'STUDENT',    outputFormat: 'DOCX',  successCount: 1,  failCount: 0,  progress: 100, daysAgo: 8, callerType: 'CHATBOT' },
  ]

  let jobCount = 0
  for (const jd of jobDefs) {
    const tpl = allTemplates.find((t) => t.code === jd.templateCode)
    if (!tpl) { console.warn(`   ⚠ Template not found: ${jd.templateCode}`); continue }

    await db.exportJob.create({
      data: {
        templateId: tpl.id,
        templateVersion: tpl.version,
        requestedBy: createdBy,
        entityIds: ['demo-entity-id'],
        entityType: jd.entityType,
        outputFormat: jd.outputFormat,
        status: jd.status,
        progress: jd.progress,
        successCount: jd.successCount,
        failCount: jd.failCount,
        errors: jd.status === 'FAILED' ? { message: 'MinIO connection timeout', retryable: true } : undefined,
        callerType: jd.callerType,
        createdAt: subDays(new Date(), jd.daysAgo),
        completedAt: jd.status === 'COMPLETED' ? subDays(new Date(), jd.daysAgo) : undefined,
      },
    })
    jobCount++
  }
  console.log(`   ✓ ${jobCount} ExportJob records`)

  // ── 4. Tạo TemplateSchedule ───────────────────────────────────────────────────

  console.log('\n4. Tạo TemplateSchedule...')

  const scheduleDefs = [
    {
      templateCode: 'TPL_NS_DANHSACH',
      entityType: 'UNIT',
      cronExpression: '0 7 1 * *',   // 7h ngày 1 hàng tháng
      outputFormat: 'XLSX',
      recipientEmails: ['phong.to-chuc@hvhc.edu.vn'],
      zipName: 'danh-sach-can-bo-thang',
    },
    {
      templateCode: 'TPL_KT_BANGTONGKET',
      entityType: 'UNIT',
      cronExpression: '0 8 1 1 *',   // 8h ngày 1/1 hàng năm
      outputFormat: 'XLSX',
      recipientEmails: ['ban.chi-huy@hvhc.edu.vn', 'phong.to-chuc@hvhc.edu.vn'],
      zipName: 'tong-ket-thi-dua',
    },
    {
      templateCode: 'TPL_DT_BANGDIEM',
      entityType: 'STUDENT',
      cronExpression: '0 6 15 6 *',  // 6h ngày 15/6 (cuối học kỳ)
      outputFormat: 'DOCX',
      recipientEmails: ['phong.dao-tao@hvhc.edu.vn'],
      zipName: 'bang-diem-cuoi-ky',
    },
    {
      templateCode: 'TPL_NCKH_DANHSACH',
      entityType: 'UNIT',
      cronExpression: '0 8 1 12 *',  // 8h ngày 1/12 (tổng kết NCKH năm)
      outputFormat: 'XLSX',
      recipientEmails: ['phong.qlkh@hvhc.edu.vn'],
      zipName: 'tong-ket-nckh',
    },
  ]

  let scheduleCount = 0
  for (const sd of scheduleDefs) {
    const tpl = allTemplates.find((t) => t.code === sd.templateCode)
    if (!tpl) continue

    await db.templateSchedule.create({
      data: {
        templateId: tpl.id,
        entityType: sd.entityType,
        filterJson: { scope: 'ACADEMY' },
        cronExpression: sd.cronExpression,
        outputFormat: sd.outputFormat,
        recipientEmails: sd.recipientEmails,
        zipName: sd.zipName,
        isActive: true,
        createdBy,
      },
    })
    scheduleCount++
  }
  console.log(`   ✓ ${scheduleCount} TemplateSchedule records`)

  // ── 5. Tạo TemplateAnalyticsDaily (30 ngày) ───────────────────────────────────

  console.log('\n5. Tạo TemplateAnalyticsDaily...')

  // Chọn 5 template phổ biến nhất để có analytics
  const analyticsTemplates = allTemplates.filter((t) =>
    ['TPL_NS_DANHSACH', 'TPL_DT_BANGDIEM', 'TPL_KT_QUYETDINH', 'TPL_DV_DANHSACH', 'TPL_NS_HOSOCA'].includes(t.code),
  )

  // Thống kê mẫu theo template (dùng xuất nhiều vs ít)
  const usageProfile: Record<string, { base: number; variance: number; avgMs: number }> = {
    TPL_NS_DANHSACH:  { base: 8,  variance: 5, avgMs: 1200 },
    TPL_DT_BANGDIEM:  { base: 5,  variance: 3, avgMs: 800  },
    TPL_KT_QUYETDINH: { base: 3,  variance: 2, avgMs: 600  },
    TPL_DV_DANHSACH:  { base: 2,  variance: 1, avgMs: 700  },
    TPL_NS_HOSOCA:    { base: 4,  variance: 3, avgMs: 950  },
  }

  let analyticsCount = 0
  for (const tpl of analyticsTemplates) {
    const profile = usageProfile[tpl.code] ?? { base: 2, variance: 1, avgMs: 800 }

    for (let d = 29; d >= 0; d--) {
      const date = subDays(new Date(), d)
      date.setHours(0, 0, 0, 0)

      // Cuối tuần ít hơn
      const isWeekend = date.getDay() === 0 || date.getDay() === 6
      const total = isWeekend
        ? Math.max(0, Math.round(profile.base * 0.3 + (Math.random() - 0.5) * profile.variance))
        : Math.max(0, Math.round(profile.base + (Math.random() - 0.5) * profile.variance * 2))

      const failCount = total > 0 && Math.random() < 0.05 ? 1 : 0 // 5% xác suất có job thất bại

      const existing = await db.templateAnalyticsDaily.findFirst({
        where: { templateId: tpl.id, date },
      })
      if (existing) continue

      await db.templateAnalyticsDaily.create({
        data: {
          templateId: tpl.id,
          date,
          totalExports: total,
          successCount: total - failCount,
          failCount,
          avgRenderMs: total > 0 ? profile.avgMs + (Math.random() - 0.5) * 200 : null,
        },
      })
      analyticsCount++
    }
  }
  console.log(`   ✓ ${analyticsCount} TemplateAnalyticsDaily records`)

  console.log('\n✅ M18 Demo Data seeded successfully!')
  console.log(`   Templates: ${TEMPLATES.length}`)
  console.log(`   Version rows: ${versionCount}`)
  console.log(`   Export jobs: ${jobCount}`)
  console.log(`   Schedules: ${scheduleCount}`)
  console.log(`   Analytics rows: ${analyticsCount}`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => db.$disconnect())
