/**
 * PersonnelProfile360Service – M02 Phase 3
 *
 * Aggregate hồ sơ 360° từ nhiều module nguồn.
 * Bridge pattern: Personnel → account.id (userId) → tất cả sub-records.
 *
 * Integration status per module:
 *   [REAL]   – query trực tiếp từ prisma
 *   [STUB]   – model chưa tồn tại, trả { data: [], _stub: true }
 *   [PARTIAL] – model tồn tại nhưng chỉ lấy subset fields cần cho profile360
 *
 * Khi module ngoài hoàn thiện, thay thế stub bằng service call tương ứng:
 *   M05 allowances → AllowanceService.getByUserId(userId)
 */
import 'server-only'
import db from '@/lib/db'

// ─── Output types ─────────────────────────────────────────────────────────────

export interface Profile360Warning {
  source: string
  message: string
}

export interface Profile360Result {
  personnel: PersonnelCore | null
  careerHistory: CareerHistoryItem[]
  educationHistory: EducationHistoryItem[]
  familyMembers: FamilyMemberItem[]
  partyMember: PartyMemberData | null      // M03
  rewards: PolicyRecordItem[]              // M05 EMULATION + REWARD
  disciplines: PolicyRecordItem[]          // M05 DISCIPLINE
  insurance: InsuranceData | null          // M05
  allowances: AllowanceItem[]              // M05 [STUB]
  scientificProfile: ScientificProfileData | null  // M02 + M09
  researchProjects: ResearchProjectItem[]  // M09
  facultyProfile: FacultyProfileData | null  // M07
  warnings: Profile360Warning[]
  _bridge: { personnelId: string; userId: string | null }
}

// ─── Minimal field types for Profile360 ──────────────────────────────────────

type PersonnelCore = {
  id: string; personnelCode: string; fullName: string; fullNameEn: string | null
  dateOfBirth: Date | null; gender: string | null; bloodType: string | null
  placeOfOrigin: string | null; birthPlace: string | null
  permanentAddress: string | null; temporaryAddress: string | null
  ethnicity: string | null; religion: string | null
  category: string | null; managingOrgan: string | null
  militaryRank: string | null; rankDate: Date | null
  position: string | null; positionDate: Date | null
  enlistmentDate: Date | null; dischargeDate: Date | null
  educationLevel: string | null; specialization: string | null
  politicalTheory: string | null; academicTitle: string | null; academicDegree: string | null
  status: string; unitId: string | null
  unit: { id: string; name: string; code: string } | null
}

type CareerHistoryItem = {
  id: string; eventType: string; eventDate: Date; effectiveDate: Date | null
  title: string | null; oldPosition: string | null; newPosition: string | null
  oldRank: string | null; newRank: string | null; oldUnit: string | null; newUnit: string | null
  decisionNumber: string | null; decisionDate: Date | null; notes: string | null
}

type EducationHistoryItem = {
  id: string; level: string; trainingSystem: string | null; major: string | null
  institution: string; startDate: Date | null; endDate: Date | null
  gpa: number | null; thesisTitle: string | null; classification: string | null
  certificateCode: string | null; certificateDate: Date | null
}

type FamilyMemberItem = {
  id: string; relation: string; fullName: string; dateOfBirth: Date | null
  occupation: string | null; workplace: string | null; address: string | null
  isDeceased: boolean; dependentFlag: boolean
}

type PartyMemberData = {
  id: string; partyCardNumber: string | null; joinDate: Date | null; officialDate: Date | null
  partyCell: string | null; currentPosition: string | null; status: string
  organization: { id: string; name: string } | null
}

type PolicyRecordItem = {
  id: string; recordType: string; level: string; title: string; reason: string
  decisionNumber: string | null; decisionDate: Date | null; effectiveDate: Date | null
  status: string; workflowStatus: string; year: number | null
}

type InsuranceData = {
  id: string; insuranceNumber: string | null; insuranceStartDate: Date | null
  healthInsuranceNumber: string | null; healthInsuranceHospital: string | null
}

type AllowanceItem = { _stub: true }

type ScientificProfileData = {
  id: string; summary: string | null; isPublic: boolean
  hIndex: number | null; publicationCount: number | null
  publications: ScientificPublicationItem[]
  awardsRecords: AwardsRecordItem[]
}

