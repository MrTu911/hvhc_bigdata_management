/**
 * Seed M01 / M02 / M03 — Bổ sung permissions cho các positions chưa được seed_positions_rbac bao phủ
 *
 * Scope matrix theo yêu cầu nghiệp vụ:
 * - Mỗi đơn vị quản lý dữ liệu của mình (UNIT scope → CREATE/UPDATE/MANAGE)
 * - Có cái nhìn tổng quan dữ liệu đơn vị khác (DEPARTMENT/ACADEMY scope → VIEW)
 * - Một số nội dung có thể khai báo và gửi duyệt (SUBMIT → UNIT scope)
 *
 * Positions được bổ sung trong seed này:
 *  - CHI_HUY_HOC_VIEN  (Lv 90) → ACADEMY scope, toàn bộ M03 + M02 + M01 view
 *  - CHI_HUY_KHOA      (Lv 80) → DEPARTMENT scope, M03 + M02 đầy đủ
 *  - CHI_HUY_PHONG     (Lv 80) → DEPARTMENT scope, M02 + M03 view + submit
 *  - CHINH_UY          (Lv  2) → ACADEMY scope, toàn bộ M03 (chính trị viên)
 *  - PHO_CHINH_UY      (Lv  0) → ACADEMY scope, VIEW + MANAGE M03
 *  - CAN_BO_DANG       (Lv  8) → DEPARTMENT scope, MANAGE M03 đầy đủ
 *  - PHO_GIAM_DOC_KH   (Lv  0) → ACADEMY scope, VIEW M01/M02/M03
 *  - GIANG_VIEN        (hiện có) → bổ sung VIEW_PARTY + VIEW_PERSONNEL (UNIT scope)
 *  - TRO_LY/NHAN_VIEN  (hiện có) → bổ sung VIEW_PERSONNEL (UNIT scope)
 *
 * Run: cd nextjs_space && npx tsx --require dotenv/config prisma/seed/seed_m01_m02_m03_permissions.ts
 */

import { PrismaClient, FunctionScope } from '@prisma/client';
import 'dotenv/config';

const prisma = new PrismaClient();

// ──────────────────────────────────────────────────────────────────────────────
// GRANT MATRIX
// ──────────────────────────────────────────────────────────────────────────────

interface Grant {
  positionCode: string;
  functionCode: string;
  scope: FunctionScope;
}

// ── M01: Auth / RBAC / Session / Security ─────────────────────────────────────
const M01_SYSTEM_VIEW_CODES = [
  'VIEW_RBAC', 'VIEW_USERS', 'VIEW_UNITS',
  'VIEW_AUDIT_LOG', 'VIEW_SYSTEM_HEALTH', 'VIEW_SYSTEM_STATS',
  'VIEW_AUTH_SESSIONS',
];

const M01_SYSTEM_MANAGE_CODES = [
  'MANAGE_USERS', 'MANAGE_UNITS', 'MANAGE_RBAC', 'MANAGE_POSITIONS',
  'MANAGE_FUNCTIONS', 'RESET_USER_PASSWORD', 'TOGGLE_USER_STATUS',
  'EXPORT_AUDIT_LOG', 'REVOKE_AUTH_SESSION',
];

// ── M02: Personnel (Nhân sự cán bộ) ──────────────────────────────────────────
const M02_PERSONNEL_VIEW = [
  'VIEW_PERSONNEL', 'VIEW_PERSONNEL_DETAIL',
  'EXPORT_PERSONNEL',
];

const M02_PERSONNEL_MANAGE = [
  'CREATE_PERSONNEL', 'UPDATE_PERSONNEL', 'APPROVE_PERSONNEL',
  'IMPORT_PERSONNEL', 'SUBMIT_PERSONNEL', 'VIEW_PERSONNEL_SENSITIVE',
];

// ── M03: Party (Đảng viên) ────────────────────────────────────────────────────
const M03_PARTY_VIEW = [
  'VIEW_PARTY', 'VIEW_PARTY_MEMBER', 'VIEW_PARTY_ORG',
  'VIEW_PARTY_MEETING', 'VIEW_PARTY_ACTIVITY', 'VIEW_PARTY_FEE',
  'VIEW_PARTY_REVIEW', 'VIEW_PARTY_DISCIPLINE', 'VIEW_PARTY_TRANSFER',
  'VIEW_PARTY_ADMISSION', 'VIEW_PARTY_INSPECTION',
  'VIEW_PARTY_DASHBOARD', 'VIEW_PARTY_REPORT',
];

