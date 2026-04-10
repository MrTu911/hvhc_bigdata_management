/**
 * seed_science_demo.ts
 *
 * Comprehensive demo data cho CSDL-KHQL (Phases 2–5).
 * Tạo dữ liệu bổ sung trên NckhScientistProfile / NckhProject sẵn có.
 *
 * Seeds:
 *  1. ScienceCatalog  — FUND_SOURCE + PUBLISHER entries
 *  2. NckhScientistEducation / Career / Award  (Phase 2)
 *  3. ScientificWork  + ScientificWorkAuthor   (Phase 3)
 *  4. NckhProjectWorkflowLog                   (Phase 3)
 *  5. ResearchBudget  + BudgetLineItem          (Phase 5)
 *  6. ScientificCouncil + Member + Review       (Phase 5)
 *
 * Idempotent — delete-then-insert cho các bảng Phase 2–5 mới.
 * Run: npx tsx --require dotenv/config prisma/seed/seed_science_demo.ts
 *
 * Prerequisites:
 *   seed_m09_research_demo.ts  (NckhScientistProfile + NckhProject)
 *   seed_units.ts              (Unit records)
 *   seed_faculty_profiles.ts   (FacultyProfile records)
 */

import { PrismaClient } from '@prisma/client'
import 'dotenv/config'

const db = new PrismaClient()