type ScientificPublicationItem = {
  id: string; type: string; title: string; year: number; role: string
  publisher: string | null; coAuthors: string | null
}

type AwardsRecordItem = {
  id: string; type: string; category: string; description: string; year: number
}

type ResearchProjectItem = {
  id: string; projectCode: string; title: string; status: string; phase: string
  category: string; field: string; role: string
  startDate: Date | null; endDate: Date | null
}

type FacultyProfileData = {
  id: string; academicRank: string | null; academicDegree: string | null
  specialization: string | null; researchInterests: string | null
  publications: number; researchProjects: number; citations: number
  orcidId: string | null; googleScholarUrl: string | null
}

// ─── Internal fetchers ────────────────────────────────────────────────────────

async function fetchPersonnelCore(personnelId: string): Promise<PersonnelCore | null> {
  return db.personnel.findUnique({
    where: { id: personnelId, deletedAt: null },
    select: {
      id: true, personnelCode: true, fullName: true, fullNameEn: true,
      dateOfBirth: true, gender: true, bloodType: true,
      placeOfOrigin: true, birthPlace: true,
      permanentAddress: true, temporaryAddress: true,
      ethnicity: true, religion: true,
      category: true, managingOrgan: true,
      militaryRank: true, rankDate: true,
      position: true, positionDate: true,
      enlistmentDate: true, dischargeDate: true,
      educationLevel: true, specialization: true,
      politicalTheory: true, academicTitle: true, academicDegree: true,
      status: true, unitId: true,
      unit: { select: { id: true, name: true, code: true } },
    },
  }) as Promise<PersonnelCore | null>
}

/** [REAL] M02 – CareerHistory bridge: personnelId (Phase 1) OR userId */
async function fetchCareerHistory(
  userId: string | null,
  personnelId: string,
): Promise<CareerHistoryItem[]> {
  const where = personnelId
    ? { OR: [{ personnelId }, ...(userId ? [{ userId }] : [])] }
    : userId ? { userId } : null

  if (!where) return []

  return db.careerHistory.findMany({
    where: { ...where, deletedAt: null },
    select: {
      id: true, eventType: true, eventDate: true, effectiveDate: true,
      title: true, oldPosition: true, newPosition: true,
      oldRank: true, newRank: true, oldUnit: true, newUnit: true,
      decisionNumber: true, decisionDate: true, notes: true,
    },
    orderBy: { eventDate: 'desc' },
  }) as Promise<CareerHistoryItem[]>
}

/** [REAL] M02 – EducationHistory bridge: personnelId OR userId */
async function fetchEducationHistory(
  userId: string | null,
  personnelId: string,
): Promise<EducationHistoryItem[]> {
  const where = personnelId
    ? { OR: [{ personnelId }, ...(userId ? [{ userId }] : [])] }
    : userId ? { userId } : null

  if (!where) return []

  return db.educationHistory.findMany({
    where,
    select: {
      id: true, level: true, trainingSystem: true, major: true,
      institution: true, startDate: true, endDate: true,
      gpa: true, thesisTitle: true, classification: true,
      certificateCode: true, certificateDate: true,
    },
    orderBy: { endDate: 'desc' },
  }) as Promise<EducationHistoryItem[]>
}

/** [REAL] M02 – FamilyRelation bridge: personnelId OR userId */
async function fetchFamilyMembers(
  userId: string | null,
  personnelId: string,
): Promise<FamilyMemberItem[]> {
  const where = personnelId
    ? { OR: [{ personnelId }, ...(userId ? [{ userId }] : [])] }
    : userId ? { userId } : null

  if (!where) return []

  return db.familyRelation.findMany({
    where: { ...where, deletedAt: null },
    select: {
      id: true, relation: true, fullName: true, dateOfBirth: true,
      occupation: true, workplace: true, address: true,
      isDeceased: true, dependentFlag: true,
    },
    orderBy: { relation: 'asc' },
  }) as Promise<FamilyMemberItem[]>
}

