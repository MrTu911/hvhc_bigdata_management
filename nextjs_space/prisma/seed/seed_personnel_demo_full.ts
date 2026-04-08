import { PrismaClient, UserStatus, FunctionScope } from '@prisma/client';
import bcrypt from 'bcryptjs';
import 'dotenv/config';

const prisma = new PrismaClient();

const DEFAULT_PASSWORD = process.env.DEMO_PERSONNEL_PASSWORD || 'Demo@2025';

type DemoPersonnel = {
  email: string;
  name: string;
  role: string;
  militaryId: string;
  rank: string;
  positionName: string;
  positionCode: string;
  departmentCode: string;
  unitCode: string;
  isOfficer: boolean;
  isPrimary?: boolean;
};

const PERSONNEL: DemoPersonnel[] = [
  {
    email: 'giamdoc@demo.hvhc.edu.vn',
    name: 'Thiếu tướng Nguyễn Văn Hòa',
    role: 'CHI_HUY_HOC_VIEN',
    militaryId: 'SQ000001',
    rank: 'Thiếu tướng',
    positionName: 'Giám đốc Học viện',
    positionCode: 'PHO_GIAM_DOC',
    departmentCode: 'HVHC',
    unitCode: 'HVHC',
    isOfficer: true,
    isPrimary: true,
  },
  {
    email: 'pho_giamdoc@demo.hvhc.edu.vn',
    name: 'Đại tá Trần Quốc Minh',
    role: 'CHI_HUY_HOC_VIEN',
    militaryId: 'SQ000002',
    rank: 'Đại tá',
    positionName: 'Phó Giám đốc Học viện',
    positionCode: 'PHO_GIAM_DOC',
    departmentCode: 'HVHC',
    unitCode: 'HVHC',
    isOfficer: true,
    isPrimary: true,
  },
  {
    email: 'truongkhoa_cntt@demo.hvhc.edu.vn',
    name: 'Đại tá Phạm Đức Long',
    role: 'CHI_HUY_KHOA_PHONG',
    militaryId: 'SQ000003',
    rank: 'Đại tá',
    positionName: 'Trưởng khoa CNTT',
    positionCode: 'TRUONG_KHOA',
    departmentCode: 'KCNTT',
    unitCode: 'KCNTT',
    isOfficer: true,
    isPrimary: true,
  },
  {
    email: 'phokhoa_cntt@demo.hvhc.edu.vn',
    name: 'Thượng tá Lê Quang Huy',
    role: 'CHI_HUY_KHOA_PHONG',
    militaryId: 'SQ000004',
    rank: 'Thượng tá',
    positionName: 'Phó Trưởng khoa CNTT',
    positionCode: 'TRUONG_KHOA',
    departmentCode: 'KCNTT',
    unitCode: 'KCNTT',
    isOfficer: true,
    isPrimary: true,
  },
  {
    email: 'chunhiem_httt@demo.hvhc.edu.vn',
    name: 'Thượng tá Đỗ Văn Nam',
    role: 'CHU_NHIEM_BO_MON',
    militaryId: 'SQ000005',
    rank: 'Thượng tá',
    positionName: 'Chủ nhiệm Bộ môn Hệ thống thông tin',
    positionCode: 'CHU_NHIEM_BO_MON',
    departmentCode: 'KCNTT',
    unitCode: 'KCNTT',
    isOfficer: true,
    isPrimary: true,
  },
  {
    email: 'giangvien1@demo.hvhc.edu.vn',
    name: 'Trung tá Nguyễn Văn Bình',
    role: 'GIANG_VIEN',
    militaryId: 'SQ000006',
    rank: 'Trung tá',
    positionName: 'Giảng viên chính',
    positionCode: 'GIANG_VIEN',
    departmentCode: 'KCNTT',
    unitCode: 'KCNTT',
    isOfficer: true,
    isPrimary: true,
  },
  {
    email: 'giangvien2@demo.hvhc.edu.vn',
    name: 'Thiếu tá Trần Minh Đức',
    role: 'GIANG_VIEN',
    militaryId: 'SQ000007',
    rank: 'Thiếu tá',
    positionName: 'Giảng viên',
    positionCode: 'GIANG_VIEN',
    departmentCode: 'KCNTT',
    unitCode: 'KCNTT',
    isOfficer: true,
    isPrimary: true,
  },
  {
    email: 'nghiencuu1@demo.hvhc.edu.vn',
    name: 'Thiếu tá Bùi Anh Tuấn',
    role: 'NGHIEN_CUU_VIEN',
    militaryId: 'SQ000008',
    rank: 'Thiếu tá',
    positionName: 'Nghiên cứu viên',
    positionCode: 'NGHIEN_CUU_VIEN',
    departmentCode: 'HVHC',
    unitCode: 'HVHC',
    isOfficer: true,
    isPrimary: true,
  },
  {
    email: 'chinhtri1@demo.hvhc.edu.vn',
    name: 'Trung tá Hoàng Văn Sơn',
    role: 'CHI_HUY_KHOA_PHONG',
    militaryId: 'SQ000009',
    rank: 'Trung tá',
    positionName: 'Trưởng phòng Chính trị',
    positionCode: 'TRUONG_KHOA',
    departmentCode: 'PHONG_CHINH_TRI',
    unitCode: 'PHONG_CHINH_TRI',
    isOfficer: true,
    isPrimary: true,
  },
  {
    email: 'haucan1@demo.hvhc.edu.vn',
    name: 'Thiếu tá Nguyễn Hữu Thành',
    role: 'CHI_HUY_KHOA_PHONG',
    militaryId: 'SQ000010',
    rank: 'Thiếu tá',
    positionName: 'Phó Trưởng phòng Hậu cần',
    positionCode: 'TRUONG_KHOA',
    departmentCode: 'PHONG_HAU_CAN',
    unitCode: 'PHONG_HAU_CAN',
    isOfficer: true,
    isPrimary: true,
  },
  ...Array.from({ length: 60 }).map((_, i) => {
    const n = i + 1;
    const units = ['KCNTT', 'KHCL', 'KTC', 'KTXD', 'PHONG_HAU_CAN', 'PHONG_CHINH_TRI'];
    const unitCode = units[i % units.length];
    const officer = i < 20;

    return {
      email: `quannhan${String(n).padStart(2, '0')}@demo.hvhc.edu.vn`,
      name: officer
        ? `Sĩ quan demo ${String(n).padStart(2, '0')}`
        : `Quân nhân demo ${String(n).padStart(2, '0')}`,
      role: officer ? 'GIANG_VIEN' : 'HOC_VIEN_SINH_VIEN',
      militaryId: officer
        ? `SQ${String(1000 + n).padStart(6, '0')}`
        : `QN${String(1000 + n).padStart(6, '0')}`,
      rank: officer
        ? ['Thiếu tá', 'Trung tá', 'Thượng úy', 'Đại úy'][i % 4]
        : ['Thiếu úy', 'Trung úy', 'Thượng úy', 'Đại úy'][i % 4],
      positionName: officer
        ? `Cán bộ ${unitCode} ${String(n).padStart(2, '0')}`
        : `Quân nhân ${unitCode} ${String(n).padStart(2, '0')}`,
      positionCode: officer ? 'GIANG_VIEN' : 'HOC_VIEN_QUAN_SU',
      departmentCode: unitCode,
      unitCode,
      isOfficer: officer,
      isPrimary: true,
    } satisfies DemoPersonnel;
  }),
];

