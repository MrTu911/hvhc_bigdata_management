/**
 * reconcile_demo_rbac.ts
 *
 * Đồng bộ (reconcile) phân quyền RBAC cho 13 tài khoản demo về đúng vai trò.
 * Phạm vi targeted: CHỈ chạm 13 demo user + 13 position chúng dùng.
 * KHÔNG sweep toàn bộ 53 position (tránh phá grant của user seeded khác).
 *
 * Việc làm:
 *  A. Mỗi demo user → đảm bảo đúng 1 UserPosition active + primary (đúng position+unit),
 *     deactivate mọi UserPosition active thừa/sai (vd giamdoc có PHO_GIAM_DOC_GD_ĐT thừa).
 *  B. Mỗi position demo → set Position.positionScope = grantScope, refresh PositionFunction
 *     theo predicate (deactivate cái không cho phép, upsert cái cho phép với đúng scope).
 *
 * Tái sử dụng predicate đã kiểm chứng từ seed_demo_rbac_accounts.ts, override 2 case:
 *  - B3_CNCT       : siết về UNIT, chỉ PARTY+AWARDS+conduct (bỏ PERSONNEL CRUD/DELETE)
 *  - K1_TRUONG_KHOA: dùng predicate khoa (TRUONG_KHOA) → FACULTY+EDUCATION+RESEARCH,
 *                    bỏ SYSTEM/PARTY-approve/INSURANCE/DATA; scope DEPARTMENT
 *
 * Mặc định DRY-RUN (chỉ in dự định). Thêm cờ --apply để ghi DB.
 *
 * Chạy:  npx tsx --require dotenv/config scripts/reconcile_demo_rbac.ts          # dry-run
 *        npx tsx --require dotenv/config scripts/reconcile_demo_rbac.ts --apply  # ghi DB
 */

import { PrismaClient, FunctionScope, PositionScope } from '@prisma/client';
import {
  getFunctionAllowPredicate,
  resolveScope,
} from '../prisma/seed/seed_demo_rbac_accounts';

const prisma = new PrismaClient();
const APPLY = process.argv.includes('--apply');

type SeedFunction = {
  id: string;
  code: string;
  name: string;
  module: string;
  actionType: string;
  isCritical: boolean;
};

// ────────────────────────────────────────────────────────────
// Cấu hình demo: email → vai trò đích
// ────────────────────────────────────────────────────────────

interface DemoTarget {
  email: string;
  positionCode: string;
  unitCode: string;
}

const DEMO_TARGETS: DemoTarget[] = [
  { email: 'admin@demo.hvhc.edu.vn', positionCode: 'SYSTEM_ADMIN', unitCode: 'HVHC' },
  { email: 'giamdoc@demo.hvhc.edu.vn', positionCode: 'GIAM_DOC', unitCode: 'BGD' },
  { email: 'chinhuy@demo.hvhc.edu.vn', positionCode: 'CHINH_UY', unitCode: 'BGD' },
  { email: 'pgd.kh@demo.hvhc.edu.vn', positionCode: 'PHO_GIAM_DOC_KH', unitCode: 'BGD' },
  { email: 'tpct@demo.hvhc.edu.vn', positionCode: 'TRUONG_PHONG_DANG', unitCode: 'B3' },
  { email: 'ctv.he@demo.hvhc.edu.vn', positionCode: 'B3_CNCT', unitCode: 'HE2' },
  { email: 'tpdt@demo.hvhc.edu.vn', positionCode: 'TRUONG_PHONG_DAO_TAO', unitCode: 'B1' },
  { email: 'tpns@demo.hvhc.edu.vn', positionCode: 'TRUONG_PHONG_NHAN_SU', unitCode: 'B4' },
  { email: 'truongkhoa@demo.hvhc.edu.vn', positionCode: 'K1_TRUONG_KHOA', unitCode: 'K1' },
  { email: 'chihuyhe@demo.hvhc.edu.vn', positionCode: 'CHI_HUY_HE', unitCode: 'HE3' },
  { email: 'giangvien@demo.hvhc.edu.vn', positionCode: 'GIANG_VIEN', unitCode: 'K1' },
  { email: 'hocvien@demo.hvhc.edu.vn', positionCode: 'HOC_VIEN_QUAN_SU', unitCode: 'HE2' },
  { email: 'sinhvien@demo.hvhc.edu.vn', positionCode: 'SINH_VIEN', unitCode: 'DD_TD1_1' },
];

// ────────────────────────────────────────────────────────────
// Override predicate/scope cho position đặc thù
// ────────────────────────────────────────────────────────────

/** B3_CNCT — Chính trị viên Hệ (UNIT): PARTY+AWARDS+conduct, KHÔNG full PERSONNEL */
function b3CnctPredicate(fn: SeedFunction): boolean {
  const m = fn.module.toUpperCase();
  if (m === 'PARTY') return ['VIEW', 'CREATE', 'UPDATE'].includes(fn.actionType);
  if (m === 'AWARDS') return ['VIEW', 'CREATE', 'EXPORT'].includes(fn.actionType);
  if (m === 'STUDENT') return fn.actionType === 'VIEW' || fn.code.includes('CONDUCT');
  if (m === 'EDUCATION') {
    return ['VIEW_STUDENT', 'VIEW_CONDUCT', 'MANAGE_CONDUCT'].includes(fn.code) || fn.actionType === 'VIEW';
  }
  if (m === 'PERSONNEL') return fn.actionType === 'VIEW';
  if (m === 'DASHBOARD') return fn.code === 'VIEW_DASHBOARD';
  if (m === 'PERSONAL') return true;
  return false;
}

function getPredicateFor(positionCode: string): (fn: SeedFunction) => boolean {
  if (positionCode === 'B3_CNCT') return b3CnctPredicate;
  // K1_TRUONG_KHOA: tái sử dụng predicate khoa generic (FACULTY+EDUCATION+RESEARCH...)
  if (positionCode === 'K1_TRUONG_KHOA') return getFunctionAllowPredicate('TRUONG_KHOA');
  return getFunctionAllowPredicate(positionCode);
}

function getScopeFor(positionCode: string): FunctionScope {
  if (positionCode === 'B3_CNCT') return 'UNIT';
  if (positionCode === 'K1_TRUONG_KHOA') return 'DEPARTMENT';
  return resolveScope(positionCode);
}

// ────────────────────────────────────────────────────────────
// Bước A: Reconcile UserPosition cho từng demo user
// ────────────────────────────────────────────────────────────

async function reconcileUserPositions() {
  console.log('\n' + '─'.repeat(78));
  console.log('  BƯỚC A — Reconcile UserPosition (1 active + primary đúng vai trò)');
  console.log('─'.repeat(78));

  for (const target of DEMO_TARGETS) {
    const user = await prisma.user.findUnique({
      where: { email: target.email },
      include: { userPositions: { include: { position: { select: { code: true } } } } },
    });
    if (!user) {
      console.log(`  ❌ ${target.email} — user không tồn tại, bỏ qua`);
      continue;
    }

    const position = await prisma.position.findFirst({ where: { code: target.positionCode } });
    if (!position) {
      console.log(`  ❌ ${target.email} — position ${target.positionCode} không tồn tại, bỏ qua`);
      continue;
    }
    const unit = await prisma.unit.findFirst({ where: { code: target.unitCode } });
    const unitId = unit?.id ?? null;

    const intended = user.userPositions.find((up) => up.positionId === position.id);
    const extras = user.userPositions.filter(
      (up) => up.positionId !== position.id && (up.isActive || up.isPrimary),
    );

    // Deactivate các UserPosition thừa/sai
    for (const ex of extras) {
      console.log(`  • ${target.email}: deactivate UserPosition thừa → ${ex.position.code} (active=${ex.isActive}, primary=${ex.isPrimary})`);
      if (APPLY) {
        await prisma.userPosition.update({
          where: { id: ex.id },
          data: { isActive: false, isPrimary: false },
        });
      }
    }

    // Đảm bảo UserPosition đích đúng: active + primary + unit
    if (intended) {
      const needFix =
        !intended.isActive || !intended.isPrimary || intended.unitId !== unitId;
      if (needFix) {
        console.log(`  • ${target.email}: cập nhật UserPosition đích ${target.positionCode} → active+primary, unit=${target.unitCode}`);
        if (APPLY) {
          await prisma.userPosition.update({
            where: { id: intended.id },
            data: { isActive: true, isPrimary: true, unitId },
          });
        }
      } else {
        console.log(`  ✓ ${target.email}: UserPosition ${target.positionCode} đã đúng`);
      }
    } else {
      console.log(`  • ${target.email}: TẠO UserPosition ${target.positionCode} (active+primary, unit=${target.unitCode})`);
      if (APPLY) {
        await prisma.userPosition.create({
          data: {
            userId: user.id,
            positionId: position.id,
            unitId,
            isActive: true,
            isPrimary: true,
            startDate: new Date('2024-01-01'),
          },
        });
      }
    }
  }
}

