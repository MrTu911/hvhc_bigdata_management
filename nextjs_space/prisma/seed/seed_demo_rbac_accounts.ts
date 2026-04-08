/**
 * seed_demo_rbac_accounts.ts
 *
 * Tạo tài khoản demo đầy đủ cho từng chức vụ trong hệ thống RBAC.
 * Đảm bảo mỗi chức vụ có đầy đủ quyền từ ma trận Position-Function.
 *
 * Chạy: npx tsx --require dotenv/config prisma/seed/seed_demo_rbac_accounts.ts
 *
 * Tài khoản demo:
 *   admin@demo.hvhc.edu.vn        → SYSTEM_ADMIN   (toàn quyền)
 *   giamdoc@demo.hvhc.edu.vn     → PHO_GIAM_DOC   (chỉ huy học viện)
 *   truongkhoa@demo.hvhc.edu.vn  → TRUONG_KHOA    (chỉ huy khoa)
 *   chunhiem@demo.hvhc.edu.vn    → CHU_NHIEM_BO_MON
 *   giangvien@demo.hvhc.edu.vn   → GIANG_VIEN
 *   nghiencuu@demo.hvhc.edu.vn   → NGHIEN_CUU_VIEN
 *   nhanvien@demo.hvhc.edu.vn    → NHAN_VIEN
 *   hocvien@demo.hvhc.edu.vn     → HOC_VIEN_QUAN_SU
 *
 *   Mật khẩu chung: Demo@2025
 */

import { PrismaClient, UserStatus, FunctionScope, Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';
import 'dotenv/config';
import { FUNCTION_CODES } from '../../lib/rbac/function-codes';

const prisma = new PrismaClient();

const DEMO_PASSWORD = process.env.DEMO_PASSWORD || 'Demo@2025';

// ─── Demo Account Definitions ────────────────────────────────────────────────

interface DemoAccount {
  email: string;
  name: string;
  rank: string;
  militaryId: string;
  positionCode: string;
  positionScope: string;
  unitCode: string;
  isPrimary: boolean;
  description: string;
}

const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    email: 'admin@demo.hvhc.edu.vn',
    name: 'Quản trị Hệ thống Demo',
    rank: 'Đại tá',
    militaryId: 'DEMO_ADMIN_001',
    positionCode: 'SYSTEM_ADMIN',
    positionScope: 'ACADEMY',
    unitCode: 'HVHC',
    isPrimary: true,
    description: 'Toàn quyền - quản trị hệ thống RBAC, users, audit',
  },
  {
    email: 'giamdoc@demo.hvhc.edu.vn',
    name: 'Thiếu tướng Nguyễn Văn Hòa',
    rank: 'Thiếu tướng',
    militaryId: 'DEMO_GD_001',
    positionCode: 'PHO_GIAM_DOC',
    positionScope: 'ACADEMY',
    unitCode: 'HVHC',
    isPrimary: true,
    description: 'Giám đốc Học viện - quyền phê duyệt cấp học viện',
  },
  {
    email: 'truongkhoa@demo.hvhc.edu.vn',
    name: 'Đại tá Phạm Đức Long',
    rank: 'Đại tá',
    militaryId: 'DEMO_TK_001',
    positionCode: 'TRUONG_KHOA',
    positionScope: 'DEPARTMENT',
    unitCode: 'KCNTT',
    isPrimary: true,
    description: 'Trưởng Khoa CNTT - quản lý khoa/phòng',
  },
  {
    email: 'chunhiem@demo.hvhc.edu.vn',
    name: 'Thượng tá Đỗ Văn Nam',
    rank: 'Thượng tá',
    militaryId: 'DEMO_CNM_001',
    positionCode: 'CHU_NHIEM_BO_MON',
    positionScope: 'UNIT',
    unitCode: 'KCNTT',
    isPrimary: true,
    description: 'Chủ nhiệm Bộ môn - quyền bộ môn',
  },
  {
    email: 'giangvien@demo.hvhc.edu.vn',
    name: 'Trung tá Nguyễn Văn Bình',
    rank: 'Trung tá',
    militaryId: 'DEMO_GV_001',
    positionCode: 'GIANG_VIEN',
    positionScope: 'UNIT',
    unitCode: 'KCNTT',
    isPrimary: true,
    description: 'Giảng viên - quyền đào tạo & nghiên cứu',
  },
  {
    email: 'nghiencuu@demo.hvhc.edu.vn',
    name: 'Thiếu tá Bùi Anh Tuấn',
    rank: 'Thiếu tá',
    militaryId: 'DEMO_NCV_001',
    positionCode: 'NGHIEN_CUU_VIEN',
    positionScope: 'UNIT',
    unitCode: 'HVHC',
    isPrimary: true,
    description: 'Nghiên cứu viên - quyền NCKH & dữ liệu',
  },
  {
    email: 'nhanvien@demo.hvhc.edu.vn',
    name: 'Thượng úy Lê Thị Mai',
    rank: 'Thượng úy',
    militaryId: 'DEMO_NV_001',
    positionCode: 'NHAN_VIEN',
    positionScope: 'UNIT',
    unitCode: 'PHONG_HAU_CAN',
    isPrimary: true,
    description: 'Nhân viên - quyền xem & hỗ trợ nghiệp vụ',
  },
  {
    email: 'hocvien@demo.hvhc.edu.vn',
    name: 'Thượng úy Trần Văn Tuân',
    rank: 'Thượng úy',
    militaryId: 'DEMO_HV_001',
    positionCode: 'HOC_VIEN_QUAN_SU',
    positionScope: 'SELF',
    unitCode: 'KCNTT',
    isPrimary: true,
    description: 'Học viên quân sự - quyền xem học phần của bản thân',
  },
];