const M03_PARTY_MANAGE = [
  'CREATE_PARTY', 'UPDATE_PARTY', 'APPROVE_PARTY',
  'CREATE_PARTY_MEMBER', 'UPDATE_PARTY_MEMBER', 'DELETE_PARTY_MEMBER',
  'VIEW_PARTY_MEMBER_SENSITIVE', 'UPDATE_PARTY_MEMBER_SENSITIVE',
  'CREATE_PARTY_ORG', 'UPDATE_PARTY_ORG',
  'MANAGE_PARTY_MEETING', 'MANAGE_PARTY_ACTIVITY', 'MANAGE_PARTY_FEE',
  'MANAGE_PARTY_REVIEW', 'MANAGE_PARTY_INSPECTION',
  'APPROVE_PARTY_DISCIPLINE', 'APPROVE_PARTY_TRANSFER', 'APPROVE_PARTY_ADMISSION',
  'EXPORT_PARTY_REPORT',
];

const M03_PARTY_UNIT_SUBMIT = [
  'VIEW_PARTY', 'VIEW_PARTY_MEMBER', 'VIEW_PARTY_ORG',
  'VIEW_PARTY_MEETING', 'VIEW_PARTY_ACTIVITY', 'VIEW_PARTY_FEE',
  'VIEW_PARTY_REVIEW', 'VIEW_PARTY_DISCIPLINE', 'VIEW_PARTY_ADMISSION',
  'VIEW_PARTY_DASHBOARD',
];

// ──────────────────────────────────────────────────────────────────────────────
// POSITION GRANT DEFINITIONS
// ──────────────────────────────────────────────────────────────────────────────

function buildGrants(positionCode: string, codes: string[], scope: FunctionScope): Grant[] {
  return codes.map(functionCode => ({ positionCode, functionCode, scope }));
}

