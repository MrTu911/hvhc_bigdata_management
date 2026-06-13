/**
 * Seed Script: Party Members
 *
 * Mục tiêu:
 * - Tạo/cập nhật PartyMember từ User
 * - Gán vào PartyOrganization phù hợp
 * - Đồng bộ cache về User.partyJoinDate / User.partyPosition
 * - Chạy lại nhiều lần không bị trùng
 */

import {
  PrismaClient,
  PartyPosition,
  UserRole,
  UserStatus,
} from '@prisma/client';
import 'dotenv/config';
import {
  assignPartyStage,
  bucketFromId,
  reasonForStatus,
} from './_helpers/party-status-distribution';

const prisma = new PrismaClient();

type CandidateUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  unit: string | null;
  department: string | null;
  unitId: string | null;
  partyJoinDate: Date | null;
  partyPosition: string | null;
  createdAt: Date;
};

function pick<T>(arr: readonly T[], seed: number): T {
  return arr[seed % arr.length];
}

function buildPartyCard(index: number): string {
  return `DV${String(100000 + index)}`;
}

function inferPartyPositionFromRole(role: UserRole, seed: number): PartyPosition {
  switch (role) {
    case 'CHI_HUY_HOC_VIEN':
      return seed % 2 === 0 ? 'BI_THU' : 'PHO_BI_THU';
    case 'CHI_HUY_KHOA_PHONG':
      return seed % 2 === 0 ? 'BI_THU_CHI_BO' : 'PHO_BI_THU_CHI_BO';
    case 'CHI_HUY_BO_MON':
    case 'CHU_NHIEM_BO_MON':
      return seed % 3 === 0 ? 'CAP_UY_VIEN' : 'PHO_BI_THU_CHI_BO';
    default:
      return 'DANG_VIEN';
  }
}

function partyPositionToUserString(position: PartyPosition): string {
  switch (position) {
    case 'BI_THU':
      return 'Bí thư';
    case 'PHO_BI_THU':
      return 'Phó Bí thư';
    case 'CAP_UY_VIEN':
      return 'Cấp ủy viên';
    case 'BI_THU_CHI_BO':
      return 'Bí thư Chi bộ';
    case 'PHO_BI_THU_CHI_BO':
      return 'Phó Bí thư Chi bộ';
    case 'TO_TRUONG_TO_DANG':
      return 'Tổ trưởng Tổ đảng';
    case 'TO_PHO_TO_DANG':
      return 'Tổ phó Tổ đảng';
    default:
      return 'Đảng viên';
  }
}

function shouldBecomePartyMember(user: CandidateUser, seed: number): boolean {
  if (user.partyJoinDate) return true;

  switch (user.role) {
    case 'CHI_HUY_HOC_VIEN':
    case 'CHI_HUY_KHOA_PHONG':
    case 'CHI_HUY_BO_MON':
    case 'CHU_NHIEM_BO_MON':
      return true;
    case 'GIANG_VIEN':
    case 'NGHIEN_CUU_VIEN':
      return seed % 4 !== 0; // 75%
    case 'TRO_LY':
    case 'NHAN_VIEN':
    case 'KY_THUAT_VIEN':
      return seed % 3 === 0; // ~33%
    default:
      return seed % 6 === 0; // ~16%
  }
}

async function resolveBestOrganizationForUser(user: CandidateUser) {
  const allOrgs = await prisma.partyOrganization.findMany({
    where: { isActive: true },
    include: { unit: true },
    orderBy: [{ level: 'asc' }, { code: 'asc' }],
  });

  if (allOrgs.length === 0) {
    throw new Error('Không có PartyOrganization nào. Hãy chạy seed_party_organizations.ts trước.');
  }

  const root = allOrgs.find((o) => o.code === 'DANG_UY_HVHC') || allOrgs[0];

  const byUnitCode = allOrgs.find(
    (o) =>
      o.unit?.code &&
      (o.unit.code === user.unit || o.unit.code === user.department),
  );

  return byUnitCode || root;
}

async function main() {
  console.log('🎯 Seeding Party Members...');

  const users = await prisma.user.findMany({
    where: {
      status: 'ACTIVE',
      role: {
        in: [
          UserRole.ADMIN,
          UserRole.QUAN_TRI_HE_THONG,
          UserRole.CHI_HUY_HOC_VIEN,
          UserRole.CHI_HUY_KHOA_PHONG,
          UserRole.CHI_HUY_BO_MON,
          UserRole.CHU_NHIEM_BO_MON,
          UserRole.GIANG_VIEN,
          UserRole.NGHIEN_CUU_VIEN,
          UserRole.TRO_LY,
          UserRole.NHAN_VIEN,
          UserRole.KY_THUAT_VIEN,
        ],
      },
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      status: true,
      unit: true,
      department: true,
      unitId: true,
      partyJoinDate: true,
      partyPosition: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  if (users.length === 0) {
    throw new Error('Không có user phù hợp để seed PartyMember.');
  }

  let created = 0;
  let updated = 0;
  let skipped = 0;

  const now = new Date();

  for (let i = 0; i < users.length; i++) {
    const user = users[i] as CandidateUser;
    const seed = i + 1;

    if (!shouldBecomePartyMember(user, seed)) {
      skipped++;
      continue;
    }

    const organization = await resolveBestOrganizationForUser(user);

    const currentPosition = inferPartyPositionFromRole(user.role, seed);

    // Trạng thái + ngày tháng nhất quán với vòng đời (tôn trọng partyJoinDate thật nếu có).
    const stage = assignPartyStage(currentPosition, bucketFromId(user.id), now, {
      existingJoinDate: user.partyJoinDate,
      classifyFromExistingDate: true,
    });

    const existing = await prisma.partyMember.findUnique({
      where: { userId: user.id },
    });

    // Field không thuộc vòng đời — an toàn ghi đè khi re-seed.
    const baseFields = {
      userId: user.id,
      organizationId: organization.id,
      partyCardNumber: buildPartyCard(seed),
      partyCell: organization.shortName ?? organization.name,
      partyCommittee: 'Đảng ủy Học viện Hậu cần',
      recommender1: 'Đồng chí Nguyễn Văn A',
      recommender2: 'Đồng chí Trần Văn B',
      currentPosition,
      deletedAt: null as Date | null,
      deletedBy: null as string | null,
    };

    // Field vòng đời — CHỈ set khi tạo mới; re-seed KHÔNG ghi đè (tôn trọng thay đổi lifecycle thủ công).
    const lifecycleFields = {
      status: stage.status,
      joinDate: stage.joinDate,
      officialDate: stage.officialDate,
      statusChangeDate: stage.status === 'KHAI_TRU' ? now : (null as Date | null),
      statusChangeReason:
        stage.status === 'KHAI_TRU' ? reasonForStatus(stage.status) : (null as string | null),
    };

    if (!existing) {
      await prisma.partyMember.create({
        data: { ...baseFields, ...lifecycleFields },
      });
      created++;
    } else {
      await prisma.partyMember.update({
        where: { userId: user.id },
        data: baseFields,
      });
      updated++;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        partyJoinDate: stage.joinDate,
        partyPosition: partyPositionToUserString(currentPosition),
      },
    });

    console.log(`✅ ${user.email} -> ${organization.code} -> ${currentPosition} -> ${stage.status}`);
  }

  const total = await prisma.partyMember.count();

  console.log('\n================ PARTY MEMBERS ================');
  console.log(`Created : ${created}`);
  console.log(`Updated : ${updated}`);
  console.log(`Skipped : ${skipped}`);
  console.log(`Total   : ${total}`);
  console.log('================================================\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });