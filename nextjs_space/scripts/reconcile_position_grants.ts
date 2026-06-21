/**
 * reconcile_position_grants.ts
 *
 * Lấp quyền (PositionFunction) cho các CHỨC VỤ ĐƯỢC TẠO THỦ CÔNG qua UI quản lý
 * chức vụ — những position đã có bản ghi nhưng CHƯA được gán function nào, nên
 * người mang chức vụ đó bị fail-closed (từ chối mọi thao tác).
 *
 * Nguồn predicate tái sử dụng từ pipeline đã kiểm chứng:
 *   prisma/seed/seed_demo_rbac_accounts.ts  (getFunctionAllowPredicate, resolveScope)
 * — KHÔNG dựng hệ phân quyền song song mới.
 *
 * Cách map 1 chức vụ thủ công → hồ sơ quyền:
 *   1. EXPLICIT_PROFILE: map tay theo mã (ưu tiên cao nhất, gồm các đính chính
 *      nghiệp vụ của người dùng — vd B1_PHO_TRUONG_PHONG_BT là CTĐ-CTCT).
 *   2. classifyByName(): suy luận theo từ khóa tên chức vụ cho position thủ công
 *      tương lai mà chưa có trong EXPLICIT_PROFILE.
 *   3. Baseline tối thiểu (PERSONAL + VIEW_DASHBOARD) — không ai bị khóa trắng.
 *
 * An toàn:
 *   - Mặc định DRY-RUN. Thêm --apply để ghi DB.
 *   - Chỉ ADDITIVE (upsert isActive=true), KHÔNG deactivate grant đang có.
 *   - Mặc định chỉ chạm position có 0 grant active (gap-fill). Thêm --all để
 *     refresh cả position đã có grant (vẫn additive).
 *   - --admin: đưa SYSTEM_ADMIN + QUAN_TRI_HE_THONG về full, và bảo đảm mọi user
 *     role ADMIN/QUAN_TRI_HE_THONG có UserPosition SYSTEM_ADMIN active+primary.
 *   - Ghi snapshot rollback các position bị chạm trước khi apply.
 *
 * Chạy:
 *   npx tsx --require dotenv/config scripts/reconcile_position_grants.ts            # dry-run gap-fill
 *   npx tsx --require dotenv/config scripts/reconcile_position_grants.ts --admin    # + kế hoạch admin
 *   npx tsx --require dotenv/config scripts/reconcile_position_grants.ts --apply --admin
 */

import { PrismaClient, FunctionScope } from '@prisma/client';
import { writeFileSync } from 'fs';
import { join } from 'path';
import {
  getFunctionAllowPredicate,
  resolveScope,
} from '../prisma/seed/seed_demo_rbac_accounts';

const prisma = new PrismaClient();
const APPLY = process.argv.includes('--apply');
const ALL = process.argv.includes('--all');
const ADMIN = process.argv.includes('--admin');
// --sync: deactivate grant active KHÔNG nằm trong tập tính ra (để SỬA/hạ over-grant).
// Chỉ tác động lên các position được nhắm (target), không đụng position khác.
const SYNC = process.argv.includes('--sync');
// --only CODE1,CODE2: chỉ xử lý đúng các mã chức vụ này (bỏ qua lọc 0-grant).
const onlyArg = process.argv.find((a) => a.startsWith('--only='))?.split('=')[1]
  ?? (process.argv.includes('--only') ? process.argv[process.argv.indexOf('--only') + 1] : undefined);
const ONLY = onlyArg ? new Set(onlyArg.split(',').map((s) => s.trim()).filter(Boolean)) : null;

type DbFunction = {
  id: string;
  code: string;
  name: string;
  module: string;
  actionType: string;
  isCritical: boolean;
};

// Mọi tài khoản (trừ học viên/khách) cần "Không gian cá nhân" tầng-0.
const PERSONAL_BASE = new Set<string>([
  'MANAGE_MY_PROFILE', 'VIEW_MY_NOTIFICATIONS', 'VIEW_MY_DASHBOARD', 'VIEW_MY_TASKS',
  'MANAGE_MY_SECURITY', 'VIEW_MY_CAREER_HISTORY', 'REQUEST_MY_INFO_UPDATE',
  'VIEW_MY_CADRE_PROFILE', 'VIEW_OWN_PROFILE_CHANGE', 'CREATE_PROFILE_CHANGE',
  'VIEW_DASHBOARD',
]);