// ────────────────────────────────────────────────────────────
// Bước B: Refresh PositionFunction cho từng position demo
// ────────────────────────────────────────────────────────────

async function reconcilePositionFunctions() {
  console.log('\n' + '─'.repeat(78));
  console.log('  BƯỚC B — Refresh PositionFunction (chỉ 13 position demo)');
  console.log('─'.repeat(78));

  const dbFunctions = (await prisma.function.findMany({
    where: { isActive: true },
    select: { id: true, code: true, name: true, module: true, actionType: true, isCritical: true },
  })) as SeedFunction[];

  // Tập position cần xử lý (unique theo positionCode đích)
  const positionCodes = [...new Set(DEMO_TARGETS.map((t) => t.positionCode))];

  for (const code of positionCodes) {
    const position = await prisma.position.findFirst({ where: { code } });
    if (!position) {
      console.log(`  ❌ position ${code} không tồn tại, bỏ qua`);
      continue;
    }

    const predicate = getPredicateFor(code);
    const scope = getScopeFor(code);
    const allowed = dbFunctions.filter(predicate);
    const allowedIds = new Set(allowed.map((f) => f.id));

    const beforeActive = await prisma.positionFunction.count({
      where: { positionId: position.id, isActive: true },
    });

    // Đếm số sẽ bị deactivate
    const toDeactivate = await prisma.positionFunction.count({
      where: { positionId: position.id, isActive: true, functionId: { notIn: [...allowedIds] } },
    });

    console.log(
      `  ${code.padEnd(22)} scope=${scope.padEnd(10)} active(before)=${String(beforeActive).padStart(3)} ` +
      `→ allowed=${String(allowed.length).padStart(3)} (deactivate=${toDeactivate})` +
      `${position.positionScope !== (scope as unknown as PositionScope) ? `  [Position.positionScope ${position.positionScope}→${scope}]` : ''}`,
    );

    if (!APPLY) continue;

    // 1. Align Position.positionScope
    if ((position.positionScope as unknown as string) !== (scope as unknown as string)) {
      await prisma.position.update({
        where: { id: position.id },
        data: { positionScope: scope as unknown as PositionScope },
      });
    }

    // 2. Deactivate functions ngoài predicate
    await prisma.positionFunction.updateMany({
      where: { positionId: position.id, functionId: { notIn: [...allowedIds] } },
      data: { isActive: false },
    });

    // 3. Upsert allowed functions với đúng scope
    for (const fn of allowed) {
      await prisma.positionFunction.upsert({
        where: { positionId_functionId: { positionId: position.id, functionId: fn.id } },
        update: { scope, isActive: true },
        create: { positionId: position.id, functionId: fn.id, scope, isActive: true },
      });
    }
  }
}

// ────────────────────────────────────────────────────────────
// MAIN
// ────────────────────────────────────────────────────────────

async function main() {
  console.log('='.repeat(78));
  console.log(`  RECONCILE DEMO RBAC — ${APPLY ? '⚠️  APPLY (ghi DB)' : 'DRY-RUN (chỉ in dự định)'}`);
  console.log('='.repeat(78));

  await reconcileUserPositions();
  await reconcilePositionFunctions();

  console.log('\n' + '='.repeat(78));
  if (APPLY) {
    console.log('  ✅ ĐÃ GHI DB. Lưu ý: permission cache trong app (TTL 5 phút) sẽ tự refresh,');
    console.log('     hoặc restart app để áp dụng ngay. Chạy lại audit để xác minh.');
  } else {
    console.log('  ℹ️  DRY-RUN xong. Thêm --apply để ghi thay đổi.');
  }
  console.log('='.repeat(78));
}

main()
  .catch((e) => { console.error('❌ FAILED:', e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