// ─── Helpers ─────────────────────────────────────────────────────────────────

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function sample<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, Math.min(n, arr.length))
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🔬 seed_science_demo.ts — CSDL-KHQL Phase 2–5 demo data')

  // ── 0. Fetch prerequisite data ──────────────────────────────────────────────

  const adminUser = await db.user.findFirst({
    where: { role: { in: ['QUAN_TRI_HE_THONG', 'ADMIN', 'CHI_HUY_HOC_VIEN'] } },
    orderBy: { createdAt: 'asc' },
    select: { id: true, name: true },
  })
  if (!adminUser) throw new Error('Cần có ít nhất một user trong DB — chạy seed_users.ts trước')

  const scientists = await db.nckhScientistProfile.findMany({
    include: { user: { select: { id: true, name: true, rank: true } } },
    take: 12,
    orderBy: { hIndex: 'desc' },
  })
  if (scientists.length < 4) throw new Error('Cần chạy seed_m09_research_demo.ts trước')

  const projects = await db.nckhProject.findMany({
    select: {
      id: true,
      projectCode: true,
      title: true,
      status: true,
      phase: true,
      principalInvestigatorId: true,
      unitId: true,
    },
    take: 10,
    orderBy: { createdAt: 'desc' },
  })
  if (projects.length < 4) throw new Error('Cần chạy seed_m09_research_demo.ts trước')

  // Fetch users for council members — need several distinct users
  const facultyUsers = await db.user.findMany({
    where: { facultyProfile: { isNot: null } },
    select: { id: true, name: true, rank: true },
    take: 20,
  })
  if (facultyUsers.length < 5) throw new Error('Cần ít nhất 5 faculty users')

  console.log(`  Found ${scientists.length} scientist profiles, ${projects.length} projects`)

  // ── 1. ScienceCatalog — FUND_SOURCE + PUBLISHER ─────────────────────────────

  console.log('\n📂 Step 1: ScienceCatalog (FUND_SOURCE + PUBLISHER)')

  const fundSources = [
    { code: 'FUND-HVHC',   name: 'Kinh phí Học viện Hậu cần',  type: 'FUND_SOURCE' },
    { code: 'FUND-BQP',    name: 'Kinh phí Bộ Quốc phòng',      type: 'FUND_SOURCE' },
    { code: 'FUND-NAFOSTED', name: 'Quỹ NAFOSTED',              type: 'FUND_SOURCE' },
    { code: 'FUND-NHATRANG', name: 'Dự án hợp tác Nha Trang',   type: 'FUND_SOURCE' },
  ]
  const publishers = [
    { code: 'PUB-QPND',    name: 'NXB Quân đội Nhân dân',       type: 'PUBLISHER' },
    { code: 'PUB-KHKT',    name: 'NXB Khoa học Kỹ thuật',       type: 'PUBLISHER' },
    { code: 'PUB-GD',      name: 'NXB Giáo dục',                type: 'PUBLISHER' },
    { code: 'PUB-HVHC',    name: 'NXB Học viện Hậu cần',        type: 'PUBLISHER' },
  ]

  const catalogEntries = [...fundSources, ...publishers]
  const catalogIdMap: Record<string, string> = {}

  for (const entry of catalogEntries) {
    const existing = await db.scienceCatalog.findUnique({ where: { code: entry.code } })
    if (existing) {
      catalogIdMap[entry.code] = existing.id
      continue
    }
    const created = await db.scienceCatalog.create({
      data: {
        code:        entry.code,
        name:        entry.name,
        type:        entry.type,
        level:       1,
        isActive:    true,
        createdById: adminUser.id,
      },
    })
    catalogIdMap[entry.code] = created.id
    console.log(`    + ${entry.code} — ${entry.name}`)
  }

  const fundSourceId = catalogIdMap['FUND-HVHC']
  const publisherIds = publishers.map((p) => catalogIdMap[p.code])

  // ── 2. NckhScientistEducation / Career / Award ──────────────────────────────

  console.log('\n👨‍🎓 Step 2: Scientist Education / Career / Award')

  // Clear existing Phase-2 sub-table data to make idempotent
  await db.nckhScientistAward.deleteMany({})
  await db.nckhScientistCareer.deleteMany({})
  await db.nckhScientistEducation.deleteMany({})

  const educationTemplates = [
    [
      { degree: 'TS',   major: 'Khoa học Hậu cần Quân sự',    institution: 'Học viện Hậu cần',     country: 'Việt Nam', yearFrom: 2005, yearTo: 2009 },
      { degree: 'ThS',  major: 'Quản lý Hậu cần',             institution: 'Học viện Hậu cần',     country: 'Việt Nam', yearFrom: 2001, yearTo: 2003 },
    ],
    [
      { degree: 'TSKH', major: 'Kỹ thuật Hệ thống Quân sự',   institution: 'ĐH Kỹ thuật Quân sự', country: 'Việt Nam', yearFrom: 2003, yearTo: 2008 },
      { degree: 'TS',   major: 'Trí tuệ Nhân tạo',            institution: 'ĐH Bách khoa HN',      country: 'Việt Nam', yearFrom: 1999, yearTo: 2003 },
    ],
    [
      { degree: 'TS',   major: 'Quản lý Nhà nước về Quốc phòng', institution: 'HV Chính trị QG', country: 'Việt Nam', yearFrom: 2008, yearTo: 2012 },
      { degree: 'ThS',  major: 'Lý luận Chính trị',           institution: 'ĐH Chính trị',         country: 'Việt Nam', yearFrom: 2004, yearTo: 2006 },
    ],
    [
      { degree: 'TS',   major: 'Khoa học Máy tính',            institution: 'ĐH Công nghệ, ĐHQG', country: 'Việt Nam', yearFrom: 2010, yearTo: 2015 },
      { degree: 'ThS',  major: 'Hệ thống Thông tin',          institution: 'Học viện Kỹ thuật',   country: 'Việt Nam', yearFrom: 2007, yearTo: 2009 },
    ],
  ]

  const careerTemplates = [
    [
      { position: 'Trưởng phòng Quản lý KH',     unitName: 'Phòng KHCN, HV Hậu cần', yearFrom: 2015, isCurrent: true },
      { position: 'Phó Trưởng phòng QLKH',       unitName: 'Phòng KHCN, HV Hậu cần', yearFrom: 2010, yearTo: 2015, isCurrent: false },
    ],
    [
      { position: 'Chủ nhiệm bộ môn CNTT',       unitName: 'Khoa Kỹ thuật',           yearFrom: 2018, isCurrent: true },
      { position: 'Giảng viên chính',             unitName: 'Khoa Kỹ thuật',           yearFrom: 2013, yearTo: 2018, isCurrent: false },
    ],
    [
      { position: 'Phó Chủ nhiệm Khoa',          unitName: 'Khoa Cơ sở',              yearFrom: 2016, isCurrent: true },
      { position: 'Giảng viên chính',             unitName: 'Khoa Cơ sở',              yearFrom: 2010, yearTo: 2016, isCurrent: false },
    ],
    [
      { position: 'Nghiên cứu viên chính',       unitName: 'Viện KHQS, HV Hậu cần',  yearFrom: 2019, isCurrent: true },
      { position: 'Chuyên viên kỹ thuật',        unitName: 'Phòng Kỹ thuật',          yearFrom: 2014, yearTo: 2019, isCurrent: false },
    ],
  ]

  const awardTemplates = [
    [
      { awardName: 'Chiến sĩ thi đua cấp Bộ Quốc phòng',  level: 'MINISTRY',  year: 2023 },
      { awardName: 'Giải thưởng NCKH xuất sắc cấp Học viện', level: 'ACADEMY', year: 2022 },
    ],
    [
      { awardName: 'Chiến sĩ thi đua cấp Học viện',        level: 'ACADEMY',   year: 2024 },
      { awardName: 'Bằng khen của Giám đốc Học viện',      level: 'ACADEMY',   year: 2021 },
    ],
    [
      { awardName: 'Bằng khen cấp Khoa',                   level: 'DEPARTMENT', year: 2024 },
    ],
    [
      { awardName: 'Giải nhất nghiên cứu KH cấp Học viện', level: 'ACADEMY',   year: 2023 },
      { awardName: 'Giải thưởng quốc tế ICDS 2022',        level: 'INTERNATIONAL', year: 2022 },
    ],
  ]

  for (let i = 0; i < Math.min(scientists.length, 8); i++) {
    const sp = scientists[i]
    const eduSet  = educationTemplates[i % educationTemplates.length]
    const carSet  = careerTemplates[i % careerTemplates.length]
    const awdSet  = awardTemplates[i % awardTemplates.length]

    for (const edu of eduSet) {
      await db.nckhScientistEducation.create({
        data: { scientistId: sp.id, ...edu },
      })
    }

    for (const car of carSet) {
      await db.nckhScientistCareer.create({
        data: { scientistId: sp.id, ...car },
      })
    }

    for (const awd of awdSet) {
      await db.nckhScientistAward.create({
        data: {
          scientistId: sp.id,
          awardName:   awd.awardName,
          level:       awd.level,
          year:        awd.year,
        },
      })
    }
  }

  console.log(`    Created education/career/award for ${Math.min(scientists.length, 8)} scientists`)

  // ── 3. ScientificWork + ScientificWorkAuthor ────────────────────────────────

  console.log('\n📚 Step 3: ScientificWork (sách, giáo trình)')

  // Clear existing to make idempotent
  await db.scientificWorkAuthor.deleteMany({})
  await db.scientificWork.deleteMany({})

  const workDefs = [
    {
      code: 'HVHC-2024-WORK-001', type: 'TEXTBOOK',
      title: 'Giáo trình Khoa học Hậu cần Quân sự (Tái bản lần 3)',
      year: 2024, sensitivity: 'NORMAL',
      publisherKey: 'PUB-QPND',
      authors: [
        { idx: 0, role: 'LEAD',      orderNum: 1, affiliation: 'Học viện Hậu cần' },
        { idx: 2, role: 'CO_AUTHOR', orderNum: 2, affiliation: 'Học viện Hậu cần' },
        { idx: 4, role: 'CO_AUTHOR', orderNum: 3, affiliation: 'Học viện Hậu cần' },
      ],
    },
    {
      code: 'HVHC-2024-WORK-002', type: 'MONOGRAPH',
      title: 'Ứng dụng Trí tuệ Nhân tạo trong Hậu cần Quân đội Hiện đại',
      year: 2024, sensitivity: 'CONFIDENTIAL',
      publisherKey: 'PUB-KHKT',
      authors: [
        { idx: 1, role: 'LEAD',      orderNum: 1, affiliation: 'Học viện Hậu cần' },
        { idx: 3, role: 'CO_AUTHOR', orderNum: 2, affiliation: 'Học viện Hậu cần' },
      ],
    },
    {
      code: 'HVHC-2023-WORK-003', type: 'CURRICULUM',
      title: 'Chương trình khung đào tạo Sĩ quan Hậu cần cấp chiến dịch',
      year: 2023, sensitivity: 'NORMAL',
      publisherKey: 'PUB-HVHC',
      authors: [
        { idx: 2, role: 'LEAD',      orderNum: 1, affiliation: 'Học viện Hậu cần' },
        { idx: 0, role: 'CO_AUTHOR', orderNum: 2, affiliation: 'Học viện Hậu cần' },
        { idx: 5, role: 'EDITOR',    orderNum: 3, affiliation: 'Học viện Hậu cần' },
      ],
    },
    {
      code: 'HVHC-2023-WORK-004', type: 'BOOK',
      title: 'Mô hình hóa và Mô phỏng Hệ thống Hậu cần Tác chiến',
      year: 2023, sensitivity: 'NORMAL',
      publisherKey: 'PUB-KHKT',
      authors: [
        { idx: 3, role: 'LEAD',      orderNum: 1, affiliation: 'Học viện Hậu cần' },
        { idx: 1, role: 'CO_AUTHOR', orderNum: 2, affiliation: 'Học viện Hậu cần' },
      ],
    },
    {
      code: 'HVHC-2022-WORK-005', type: 'REFERENCE',
      title: 'Từ điển chuyên ngành Hậu cần – Kỹ thuật Quân sự (Song ngữ)',
      year: 2022, sensitivity: 'NORMAL',
      publisherKey: 'PUB-GD',
      authors: [
        { idx: 0, role: 'LEAD',      orderNum: 1, affiliation: 'Học viện Hậu cần' },
        { idx: 6, role: 'EDITOR',    orderNum: 2, affiliation: 'Học viện Hậu cần' },
        { idx: 7, role: 'REVIEWER',  orderNum: 3, affiliation: 'Học viện Kỹ thuật Quân sự' },
      ],
    },
  ]

  for (const wd of workDefs) {
    const publisherId = catalogIdMap[wd.publisherKey] ?? null

    const work = await db.scientificWork.create({
      data: {
        code:        wd.code,
        type:        wd.type,
        title:       wd.title,
        year:        wd.year,
        sensitivity: wd.sensitivity,
        publisherId,
        edition:     1,
        isDeleted:   false,
      },
    })

    for (const au of wd.authors) {
      const sp = scientists[au.idx]
      if (!sp) continue
      await db.scientificWorkAuthor.create({
        data: {
          workId:      work.id,
          scientistId: sp.id,
          authorName:  sp.user.name,
          role:        au.role,
          orderNum:    au.orderNum,
          affiliation: au.affiliation,
        },
      })
    }

    console.log(`    + ${wd.code} — ${wd.title.slice(0, 50)}...`)
  }

  // ── 4. NckhProjectWorkflowLog ────────────────────────────────────────────────

  console.log('\n📋 Step 4: NckhProjectWorkflowLog')

  await db.nckhProjectWorkflowLog.deleteMany({})

  const actorId = adminUser.id
  for (const project of projects.slice(0, 6)) {
    // Each project gets 2–3 workflow transitions
    const transitions = buildWorkflowTransitions(project.status, project.phase)
    for (const tr of transitions) {
      await db.nckhProjectWorkflowLog.create({
        data: {
          projectId:  project.id,
          fromStatus: tr.fromStatus,
          toStatus:   tr.toStatus,
          fromPhase:  tr.fromPhase,
          toPhase:    tr.toPhase,
          actionById: project.principalInvestigatorId ?? actorId,
          comment:    tr.comment,
          actedAt:    tr.actedAt,
        },
      })
    }
  }
  console.log(`    Created workflow logs for ${Math.min(projects.length, 6)} projects`)

  // ── 5. ResearchBudget + BudgetLineItem ───────────────────────────────────────

  console.log('\n💰 Step 5: ResearchBudget + BudgetLineItem')

  await db.budgetLineItem.deleteMany({})
  await db.researchBudget.deleteMany({})

  const approvedProjects = projects.filter(
    (p) => ['APPROVED', 'IN_PROGRESS', 'COMPLETED'].includes(p.status)
  )

  for (const project of approvedProjects.slice(0, 5)) {
    const totalApproved = BigInt(pick([150, 200, 300, 500, 800]) * 1_000_000)

    const budget = await db.researchBudget.create({
      data: {
        projectId:   project.id,
        fundSourceId,
        totalApproved,
        totalSpent:  totalApproved / 2n,
        year:        2024,
        status:      'APPROVED',
        approvedById: adminUser.id,
        approvedAt:  new Date('2024-03-01'),
      },
    })

    const lineItems = [
      { category: 'PERSONNEL',  description: 'Chi công lao động khoa học',       pct: 0.40 },
      { category: 'EQUIPMENT',  description: 'Mua sắm trang thiết bị thí nghiệm', pct: 0.30 },
      { category: 'TRAVEL',     description: 'Công tác phí, khảo sát thực địa',   pct: 0.15 },
      { category: 'OVERHEAD',   description: 'Chi quản lý phí gián tiếp',          pct: 0.10 },
      { category: 'OTHER',      description: 'Chi phí xuất bản và hội thảo',       pct: 0.05 },
    ]

    for (const li of lineItems) {
      const planned = BigInt(Math.round(Number(totalApproved) * li.pct))
      await db.budgetLineItem.create({
        data: {
          budgetId:      budget.id,
          category:      li.category,
          description:   li.description,
          plannedAmount: planned,
          spentAmount:   planned / 2n,
          period:        'Q1-2024',
        },
      })
    }
  }
  console.log(`    Created budgets for ${Math.min(approvedProjects.length, 5)} projects`)

  // ── 6. ScientificCouncil + Member + Review ───────────────────────────────────

  console.log('\n🏛️  Step 6: ScientificCouncil + Member + Review')

  await db.scientificCouncilReview.deleteMany({})
  await db.scientificCouncilMember.deleteMany({})
  await db.scientificCouncil.deleteMany({})

  // Pick projects with status UNDER_REVIEW or later
  const councilProjects = projects.filter(
    (p) => ['UNDER_REVIEW', 'APPROVED', 'IN_PROGRESS', 'COMPLETED'].includes(p.status)
  )

  const memberPool = facultyUsers.slice(0, 15)
  const COUNCIL_TYPES = ['REVIEW', 'ACCEPTANCE']

  for (const project of councilProjects.slice(0, 4)) {
    const councilType = pick(COUNCIL_TYPES)
    const chairUser   = memberPool[0]
    const secretUser  = memberPool[1]
    const reviewers   = memberPool.slice(2, 7)

    const meetingDate = new Date('2024-06-15')
    const hasResult   = ['COMPLETED', 'APPROVED'].includes(project.status)

    const council = await db.scientificCouncil.create({
      data: {
        projectId:   project.id,
        type:        councilType,
        chairmanId:  chairUser.id,
        secretaryId: secretUser.id,
        meetingDate,
        result:          hasResult ? 'PASS' : null,
        overallScore:    hasResult ? 8.4 : null,
        conclusionText:  hasResult
          ? 'Đề tài đạt yêu cầu về chất lượng khoa học, tính ứng dụng và khả năng triển khai thực tiễn.'
          : null,
      },
    })

    // Members
    const memberDefs = [
      { user: chairUser,   role: 'CHAIRMAN',  vote: hasResult ? 'PASS' : null },
      { user: secretUser,  role: 'SECRETARY', vote: null },
      ...reviewers.map((u, i) => ({
        user: u,
        role: 'REVIEWER',
        vote: hasResult ? (i < reviewers.length - 1 ? 'PASS' : 'REVISE') : null,
      })),
    ]

    const createdMembers: Array<{ id: string; userId: string }> = []
    for (const md of memberDefs) {
      try {
        const member = await db.scientificCouncilMember.create({
          data: {
            councilId: council.id,
            userId:    md.user.id,
            role:      md.role,
            vote:      md.vote ?? null,
          },
        })
        createdMembers.push({ id: member.id, userId: md.user.id })
      } catch {
        // Skip duplicate (same user in multiple councils – unlikely but safe)
      }
    }

    // Reviews — only for REVIEWER members when council has result
    if (hasResult) {
      const reviewerMembers = createdMembers.filter((_, i) => i >= 2)
      const CRITERIA = ['SCIENTIFIC_VALUE', 'FEASIBILITY', 'BUDGET', 'TEAM', 'OUTCOME']

      for (const member of reviewerMembers.slice(0, 3)) {
        for (const criteria of CRITERIA) {
          await db.scientificCouncilReview.create({
            data: {
              councilId: council.id,
              memberId:  member.id,
              criteria,
              score:     parseFloat((7 + Math.random() * 3).toFixed(1)),
              comment:   `Đánh giá tiêu chí ${criteria}: đạt yêu cầu.`,
            },
          })
        }
      }
    }

    console.log(`    Council [${councilType}] → project ${project.projectCode}`)
  }

  // ── Done ─────────────────────────────────────────────────────────────────────

  console.log('\n✅ seed_science_demo.ts hoàn thành.')
  console.log('   Tóm tắt:')
  console.log(`     ScienceCatalog  : ${catalogEntries.length} entries`)
  console.log(`     Education/Career: ${Math.min(scientists.length, 8)} scientists`)
  console.log(`     ScientificWork  : ${workDefs.length} works`)
  console.log(`     WorkflowLog     : ${Math.min(projects.length, 6)} projects`)
  console.log(`     ResearchBudget  : ${Math.min(approvedProjects.length, 5)} budgets`)
  console.log(`     ScientificCouncil: ${Math.min(councilProjects.length, 4)} councils`)
}