// ────────────────────────────────────────────────────────────
// Hồ sơ quyền (profile) — borrow predicate đã kiểm chứng + synthetic baseline
// ────────────────────────────────────────────────────────────

type ProfileKey =
  | 'POLITICAL'          // CTĐ-CTCT/Đảng: PARTY + AWARDS + PERSONNEL (TRUONG_PHONG_DANG)
  | 'POLITICAL_DEPUTY'   // như trên nhưng bỏ DELETE/APPROVE
  | 'POLITICAL_REPORTER' // phụ trách MỘT VÀI nội dung CTĐ-CTCT: VIEW + nộp báo cáo/đề nghị/ra nghị quyết (UNIT)
  | 'TRAINING'         // Đào tạo: EDUCATION + STUDENT + TRAINING + EXAM
  | 'TRAINING_DEPUTY'  // như trên nhưng bỏ DELETE/APPROVE
  | 'PERSONNEL'        // Hậu cần/Nhân sự: PERSONNEL + INSURANCE + POLICY
  | 'SCIENCE'          // Khoa học: RESEARCH + SCIENCE
  | 'FACULTY'          // Khoa: FACULTY + EDUCATION + RESEARCH
  | 'OFFICE_STAFF'     // Xem + báo cáo + tài liệu: education/training VIEW + docs + LM view
  | 'TRAINING_SUPPORT' // Ban hỗ trợ đào tạo: CRUD tài liệu/vật chất/lịch kế hoạch, KHÔNG điểm/học viên
  | 'ASSISTANT'        // Trợ lý: dashboard + docs view + personal
  | 'BASELINE';        // tối thiểu

function stripWriteActions(actionType: string): boolean {
  return !['DELETE', 'APPROVE', 'REJECT'].includes(actionType);
}

