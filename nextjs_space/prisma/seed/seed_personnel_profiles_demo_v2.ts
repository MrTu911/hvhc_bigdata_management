import { PrismaClient, UserStatus } from '@prisma/client';
import 'dotenv/config';

const prisma = new PrismaClient();

type DemoProfileSeed = {
  email: string;
  fullName: string;
  gender: 'Nam' | 'Nữ';
  dateOfBirth: Date;
  birthPlace: string;
  placeOfOrigin: string;
  ethnicity: string;
  religion: string;
  citizenId: string;
  phone: string;
  permanentAddress: string;
  temporaryAddress: string;
  address: string;
  enlistmentDate: Date;
  joinDate: Date;
  partyJoinDate?: Date | null;
  rank: string;
  militaryId: string;
  currentPosition: string;
  unitCode: string;
  notes?: string | null;
  isOfficer: boolean;
  academicDegree?: string | null;
  academicRank?: string | null;
  specialization?: string | null;
};

const PROVINCES = [
  'Hà Nội',
  'Hải Phòng',
  'Quảng Ninh',
  'Nam Định',
  'Thái Bình',
  'Nghệ An',
  'Thanh Hóa',
  'Hà Tĩnh',
  'Đà Nẵng',
  'Quảng Trị',
  'Huế',
  'Khánh Hòa',
  'Đắk Lắk',
  'TP. Hồ Chí Minh',
  'Cần Thơ',
  'An Giang',
];

const DISTRICTS = [
  'Ba Đình',
  'Đống Đa',
  'Hoàn Kiếm',
  'Hải Châu',
  'Ninh Kiều',
  'Lê Chân',
  'Cẩm Lệ',
  'Sơn Trà',
  'Tân Bình',
  'Bình Thạnh',
];

const ETHNICITIES = ['Kinh', 'Tày', 'Nùng', 'Thái', 'Mường'];
const RELIGIONS = ['Không', 'Phật giáo', 'Công giáo'];
const OFFICER_RANKS = ['Thiếu tá', 'Trung tá', 'Thượng tá', 'Đại tá'];
const SOLDIER_RANKS = ['Thiếu úy', 'Trung úy', 'Thượng úy', 'Đại úy'];
const DEGREES = ['Cử nhân', 'Kỹ sư', 'Thạc sĩ', 'Tiến sĩ'];
const ACADEMIC_RANKS = [null, null, 'Phó Giáo sư', 'Giáo sư'];
const SPECIALIZATIONS = [
  'Hệ thống thông tin',
  'Mạng máy tính',
  'An ninh mạng',
  'Khoa học dữ liệu',
  'Trí tuệ nhân tạo',
  'Hậu cần quân sự',
  'Tài chính quân sự',
];

function pad(n: number, width: number) {
  return String(n).padStart(width, '0');
}

function pick<T>(arr: T[], seed: number): T {
  return arr[seed % arr.length];
}

function seededDate(yearFrom: number, yearTo: number, seed: number) {
  const year = yearFrom + (seed % (yearTo - yearFrom + 1));
  const month = seed % 12;
  const day = (seed % 27) + 1;
  return new Date(year, month, day);
}

function makeCitizenId(seed: number) {
  return `${100000000000 + seed}`.slice(0, 12);
}

function makePhone(seed: number) {
  return `09${String(10000000 + seed).slice(0, 8)}`;
}

function makeAddress(seed: number) {
  return `${(seed % 120) + 1} đường ${pick(
    ['Trần Hưng Đạo', 'Lê Lợi', 'Nguyễn Trãi', 'Quang Trung', 'Phan Đình Phùng'],
    seed
  )}, ${pick(DISTRICTS, seed + 1)}, ${pick(PROVINCES, seed + 2)}`;
}

