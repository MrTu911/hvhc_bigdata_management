/**
 * Seed script: Tạo các rule Separation of Duties (SoD) mặc định
 * Chạy: yarn tsx scripts/seed-sod.ts
 */

import { PrismaClient, ConflictSeverity } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

const DEFAULT_SOD_RULES = [
  // Điểm: Không tự duyệt điểm
  {
    functionCodeA: 'CREATE_GRADE',
    functionCodeB: 'APPROVE_GRADE',
    description: 'Người tạo điểm không được tự duyệt điểm',
    severity: 'BLOCK' as ConflictSeverity,
  },
  {
    functionCodeA: 'SUBMIT_GRADE',
    functionCodeB: 'APPROVE_GRADE',
    description: 'Người nộp điểm không được tự duyệt điểm',
    severity: 'BLOCK' as ConflictSeverity,
  },
  // Nghiên cứu: Không tự duyệt đề tài
  {
    functionCodeA: 'CREATE_RESEARCH',
    functionCodeB: 'APPROVE_RESEARCH',
    description: 'Người đăng ký đề tài không được tự duyệt',
    severity: 'BLOCK' as ConflictSeverity,
  },
  {
    functionCodeA: 'SUBMIT_RESEARCH',
    functionCodeB: 'APPROVE_RESEARCH',
    description: 'Người nộp đề tài không được tự duyệt',
    severity: 'BLOCK' as ConflictSeverity,
  },
  // Thi đua khen thưởng
  {
    functionCodeA: 'CREATE_AWARD',
    functionCodeB: 'APPROVE_AWARD',
    description: 'Người đề xuất khen thưởng không được tự duyệt',
    severity: 'BLOCK' as ConflictSeverity,
  },
  // Chính sách
  {
    functionCodeA: 'CREATE_POLICY_REQUEST',
    functionCodeB: 'APPROVE_POLICY',
    description: 'Người tạo hồ sơ chính sách không được tự duyệt',
    severity: 'BLOCK' as ConflictSeverity,
  },
  // Nhân sự: Không tự sửa hồ sơ và duyệt
  {
    functionCodeA: 'UPDATE_PERSONNEL',
    functionCodeB: 'APPROVE_PERSONNEL',
    description: 'Người cập nhật hồ sơ nhân sự không được tự duyệt',
    severity: 'BLOCK' as ConflictSeverity,
  },
  // Quản lý user: Cảnh báo khi tự gán quyền
  {
    functionCodeA: 'MANAGE_USERS',
    functionCodeB: 'MANAGE_RBAC',
    description: 'Cảnh báo: Người quản lý user cũng có quyền quản lý RBAC',
    severity: 'WARN' as ConflictSeverity,
  },
];

async function main() {
  console.log('🛡️  Seeding Separation of Duties (SoD) rules...');
  
  let created = 0;
  let skipped = 0;

  for (const rule of DEFAULT_SOD_RULES) {
    try {
      // Kiểm tra đã tồn tại chưa
      const existing = await prisma.permissionConflict.findFirst({
        where: {
          OR: [
            { functionCodeA: rule.functionCodeA, functionCodeB: rule.functionCodeB },
            { functionCodeA: rule.functionCodeB, functionCodeB: rule.functionCodeA },
          ],
        },
      });

      if (existing) {
        console.log(`  ⏭️  Skip: ${rule.functionCodeA} <-> ${rule.functionCodeB} (đã tồn tại)`);
        skipped++;
        continue;
      }

      await prisma.permissionConflict.create({
        data: rule,
      });

      console.log(`  ✅ Created: ${rule.functionCodeA} <-> ${rule.functionCodeB} (${rule.severity})`);
      created++;
    } catch (error) {
      console.error(`  ❌ Error creating rule ${rule.functionCodeA} <-> ${rule.functionCodeB}:`, error);
    }
  }

  console.log(`\n🏁 Done! Created: ${created}, Skipped: ${skipped}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
