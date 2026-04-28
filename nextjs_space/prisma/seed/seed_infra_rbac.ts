/**
 * Seed INFRA function codes (M12 – Quản lý Dữ liệu & Hạ tầng)
 * và gán quyền cho các chức vụ liên quan.
 *
 * Chạy: npx tsx --require dotenv/config prisma/seed/seed_infra_rbac.ts
 */

import { PrismaClient, ActionType, FunctionScope } from '@prisma/client';
import 'dotenv/config';

const prisma = new PrismaClient();

// ===== INFRA FUNCTION CODES =====
// Map từng code sang actionType phù hợp nhất trong enum hiện có
const INFRA_FUNCTIONS = [
  {
    code: 'INFRA.VIEW',
    name: 'Xem tổng quan hạ tầng',
    description: 'Xem dashboard hạ tầng M12',
    module: 'infrastructure',
    actionType: 'VIEW' as ActionType,
    isCritical: false,
  },
  {
    code: 'INFRA.PIPELINE_VIEW',
    name: 'Xem pipeline definitions và runs',
    description: 'Xem danh sách pipeline, lịch sử chạy',
    module: 'infrastructure',
    actionType: 'VIEW' as ActionType,
    isCritical: false,
  },
  {
    code: 'INFRA.PIPELINE_MANAGE',
    name: 'Trigger và disable pipeline',
    description: 'Trigger manual run, khóa/mở pipeline',
    module: 'infrastructure',
    actionType: 'UPDATE' as ActionType,
    isCritical: true,
  },
  {
    code: 'INFRA.STORAGE_VIEW',
    name: 'Xem bucket config và usage',
    description: 'Xem cấu hình bucket MinIO, dung lượng sử dụng',
    module: 'infrastructure',
    actionType: 'VIEW' as ActionType,
    isCritical: false,
  },
  {
    code: 'INFRA.STORAGE_MANAGE',
    name: 'Sửa lifecycle/retention policy',
    description: 'Cập nhật cấu hình retention, access tier cho bucket',
    module: 'infrastructure',
    actionType: 'UPDATE' as ActionType,
    isCritical: true,
  },
  {
    code: 'INFRA.DATA_QUALITY_VIEW',
    name: 'Xem DQ rules và results',
    description: 'Xem data quality rules và kết quả kiểm tra',
    module: 'infrastructure',
    actionType: 'VIEW' as ActionType,
    isCritical: false,
  },
  {
    code: 'INFRA.DATA_QUALITY_MANAGE',
    name: 'Tạo/sửa data quality rules',
    description: 'Thêm mới và cập nhật quy tắc kiểm tra dữ liệu',
    module: 'infrastructure',
    actionType: 'UPDATE' as ActionType,
    isCritical: true,
  },
  {
    code: 'INFRA.BACKUP_VIEW',
    name: 'Xem backup jobs và artifacts',
    description: 'Xem danh sách backup jobs, freshness, artifacts',
    module: 'infrastructure',
    actionType: 'VIEW' as ActionType,
    isCritical: false,
  },
  {
    code: 'INFRA.BACKUP_MANAGE',
    name: 'Trigger backup thủ công',
    description: 'Kích hoạt backup thủ công ngoài lịch tự động',
    module: 'infrastructure',
    actionType: 'CREATE' as ActionType,
    isCritical: true,
  },
  {
    code: 'INFRA.RESTORE_REQUEST',
    name: 'Yêu cầu restore',
    description: 'Tạo restore job từ backup artifact',
    module: 'infrastructure',
    actionType: 'CREATE' as ActionType,
    isCritical: true,
  },
  {
    code: 'INFRA.RESTORE_MANAGE',
    name: 'Approve/verify restore',
    description: 'Xác nhận kết quả restore (cấp cao hơn RESTORE_REQUEST)',
    module: 'infrastructure',
    actionType: 'APPROVE' as ActionType,
    isCritical: true,
  },
  {
    code: 'INFRA.DR_VIEW',
    name: 'Xem DR plans và exercises',
    description: 'Xem disaster recovery plans và lịch sử diễn tập',
    module: 'infrastructure',
    actionType: 'VIEW' as ActionType,
    isCritical: false,
  },
  {
    code: 'INFRA.DR_MANAGE',
    name: 'Tạo DR plan và ghi kết quả diễn tập',
    description: 'Tạo DR plan, ghi nhận kết quả sau diễn tập DR',
    module: 'infrastructure',
    actionType: 'UPDATE' as ActionType,
    isCritical: true,
  },
  {
    code: 'INFRA.ALERT_VIEW',
    name: 'Xem metric threshold policies',
    description: 'Xem ngưỡng cảnh báo hạ tầng đang áp dụng',
    module: 'infrastructure',
    actionType: 'VIEW' as ActionType,
    isCritical: false,
  },
  {
    code: 'INFRA.ALERT_MANAGE',
    name: 'Sửa ngưỡng cảnh báo',
    description: 'Cập nhật warning/critical threshold cho metric',
    module: 'infrastructure',
    actionType: 'UPDATE' as ActionType,
    isCritical: true,
  },
  {
    code: 'INFRA.ADMIN',
    name: 'Toàn quyền module hạ tầng',
    description: 'Toàn quyền quản trị M12 — chỉ dành cho QUAN_TRI_HE_THONG',
    module: 'infrastructure',
    actionType: 'UPDATE' as ActionType,
    isCritical: true,
  },
] as const;

// ===== PHÂN QUYỀN THEO CHỨC VỤ =====
// QUAN_TRI_HE_THONG: toàn quyền M12
const QUAN_TRI_INFRA_CODES: { code: string; scope: FunctionScope }[] = [
  { code: 'INFRA.VIEW',               scope: 'ACADEMY' },
  { code: 'INFRA.PIPELINE_VIEW',      scope: 'ACADEMY' },
  { code: 'INFRA.PIPELINE_MANAGE',    scope: 'ACADEMY' },
  { code: 'INFRA.STORAGE_VIEW',       scope: 'ACADEMY' },
  { code: 'INFRA.STORAGE_MANAGE',     scope: 'ACADEMY' },
  { code: 'INFRA.DATA_QUALITY_VIEW',  scope: 'ACADEMY' },
  { code: 'INFRA.DATA_QUALITY_MANAGE',scope: 'ACADEMY' },
  { code: 'INFRA.BACKUP_VIEW',        scope: 'ACADEMY' },
  { code: 'INFRA.BACKUP_MANAGE',      scope: 'ACADEMY' },
  { code: 'INFRA.RESTORE_REQUEST',    scope: 'ACADEMY' },
  { code: 'INFRA.RESTORE_MANAGE',     scope: 'ACADEMY' },
  { code: 'INFRA.DR_VIEW',            scope: 'ACADEMY' },
  { code: 'INFRA.DR_MANAGE',          scope: 'ACADEMY' },
  { code: 'INFRA.ALERT_VIEW',         scope: 'ACADEMY' },
  { code: 'INFRA.ALERT_MANAGE',       scope: 'ACADEMY' },
  { code: 'INFRA.ADMIN',              scope: 'ACADEMY' },
];

// KY_THUAT_VIEN: chỉ view + trigger backup + request restore
const KY_THUAT_INFRA_CODES: { code: string; scope: FunctionScope }[] = [
  { code: 'INFRA.VIEW',              scope: 'ACADEMY' },
  { code: 'INFRA.PIPELINE_VIEW',     scope: 'ACADEMY' },
  { code: 'INFRA.STORAGE_VIEW',      scope: 'ACADEMY' },
  { code: 'INFRA.DATA_QUALITY_VIEW', scope: 'ACADEMY' },
  { code: 'INFRA.BACKUP_VIEW',       scope: 'ACADEMY' },
  { code: 'INFRA.BACKUP_MANAGE',     scope: 'ACADEMY' },
  { code: 'INFRA.RESTORE_REQUEST',   scope: 'ACADEMY' },
  { code: 'INFRA.DR_VIEW',           scope: 'ACADEMY' },
  { code: 'INFRA.ALERT_VIEW',        scope: 'ACADEMY' },
];

// GIAM_DOC, PHO_GIAM_DOC: chỉ view để nắm tổng quan hạ tầng
const LANH_DAO_INFRA_CODES: { code: string; scope: FunctionScope }[] = [
  { code: 'INFRA.VIEW',          scope: 'ACADEMY' },
  { code: 'INFRA.BACKUP_VIEW',   scope: 'ACADEMY' },
  { code: 'INFRA.DR_VIEW',       scope: 'ACADEMY' },
  { code: 'INFRA.ALERT_VIEW',    scope: 'ACADEMY' },
];

async function seedInfraFunctions() {
  console.log('\n🔑 Seed INFRA function codes...');
  let created = 0;
  let skipped = 0;

  for (const fn of INFRA_FUNCTIONS) {
    const existing = await prisma.function.findUnique({ where: { code: fn.code } });
    if (existing) {
      skipped++;
      continue;
    }
    await prisma.function.create({ data: fn });
    created++;
    console.log(`  ✓ ${fn.code}`);
  }

  console.log(`  → Tạo mới: ${created}, đã có: ${skipped}/${INFRA_FUNCTIONS.length}`);
}

async function grantInfraToPosition(
  positionCode: string,
  grants: { code: string; scope: FunctionScope }[],
) {
  const position = await prisma.position.findUnique({ where: { code: positionCode } });
  if (!position) {
    console.warn(`  ⚠ Không tìm thấy position: ${positionCode}`);
    return 0;
  }

  let count = 0;
  for (const grant of grants) {
    const fn = await prisma.function.findUnique({ where: { code: grant.code } });
    if (!fn) {
      console.warn(`  ⚠ Không tìm thấy function: ${grant.code}`);
      continue;
    }

    const existing = await prisma.positionFunction.findUnique({
      where: { positionId_functionId: { positionId: position.id, functionId: fn.id } },
    });
    if (existing) continue;

    await prisma.positionFunction.create({
      data: { positionId: position.id, functionId: fn.id, scope: grant.scope },
    });
    count++;
  }

  console.log(`  ✓ ${positionCode}: +${count} grants`);
  return count;
}

async function main() {
  console.log('='.repeat(50));
  console.log('SEED INFRA RBAC — M12 Quản lý Dữ liệu & Hạ tầng');
  console.log('='.repeat(50));

  await seedInfraFunctions();

  console.log('\n🔗 Gán quyền INFRA theo chức vụ...');
  let totalGrants = 0;
  totalGrants += await grantInfraToPosition('QUAN_TRI_HE_THONG', QUAN_TRI_INFRA_CODES);
  totalGrants += await grantInfraToPosition('KY_THUAT_VIEN',     KY_THUAT_INFRA_CODES);
  totalGrants += await grantInfraToPosition('GIAM_DOC',          LANH_DAO_INFRA_CODES);
  totalGrants += await grantInfraToPosition('PHO_GIAM_DOC',      LANH_DAO_INFRA_CODES);

  console.log(`\n  → Tổng grants tạo mới: ${totalGrants}`);
  console.log('\n' + '='.repeat(50));
  console.log('✅ HOÀN THÀNH SEED INFRA RBAC');
  console.log('='.repeat(50));
}

main()
  .catch((e) => {
    console.error('❌ Lỗi seed INFRA RBAC:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