function buildProfiles() {
  const base: DemoProfileSeed[] = [
    {
      email: 'giamdoc@demo.hvhc.edu.vn',
      fullName: 'Thiếu tướng Nguyễn Văn Hòa',
      gender: 'Nam',
      dateOfBirth: new Date(1972, 2, 15),
      birthPlace: 'Nam Định',
      placeOfOrigin: 'Nam Định',
      ethnicity: 'Kinh',
      religion: 'Không',
      citizenId: '036072000001',
      phone: '0912000001',
      permanentAddress: '12 đường Trần Hưng Đạo, Ba Đình, Hà Nội',
      temporaryAddress: 'Khu nhà công vụ Học viện Hậu cần, Hà Nội',
      address: '12 đường Trần Hưng Đạo, Ba Đình, Hà Nội',
      enlistmentDate: new Date(1990, 8, 1),
      joinDate: new Date(1991, 2, 1),
      partyJoinDate: new Date(1994, 4, 19),
      rank: 'Thiếu tướng',
      militaryId: 'SQ000001',
      currentPosition: 'Giám đốc Học viện',
      unitCode: 'HVHC',
      notes: 'Cán bộ chỉ huy cấp học viện.',
      isOfficer: true,
      academicDegree: 'Tiến sĩ',
      academicRank: 'Phó Giáo sư',
      specialization: 'Hệ thống thông tin',
    },
    {
      email: 'pho_giamdoc@demo.hvhc.edu.vn',
      fullName: 'Đại tá Trần Quốc Minh',
      gender: 'Nam',
      dateOfBirth: new Date(1976, 7, 8),
      birthPlace: 'Hà Nội',
      placeOfOrigin: 'Hà Nội',
      ethnicity: 'Kinh',
      religion: 'Không',
      citizenId: '036076000002',
      phone: '0912000002',
      permanentAddress: '25 đường Lê Lợi, Đống Đa, Hà Nội',
      temporaryAddress: 'Khu nhà công vụ Học viện Hậu cần, Hà Nội',
      address: '25 đường Lê Lợi, Đống Đa, Hà Nội',
      enlistmentDate: new Date(1994, 8, 1),
      joinDate: new Date(1995, 1, 1),
      partyJoinDate: new Date(1998, 5, 10),
      rank: 'Đại tá',
      militaryId: 'SQ000002',
      currentPosition: 'Phó Giám đốc Học viện',
      unitCode: 'HVHC',
      notes: 'Phụ trách công tác đào tạo và chuyển đổi số.',
      isOfficer: true,
      academicDegree: 'Thạc sĩ',
      academicRank: null,
      specialization: 'Khoa học dữ liệu',
    },
    {
      email: 'truongkhoa_cntt@demo.hvhc.edu.vn',
      fullName: 'Đại tá Phạm Đức Long',
      gender: 'Nam',
      dateOfBirth: new Date(1978, 10, 21),
      birthPlace: 'Hải Phòng',
      placeOfOrigin: 'Hải Phòng',
      ethnicity: 'Kinh',
      religion: 'Không',
      citizenId: '031078000003',
      phone: '0912000003',
      permanentAddress: '18 đường Nguyễn Trãi, Lê Chân, Hải Phòng',
      temporaryAddress: 'Nhà ở cán bộ KCNTT, Học viện Hậu cần',
      address: '18 đường Nguyễn Trãi, Lê Chân, Hải Phòng',
      enlistmentDate: new Date(1996, 8, 1),
      joinDate: new Date(1997, 3, 1),
      partyJoinDate: new Date(2000, 1, 3),
      rank: 'Đại tá',
      militaryId: 'SQ000003',
      currentPosition: 'Trưởng khoa CNTT',
      unitCode: 'KCNTT',
      notes: 'Phụ trách khoa CNTT.',
      isOfficer: true,
      academicDegree: 'Tiến sĩ',
      academicRank: null,
      specialization: 'An ninh mạng',
    },
  ];

  for (let i = 1; i <= 60; i++) {
    const officer = i <= 20;
    const seed = i * 17;
    const unitCode = pick(
      ['KCNTT', 'KHCL', 'KTC', 'KTXD', 'PHONG_HAU_CAN', 'PHONG_CHINH_TRI'],
      seed
    );

    base.push({
      email: `quannhan${pad(i, 2)}@demo.hvhc.edu.vn`,
      fullName: officer ? `Sĩ quan demo ${pad(i, 2)}` : `Quân nhân demo ${pad(i, 2)}`,
      gender: i % 8 === 0 ? 'Nữ' : 'Nam',
      dateOfBirth: officer ? seededDate(1980, 1995, seed) : seededDate(1990, 2002, seed),
      birthPlace: pick(PROVINCES, seed + 1),
      placeOfOrigin: pick(PROVINCES, seed + 2),
      ethnicity: pick(ETHNICITIES, seed + 3),
      religion: pick(RELIGIONS, seed + 4),
      citizenId: makeCitizenId(300000 + seed),
      phone: makePhone(500000 + seed),
      permanentAddress: makeAddress(seed),
      temporaryAddress: `Khu nhà ở đơn vị ${unitCode}`,
      address: makeAddress(seed + 10),
      enlistmentDate: officer ? seededDate(2000, 2018, seed + 5) : seededDate(2010, 2022, seed + 6),
      joinDate: officer ? seededDate(2001, 2019, seed + 7) : seededDate(2011, 2023, seed + 8),
      partyJoinDate: officer ? seededDate(2005, 2020, seed + 9) : null,
      rank: officer ? pick(OFFICER_RANKS, seed + 10) : pick(SOLDIER_RANKS, seed + 11),
      militaryId: officer ? `SQ${pad(1000 + i, 6)}` : `QN${pad(1000 + i, 6)}`,
      currentPosition: officer
        ? `Cán bộ ${unitCode} ${pad(i, 2)}`
        : `Quân nhân ${unitCode} ${pad(i, 2)}`,
      unitCode,
      notes: officer
        ? 'Hồ sơ demo sĩ quan phục vụ hiển thị admin.'
        : 'Hồ sơ demo quân nhân phục vụ hiển thị admin.',
      isOfficer: officer,
      academicDegree: officer ? pick(DEGREES, seed + 12) : null,
      academicRank: officer ? pick(ACADEMIC_RANKS, seed + 13) : null,
      specialization: officer ? pick(SPECIALIZATIONS, seed + 14) : null,
    });
  }

  return base;
}