function getProfilePredicate(profile: ProfileKey): (fn: DbFunction) => boolean {
  switch (profile) {
    case 'POLITICAL':
      return getFunctionAllowPredicate('TRUONG_PHONG_DANG');
    case 'POLITICAL_DEPUTY': {
      const base = getFunctionAllowPredicate('TRUONG_PHONG_DANG');
      return (fn) => base(fn) && stripWriteActions(fn.actionType);
    }
    case 'POLITICAL_REPORTER':
      // Chủ yếu XEM + nộp báo cáo, đề nghị (khen thưởng/kỷ luật/kết nạp), ra nghị
      // quyết (họp/bình xét chi bộ) cho đơn vị mình. KHÔNG CRUD sâu, KHÔNG duyệt,
      // GIỮ guard với trường đảng viên nhạy cảm.
      return (fn) => {
        const m = fn.module.toUpperCase();
        // GIỮ guard: không bao giờ cấp trường nhạy cảm (đảng viên/nhân thân) cho hồ
        // sơ "phụ trách vài nội dung". Tồn tại function module viết HOA lẫn thường.
        if (/SENSITIVE/.test(fn.code)) return false;
        if (m === 'PARTY') {
          if (fn.actionType === 'VIEW') return true; // xem hồ sơ đảng vụ (trừ sensitive)
          return [
            'MANAGE_PARTY_MEETING',   // ra nghị quyết/họp chi bộ
            'MANAGE_PARTY_REVIEW',    // bình xét, đánh giá đảng viên
            'MANAGE_PARTY_ACTIVITY',  // hoạt động chi bộ
            'SUBMIT_PARTY_ADMISSION', // đề nghị kết nạp
            'EXPORT_PARTY_REPORT',    // nộp/xuất báo cáo
          ].includes(fn.code);
        }
        if (m === 'AWARDS') return ['VIEW_AWARD', 'VIEW_DISCIPLINE', 'CREATE_AWARD', 'CREATE_DISCIPLINE'].includes(fn.code);
        // Chỉ roster cơ bản — KHÔNG nhân thân/gia đình/quân nhân chi tiết.
        if (m === 'PERSONNEL') return ['VIEW_PERSONNEL', 'VIEW_PERSONNEL_DETAIL', 'PERSONNEL.VIEW', 'PERSONNEL.VIEW_DETAIL'].includes(fn.code);
        if (m === 'DASHBOARD') return fn.code === 'VIEW_DASHBOARD';
        if (m === 'PERSONAL') return true; // dữ liệu của chính mình
        return false;
      };
    case 'TRAINING':
      return getFunctionAllowPredicate('TRUONG_PHONG_DAO_TAO');
    case 'TRAINING_DEPUTY': {
      const base = getFunctionAllowPredicate('TRUONG_PHONG_DAO_TAO');
      return (fn) => base(fn) && stripWriteActions(fn.actionType);
    }
    case 'PERSONNEL':
      return getFunctionAllowPredicate('TRUONG_PHONG_NHAN_SU');
    case 'SCIENCE':
      return getFunctionAllowPredicate('TRUONG_PHONG_KHOA_HOC');
    case 'FACULTY':
      return getFunctionAllowPredicate('TRUONG_KHOA');
    case 'OFFICE_STAFF':
      // Chỉ xem + báo cáo + tài liệu. KHÔNG điểm/học viên/duyệt.
      return (fn) => {
        const m = fn.module.toUpperCase();
        // GRADUATION bị loại vì catalog gán nhầm RUN_GRADUATION (chạy engine xét TN) là VIEW.
        if (m === 'EDUCATION') return fn.actionType === 'VIEW' && !/STUDENT|CONDUCT|GPA|GRADE|PROFILE360|GRADUATION/.test(fn.code);
        if (m === 'TRAINING') return ['VIEW_TRAINING', 'VIEW_COURSE'].includes(fn.code);
        if (m === 'LEARNING_MATERIAL') return ['VIEW_LEARNING_MATERIAL', 'DOWNLOAD_LEARNING_MATERIAL'].includes(fn.code);
        if (m === 'DOCUMENTS') return ['VIEW', 'EXPORT'].includes(fn.actionType);
        if (m === 'DASHBOARD') return fn.code === 'VIEW_DASHBOARD';
        if (m === 'PERSONAL') return true;
        return false;
      };
    case 'TRAINING_SUPPORT':
      // Ban hỗ trợ đào tạo (kế hoạch/vật chất/bản đồ): CRUD học liệu + tài liệu + lịch
      // kế hoạch huấn luyện. TUYỆT ĐỐI không điểm/học viên/chương trình duyệt.
      return (fn) => {
        const m = fn.module.toUpperCase();
        if (m === 'LEARNING_MATERIAL') {
          return ['VIEW_LEARNING_MATERIAL', 'CREATE_LEARNING_MATERIAL', 'UPDATE_LEARNING_MATERIAL',
            'UPLOAD_LEARNING_MATERIAL', 'DOWNLOAD_LEARNING_MATERIAL'].includes(fn.code);
        }
        if (m === 'DOCUMENTS') return true; // catalog chỉ có view/export/pdf
        if (m === 'EDUCATION') {
          // Lịch/kế hoạch huấn luyện (planning), KHÔNG học vụ-điểm-học viên.
          if (['CREATE_SCHEDULE', 'UPDATE_SCHEDULE', 'VIEW_SCHEDULE', 'EDUCATION.VIEW_SCHEDULE'].includes(fn.code)) return true;
          return fn.actionType === 'VIEW' && !/STUDENT|CONDUCT|GPA|GRADE|PROFILE360|GRADUATION/.test(fn.code);
        }
        if (m === 'TRAINING') return ['VIEW_TRAINING', 'VIEW_COURSE'].includes(fn.code);
        if (m === 'DASHBOARD') return fn.code === 'VIEW_DASHBOARD';
        if (m === 'PERSONAL') return true;
        return false;
      };
    case 'ASSISTANT':
      return (fn) => {
        const m = fn.module.toUpperCase();
        if (m === 'DOCUMENTS') return ['VIEW', 'DOWNLOAD', 'SEARCH'].includes(fn.actionType);
        if (m === 'DASHBOARD') return fn.code === 'VIEW_DASHBOARD';
        if (m === 'PERSONAL') return true;
        return false;
      };
    case 'BASELINE':
    default:
      return () => false;
  }
}

function getProfileScope(profile: ProfileKey): FunctionScope {
  switch (profile) {
    case 'POLITICAL':
    case 'POLITICAL_DEPUTY':
    case 'TRAINING':
    case 'TRAINING_DEPUTY':
    case 'PERSONNEL':
    case 'SCIENCE':
    case 'FACULTY':
    case 'OFFICE_STAFF':
    case 'TRAINING_SUPPORT':
      return 'DEPARTMENT';
    case 'POLITICAL_REPORTER':
    case 'ASSISTANT':
      return 'UNIT';
    case 'BASELINE':
    default:
      return 'SELF';
  }
}