// ─── Workflow transition builder ──────────────────────────────────────────────

function buildWorkflowTransitions(
  currentStatus: string,
  currentPhase: string,
): Array<{
  fromStatus: string; toStatus: string;
  fromPhase?: string; toPhase?: string;
  comment: string; actedAt: Date
}> {
  const base = new Date('2024-01-15')
  const day = (n: number) => new Date(base.getTime() + n * 86_400_000)

  // Build a typical history based on current status
  const transitions = [
    {
      fromStatus: 'DRAFT', toStatus: 'SUBMITTED',
      fromPhase: 'PROPOSAL', toPhase: 'PROPOSAL',
      comment: 'Chủ nhiệm đề tài nộp hồ sơ đề xuất.',
      actedAt: day(0),
    },
    {
      fromStatus: 'SUBMITTED', toStatus: 'UNDER_REVIEW',
      fromPhase: 'PROPOSAL', toPhase: 'PROPOSAL',
      comment: 'Phòng KHCN tiếp nhận và chuyển thẩm định.',
      actedAt: day(3),
    },
  ]

  if (['APPROVED', 'IN_PROGRESS', 'COMPLETED'].includes(currentStatus)) {
    transitions.push({
      fromStatus: 'UNDER_REVIEW', toStatus: 'APPROVED',
      fromPhase: 'PROPOSAL', toPhase: 'CONTRACT',
      comment: 'Hội đồng thẩm định phê duyệt đề tài. Chuyển sang ký hợp đồng.',
      actedAt: day(14),
    })
  }

  if (['IN_PROGRESS', 'COMPLETED'].includes(currentStatus)) {
    transitions.push({
      fromStatus: 'APPROVED', toStatus: 'IN_PROGRESS',
      fromPhase: 'CONTRACT', toPhase: 'EXECUTION',
      comment: 'Hợp đồng đã ký. Bắt đầu triển khai nghiên cứu.',
      actedAt: day(21),
    })
  }

  if (currentStatus === 'COMPLETED') {
    transitions.push({
      fromStatus: 'IN_PROGRESS', toStatus: 'COMPLETED',
      fromPhase: 'FINAL_REVIEW', toPhase: 'ACCEPTED',
      comment: 'Nghiệm thu cấp cơ sở và cấp Học viện đạt. Đề tài hoàn thành.',
      actedAt: day(365),
    })
  }

  return transitions
}

// ─── Entry point ──────────────────────────────────────────────────────────────

main()
  .catch((e) => {
    console.error('❌ Lỗi:', e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