// ─── Position-Function Seeder (từ seed_positions_rbac.ts) ─────────────────────

type SeedFunction = {
  id: string;
  code: string;
  name: string;
  module: string;
  actionType: string;
  isCritical: boolean;
};

function resolveScope(positionCode: string): FunctionScope {
  const academyPositions = ['SYSTEM_ADMIN', 'PHO_GIAM_DOC', 'GIAM_DOC', 'CHINH_UY'];
  const deptPositions = ['TRUONG_KHOA', 'PHO_TRUONG_KHOA', 'TRUONG_PHONG', 'PHO_TRUONG_PHONG',
    'CHI_HUY_HE', 'CHI_HUY_TIEU_DOAN', 'CHI_HUY_BAN'];
  const unitPositions = ['CHI_HUY_BO_MON', 'CHU_NHIEM_BO_MON', 'PHO_CHU_NHIEM_BM',
    'GIANG_VIEN', 'GIANG_VIEN_CHINH', 'TRO_GIANG', 'NGHIEN_CUU_VIEN',
    'TRO_LY', 'NHAN_VIEN', 'KY_THUAT_VIEN', 'CHUYEN_VIEN'];

  if (academyPositions.includes(positionCode)) return 'ACADEMY';
  if (deptPositions.includes(positionCode)) return 'DEPARTMENT';
  if (unitPositions.includes(positionCode)) return 'UNIT';
  return 'SELF';
}