const ROLE_TO_POSITION_CODE: Record<string, string> = {
  ADMIN: 'SYSTEM_ADMIN',
  QUAN_TRI_HE_THONG: 'SYSTEM_ADMIN',
  CHI_HUY_HOC_VIEN: 'PHO_GIAM_DOC',
  CHI_HUY_KHOA_PHONG: 'TRUONG_KHOA',
  CHU_NHIEM_BO_MON: 'CHU_NHIEM_BO_MON',
  GIANG_VIEN: 'GIANG_VIEN',
  NGHIEN_CUU_VIEN: 'NGHIEN_CUU_VIEN',
  HOC_VIEN: 'HOC_VIEN_QUAN_SU',
  HOC_VIEN_SINH_VIEN: 'HOC_VIEN_QUAN_SU',
  KY_THUAT_VIEN: 'KY_THUAT_VIEN',
};

async function findFallbackUnit() {
  const preferredCodes = ['HVHC', 'ROOT'];
  for (const code of preferredCodes) {
    const found = await prisma.unit.findFirst({ where: { code } });
    if (found) return found;
  }
  return prisma.unit.findFirst({ orderBy: { createdAt: 'asc' } });
}

async function getUnitByCode(code: string) {
  const unit = await prisma.unit.findFirst({
    where: { code },
  });
  if (unit) return unit;
  return findFallbackUnit();
}

async function ensurePosition(code: string, name: string) {
  let position = await prisma.position.findFirst({
    where: { code },
  });

  if (!position) {
    position = await prisma.position.create({
      data: {
        code,
        name,
        description: `Auto-created demo position: ${name}`,
        isActive: true,
      } as any,
    });
    console.log(`✅ Created position: ${code}`);
  }

  return position;
}

