/**
 * audit_demo_rbac.ts (READ-ONLY)
 *
 * Kiểm tra phân quyền RBAC thực tế trong DB cho từng tài khoản demo.
 * Không ghi/sửa dữ liệu — chỉ đọc và in báo cáo đối chiếu.
 *
 * Chạy: npx tsx --require dotenv/config scripts/audit_demo_rbac.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DEMO_EMAILS = [
  'admin@demo.hvhc.edu.vn',
  'giamdoc@demo.hvhc.edu.vn',
  'chinhuy@demo.hvhc.edu.vn',
  'pgd.kh@demo.hvhc.edu.vn',
  'tpct@demo.hvhc.edu.vn',
  'ctv.he@demo.hvhc.edu.vn',
  'tpdt@demo.hvhc.edu.vn',
  'tpns@demo.hvhc.edu.vn',
  'truongkhoa@demo.hvhc.edu.vn',
  'chihuyhe@demo.hvhc.edu.vn',
  'giangvien@demo.hvhc.edu.vn',
  'hocvien@demo.hvhc.edu.vn',
  'sinhvien@demo.hvhc.edu.vn',
];

async function main() {
  console.log('='.repeat(80));
  console.log('  AUDIT DEMO RBAC — trạng thái thực tế trong DB');
  console.log('='.repeat(80));

  // Tổng quan catalog
  const totalFn = await prisma.function.count({ where: { isActive: true } });
  console.log(`\nTổng số Function active trong DB: ${totalFn}\n`);

  for (const email of DEMO_EMAILS) {
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        unitRelation: { select: { code: true, name: true } },
        userPositions: {
          where: { isActive: true },
          include: {
            position: {
              select: { code: true, name: true, positionScope: true, isActive: true },
            },
            unit: { select: { code: true } },
          },
        },
      },
    });

    if (!user) {
      console.log(`❌ ${email} — KHÔNG TỒN TẠI trong DB\n`);
      continue;
    }

    console.log('─'.repeat(80));
    console.log(`👤 ${email}`);
    console.log(`   name=${user.name} | status=${user.status} | legacyRole=${user.role}`);
    console.log(`   homeUnit=${user.unitRelation?.code ?? 'null'}`);

    if (user.userPositions.length === 0) {
      console.log(`   ⚠️  KHÔNG có UserPosition active — user này sẽ bị DENY mọi thứ\n`);
      continue;
    }

    for (const up of user.userPositions) {
      const pos = up.position;
      console.log(
        `   ▸ position=${pos.code} (${pos.positionScope}) ` +
        `posUnit=${up.unit?.code ?? 'null'} primary=${up.isPrimary} ` +
        `posActive=${pos.isActive}`
      );

      // Lấy toàn bộ PositionFunction active của position này
      const posFns = await prisma.positionFunction.findMany({
        where: {
          position: { code: pos.code },
          isActive: true,
        },
        include: {
          function: { select: { code: true, module: true, actionType: true, isCritical: true, isActive: true } },
        },
      });

      const activeFns = posFns.filter((pf) => pf.function.isActive);
      console.log(`     → ${activeFns.length} function active được gán`);

      // Group theo module + actionType
      const byModule = new Map<string, Map<string, number>>();
      const scopes = new Set<string>();
      let criticalCount = 0;
      for (const pf of activeFns) {
        scopes.add(pf.scope);
        if (pf.function.isCritical) criticalCount++;
        const m = pf.function.module.toUpperCase();
        if (!byModule.has(m)) byModule.set(m, new Map());
        const am = byModule.get(m)!;
        const at = pf.function.actionType;
        am.set(at, (am.get(at) ?? 0) + 1);
      }

      console.log(`     → scope(s) gán cho function: ${[...scopes].join(', ') || 'none'}`);
      console.log(`     → critical functions: ${criticalCount}`);
      const moduleSummary = [...byModule.entries()]
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([m, am]) => {
          const acts = [...am.entries()].map(([a, c]) => `${a}:${c}`).join(',');
          return `${m}(${acts})`;
        });
      console.log(`     → modules: ${moduleSummary.join(' | ')}`);
    }
    console.log('');
  }

  console.log('='.repeat(80));
  console.log('  KIỂM TRA BẤT THƯỜNG');
  console.log('='.repeat(80));

  // 1. Demo user không có UserPosition
  const noPos = await prisma.user.findMany({
    where: {
      email: { in: DEMO_EMAILS },
      userPositions: { none: { isActive: true } },
    },
    select: { email: true },
  });
  console.log(`\n[1] Demo user KHÔNG có active UserPosition: ${noPos.map((u) => u.email).join(', ') || 'none ✅'}`);

  // 2. Position trong demo nhưng không có PositionFunction nào
  for (const email of DEMO_EMAILS) {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { userPositions: { where: { isActive: true }, include: { position: true } } },
    });
    if (!user) continue;
    for (const up of user.userPositions) {
      const cnt = await prisma.positionFunction.count({
        where: { positionId: up.positionId, isActive: true },
      });
      if (cnt === 0) {
        console.log(`[2] ⚠️  ${email} → position ${up.position.code} có 0 PositionFunction active`);
      }
    }
  }

  // 3. UserPosition.unitId mismatch với scope (SELF/UNIT cần unit cụ thể)
  console.log('\n[3] Kiểm tra scope vs unit:');
  for (const email of DEMO_EMAILS) {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { userPositions: { where: { isActive: true }, include: { position: true, unit: true } } },
    });
    if (!user) continue;
    for (const up of user.userPositions) {
      const scope = up.position.positionScope;
      if ((scope === 'UNIT' || scope === 'SELF' || scope === 'DEPARTMENT') && !up.unitId) {
        console.log(`    ⚠️  ${email} scope=${scope} nhưng UserPosition.unitId=null`);
      }
    }
  }

  console.log('\n✅ Audit hoàn tất (read-only).');
}

main()
  .catch((e) => { console.error('❌ FAILED:', e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