// ────────────────────────────────────────────────────────────
// Map tay theo mã chức vụ thủ công (gồm đính chính nghiệp vụ của người dùng)
// ────────────────────────────────────────────────────────────

const EXPLICIT_PROFILE: Record<string, { profile: ProfileKey; note: string }> = {
  B1_PHO_TRUONG_PHONG:    { profile: 'TRAINING_DEPUTY', note: 'Phó Trưởng phòng Đào tạo' },
  // Đính chính của người dùng (2 vòng): BT phụ trách MỘT VÀI nội dung CTĐ-CTCT của
  // đơn vị — chủ yếu xem, nộp báo cáo, đề nghị, ra nghị quyết. KHÔNG CRUD sâu đảng vụ.
  B1_PHO_TRUONG_PHONG_BT: { profile: 'POLITICAL_REPORTER', note: 'Phụ trách vài nội dung CTĐ-CTCT: view + báo cáo/đề nghị/nghị quyết (UNIT)' },
  B3_CNCTB3:              { profile: 'POLITICAL', note: 'Chủ nhiệm Chính trị' },
  B3_PHO_CNCT:            { profile: 'POLITICAL_DEPUTY', note: 'Phó Chủ nhiệm Chính trị' },
  B4_CNHC_KT:             { profile: 'PERSONNEL', note: 'Chủ nhiệm Hậu cần - Kỹ thuật' },
  B7_TRUONGPHONG:         { profile: 'TRAINING', note: 'Trưởng phòng Sau đại học' },
  // Người dùng chốt: GĐ TTSX chỉ xem + báo cáo + tài liệu (không CRUD học vụ).
  B1_GĐ_TTSX:             { profile: 'OFFICE_STAFF', note: 'GĐ TT Sản xuất & Thực hành: xem + báo cáo + tài liệu' },
  // Người dùng chốt: 3 Trưởng ban được CRUD mảng phụ trách (tài liệu/vật chất/lịch),
  // KHÔNG đụng điểm/học viên.
  B1_TRUONG_BAN_BĐ:       { profile: 'TRAINING_SUPPORT', note: 'Trưởng ban Bản đồ: CRUD học liệu/tài liệu/lịch' },
  B1_TRUONG_BAN_KH:       { profile: 'TRAINING_SUPPORT', note: 'Trưởng ban Kế hoạch: CRUD học liệu/tài liệu/lịch' },
  B1_TRUONG_BAN_VC:       { profile: 'TRAINING_SUPPORT', note: 'Trưởng ban Vật chất huấn luyện: CRUD học liệu/tài liệu/lịch' },
  B1_TRO_LY_BANDO:        { profile: 'ASSISTANT', note: 'Trợ lý Ban Bản đồ' },
  B1_TRO_LY_KEHOACH:      { profile: 'ASSISTANT', note: 'Trợ lý Ban Kế hoạch' },
  B1_TRO_LY_TTSX:         { profile: 'ASSISTANT', note: 'Trợ lý TT Sản xuất' },
  B1_TRO_LY_VCHL:         { profile: 'ASSISTANT', note: 'Trợ lý Ban Vật chất' },
};

// ────────────────────────────────────────────────────────────
// Suy luận theo tên cho position thủ công tương lai chưa map tay
// ────────────────────────────────────────────────────────────