async function ensurePositionHasBasicFunctions(positionId: string, positionCode: string) {
  const allFunctions = await prisma.function.findMany({
    where: { isActive: true },
    orderBy: { code: 'asc' },
  });

  if (allFunctions.length === 0) {
    console.warn('⚠️ Không có functions active trong DB. Bỏ qua gán PositionFunction.');
    return;
  }

  let selectedFunctions = allFunctions;

  if (positionCode !== 'SYSTEM_ADMIN') {
    selectedFunctions = allFunctions.filter((fn) => {
      const code = fn.code.toUpperCase();
      if (positionCode === 'GIANG_VIEN') {
        return (
          code.includes('VIEW_') ||
          code.includes('TRAINING') ||
          code.includes('COURSE') ||
          code.includes('GRADE') ||
          code.includes('FACULTY') ||
          code.includes('EDUCATION') ||
          code.includes('QUESTION') ||
          code.includes('LEARNING_MATERIAL')
        );
      }

      if (positionCode === 'HOC_VIEN_QUAN_SU') {
        return (
          code.includes('VIEW_') ||
          code.includes('STUDENT') ||
          code.includes('ENROLL') ||
          code.includes('REGISTER') ||
          code.includes('COURSE') ||
          code.includes('SCHEDULE') ||
          code.includes('GRADE')
        );
      }

      if (
        positionCode === 'PHO_GIAM_DOC' ||
        positionCode === 'TRUONG_KHOA' ||
        positionCode === 'CHU_NHIEM_BO_MON' ||
        positionCode === 'NGHIEN_CUU_VIEN' ||
        positionCode === 'KY_THUAT_VIEN'
      ) {
        return code.includes('VIEW_') || code.includes('MANAGE_') || code.includes('EXPORT_');
      }

      return code.includes('VIEW_');
    });
  }

  let created = 0;
  let updated = 0;

  for (const fn of selectedFunctions) {
    const existing = await prisma.positionFunction.findFirst({
      where: {
        positionId,
        functionId: fn.id,
      },
    });

    if (!existing) {
      await prisma.positionFunction.create({
        data: {
          positionId,
          functionId: fn.id,
          scope: 'ACADEMY' as FunctionScope,
          isActive: true,
        } as any,
      });
      created++;
    } else if (!existing.isActive || existing.scope !== 'ACADEMY') {
      await prisma.positionFunction.update({
        where: { id: existing.id },
        data: {
          isActive: true,
          scope: 'ACADEMY' as FunctionScope,
        } as any,
      });
      updated++;
    }
  }

  console.log(
    `✅ Position ${positionCode}: grants created=${created}, updated=${updated}, total=${selectedFunctions.length}`,
  );
}

async function ensureUser(person: DemoPersonnel, passwordHash: string, unitId: string | null) {
  const existing = await prisma.user.findUnique({
    where: { email: person.email },
  });

  if (!existing) {
    const created = await prisma.user.create({
      data: {
        email: person.email,
        name: person.name,
        password: passwordHash,
        role: person.role as any,
        militaryId: person.militaryId,
        rank: person.rank,
        position: person.positionName,
        department: person.departmentCode,
        status: 'ACTIVE' as UserStatus,
        unitId: unitId || undefined,
      } as any,
    });

    console.log(`✅ Created user: ${person.email}`);
    return created;
  }

  const updated = await prisma.user.update({
    where: { email: person.email },
    data: {
      name: person.name,
      role: person.role as any,
      militaryId: person.militaryId,
      rank: person.rank,
      position: person.positionName,
      department: person.departmentCode,
      status: 'ACTIVE' as UserStatus,
      unitId: unitId || undefined,
    } as any,
  });

  console.log(`♻️ Updated user: ${person.email}`);
  return updated;
}

async function ensureUserPosition(userId: string, positionId: string, unitId: string | null, isPrimary = true) {
  const existing = await prisma.userPosition.findFirst({
    where: {
      userId,
      positionId,
      ...(unitId ? { unitId } : {}),
    },
  });

  if (!existing) {
    await prisma.userPosition.create({
      data: {
        userId,
        positionId,
        unitId: unitId || undefined,
        isPrimary,
        isActive: true,
        startDate: new Date(),
      } as any,
    });
    return 'created';
  }

  await prisma.userPosition.update({
    where: { id: existing.id },
    data: {
      unitId: unitId || undefined,
      isPrimary,
      isActive: true,
      endDate: null,
    } as any,
  });

  return 'updated';
}