function getFunctionAllowPredicate(positionCode: string): (fn: SeedFunction) => boolean {
  switch (positionCode) {
    case 'SYSTEM_ADMIN':
      return () => true;

    case 'PHO_GIAM_DOC':
    case 'GIAM_DOC':
    case 'CHINH_UY':
      return (fn) => {
        const m = fn.module.toUpperCase();
        if (m === 'SYSTEM') return ['VIEW', 'EXPORT', 'APPROVE'].includes(fn.actionType) || fn.code.includes('VIEW_DASHBOARD');
        if (m === 'DASHBOARD') return true;
        return ['VIEW', 'CREATE', 'UPDATE', 'APPROVE', 'REJECT', 'EXPORT', 'IMPORT', 'SUBMIT'].includes(fn.actionType);
      };

    case 'TRUONG_KHOA':
    case 'PHO_TRUONG_KHOA':
    case 'TRUONG_PHONG':
    case 'PHO_TRUONG_PHONG':
    case 'CHI_HUY_HE':
    case 'CHI_HUY_TIEU_DOAN':
    case 'CHI_HUY_BAN':
      return (fn) => {
        const m = fn.module.toUpperCase();
        if (m === 'SYSTEM') return fn.actionType === 'VIEW';
        if (m === 'DASHBOARD') return fn.code.includes('VIEW_DASHBOARD');
        return ['VIEW', 'CREATE', 'UPDATE', 'APPROVE', 'REJECT', 'EXPORT', 'IMPORT', 'SUBMIT'].includes(fn.actionType);
      };

    case 'CHI_HUY_BO_MON':
    case 'CHU_NHIEM_BO_MON':
    case 'PHO_CHU_NHIEM_BM':
      return (fn) => {
        const m = fn.module.toUpperCase();
        if (m === 'SYSTEM') return false;
        if (m === 'DASHBOARD') return fn.code.includes('VIEW_DASHBOARD');
        return ['VIEW', 'CREATE', 'UPDATE', 'APPROVE', 'REJECT', 'EXPORT', 'SUBMIT'].includes(fn.actionType);
      };

    case 'GIANG_VIEN':
    case 'GIANG_VIEN_CHINH':
    case 'TRO_GIANG': {
      const allowed = new Set(['TRAINING', 'EDUCATION', 'FACULTY', 'RESEARCH', 'QUESTION_BANK',
        'LEARNING_MATERIAL', 'DOCUMENTS', 'DASHBOARD', 'AI', 'STUDENT', 'EXAM']);
      return (fn) => {
        const m = fn.module.toUpperCase();
        if (!allowed.has(m)) return false;
        if (m === 'DASHBOARD') return fn.code.includes('VIEW_DASHBOARD');
        return ['VIEW', 'CREATE', 'UPDATE', 'SUBMIT', 'EXPORT', 'IMPORT'].includes(fn.actionType);
      };
    }

    case 'NGHIEN_CUU_VIEN': {
      const allowed = new Set(['RESEARCH', 'FACULTY', 'DOCUMENTS', 'DATA', 'DASHBOARD', 'AI', 'ML']);
      return (fn) => {
        const m = fn.module.toUpperCase();
        if (!allowed.has(m)) return false;
        if (m === 'DASHBOARD') return fn.code.includes('VIEW_DASHBOARD');
        return ['VIEW', 'CREATE', 'UPDATE', 'SUBMIT', 'EXPORT'].includes(fn.actionType);
      };
    }

    case 'TRO_LY':
    case 'NHAN_VIEN':
    case 'CHUYEN_VIEN': {
      const allowed = new Set(['DOCUMENTS', 'MONITORING', 'DATA', 'DASHBOARD', 'SYSTEM', 'INSURANCE', 'POLICY']);
      return (fn) => {
        const m = fn.module.toUpperCase();
        if (!allowed.has(m)) return fn.code === 'VIEW_DASHBOARD';
        if (m === 'SYSTEM') return fn.actionType === 'VIEW';
        if (m === 'DASHBOARD') return fn.code.includes('VIEW_DASHBOARD');
        return ['VIEW', 'UPDATE', 'EXPORT'].includes(fn.actionType);
      };
    }

    case 'KY_THUAT_VIEN': {
      const allowed = new Set(['MONITORING', 'DATA', 'SYSTEM', 'DOCUMENTS', 'DASHBOARD', 'ML']);
      return (fn) => {
        const m = fn.module.toUpperCase();
        if (!allowed.has(m)) return fn.code === 'VIEW_DASHBOARD';
        if (m === 'SYSTEM') return fn.actionType === 'VIEW';
        if (m === 'DASHBOARD') return fn.code.includes('VIEW_DASHBOARD');
        return ['VIEW', 'UPDATE'].includes(fn.actionType);
      };
    }

    case 'HOC_VIEN_QUAN_SU':
    case 'SINH_VIEN_DAN_SU':
    case 'HOC_VIEN_CAO_HOC':
    case 'HOC_VIEN':
    case 'SINH_VIEN': {
      const allowedCodes = new Set([
        'VIEW_DASHBOARD', 'VIEW_TRAINING', 'VIEW_COURSE', 'VIEW_GRADE',
        'VIEW_SCHEDULE', 'VIEW_ATTENDANCE', 'VIEW_ENROLLMENT',
        'VIEW_LEARNING_MATERIAL', 'DOWNLOAD_LEARNING_MATERIAL',
        'REGISTER_COURSE', 'REGISTER_EXAM', 'VIEW_EXAM',
        // M10 additions
        'VIEW_STUDENT', 'VIEW_THESIS', 'VIEW_WARNING', 'VIEW_GRADUATION',
      ]);
      return (fn) => allowedCodes.has(fn.code);
    }

    case 'CAN_BO_DANG': {
      const allowed = new Set(['PARTY', 'PERSONNEL', 'DASHBOARD', 'DOCUMENTS']);
      return (fn) => {
        const m = fn.module.toUpperCase();
        if (!allowed.has(m)) return fn.code === 'VIEW_DASHBOARD';
        if (m === 'DASHBOARD') return fn.code.includes('VIEW_DASHBOARD');
        return ['VIEW', 'CREATE', 'UPDATE', 'SUBMIT'].includes(fn.actionType);
      };
    }

    case 'CAN_BO_TO_CHUC': {
      const allowed = new Set(['PERSONNEL', 'PARTY', 'AWARDS', 'POLICY', 'DASHBOARD', 'DOCUMENTS']);
      return (fn) => {
        const m = fn.module.toUpperCase();
        if (!allowed.has(m)) return fn.code === 'VIEW_DASHBOARD';
        if (m === 'DASHBOARD') return fn.code.includes('VIEW_DASHBOARD');
        return ['VIEW', 'CREATE', 'UPDATE', 'SUBMIT', 'EXPORT'].includes(fn.actionType);
      };
    }

    case 'CAN_BO_TAI_CHINH': {
      const allowed = new Set(['INSURANCE', 'POLICY', 'AWARDS', 'DASHBOARD', 'DOCUMENTS', 'PERSONNEL']);
      return (fn) => {
        const m = fn.module.toUpperCase();
        if (!allowed.has(m)) return fn.code === 'VIEW_DASHBOARD';
        if (m === 'DASHBOARD') return fn.code.includes('VIEW_DASHBOARD');
        return ['VIEW', 'CREATE', 'UPDATE', 'SUBMIT', 'EXPORT'].includes(fn.actionType);
      };
    }

    case 'CAN_BO_THU_VIEN': {
      const allowed = new Set(['LEARNING_MATERIAL', 'DOCUMENTS', 'DASHBOARD']);
      return (fn) => {
        const m = fn.module.toUpperCase();
        if (!allowed.has(m)) return fn.code === 'VIEW_DASHBOARD';
        if (m === 'DASHBOARD') return fn.code.includes('VIEW_DASHBOARD');
        return ['VIEW', 'CREATE', 'UPDATE', 'IMPORT', 'EXPORT'].includes(fn.actionType);
      };
    }

    case 'QUAN_TRI_HE_THONG': {
      const allowed = new Set(['SYSTEM', 'DASHBOARD', 'AUDIT', 'MONITORING']);
      return (fn) => allowed.has(fn.module.toUpperCase());
    }

    case 'GUEST':
      return (fn) => fn.code === 'VIEW_DASHBOARD';

    default:
      return () => false;
  }
}

