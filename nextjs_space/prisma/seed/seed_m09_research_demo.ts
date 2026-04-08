/**
 * Seed M09 Research Demo Data
 * - NckhScientistProfile (10 profiles)
 * - NckhProject (8 projects across statuses/categories)
 * - NckhMember (members per project)
 * - NckhMilestone (milestones per project)
 * - NckhPublication (20 publications)
 * - NckhPublicationAuthor (linking publications to internal/external authors)
 *
 * Run: npx tsx --require dotenv/config prisma/seed/seed_m09_research_demo.ts
 */

import { PrismaClient, NckhMemberRole, NckhMilestoneStatus, NckhPublicationType, NckhPublicationStatus } from '@prisma/client'

const db = new PrismaClient()

// ─── Existing users with FacultyProfile (fetched at runtime) ─────────────────
// We pick 12 users with facultyProfile for scientists, 8 of them as PIs

async function main() {
  console.log('🔬 Seeding M09 Research Demo Data...')

  // 1. Fetch existing faculty users
  const facultyUsers = await db.user.findMany({
    where: { facultyProfile: { isNot: null } },
    select: {
      id: true,
      name: true,
      rank: true,
      unitId: true,
      unitRelation: { select: { id: true, name: true, code: true } },
      facultyProfile: {
        select: {
          academicDegree: true,
          specialization: true,
          academicRank: true,
          researchInterests: true,
          orcidId: true,
        },
      },
    },
    take: 30,
  })

  if (facultyUsers.length < 8) {
    throw new Error('Cần ít nhất 8 faculty users để seed dữ liệu M09')
  }

  // Pick scientists: preference order TS/GS users first
  const sorted = [...facultyUsers].sort((a, b) => {
    const degreeScore = (d: string | null) => d === 'Tiến sĩ' ? 2 : d === 'Thạc sĩ' ? 1 : 0
    const rankScore  = (r: string | null) => r === 'Giáo sư' ? 2 : r === 'Phó Giáo sư' ? 1 : 0
    return (degreeScore(b.facultyProfile?.academicDegree ?? null) + rankScore(b.facultyProfile?.academicRank ?? null))
         - (degreeScore(a.facultyProfile?.academicDegree ?? null) + rankScore(a.facultyProfile?.academicRank ?? null))
  })

  const scientists = sorted.slice(0, 12) // seed 12 scientist profiles

  // ── Mapping helpers ──────────────────────────────────────────────────────────

  const FIELDS_BY_UNIT: Record<string, string[]> = {
    'VIEN1':  ['HOC_THUAT_QUAN_SU', 'HAU_CAN_KY_THUAT'],
    'PQLKH':  ['HAU_CAN_KY_THUAT', 'CNTT'],
    'PCTCT':  ['KHOA_HOC_XA_HOI'],
    'K1':     ['HOC_THUAT_QUAN_SU'],
    'K2':     ['HAU_CAN_KY_THUAT'],
    'K3':     ['KHOA_HOC_TU_NHIEN'],
    'BAN2':   ['CNTT'],
    'B2':     ['HOC_THUAT_QUAN_SU', 'KHOA_HOC_XA_HOI'],
    'B1':     ['KHOA_HOC_XA_HOI'],
  }

  const DEFAULT_FIELDS = ['HOC_THUAT_QUAN_SU', 'HAU_CAN_KY_THUAT']

  function getFieldsForUser(u: typeof scientists[0]) {
    const code = u.unitRelation?.code ?? ''
    return FIELDS_BY_UNIT[code] ?? DEFAULT_FIELDS
  }

  // 2. Upsert NckhScientistProfile for each scientist
  console.log(`  Creating ${scientists.length} NckhScientistProfile records...`)

  const profileData = [
    { hIndex: 12, i10Index: 8,  totalCitations: 340, orcidId: '0000-0002-1234-5678', bio: 'Chuyên gia hàng đầu về hậu cần kỹ thuật quân sự và tối ưu hóa chuỗi cung ứng.' },
    { hIndex: 9,  i10Index: 5,  totalCitations: 210, orcidId: '0000-0003-2345-6789', bio: 'Nghiên cứu ứng dụng AI và học máy trong quản lý hậu cần chiến đấu.' },
    { hIndex: 15, i10Index: 11, totalCitations: 580, orcidId: '0000-0001-9876-5432', bio: 'Giáo sư đầu ngành nghiên cứu khoa học hậu cần quân sự cấp Nhà nước.' },
    { hIndex: 7,  i10Index: 4,  totalCitations: 145, orcidId: null,                  bio: 'Nghiên cứu mô hình dự báo nhu cầu hậu cần trong tác chiến hiện đại.' },
    { hIndex: 5,  i10Index: 2,  totalCitations: 87,  orcidId: null,                  bio: 'Chuyên nghiên cứu phát triển đội ngũ và công tác chính trị trong quân đội.' },
    { hIndex: 6,  i10Index: 3,  totalCitations: 110, orcidId: null,                  bio: 'Nghiên cứu khoa học xã hội và nhân văn quân sự.' },
    { hIndex: 18, i10Index: 14, totalCitations: 720, orcidId: '0000-0002-8765-4321', bio: 'Giáo sư đầu ngành, chuyên gia nghiên cứu chiến lược hậu cần cấp chiến dịch.' },
    { hIndex: 16, i10Index: 12, totalCitations: 640, orcidId: '0000-0003-1111-2222', bio: 'Nghiên cứu tích hợp công nghệ vào hệ thống hậu cần thực chiến.' },
    { hIndex: 8,  i10Index: 4,  totalCitations: 178, orcidId: null,                  bio: 'Chuyên gia tổ chức cán bộ và nghiên cứu khoa học quản lý.' },
    { hIndex: 4,  i10Index: 1,  totalCitations: 65,  orcidId: null,                  bio: 'Nghiên cứu ứng dụng công nghệ thông tin trong quản lý hậu cần.' },
    { hIndex: 11, i10Index: 7,  totalCitations: 290, orcidId: '0000-0001-5555-6666', bio: 'Chuyên gia nghiên cứu khoa học quân nhu và kỹ thuật hậu cần cấp chiến thuật.' },
    { hIndex: 3,  i10Index: 0,  totalCitations: 42,  orcidId: null,                  bio: 'Nghiên cứu viên, chuyên về đổi mới phương pháp dạy học quân sự.' },
  ]

  const keywordSets = [
    ['hậu cần', 'chuỗi cung ứng', 'tối ưu hóa', 'logistics'],
    ['AI', 'học máy', 'hậu cần chiến đấu', 'dự báo'],
    ['chiến lược quân sự', 'hậu cần cấp chiến dịch', 'lý luận'],
    ['mô hình hóa', 'mô phỏng', 'dự báo nhu cầu'],
    ['chính trị quân sự', 'công tác tư tưởng', 'giáo dục chính trị'],
    ['khoa học xã hội', 'lịch sử quân sự', 'văn hóa quân sự'],
    ['chiến lược hậu cần', 'tác chiến hợp nhất', 'cấp chiến dịch'],
    ['công nghệ hậu cần', 'thực chiến', 'IoT quân sự'],
    ['quản lý cán bộ', 'tổ chức quân sự', 'nhân lực quốc phòng'],
    ['CNTT', 'chuyển đổi số', 'hệ thống thông tin quân sự'],
    ['quân nhu', 'kỹ thuật hậu cần', 'vật chất chiến đấu'],
    ['giáo dục quân sự', 'phương pháp dạy học', 'học viện'],
  ]

  for (let i = 0; i < scientists.length; i++) {
    const u = scientists[i]
    const fp = u.facultyProfile!
    const pData = profileData[i] ?? profileData[0]
    const kw = keywordSets[i] ?? keywordSets[0]
    const fields = getFieldsForUser(u)

    await db.nckhScientistProfile.upsert({
      where: { userId: u.id },
      create: {
        userId: u.id,
        academicRank:       fp.academicRank ?? null,
        degree:             fp.academicDegree ?? null,
        specialization:     fp.specialization ?? null,
        researchFields:     fields,
        researchKeywords:   kw,
        hIndex:             pData.hIndex,
        i10Index:           pData.i10Index,
        totalCitations:     pData.totalCitations,
        totalPublications:  0, // will be computed after pub seed
        projectLeadCount:   0,
        projectMemberCount: 0,
        orcidId:            pData.orcidId,
        bio:                pData.bio,
        awards:             i < 4 ? ['Chiến sĩ thi đua cấp Học viện', 'Giải thưởng NCKH xuất sắc'] : [],
      },
      update: {
        academicRank:     fp.academicRank ?? null,
        degree:           fp.academicDegree ?? null,
        specialization:   fp.specialization ?? null,
        researchFields:   fields,
        researchKeywords: kw,
        hIndex:           pData.hIndex,
        i10Index:         pData.i10Index,
        totalCitations:   pData.totalCitations,
        orcidId:          pData.orcidId,
        bio:              pData.bio,
      },
    })
  }

  // 3. Create NckhProject records
  console.log('  Creating 8 NckhProject records...')

  const piUsers = scientists.slice(0, 8)   // first 8 are PIs
  const memberUsers = scientists.slice(2)   // overlapping pool for members

  type ProjectSeed = {
    projectCode: string
    title: string
    titleEn: string
    category: string
    field: string
    researchType: string
    status: string
    phase: string
    budgetYear: number
    budgetRequested: number
    budgetApproved: number | null
    startDate: Date
    endDate: Date
    abstract: string
    keywords: string[]
    piIndex: number   // index into piUsers
    unitId: string
    memberIndices: number[]
  }

  const units = await db.unit.findMany({ select: { id: true, code: true } })
  const unitByCode = Object.fromEntries(units.map((u) => [u.code, u.id]))

  // fallback unit
  const defaultUnitId = units[0].id

  const projectSeeds: ProjectSeed[] = [
    {
      projectCode: 'NCKH-HVHC-2024-001',
      title: 'Nghiên cứu xây dựng mô hình dự báo nhu cầu vật chất hậu cần trong điều kiện tác chiến hiện đại',
      titleEn: 'Research on building logistics demand forecasting models under modern combat conditions',
      category: 'CAP_HOC_VIEN',
      field: 'HOC_THUAT_QUAN_SU',
      researchType: 'UNG_DUNG',
      status: 'COMPLETED',
      phase: 'ARCHIVED',
      budgetYear: 2024,
      budgetRequested: 320,
      budgetApproved: 300,
      startDate: new Date('2024-01-15'),
      endDate: new Date('2024-11-30'),
      abstract: 'Đề tài nghiên cứu xây dựng mô hình dự báo nhu cầu vật chất hậu cần dựa trên dữ liệu lịch sử và các thuật toán học máy, ứng dụng trong điều kiện tác chiến hiện đại của Quân đội nhân dân Việt Nam.',
      keywords: ['dự báo', 'hậu cần', 'học máy', 'tác chiến hiện đại'],
      piIndex: 0,
      unitId: unitByCode['VIEN1'] ?? defaultUnitId,
      memberIndices: [1, 2, 3],
    },
    {
      projectCode: 'NCKH-HVHC-2024-002',
      title: 'Ứng dụng trí tuệ nhân tạo trong quản lý và điều phối hậu cần chiến thuật',
      titleEn: 'Application of Artificial Intelligence in tactical logistics management and coordination',
      category: 'CAP_TONG_CUC',
      field: 'CNTT',
      researchType: 'UNG_DUNG',
      status: 'IN_PROGRESS',
      phase: 'EXECUTION',
      budgetYear: 2024,
      budgetRequested: 480,
      budgetApproved: 450,
      startDate: new Date('2024-03-01'),
      endDate: new Date('2025-08-31'),
      abstract: 'Nghiên cứu và ứng dụng các thuật toán AI/ML để tự động hóa quy trình quản lý kho hậu cần, tối ưu hóa vận chuyển và phân phối vật tư chiến đấu trong điều kiện thực tế.',
      keywords: ['AI', 'hậu cần chiến thuật', 'tự động hóa', 'kho vận'],
      piIndex: 1,
      unitId: unitByCode['PQLKH'] ?? defaultUnitId,
      memberIndices: [0, 4, 5, 6],
    },
    {
      projectCode: 'NCKH-HVHC-2025-001',
      title: 'Chiến lược phát triển hậu cần Quân đội nhân dân Việt Nam đến năm 2035 và tầm nhìn 2045',
      titleEn: 'Development strategy for Vietnam People\'s Army logistics to 2035 with a vision to 2045',
      category: 'CAP_BO_QUOC_PHONG',
      field: 'HOC_THUAT_QUAN_SU',
      researchType: 'CO_BAN',
      status: 'APPROVED',
      phase: 'CONTRACT',
      budgetYear: 2025,
      budgetRequested: 1200,
      budgetApproved: 1100,
      startDate: new Date('2025-02-01'),
      endDate: new Date('2026-12-31'),
      abstract: 'Đề tài nghiên cứu cơ bản về chiến lược phát triển hệ thống hậu cần Quân đội nhân dân Việt Nam trong bối cảnh hiện đại hóa quân đội và hội nhập quốc tế.',
      keywords: ['chiến lược hậu cần', 'phát triển quân sự', '2035', 'hiện đại hóa'],
      piIndex: 2,
      unitId: unitByCode['VIEN1'] ?? defaultUnitId,
      memberIndices: [3, 4, 7],
    },
    {
      projectCode: 'NCKH-HVHC-2025-002',
      title: 'Nghiên cứu ứng dụng công nghệ blockchain trong quản lý chuỗi cung ứng hậu cần quân sự',
      titleEn: 'Research on blockchain technology application in military logistics supply chain management',
      category: 'CAP_HOC_VIEN',
      field: 'CNTT',
      researchType: 'UNG_DUNG',
      status: 'IN_PROGRESS',
      phase: 'MIDTERM_REVIEW',
      budgetYear: 2025,
      budgetRequested: 280,
      budgetApproved: 260,
      startDate: new Date('2025-01-10'),
      endDate: new Date('2025-10-31'),
      abstract: 'Nghiên cứu khả năng ứng dụng công nghệ blockchain để tăng tính minh bạch, an toàn và hiệu quả trong quản lý chuỗi cung ứng vật tư kỹ thuật quân sự.',
      keywords: ['blockchain', 'chuỗi cung ứng', 'hậu cần quân sự', 'minh bạch'],
      piIndex: 3,
      unitId: unitByCode['PQLKH'] ?? defaultUnitId,
      memberIndices: [0, 1, 8],
    },
    {
      projectCode: 'NCKH-HVHC-2025-003',
      title: 'Nghiên cứu mô hình giáo dục chính trị tư tưởng cho học viên trong bối cảnh chuyển đổi số',
      titleEn: 'Research on political-ideological education model for cadets in digital transformation context',
      category: 'CAP_HOC_VIEN',
      field: 'KHOA_HOC_XA_HOI',
      researchType: 'UNG_DUNG',
      status: 'IN_PROGRESS',
      phase: 'EXECUTION',
      budgetYear: 2025,
      budgetRequested: 180,
      budgetApproved: 170,
      startDate: new Date('2025-03-01'),
      endDate: new Date('2025-12-31'),
      abstract: 'Đề tài nghiên cứu xây dựng mô hình giáo dục chính trị tư tưởng phù hợp với xu thế chuyển đổi số, ứng dụng công nghệ trong giảng dạy lý luận chính trị quân sự.',
      keywords: ['giáo dục chính trị', 'chuyển đổi số', 'học viên', 'lý luận'],
      piIndex: 4,
      unitId: unitByCode['PCTCT'] ?? defaultUnitId,
      memberIndices: [5, 9],
    },
    {
      projectCode: 'SANG_KIEN-2025-001',
      title: 'Sáng kiến cải tiến quy trình quản lý kho vật tư kỹ thuật cấp đại đội',
      titleEn: 'Innovation to improve company-level technical supply management process',
      category: 'SANG_KIEN_CO_SO',
      field: 'HAU_CAN_KY_THUAT',
      researchType: 'SANG_KIEN_KINH_NGHIEM',
      status: 'COMPLETED',
      phase: 'ACCEPTED',
      budgetYear: 2025,
      budgetRequested: 20,
      budgetApproved: 20,
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-04-30'),
      abstract: 'Sáng kiến kinh nghiệm về cải tiến quy trình kiểm kê, bảo quản và cấp phát vật tư kỹ thuật tại cấp đại đội, áp dụng mã QR và phần mềm quản lý.',
      keywords: ['sáng kiến', 'kho vật tư', 'QR code', 'cấp đại đội'],
      piIndex: 5,
      unitId: unitByCode['K2'] ?? defaultUnitId,
      memberIndices: [10, 11],
    },
    {
      projectCode: 'NCKH-HVHC-2025-004',
      title: 'Tối ưu hóa mạng lưới phân phối hậu cần cấp chiến dịch bằng thuật toán di truyền',
      titleEn: 'Optimization of campaign-level logistics distribution network using genetic algorithms',
      category: 'CAP_TONG_CUC',
      field: 'HOC_THUAT_QUAN_SU',
      researchType: 'CO_BAN',
      status: 'UNDER_REVIEW',
      phase: 'PROPOSAL',
      budgetYear: 2025,
      budgetRequested: 560,
      budgetApproved: null,
      startDate: new Date('2025-06-01'),
      endDate: new Date('2026-12-31'),
      abstract: 'Nghiên cứu ứng dụng thuật toán di truyền và các phương pháp tối ưu hóa hiện đại để giải bài toán tối ưu mạng lưới phân phối hậu cần trong tác chiến cấp chiến dịch.',
      keywords: ['tối ưu hóa', 'thuật toán di truyền', 'hậu cần chiến dịch', 'mạng phân phối'],
      piIndex: 6,
      unitId: unitByCode['VIEN1'] ?? defaultUnitId,
      memberIndices: [0, 7, 8],
    },
    {
      projectCode: 'NCKH-HVHC-2025-005',
      title: 'Nghiên cứu xây dựng hệ thống thông tin tích hợp quản lý hậu cần thực chiến',
      titleEn: 'Research on building integrated information systems for real-time logistics management',
      category: 'CAP_HOC_VIEN',
      field: 'CNTT',
      researchType: 'TRIEN_KHAI',
      status: 'SUBMITTED',
      phase: 'PROPOSAL',
      budgetYear: 2026,
      budgetRequested: 380,
      budgetApproved: null,
      startDate: new Date('2026-01-01'),
      endDate: new Date('2027-06-30'),
      abstract: 'Nghiên cứu và triển khai hệ thống thông tin tích hợp (IIS) cho phép theo dõi thời gian thực tình hình hậu cần chiến đấu, kết nối từ cấp tiểu đoàn đến Học viện.',
      keywords: ['hệ thống thông tin', 'thời gian thực', 'hậu cần thực chiến', 'tích hợp'],
      piIndex: 7,
      unitId: unitByCode['PQLKH'] ?? defaultUnitId,
      memberIndices: [1, 3, 9, 10],
    },
  ]

  const createdProjects: Array<{ id: string; piIndex: number; field: string }> = []

  for (const seed of projectSeeds) {
    const pi = piUsers[seed.piIndex]
    if (!pi) continue

    const existing = await db.nckhProject.findUnique({ where: { projectCode: seed.projectCode } })
    if (existing) {
      createdProjects.push({ id: existing.id, piIndex: seed.piIndex, field: seed.field })
      continue
    }

    const project = await db.nckhProject.create({
      data: {
        projectCode: seed.projectCode,
        title: seed.title,
        titleEn: seed.titleEn,
        category: seed.category as never,
        field: seed.field as never,
        researchType: seed.researchType as never,
        status: seed.status as never,
        phase: seed.phase as never,
        budgetYear: seed.budgetYear,
        budgetRequested: seed.budgetRequested,
        budgetApproved: seed.budgetApproved,
        startDate: seed.startDate,
        endDate: seed.endDate,
        abstract: seed.abstract,
        keywords: seed.keywords,
        principalInvestigatorId: pi.id,
        unitId: seed.unitId,
      },
    })

    createdProjects.push({ id: project.id, piIndex: seed.piIndex, field: seed.field })

    // Members
    for (const mi of seed.memberIndices) {
      const member = memberUsers[mi]
      if (!member || member.id === pi.id) continue
      await db.nckhMember.upsert({
        where: { projectId_userId: { projectId: project.id, userId: member.id } },
        create: {
          projectId: project.id,
          userId: member.id,
          role: NckhMemberRole.THANH_VIEN_CHINH,
          joinDate: seed.startDate,
          contribution: Math.floor(Math.random() * 30) + 10,
        },
        update: {},
      })
    }

    // Milestones
    const milestoneTemplates = [
      { title: 'Hoàn thiện đề cương và kế hoạch nghiên cứu', daysFromStart: 30, status: 'DONE' },
      { title: 'Thu thập và xử lý dữ liệu', daysFromStart: 90, status: seed.phase === 'PROPOSAL' ? 'PENDING' : 'DONE' },
      { title: 'Xây dựng mô hình / phương án nghiên cứu', daysFromStart: 180, status: ['COMPLETED', 'ARCHIVED', 'ACCEPTED'].includes(seed.status) ? 'DONE' : ['MIDTERM_REVIEW', 'FINAL_REVIEW'].includes(seed.phase) ? 'IN_PROGRESS' : 'PENDING' },
      { title: 'Thực nghiệm và đánh giá kết quả', daysFromStart: 270, status: ['COMPLETED', 'ARCHIVED', 'ACCEPTED'].includes(seed.status) ? 'DONE' : 'PENDING' },
      { title: 'Hoàn thiện báo cáo tổng kết và nghiệm thu', daysFromStart: 360, status: ['ARCHIVED', 'ACCEPTED'].includes(seed.phase) ? 'DONE' : 'PENDING' },
    ]

    for (const ms of milestoneTemplates) {
      const dueDate = new Date(seed.startDate)
      dueDate.setDate(dueDate.getDate() + ms.daysFromStart)
      const completedAt = ms.status === 'DONE' ? new Date(dueDate.getTime() - 5 * 24 * 60 * 60 * 1000) : null
      await db.nckhMilestone.create({
        data: {
          projectId: project.id,
          title: ms.title,
          dueDate,
          completedAt,
          status: (ms.status === 'DONE' ? NckhMilestoneStatus.COMPLETED : ms.status === 'IN_PROGRESS' ? NckhMilestoneStatus.IN_PROGRESS : NckhMilestoneStatus.PENDING),
        },
      })
    }
  }

  console.log(`  Created ${createdProjects.length} projects`)

  // 4. Create NckhPublication records (20 publications)
  console.log('  Creating 20 NckhPublication records...')

  type PubSeed = {
    title: string
    titleEn: string
    pubType: NckhPublicationType
    publishedYear: number
    journal: string
    doi: string | null
    isISI: boolean
    isScopus: boolean
    scopusQ: string | null
    impactFactor: number | null
    ranking: string | null
    citationCount: number
    status: NckhPublicationStatus
    authorsText: string
    abstract: string
    keywords: string[]
    authorIndex: number    // index into scientists[]
    projectIndex: number | null  // index into createdProjects, null = no project
    coauthorIndices: number[]
  }

  const pubSeeds: PubSeed[] = [
    {
      title: 'Mô hình dự báo nhu cầu vật chất hậu cần dựa trên mạng nơ-ron hồi quy trong điều kiện tác chiến',
      titleEn: 'Logistics Demand Forecasting Model Based on Recurrent Neural Networks in Combat Conditions',
      pubType: NckhPublicationType.BAI_BAO_QUOC_TE,
      publishedYear: 2024,
      journal: 'Defence Technology',
      doi: '10.1016/j.dt.2024.01.005',
      isISI: true, isScopus: true, scopusQ: 'Q1',
      impactFactor: 5.08,
      ranking: 'Q1',
      citationCount: 12,
      status: NckhPublicationStatus.PUBLISHED,
      authorsText: scientists[0]?.name + ', ' + scientists[2]?.name + ', Zhang Wei',
      abstract: 'Bài báo đề xuất mô hình dự báo nhu cầu vật chất hậu cần sử dụng mạng nơ-ron hồi quy LSTM trong điều kiện tác chiến bất định...',
      keywords: ['LSTM', 'logistics', 'demand forecasting', 'military'],
      authorIndex: 0,
      projectIndex: 0,
      coauthorIndices: [2],
    },
    {
      title: 'Tối ưu hóa lịch trình vận tải quân sự bằng thuật toán bầy đàn hạt',
      titleEn: 'Military Transport Schedule Optimization Using Particle Swarm Algorithm',
      pubType: NckhPublicationType.BAI_BAO_QUOC_TE,
      publishedYear: 2024,
      journal: 'Computers & Industrial Engineering',
      doi: '10.1016/j.cie.2024.03.021',
      isISI: true, isScopus: true, scopusQ: 'Q1',
      impactFactor: 7.18,
      ranking: 'Q1',
      citationCount: 8,
      status: NckhPublicationStatus.PUBLISHED,
      authorsText: scientists[2]?.name + ', ' + scientists[0]?.name,
      abstract: 'Nghiên cứu ứng dụng thuật toán PSO để tối ưu lịch trình vận tải trong mạng lưới hậu cần quân sự...',
      keywords: ['PSO', 'transport scheduling', 'military logistics'],
      authorIndex: 2,
      projectIndex: 0,
      coauthorIndices: [0],
    },
    {
      title: 'Ứng dụng học máy trong phát hiện bất thường trong hệ thống hậu cần quân sự',
      titleEn: 'Machine Learning Application for Anomaly Detection in Military Logistics Systems',
      pubType: NckhPublicationType.BAI_BAO_QUOC_TE,
      publishedYear: 2024,
      journal: 'Expert Systems with Applications',
      doi: '10.1016/j.eswa.2024.02.019',
      isISI: true, isScopus: true, scopusQ: 'Q1',
      impactFactor: 8.67,
      ranking: 'Q1',
      citationCount: 15,
      status: NckhPublicationStatus.PUBLISHED,
      authorsText: scientists[1]?.name + ', ' + scientists[3]?.name,
      abstract: 'Đề xuất phương pháp phát hiện bất thường trong dữ liệu hệ thống hậu cần quân sự sử dụng các thuật toán học máy không giám sát...',
      keywords: ['anomaly detection', 'machine learning', 'military logistics'],
      authorIndex: 1,
      projectIndex: 1,
      coauthorIndices: [3],
    },
    {
      title: 'Phương pháp tiếp cận hệ thống trong hoạch định chiến lược hậu cần quân sự đến năm 2030',
      titleEn: 'Systems Approach to Military Logistics Strategic Planning Toward 2030',
      pubType: NckhPublicationType.SACH_CHUYEN_KHAO,
      publishedYear: 2023,
      journal: 'NXB Quân đội nhân dân',
      doi: null,
      isISI: false, isScopus: false, scopusQ: null,
      impactFactor: null,
      ranking: null,
      citationCount: 23,
      status: NckhPublicationStatus.PUBLISHED,
      authorsText: scientists[2]?.name + ', ' + scientists[6]?.name,
      abstract: 'Sách chuyên khảo trình bày phương pháp tiếp cận hệ thống trong nghiên cứu và hoạch định chiến lược hậu cần quân đội...',
      keywords: ['chiến lược hậu cần', 'hoạch định', '2030'],
      authorIndex: 2,
      projectIndex: 2,
      coauthorIndices: [6],
    },
    {
      title: 'Ứng dụng công nghệ blockchain đảm bảo tính xác thực trong chuỗi cung ứng vũ khí trang bị',
      titleEn: 'Blockchain Technology Application for Authenticity Assurance in Weapons Supply Chain',
      pubType: NckhPublicationType.BAI_BAO_TRONG_NUOC,
      publishedYear: 2025,
      journal: 'Tạp chí Nghiên cứu Khoa học Hậu cần Quân sự',
      doi: null,
      isISI: false, isScopus: false, scopusQ: null,
      impactFactor: null,
      ranking: null,
      citationCount: 3,
      status: NckhPublicationStatus.PUBLISHED,
      authorsText: scientists[3]?.name + ', ' + scientists[1]?.name,
      abstract: 'Bài báo nghiên cứu khả năng ứng dụng blockchain trong xác thực và truy xuất nguồn gốc vũ khí trang bị kỹ thuật...',
      keywords: ['blockchain', 'chuỗi cung ứng', 'vũ khí trang bị'],
      authorIndex: 3,
      projectIndex: 3,
      coauthorIndices: [1],
    },
    {
      title: 'Công nghệ IoT trong giám sát trạng thái kho vật tư kỹ thuật quân sự',
      titleEn: 'IoT Technology for Monitoring Military Technical Supply Warehouse Status',
      pubType: NckhPublicationType.BAI_BAO_TRONG_NUOC,
      publishedYear: 2024,
      journal: 'Tạp chí Khoa học Công nghệ Quân sự',
      doi: null,
      isISI: false, isScopus: false, scopusQ: null,
      impactFactor: null,
      ranking: null,
      citationCount: 6,
      status: NckhPublicationStatus.PUBLISHED,
      authorsText: scientists[7]?.name + ', ' + scientists[3]?.name,
      abstract: 'Nghiên cứu hệ thống giám sát kho sử dụng IoT để theo dõi nhiệt độ, độ ẩm và trạng thái vật tư trong kho kỹ thuật quân sự...',
      keywords: ['IoT', 'kho vật tư', 'giám sát', 'quân sự'],
      authorIndex: 7,
      projectIndex: 3,
      coauthorIndices: [3],
    },
    {
      title: 'Mô hình tư tưởng chính trị trong đào tạo cán bộ quân sự thời kỳ chuyển đổi số',
      titleEn: 'Political-Ideological Model in Military Cadre Training During Digital Transformation',
      pubType: NckhPublicationType.BAI_BAO_TRONG_NUOC,
      publishedYear: 2025,
      journal: 'Tạp chí Giáo dục Chính trị Quân sự',
      doi: null,
      isISI: false, isScopus: false, scopusQ: null,
      impactFactor: null,
      ranking: null,
      citationCount: 4,
      status: NckhPublicationStatus.PUBLISHED,
      authorsText: scientists[4]?.name + ', ' + scientists[5]?.name,
      abstract: 'Bài báo đề xuất mô hình tổ chức giáo dục tư tưởng chính trị phù hợp với bối cảnh chuyển đổi số trong các học viện, nhà trường quân sự...',
      keywords: ['tư tưởng chính trị', 'cán bộ quân sự', 'chuyển đổi số'],
      authorIndex: 4,
      projectIndex: 4,
      coauthorIndices: [5],
    },
    {
      title: 'Multi-Objective Optimization of Military Logistics Network Under Uncertainty',
      titleEn: 'Multi-Objective Optimization of Military Logistics Network Under Uncertainty',
      pubType: NckhPublicationType.BAI_BAO_QUOC_TE,
      publishedYear: 2024,
      journal: 'European Journal of Operational Research',
      doi: '10.1016/j.ejor.2024.05.018',
      isISI: true, isScopus: true, scopusQ: 'Q1',
      impactFactor: 6.36,
      ranking: 'Q1',
      citationCount: 21,
      status: NckhPublicationStatus.PUBLISHED,
      authorsText: scientists[6]?.name + ', ' + scientists[7]?.name + ', Nguyen Van An',
      abstract: 'This paper addresses the multi-objective military logistics network optimization problem under demand and supply uncertainty using robust optimization...',
      keywords: ['military logistics', 'multi-objective', 'uncertainty', 'robust optimization'],
      authorIndex: 6,
      projectIndex: 6,
      coauthorIndices: [7],
    },
    {
      title: 'Đánh giá hiệu quả sáng kiến cải tiến quy trình quản lý kho cấp đại đội bằng mã QR',
      titleEn: 'Evaluation of QR-code-based Process Innovation for Company-level Supply Warehouse Management',
      pubType: NckhPublicationType.BAO_CAO_KH,
      publishedYear: 2025,
      journal: 'Hội thảo NCKH Học viện Hậu cần 2025',
      doi: null,
      isISI: false, isScopus: false, scopusQ: null,
      impactFactor: null,
      ranking: null,
      citationCount: 1,
      status: NckhPublicationStatus.PUBLISHED,
      authorsText: scientists[5]?.name + ', ' + scientists[10]?.name,
      abstract: 'Báo cáo khoa học trình bày kết quả thực nghiệm và đánh giá hiệu quả sáng kiến ứng dụng mã QR trong quản lý kho vật tư cấp đại đội...',
      keywords: ['sáng kiến', 'QR code', 'kho vật tư', 'đại đội'],
      authorIndex: 5,
      projectIndex: 5,
      coauthorIndices: [10],
    },
    {
      title: 'Deep Reinforcement Learning for Real-time Military Logistics Route Optimization',
      titleEn: 'Deep Reinforcement Learning for Real-time Military Logistics Route Optimization',
      pubType: NckhPublicationType.BAI_BAO_QUOC_TE,
      publishedYear: 2025,
      journal: 'IEEE Transactions on Intelligent Transportation Systems',
      doi: '10.1109/TITS.2025.3401823',
      isISI: true, isScopus: true, scopusQ: 'Q1',
      impactFactor: 8.50,
      ranking: 'Q1',
      citationCount: 4,
      status: NckhPublicationStatus.PUBLISHED,
      authorsText: scientists[1]?.name + ', ' + scientists[6]?.name,
      abstract: 'This paper proposes a deep reinforcement learning approach for real-time route optimization in military logistics networks...',
      keywords: ['deep reinforcement learning', 'route optimization', 'military logistics'],
      authorIndex: 1,
      projectIndex: 1,
      coauthorIndices: [6],
    },
    {
      title: 'Giáo trình Hậu cần chiến đấu (Tái bản lần 3)',
      titleEn: 'Combat Logistics Textbook (3rd Edition)',
      pubType: NckhPublicationType.GIAO_TRINH,
      publishedYear: 2024,
      journal: 'NXB Học viện Hậu cần',
      doi: null,
      isISI: false, isScopus: false, scopusQ: null,
      impactFactor: null,
      ranking: null,
      citationCount: 0,
      status: NckhPublicationStatus.PUBLISHED,
      authorsText: scientists[2]?.name + ', ' + scientists[7]?.name + ', ' + scientists[0]?.name,
      abstract: 'Giáo trình Hậu cần chiến đấu dành cho học viên hệ đào tạo sĩ quan hậu cần cấp phân đội, tái bản có bổ sung cập nhật...',
      keywords: ['hậu cần chiến đấu', 'giáo trình', 'đào tạo sĩ quan'],
      authorIndex: 2,
      projectIndex: null,
      coauthorIndices: [7, 0],
    },
    {
      title: 'Supply Chain Resilience in Military Operations: A Systematic Review',
      titleEn: 'Supply Chain Resilience in Military Operations: A Systematic Review',
      pubType: NckhPublicationType.BAI_BAO_QUOC_TE,
      publishedYear: 2023,
      journal: 'International Journal of Production Economics',
      doi: '10.1016/j.ijpe.2023.108921',
      isISI: true, isScopus: true, scopusQ: 'Q1',
      impactFactor: 9.13,
      ranking: 'Q1',
      citationCount: 34,
      status: NckhPublicationStatus.PUBLISHED,
      authorsText: scientists[2]?.name + ', Park Jae-won, ' + scientists[6]?.name,
      abstract: 'A systematic review of supply chain resilience strategies and frameworks applied in military operations contexts...',
      keywords: ['supply chain resilience', 'military operations', 'systematic review'],
      authorIndex: 2,
      projectIndex: 2,
      coauthorIndices: [6],
    },
    {
      title: 'Phân tích nhân tố ảnh hưởng đến động lực nghiên cứu khoa học của giảng viên quân sự',
      titleEn: 'Factor Analysis of Research Motivation Among Military Faculty Members',
      pubType: NckhPublicationType.BAI_BAO_TRONG_NUOC,
      publishedYear: 2025,
      journal: 'Tạp chí Giáo dục',
      doi: null,
      isISI: false, isScopus: false, scopusQ: null,
      impactFactor: null,
      ranking: null,
      citationCount: 2,
      status: NckhPublicationStatus.PUBLISHED,
      authorsText: scientists[8]?.name + ', ' + scientists[11]?.name,
      abstract: 'Nghiên cứu phân tích các nhân tố ảnh hưởng đến động lực và hiệu quả hoạt động nghiên cứu khoa học của đội ngũ giảng viên trong các học viện quân sự...',
      keywords: ['động lực nghiên cứu', 'giảng viên quân sự', 'phân tích nhân tố'],
      authorIndex: 8,
      projectIndex: null,
      coauthorIndices: [11],
    },
    {
      title: 'Intelligent Warehouse Management System for Military Applications Using Computer Vision',
      titleEn: 'Intelligent Warehouse Management System for Military Applications Using Computer Vision',
      pubType: NckhPublicationType.BAI_BAO_QUOC_TE,
      publishedYear: 2025,
      journal: 'Journal of Manufacturing Systems',
      doi: '10.1016/j.jmsy.2025.01.003',
      isISI: true, isScopus: true, scopusQ: 'Q1',
      impactFactor: 12.10,
      ranking: 'Q1',
      citationCount: 2,
      status: NckhPublicationStatus.PUBLISHED,
      authorsText: scientists[7]?.name + ', ' + scientists[1]?.name + ', ' + scientists[9]?.name,
      abstract: 'This paper presents an intelligent warehouse management system leveraging computer vision and deep learning for military supply depot applications...',
      keywords: ['computer vision', 'warehouse management', 'military', 'deep learning'],
      authorIndex: 7,
      projectIndex: 7,
      coauthorIndices: [1, 9],
    },
    {
      title: 'Xây dựng hệ thống hỗ trợ quyết định trong phân phối nguồn lực hậu cần cấp chiến thuật',
      titleEn: 'Decision Support System for Tactical Logistics Resource Allocation',
      pubType: NckhPublicationType.BAI_BAO_TRONG_NUOC,
      publishedYear: 2024,
      journal: 'Tạp chí Nghiên cứu Khoa học Hậu cần Quân sự',
      doi: null,
      isISI: false, isScopus: false, scopusQ: null,
      impactFactor: null,
      ranking: null,
      citationCount: 5,
      status: NckhPublicationStatus.PUBLISHED,
      authorsText: scientists[9]?.name + ', ' + scientists[7]?.name,
      abstract: 'Bài báo đề xuất kiến trúc và cài đặt hệ thống hỗ trợ quyết định tích hợp nhiều tiêu chí cho bài toán phân phối nguồn lực hậu cần cấp chiến thuật...',
      keywords: ['hỗ trợ quyết định', 'phân phối nguồn lực', 'chiến thuật'],
      authorIndex: 9,
      projectIndex: 7,
      coauthorIndices: [7],
    },
    {
      title: 'Bằng sáng chế: Thiết bị tự động phân loại và kiểm đếm vật tư quân sự bằng thị giác máy',
      titleEn: 'Patent: Automated Classification and Counting Device for Military Supplies Using Machine Vision',
      pubType: NckhPublicationType.PATENT,
      publishedYear: 2024,
      journal: 'Cục Sở hữu trí tuệ Việt Nam – Bằng số 2024-01-0023',
      doi: null,
      isISI: false, isScopus: false, scopusQ: null,
      impactFactor: null,
      ranking: null,
      citationCount: 0,
      status: NckhPublicationStatus.PUBLISHED,
      authorsText: scientists[7]?.name + ', ' + scientists[9]?.name,
      abstract: 'Bằng sáng chế cho thiết bị tự động sử dụng camera và thuật toán nhận dạng ảnh để phân loại, kiểm đếm vật tư quân sự trong kho...',
      keywords: ['bằng sáng chế', 'thị giác máy', 'vật tư quân sự', 'tự động hóa'],
      authorIndex: 7,
      projectIndex: null,
      coauthorIndices: [9],
    },
    {
      title: 'Federated Learning for Privacy-Preserving Military Logistics Analytics',
      titleEn: 'Federated Learning for Privacy-Preserving Military Logistics Analytics',
      pubType: NckhPublicationType.BAI_BAO_QUOC_TE,
      publishedYear: 2025,
      journal: 'Future Generation Computer Systems',
      doi: '10.1016/j.future.2025.02.011',
      isISI: true, isScopus: true, scopusQ: 'Q1',
      impactFactor: 7.19,
      ranking: 'Q1',
      citationCount: 1,
      status: NckhPublicationStatus.IN_REVIEW,
      authorsText: scientists[1]?.name + ', ' + scientists[3]?.name,
      abstract: 'This paper proposes a federated learning framework for military logistics analytics that preserves data privacy while enabling collaborative model training...',
      keywords: ['federated learning', 'privacy', 'military analytics'],
      authorIndex: 1,
      projectIndex: 1,
      coauthorIndices: [3],
    },
    {
      title: 'Nghiên cứu lịch sử phát triển hệ thống hậu cần Quân đội nhân dân Việt Nam giai đoạn 1975–2000',
      titleEn: 'Historical Research on Vietnam People\'s Army Logistics System Development 1975–2000',
      pubType: NckhPublicationType.SACH_CHUYEN_KHAO,
      publishedYear: 2023,
      journal: 'NXB Quân đội nhân dân',
      doi: null,
      isISI: false, isScopus: false, scopusQ: null,
      impactFactor: null,
      ranking: null,
      citationCount: 8,
      status: NckhPublicationStatus.PUBLISHED,
      authorsText: scientists[6]?.name + ', ' + scientists[4]?.name,
      abstract: 'Sách nghiên cứu toàn diện quá trình hình thành và phát triển của hệ thống hậu cần Quân đội nhân dân Việt Nam trong giai đoạn hòa bình sau 1975...',
      keywords: ['lịch sử quân sự', 'hậu cần', '1975-2000', 'phát triển'],
      authorIndex: 6,
      projectIndex: 2,
      coauthorIndices: [4],
    },
    {
      title: 'Sáng kiến ứng dụng phần mềm quản lý kho số trong đơn vị hậu cần cấp trung đoàn',
      titleEn: 'Innovation: Digital Warehouse Management Software Application at Regimental Logistics Level',
      pubType: NckhPublicationType.SANG_KIEN,
      publishedYear: 2025,
      journal: 'Hội đồng Sáng kiến Học viện Hậu cần',
      doi: null,
      isISI: false, isScopus: false, scopusQ: null,
      impactFactor: null,
      ranking: null,
      citationCount: 0,
      status: NckhPublicationStatus.PUBLISHED,
      authorsText: scientists[10]?.name + ', ' + scientists[5]?.name,
      abstract: 'Sáng kiến xây dựng và triển khai phần mềm quản lý kho số phù hợp với yêu cầu bảo mật và hoạt động đặc thù của đơn vị hậu cần cấp trung đoàn...',
      keywords: ['phần mềm kho', 'số hóa', 'hậu cần trung đoàn'],
      authorIndex: 10,
      projectIndex: 5,
      coauthorIndices: [5],
    },
    {
      title: 'Đánh giá hiệu quả tích hợp hệ thống thông tin vào công tác hậu cần chiến đấu ở cấp tiểu đoàn',
      titleEn: 'Assessing Information System Integration Effectiveness in Battalion-level Combat Logistics',
      pubType: NckhPublicationType.BAO_CAO_KH,
      publishedYear: 2025,
      journal: 'Hội thảo NCKH Học viện Hậu cần 2025',
      doi: null,
      isISI: false, isScopus: false, scopusQ: null,
      impactFactor: null,
      ranking: null,
      citationCount: 0,
      status: NckhPublicationStatus.PUBLISHED,
      authorsText: scientists[9]?.name + ', ' + scientists[0]?.name,
      abstract: 'Báo cáo trình bày kết quả thực nghiệm đánh giá hiệu quả tích hợp hệ thống thông tin vào quy trình hậu cần chiến đấu tại đơn vị thực nghiệm cấp tiểu đoàn...',
      keywords: ['hệ thống thông tin', 'hậu cần chiến đấu', 'tiểu đoàn', 'thực nghiệm'],
      authorIndex: 9,
      projectIndex: 7,
      coauthorIndices: [0],
    },
  ]

  let pubCreated = 0
  for (const seed of pubSeeds) {
    const author = scientists[seed.authorIndex]
    if (!author) continue

    const projectId = seed.projectIndex !== null && createdProjects[seed.projectIndex]
      ? createdProjects[seed.projectIndex].id
      : null

    // Check for duplicate by title
    const existing = await db.nckhPublication.findFirst({ where: { title: seed.title } })
    if (existing) continue

    const pub = await db.nckhPublication.create({
      data: {
        title: seed.title,
        titleEn: seed.titleEn,
        pubType: seed.pubType,
        publishedYear: seed.publishedYear,
        journal: seed.journal,
        doi: seed.doi,
        isISI: seed.isISI,
        isScopus: seed.isScopus,
        scopusQ: seed.scopusQ,
        impactFactor: seed.impactFactor,
        ranking: seed.ranking,
        citationCount: seed.citationCount,
        status: seed.status,
        authorsText: seed.authorsText,
        abstract: seed.abstract,
        keywords: seed.keywords,
        authorId: author.id,
        projectId,
      },
    })

    // Primary author
    await db.nckhPublicationAuthor.create({
      data: {
        publicationId: pub.id,
        userId: author.id,
        authorName: author.name,
        authorOrder: 1,
        affiliation: author.unitRelation?.name ?? 'Học viện Hậu cần',
        isInternal: true,
      },
    })

    // Co-authors (internal)
    let order = 2
    for (const ci of seed.coauthorIndices) {
      const co = scientists[ci]
      if (!co || co.id === author.id) continue
      await db.nckhPublicationAuthor.create({
        data: {
          publicationId: pub.id,
          userId: co.id,
          authorName: co.name,
          authorOrder: order++,
          affiliation: co.unitRelation?.name ?? 'Học viện Hậu cần',
          isInternal: true,
        },
      })
    }

    pubCreated++
  }

  console.log(`  Created ${pubCreated} publications`)

  // 5. Compute & update stats for each scientist profile
  console.log('  Computing stats for scientist profiles...')
  for (const sci of scientists) {
    const [pubCount, leadCount, memberCount] = await Promise.all([
      db.nckhPublication.count({ where: { authorId: sci.id } }),
      db.nckhProject.count({ where: { principalInvestigatorId: sci.id } }),
      db.nckhMember.count({ where: { userId: sci.id } }),
    ])
    await db.nckhScientistProfile.update({
      where: { userId: sci.id },
      data: {
        totalPublications:  pubCount,
        projectLeadCount:   leadCount,
        projectMemberCount: memberCount,
      },
    })
  }

  console.log('✅ M09 Research Demo Data seeded successfully!')
  console.log(`   Scientists: ${scientists.length}`)
  console.log(`   Projects:   ${createdProjects.length}`)
  console.log(`   Publications: ${pubCreated}`)
}

main()
  .catch((e) => { console.error('❌ Seed failed:', e); process.exit(1) })
  .finally(() => db.$disconnect())
