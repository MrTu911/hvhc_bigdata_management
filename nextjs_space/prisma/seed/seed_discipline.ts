/**
 * Seed Discipline Data - Dữ liệu kỷ luật mẫu
 * Tạo các bản ghi kỷ luật cho một số cán bộ
 */

import { PrismaClient, PolicyRecordType, PolicyLevel, PolicyRecordStatus } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

const DISCIPLINE_TYPES = [
  { title: 'Khiển trách', level: PolicyLevel.UNIT, severity: 1 },
  { title: 'Cảnh cáo', level: PolicyLevel.UNIT, severity: 2 },
  { title: 'Hạ bậc lương', level: PolicyLevel.DEPARTMENT, severity: 3 },
  { title: 'Giáng chức', level: PolicyLevel.MINISTRY, severity: 4 },
];

const DISCIPLINE_REASONS = [
  'Vi phạm quy định về giờ làm việc',
  'Vi phạm nội quy đơn vị',
  'Thiếu trách nhiệm trong công việc',
  'Vi phạm quy chế đào tạo',
  'Vi phạm quy định bảo mật',
  'Sử dụng rượu bia trong giờ làm việc',
  'Không hoàn thành nhiệm vụ được giao',
  'Vi phạm quy định về trang phục',
  'Thiếu kỷ luật trong sinh hoạt tập thể',
  'Vi phạm quy định sử dụng tài sản công',
];

const SIGNERS = [
  { name: 'Nguyễn Văn A', position: 'Giám đốc Học viện' },
  { name: 'Trần Văn B', position: 'Phó Giám đốc' },
  { name: 'Lê Văn C', position: 'Trưởng phòng Tổ chức' },
];

function randomFromArray<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function main() {
  console.log('🚀 ===== BẮT ĐẦU SEED DỮ LIỆU KỶ LUẬT =====');

  // Get all users
  const users = await prisma.user.findMany({
    where: { status: 'ACTIVE' },
    select: { id: true, name: true, rank: true },
  });
  console.log(`👥 Tìm thấy ${users.length} cán bộ`);

  // Check existing discipline records
  const existingDisciplines = await prisma.policyRecord.count({
    where: { recordType: 'DISCIPLINE', deletedAt: null },
  });
  console.log(`📋 Hiện có ${existingDisciplines} bản ghi kỷ luật`);

  if (existingDisciplines >= 30) {
    console.log('✅ Đã có đủ dữ liệu kỷ luật!');
    return;
  }

  // Create discipline records for ~5% of users
  const targetCount = Math.ceil(users.length * 0.05);
  const selectedUsers = users
    .sort(() => Math.random() - 0.5)
    .slice(0, targetCount);

  console.log(`\n⚠️ Tạo kỷ luật cho ${selectedUsers.length} cán bộ...`);

  const currentYear = new Date().getFullYear();
  let created = 0;

  for (const user of selectedUsers) {
    // Check if user already has discipline
    const existingForUser = await prisma.policyRecord.findFirst({
      where: {
        userId: user.id,
        recordType: 'DISCIPLINE',
        deletedAt: null,
      },
    });

    if (existingForUser) continue;

    const discipline = randomFromArray(DISCIPLINE_TYPES);
    const reason = randomFromArray(DISCIPLINE_REASONS);
    const signer = randomFromArray(SIGNERS);
    const year = currentYear - Math.floor(Math.random() * 3);
    const month = Math.floor(Math.random() * 12) + 1;
    const day = Math.floor(Math.random() * 28) + 1;
    const decisionDate = new Date(year, month - 1, day);
    const effectiveDate = new Date(decisionDate);
    effectiveDate.setDate(effectiveDate.getDate() + 5);
    
    // Expiry date: 6-12 months for light, 12-24 months for severe
    const expiryMonths = discipline.severity <= 2 
      ? Math.floor(Math.random() * 6) + 6 
      : Math.floor(Math.random() * 12) + 12;
    const expiryDate = new Date(effectiveDate);
    expiryDate.setMonth(expiryDate.getMonth() + expiryMonths);

    // Determine status based on expiry date
    const now = new Date();
    const status = expiryDate < now ? PolicyRecordStatus.EXPIRED : PolicyRecordStatus.ACTIVE;

    await prisma.policyRecord.create({
      data: {
        userId: user.id,
        recordType: PolicyRecordType.DISCIPLINE,
        level: discipline.level,
        title: discipline.title,
        reason: reason,
        decisionNumber: `QĐ-KL-${year}-${(created + 1).toString().padStart(3, '0')}`,
        decisionDate: decisionDate,
        effectiveDate: effectiveDate,
        expiryDate: expiryDate,
        signerName: signer.name,
        signerPosition: signer.position,
        issuingUnit: 'Học viện Hậu cần',
        workflowStatus: 'APPROVED',
        status: status,
      },
    });
    created++;
    console.log(`  ✔ ${user.name}: ${discipline.title}`);
  }

  // Final count
  const [totalRewards, totalDisciplines] = await Promise.all([
    prisma.policyRecord.count({ where: { recordType: 'REWARD', deletedAt: null } }),
    prisma.policyRecord.count({ where: { recordType: 'DISCIPLINE', deletedAt: null } }),
  ]);

  console.log('\n📊 ===== TỔNG KẾT =====');
  console.log(`  🏆 Khen thưởng: ${totalRewards}`);
  console.log(`  ⚠️ Kỷ luật: ${totalDisciplines}`);
  console.log(`  🆕 Tạo mới: ${created}`);
  console.log('\n✅ HOÀN THÀNH SEED DỮ LIỆU KỶ LUẬT!');
}

main()
  .catch((e) => {
    console.error('❌ Lỗi:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
