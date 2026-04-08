/**
 * Seed M01 UC-06: Session management function codes
 *
 * Upsert:
 *   - VIEW_AUTH_SESSIONS   → xem danh sách phiên đăng nhập toàn hệ thống
 *   - REVOKE_AUTH_SESSION  → thu hồi phiên đăng nhập
 *
 * Assign cả hai cho SYSTEM_ADMIN với scope ACADEMY.
 * Idempotent — chạy nhiều lần không lỗi.
 *
 * Run:
 *   npx tsx --require dotenv/config prisma/seed/seed_m01_session_functions.ts
 */

import { PrismaClient, FunctionScope } from '@prisma/client';

const prisma = new PrismaClient();

const NEW_FUNCTIONS = [
  {
    code: 'VIEW_AUTH_SESSIONS',
    name: 'Xem danh sách phiên đăng nhập',
    module: 'SECURITY',
    actionType: 'VIEW',
  },
  {
    code: 'REVOKE_AUTH_SESSION',
    name: 'Thu hồi phiên đăng nhập',
    module: 'SECURITY',
    actionType: 'DELETE',
  },
] as const;

// Chỉ SYSTEM_ADMIN cần quyền này — scope ACADEMY (toàn hệ thống)
const POSITION_GRANTS: Array<{ positionCode: string; scope: FunctionScope }> = [
  { positionCode: 'SYSTEM_ADMIN', scope: 'ACADEMY' },
];

async function main() {
  console.log('=== Seeding M01 session function codes ===\n');

  // 1. Load positions
  const positions = await prisma.position.findMany({ select: { id: true, code: true } });
  const positionMap = new Map(positions.map((p) => [p.code, p.id]));

  // 2. Upsert functions
  const functionIdMap = new Map<string, string>();
  for (const fn of NEW_FUNCTIONS) {
    const record = await prisma.function.upsert({
      where: { code: fn.code },
      create: {
        code: fn.code,
        name: fn.name,
        module: fn.module,
        actionType: fn.actionType,
        isActive: true,
        isCritical: true, // session ops là critical
      } as Parameters<typeof prisma.function.create>[0]['data'],
      update: {
        name: fn.name,
        module: fn.module,
        actionType: fn.actionType,
        isActive: true,
        isCritical: true,
      },
    });
    functionIdMap.set(fn.code, record.id);
    console.log(`  ✓ Function upserted: ${fn.code} (${record.id})`);
  }

  // 3. Assign to positions
  let created = 0;
  let skipped = 0;

  for (const [fnCode, fnId] of functionIdMap) {
    for (const { positionCode, scope } of POSITION_GRANTS) {
      const posId = positionMap.get(positionCode);
      if (!posId) {
        console.warn(`  ⚠ Position not found: ${positionCode} — skip`);
        continue;
      }

      const existing = await prisma.positionFunction.findFirst({
        where: { positionId: posId, functionId: fnId },
      });

      if (existing) {
        // Pastikan isActive = true dan scope = ACADEMY
        await prisma.positionFunction.update({
          where: { id: existing.id },
          data: { isActive: true, scope } as any,
        });
        console.log(`  ~ Updated: ${positionCode} → ${fnCode} (${scope})`);
        skipped++;
      } else {
        await prisma.positionFunction.create({
          data: { positionId: posId, functionId: fnId, scope, isActive: true } as any,
        });
        console.log(`  + Created: ${positionCode} → ${fnCode} (${scope})`);
        created++;
      }
    }
  }

  // 4. Verify
  const sysAdminPos = positionMap.get('SYSTEM_ADMIN');
  const grants = sysAdminPos
    ? await prisma.positionFunction.count({
        where: { positionId: sysAdminPos, isActive: true },
      })
    : 0;

  console.log('\n============ RESULT ============');
  console.log(`  Functions upserted : ${functionIdMap.size}`);
  console.log(`  Grants created     : ${created}`);
  console.log(`  Grants updated     : ${skipped}`);
  console.log(`  SYSTEM_ADMIN total : ${grants} active grants`);
  console.log('================================\n');
  console.log('⚠️  Đăng xuất và đăng nhập lại để refresh JWT session với permissions mới.');
}

main()
  .catch((err) => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
