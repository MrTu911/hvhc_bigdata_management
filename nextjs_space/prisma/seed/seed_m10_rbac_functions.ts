/**
 * Seed M10 RBAC – Hệ đào tạo & Tiểu đoàn
 *
 * Thêm 4 function code mới vào DB:
 *   VIEW_TRAINING_SYSTEM   – xem Hệ đào tạo
 *   MANAGE_TRAINING_SYSTEM – quản lý Hệ đào tạo
 *   VIEW_BATTALION         – xem Tiểu đoàn
 *   MANAGE_BATTALION       – quản lý Tiểu đoàn
 *
 * Gán permissions cho các vị trí:
 *   SYSTEM_ADMIN        – toàn bộ (ACADEMY)
 *   PHO_GIAM_DOC        – VIEW (ACADEMY)
 *   TRUONG_KHOA         – VIEW (DEPARTMENT)
 *   CHI_HUY_HE          – VIEW_TRAINING_SYSTEM + VIEW_BATTALION + VIEW_STUDENT (DEPARTMENT)
 *   CHI_HUY_TIEU_DOAN   – VIEW_BATTALION + VIEW_STUDENT (UNIT)
 *   CHI_HUY_HOC_VIEN    – VIEW (ACADEMY) – chỉ huy toàn học viện
 *   TRUONG_PHONG        – VIEW (DEPARTMENT) – phòng đào tạo
 *   TRO_LY              – VIEW (UNIT)
 *   NHAN_VIEN           – VIEW (UNIT) – cán bộ phòng đào tạo
 */

import { PrismaClient } from '@prisma/client';
import 'dotenv/config';

const prisma = new PrismaClient();

const NEW_FUNCTIONS = [
  {
    code: 'VIEW_TRAINING_SYSTEM',
    name: 'Xem Hệ đào tạo',
    description: 'Xem danh sách và chi tiết các Hệ đào tạo (Hệ 1/2/3/4)',
    module: 'education',
    actionType: 'VIEW' as const,
    isActive: true,
    isCritical: false,
  },
  {
    code: 'MANAGE_TRAINING_SYSTEM',
    name: 'Quản lý Hệ đào tạo',
    description: 'Cập nhật thông tin, cấu hình Hệ đào tạo',
    module: 'education',
    actionType: 'UPDATE' as const,
    isActive: true,
    isCritical: false,
  },
  {
    code: 'VIEW_BATTALION',
    name: 'Xem Tiểu đoàn',
    description: 'Xem danh sách và chi tiết Tiểu đoàn học viên',
    module: 'education',
    actionType: 'VIEW' as const,
    isActive: true,
    isCritical: false,
  },
  {
    code: 'MANAGE_BATTALION',
    name: 'Quản lý Tiểu đoàn',
    description: 'Cập nhật thông tin, cấu hình Tiểu đoàn',
    module: 'education',
    actionType: 'UPDATE' as const,
    isActive: true,
    isCritical: false,
  },
] as const;