function classifyByName(name: string): { profile: ProfileKey; note: string } {
  const n = name.toLowerCase();
  const isDeputy = /phó/.test(n);
  if (/(chính trị|đảng|ctđ|ctct)/.test(n)) {
    return { profile: isDeputy ? 'POLITICAL_DEPUTY' : 'POLITICAL', note: 'suy luận: chính trị/đảng' };
  }
  if (/(hậu cần|nhân sự|quân lực|hc-kt|cán bộ)/.test(n)) {
    return { profile: 'PERSONNEL', note: 'suy luận: hậu cần/nhân sự' };
  }
  if (/(khoa học|khqs|nghiên cứu)/.test(n)) {
    return { profile: 'SCIENCE', note: 'suy luận: khoa học' };
  }
  if (/(đào tạo|sau đại học|huấn luyện|giáo dục)/.test(n)) {
    return { profile: isDeputy ? 'TRAINING_DEPUTY' : 'TRAINING', note: 'suy luận: đào tạo' };
  }
  if (/khoa/.test(n)) {
    return { profile: 'FACULTY', note: 'suy luận: cấp khoa' };
  }
  if (/trợ lý/.test(n)) {
    return { profile: 'ASSISTANT', note: 'suy luận: trợ lý' };
  }
  if (/(trưởng ban|ban )/.test(n)) {
    return { profile: 'OFFICE_STAFF', note: 'suy luận: cán bộ ban' };
  }
  return { profile: 'BASELINE', note: 'không khớp — chỉ baseline cá nhân' };
}

function resolveProfile(code: string, name: string): { profile: ProfileKey; note: string } {
  return EXPLICIT_PROFILE[code] ?? classifyByName(name);
}

// ────────────────────────────────────────────────────────────
// Tính grant cho 1 position
// ────────────────────────────────────────────────────────────

function buildGrantSet(profile: ProfileKey, functions: DbFunction[]): { codes: Set<string>; scope: FunctionScope } {
  const predicate = getProfilePredicate(profile);
  const scope = getProfileScope(profile);
  const codes = new Set<string>();
  for (const fn of functions) {
    if (predicate(fn)) codes.add(fn.code);
  }
  // Baseline cá nhân luôn có để menu cá nhân + dashboard hiển thị
  for (const fn of functions) {
    if (PERSONAL_BASE.has(fn.code)) codes.add(fn.code);
  }
  return { codes, scope };
}

// ────────────────────────────────────────────────────────────
// MAIN
// ────────────────────────────────────────────────────────────

