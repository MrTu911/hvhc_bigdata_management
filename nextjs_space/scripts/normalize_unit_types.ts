/**
 * Phase 0 — Chuẩn hóa Unit.type về chuẩn M19 `MD_UNIT_TYPE`.
 *
 * Bước 1: upsert các loại đơn vị còn thiếu trong M19 (HE, VIEN, XUONG, CHI_HUY) — idempotent.
 * Bước 2: backfill `Unit.type` theo `normalizeUnitType()` (gộp biến thể hoa/thường về mã chuẩn).
 *
 * Mặc định DRY-RUN (chỉ in báo cáo). Chạy thật: `--apply`.
 *   npx tsx --require dotenv/config scripts/normalize_unit_types.ts          # dry-run
 *   npx tsx --require dotenv/config scripts/normalize_unit_types.ts --apply   # ghi DB
 */

import { PrismaClient } from '@prisma/client';

import {
  UNIT_TYPE_M19_ADDITIONS,
  normalizeUnitType,
  isValidUnitType,
} from '../lib/constants/unit-type';

const prisma = new PrismaClient();
const APPLY = process.argv.includes('--apply');

async function upsertM19Additions(): Promise<void> {
  console.log('\n=== Bước 1: M19 MD_UNIT_TYPE — bổ sung loại đơn vị thiếu ===');
  for (const item of UNIT_TYPE_M19_ADDITIONS) {
    const existing = await prisma.masterDataItem.findUnique({
      where: { categoryCode_code: { categoryCode: 'MD_UNIT_TYPE', code: item.code } },
    });
    if (existing) {
      console.log(`  · ${item.code} đã có → bỏ qua`);
      continue;
    }
    console.log(`  + Thêm ${item.code} (${item.nameVi})${APPLY ? '' : ' [dry-run]'}`);
    if (APPLY) {
      await prisma.masterDataItem.create({
        data: {
          categoryCode: 'MD_UNIT_TYPE',
          code: item.code,
          nameVi: item.nameVi,
          nameEn: item.nameEn,
          shortName: item.shortName,
          sortOrder: item.sortOrder,
          isActive: true,
        },
      });
    }
  }
}

async function backfillUnitTypes(): Promise<void> {
  console.log('\n=== Bước 2: Backfill Unit.type ===');
  const before = await prisma.unit.groupBy({ by: ['type'], _count: { _all: true } });
  const totalBefore = before.reduce((s, r) => s + r._count._all, 0);

  const plan = new Map<string, { to: string; count: number }>();
  const unknown: string[] = [];
  for (const row of before) {
    const canonical = normalizeUnitType(row.type);
    if (!canonical) {
      unknown.push(`${JSON.stringify(row.type)} (${row._count._all})`);
      continue;
    }
    if (canonical !== row.type) {
      plan.set(row.type, { to: canonical, count: row._count._all });
    }
  }

  console.log(`  Tổng unit: ${totalBefore}`);
  if (unknown.length) {
    console.log(`  ⚠ KHÔNG nhận diện được (giữ nguyên): ${unknown.join(', ')}`);
  }
  if (plan.size === 0) {
    console.log('  ✓ Không có gì cần đổi (đã chuẩn).');
  } else {
    console.log('  Mapping sẽ áp dụng:');
    for (const [from, { to, count }] of plan) {
      console.log(`    ${JSON.stringify(from)} → ${to}  (${count})`);
    }
  }

  if (APPLY && plan.size > 0) {
    await prisma.$transaction(
      [...plan.entries()].map(([from, { to }]) =>
        prisma.unit.updateMany({ where: { type: from }, data: { type: to } }),
      ),
    );
  }

  // Count-check + xác nhận giá trị sau cùng đều hợp lệ
  const after = await prisma.unit.groupBy({ by: ['type'], _count: { _all: true } });
  const totalAfter = after.reduce((s, r) => s + r._count._all, 0);
  console.log(`\n  Sau ${APPLY ? 'APPLY' : 'dry-run (chưa ghi)'}:`);
  for (const r of after.sort((a, b) => b._count._all - a._count._all)) {
    const ok = isValidUnitType(r.type) ? '✓' : '✗ KHÔNG CHUẨN';
    console.log(`    ${r.type} = ${r._count._all} ${ok}`);
  }
  if (totalBefore !== totalAfter) {
    throw new Error(`Count mismatch! before=${totalBefore} after=${totalAfter} — DỪNG`);
  }
  console.log(`  Count-check: ${totalBefore} == ${totalAfter} ✓`);
}

async function main(): Promise<void> {
  console.log(APPLY ? '*** APPLY MODE — sẽ ghi DB ***' : '*** DRY-RUN — không ghi DB (thêm --apply để ghi) ***');
  await upsertM19Additions();
  await backfillUnitTypes();
  console.log('\nXong.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