// ─── Helper Functions ─────────────────────────────────────────────────────────

async function ensureUnit(code: string) {
  let unit = await prisma.unit.findFirst({ where: { code } });
  if (!unit) {
    // fallback to any unit
    unit = await prisma.unit.findFirst({ orderBy: { createdAt: 'asc' } });
  }
  return unit;
}

async function upsertDemoUser(account: DemoAccount, hashedPassword: string) {
  const existing = await prisma.user.findUnique({ where: { email: account.email } });
  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: {
        name: account.name,
        password: hashedPassword,
        rank: account.rank,
        militaryId: account.militaryId,
        status: UserStatus.ACTIVE,
      },
    });
    console.log(`  ⏩ Updated: ${account.email}`);
    return existing.id;
  }

  const user = await prisma.user.create({
    data: {
      email: account.email,
      name: account.name,
      password: hashedPassword,
      rank: account.rank,
      militaryId: account.militaryId,
      department: account.unitCode,
      unit: account.unitCode,
      status: UserStatus.ACTIVE,
    } as any,
  });
  console.log(`  ✅ Created: ${account.email} | ${account.name}`);
  return user.id;
}

async function ensureUserPosition(userId: string, positionCode: string, unitId: string | null, isPrimary: boolean) {
  const position = await prisma.position.findUnique({ where: { code: positionCode } });
  if (!position) {
    console.warn(`  ⚠️  Position not found: ${positionCode}`);
    return;
  }

  const existing = await prisma.userPosition.findFirst({
    where: { userId, positionId: position.id, isActive: true },
  });

  if (!existing) {
    await prisma.userPosition.create({
      data: {
        userId,
        positionId: position.id,
        unitId,
        isPrimary,
        isActive: true,
        startDate: new Date('2024-01-01'),
      },
    });
    console.log(`    ↳ Assigned position: ${positionCode}`);
  } else {
    await prisma.userPosition.update({
      where: { id: existing.id },
      data: { isPrimary, unitId },
    });
    console.log(`    ↳ Position already assigned: ${positionCode}`);
  }
}

