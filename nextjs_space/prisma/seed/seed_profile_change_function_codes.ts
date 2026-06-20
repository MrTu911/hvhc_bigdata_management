/**
 * Seed: Function Codes cho module Duyệt cập nhật hồ sơ cán bộ (PROFILE_CHANGE)
 *
 * Bước 1: Upsert 6 PROFILE_CHANGE function codes vào bảng Function.
 * Bước 2: Cấp PositionFunction theo grant SUY RA TỪ single-source
 *         `lib/rbac/position-grants.ts` (buildAllGrants) — KHÔNG hard-code lại
 *         mapping để tránh duplicate source of truth.
 *
 * Phân cấp:
 *   - SELF (mọi tài khoản): VIEW_OWN / CREATE
 *   - Tier-1 (chỉ huy đơn vị): VIEW_UNIT / APPROVE_UNIT
 *   - Tier-2 (ban cán bộ/quân lực + thủ trưởng): VIEW_ORGAN / APPROVE_ORGAN
 *
 * Idempotent: chạy nhiều lần an toàn.
 *
 * Run:
 *   npx tsx --require dotenv/config prisma/seed/seed_profile_change_function_codes.ts
 */

import { PrismaClient, FunctionScope } from '@prisma/client';
import * as dotenv from 'dotenv';
import { buildAllGrants } from '../../lib/rbac/position-grants';
import { FUNCTION_CODES } from '../../lib/rbac/function-codes';

dotenv.config();

const prisma = new PrismaClient();

const PROFILE_CHANGE_CODES = new Set<string>(Object.values(FUNCTION_CODES.PROFILE_CHANGE));

async function upsertFunctions(): Promise<Map<string, string>> {
  console.log('\n📌 Bước 1: Upsert PROFILE_CHANGE function codes');
  const { functions } = buildAllGrants();
  const codeToId = new Map<string, string>();

  for (const fn of functions) {
    if (!PROFILE_CHANGE_CODES.has(fn.code)) continue;
    const result = await prisma.function.upsert({
      where: { code: fn.code },
      update: {
        name: fn.name,
        description: fn.description ?? null,
        module: 'PROFILE_CHANGE',
        actionType: fn.actionType,
        isCritical: fn.isCritical,
        isActive: true,
      },
      create: {
        code: fn.code,
        name: fn.name,
        description: fn.description ?? null,
        module: 'PROFILE_CHANGE',
        actionType: fn.actionType,
        isCritical: fn.isCritical,
        isActive: true,
      },
    });
    codeToId.set(fn.code, result.id);
    console.log(`  ✅ ${fn.code}`);
  }

  return codeToId;
}

async function grantPositions(codeToId: Map<string, string>) {
  console.log('\n🔑 Bước 2: Cấp PositionFunction (suy ra từ buildAllGrants)');
  const { grants } = buildAllGrants();
  const profileGrants = grants.filter((g) => PROFILE_CHANGE_CODES.has(g.functionCode));

  // cache position code → id
  const positionIds = new Map<string, string | null>();
  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const grant of profileGrants) {
    const fnId = codeToId.get(grant.functionCode);
    if (!fnId) continue;

    if (!positionIds.has(grant.positionCode)) {
      const pos = await prisma.position.findFirst({ where: { code: grant.positionCode } });
      positionIds.set(grant.positionCode, pos?.id ?? null);
    }
    const positionId = positionIds.get(grant.positionCode);
    if (!positionId) {
      skipped++;
      continue;
    }

    const existing = await prisma.positionFunction.findFirst({
      where: { positionId, functionId: fnId },
    });
    if (!existing) {
      await prisma.positionFunction.create({
        data: {
          positionId,
          functionId: fnId,
          scope: grant.scope as FunctionScope,
          isActive: true,
        } as never,
      });
      created++;
    } else {
      await prisma.positionFunction.update({
        where: { id: existing.id },
        data: { isActive: true, scope: grant.scope as FunctionScope } as never,
      });
      updated++;
    }
  }

  console.log(`  ✅ Grants: ${created} mới, ${updated} cập nhật, ${skipped} bỏ qua (position chưa có)`);
}

async function main() {
  console.log('\n🚀 Seed: Profile Change Function Codes');
  console.log('━'.repeat(60));
  const codeToId = await upsertFunctions();
  await grantPositions(codeToId);
  console.log(`\n✅ Hoàn thành. Tổng số function codes PROFILE_CHANGE: ${codeToId.size}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