// Position → [functionCode, scope]
const GRANTS: Array<{
  positionCode: string;
  functionCode: string;
  scope: 'SELF' | 'UNIT' | 'DEPARTMENT' | 'ACADEMY';
}> = [
  // ── SYSTEM_ADMIN: toàn bộ, ACADEMY scope ──────────────────────────────
  { positionCode: 'SYSTEM_ADMIN', functionCode: 'VIEW_TRAINING_SYSTEM',   scope: 'ACADEMY' },
  { positionCode: 'SYSTEM_ADMIN', functionCode: 'MANAGE_TRAINING_SYSTEM', scope: 'ACADEMY' },
  { positionCode: 'SYSTEM_ADMIN', functionCode: 'VIEW_BATTALION',          scope: 'ACADEMY' },
  { positionCode: 'SYSTEM_ADMIN', functionCode: 'MANAGE_BATTALION',        scope: 'ACADEMY' },

  // ── PHO_GIAM_DOC (Chỉ huy Học viện): VIEW toàn học viện ───────────────
  { positionCode: 'PHO_GIAM_DOC', functionCode: 'VIEW_TRAINING_SYSTEM',   scope: 'ACADEMY' },
  { positionCode: 'PHO_GIAM_DOC', functionCode: 'VIEW_BATTALION',          scope: 'ACADEMY' },

  // ── CHI_HUY_HOC_VIEN: toàn bộ VIEW, ACADEMY ───────────────────────────
  { positionCode: 'CHI_HUY_HOC_VIEN', functionCode: 'VIEW_TRAINING_SYSTEM',   scope: 'ACADEMY' },
  { positionCode: 'CHI_HUY_HOC_VIEN', functionCode: 'MANAGE_TRAINING_SYSTEM', scope: 'ACADEMY' },
  { positionCode: 'CHI_HUY_HOC_VIEN', functionCode: 'VIEW_BATTALION',          scope: 'ACADEMY' },
  { positionCode: 'CHI_HUY_HOC_VIEN', functionCode: 'MANAGE_BATTALION',        scope: 'ACADEMY' },

  // ── CHI_HUY_HE: xem Hệ và Tiểu đoàn của mình (DEPARTMENT scope) ───────
  { positionCode: 'CHI_HUY_HE', functionCode: 'VIEW_TRAINING_SYSTEM',   scope: 'DEPARTMENT' },
  { positionCode: 'CHI_HUY_HE', functionCode: 'MANAGE_TRAINING_SYSTEM', scope: 'DEPARTMENT' },
  { positionCode: 'CHI_HUY_HE', functionCode: 'VIEW_BATTALION',          scope: 'DEPARTMENT' },
  { positionCode: 'CHI_HUY_HE', functionCode: 'MANAGE_BATTALION',        scope: 'DEPARTMENT' },

  // ── CHI_HUY_TIEU_DOAN: xem và quản lý Tiểu đoàn của mình (UNIT scope) ─
  { positionCode: 'CHI_HUY_TIEU_DOAN', functionCode: 'VIEW_TRAINING_SYSTEM', scope: 'UNIT' },
  { positionCode: 'CHI_HUY_TIEU_DOAN', functionCode: 'VIEW_BATTALION',        scope: 'UNIT' },
  { positionCode: 'CHI_HUY_TIEU_DOAN', functionCode: 'MANAGE_BATTALION',      scope: 'UNIT' },

  // ── TRUONG_KHOA: VIEW toàn department (thống kê liên đơn vị) ──────────
  { positionCode: 'TRUONG_KHOA', functionCode: 'VIEW_TRAINING_SYSTEM', scope: 'DEPARTMENT' },
  { positionCode: 'TRUONG_KHOA', functionCode: 'VIEW_BATTALION',        scope: 'DEPARTMENT' },

  // ── TRUONG_PHONG (Phòng Đào tạo): VIEW toàn học viện ──────────────────
  { positionCode: 'TRUONG_PHONG', functionCode: 'VIEW_TRAINING_SYSTEM', scope: 'ACADEMY' },
  { positionCode: 'TRUONG_PHONG', functionCode: 'VIEW_BATTALION',        scope: 'ACADEMY' },

  // ── TRO_LY / NHAN_VIEN: VIEW cấp unit ────────────────────────────────
  { positionCode: 'TRO_LY',   functionCode: 'VIEW_TRAINING_SYSTEM', scope: 'UNIT' },
  { positionCode: 'TRO_LY',   functionCode: 'VIEW_BATTALION',        scope: 'UNIT' },
  { positionCode: 'NHAN_VIEN', functionCode: 'VIEW_TRAINING_SYSTEM', scope: 'UNIT' },
  { positionCode: 'NHAN_VIEN', functionCode: 'VIEW_BATTALION',        scope: 'UNIT' },

  // ── CHI_HUY_BAN (cùng nhóm với CHI_HUY_TIEU_DOAN) ───────────────────
  { positionCode: 'CHI_HUY_BAN', functionCode: 'VIEW_TRAINING_SYSTEM', scope: 'UNIT' },
  { positionCode: 'CHI_HUY_BAN', functionCode: 'VIEW_BATTALION',        scope: 'UNIT' },
];

async function main() {
  console.log('\n🎓 Seed M10 RBAC – Hệ đào tạo & Tiểu đoàn\n');

  // ── 1. Upsert Function records ─────────────────────────────────────────
  console.log('📌 Upsert Function records...');
  for (const fn of NEW_FUNCTIONS) {
    await prisma.function.upsert({
      where: { code: fn.code },
      update: {
        name: fn.name,
        description: fn.description,
        module: fn.module,
        actionType: fn.actionType,
        isActive: fn.isActive,
      },
      create: {
        code: fn.code,
        name: fn.name,
        description: fn.description,
        module: fn.module,
        actionType: fn.actionType,
        isActive: fn.isActive,
        isCritical: fn.isCritical,
      },
    });
    console.log(`  ✓ ${fn.code}`);
  }

  // ── 2. Upsert PositionFunction grants ──────────────────────────────────
  console.log('\n📌 Upsert PositionFunction grants...');
  let created = 0;
  let skipped = 0;

  for (const grant of GRANTS) {
    // Verify position exists
    const position = await prisma.position.findUnique({
      where: { code: grant.positionCode },
    });
    if (!position) {
      console.log(`  ⚠  Position not found: ${grant.positionCode} – skip`);
      skipped++;
      continue;
    }

    // Verify function exists
    const fn = await prisma.function.findUnique({
      where: { code: grant.functionCode },
    });
    if (!fn) {
      console.log(`  ⚠  Function not found: ${grant.functionCode} – skip`);
      skipped++;
      continue;
    }

    await prisma.positionFunction.upsert({
      where: {
        positionId_functionId: {
          positionId: position.id,
          functionId: fn.id,
        },
      },
      update: { scope: grant.scope },
      create: {
        positionId: position.id,
        functionId: fn.id,
        scope: grant.scope,
        conditions: null,
      },
    });
    console.log(`  ✓ ${grant.positionCode} → ${grant.functionCode} [${grant.scope}]`);
    created++;
  }

  console.log(`\n✅ Done. ${created} grants upserted, ${skipped} skipped.`);

  // ── 3. Summary ─────────────────────────────────────────────────────────
  const total = await prisma.function.count({ where: { module: 'education' } });
  console.log(`\n📊 Total education functions in DB: ${total}`);
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
