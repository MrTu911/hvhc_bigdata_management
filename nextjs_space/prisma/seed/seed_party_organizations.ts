/**
 * Seed Script: Party Organizations by Unit Hierarchy
 *
 * Business mapping (theo yêu cầu):
 * - Cấp Học viện: Đảng ủy Học viện
 * - Cấp Khoa/Phòng: Đảng ủy
 * - Viện nghiên cứu, Tạp chí NCKHQS, Ban Khảo thí & BĐCL, Ban Tài chính:
 *   là Chi bộ trực thuộc Đảng ủy Học viện
 * - Cấp Bộ môn/Ban: Chi bộ
 *
 * Idempotent: upsert theo mã tổ chức, có thể chạy lại nhiều lần.
 */

import { PartyOrganizationType, PrismaClient, UserRole, UserStatus } from '@prisma/client';
import 'dotenv/config';

const prisma = new PrismaClient();

const ROOT_CODE = 'DANG_UY_HVHC';

type UnitInfo = {
  id: string;
  code: string;
  name: string;
  type: string;
  level: number;
  parentId: string | null;
};

type OrgSeed = {
  code: string;
  name: string;
  shortName: string;
  organizationType: PartyOrganizationType;
  level: number;
  unitId: string | null;
  parentCode: string | null;
  description: string;
  establishedDate: Date;
};

function normalizeCode(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/Đ/g, 'D')
    .replace(/đ/g, 'd')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function orgCodeFromUnit(unitCode: string, type: PartyOrganizationType) {
  const prefix = type === 'DANG_UY' ? 'DANG_UY_' : 'CHI_BO_';
  return `${prefix}${normalizeCode(unitCode)}`;
}

function isSpecialDirectBranch(unit: UnitInfo): boolean {
  const haystack = `${unit.code} ${unit.name}`.toLowerCase();
  const patterns = [
    /vien|viện/, // Viện
    /tap chi|tạp chí/, // Tạp chí
    /khao thi|khảo thí/, // Khảo thí
    /bao dam chat luong|bảo đảm chất lượng|bdcl/, // BĐCL
    /tai chinh|tài chính/, // Ban tài chính
    /ke hoach\s*-\s*tai chinh|kế hoạch\s*-\s*tài chính/, // Phòng KH-TC
    /^b5$/,
  ];
  return patterns.some((re) => re.test(haystack));
}

function inferOrgType(unit: UnitInfo): PartyOrganizationType | null {
  if (unit.code === 'HVHC') return 'DANG_UY';

  // Nhóm đặc biệt: chi bộ trực thuộc Đảng ủy Học viện
  if (isSpecialDirectBranch(unit)) return 'CHI_BO';

  // Cấp Khoa/Phòng: Đảng ủy
  if (unit.level === 2 && (unit.type === 'KHOA' || unit.type === 'PHONG')) return 'DANG_UY';

  // Cấp Bộ môn/Ban: Chi bộ
  if (unit.type === 'BOMON' || unit.type === 'BAN') return 'CHI_BO';

  // Các cấp dưới khác (tiểu đoàn, đại đội...) vẫn tổ chức theo chi bộ
  if (unit.level >= 3) return 'CHI_BO';

  return null;
}

async function ensureOrg(seed: OrgSeed) {
  const parent = seed.parentCode
    ? await prisma.partyOrganization.findUnique({ where: { code: seed.parentCode } })
    : null;

  return prisma.partyOrganization.upsert({
    where: { code: seed.code },
    update: {
      name: seed.name,
      shortName: seed.shortName,
      organizationType: seed.organizationType,
      level: seed.level,
      description: seed.description,
      isActive: true,
      establishedDate: seed.establishedDate,
      dissolvedDate: null,
      parent: parent?.id ? { connect: { id: parent.id } } : { disconnect: true },
      unit: seed.unitId ? { connect: { id: seed.unitId } } : { disconnect: true },
    },
    create: {
      code: seed.code,
      name: seed.name,
      shortName: seed.shortName,
      organizationType: seed.organizationType,
      level: seed.level,
      description: seed.description,
      isActive: true,
      establishedDate: seed.establishedDate,
      dissolvedDate: null,
      ...(parent?.id ? { parent: { connect: { id: parent.id } } } : {}),
      ...(seed.unitId ? { unit: { connect: { id: seed.unitId } } } : {}),
    },
  });
}

