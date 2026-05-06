/**
 * Seed: Sentinel WorkflowInstance cho Cảnh báo Niên hạn Thăng Quân hàm
 *
 * Tạo 1 WorkflowInstance singleton dùng làm container cho system notifications:
 *   entityType: "SYSTEM_PROMOTION_ALERT"
 *   entityId:   "singleton"
 *
 * Các service dùng instance này để gửi thông báo cảnh báo niên hạn / đề nghị
 * thăng quân hàm mà không cần tạo workflow thật cho từng cán bộ.
 *
 * Idempotent: chạy nhiều lần an toàn.
 *
 * Run:
 *   npx tsx --require dotenv/config prisma/seed/seed_promotion_alert_wf_instance.ts
 */

import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

const ENTITY_TYPE = 'SYSTEM_PROMOTION_ALERT';
const ENTITY_ID = 'singleton';
const SENTINEL_TEMPLATE_CODE = 'SYSTEM_PROMOTION_ALERT_SENTINEL';

async function ensureSentinelTemplate() {
  // Reuse existing template if available, else create a lightweight system template
  let template = await prisma.workflowTemplate.findFirst({
    where: { code: SENTINEL_TEMPLATE_CODE },
  });

  if (!template) {
    template = await prisma.workflowTemplate.create({
      data: {
        code: SENTINEL_TEMPLATE_CODE,
        name: 'Sentinel: Cảnh báo Niên hạn Thăng Quân hàm',
        moduleKey: 'PROMOTION',
        description: 'Template hệ thống dùng làm container cho thông báo cảnh báo niên hạn',
        isActive: true,
        createdBy: 'system-seed',
      },
    });
    console.log(`  ✅ Tạo sentinel template: ${SENTINEL_TEMPLATE_CODE}`);
  } else {
    console.log(`  ⏩ Template đã tồn tại: ${SENTINEL_TEMPLATE_CODE}`);
  }

  // Get or create a published version
  let version = await prisma.workflowTemplateVersion.findFirst({
    where: { templateId: template.id },
    orderBy: { versionNo: 'asc' },
  });

  if (!version) {
    version = await prisma.workflowTemplateVersion.create({
      data: {
        templateId: template.id,
        versionNo: 1,
        status: 'PUBLISHED',
        publishedAt: new Date(),
      },
    });
    // Create minimal steps for the sentinel (START + END)
    await prisma.workflowStepTemplate.createMany({
      data: [
        { templateVersionId: version.id, code: 'START', name: 'Hệ thống', stepType: 'START', orderIndex: 0, isParallel: false },
        { templateVersionId: version.id, code: 'END',   name: 'Hoàn tất', stepType: 'END',   orderIndex: 1, isParallel: false },
      ],
    });
    console.log(`  ✅ Tạo template version v1 PUBLISHED`);
  } else {
    console.log(`  ⏩ Template version đã tồn tại (v${version.versionNo})`);
  }

  return { template, version };
}

async function ensureSentinelInstance(templateId: string, templateVersionId: string) {
  const existing = await prisma.workflowInstance.findFirst({
    where: { entityType: ENTITY_TYPE, entityId: ENTITY_ID },
  });

  if (existing) {
    console.log(`  ⏩ Sentinel instance đã tồn tại (id: ${existing.id})`);
    return existing;
  }

  // Lấy user admin để làm initiator (sentinel không có initiator thật)
  const adminUser = await prisma.user.findFirst({
    where: { role: { in: ['QUAN_TRI_HE_THONG', 'ADMIN'] }, status: 'ACTIVE' },
    orderBy: { createdAt: 'asc' },
  });

  if (!adminUser) {
    throw new Error('Không tìm thấy user admin nào. Chạy seed_admin_full_access.ts trước.');
  }

  const instance = await prisma.workflowInstance.create({
    data: {
      templateId,
      templateVersionId,
      entityType: ENTITY_TYPE,
      entityId: ENTITY_ID,
      title: 'Hệ thống — Cảnh báo Niên hạn Thăng Quân hàm',
      summary: 'Sentinel instance dùng làm container cho thông báo cảnh báo niên hạn thăng quân hàm',
      status: 'IN_PROGRESS',
      currentStepCode: 'START',
      initiatorId: adminUser.id,
      currentAssigneeId: null,
      priority: 0,
      startedAt: new Date(),
    },
  });

  console.log(`  ✅ Tạo sentinel instance: ${instance.id}`);
  console.log(`     entityType: ${instance.entityType}`);
  console.log(`     entityId: ${instance.entityId}`);
  console.log(`     status: ${instance.status}`);

  return instance;
}

async function main() {
  console.log('\n🚀 Seed: Promotion Alert Sentinel WorkflowInstance');
  console.log('━'.repeat(60));

  console.log('\n📋 Bước 1: Đảm bảo sentinel template tồn tại');
  const { template, version } = await ensureSentinelTemplate();

  console.log('\n📋 Bước 2: Đảm bảo sentinel instance tồn tại');
  await ensureSentinelInstance(template.id, version.id);

  console.log('\n✅ Hoàn thành. Sentinel instance sẵn sàng cho system notifications.');
  console.log(`   Cron route và service có thể dùng:`);
  console.log(`   db.workflowInstance.findFirst({ where: { entityType: '${ENTITY_TYPE}', entityId: '${ENTITY_ID}' } })`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