const SUPPLEMENTAL_GRANTS: Grant[] = [

  // ── CHI_HUY_HOC_VIEN (level 90) ─────────────────────────────────────
  // Chỉ huy cao nhất học viện → ACADEMY scope toàn bộ
  ...buildGrants('CHI_HUY_HOC_VIEN', M01_SYSTEM_VIEW_CODES, 'ACADEMY'),
  ...buildGrants('CHI_HUY_HOC_VIEN', M02_PERSONNEL_VIEW, 'ACADEMY'),
  ...buildGrants('CHI_HUY_HOC_VIEN', M02_PERSONNEL_MANAGE, 'ACADEMY'),
  ...buildGrants('CHI_HUY_HOC_VIEN', M03_PARTY_VIEW, 'ACADEMY'),
  ...buildGrants('CHI_HUY_HOC_VIEN', M03_PARTY_MANAGE, 'ACADEMY'),
  { positionCode: 'CHI_HUY_HOC_VIEN', functionCode: 'VIEW_DASHBOARD', scope: 'ACADEMY' },
  { positionCode: 'CHI_HUY_HOC_VIEN', functionCode: 'VIEW_DASHBOARD_COMMAND', scope: 'ACADEMY' },

  // ── CHI_HUY_KHOA (level 80) ──────────────────────────────────────────
  // Chỉ huy cấp Khoa → DEPARTMENT scope, quản lý nhân sự + đảng viên trong khoa
  ...buildGrants('CHI_HUY_KHOA', M01_SYSTEM_VIEW_CODES, 'DEPARTMENT'),
  ...buildGrants('CHI_HUY_KHOA', M02_PERSONNEL_VIEW, 'DEPARTMENT'),
  ...buildGrants('CHI_HUY_KHOA', M02_PERSONNEL_MANAGE, 'DEPARTMENT'),
  ...buildGrants('CHI_HUY_KHOA', M03_PARTY_VIEW, 'DEPARTMENT'),
  ...buildGrants('CHI_HUY_KHOA', M03_PARTY_MANAGE, 'DEPARTMENT'),
  { positionCode: 'CHI_HUY_KHOA', functionCode: 'VIEW_DASHBOARD', scope: 'DEPARTMENT' },
  { positionCode: 'CHI_HUY_KHOA', functionCode: 'VIEW_DASHBOARD_COMMAND', scope: 'DEPARTMENT' },

  // ── CHI_HUY_PHONG (level 80) ─────────────────────────────────────────
  // Chỉ huy cấp Phòng → DEPARTMENT scope, xem + submit nhân sự & đảng vụ
  ...buildGrants('CHI_HUY_PHONG', M01_SYSTEM_VIEW_CODES, 'DEPARTMENT'),
  ...buildGrants('CHI_HUY_PHONG', M02_PERSONNEL_VIEW, 'DEPARTMENT'),
  { positionCode: 'CHI_HUY_PHONG', functionCode: 'UPDATE_PERSONNEL', scope: 'DEPARTMENT' },
  { positionCode: 'CHI_HUY_PHONG', functionCode: 'SUBMIT_PERSONNEL', scope: 'DEPARTMENT' },
  ...buildGrants('CHI_HUY_PHONG', M03_PARTY_VIEW, 'DEPARTMENT'),
  { positionCode: 'CHI_HUY_PHONG', functionCode: 'MANAGE_PARTY_MEETING', scope: 'DEPARTMENT' },
  { positionCode: 'CHI_HUY_PHONG', functionCode: 'MANAGE_PARTY_ACTIVITY', scope: 'DEPARTMENT' },
  { positionCode: 'CHI_HUY_PHONG', functionCode: 'MANAGE_PARTY_FEE', scope: 'DEPARTMENT' },
  { positionCode: 'CHI_HUY_PHONG', functionCode: 'APPROVE_PARTY_ADMISSION', scope: 'DEPARTMENT' },
  { positionCode: 'CHI_HUY_PHONG', functionCode: 'EXPORT_PARTY_REPORT', scope: 'DEPARTMENT' },
  { positionCode: 'CHI_HUY_PHONG', functionCode: 'VIEW_DASHBOARD', scope: 'DEPARTMENT' },

  // ── CHINH_UY (level 2 - Chính ủy Học viện) ───────────────────────────
  // Chính ủy → ACADEMY scope toàn bộ M03 + VIEW M01/M02
  ...buildGrants('CHINH_UY', M01_SYSTEM_VIEW_CODES, 'ACADEMY'),
  ...buildGrants('CHINH_UY', M02_PERSONNEL_VIEW, 'ACADEMY'),
  { positionCode: 'CHINH_UY', functionCode: 'VIEW_PERSONNEL_SENSITIVE', scope: 'ACADEMY' },
  ...buildGrants('CHINH_UY', M03_PARTY_VIEW, 'ACADEMY'),
  ...buildGrants('CHINH_UY', M03_PARTY_MANAGE, 'ACADEMY'),
  { positionCode: 'CHINH_UY', functionCode: 'CREATE_PARTY', scope: 'ACADEMY' },
  { positionCode: 'CHINH_UY', functionCode: 'UPDATE_PARTY', scope: 'ACADEMY' },
  { positionCode: 'CHINH_UY', functionCode: 'DELETE_PARTY', scope: 'ACADEMY' },
  { positionCode: 'CHINH_UY', functionCode: 'DELETE_PARTY_MEMBER', scope: 'ACADEMY' },
  { positionCode: 'CHINH_UY', functionCode: 'VIEW_DASHBOARD', scope: 'ACADEMY' },
  { positionCode: 'CHINH_UY', functionCode: 'VIEW_DASHBOARD_COMMAND', scope: 'ACADEMY' },

  // ── PHO_CHINH_UY (Phó Chính ủy) ──────────────────────────────────────
  // Phó Chính ủy → ACADEMY scope VIEW + MANAGE M03 (không DELETE)
  ...buildGrants('PHO_CHINH_UY', M01_SYSTEM_VIEW_CODES, 'ACADEMY'),
  ...buildGrants('PHO_CHINH_UY', M02_PERSONNEL_VIEW, 'ACADEMY'),
  ...buildGrants('PHO_CHINH_UY', M03_PARTY_VIEW, 'ACADEMY'),
  ...buildGrants('PHO_CHINH_UY', M03_PARTY_MANAGE, 'ACADEMY'),
  { positionCode: 'PHO_CHINH_UY', functionCode: 'VIEW_DASHBOARD', scope: 'ACADEMY' },
  { positionCode: 'PHO_CHINH_UY', functionCode: 'VIEW_DASHBOARD_COMMAND', scope: 'ACADEMY' },

  // ── CAN_BO_DANG (level 8 - Cán bộ Đảng vụ) ───────────────────────────
  // Chuyên trách đảng vụ → DEPARTMENT scope, toàn quyền M03 (nghiệp vụ đặc thù)
  ...buildGrants('CAN_BO_DANG', M02_PERSONNEL_VIEW, 'DEPARTMENT'),
  ...buildGrants('CAN_BO_DANG', M03_PARTY_VIEW, 'DEPARTMENT'),
  ...buildGrants('CAN_BO_DANG', M03_PARTY_MANAGE, 'DEPARTMENT'),
  { positionCode: 'CAN_BO_DANG', functionCode: 'CREATE_PARTY', scope: 'DEPARTMENT' },
  { positionCode: 'CAN_BO_DANG', functionCode: 'UPDATE_PARTY', scope: 'DEPARTMENT' },
  { positionCode: 'CAN_BO_DANG', functionCode: 'VIEW_DASHBOARD', scope: 'DEPARTMENT' },

  // ── PHO_GIAM_DOC_KH (Phó Giám đốc Khoa học) ──────────────────────────
  ...buildGrants('PHO_GIAM_DOC_KH', M01_SYSTEM_VIEW_CODES, 'ACADEMY'),
  ...buildGrants('PHO_GIAM_DOC_KH', M02_PERSONNEL_VIEW, 'ACADEMY'),
  ...buildGrants('PHO_GIAM_DOC_KH', M03_PARTY_VIEW, 'ACADEMY'),
  { positionCode: 'PHO_GIAM_DOC_KH', functionCode: 'VIEW_DASHBOARD', scope: 'ACADEMY' },
  { positionCode: 'PHO_GIAM_DOC_KH', functionCode: 'VIEW_DASHBOARD_COMMAND', scope: 'ACADEMY' },

  // ── PHO_GIAM_DOC_HC_HCKT (Phó Giám đốc HC-HCKT) ──────────────────────
  ...buildGrants('PHO_GIAM_DOC_HC_HCKT', M01_SYSTEM_VIEW_CODES, 'ACADEMY'),
  ...buildGrants('PHO_GIAM_DOC_HC_HCKT', M02_PERSONNEL_VIEW, 'ACADEMY'),
  ...buildGrants('PHO_GIAM_DOC_HC_HCKT', M03_PARTY_VIEW, 'ACADEMY'),
  { positionCode: 'PHO_GIAM_DOC_HC_HCKT', functionCode: 'VIEW_DASHBOARD', scope: 'ACADEMY' },

  // ── GIANG_VIEN: bổ sung VIEW party (UNIT scope) & VIEW personnel ──────
  // Giảng viên thuộc chi bộ → xem thông tin đảng viên trong đơn vị, khai báo phí
  ...buildGrants('GIANG_VIEN', M03_PARTY_UNIT_SUBMIT, 'UNIT'),
  ...buildGrants('GIANG_VIEN', M02_PERSONNEL_VIEW, 'UNIT'),

  // ── TRO_GIANG: VIEW party + personnel (UNIT scope) ────────────────────
  ...buildGrants('TRO_GIANG', M03_PARTY_UNIT_SUBMIT, 'UNIT'),
  ...buildGrants('TRO_GIANG', M02_PERSONNEL_VIEW, 'UNIT'),

  // ── TRO_LY / NHAN_VIEN: VIEW personnel trong đơn vị ──────────────────
  ...buildGrants('TRO_LY', M02_PERSONNEL_VIEW, 'UNIT'),
  ...buildGrants('NHAN_VIEN', M02_PERSONNEL_VIEW, 'UNIT'),

  // ── CAN_BO_TO_CHUC: Cán bộ tổ chức → VIEW + SUBMIT personnel ─────────
  ...buildGrants('CAN_BO_TO_CHUC', M02_PERSONNEL_VIEW, 'DEPARTMENT'),
  { positionCode: 'CAN_BO_TO_CHUC', functionCode: 'UPDATE_PERSONNEL', scope: 'DEPARTMENT' },
  { positionCode: 'CAN_BO_TO_CHUC', functionCode: 'SUBMIT_PERSONNEL', scope: 'DEPARTMENT' },
  ...buildGrants('CAN_BO_TO_CHUC', M03_PARTY_VIEW, 'DEPARTMENT'),
];

