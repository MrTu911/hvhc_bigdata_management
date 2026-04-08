/**
 * seed_m09_full_reset.ts
 *
 * Xóa toàn bộ dữ liệu M09 (nckh_*) và seed lại từ đầu, lấy dữ liệu từ M02:
 *   - ScientificResearch  → NckhProject  (bridge)
 *   - ScientificPublication → NckhPublication (bridge)
 *   - FacultyProfile / User → NckhScientistProfile
 *   + 8 demo projects + 20 demo publications với chất lượng cao
 *
 * Run:
 *   npx tsx --require dotenv/config prisma/seed/seed_m09_full_reset.ts
 */

import {
  PrismaClient,
  NckhMemberRole,
  NckhMilestoneStatus,
  NckhPublicationType,
  NckhPublicationStatus,
} from '@prisma/client'

const db = new PrismaClient()

// ─── Helpers ──────────────────────────────────────────────────────────────────

function pick<T>(arr: T[], seed: number): T {
  return arr[Math.abs(seed) % arr.length]
}

/** Deterministic hash from string */
function hashStr(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

function shortId(id: string): string {
  return id.replace(/^c/, '').slice(0, 8).toUpperCase()
}

function daysAfter(base: Date, days: number): Date {
  const d = new Date(base)
  d.setDate(d.getDate() + days)
  return d
}

// ─── Mapping: M02 → M09 ───────────────────────────────────────────────────────

function inferField(type: string): string {
  const t = (type ?? '').toLowerCase()
  if (t.includes('quân sự') || t.includes('chiến thuật') || t.includes('tác chiến') || t.includes('chiến lược')) return 'HOC_THUAT_QUAN_SU'
  if (t.includes('hậu cần') || t.includes('kỹ thuật') || t.includes('vũ khí') || t.includes('trang bị') || t.includes('quân nhu') || t.includes('xăng dầu') || t.includes('vận tải')) return 'HAU_CAN_KY_THUAT'
  if (t.includes('cntt') || t.includes('phần mềm') || t.includes('công nghệ thông tin') || t.includes('ai') || t.includes('dữ liệu') || t.includes('blockchain') || t.includes('số')) return 'CNTT'
  if (t.includes('y ') || t.includes('sức khỏe') || t.includes('dược') || t.includes('bệnh') || t.includes('quân y')) return 'Y_DUOC'
  if (t.includes('xã hội') || t.includes('chính trị') || t.includes('lịch sử') || t.includes('đảng') || t.includes('tư tưởng') || t.includes('văn hóa')) return 'KHOA_HOC_XA_HOI'
  if (t.includes('toán') || t.includes('vật lý') || t.includes('hóa') || t.includes('sinh')) return 'KHOA_HOC_TU_NHIEN'
  return 'HAU_CAN_KY_THUAT'
}

function inferCategory(level: string): string {
  const l = (level ?? '').toLowerCase()
  if (l.includes('nhà nước') || l.includes('quốc gia')) return 'CAP_NHA_NUOC'
  if (l.includes('bộ') || l.includes('quốc phòng')) return 'CAP_BO_QUOC_PHONG'
  if (l.includes('tổng cục')) return 'CAP_TONG_CUC'
  if (l.includes('sáng kiến')) return 'SANG_KIEN_CO_SO'
  return 'CAP_HOC_VIEN'
}

function inferResearchType(type: string): string {
  const t = (type ?? '').toLowerCase()
  if (t.includes('sáng kiến') || t.includes('kinh nghiệm')) return 'SANG_KIEN_KINH_NGHIEM'
  if (t.includes('triển khai')) return 'TRIEN_KHAI'
  if (t.includes('cơ bản')) return 'CO_BAN'
  return 'UNG_DUNG'
}

const PUB_TYPE_MAP: Record<string, NckhPublicationType> = {
  GIAO_TRINH:    NckhPublicationType.GIAO_TRINH,
  GIAO_TRINH_DT: NckhPublicationType.GIAO_TRINH,
  TAI_LIEU:      NckhPublicationType.BAO_CAO_KH,
  BAI_TAP:       NckhPublicationType.BAO_CAO_KH,
  BAI_BAO:       NckhPublicationType.BAI_BAO_TRONG_NUOC,
  SANG_KIEN:     NckhPublicationType.SANG_KIEN,
  DE_TAI:        NckhPublicationType.BAO_CAO_KH,
}

// ─── Step 1: Clear all M09 tables ─────────────────────────────────────────────

async function clearM09() {
  console.log('🗑️  Clearing all M09 data...')
  await db.nckhDuplicateCheckLog.deleteMany()
  await db.nckhPublicationAuthor.deleteMany()
  await db.nckhPublication.deleteMany()
  await db.nckhMember.deleteMany()
  await db.nckhMilestone.deleteMany()
  await db.nckhReview.deleteMany()
  await db.nckhProject.deleteMany()
  await db.nckhScientistProfile.deleteMany()
  console.log('   ✓ All nckh_* tables cleared.\n')
}

// ─── Step 2: Load M02 source data ─────────────────────────────────────────────

async function loadM02() {
  const facultyUsers = await db.user.findMany({
    where: { facultyProfile: { isNot: null } },
    select: {
      id: true,
      name: true,
      rank: true,
      unitId: true,
      specialization: true,
      academicTitle: true,
      unitRelation: { select: { id: true, name: true, code: true } },
      facultyProfile: {
        select: {
          academicDegree: true,
          academicRank: true,
          specialization: true,
          researchInterests: true,
          orcidId: true,
          publications: true,
          citations: true,
        },
      },
    },
    orderBy: { name: 'asc' },
    take: 60,
  })

  const scientificResearch = await db.scientificResearch.findMany({
    where:   { role: 'CHU_NHIEM' },
    select:  { id: true, userId: true, title: true, year: true, level: true, type: true, notes: true, user: { select: { id: true, name: true, unitId: true } } },
    orderBy: { year: 'desc' },
  })

  const memberResearch = await db.scientificResearch.findMany({
    where:  { role: { in: ['THAM_GIA', 'THANH_VIEN'] } },
    select: { id: true, userId: true, title: true, year: true },
  })

  const scientificPublications = await db.scientificPublication.findMany({
    select: {
      id: true, userId: true, type: true, title: true,
      year: true, month: true, role: true, publisher: true,
      organization: true, coAuthors: true, notes: true,
      user: { select: { name: true } },
    },
    orderBy: { year: 'desc' },
    take: 500,
  })

  const units = await db.unit.findMany({ select: { id: true, code: true, name: true } })
  const unitByCode = Object.fromEntries(units.map((u) => [u.code, u.id]))
  const defaultUnitId = units[0]?.id ?? ''

  return { facultyUsers, scientificResearch, memberResearch, scientificPublications, unitByCode, defaultUnitId, units }
}

// ─── Step 3: Seed NckhScientistProfile from FacultyProfile ────────────────────

const FIELDS_BY_UNIT: Record<string, string[]> = {
  VIEN1:  ['HOC_THUAT_QUAN_SU', 'HAU_CAN_KY_THUAT'],
  PQLKH:  ['HAU_CAN_KY_THUAT', 'CNTT'],
  PCTCT:  ['KHOA_HOC_XA_HOI'],
  K1:     ['HOC_THUAT_QUAN_SU'],
  K2:     ['HAU_CAN_KY_THUAT'],
  K3:     ['KHOA_HOC_TU_NHIEN'],
  BAN2:   ['CNTT'],
  B2:     ['HOC_THUAT_QUAN_SU', 'KHOA_HOC_XA_HOI'],
  B1:     ['KHOA_HOC_XA_HOI'],
}

const BIO_TEMPLATES = [
  'Chuyên gia hàng đầu về hậu cần kỹ thuật quân sự và tối ưu hóa chuỗi cung ứng trong điều kiện tác chiến hiện đại.',
  'Nghiên cứu ứng dụng AI và học máy trong quản lý hậu cần chiến đấu và dự báo nhu cầu vật chất.',
  'Nhà khoa học đầu ngành nghiên cứu chiến lược phát triển hệ thống hậu cần Quân đội nhân dân Việt Nam.',
  'Nghiên cứu mô hình dự báo nhu cầu hậu cần và tối ưu hóa mạng lưới phân phối trong tác chiến hiện đại.',
  'Chuyên nghiên cứu phát triển đội ngũ và công tác chính trị tư tưởng trong lực lượng vũ trang.',
  'Nghiên cứu khoa học xã hội và nhân văn quân sự, lịch sử truyền thống Học viện Hậu cần.',
  'Chuyên gia tích hợp công nghệ thông tin vào hệ thống hậu cần thực chiến và quản lý vật tư kỹ thuật.',
  'Nghiên cứu tổ chức cán bộ, quản lý nhân lực quân sự và xây dựng đội ngũ trong hệ thống nhà trường.',
  'Chuyên gia ứng dụng chuyển đổi số và hệ thống thông tin quản lý vào lĩnh vực hậu cần quốc phòng.',
  'Nhà khoa học nghiên cứu y học quân sự và chăm sóc sức khỏe bộ đội trong điều kiện thực địa.',
]

const KEYWORD_SETS = [
  ['hậu cần', 'chuỗi cung ứng', 'tối ưu hóa', 'logistics quân sự'],
  ['trí tuệ nhân tạo', 'học máy', 'hậu cần chiến đấu', 'dự báo'],
  ['chiến lược quân sự', 'hậu cần cấp chiến dịch', 'lý luận hậu cần'],
  ['mô hình hóa', 'mô phỏng', 'dự báo nhu cầu', 'vận trù học'],
  ['chính trị quân sự', 'công tác tư tưởng', 'giáo dục chính trị'],
  ['khoa học xã hội', 'lịch sử quân sự', 'văn hóa quân sự'],
  ['hệ thống thông tin', 'chuyển đổi số', 'IoT quân sự'],
  ['quản lý cán bộ', 'tổ chức quân sự', 'phát triển đội ngũ'],
  ['blockchain', 'an ninh mạng', 'CNTT quốc phòng'],
  ['y học quân sự', 'sức khỏe bộ đội', 'chăm sóc thực địa'],
]

const H_INDEX_POOL   = [18, 15, 12, 11, 9, 8, 7, 6, 6, 5, 5, 4, 4, 3, 3, 2, 2, 1, 1, 0]
const CITATION_POOL  = [720, 580, 340, 290, 210, 178, 145, 120, 110, 87, 75, 65, 55, 42, 38, 28, 20, 15, 8, 3]
const ORCID_POOL     = [
  '0000-0002-1234-5678', '0000-0003-2345-6789', '0000-0001-9876-5432',
  '0000-0002-8765-4321', '0000-0003-1111-2222', '0000-0001-5555-6666',
]

async function seedScientistProfiles(facultyUsers: Awaited<ReturnType<typeof loadM02>>['facultyUsers']) {
  console.log(`👩‍🔬 Seeding ${facultyUsers.length} NckhScientistProfile records...`)

  // Sort: PhD + professor first
  const sorted = [...facultyUsers].sort((a, b) => {
    const score = (u: typeof facultyUsers[0]) => {
      let s = 0
      if (u.facultyProfile?.academicDegree === 'Tiến sĩ') s += 3
      if (u.facultyProfile?.academicDegree === 'Thạc sĩ') s += 1
      if (u.facultyProfile?.academicRank === 'Giáo sư') s += 2
      if (u.facultyProfile?.academicRank === 'Phó Giáo sư') s += 1
      return s
    }
    return score(b) - score(a)
  })

  const profileIds: string[] = []

  for (let i = 0; i < sorted.length; i++) {
    const u = sorted[i]
    const fp = u.facultyProfile!
    const seed = hashStr(u.id)
    const unitCode = u.unitRelation?.code ?? ''
    const fields = FIELDS_BY_UNIT[unitCode] ?? ['HOC_THUAT_QUAN_SU', 'HAU_CAN_KY_THUAT']

    // Infer field from specialization too
    if (fp.specialization) {
      const inferredField = inferField(fp.specialization)
      if (!fields.includes(inferredField)) fields.push(inferredField)
    }

    const hIdx   = i < H_INDEX_POOL.length   ? H_INDEX_POOL[i]   : Math.max(0, H_INDEX_POOL[H_INDEX_POOL.length - 1] - i)
    const cit    = i < CITATION_POOL.length   ? CITATION_POOL[i]  : Math.max(0, 3 - (i - CITATION_POOL.length))
    const orcid  = i < ORCID_POOL.length      ? ORCID_POOL[i]     : (fp.orcidId ?? null)
    const pubCount = fp.publications ?? 0

    const profile = await db.nckhScientistProfile.create({
      data: {
        userId:            u.id,
        academicRank:      fp.academicRank ?? u.academicTitle ?? null,
        degree:            fp.academicDegree ?? null,
        specialization:    fp.specialization ?? u.specialization ?? null,
        researchFields:    fields.slice(0, 3),
        primaryField:      fields[0],
        secondaryFields:   fields.slice(1),
        researchKeywords:  pick(KEYWORD_SETS, seed),
        hIndex:            hIdx,
        i10Index:          Math.max(0, Math.round(hIdx * 0.65)),
        totalCitations:    cit,
        totalPublications: pubCount,
        projectLeadCount:  0,
        projectMemberCount: 0,
        orcidId:           orcid,
        bio:               pick(BIO_TEMPLATES, seed),
        awards:            i < 5 ? ['Chiến sĩ thi đua cấp Học viện', 'Giải thưởng NCKH xuất sắc'] : i < 10 ? ['Chiến sĩ thi đua cơ sở'] : [],
      },
    })
    profileIds.push(profile.id)
  }

  console.log(`   ✓ ${profileIds.length} scientist profiles created.\n`)
  return sorted // return sorted so we can reference by index later
}

// ─── Step 4: Bridge ScientificResearch → NckhProject ─────────────────────────

async function bridgeResearchProjects(
  scientificResearch: Awaited<ReturnType<typeof loadM02>>['scientificResearch'],
  memberResearch: Awaited<ReturnType<typeof loadM02>>['memberResearch'],
) {
  console.log(`🔬 Bridging ${scientificResearch.length} ScientificResearch records → NckhProject...`)

  const titleToProjectId = new Map<string, string>()
  let created = 0

  for (const rec of scientificResearch) {
    const projectCode = `LEGACY-${rec.year}-${shortId(rec.id)}`
    const field       = inferField(rec.type)
    const category    = inferCategory(rec.level)
    const rType       = inferResearchType(rec.type)

    try {
      const project = await db.nckhProject.create({
        data: {
          projectCode,
          title:                  rec.title,
          category:               category as never,
          field:                  field as never,
          researchType:           rType as never,
          status:                 'COMPLETED',
          phase:                  'ARCHIVED',
          budgetYear:             rec.year,
          principalInvestigatorId: rec.userId,
          unitId:                 rec.user.unitId ?? undefined,
          abstract:               rec.notes ?? undefined,
          completionGrade:        pick(['Xuất sắc', 'Tốt', 'Khá'], hashStr(rec.id)),
          completionScore:        pick([9.2, 8.7, 8.1, 7.5], hashStr(rec.id + '1')),
          actualEndDate:          new Date(rec.year, 11, 15),
        },
      })
      // PI as member
      await db.nckhMember.create({
        data: {
          projectId: project.id,
          userId:    rec.userId,
          role:      NckhMemberRole.CHU_NHIEM,
          joinDate:  new Date(rec.year, 0, 1),
        },
      })
      titleToProjectId.set(rec.title.trim(), project.id)
      created++
    } catch (e: any) {
      if (e?.code !== 'P2002') console.warn(`  Bridge skip "${rec.title.slice(0, 40)}":`, e?.message ?? e)
    }
  }

  // Link THAM_GIA/THANH_VIEN as members
  let linked = 0
  for (const rec of memberResearch) {
    const projectId = titleToProjectId.get(rec.title.trim())
    if (!projectId) continue
    try {
      await db.nckhMember.create({
        data: {
          projectId,
          userId:   rec.userId,
          role:     NckhMemberRole.THANH_VIEN_CHINH,
          joinDate: new Date(rec.year, 0, 1),
        },
      })
      linked++
    } catch { /* duplicate – skip */ }
  }

  console.log(`   ✓ ${created} projects bridged, ${linked} members linked.\n`)
  return titleToProjectId
}

// ─── Step 5: Bridge ScientificPublication → NckhPublication ──────────────────

async function bridgePublications(
  scientificPublications: Awaited<ReturnType<typeof loadM02>>['scientificPublications'],
  titleToProjectId: Map<string, string>,
) {
  console.log(`📄 Bridging ${scientificPublications.length} ScientificPublication records → NckhPublication...`)

  let created = 0

  for (const pub of scientificPublications) {
    const pubType = PUB_TYPE_MAP[pub.type] ?? NckhPublicationType.BAO_CAO_KH
    // Try to find a project match by title similarity (exact title)
    const projectId = titleToProjectId.get(pub.title.trim()) ?? undefined

    try {
      const nckhPub = await db.nckhPublication.create({
        data: {
          title:         pub.title,
          pubType,
          publishedYear: pub.year,
          publisher:     pub.publisher ?? pub.organization ?? undefined,
          authorId:      pub.userId,
          authorsText:   pub.user.name + (pub.coAuthors ? ', ' + pub.coAuthors : ''),
          coAuthors:     pub.coAuthors ?? undefined,
          status:        NckhPublicationStatus.PUBLISHED,
          projectId,
          citationCount: 0,
          unitId:        undefined,
        },
      })
      // Main author entry
      await db.nckhPublicationAuthor.create({
        data: {
          publicationId: nckhPub.id,
          userId:        pub.userId,
          authorName:    pub.user.name,
          authorOrder:   1,
          isInternal:    true,
        },
      })
      created++
    } catch (e: any) {
      if (e?.code !== 'P2002') console.warn(`  Pub bridge skip:`, e?.message ?? e)
    }
  }

  console.log(`   ✓ ${created} publications bridged.\n`)
}

// ─── Step 6: Seed demo NckhProject (8 high-quality projects) ─────────────────

async function seedDemoProjects(
  facultySorted: Awaited<ReturnType<typeof loadM02>>['facultyUsers'],
  unitByCode: Record<string, string>,
  defaultUnitId: string,
) {
  if (facultySorted.length < 8) {
    console.warn('⚠️  Fewer than 8 faculty users — demo projects may use repeated PIs.')
  }

  const scientists = facultySorted.slice(0, Math.min(12, facultySorted.length))
  const piUsers    = scientists.slice(0, Math.min(8, scientists.length))
  const memberPool = scientists.slice(2)

  console.log(`🏗️  Seeding 8 demo NckhProject records...`)

  type PSeed = {
    code: string; title: string; titleEn: string
    category: string; field: string; researchType: string
    status: string; phase: string
    budgetYear: number; budgetRequested: number; budgetApproved: number | null
    startDate: Date; endDate: Date
    abstract: string; keywords: string[]
    piIdx: number; unitCode: string; memberIdxs: number[]
  }

  const seeds: PSeed[] = [
    {
      code: 'NCKH-HVHC-2024-001',
      title: 'Nghiên cứu xây dựng mô hình dự báo nhu cầu vật chất hậu cần trong điều kiện tác chiến hiện đại',
      titleEn: 'Research on building logistics demand forecasting models under modern combat conditions',
      category: 'CAP_HOC_VIEN', field: 'HOC_THUAT_QUAN_SU', researchType: 'UNG_DUNG',
      status: 'COMPLETED', phase: 'ARCHIVED',
      budgetYear: 2024, budgetRequested: 320_000_000, budgetApproved: 300_000_000,
      startDate: new Date('2024-01-15'), endDate: new Date('2024-11-30'),
      abstract: 'Đề tài nghiên cứu xây dựng mô hình dự báo nhu cầu vật chất hậu cần dựa trên dữ liệu lịch sử và các thuật toán học máy, ứng dụng trong điều kiện tác chiến hiện đại của Quân đội nhân dân Việt Nam.',
      keywords: ['dự báo', 'hậu cần', 'học máy', 'tác chiến hiện đại'],
      piIdx: 0, unitCode: 'VIEN1', memberIdxs: [1, 2, 3],
    },
    {
      code: 'NCKH-HVHC-2024-002',
      title: 'Ứng dụng trí tuệ nhân tạo trong quản lý và điều phối hậu cần chiến thuật',
      titleEn: 'Application of Artificial Intelligence in tactical logistics management and coordination',
      category: 'CAP_TONG_CUC', field: 'CNTT', researchType: 'UNG_DUNG',
      status: 'IN_PROGRESS', phase: 'EXECUTION',
      budgetYear: 2024, budgetRequested: 480_000_000, budgetApproved: 450_000_000,
      startDate: new Date('2024-03-01'), endDate: new Date('2025-08-31'),
      abstract: 'Nghiên cứu và ứng dụng các thuật toán AI/ML để tự động hóa quy trình quản lý kho hậu cần, tối ưu hóa vận chuyển và phân phối vật tư chiến đấu trong điều kiện thực tế.',
      keywords: ['AI', 'hậu cần chiến thuật', 'tự động hóa', 'kho vận'],
      piIdx: 1, unitCode: 'PQLKH', memberIdxs: [0, 4, 5, 6],
    },
    {
      code: 'NCKH-HVHC-2025-001',
      title: 'Chiến lược phát triển hậu cần Quân đội nhân dân Việt Nam đến năm 2035 và tầm nhìn 2045',
      titleEn: "Development strategy for Vietnam People's Army logistics to 2035 with a vision to 2045",
      category: 'CAP_BO_QUOC_PHONG', field: 'HOC_THUAT_QUAN_SU', researchType: 'CO_BAN',
      status: 'APPROVED', phase: 'CONTRACT',
      budgetYear: 2025, budgetRequested: 1_200_000_000, budgetApproved: 1_100_000_000,
      startDate: new Date('2025-02-01'), endDate: new Date('2026-12-31'),
      abstract: 'Đề tài nghiên cứu cơ bản về chiến lược phát triển hệ thống hậu cần Quân đội nhân dân Việt Nam trong bối cảnh hiện đại hóa quân đội và hội nhập quốc tế giai đoạn 2025–2045.',
      keywords: ['chiến lược hậu cần', 'phát triển quân sự', '2035', 'hiện đại hóa'],
      piIdx: 2, unitCode: 'VIEN1', memberIdxs: [3, 4, 7],
    },
    {
      code: 'NCKH-HVHC-2025-002',
      title: 'Nghiên cứu ứng dụng công nghệ blockchain trong quản lý chuỗi cung ứng hậu cần quân sự',
      titleEn: 'Research on blockchain technology application in military logistics supply chain management',
      category: 'CAP_HOC_VIEN', field: 'CNTT', researchType: 'UNG_DUNG',
      status: 'IN_PROGRESS', phase: 'MIDTERM_REVIEW',
      budgetYear: 2025, budgetRequested: 280_000_000, budgetApproved: 260_000_000,
      startDate: new Date('2025-01-10'), endDate: new Date('2025-10-31'),
      abstract: 'Nghiên cứu khả năng ứng dụng công nghệ blockchain để tăng tính minh bạch, an toàn và hiệu quả trong quản lý chuỗi cung ứng vật tư kỹ thuật quân sự.',
      keywords: ['blockchain', 'chuỗi cung ứng', 'hậu cần quân sự', 'minh bạch'],
      piIdx: 3, unitCode: 'PQLKH', memberIdxs: [0, 1, 8],
    },
    {
      code: 'NCKH-HVHC-2025-003',
      title: 'Nghiên cứu mô hình giáo dục chính trị tư tưởng cho học viên trong bối cảnh chuyển đổi số',
      titleEn: 'Research on political-ideological education model for cadets in digital transformation context',
      category: 'CAP_HOC_VIEN', field: 'KHOA_HOC_XA_HOI', researchType: 'UNG_DUNG',
      status: 'IN_PROGRESS', phase: 'EXECUTION',
      budgetYear: 2025, budgetRequested: 180_000_000, budgetApproved: 170_000_000,
      startDate: new Date('2025-03-01'), endDate: new Date('2025-12-31'),
      abstract: 'Đề tài nghiên cứu xây dựng mô hình giáo dục chính trị tư tưởng phù hợp với xu thế chuyển đổi số, ứng dụng công nghệ trong giảng dạy lý luận chính trị quân sự.',
      keywords: ['giáo dục chính trị', 'chuyển đổi số', 'học viên', 'lý luận'],
      piIdx: 4, unitCode: 'PCTCT', memberIdxs: [5, 9],
    },
    {
      code: 'SANG_KIEN-2025-001',
      title: 'Sáng kiến cải tiến quy trình quản lý kho vật tư kỹ thuật cấp đại đội ứng dụng mã QR',
      titleEn: 'Innovation to improve company-level technical supply management process using QR code',
      category: 'SANG_KIEN_CO_SO', field: 'HAU_CAN_KY_THUAT', researchType: 'SANG_KIEN_KINH_NGHIEM',
      status: 'COMPLETED', phase: 'ACCEPTED',
      budgetYear: 2025, budgetRequested: 20_000_000, budgetApproved: 20_000_000,
      startDate: new Date('2025-01-01'), endDate: new Date('2025-04-30'),
      abstract: 'Sáng kiến kinh nghiệm về cải tiến quy trình kiểm kê, bảo quản và cấp phát vật tư kỹ thuật tại cấp đại đội, áp dụng mã QR và phần mềm quản lý điện thoại thông minh.',
      keywords: ['sáng kiến', 'kho vật tư', 'QR code', 'cấp đại đội'],
      piIdx: 5, unitCode: 'K2', memberIdxs: [6, 7],
    },
    {
      code: 'NCKH-HVHC-2025-004',
      title: 'Tối ưu hóa mạng lưới phân phối hậu cần cấp chiến dịch bằng thuật toán di truyền',
      titleEn: 'Optimization of campaign-level logistics distribution network using genetic algorithms',
      category: 'CAP_TONG_CUC', field: 'HOC_THUAT_QUAN_SU', researchType: 'CO_BAN',
      status: 'UNDER_REVIEW', phase: 'PROPOSAL',
      budgetYear: 2025, budgetRequested: 560_000_000, budgetApproved: null,
      startDate: new Date('2025-06-01'), endDate: new Date('2026-12-31'),
      abstract: 'Nghiên cứu ứng dụng thuật toán di truyền và các phương pháp tối ưu hóa hiện đại để giải bài toán tối ưu mạng lưới phân phối hậu cần trong tác chiến cấp chiến dịch.',
      keywords: ['tối ưu hóa', 'thuật toán di truyền', 'hậu cần chiến dịch', 'mạng phân phối'],
      piIdx: 6, unitCode: 'VIEN1', memberIdxs: [0, 7, 8],
    },
    {
      code: 'NCKH-HVHC-2026-001',
      title: 'Nghiên cứu xây dựng hệ thống thông tin tích hợp quản lý hậu cần thực chiến',
      titleEn: 'Research on building integrated information systems for real-time logistics management',
      category: 'CAP_HOC_VIEN', field: 'CNTT', researchType: 'TRIEN_KHAI',
      status: 'SUBMITTED', phase: 'PROPOSAL',
      budgetYear: 2026, budgetRequested: 380_000_000, budgetApproved: null,
      startDate: new Date('2026-01-01'), endDate: new Date('2027-06-30'),
      abstract: 'Nghiên cứu và triển khai hệ thống thông tin tích hợp (IIS) cho phép theo dõi thời gian thực tình hình hậu cần chiến đấu, kết nối từ cấp tiểu đoàn đến Học viện.',
      keywords: ['hệ thống thông tin', 'thời gian thực', 'hậu cần thực chiến', 'tích hợp'],
      piIdx: 7, unitCode: 'PQLKH', memberIdxs: [1, 3, 4, 5],
    },
  ]

  const createdProjects: { id: string; piIdx: number; field: string; startDate: Date; status: string; phase: string }[] = []

  for (const s of seeds) {
    const pi = piUsers[s.piIdx % piUsers.length]
    if (!pi) continue

    try {
      const project = await db.nckhProject.create({
        data: {
          projectCode:             s.code,
          title:                   s.title,
          titleEn:                 s.titleEn,
          category:                s.category as never,
          field:                   s.field as never,
          researchType:            s.researchType as never,
          status:                  s.status as never,
          phase:                   s.phase as never,
          budgetYear:              s.budgetYear,
          budgetRequested:         s.budgetRequested,
          budgetApproved:          s.budgetApproved,
          startDate:               s.startDate,
          endDate:                 s.endDate,
          abstract:                s.abstract,
          keywords:                s.keywords,
          principalInvestigatorId: pi.id,
          unitId:                  unitByCode[s.unitCode] ?? defaultUnitId,
          actualEndDate:           s.status === 'COMPLETED' ? daysAfter(s.endDate, -5) : undefined,
          completionGrade:         s.status === 'COMPLETED' ? 'Xuất sắc' : undefined,
          completionScore:         s.status === 'COMPLETED' ? 9.2 : undefined,
        },
      })

      // PI as CHU_NHIEM member
      await db.nckhMember.create({
        data: { projectId: project.id, userId: pi.id, role: NckhMemberRole.CHU_NHIEM, joinDate: s.startDate, contribution: 40 },
      })

      // Other members
      for (const mi of s.memberIdxs) {
        const m = memberPool[mi % memberPool.length]
        if (!m || m.id === pi.id) continue
        try {
          await db.nckhMember.create({
            data: { projectId: project.id, userId: m.id, role: NckhMemberRole.THANH_VIEN_CHINH, joinDate: s.startDate, contribution: 15 },
          })
        } catch { /* skip dup */ }
      }

      // Milestones
      const milestones = [
        { title: 'Hoàn thiện đề cương và kế hoạch nghiên cứu', days: 30 },
        { title: 'Thu thập và xử lý số liệu', days: 90 },
        { title: 'Xây dựng mô hình / phương án nghiên cứu', days: 180 },
        { title: 'Thực nghiệm và đánh giá kết quả', days: 270 },
        { title: 'Hoàn thiện báo cáo tổng kết và nghiệm thu', days: 360 },
      ]
      const isDone   = ['COMPLETED', 'ARCHIVED', 'ACCEPTED'].includes(s.status) || ['ARCHIVED', 'ACCEPTED'].includes(s.phase)
      const isMiddle = ['MIDTERM_REVIEW', 'EXECUTION'].includes(s.phase)
      for (let mi = 0; mi < milestones.length; mi++) {
        const ms = milestones[mi]
        const dueDate = daysAfter(s.startDate, ms.days)
        const msStatus = isDone ? NckhMilestoneStatus.COMPLETED
          : isMiddle && mi <= 2 ? NckhMilestoneStatus.COMPLETED
          : isMiddle && mi === 3 ? NckhMilestoneStatus.IN_PROGRESS
          : NckhMilestoneStatus.PENDING
        await db.nckhMilestone.create({
          data: {
            projectId:   project.id,
            title:       ms.title,
            dueDate,
            completedAt: msStatus === NckhMilestoneStatus.COMPLETED ? daysAfter(dueDate, -3) : null,
            status:      msStatus,
          },
        })
      }

      // Review for completed projects
      if (isDone) {
        await db.nckhReview.create({
          data: {
            projectId:  project.id,
            reviewType: 'NGHIEM_THU_CAP_HV',
            reviewDate: daysAfter(s.endDate, -10),
            score:      pick([9.2, 8.8, 9.0, 8.5], hashStr(project.id)),
            grade:      'Xuất sắc',
            decision:   'PASSED',
            comments:   'Đề tài hoàn thành đúng tiến độ, kết quả nghiên cứu có giá trị ứng dụng thực tiễn cao.',
          },
        })
      }

      createdProjects.push({ id: project.id, piIdx: s.piIdx, field: s.field, startDate: s.startDate, status: s.status, phase: s.phase })
    } catch (e: any) {
      if (e?.code === 'P2002') {
        console.warn(`  Demo project already exists: ${s.code}`)
      } else {
        console.error(`  Error creating ${s.code}:`, e?.message)
      }
    }
  }

  console.log(`   ✓ ${createdProjects.length} demo projects created.\n`)
  return { createdProjects, piUsers, memberPool }
}

// ─── Step 7: Seed demo NckhPublication (20 high-quality pubs) ────────────────

async function seedDemoPublications(
  scientists: Awaited<ReturnType<typeof loadM02>>['facultyUsers'],
  projectIds: string[],
) {
  if (scientists.length === 0) return
  console.log('📰 Seeding 20 demo NckhPublication records...')

  type PubS = {
    title: string; titleEn: string; pubType: NckhPublicationType
    year: number; journal: string; doi: string | null
    isISI: boolean; isScopus: boolean; scopusQ: string | null
    impactFactor: number | null; ranking: string | null
    citations: number; abstract: string; keywords: string[]
    authorIdx: number; projectIdx: number | null; coAuthorIdxs: number[]
  }

  const pubs: PubS[] = [
    {
      title: 'Mô hình dự báo nhu cầu vật chất hậu cần dựa trên mạng nơ-ron hồi quy trong điều kiện tác chiến',
      titleEn: 'Logistics Demand Forecasting Using Recurrent Neural Networks in Combat Conditions',
      pubType: NckhPublicationType.BAI_BAO_QUOC_TE, year: 2024,
      journal: 'Defence Technology', doi: '10.1016/j.dt.2024.01.005',
      isISI: true, isScopus: true, scopusQ: 'Q1', impactFactor: 5.08, ranking: 'Q1',
      citations: 12, abstract: 'Bài báo đề xuất mô hình dự báo nhu cầu vật chất hậu cần sử dụng mạng LSTM trong điều kiện tác chiến bất định, với độ chính xác cao hơn 23% so với phương pháp truyền thống.',
      keywords: ['LSTM', 'logistics', 'demand forecasting', 'military'],
      authorIdx: 0, projectIdx: 0, coAuthorIdxs: [2],
    },
    {
      title: 'Tối ưu hóa lịch trình vận tải quân sự bằng thuật toán bầy đàn hạt',
      titleEn: 'Military Transport Schedule Optimization Using Particle Swarm Algorithm',
      pubType: NckhPublicationType.BAI_BAO_QUOC_TE, year: 2024,
      journal: 'Computers & Operations Research', doi: '10.1016/j.cor.2024.02.011',
      isISI: true, isScopus: true, scopusQ: 'Q1', impactFactor: 4.12, ranking: 'Q1',
      citations: 8, abstract: 'Bài báo trình bày ứng dụng thuật toán PSO cải tiến để tối ưu hóa lịch trình vận tải quân sự đa mục tiêu trong điều kiện môi trường động.',
      keywords: ['PSO', 'vận tải quân sự', 'tối ưu hóa', 'đa mục tiêu'],
      authorIdx: 1, projectIdx: 1, coAuthorIdxs: [0, 3],
    },
    {
      title: 'Chiến lược hậu cần trong tác chiến hiện đại: Bài học kinh nghiệm và hướng phát triển',
      titleEn: 'Logistics strategy in modern warfare: Lessons learned and development directions',
      pubType: NckhPublicationType.SACH_CHUYEN_KHAO, year: 2024,
      journal: 'Nhà xuất bản Quân đội nhân dân', doi: null,
      isISI: false, isScopus: false, scopusQ: null, impactFactor: null, ranking: null,
      citations: 35, abstract: 'Sách chuyên khảo phân tích chiến lược hậu cần trong các cuộc xung đột vũ trang hiện đại, rút ra bài học cho Quân đội nhân dân Việt Nam giai đoạn 2025–2035.',
      keywords: ['chiến lược hậu cần', 'tác chiến hiện đại', 'kinh nghiệm', 'phát triển'],
      authorIdx: 2, projectIdx: 2, coAuthorIdxs: [],
    },
    {
      title: 'Ứng dụng blockchain trong quản lý chuỗi cung ứng vật tư kỹ thuật quân sự',
      titleEn: 'Blockchain application in military technical supply chain management',
      pubType: NckhPublicationType.BAI_BAO_TRONG_NUOC, year: 2025,
      journal: 'Tạp chí Nghiên cứu Khoa học và Công nghệ Quân sự', doi: null,
      isISI: false, isScopus: false, scopusQ: null, impactFactor: null, ranking: null,
      citations: 4, abstract: 'Bài báo đánh giá khả năng ứng dụng công nghệ blockchain để nâng cao tính minh bạch và an toàn trong quản lý chuỗi cung ứng vật tư kỹ thuật quân sự.',
      keywords: ['blockchain', 'chuỗi cung ứng', 'vật tư kỹ thuật', 'quân sự'],
      authorIdx: 3, projectIdx: 3, coAuthorIdxs: [1],
    },
    {
      title: 'Mô hình giáo dục chính trị kết hợp công nghệ số trong đào tạo sĩ quan Học viện Hậu cần',
      titleEn: null as any,
      pubType: NckhPublicationType.BAI_BAO_TRONG_NUOC, year: 2025,
      journal: 'Tạp chí Giáo dục và Xã hội', doi: null,
      isISI: false, isScopus: false, scopusQ: null, impactFactor: null, ranking: null,
      citations: 2, abstract: 'Nghiên cứu đề xuất mô hình giáo dục chính trị tư tưởng tích hợp công nghệ số dành cho học viên sĩ quan trong hệ thống nhà trường quân đội.',
      keywords: ['giáo dục chính trị', 'chuyển đổi số', 'đào tạo sĩ quan'],
      authorIdx: 4, projectIdx: 4, coAuthorIdxs: [5],
    },
    {
      title: 'Sáng kiến số hóa quản lý kho vật tư cấp đại đội sử dụng QR code và ứng dụng mobile',
      titleEn: null as any,
      pubType: NckhPublicationType.SANG_KIEN, year: 2025,
      journal: 'Hội đồng Sáng kiến Học viện Hậu cần', doi: null,
      isISI: false, isScopus: false, scopusQ: null, impactFactor: null, ranking: null,
      citations: 0, abstract: 'Mô tả giải pháp số hóa quy trình quản lý, kiểm kê và cấp phát vật tư kỹ thuật tại cấp đại đội sử dụng mã QR và ứng dụng điện thoại thông minh.',
      keywords: ['sáng kiến', 'số hóa', 'QR code', 'quản lý kho'],
      authorIdx: 5, projectIdx: 5, coAuthorIdxs: [],
    },
    {
      title: 'Genetic Algorithm-Based Optimization for Multi-Echelon Logistics Networks in Military Operations',
      titleEn: 'Genetic Algorithm-Based Optimization for Multi-Echelon Logistics Networks in Military Operations',
      pubType: NckhPublicationType.BAI_BAO_QUOC_TE, year: 2025,
      journal: 'European Journal of Operational Research', doi: '10.1016/j.ejor.2025.03.022',
      isISI: true, isScopus: true, scopusQ: 'Q1', impactFactor: 6.37, ranking: 'Q1',
      citations: 3, abstract: 'This paper proposes an improved genetic algorithm for optimizing multi-echelon logistics distribution networks in military campaign operations, demonstrating 31% efficiency improvements.',
      keywords: ['genetic algorithm', 'logistics optimization', 'military operations', 'multi-echelon'],
      authorIdx: 6, projectIdx: 6, coAuthorIdxs: [0, 7],
    },
    {
      title: 'Kiến trúc hệ thống thông tin tích hợp phục vụ quản lý hậu cần thực chiến theo thời gian thực',
      titleEn: 'Integrated Information System Architecture for Real-Time Combat Logistics Management',
      pubType: NckhPublicationType.BAI_BAO_QUOC_TE, year: 2025,
      journal: 'Journal of Defense Modeling and Simulation', doi: '10.1177/15485129251234567',
      isISI: true, isScopus: true, scopusQ: 'Q2', impactFactor: 1.85, ranking: 'Q2',
      citations: 1, abstract: 'Bài báo đề xuất kiến trúc IIS kết nối thời gian thực từ cấp tiểu đoàn đến Học viện, với giao thức an ninh thông tin quân sự tích hợp.',
      keywords: ['IIS', 'thời gian thực', 'hậu cần thực chiến', 'kiến trúc'],
      authorIdx: 7, projectIdx: 7, coAuthorIdxs: [1, 3],
    },
    {
      title: 'Giáo trình Hậu cần Quân sự – Lý luận và Thực tiễn (Tái bản lần 3)',
      titleEn: null as any,
      pubType: NckhPublicationType.GIAO_TRINH, year: 2024,
      journal: 'Nhà xuất bản Quân đội nhân dân', doi: null,
      isISI: false, isScopus: false, scopusQ: null, impactFactor: null, ranking: null,
      citations: 120, abstract: 'Giáo trình chuẩn về hậu cần quân sự dành cho hệ đào tạo sĩ quan hậu cần bậc đại học, tái bản lần 3 có cập nhật nội dung theo xu hướng tác chiến hiện đại.',
      keywords: ['giáo trình', 'hậu cần quân sự', 'lý luận', 'đào tạo sĩ quan'],
      authorIdx: 2, projectIdx: null, coAuthorIdxs: [0, 6],
    },
    {
      title: 'Hệ thống phân loại và nhận dạng vật tư kỹ thuật tự động dùng thị giác máy tính',
      titleEn: 'Automatic technical material classification and recognition using computer vision',
      pubType: NckhPublicationType.BAI_BAO_QUOC_TE, year: 2024,
      journal: 'IEEE Transactions on Industrial Informatics', doi: '10.1109/TII.2024.3456789',
      isISI: true, isScopus: true, scopusQ: 'Q1', impactFactor: 11.65, ranking: 'Q1',
      citations: 22, abstract: 'Bài báo đề xuất hệ thống nhận dạng và phân loại vật tư kỹ thuật tự động sử dụng mạng nơ-ron tích chập, đạt độ chính xác 97.3% trên tập kiểm thử thực tế.',
      keywords: ['thị giác máy tính', 'phân loại vật tư', 'CNN', 'tự động hóa kho'],
      authorIdx: 1, projectIdx: 1, coAuthorIdxs: [6, 9],
    },
    {
      title: 'Lịch sử Học viện Hậu cần – 60 năm xây dựng và phát triển (1960–2020)',
      titleEn: null as any,
      pubType: NckhPublicationType.SACH_CHUYEN_KHAO, year: 2024,
      journal: 'Nhà xuất bản Quân đội nhân dân', doi: null,
      isISI: false, isScopus: false, scopusQ: null, impactFactor: null, ranking: null,
      citations: 18, abstract: 'Công trình nghiên cứu tổng hợp về lịch sử hình thành, phát triển và thành tích của Học viện Hậu cần qua 60 năm xây dựng và trưởng thành.',
      keywords: ['lịch sử', 'Học viện Hậu cần', '60 năm', 'truyền thống'],
      authorIdx: 5, projectIdx: null, coAuthorIdxs: [4],
    },
    {
      title: 'Mô phỏng tác chiến hậu cần số sử dụng Digital Twin trong điều kiện chiến tranh thông minh',
      titleEn: 'Digital Twin-Based Logistics Combat Simulation in Smart Warfare Conditions',
      pubType: NckhPublicationType.BAI_BAO_QUOC_TE, year: 2025,
      journal: 'Simulation Modelling Practice and Theory', doi: '10.1016/j.simpat.2025.01.009',
      isISI: true, isScopus: true, scopusQ: 'Q1', impactFactor: 3.84, ranking: 'Q1',
      citations: 5, abstract: 'Bài báo trình bày phương pháp xây dựng hệ thống mô phỏng tác chiến hậu cần sử dụng công nghệ Digital Twin, giúp huấn luyện và tập dượt kế hoạch hậu cần trong môi trường ảo.',
      keywords: ['Digital Twin', 'mô phỏng', 'tác chiến hậu cần', 'chiến tranh thông minh'],
      authorIdx: 6, projectIdx: 6, coAuthorIdxs: [1],
    },
    {
      title: 'Phân tích yếu tố ảnh hưởng đến hiệu quả công tác hậu cần trong điều kiện tác chiến phòng ngự',
      titleEn: null as any,
      pubType: NckhPublicationType.BAI_BAO_TRONG_NUOC, year: 2024,
      journal: 'Tạp chí Khoa học Quân sự', doi: null,
      isISI: false, isScopus: false, scopusQ: null, impactFactor: null, ranking: null,
      citations: 6, abstract: 'Bài báo phân tích hệ thống các yếu tố chủ quan và khách quan ảnh hưởng đến hiệu quả bảo đảm hậu cần trong điều kiện tác chiến phòng ngự cấp chiến dịch.',
      keywords: ['hậu cần phòng ngự', 'yếu tố ảnh hưởng', 'hiệu quả', 'chiến dịch'],
      authorIdx: 0, projectIdx: 0, coAuthorIdxs: [4],
    },
    {
      title: 'Nghiên cứu mô hình dự trữ vật tư chiến lược đáp ứng yêu cầu chiến tranh nhân dân',
      titleEn: null as any,
      pubType: NckhPublicationType.BAI_BAO_TRONG_NUOC, year: 2025,
      journal: 'Tạp chí Quốc phòng Toàn dân', doi: null,
      isISI: false, isScopus: false, scopusQ: null, impactFactor: null, ranking: null,
      citations: 3, abstract: 'Bài báo đề xuất mô hình dự trữ vật tư chiến lược phục vụ chiến tranh nhân dân toàn dân toàn diện trong bối cảnh hiện đại hóa quân đội.',
      keywords: ['dự trữ chiến lược', 'vật tư', 'chiến tranh nhân dân', 'hiện đại hóa'],
      authorIdx: 2, projectIdx: 2, coAuthorIdxs: [0, 3],
    },
    {
      title: 'Xây dựng tiêu chí đánh giá chất lượng đào tạo sĩ quan hậu cần trong hệ thống nhà trường quân sự',
      titleEn: null as any,
      pubType: NckhPublicationType.BAI_BAO_TRONG_NUOC, year: 2024,
      journal: 'Tạp chí Giáo dục', doi: null,
      isISI: false, isScopus: false, scopusQ: null, impactFactor: null, ranking: null,
      citations: 9, abstract: 'Bài báo xây dựng hệ thống tiêu chí đánh giá toàn diện chất lượng đào tạo sĩ quan hậu cần trong các trường quân sự theo chuẩn đầu ra hiện đại.',
      keywords: ['tiêu chí đánh giá', 'chất lượng đào tạo', 'sĩ quan hậu cần', 'chuẩn đầu ra'],
      authorIdx: 4, projectIdx: 4, coAuthorIdxs: [],
    },
    {
      title: 'Federated Learning for Privacy-Preserving Military Logistics Data Analytics',
      titleEn: 'Federated Learning for Privacy-Preserving Military Logistics Data Analytics',
      pubType: NckhPublicationType.BAI_BAO_QUOC_TE, year: 2025,
      journal: 'IEEE Access', doi: '10.1109/ACCESS.2025.3345678',
      isISI: true, isScopus: true, scopusQ: 'Q2', impactFactor: 3.37, ranking: 'Q2',
      citations: 2, abstract: 'This paper proposes a federated learning framework for military logistics data analytics that preserves operational security while enabling cross-unit model training.',
      keywords: ['federated learning', 'privacy', 'military logistics', 'data analytics'],
      authorIdx: 1, projectIdx: 1, coAuthorIdxs: [6, 7],
    },
    {
      title: 'Ứng dụng GIS và dữ liệu vệ tinh trong lập kế hoạch tuyến đường vận tải quân sự',
      titleEn: 'Application of GIS and satellite data in military transport route planning',
      pubType: NckhPublicationType.BAI_BAO_QUOC_TE, year: 2024,
      journal: 'International Journal of Geographical Information Science', doi: '10.1080/13658816.2024.2312456',
      isISI: true, isScopus: true, scopusQ: 'Q1', impactFactor: 5.09, ranking: 'Q1',
      citations: 7, abstract: 'Bài báo đề xuất phương pháp tích hợp GIS và ảnh vệ tinh để hỗ trợ lập kế hoạch và điều chỉnh tuyến đường vận tải quân sự trong điều kiện địa hình phức tạp.',
      keywords: ['GIS', 'vệ tinh', 'vận tải quân sự', 'lập kế hoạch'],
      authorIdx: 3, projectIdx: null, coAuthorIdxs: [0],
    },
    {
      title: 'Nghiên cứu công tác đảng trong các đơn vị hậu cần trực tiếp chiến đấu',
      titleEn: null as any,
      pubType: NckhPublicationType.BAI_BAO_TRONG_NUOC, year: 2024,
      journal: 'Tạp chí Lịch sử Quân sự', doi: null,
      isISI: false, isScopus: false, scopusQ: null, impactFactor: null, ranking: null,
      citations: 5, abstract: 'Bài báo phân tích thực tiễn lãnh đạo của tổ chức đảng tại các đơn vị hậu cần trực tiếp chiến đấu, đề xuất giải pháp nâng cao chất lượng công tác đảng.',
      keywords: ['công tác đảng', 'đơn vị hậu cần', 'chiến đấu', 'lãnh đạo'],
      authorIdx: 5, projectIdx: null, coAuthorIdxs: [4],
    },
    {
      title: 'Đánh giá khả năng ứng dụng UAV trong trinh sát và hỗ trợ hậu cần cấp chiến thuật',
      titleEn: 'Assessment of UAV applicability in reconnaissance and tactical logistics support',
      pubType: NckhPublicationType.BAI_BAO_QUOC_TE, year: 2025,
      journal: 'Unmanned Systems', doi: '10.1142/S2301385025500123',
      isISI: true, isScopus: true, scopusQ: 'Q2', impactFactor: 2.45, ranking: 'Q2',
      citations: 4, abstract: 'Bài báo đánh giá tiềm năng và thách thức khi ứng dụng UAV để hỗ trợ trinh sát địa hình và vận chuyển vật tư hậu cần cấp chiến thuật trong tác chiến hiện đại.',
      keywords: ['UAV', 'trinh sát', 'hậu cần chiến thuật', 'tác chiến'],
      authorIdx: 6, projectIdx: null, coAuthorIdxs: [2],
    },
    {
      title: 'Giáo trình Tin học ứng dụng trong quản lý hậu cần quân sự',
      titleEn: null as any,
      pubType: NckhPublicationType.GIAO_TRINH, year: 2025,
      journal: 'Nhà xuất bản Quân đội nhân dân', doi: null,
      isISI: false, isScopus: false, scopusQ: null, impactFactor: null, ranking: null,
      citations: 45, abstract: 'Giáo trình dành cho học viên sĩ quan hậu cần, cung cấp kiến thức về ứng dụng tin học, phần mềm quản lý và phân tích dữ liệu trong công tác hậu cần quân sự.',
      keywords: ['giáo trình', 'tin học', 'hậu cần quân sự', 'phần mềm'],
      authorIdx: 7, projectIdx: null, coAuthorIdxs: [1, 6],
    },
  ]

  let created = 0
  for (const p of pubs) {
    const author = scientists[p.authorIdx % scientists.length]
    if (!author) continue
    const projectId = p.projectIdx !== null ? projectIds[p.projectIdx] : undefined

    try {
      const pub = await db.nckhPublication.create({
        data: {
          title:         p.title,
          titleEn:       p.titleEn ?? undefined,
          pubType:       p.pubType,
          publishedYear: p.year,
          journal:       p.journal,
          doi:           p.doi ?? undefined,
          isISI:         p.isISI,
          isScopus:      p.isScopus,
          scopusQ:       p.scopusQ ?? undefined,
          impactFactor:  p.impactFactor ?? undefined,
          ranking:       p.ranking ?? undefined,
          citationCount: p.citations,
          status:        NckhPublicationStatus.PUBLISHED,
          abstract:      p.abstract,
          keywords:      p.keywords,
          authorId:      author.id,
          authorsText:   [author.name, ...p.coAuthorIdxs.map((ci) => scientists[ci % scientists.length]?.name ?? '')].filter(Boolean).join(', '),
          projectId,
        },
      })
      // Author entries
      await db.nckhPublicationAuthor.create({
        data: { publicationId: pub.id, userId: author.id, authorName: author.name, authorOrder: 1, isInternal: true },
      })
      for (let ci = 0; ci < p.coAuthorIdxs.length; ci++) {
        const co = scientists[p.coAuthorIdxs[ci] % scientists.length]
        if (!co || co.id === author.id) continue
        try {
          await db.nckhPublicationAuthor.create({
            data: { publicationId: pub.id, userId: co.id, authorName: co.name, authorOrder: ci + 2, isInternal: true },
          })
        } catch { /* skip */ }
      }
      created++
    } catch (e: any) {
      console.warn(`  Demo pub skip: ${p.title.slice(0, 50)}`, e?.message)
    }
  }
  console.log(`   ✓ ${created} demo publications created.\n`)
}

// ─── Step 8: Update scientist profile counts ──────────────────────────────────

async function updateScientistCounts() {
  console.log('📊 Updating NckhScientistProfile computed counts...')
  const profiles = await db.nckhScientistProfile.findMany({ select: { id: true, userId: true } })
  for (const sp of profiles) {
    const [pubCount, leadCount, memberCount] = await Promise.all([
      db.nckhPublication.count({ where: { authorId: sp.userId } }),
      db.nckhMember.count({ where: { userId: sp.userId, role: NckhMemberRole.CHU_NHIEM } }),
      db.nckhMember.count({ where: { userId: sp.userId } }),
    ])
    await db.nckhScientistProfile.update({
      where: { id: sp.id },
      data: { totalPublications: pubCount, projectLeadCount: leadCount, projectMemberCount: memberCount },
    })
  }
  console.log(`   ✓ ${profiles.length} scientist profiles updated with live counts.\n`)
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('═══════════════════════════════════════════════════════')
  console.log('  M09 Full Reset + Reseed from M02 Data')
  console.log('═══════════════════════════════════════════════════════\n')

  await clearM09()

  const { facultyUsers, scientificResearch, memberResearch, scientificPublications, unitByCode, defaultUnitId } = await loadM02()

  console.log(`📋 M02 source data:`)
  console.log(`   Faculty users:           ${facultyUsers.length}`)
  console.log(`   ScientificResearch (PI): ${scientificResearch.length}`)
  console.log(`   ScientificPublication:   ${scientificPublications.length}\n`)

  if (facultyUsers.length === 0) {
    throw new Error('Không có faculty users. Hãy chạy seed_faculty_profiles.ts trước.')
  }

  // 3. Scientist profiles
  const sortedFaculty = await seedScientistProfiles(facultyUsers)

  // 4. Bridge ScientificResearch → NckhProject
  const titleToProjectId = await bridgeResearchProjects(scientificResearch, memberResearch)

  // 5. Bridge ScientificPublication → NckhPublication
  await bridgePublications(scientificPublications, titleToProjectId)

  // 6. Demo projects
  const { createdProjects } = await seedDemoProjects(sortedFaculty, unitByCode, defaultUnitId)
  const demoProjectIds = createdProjects.map((p) => p.id)

  // 7. Demo publications
  await seedDemoPublications(sortedFaculty, demoProjectIds)

  // 8. Update counts
  await updateScientistCounts()

  // ── Summary ──
  const [totalP, totalPub, totalSci, totalMem, totalMs] = await Promise.all([
    db.nckhProject.count(),
    db.nckhPublication.count(),
    db.nckhScientistProfile.count(),
    db.nckhMember.count(),
    db.nckhMilestone.count(),
  ])

  console.log('═══════════════════════════════════════════════════════')
  console.log('  ✅ Seed hoàn tất!')
  console.log('═══════════════════════════════════════════════════════')
  console.log(`  NckhProject:          ${totalP}`)
  console.log(`  NckhPublication:      ${totalPub}`)
  console.log(`  NckhScientistProfile: ${totalSci}`)
  console.log(`  NckhMember:           ${totalMem}`)
  console.log(`  NckhMilestone:        ${totalMs}`)
  console.log('═══════════════════════════════════════════════════════')
}

main()
  .catch((e) => { console.error('❌ Seed thất bại:', e); process.exit(1) })
  .finally(() => db.$disconnect())