async function main() {
  console.log('='.repeat(80));
  console.log(`  RECONCILE POSITION GRANTS — ${APPLY ? '⚠️  APPLY (ghi DB)' : 'DRY-RUN'}` +
    `${ALL ? '  [--all: refresh cả position đã có grant]' : '  [chỉ gap-fill 0-grant]'}` +
    `${ADMIN ? '  [+admin]' : ''}`);
  console.log('='.repeat(80));

  const functions = (await prisma.function.findMany({
    where: { isActive: true },
    select: { id: true, code: true, name: true, module: true, actionType: true, isCritical: true },
  })) as DbFunction[];
  const fnByCode = new Map(functions.map((f) => [f.code, f]));
  console.log(`Functions active: ${functions.length}`);

  const positions = await prisma.position.findMany({
    include: { _count: { select: { functions: { where: { isActive: true } }, userPositions: { where: { isActive: true } } } } },
    orderBy: [{ level: 'desc' }, { code: 'asc' }],
  });

  const ADMIN_CODES = new Set(['SYSTEM_ADMIN', 'QUAN_TRI_HE_THONG']);
  const targets = positions.filter((p) => {
    if (ADMIN_CODES.has(p.code)) return false; // xử lý riêng ở bước admin
    if (ONLY) return ONLY.has(p.code);          // chỉ các mã được chỉ định
    if (ALL) return true;
    return p._count.functions === 0;
  });

  console.log(`\n── Bước 1: ${targets.length} chức vụ cần lấp/refresh quyền ──`);

  const rollback: Array<{ positionCode: string; functionId: string; functionCode: string; scope: string; isActive: boolean }> = [];

  for (const pos of targets) {
    const { profile, note } = resolveProfile(pos.code, pos.name);
    const { codes, scope } = buildGrantSet(profile, functions);
    const before0 = pos._count.functions;

    console.log(
      `  ${pos.code.padEnd(22)} ${String(before0).padStart(3)}g→${String(codes.size).padStart(3)}  scope=${scope.padEnd(10)} ` +
      `profile=${profile.padEnd(18)} users=${pos._count.userPositions}` +
      `${SYNC ? ' [sync]' : ''}  | ${pos.name}  «${note}»`,
    );

    if (!APPLY) continue;

    // snapshot trước khi chạm (chỉ position này)
    const before = await prisma.positionFunction.findMany({
      where: { positionId: pos.id },
      select: { functionId: true, scope: true, isActive: true, function: { select: { code: true } } },
    });
    for (const b of before) {
      rollback.push({ positionCode: pos.code, functionId: b.functionId, functionCode: b.function.code, scope: b.scope, isActive: b.isActive });
    }

    for (const code of codes) {
      const fn = fnByCode.get(code);
      if (!fn) continue;
      await prisma.positionFunction.upsert({
        where: { positionId_functionId: { positionId: pos.id, functionId: fn.id } },
        update: { scope, isActive: true },
        create: { positionId: pos.id, functionId: fn.id, scope, isActive: true },
      });
    }

    // --sync: hạ (deactivate) grant active không còn thuộc tập tính ra — để SỬA over-grant.
    if (SYNC) {
      const keepIds = new Set([...codes].map((c) => fnByCode.get(c)?.id).filter(Boolean) as string[]);
      const deactivated = await prisma.positionFunction.updateMany({
        where: { positionId: pos.id, isActive: true, functionId: { notIn: [...keepIds] } },
        data: { isActive: false },
      });
      if (deactivated.count > 0) console.log(`     ↳ sync: deactivate ${deactivated.count} grant thừa`);
    }
  }

  // ── Bước 2: admin ──
  if (ADMIN) {
    console.log('\n── Bước 2: Admin (full quyền) ──');
    for (const code of ADMIN_CODES) {
      const pos = await prisma.position.findFirst({ where: { code } });
      if (!pos) { console.log(`  (bỏ qua) position ${code} không tồn tại`); continue; }
      const activeGrants = await prisma.positionFunction.count({ where: { positionId: pos.id, isActive: true } });
      console.log(`  ${code}: ${activeGrants} → ${functions.length} (full ACADEMY)`);
      if (!APPLY) continue;

      const before = await prisma.positionFunction.findMany({
        where: { positionId: pos.id }, select: { functionId: true, scope: true, isActive: true, function: { select: { code: true } } },
      });
      for (const b of before) rollback.push({ positionCode: code, functionId: b.functionId, functionCode: b.function.code, scope: b.scope, isActive: b.isActive });

      for (const fn of functions) {
        await prisma.positionFunction.upsert({
          where: { positionId_functionId: { positionId: pos.id, functionId: fn.id } },
          update: { scope: 'ACADEMY', isActive: true },
          create: { positionId: pos.id, functionId: fn.id, scope: 'ACADEMY', isActive: true },
        });
      }
    }

    // Bảo đảm user role ADMIN/QUAN_TRI_HE_THONG có SYSTEM_ADMIN active+primary
    const sysAdminPos = await prisma.position.findFirst({ where: { code: 'SYSTEM_ADMIN' } });
    const adminUsers = await prisma.user.findMany({
      where: { role: { in: ['ADMIN', 'QUAN_TRI_HE_THONG'] } },
      select: { id: true, email: true, userPositions: { where: { isActive: true }, include: { position: { select: { code: true } } } } },
    });
    console.log(`\n  User role ADMIN/QUAN_TRI_HE_THONG: ${adminUsers.length}`);
    for (const u of adminUsers) {
      const hasSys = u.userPositions.some((up) => up.position.code === 'SYSTEM_ADMIN');
      console.log(`    ${hasSys ? '✓ đã có' : '+ thiếu  '} SYSTEM_ADMIN  ${u.email}`);
      if (!APPLY || hasSys || !sysAdminPos) continue;
      await prisma.userPosition.create({
        data: { userId: u.id, positionId: sysAdminPos.id, isActive: true, isPrimary: true, startDate: new Date() },
      });
    }
  }

  // ── Ghi snapshot rollback ──
  if (APPLY && rollback.length > 0) {
    const file = join(process.cwd(), 'scripts', `_rollback_position_grants_${Date.now()}.json`);
    writeFileSync(file, JSON.stringify(rollback, null, 2));
    console.log(`\n📦 Snapshot rollback (${rollback.length} bản ghi cũ): ${file}`);
  }

  console.log('\n' + '='.repeat(80));
  if (APPLY) {
    console.log('  ✅ ĐÃ GHI DB (additive). Permission cache TTL 5 phút sẽ tự refresh, hoặc restart app.');
  } else {
    console.log('  ℹ️  DRY-RUN. Thêm --apply để ghi. Xem kỹ cột profile/«note» trước khi apply.');
  }
  console.log('='.repeat(80));
}

main()
  .catch((e) => { console.error('❌ FAILED:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