// ──────────────────────────────────────────────────────────────────────────────
// SEEDING LOGIC
// ──────────────────────────────────────────────────────────────────────────────

async function upsertGrant(grant: Grant): Promise<'created' | 'skipped' | 'missing_position' | 'missing_function'> {
  const position = await prisma.position.findUnique({ where: { code: grant.positionCode }, select: { id: true } });
  if (!position) return 'missing_position';

  const fn = await prisma.function.findUnique({ where: { code: grant.functionCode }, select: { id: true } });
  if (!fn) return 'missing_function';

  await prisma.positionFunction.upsert({
    where: { positionId_functionId: { positionId: position.id, functionId: fn.id } },
    update: { scope: grant.scope, isActive: true },
    create: { positionId: position.id, functionId: fn.id, scope: grant.scope, isActive: true },
  });

  return 'created';
}

async function main() {
  console.log('🚀 Bắt đầu seed M01/M02/M03 permissions (supplemental)...\n');

  const stats = {
    created: 0,
    skipped: 0,
    missingPosition: new Set<string>(),
    missingFunction: new Set<string>(),
  };

  // Deduplicate grants (same position + function → keep first)
  const seen = new Set<string>();
  const deduped: Grant[] = [];
  for (const g of SUPPLEMENTAL_GRANTS) {
    const key = `${g.positionCode}:${g.functionCode}`;
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(g);
    }
  }

  console.log(`📋 Tổng grants cần xử lý: ${deduped.length}`);

  for (const grant of deduped) {
    const result = await upsertGrant(grant);
    if (result === 'created') {
      stats.created++;
      console.log(`  ✅ ${grant.positionCode} → ${grant.functionCode} [${grant.scope}]`);
    } else if (result === 'missing_position') {
      stats.missingPosition.add(grant.positionCode);
      console.warn(`  ⚠️  Position không tồn tại: ${grant.positionCode}`);
    } else if (result === 'missing_function') {
      stats.missingFunction.add(grant.functionCode);
      console.warn(`  ⚠️  Function không tồn tại: ${grant.functionCode}`);
    }
  }

  // ── Verify ────────────────────────────────────────────────────────────
  console.log('\n==================================================');
  console.log('✅ Hoàn tất seed M01/M02/M03 supplemental permissions');
  console.log(`Grants upserted    : ${stats.created}`);
  if (stats.missingPosition.size > 0) {
    console.warn(`Positions missing  : ${[...stats.missingPosition].join(', ')}`);
  }
  if (stats.missingFunction.size > 0) {
    console.warn(`Functions missing  : ${[...stats.missingFunction].join(', ')}`);
  }

  // Quick verify: key positions
  const checkPositions = ['CHI_HUY_HOC_VIEN', 'CHI_HUY_KHOA', 'CHI_HUY_PHONG', 'CHINH_UY', 'CAN_BO_DANG'];
  console.log('\n📊 Verify party grants per position:');
  for (const code of checkPositions) {
    const pos = await prisma.position.findUnique({ where: { code }, select: { id: true } });
    if (!pos) { console.log(`  ${code}: NOT FOUND`); continue; }
    const cnt = await prisma.positionFunction.count({ where: { positionId: pos.id, function: { module: 'party' }, isActive: true } });
    console.log(`  ${code}: ${cnt} party grants`);
  }
  console.log('==================================================\n');
  console.log('⚠️  Đăng xuất và đăng nhập lại để refresh JWT session với permissions mới.');
}

main()
  .catch((err) => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