type UnitInfo = {
  id: string;
  code: string;
  name: string;
  parentId: string | null;
  path: string | null;
};

async function getUnitMap() {
  const units = await prisma.unit.findMany({
    select: {
      id: true,
      code: true,
      name: true,
      parentId: true,
      path: true,
    },
  });

  return new Map(units.map((u: UnitInfo) => [u.code, u]));
}

async function updateUserCoreProfile(profile: DemoProfileSeed, unitMap: Map<string, UnitInfo>) {
  const user = await prisma.user.findUnique({
    where: { email: profile.email },
  });

  if (!user) {
    console.log(`⏭️ Skip ${profile.email} - user chưa tồn tại`);
    return null;
  }

  const unit = unitMap.get(profile.unitCode) || unitMap.get('HVHC') || null;

  const updated = await prisma.user.update({
    where: { email: profile.email },
    data: {
      name: profile.fullName,
      militaryId: profile.militaryId,
      rank: profile.rank,
      position: profile.currentPosition,
      department: profile.unitCode,
      unit: profile.unitCode,
      unitId: unit?.id,
      status: 'ACTIVE' as UserStatus,
      phone: profile.phone,
      dateOfBirth: profile.dateOfBirth,
      gender: profile.gender,
      address: profile.address,
      joinDate: profile.joinDate,
      placeOfOrigin: profile.placeOfOrigin,
      birthPlace: profile.birthPlace,
      citizenId: profile.citizenId,
      enlistmentDate: profile.enlistmentDate,
      ethnicity: profile.ethnicity,
      permanentAddress: profile.permanentAddress,
      religion: profile.religion,
      temporaryAddress: profile.temporaryAddress,
      partyJoinDate: profile.partyJoinDate || null,
      academicTitle: profile.academicRank || null,
      technicalPosition: profile.currentPosition,
      specialization: profile.specialization || null,
    },
  });

  return { user: updated, unit };
}