async function assignLeaders() {
  const orgs = await prisma.partyOrganization.findMany({
    where: { isActive: true },
    include: { unit: true },
    orderBy: [{ level: 'asc' }, { code: 'asc' }],
  });

  for (const org of orgs) {
    const isRoot = org.code === ROOT_CODE;
    const unitCode = org.unit?.code ?? null;

    const secretary = await prisma.user.findFirst({
      where: {
        status: UserStatus.ACTIVE,
        ...(isRoot
          ? {
              role: {
                in: [UserRole.CHI_HUY_HOC_VIEN, UserRole.QUAN_TRI_HE_THONG, UserRole.ADMIN],
              },
            }
          : {
              OR: [
                {
                  unit: unitCode ?? undefined,
                  role: {
                    in: [UserRole.CHI_HUY_KHOA_PHONG, UserRole.CHI_HUY_BO_MON, UserRole.CHU_NHIEM_BO_MON],
                  },
                },
                {
                  department: unitCode ?? undefined,
                  role: {
                    in: [UserRole.CHI_HUY_KHOA_PHONG, UserRole.CHI_HUY_BO_MON, UserRole.CHU_NHIEM_BO_MON],
                  },
                },
              ],
            }),
      },
      orderBy: { createdAt: 'asc' },
    });

    const deputy = await prisma.user.findFirst({
      where: {
        status: UserStatus.ACTIVE,
        ...(secretary?.id ? { id: { not: secretary.id } } : {}),
        ...(isRoot
          ? {
              role: {
                in: [UserRole.CHI_HUY_HOC_VIEN, UserRole.CHI_HUY_KHOA_PHONG, UserRole.GIANG_VIEN],
              },
            }
          : {
              OR: [
                {
                  unit: unitCode ?? undefined,
                  role: { in: [UserRole.GIANG_VIEN, UserRole.NGHIEN_CUU_VIEN, UserRole.CHI_HUY_BO_MON] },
                },
                {
                  department: unitCode ?? undefined,
                  role: { in: [UserRole.GIANG_VIEN, UserRole.NGHIEN_CUU_VIEN, UserRole.CHI_HUY_BO_MON] },
                },
              ],
            }),
      },
      orderBy: { createdAt: 'asc' },
    });

    await prisma.partyOrganization.update({
      where: { id: org.id },
      data: {
        secretaryUser: secretary?.id ? { connect: { id: secretary.id } } : { disconnect: true },
        deputySecretaryUser: deputy?.id ? { connect: { id: deputy.id } } : { disconnect: true },
      },
    });
  }
}

async function main() {
  console.log('🏛️ Seeding Party Organizations by unit hierarchy...');

  const units = await prisma.unit.findMany({
    where: { active: true },
    orderBy: [{ level: 'asc' }, { code: 'asc' }],
    select: { id: true, code: true, name: true, type: true, level: true, parentId: true },
  });

  if (!units.length) {
    throw new Error('Không có đơn vị (unit). Hãy chạy seed_units.ts trước.');
  }

  const hvhc = units.find((u) => u.code === 'HVHC');
  if (!hvhc) {
    throw new Error('Không tìm thấy unit HVHC.');
  }

  // Root: Đảng ủy Học viện
  await ensureOrg({
    code: ROOT_CODE,
    name: 'Đảng ủy Học viện Hậu cần',
    shortName: 'Đảng ủy HVHC',
    organizationType: 'DANG_UY',
    level: 1,
    unitId: hvhc.id,
    parentCode: null,
    description: 'Tổ chức Đảng cấp Học viện',
    establishedDate: new Date('1974-01-01'),
  });

  const unitById = new Map<string, UnitInfo>(units.map((u) => [u.id, u]));
  const orgCodeByUnitId = new Map<string, string>([[hvhc.id, ROOT_CODE]]);

  let createdOrUpdated = 1;

  for (const unit of units) {
    if (unit.code === 'HVHC') continue;

    const orgType = inferOrgType(unit);
    if (!orgType) continue;

    const code = orgCodeFromUnit(unit.code, orgType);
    const name = orgType === 'DANG_UY' ? `Đảng ủy ${unit.name}` : `Chi bộ ${unit.name}`;
    const shortName = orgType === 'DANG_UY' ? `Đảng ủy ${unit.code}` : `Chi bộ ${unit.code}`;

    // special direct branch -> parent trực tiếp root
    let parentCode: string | null = isSpecialDirectBranch(unit) ? ROOT_CODE : null;

    if (!parentCode) {
      const parentUnit = unit.parentId ? unitById.get(unit.parentId) : null;
      parentCode = parentUnit?.id ? orgCodeByUnitId.get(parentUnit.id) ?? ROOT_CODE : ROOT_CODE;
    }

    const orgLevel = Math.max(2, unit.level);

    await ensureOrg({
      code,
      name,
      shortName,
      organizationType: orgType,
      level: orgLevel,
      unitId: unit.id,
      parentCode,
      description:
        orgType === 'DANG_UY'
          ? `Đảng ủy cấp Khoa/Phòng cho đơn vị ${unit.name}`
          : `Chi bộ thuộc hệ thống tổ chức Đảng của đơn vị ${unit.name}`,
      establishedDate: new Date('2000-01-01'),
    });

    orgCodeByUnitId.set(unit.id, code);
    createdOrUpdated++;
  }

  await assignLeaders();

  const total = await prisma.partyOrganization.count({ where: { isActive: true } });
  console.log(`✅ Seed party organizations completed. Upserted: ${createdOrUpdated}, Active total: ${total}`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