// ─── Refresh Position-Function Grants ─────────────────────────────────────────

async function refreshPositionFunctions() {
  console.log('\n📌 Refreshing Position-Function grants...');

  // Load all active functions from DB
  const dbFunctions: SeedFunction[] = await prisma.function.findMany({
    where: { isActive: true },
    select: { id: true, code: true, name: true, module: true, actionType: true, isCritical: true },
  }) as SeedFunction[];

  // Load all active positions
  const positions = await prisma.position.findMany({ where: { isActive: true } });

  let grantCount = 0;

  for (const position of positions) {
    const predicate = getFunctionAllowPredicate(position.code);
    const scope = resolveScope(position.code);
    const allowedFunctions = dbFunctions.filter(predicate);

    for (const fn of allowedFunctions) {
      await prisma.positionFunction.upsert({
        where: {
          positionId_functionId: { positionId: position.id, functionId: fn.id },
        },
        update: { scope, isActive: true },
        create: { positionId: position.id, functionId: fn.id, scope, isActive: true },
      });
      grantCount++;
    }

    console.log(`  ✅ ${position.code}: ${allowedFunctions.length} functions [${scope}]`);
  }

  console.log(`  Total grants upserted: ${grantCount}`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🚀 HVHC RBAC Demo Seed v2.0');
  console.log('================================================');
  console.log(`Password for all demo accounts: ${DEMO_PASSWORD}`);
  console.log('================================================\n');

  const hashedPassword = await bcrypt.hash(DEMO_PASSWORD, 10);

  // Step 1: Ensure all Functions exist in DB from FUNCTION_CODES catalog
  console.log('📌 Step 1: Syncing Function catalog...');
  const modules = FUNCTION_CODES as Record<string, Record<string, string>>;
  const dedup = new Map<string, string>();
  for (const [moduleKey, defs] of Object.entries(modules)) {
    for (const code of Object.values(defs)) {
      if (!dedup.has(code)) dedup.set(code, moduleKey);
    }
  }

  let newFunctions = 0;
  for (const [code, moduleKey] of dedup) {
    const existing = await prisma.function.findUnique({ where: { code } });
    if (!existing) {
      const verb = code.startsWith('VIEW_') ? 'Xem' : code.startsWith('CREATE_') ? 'Tạo'
        : code.startsWith('UPDATE_') ? 'Cập nhật' : code.startsWith('DELETE_') ? 'Xóa'
        : code.startsWith('APPROVE_') ? 'Phê duyệt' : code.startsWith('EXPORT_') ? 'Xuất'
        : code.startsWith('IMPORT_') ? 'Nhập' : code.startsWith('SUBMIT_') ? 'Gửi'
        : code.startsWith('MANAGE_') ? 'Quản lý' : 'Thực hiện';
      const rest = code.replace(/^(VIEW|CREATE|UPDATE|DELETE|APPROVE|REJECT|EXPORT|IMPORT|SUBMIT|MANAGE)_/, '');
      const actionType = code.startsWith('VIEW_') ? 'VIEW' : code.startsWith('CREATE_') ? 'CREATE'
        : code.startsWith('UPDATE_') ? 'UPDATE' : code.startsWith('DELETE_') ? 'DELETE'
        : code.startsWith('APPROVE_') ? 'APPROVE' : code.startsWith('REJECT_') ? 'REJECT'
        : code.startsWith('EXPORT_') ? 'EXPORT' : code.startsWith('IMPORT_') ? 'IMPORT'
        : code.startsWith('SUBMIT_') ? 'SUBMIT' : 'UPDATE';

      await prisma.function.create({
        data: {
          code,
          name: `${verb} ${rest.toLowerCase().replace(/_/g, ' ')}`.trim(),
          module: moduleKey.toLowerCase(),
          actionType: actionType as any,
          isActive: true,
          isCritical: ['MANAGE_USERS','MANAGE_RBAC','MANAGE_POSITIONS','MANAGE_FUNCTIONS',
            'RESET_USER_PASSWORD','VIEW_AUDIT_LOG','MANAGE_BACKUP'].includes(code),
        },
      });
      newFunctions++;
    }
  }
  console.log(`  → ${newFunctions} new functions added. Total: ${dedup.size}`);

  // Step 2: Refresh Position-Function grants
  await refreshPositionFunctions();

  // Step 3: Create/update demo accounts
  console.log('\n📌 Step 3: Creating demo accounts...');
  for (const account of DEMO_ACCOUNTS) {
    const unit = await ensureUnit(account.unitCode);
    const userId = await upsertDemoUser(account, hashedPassword);
    await ensureUserPosition(userId, account.positionCode, unit?.id || null, account.isPrimary);
    console.log(`    ✓ ${account.email} → ${account.positionCode} | ${account.description}`);
  }

  // Step 4: Summary
  console.log('\n================================================');
  console.log('✅ RBAC Demo Seed hoàn tất!');
  console.log('================================================');
  console.log('\nTài khoản demo (mật khẩu: Demo@2025):\n');

  const rows = [
    ['Email', 'Chức vụ', 'Mô tả'],
    ['─'.repeat(35), '─'.repeat(20), '─'.repeat(45)],
    ...DEMO_ACCOUNTS.map(a => [a.email, a.positionCode, a.description]),
  ];
  rows.forEach(r => console.log(`  ${r[0].padEnd(35)} ${r[1].padEnd(20)} ${r[2]}`));

  const fnTotal = await prisma.function.count({ where: { isActive: true } });
  const pfTotal = await prisma.positionFunction.count({ where: { isActive: true } });
  const posTotal = await prisma.position.count({ where: { isActive: true } });
  const upTotal = await prisma.userPosition.count({ where: { isActive: true } });

  console.log(`\nDB Stats:`);
  console.log(`  Functions:         ${fnTotal}`);
  console.log(`  Positions:         ${posTotal}`);
  console.log(`  PositionFunctions: ${pfTotal}`);
  console.log(`  UserPositions:     ${upTotal}`);
  console.log('================================================\n');
}

main()
  .catch((e) => { console.error('❌ Lỗi:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