async function ensurePartyMember(userId: string, departmentCode: string, militaryId?: string | null) {
  await prisma.partyMember.upsert({
    where: { userId },
    update: {},
    create: {
      userId,
      partyCardNumber: `DV${new Date().getFullYear()}${(militaryId || '0000').slice(-4)}`,
      joinDate: new Date(2012, 0, 1),
      officialDate: new Date(2013, 0, 1),
      partyCell: `Chi bộ ${departmentCode}`,
      partyCommittee: 'Đảng ủy Học viện Hậu cần',
      recommender1: 'Nguyễn Văn A',
      recommender2: 'Trần Văn B',
      status: 'ACTIVE' as any,
    },
  });
}

async function ensureInsuranceInfo(userId: string) {
  const now = new Date();
  await prisma.insuranceInfo.upsert({
    where: { userId },
    update: {},
    create: {
      userId,
      insuranceNumber: `01${String(Math.floor(Math.random() * 1e8)).padStart(8, '0')}`,
      insuranceStartDate: new Date(2018, 0, 1),
      insuranceEndDate: null,
      healthInsuranceNumber: `QN${String(Math.floor(Math.random() * 1e10)).padStart(10, '0')}`,
      healthInsuranceStartDate: new Date(now.getFullYear(), 0, 1),
      healthInsuranceEndDate: new Date(now.getFullYear() + 1, 11, 31),
      healthInsuranceHospital: 'Bệnh viện Quân y 108',
      beneficiaryName: 'Nguyễn Thị A',
      beneficiaryRelation: 'Vợ',
      beneficiaryPhone: '0912345678',
    },
  });
}

async function printSummary() {
  const emails = PERSONNEL.map((p) => p.email);

  const totalUsers = await prisma.user.count({
    where: { email: { in: emails } },
  });

  const totalParty = await prisma.partyMember.count({
    where: {
      user: {
        email: { in: emails },
      },
    },
  });

  const totalInsurance = await prisma.insuranceInfo.count({
    where: {
      user: {
        email: { in: emails },
      },
    },
  });

  console.log('\n================ SUMMARY ================');
  console.log(`Demo personnel users     : ${totalUsers}`);
  console.log(`Demo party members       : ${totalParty}`);
  console.log(`Demo insurance records   : ${totalInsurance}`);
  console.log(`Default password         : ${DEFAULT_PASSWORD}`);
  console.log(`Total demo accounts      : ${PERSONNEL.length}`);
  console.log('Sample accounts:');
  for (const p of PERSONNEL.slice(0, 15)) {
    console.log(`${p.email} | ${p.role} | ${p.positionCode} | ${p.unitCode}`);
  }
  console.log('=========================================\n');
}

async function main() {
  console.log('🚀 Seeding demo sĩ quan/quân nhân with Unit + Position + UserPosition...');

  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  let createdUsers = 0;
  let updatedUsers = 0;
  let createdUserPositions = 0;
  let updatedUserPositions = 0;

  for (const person of PERSONNEL) {
    const desiredPositionCode = person.positionCode || ROLE_TO_POSITION_CODE[person.role] || 'HOC_VIEN_QUAN_SU';
    const unit = await getUnitByCode(person.unitCode);
    const position = await ensurePosition(desiredPositionCode, person.positionName);

    await ensurePositionHasBasicFunctions(position.id, desiredPositionCode);

    const existingBefore = await prisma.user.findUnique({
      where: { email: person.email },
    });

    const user = await ensureUser(person, passwordHash, unit?.id || null);

    if (existingBefore) updatedUsers++;
    else createdUsers++;

    const upResult = await ensureUserPosition(user.id, position.id, unit?.id || null, person.isPrimary ?? true);
    if (upResult === 'created') createdUserPositions++;
    else updatedUserPositions++;

    if (person.isOfficer) {
      await ensurePartyMember(user.id, person.departmentCode, user.militaryId);
    }

    await ensureInsuranceInfo(user.id);
  }

  console.log(`✅ Users created: ${createdUsers}`);
  console.log(`✅ Users updated: ${updatedUsers}`);
  console.log(`✅ UserPositions created: ${createdUserPositions}`);
  console.log(`✅ UserPositions updated: ${updatedUserPositions}`);

  await printSummary();
  console.log('⚠️ Nếu menu quyền chưa đổi, hãy đăng xuất và đăng nhập lại.');
  console.log('✅ Hoàn tất seed demo sĩ quan/quân nhân.');
}

main()
  .catch((error) => {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });