/**
 * Seed RBAC cho cán bộ thật Viện NCKH Hậu cần Quân sự (B12).
 *
 * Bước 3 — Gán RBAC position để 31 cán bộ đăng nhập + dùng module theo vai trò
 *   (reuse position có sẵn: CHI_HUY_PHONG / NGHIEN_CUU_VIEN / NHAN_VIEN).
 * Bước 4 — Tạo position chuyên biệt QL_NHANSU_VIEN_B12 cấp VIEW_PERSONNEL_SENSITIVE
 *   (+ view/detail/export) ở scope DEPARTMENT, gán cho Chỉ huy Viện để xem CCCD/CMSQ
 *   của cán bộ Viện. Cô lập grant nhạy cảm, KHÔNG đụng position dùng chung.
 *
 * Lưu ý scope: route personnel scope theo User.unitId (lib/auth loadUserPermissionData).
 * Để Chỉ huy Viện quản lý toàn Viện, nâng User.unitId của họ lên B12 (Viện gốc).
 * PHẢI chạy SAU seed_vien_b212_personnel.ts.
 *
 * Idempotent. Chạy: npx tsx --require dotenv/config prisma/seed/seed_vien_b212_rbac.ts
 */
import { PrismaClient, FunctionScope, PositionScope } from '@prisma/client';
import 'dotenv/config';

const prisma = new PrismaClient();

const VIEN_CODE = 'B12';
const EMAIL_PREFIX = 'vienb12.qn';

// personnelType -> position code có sẵn để reuse
const POSITION_BY_TYPE: Record<string, string> = {
  CAN_BO_CHI_HUY: 'CHI_HUY_PHONG',
  NGHIEN_CUU_VIEN: 'NGHIEN_CUU_VIEN',
  CONG_NHAN_VIEN: 'NHAN_VIEN',
};

// Position chuyên biệt quản lý nhân sự Viện (bước 4)
const MANAGER_POSITION_CODE = 'QL_NHANSU_VIEN_B12';
const MANAGER_POSITION_NAME = 'Quản lý nhân sự Viện NCKH Hậu cần Quân sự';
const MANAGER_FUNCTION_CODES = [
  'VIEW_PERSONNEL',
  'VIEW_PERSONNEL_DETAIL',
  'VIEW_PERSONNEL_SENSITIVE',
  'EXPORT_PERSONNEL',
];

async function resolvePositionIdByCode(): Promise<Map<string, string>> {
  const codes = [...new Set(Object.values(POSITION_BY_TYPE))];
  const positions = await prisma.position.findMany({
    where: { code: { in: codes } },
    select: { id: true, code: true },
  });
  return new Map(positions.map((p) => [p.code, p.id]));
}

async function upsertUserPosition(
  userId: string,
  positionId: string,
  unitId: string | null,
  isPrimary: boolean,
): Promise<'created' | 'updated'> {
  const existing = await prisma.userPosition.findFirst({ where: { userId, positionId } });
  if (existing) {
    await prisma.userPosition.update({
      where: { id: existing.id },
      data: { unitId, isPrimary, isActive: true, endDate: null },
    });
    return 'updated';
  }
  await prisma.userPosition.create({
    data: { userId, positionId, unitId, isPrimary, isActive: true },
  });
  return 'created';
}

// Tạo/đảm bảo position quản lý nhân sự Viện + grant các function nhạy cảm (scope DEPARTMENT)
async function ensureManagerPosition(): Promise<string> {
  const position = await prisma.position.upsert({
    where: { code: MANAGER_POSITION_CODE },
    update: { name: MANAGER_POSITION_NAME, positionScope: PositionScope.DEPARTMENT, isActive: true },
    create: {
      code: MANAGER_POSITION_CODE,
      name: MANAGER_POSITION_NAME,
      description: 'Quyền quản lý + xem thông tin nhạy cảm (CCCD/CMSQ) cán bộ Viện B12',
      positionScope: PositionScope.DEPARTMENT,
      isActive: true,
    },
  });

  const functions = await prisma.function.findMany({
    where: { code: { in: MANAGER_FUNCTION_CODES } },
    select: { id: true, code: true },
  });
  const missing = MANAGER_FUNCTION_CODES.filter((c) => !functions.some((f) => f.code === c));
  if (missing.length) {
    console.warn(`  ⚠️  Thiếu Function: ${missing.join(', ')} — bỏ qua các function này`);
  }

  for (const fn of functions) {
    await prisma.positionFunction.upsert({
      where: { positionId_functionId: { positionId: position.id, functionId: fn.id } },
      update: { scope: FunctionScope.DEPARTMENT, isActive: true },
      create: { positionId: position.id, functionId: fn.id, scope: FunctionScope.DEPARTMENT, isActive: true },
    });
  }
  console.log(`  ✅ Position [${MANAGER_POSITION_CODE}] + ${functions.length} function (scope DEPARTMENT)`);
  return position.id;
}

async function main() {
  console.log('='.repeat(60));
  console.log('  SEED RBAC – Cán bộ Viện NCKH Hậu cần Quân sự (B12)');
  console.log('='.repeat(60));

  const vien = await prisma.unit.findFirst({ where: { code: VIEN_CODE }, select: { id: true } });
  if (!vien) throw new Error(`Không tìm thấy đơn vị Viện '${VIEN_CODE}'.`);

  const users = await prisma.user.findMany({
    where: { email: { startsWith: EMAIL_PREFIX } },
    select: { id: true, name: true, personnelType: true, unitId: true },
  });
  if (users.length === 0) {
    throw new Error('Không tìm thấy cán bộ Viện B12. Hãy chạy seed_vien_b212_personnel.ts trước.');
  }
  console.log(`\n👥 ${users.length} cán bộ Viện`);

  const positionIdByCode = await resolvePositionIdByCode();
  const commanders = users.filter((u) => u.personnelType === 'CAN_BO_CHI_HUY');

  // Bước 4a: nâng User.unitId của Chỉ huy Viện lên B12 (để scope phủ toàn Viện)
  if (commanders.length) {
    await prisma.user.updateMany({
      where: { id: { in: commanders.map((c) => c.id) } },
      data: { unitId: vien.id },
    });
    console.log(`\n⬆️  Nâng scope Chỉ huy Viện lên B12: ${commanders.length} người`);
  }

  // Bước 3: gán position chính theo vai trò
  let assigned = 0;
  let skippedNoPosition = 0;
  for (const user of users) {
    const code = user.personnelType ? POSITION_BY_TYPE[user.personnelType] : undefined;
    const positionId = code ? positionIdByCode.get(code) : undefined;
    if (!positionId) {
      console.warn(`  ⚠️  ${user.name}: không có position cho personnelType=${user.personnelType} — bỏ qua`);
      skippedNoPosition++;
      continue;
    }
    // Chỉ huy đã được nâng unitId lên B12 ở trên
    const effectiveUnitId = user.personnelType === 'CAN_BO_CHI_HUY' ? vien.id : user.unitId;
    await upsertUserPosition(user.id, positionId, effectiveUnitId, true);
    assigned++;
  }
  console.log(`\n🎖️  Gán position chính: ${assigned} cán bộ (skip ${skippedNoPosition})`);

  // Bước 4: position quản lý nhân sự Viện + gán cho Chỉ huy Viện (secondary)
  const managerPositionId = await ensureManagerPosition();
  for (const commander of commanders) {
    await upsertUserPosition(commander.id, managerPositionId, vien.id, false);
  }
  console.log(`🔐 Gán quyền quản lý nhân sự Viện (xem CCCD/CMSQ) cho ${commanders.length} Chỉ huy Viện`);

  console.log('\n  ✅ HOÀN THÀNH');
}

main()
  .catch((e) => {
    console.error('\n❌ FAILED:', e instanceof Error ? e.message : e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
