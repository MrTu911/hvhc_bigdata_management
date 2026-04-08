/**
 * Seed: M13 Workflow Function Codes + Position Assignments
 *
 * Upsert toàn bộ WF.* (M13 engine) và VIEW_WORKFLOW* (legacy codes) vào bảng Function,
 * sau đó gán PositionFunction với scope phù hợp theo cấp độ chỉ huy.
 *
 * Run:
 *   npx tsx --require dotenv/config prisma/seed/seed_m13_workflow_functions.ts
 */

import { PrismaClient, FunctionScope } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

// ---------------------------------------------------------------------------
// 1. Function code definitions
// ---------------------------------------------------------------------------

interface FunctionDef {
  code: string;
  name: string;
  description: string;
  module: string;
  actionType: 'VIEW' | 'CREATE' | 'UPDATE' | 'DELETE' | 'APPROVE' | 'REJECT' | 'EXPORT' | 'IMPORT' | 'SUBMIT';
  isCritical?: boolean;
}

const WF_FUNCTIONS: FunctionDef[] = [
  // ── Legacy-style codes (backward compat với routes cũ) ──────────────────
  {
    code: 'VIEW_WORKFLOW',
    name: 'Xem danh sách quy trình',
    description: 'Xem danh sách workflow instances thuộc phạm vi quyền hạn',
    module: 'WORKFLOW',
    actionType: 'VIEW',
  },
  {
    code: 'VIEW_WORKFLOW_DETAIL',
    name: 'Xem chi tiết quy trình',
    description: 'Xem đầy đủ thông tin và lịch sử của một workflow instance',
    module: 'WORKFLOW',
    actionType: 'VIEW',
  },
  {
    code: 'VIEW_WORKFLOW_DEFS',
    name: 'Xem định nghĩa quy trình',
    description: 'Xem danh sách template và cấu hình quy trình đã có',
    module: 'WORKFLOW',
    actionType: 'VIEW',
  },
  {
    code: 'MANAGE_WORKFLOW_DEFS',
    name: 'Quản lý định nghĩa quy trình',
    description: 'Tạo, sửa, xóa workflow template và phiên bản',
    module: 'WORKFLOW',
    actionType: 'CREATE',
    isCritical: true,
  },
  {
    code: 'VIEW_ALL_WORKFLOW_INSTANCES',
    name: 'Xem tất cả quy trình đang chạy',
    description: 'Xem toàn bộ workflow instances trong phạm vi quản lý',
    module: 'WORKFLOW',
    actionType: 'VIEW',
  },
  {
    code: 'APPROVE_WORKFLOW',
    name: 'Phê duyệt bước quy trình',
    description: 'Thực hiện hành động phê duyệt tại bước workflow hiện tại',
    module: 'WORKFLOW',
    actionType: 'APPROVE',
    isCritical: true,
  },
  {
    code: 'REJECT_WORKFLOW',
    name: 'Từ chối bước quy trình',
    description: 'Từ chối hồ sơ tại bước workflow hiện tại',
    module: 'WORKFLOW',
    actionType: 'REJECT',
  },
  {
    code: 'CANCEL_WORKFLOW',
    name: 'Hủy quy trình',
    description: 'Hủy toàn bộ workflow instance (chỉ người khởi tạo hoặc quản trị)',
    module: 'WORKFLOW',
    actionType: 'UPDATE',
    isCritical: true,
  },
  {
    code: 'MONITOR_WORKFLOW',
    name: 'Giám sát hiệu suất quy trình',
    description: 'Xem dashboard tổng hợp, bottleneck và thống kê toàn bộ quy trình',
    module: 'WORKFLOW',
    actionType: 'VIEW',
  },

  // ── M13 Engine codes (WF.*) ──────────────────────────────────────────────
  {
    code: 'WF.INITIATE',
    name: 'Khởi tạo quy trình mới',
    description: 'Tạo workflow instance mới cho một đối tượng (hồ sơ, chính sách, v.v.)',
    module: 'WORKFLOW',
    actionType: 'SUBMIT',
  },
  {
    code: 'WF.ACT',
    name: 'Thực hiện hành động quy trình',
    description: 'Approve / Reject / Return / Comment / Reassign tại bước được giao',
    module: 'WORKFLOW',
    actionType: 'APPROVE',
    isCritical: true,
  },
  {
    code: 'WF.SIGN',
    name: 'Ký số điện tử trong quy trình',
    description: 'Thực hiện ký số tại bước yêu cầu chữ ký điện tử',
    module: 'WORKFLOW',
    actionType: 'APPROVE',
    isCritical: true,
  },
  {
    code: 'WF.DESIGN',
    name: 'Thiết kế mẫu quy trình',
    description: 'Tạo và chỉnh sửa workflow template (chỉ bản DRAFT)',
    module: 'WORKFLOW',
    actionType: 'CREATE',
    isCritical: true,
  },
  {
    code: 'WF.OVERRIDE',
    name: 'Phê duyệt / Lưu trữ phiên bản quy trình',
    description: 'Publish / Archive template version; can thiệp hoặc huỷ force',
    module: 'WORKFLOW',
    actionType: 'UPDATE',
    isCritical: true,
  },
  {
    code: 'WF.DASHBOARD',
    name: 'Xem dashboard quy trình toàn cục',
    description: 'Xem tổng quan và KPI workflow toàn học viện',
    module: 'WORKFLOW',
    actionType: 'VIEW',
  },
  {
    code: 'WF.EXPORT',
    name: 'Xuất báo cáo quy trình',
    description: 'Xuất thống kê, lịch sử và báo cáo workflow ra file',
    module: 'WORKFLOW',
    actionType: 'EXPORT',
  },
];

// ---------------------------------------------------------------------------
// 2. Position → Function mapping with scope
// ---------------------------------------------------------------------------

/**
 * Quy tắc phân quyền M13:
 *
 * NHAN_VIEN / HOC_VIEN:
 *   - Xem quy trình của mình (SELF)
 *   - Khởi tạo quy trình (SELF)
 *   - Act tại bước được giao (SELF)
 *
 * GIANG_VIEN / TRO_LY:
 *   + Như NHAN_VIEN
 *
 * CHI_HUY_BO_MON:
 *   - Xem tất cả quy trình trong bộ môn (UNIT)
 *   - Act, Approve (UNIT)
 *
 * CHI_HUY_PHONG / CHI_HUY_HE / CHI_HUY_TIEU_DOAN:
 *   - Xem + Monitor phòng/hệ/tiểu đoàn (DEPARTMENT)
 *   - Act, Approve, Sign (DEPARTMENT)
 *
 * CHI_HUY_KHOA:
 *   - Xem + Monitor khoa (DEPARTMENT)
 *   - Act, Approve, Sign, Design (DEPARTMENT)
 *
 * CHI_HUY_HOC_VIEN:
 *   - Xem + Dashboard + Monitor toàn viện (ACADEMY)
 *   - Approve, Sign, Override (ACADEMY)
 *
 * SYSTEM_ADMIN:
 *   - Toàn bộ quyền (ACADEMY)
 */

interface PositionGrant {
  positionCode: string;
  grants: Array<{ functionCode: string; scope: FunctionScope }>;
}

const POSITION_GRANTS: PositionGrant[] = [
  // ── Cán bộ / nhân viên thường ──────────────────────────────────────────
  {
    positionCode: 'NHAN_VIEN',
    grants: [
      { functionCode: 'VIEW_WORKFLOW',         scope: 'SELF' },
      { functionCode: 'VIEW_WORKFLOW_DETAIL',  scope: 'SELF' },
      { functionCode: 'WF.INITIATE',           scope: 'SELF' },
      { functionCode: 'WF.ACT',                scope: 'SELF' },
    ],
  },
  {
    positionCode: 'GIANG_VIEN',
    grants: [
      { functionCode: 'VIEW_WORKFLOW',         scope: 'SELF' },
      { functionCode: 'VIEW_WORKFLOW_DETAIL',  scope: 'SELF' },
      { functionCode: 'WF.INITIATE',           scope: 'SELF' },
      { functionCode: 'WF.ACT',                scope: 'SELF' },
    ],
  },
  {
    positionCode: 'TRO_LY',
    grants: [
      { functionCode: 'VIEW_WORKFLOW',         scope: 'SELF' },
      { functionCode: 'VIEW_WORKFLOW_DETAIL',  scope: 'SELF' },
      { functionCode: 'WF.INITIATE',           scope: 'SELF' },
      { functionCode: 'WF.ACT',                scope: 'SELF' },
    ],
  },

  // ── Chỉ huy bộ môn ─────────────────────────────────────────────────────
  {
    positionCode: 'CHI_HUY_BO_MON',
    grants: [
      { functionCode: 'VIEW_WORKFLOW',                scope: 'UNIT' },
      { functionCode: 'VIEW_WORKFLOW_DETAIL',         scope: 'UNIT' },
      { functionCode: 'VIEW_ALL_WORKFLOW_INSTANCES',  scope: 'UNIT' },
      { functionCode: 'WF.INITIATE',                 scope: 'UNIT' },
      { functionCode: 'WF.ACT',                      scope: 'UNIT' },
      { functionCode: 'APPROVE_WORKFLOW',            scope: 'UNIT' },
      { functionCode: 'REJECT_WORKFLOW',             scope: 'UNIT' },
      { functionCode: 'CANCEL_WORKFLOW',             scope: 'UNIT' },
    ],
  },

  // ── Chỉ huy tiểu đoàn / hệ ─────────────────────────────────────────────
  {
    positionCode: 'CHI_HUY_TIEU_DOAN',
    grants: [
      { functionCode: 'VIEW_WORKFLOW',                scope: 'DEPARTMENT' },
      { functionCode: 'VIEW_WORKFLOW_DETAIL',         scope: 'DEPARTMENT' },
      { functionCode: 'VIEW_ALL_WORKFLOW_INSTANCES',  scope: 'DEPARTMENT' },
      { functionCode: 'MONITOR_WORKFLOW',             scope: 'DEPARTMENT' },
      { functionCode: 'WF.INITIATE',                 scope: 'DEPARTMENT' },
      { functionCode: 'WF.ACT',                      scope: 'DEPARTMENT' },
      { functionCode: 'WF.SIGN',                     scope: 'DEPARTMENT' },
      { functionCode: 'APPROVE_WORKFLOW',            scope: 'DEPARTMENT' },
      { functionCode: 'REJECT_WORKFLOW',             scope: 'DEPARTMENT' },
      { functionCode: 'CANCEL_WORKFLOW',             scope: 'DEPARTMENT' },
    ],
  },
  {
    positionCode: 'CHI_HUY_HE',
    grants: [
      { functionCode: 'VIEW_WORKFLOW',                scope: 'DEPARTMENT' },
      { functionCode: 'VIEW_WORKFLOW_DETAIL',         scope: 'DEPARTMENT' },
      { functionCode: 'VIEW_ALL_WORKFLOW_INSTANCES',  scope: 'DEPARTMENT' },
      { functionCode: 'MONITOR_WORKFLOW',             scope: 'DEPARTMENT' },
      { functionCode: 'WF.INITIATE',                 scope: 'DEPARTMENT' },
      { functionCode: 'WF.ACT',                      scope: 'DEPARTMENT' },
      { functionCode: 'WF.SIGN',                     scope: 'DEPARTMENT' },
      { functionCode: 'APPROVE_WORKFLOW',            scope: 'DEPARTMENT' },
      { functionCode: 'REJECT_WORKFLOW',             scope: 'DEPARTMENT' },
      { functionCode: 'CANCEL_WORKFLOW',             scope: 'DEPARTMENT' },
    ],
  },

  // ── Chỉ huy phòng ban ──────────────────────────────────────────────────
  {
    positionCode: 'CHI_HUY_PHONG',
    grants: [
      { functionCode: 'VIEW_WORKFLOW',                scope: 'DEPARTMENT' },
      { functionCode: 'VIEW_WORKFLOW_DETAIL',         scope: 'DEPARTMENT' },
      { functionCode: 'VIEW_ALL_WORKFLOW_INSTANCES',  scope: 'DEPARTMENT' },
      { functionCode: 'MONITOR_WORKFLOW',             scope: 'DEPARTMENT' },
      { functionCode: 'WF.INITIATE',                 scope: 'DEPARTMENT' },
      { functionCode: 'WF.ACT',                      scope: 'DEPARTMENT' },
      { functionCode: 'WF.SIGN',                     scope: 'DEPARTMENT' },
      { functionCode: 'WF.DASHBOARD',                scope: 'DEPARTMENT' },
      { functionCode: 'APPROVE_WORKFLOW',            scope: 'DEPARTMENT' },
      { functionCode: 'REJECT_WORKFLOW',             scope: 'DEPARTMENT' },
      { functionCode: 'CANCEL_WORKFLOW',             scope: 'DEPARTMENT' },
    ],
  },

  // ── Chỉ huy khoa ───────────────────────────────────────────────────────
  {
    positionCode: 'CHI_HUY_KHOA',
    grants: [
      { functionCode: 'VIEW_WORKFLOW',                scope: 'DEPARTMENT' },
      { functionCode: 'VIEW_WORKFLOW_DETAIL',         scope: 'DEPARTMENT' },
      { functionCode: 'VIEW_ALL_WORKFLOW_INSTANCES',  scope: 'DEPARTMENT' },
      { functionCode: 'VIEW_WORKFLOW_DEFS',           scope: 'DEPARTMENT' },
      { functionCode: 'MONITOR_WORKFLOW',             scope: 'DEPARTMENT' },
      { functionCode: 'WF.INITIATE',                 scope: 'DEPARTMENT' },
      { functionCode: 'WF.ACT',                      scope: 'DEPARTMENT' },
      { functionCode: 'WF.SIGN',                     scope: 'DEPARTMENT' },
      { functionCode: 'WF.DESIGN',                   scope: 'DEPARTMENT' },
      { functionCode: 'WF.DASHBOARD',                scope: 'DEPARTMENT' },
      { functionCode: 'WF.EXPORT',                   scope: 'DEPARTMENT' },
      { functionCode: 'APPROVE_WORKFLOW',            scope: 'DEPARTMENT' },
      { functionCode: 'REJECT_WORKFLOW',             scope: 'DEPARTMENT' },
      { functionCode: 'CANCEL_WORKFLOW',             scope: 'DEPARTMENT' },
    ],
  },

  // ── Chỉ huy học viện ──────────────────────────────────────────────────
  {
    positionCode: 'CHI_HUY_HOC_VIEN',
    grants: [
      { functionCode: 'VIEW_WORKFLOW',                scope: 'ACADEMY' },
      { functionCode: 'VIEW_WORKFLOW_DETAIL',         scope: 'ACADEMY' },
      { functionCode: 'VIEW_ALL_WORKFLOW_INSTANCES',  scope: 'ACADEMY' },
      { functionCode: 'VIEW_WORKFLOW_DEFS',           scope: 'ACADEMY' },
      { functionCode: 'MANAGE_WORKFLOW_DEFS',         scope: 'ACADEMY' },
      { functionCode: 'MONITOR_WORKFLOW',             scope: 'ACADEMY' },
      { functionCode: 'WF.INITIATE',                 scope: 'ACADEMY' },
      { functionCode: 'WF.ACT',                      scope: 'ACADEMY' },
      { functionCode: 'WF.SIGN',                     scope: 'ACADEMY' },
      { functionCode: 'WF.DESIGN',                   scope: 'ACADEMY' },
      { functionCode: 'WF.OVERRIDE',                 scope: 'ACADEMY' },
      { functionCode: 'WF.DASHBOARD',                scope: 'ACADEMY' },
      { functionCode: 'WF.EXPORT',                   scope: 'ACADEMY' },
      { functionCode: 'APPROVE_WORKFLOW',            scope: 'ACADEMY' },
      { functionCode: 'REJECT_WORKFLOW',             scope: 'ACADEMY' },
      { functionCode: 'CANCEL_WORKFLOW',             scope: 'ACADEMY' },
    ],
  },

  // ── Quản trị hệ thống ─────────────────────────────────────────────────
  {
    positionCode: 'SYSTEM_ADMIN',
    grants: WF_FUNCTIONS.map(f => ({ functionCode: f.code, scope: 'ACADEMY' as FunctionScope })),
  },
];

// ---------------------------------------------------------------------------
// 3. Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('\n🚀 M13 Workflow Function Codes Seed\n');
  console.log('━'.repeat(60));

  // Step 1: Upsert function codes
  console.log('\n📦 Bước 1: Upsert function codes WORKFLOW...');
  let created = 0;
  let updated = 0;

  for (const fn of WF_FUNCTIONS) {
    const existing = await prisma.function.findUnique({ where: { code: fn.code } });
    if (existing) {
      await prisma.function.update({
        where: { code: fn.code },
        data: {
          name: fn.name,
          description: fn.description,
          module: fn.module,
          actionType: fn.actionType,
          isCritical: fn.isCritical ?? false,
          isActive: true,
        },
      });
      updated++;
    } else {
      await prisma.function.create({
        data: {
          code: fn.code,
          name: fn.name,
          description: fn.description,
          module: fn.module,
          actionType: fn.actionType,
          isCritical: fn.isCritical ?? false,
          isActive: true,
        },
      });
      created++;
    }
  }

  console.log(`  ✅ Tạo mới: ${created} | Cập nhật: ${updated}`);

  // Step 2: Assign to positions
  console.log('\n📋 Bước 2: Gán PositionFunction...');
  let assigned = 0;
  let skipped = 0;
  let notFound = 0;

  for (const pg of POSITION_GRANTS) {
    const position = await prisma.position.findUnique({
      where: { code: pg.positionCode },
      select: { id: true, name: true },
    });

    if (!position) {
      console.log(`  ⚠️  Không tìm thấy position: ${pg.positionCode}`);
      notFound++;
      continue;
    }

    for (const grant of pg.grants) {
      const fn = await prisma.function.findUnique({
        where: { code: grant.functionCode },
        select: { id: true },
      });

      if (!fn) {
        console.log(`  ⚠️  Function code không tồn tại: ${grant.functionCode}`);
        continue;
      }

      const existing = await prisma.positionFunction.findFirst({
        where: { positionId: position.id, functionId: fn.id },
      });

      if (existing) {
        // Update scope nếu thay đổi
        if (existing.scope !== grant.scope) {
          await prisma.positionFunction.update({
            where: { id: existing.id },
            data: { scope: grant.scope },
          });
        }
        skipped++;
      } else {
        await prisma.positionFunction.create({
          data: {
            positionId: position.id,
            functionId: fn.id,
            scope: grant.scope,
          },
        });
        assigned++;
      }
    }
  }

  console.log(`  ✅ Gán mới: ${assigned} | Đã có (skip): ${skipped} | Position không tìm thấy: ${notFound}`);

  // Step 3: Summary
  console.log('\n📊 Tóm tắt:');
  const wfFunctions = await prisma.function.findMany({
    where: { module: 'WORKFLOW' },
    select: { code: true, name: true, isCritical: true },
    orderBy: { code: 'asc' },
  });

  console.log(`\n  Tổng WORKFLOW function codes trong DB: ${wfFunctions.length}`);
  wfFunctions.forEach(f => {
    const critical = f.isCritical ? ' ⚠️ ' : '    ';
    console.log(`  ${critical}${f.code.padEnd(35)} ${f.name}`);
  });

  // Check which positions have WF.ACT
  const actFn = await prisma.function.findUnique({ where: { code: 'WF.ACT' } });
  if (actFn) {
    const actGrants = await prisma.positionFunction.findMany({
      where: { functionId: actFn.id },
      include: { position: { select: { code: true, name: true } } },
    });
    console.log(`\n  Positions có quyền WF.ACT (${actGrants.length}):`);
    actGrants.forEach(g => {
      console.log(`    ${g.position.code.padEnd(28)} scope: ${g.scope}`);
    });
  }

  console.log('\n✅ Seed M13 hoàn tất.\n');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