async function ensurePartyAndInsurance(userId: string, profile: DemoProfileSeed) {
  await prisma.insuranceInfo.upsert({
    where: { userId },
    update: {
      notes: profile.notes || undefined,
    },
    create: {
      userId,
      insuranceNumber: `01${profile.militaryId.replace(/\D/g, '').slice(-8).padStart(8, '0')}`,
      insuranceStartDate: profile.joinDate,
      insuranceEndDate: null,
      healthInsuranceNumber: `QN${profile.militaryId.replace(/\D/g, '').padStart(10, '0').slice(-10)}`,
      healthInsuranceStartDate: new Date(new Date().getFullYear(), 0, 1),
      healthInsuranceEndDate: new Date(new Date().getFullYear() + 1, 11, 31),
      healthInsuranceHospital: 'Bệnh viện Quân y 108',
      beneficiaryName: profile.gender === 'Nam' ? 'Nguyễn Thị A' : 'Trần Văn B',
      beneficiaryRelation: profile.gender === 'Nam' ? 'Vợ' : 'Chồng',
      beneficiaryPhone: profile.phone,
      notes: profile.notes || undefined,
    } as any,
  });

  if (profile.partyJoinDate) {
    await prisma.partyMember.upsert({
      where: { userId },
      update: {
        partyCell: `Chi bộ ${profile.unitCode}`,
        status: 'ACTIVE' as any,
      },
      create: {
        userId,
        partyCardNumber: `DV${profile.partyJoinDate.getFullYear()}${profile.militaryId.slice(-4)}`,
        joinDate: profile.partyJoinDate,
        officialDate: new Date(
          profile.partyJoinDate.getFullYear() + 1,
          profile.partyJoinDate.getMonth(),
          profile.partyJoinDate.getDate()
        ),
        partyCell: `Chi bộ ${profile.unitCode}`,
        partyCommittee: 'Đảng ủy Học viện Hậu cần',
        recommender1: 'Nguyễn Văn A',
        recommender2: 'Trần Văn B',
        status: 'ACTIVE' as any,
      } as any,
    });
  }
}

async function ensureFacultyProfile(userId: string, unitId: string | null, profile: DemoProfileSeed) {
  if (!profile.isOfficer) return;

  await prisma.facultyProfile.upsert({
    where: { userId },
    update: {
      academicRank: profile.academicRank || undefined,
      academicDegree: profile.academicDegree || undefined,
      specialization: profile.specialization || undefined,
      researchInterests: `Nghiên cứu ứng dụng ${profile.specialization || 'quản lý quân sự'} trong môi trường học viện.`,
      teachingExperience: 5,
      industryExperience: 3,
      biography: `${profile.fullName} hiện công tác tại đơn vị ${profile.unitCode}, cấp bậc ${profile.rank}.`,
      isActive: true,
      isPublic: true,
      unitId: unitId || undefined,
    },
    create: {
      userId,
      academicRank: profile.academicRank || undefined,
      academicDegree: profile.academicDegree || undefined,
      specialization: profile.specialization || undefined,
      teachingSubjects: [
        'Quản trị hệ thống',
        'Phân tích dữ liệu',
        'Quản lý đào tạo',
      ],
      researchInterests: `Nghiên cứu ứng dụng ${profile.specialization || 'quản lý quân sự'} trong môi trường học viện.`,
      researchProjects: 2,
      publications: 4,
      citations: 12,
      teachingExperience: 5,
      industryExperience: 3,
      biography: `${profile.fullName} hiện công tác tại đơn vị ${profile.unitCode}, cấp bậc ${profile.rank}.`,
      isActive: true,
      isPublic: true,
      unitId: unitId || undefined,
    } as any,
  });
}

async function main() {
  console.log('🚀 Seed hồ sơ quân nhân/sĩ quan chi tiết theo schema thật...');
  const profiles = buildProfiles();
  const unitMap = await getUnitMap();

  let updatedCount = 0;
  let skippedCount = 0;
  let facultyCount = 0;

  for (const profile of profiles) {
    const result = await updateUserCoreProfile(profile, unitMap);

    if (!result?.user) {
      skippedCount++;
      continue;
    }

    await ensurePartyAndInsurance(result.user.id, profile);
    await ensureFacultyProfile(result.user.id, result.unit?.id || null, profile);

    if (profile.isOfficer) facultyCount++;
    updatedCount++;

    console.log(`✅ ${profile.email} | ${profile.rank} | ${profile.unitCode}`);
  }

  console.log('\n================ KẾT QUẢ ================');
  console.log(`Updated profiles : ${updatedCount}`);
  console.log(`Skipped users    : ${skippedCount}`);
  console.log(`Faculty profiles : ${facultyCount}`);
  console.log('Các field đã seed đúng schema User:');
  console.log('- phone, dateOfBirth, gender, address');
  console.log('- joinDate, placeOfOrigin, birthPlace, citizenId');
  console.log('- enlistmentDate, ethnicity, permanentAddress, religion, temporaryAddress');
  console.log('- partyJoinDate, academicTitle, technicalPosition, specialization');
  console.log('=========================================\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });