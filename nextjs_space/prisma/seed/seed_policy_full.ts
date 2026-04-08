import {
  PrismaClient,
  PolicyRecordType,
  PolicyLevel,
  PolicyRecordStatus,
} from '@prisma/client';
import 'dotenv/config';

const prisma = new PrismaClient();

const REWARD_TITLES = [
  'Chiến sĩ thi đua cấp cơ sở',
  'Bằng khen Bộ Quốc phòng',
  'Giấy khen Học viện',
  'Danh hiệu Lao động tiên tiến',
];

const DISCIPLINE_TITLES = [
  'Khiển trách',
  'Cảnh cáo',
  'Hạ bậc lương',
  'Giáng chức',
];

const ALLOWANCE_TITLES = [
  'Phụ cấp trách nhiệm',
  'Phụ cấp độc hại',
  'Chế độ công tác đặc biệt',
  'Hỗ trợ đào tạo',
];

function randomDate(year = 2025) {
  return new Date(year, Math.floor(Math.random() * 12), 1 + Math.floor(Math.random() * 27));
}

function pick<T>(arr: T[], seed: number): T {
  return arr[seed % arr.length];
}

async function main() {
  console.log('🏅 Seeding Policy (Reward / Discipline / Allowance)...');

  const users = await prisma.user.findMany({
    where: { status: 'ACTIVE' },
    orderBy: { createdAt: 'asc' },
    take: 100,
  });

  if (users.length === 0) {
    throw new Error('Không có user');
  }

  let created = 0;

  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    const seed = i + 1;

    // 1. Reward (70%)
    if (seed % 10 !== 0) {
      await prisma.policyRecord.create({
        data: {
          userId: user.id,
          recordType: PolicyRecordType.REWARD,
          level: pick(
            [PolicyLevel.UNIT, PolicyLevel.DEPARTMENT, PolicyLevel.MINISTRY],
            seed,
          ),
          title: pick(REWARD_TITLES, seed),
          reason: 'Hoàn thành xuất sắc nhiệm vụ',
          decisionNumber: `KT-${1000 + seed}`,
          decisionDate: randomDate(),
          effectiveDate: randomDate(),
          issuingUnit: 'Học viện Hậu cần',
          signerName: 'Chỉ huy đơn vị',
          signerPosition: 'Giám đốc',
          status: PolicyRecordStatus.ACTIVE,
        },
      });
      created++;
    }

    // 2. Discipline (~15%)
    if (seed % 7 === 0) {
      await prisma.policyRecord.create({
        data: {
          userId: user.id,
          recordType: PolicyRecordType.DISCIPLINE,
          level: PolicyLevel.UNIT,
          title: pick(DISCIPLINE_TITLES, seed),
          reason: 'Vi phạm kỷ luật',
          decisionNumber: `KL-${2000 + seed}`,
          decisionDate: randomDate(),
          effectiveDate: randomDate(),
          issuingUnit: 'Học viện Hậu cần',
          signerName: 'Chỉ huy đơn vị',
          signerPosition: 'Chính ủy',
          status: PolicyRecordStatus.ACTIVE,
        },
      });
      created++;
    }

    // 3. Allowance (~50%)
    if (seed % 2 === 0) {
      await prisma.policyRecord.create({
        data: {
          userId: user.id,
          recordType: PolicyRecordType.REWARD, // reuse type (vì schema bạn chưa có ALLOWANCE riêng)
          level: PolicyLevel.DEPARTMENT,
          title: pick(ALLOWANCE_TITLES, seed),
          reason: 'Hưởng chế độ chính sách',
          decisionNumber: `CS-${3000 + seed}`,
          decisionDate: randomDate(),
          effectiveDate: randomDate(),
          expiryDate: randomDate(2026),
          issuingUnit: 'Phòng Chính sách',
          signerName: 'Trưởng phòng',
          signerPosition: 'Chính sách',
          status: PolicyRecordStatus.ACTIVE,
        },
      });
      created++;
    }

    console.log(`✅ ${user.email}`);
  }

  console.log('\n==== POLICY RESULT ====');
  console.log(`Created: ${created}`);
  console.log('=======================\n');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());