/** [REAL] M03 – PartyMember via userId */
async function fetchPartyMember(userId: string): Promise<PartyMemberData | null> {
  const pm = await db.partyMember.findUnique({
    where: { userId },
    select: {
      id: true, partyCardNumber: true, joinDate: true, officialDate: true,
      partyCell: true, currentPosition: true, status: true,
      organization: { select: { id: true, name: true } },
    },
  })
  return pm as PartyMemberData | null
}

/** [REAL] M05 – PolicyRecord: rewards (EMULATION + REWARD) */
async function fetchRewards(userId: string): Promise<PolicyRecordItem[]> {
  return db.policyRecord.findMany({
    where: { userId, recordType: { in: ['EMULATION', 'REWARD'] } },
    select: {
      id: true, recordType: true, level: true, title: true, reason: true,
      decisionNumber: true, decisionDate: true, effectiveDate: true,
      status: true, workflowStatus: true, year: true,
    },
    orderBy: { decisionDate: 'desc' },
  }) as Promise<PolicyRecordItem[]>
}

/** [REAL] M05 – PolicyRecord: disciplines */
async function fetchDisciplines(userId: string): Promise<PolicyRecordItem[]> {
  return db.policyRecord.findMany({
    where: { userId, recordType: 'DISCIPLINE' },
    select: {
      id: true, recordType: true, level: true, title: true, reason: true,
      decisionNumber: true, decisionDate: true, effectiveDate: true,
      status: true, workflowStatus: true, year: true,
    },
    orderBy: { decisionDate: 'desc' },
  }) as Promise<PolicyRecordItem[]>
}

/** [REAL] M05 – InsuranceInfo via userId */
async function fetchInsurance(userId: string): Promise<InsuranceData | null> {
  return db.insuranceInfo.findUnique({
    where: { userId, deletedAt: null },
    select: {
      id: true, insuranceNumber: true, insuranceStartDate: true,
      healthInsuranceNumber: true, healthInsuranceHospital: true,
    },
  }) as Promise<InsuranceData | null>
}

/**
 * [STUB] M05 – AllowanceRecord
 * Model chưa tồn tại trong schema. Adapter boundary rõ ràng.
 * Khi M05 AllowanceRecord được triển khai: thay bằng db.allowanceRecord.findMany({ where: { userId } })
 */
async function fetchAllowances(_userId: string): Promise<{ data: AllowanceItem[]; _stub: true }> {
  return { data: [], _stub: true }
}

/** [REAL] M02 + M09 – ScientificProfile + Publications + AwardsRecords */
async function fetchScientificProfile(
  userId: string,
  personnelId: string,
): Promise<ScientificProfileData | null> {
  // ScientificProfile: try personnelId bridge first (Phase 1 added), fallback to userId
  const profile = await db.scientificProfile.findFirst({
    where: { OR: [{ personnelId }, { userId }] },
    select: {
      id: true, summary: true, isPublic: true,
    },
  })

  const [publications, awardsRecords] = await Promise.all([
    db.scientificPublication.findMany({
      where: { userId },
      select: {
        id: true, type: true, title: true, year: true, role: true,
        publisher: true, coAuthors: true,
      },
      orderBy: { year: 'desc' },
      take: 20,
    }),
    db.awardsRecord.findMany({
      where: { userId },
      select: { id: true, type: true, category: true, description: true, year: true },
      orderBy: { year: 'desc' },
    }),
  ])

  if (!profile && publications.length === 0 && awardsRecords.length === 0) return null

  return {
    id: profile?.id ?? '',
    summary: profile?.summary ?? null,
    isPublic: profile?.isPublic ?? false,
    hIndex: null,         // [M09-HOOK] compute from NckhProject/Publication when M09 stats ready
    publicationCount: publications.length,
    publications: publications as ScientificPublicationItem[],
    awardsRecords: awardsRecords as AwardsRecordItem[],
  }
}

/** [REAL] M09 – NckhMember → NckhProject */
async function fetchResearchProjects(userId: string): Promise<ResearchProjectItem[]> {
  const memberships = await db.nckhMember.findMany({
    where: { userId },
    select: {
      role: true,
      project: {
        select: {
          id: true, projectCode: true, title: true, status: true, phase: true,
          category: true, field: true, startDate: true, endDate: true,
        },
      },
    },
    orderBy: { joinDate: 'desc' },
  })

  return memberships.map(m => ({
    ...m.project,
    role: m.role,
  })) as ResearchProjectItem[]
}

/** [REAL] M07 – FacultyProfile via userId */
async function fetchFacultyProfile(userId: string): Promise<FacultyProfileData | null> {
  return db.facultyProfile.findUnique({
    where: { userId },
    select: {
      id: true, academicRank: true, academicDegree: true, specialization: true,
      researchInterests: true, publications: true, researchProjects: true,
      citations: true, orcidId: true, googleScholarUrl: true,
    },
  }) as Promise<FacultyProfileData | null>
}

// ─── Main aggregate ───────────────────────────────────────────────────────────

export async function buildProfile360(personnelId: string): Promise<Profile360Result> {
  const warnings: Profile360Warning[] = []

  // Step 1: Load Personnel (master entity)
  const personnel = await fetchPersonnelCore(personnelId)
  if (!personnel) {
    return {
      personnel: null, careerHistory: [], educationHistory: [],
      familyMembers: [], partyMember: null, rewards: [], disciplines: [],
      insurance: null, allowances: [], scientificProfile: null,
      researchProjects: [], facultyProfile: null, warnings,
      _bridge: { personnelId, userId: null },
    }
  }

  // Step 2: Bridge Personnel → User (via account relation)
  const userRecord = await db.personnel.findUnique({
    where: { id: personnelId },
    select: { account: { select: { id: true } } },
  })
  const userId = userRecord?.account?.id ?? null

  if (!userId) {
    warnings.push({
      source: 'bridge',
      message: 'Personnel chưa được liên kết với tài khoản User. Dữ liệu từ M03/M05/M07/M09 không khả dụng.',
    })
  }

  // Step 3: Aggregate tất cả nguồn song song với Promise.allSettled
  const [
    careerResult,
    educationResult,
    familyResult,
    partyResult,
    rewardsResult,
    disciplinesResult,
    insuranceResult,
    allowancesResult,
    scientificResult,
    researchResult,
    facultyResult,
  ] = await Promise.allSettled([
    fetchCareerHistory(userId, personnelId),
    fetchEducationHistory(userId, personnelId),
    fetchFamilyMembers(userId, personnelId),
    userId ? fetchPartyMember(userId) : Promise.resolve(null),
    userId ? fetchRewards(userId) : Promise.resolve([]),
    userId ? fetchDisciplines(userId) : Promise.resolve([]),
    userId ? fetchInsurance(userId) : Promise.resolve(null),
    userId ? fetchAllowances(userId) : Promise.resolve({ data: [], _stub: true }),
    userId ? fetchScientificProfile(userId, personnelId) : Promise.resolve(null),
    userId ? fetchResearchProjects(userId) : Promise.resolve([]),
    userId ? fetchFacultyProfile(userId) : Promise.resolve(null),
  ])

  function unwrap<T>(result: PromiseSettledResult<T>, source: string, fallback: T): T {
    if (result.status === 'rejected') {
      warnings.push({ source, message: `Lỗi tải dữ liệu: ${result.reason?.message ?? 'unknown'}` })
      return fallback
    }
    return result.value
  }

  const allowancesRaw = unwrap(allowancesResult, 'M05.allowances', { data: [], _stub: true as true })

  return {
    personnel,
    careerHistory: unwrap(careerResult, 'M02.careerHistory', []),
    educationHistory: unwrap(educationResult, 'M02.educationHistory', []),
    familyMembers: unwrap(familyResult, 'M02.familyMembers', []),
    partyMember: unwrap(partyResult, 'M03.partyMember', null),
    rewards: unwrap(rewardsResult, 'M05.rewards', []),
    disciplines: unwrap(disciplinesResult, 'M05.disciplines', []),
    insurance: unwrap(insuranceResult, 'M05.insurance', null),
    allowances: allowancesRaw.data,
    scientificProfile: unwrap(scientificResult, 'M02.scientificProfile', null),
    researchProjects: unwrap(researchResult, 'M09.researchProjects', []),
    facultyProfile: unwrap(facultyResult, 'M07.facultyProfile', null),
    warnings,
    _bridge: { personnelId, userId },
  }
}
