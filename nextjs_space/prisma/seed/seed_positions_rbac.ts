import { PrismaClient, ActionType, FunctionScope, Prisma } from '@prisma/client';
import 'dotenv/config';

// Dùng catalog function code hiện có của project
import { FUNCTION_CODES } from '../../lib/rbac/function-codes';

const prisma = new PrismaClient();

type SeedFunction = {
  code: string;
  name: string;
  description?: string;
  module: string;
  actionType: ActionType;
  isCritical: boolean;
};

type SeedPosition = {
  code: string;
  name: string;
  description?: string;
  level: number;
};

type SeedGrant = {
  positionCode: string;
  functionCode: string;
  scope: FunctionScope;
  conditions?: Record<string, unknown> | null;
};

function resolveActionType(code: string): ActionType {
  const normalized = code.toUpperCase();

  if (normalized.startsWith('VIEW_')) return 'VIEW';
  if (normalized.startsWith('CREATE_')) return 'CREATE';
  if (normalized.startsWith('UPDATE_')) return 'UPDATE';
  if (normalized.startsWith('DELETE_')) return 'DELETE';
  if (normalized.startsWith('APPROVE_')) return 'APPROVE';
  if (normalized.startsWith('REJECT_')) return 'REJECT';
  if (normalized.startsWith('EXPORT_')) return 'EXPORT';
  if (normalized.startsWith('IMPORT_')) return 'IMPORT';
  if (normalized.startsWith('SUBMIT_')) return 'SUBMIT';

  // Quy tắc chuẩn: code giữ nguyên MANAGE_*, nhưng actionType phải là enum thật
  if (normalized.startsWith('MANAGE_')) return 'UPDATE';

  return 'VIEW';
}

function humanizeFunctionName(code: string): string {
  const normalized = code.toUpperCase();
  const prefixMap: Array<[string, string]> = [
    ['VIEW_', 'Xem'],
    ['CREATE_', 'Tạo'],
    ['UPDATE_', 'Cập nhật'],
    ['DELETE_', 'Xóa'],
    ['APPROVE_', 'Phê duyệt'],
    ['REJECT_', 'Từ chối'],
    ['EXPORT_', 'Xuất'],
    ['IMPORT_', 'Nhập'],
    ['SUBMIT_', 'Gửi'],
    ['MANAGE_', 'Quản lý'],
  ];

  let verb = 'Thực hiện';
  let rest = normalized;

  for (const [prefix, label] of prefixMap) {
    if (normalized.startsWith(prefix)) {
      verb = label;
      rest = normalized.slice(prefix.length);
      break;
    }
  }

  return `${verb} ${rest.toLowerCase().replace(/_/g, ' ')}`.replace(/\s+/g, ' ').trim();
}

function isCriticalFunction(code: string): boolean {
  const normalized = code.toUpperCase();
  return [
    'MANAGE_USERS',
    'MANAGE_UNITS',
    'MANAGE_RBAC',
    'MANAGE_POSITIONS',
    'MANAGE_FUNCTIONS',
    'MANAGE_SOD',
    'RESET_USER_PASSWORD',
    'TOGGLE_USER_STATUS',
    'VIEW_AUDIT_LOG',
    'EXPORT_AUDIT_LOG',
    'VIEW_SYSTEM_HEALTH',
    'VIEW_SYSTEM_STATS',
    'MANAGE_BACKUP',
    'MANAGE_API_GATEWAY',
    'MANAGE_AI_CONFIG',
    'VIEW_DASHBOARD_ADMIN',
  ].includes(normalized);
}

function flattenFunctions(): SeedFunction[] {
  const dedup = new Map<string, SeedFunction>();

  const modules = FUNCTION_CODES as Record<string, Record<string, string>>;

  for (const [moduleKey, defs] of Object.entries(modules)) {
    for (const code of Object.values(defs)) {
      if (dedup.has(code)) continue;

      dedup.set(code, {
        code,
        name: humanizeFunctionName(code),
        description: `Seeded from FUNCTION_CODES.${moduleKey}`,
        module: moduleKey.toLowerCase(),
        actionType: resolveActionType(code),
        isCritical: isCriticalFunction(code),
      });
    }
  }

  return [...dedup.values()].sort((a, b) => a.code.localeCompare(b.code));
}

const POSITIONS: SeedPosition[] = [
  {
    code: 'SYSTEM_ADMIN',
    name: 'Quản trị hệ thống',
    description: 'Toàn quyền hệ thống',
    level: 100,
  },
  {
    code: 'PHO_GIAM_DOC',
    name: 'Chỉ huy Học viện',
    description: 'Quản lý cấp học viện',
    level: 90,
  },
  {
    code: 'TRUONG_KHOA',
    name: 'Chỉ huy Khoa/Phòng',
    description: 'Quản lý cấp khoa/phòng',
    level: 80,
  },
  {
    code: 'CHI_HUY_HE',
    name: 'Chỉ huy Hệ',
    description: 'Quản lý cấp hệ',
    level: 75,
  },
  {
    code: 'CHI_HUY_TIEU_DOAN',
    name: 'Chỉ huy Tiểu đoàn',
    description: 'Quản lý cấp tiểu đoàn',
    level: 74,
  },
  {
    code: 'CHI_HUY_BAN',
    name: 'Chỉ huy Ban',
    description: 'Quản lý cấp ban',
    level: 73,
  },
  {
    code: 'CHI_HUY_BO_MON',
    name: 'Chỉ huy Bộ môn',
    description: 'Quản lý cấp bộ môn',
    level: 72,
  },
  {
    code: 'CHU_NHIEM_BO_MON',
    name: 'Chủ nhiệm Bộ môn',
    description: 'Tương thích dữ liệu cũ',
    level: 71,
  },
  {
    code: 'GIANG_VIEN',
    name: 'Giảng viên',
    description: 'Giảng dạy và quản lý học vụ trong phạm vi đơn vị',
    level: 50,
  },
  {
    code: 'NGHIEN_CUU_VIEN',
    name: 'Nghiên cứu viên',
    description: 'Nghiên cứu khoa học',
    level: 50,
  },
  {
    code: 'TRO_LY',
    name: 'Trợ lý',
    description: 'Hỗ trợ nghiệp vụ',
    level: 45,
  },
  {
    code: 'NHAN_VIEN',
    name: 'Nhân viên',
    description: 'Nhân viên nghiệp vụ',
    level: 40,
  },
  {
    code: 'KY_THUAT_VIEN',
    name: 'Kỹ thuật viên',
    description: 'Hỗ trợ kỹ thuật',
    level: 40,
  },
  {
    code: 'HOC_VIEN_QUAN_SU',
    name: 'Học viên quân sự',
    description: 'Người học',
    level: 10,
  },
];

function allowForSystemAdmin(_fn: SeedFunction): boolean {
  return true;
}

function allowForPhoGiamDoc(fn: SeedFunction): boolean {
  if (fn.module === 'system') {
    return ['VIEW', 'EXPORT'].includes(fn.actionType) || fn.code === 'VIEW_DASHBOARD_ADMIN';
  }

  if (fn.module === 'dashboard') return true;

  return [
    'VIEW',
    'CREATE',
    'UPDATE',
    'APPROVE',
    'REJECT',
    'EXPORT',
    'IMPORT',
    'SUBMIT',
  ].includes(fn.actionType);
}

function allowForTruongKhoa(fn: SeedFunction): boolean {
  if (fn.module === 'system') {
    return ['VIEW', 'EXPORT'].includes(fn.actionType);
  }

  if (fn.module === 'dashboard') {
    return ['VIEW_DASHBOARD', 'VIEW_DASHBOARD_COMMAND', 'VIEW_DASHBOARD_FACULTY'].includes(fn.code);
  }

  return [
    'VIEW',
    'CREATE',
    'UPDATE',
    'APPROVE',
    'REJECT',
    'EXPORT',
    'IMPORT',
    'SUBMIT',
  ].includes(fn.actionType);
}

function allowForChiHuyBoMon(fn: SeedFunction): boolean {
  if (fn.module === 'system') {
    return ['VIEW'].includes(fn.actionType);
  }

  if (fn.module === 'dashboard') {
    return ['VIEW_DASHBOARD', 'VIEW_DASHBOARD_FACULTY'].includes(fn.code);
  }

  return [
    'VIEW',
    'CREATE',
    'UPDATE',
    'APPROVE',
    'REJECT',
    'EXPORT',
    'IMPORT',
    'SUBMIT',
  ].includes(fn.actionType);
}

function allowForGiangVien(fn: SeedFunction): boolean {
  const allowedModules = new Set([
    'training',
    'education',
    'faculty',
    'research',
    'question_bank',
    'learning_material',
    'documents',
    'dashboard',
    'ai',
  ]);

  if (!allowedModules.has(fn.module)) {
    return fn.code === 'VIEW_DASHBOARD' || fn.code === 'VIEW_DASHBOARD_FACULTY';
  }

  if (fn.module === 'dashboard') {
    return ['VIEW_DASHBOARD', 'VIEW_DASHBOARD_FACULTY'].includes(fn.code);
  }

  return [
    'VIEW',
    'CREATE',
    'UPDATE',
    'SUBMIT',
    'EXPORT',
    'IMPORT',
  ].includes(fn.actionType);
}

function allowForNghienCuuVien(fn: SeedFunction): boolean {
  const allowedModules = new Set([
    'research',
    'faculty',
    'documents',
    'data',
    'dashboard',
    'ai',
  ]);

  if (!allowedModules.has(fn.module)) {
    return fn.code === 'VIEW_DASHBOARD';
  }

  if (fn.module === 'dashboard') {
    return ['VIEW_DASHBOARD'].includes(fn.code);
  }

  return [
    'VIEW',
    'CREATE',
    'UPDATE',
    'SUBMIT',
    'EXPORT',
    'IMPORT',
  ].includes(fn.actionType);
}

function allowForTroLyNhanVienKyThuat(fn: SeedFunction): boolean {
  const allowedModules = new Set([
    'documents',
    'monitoring',
    'lab',
    'data',
    'dashboard',
    'system',
  ]);

  if (!allowedModules.has(fn.module)) {
    return fn.code === 'VIEW_DASHBOARD';
  }

  if (fn.module === 'system') {
    return ['VIEW'].includes(fn.actionType);
  }

  if (fn.module === 'dashboard') {
    return ['VIEW_DASHBOARD'].includes(fn.code);
  }

  return ['VIEW', 'UPDATE', 'EXPORT'].includes(fn.actionType);
}

function allowForHocVien(fn: SeedFunction): boolean {
  const allowedCodes = new Set([
    'VIEW_DASHBOARD',
    'VIEW_DASHBOARD_STUDENT',
    'VIEW_TRAINING',
    'VIEW_COURSE',
    'VIEW_GRADE',
    'VIEW_SCHEDULE',
    'VIEW_ATTENDANCE',
    'VIEW_ENROLLMENT',
    'VIEW_DOCUMENTS',
    'DOWNLOAD_LEARNING_MATERIAL',
    'REGISTER_COURSE',
    'REGISTER_EXAM',
  ]);

  if (allowedCodes.has(fn.code)) return true;

  return false;
}

function grantsForPosition(positionCode: string, functions: SeedFunction[]): SeedGrant[] {
  let predicate: (fn: SeedFunction) => boolean = () => false;
  let scope: FunctionScope = 'SELF';

  switch (positionCode) {
    case 'SYSTEM_ADMIN':
      predicate = allowForSystemAdmin;
      scope = 'ACADEMY';
      break;
    case 'PHO_GIAM_DOC':
      predicate = allowForPhoGiamDoc;
      scope = 'ACADEMY';
      break;
    case 'TRUONG_KHOA':
    case 'CHI_HUY_HE':
    case 'CHI_HUY_TIEU_DOAN':
    case 'CHI_HUY_BAN':
      predicate = allowForTruongKhoa;
      scope = 'DEPARTMENT';
      break;
    case 'CHI_HUY_BO_MON':
    case 'CHU_NHIEM_BO_MON':
      predicate = allowForChiHuyBoMon;
      scope = 'DEPARTMENT';
      break;
    case 'GIANG_VIEN':
      predicate = allowForGiangVien;
      scope = 'UNIT';
      break;
    case 'NGHIEN_CUU_VIEN':
      predicate = allowForNghienCuuVien;
      scope = 'UNIT';
      break;
    case 'TRO_LY':
    case 'NHAN_VIEN':
    case 'KY_THUAT_VIEN':
      predicate = allowForTroLyNhanVienKyThuat;
      scope = 'UNIT';
      break;
    case 'HOC_VIEN_QUAN_SU':
      predicate = allowForHocVien;
      scope = 'SELF';
      break;
    default:
      predicate = () => false;
      scope = 'SELF';
      break;
  }

  return functions
    .filter(predicate)
    .map((fn) => ({
      positionCode,
      functionCode: fn.code,
      scope,
      conditions: null,
    }));
}

async function seedFunctions(functions: SeedFunction[]) {
  console.log('\n📌 Seed Functions...');

  for (const fn of functions) {
    const existing = await prisma.function.findUnique({
      where: { code: fn.code },
    });

    if (!existing) {
      await prisma.function.create({
        data: {
          code: fn.code,
          name: fn.name,
          description: fn.description,
          module: fn.module,
          actionType: fn.actionType,
          isActive: true,
          isCritical: fn.isCritical,
        },
      });
      console.log(`  ✅ Tạo function: ${fn.code}`);
    } else {
      await prisma.function.update({
        where: { code: fn.code },
        data: {
          name: fn.name,
          description: fn.description,
          module: fn.module,
          actionType: fn.actionType,
          isActive: true,
          isCritical: fn.isCritical,
        },
      });
      console.log(`  ⏩ Function đã tồn tại: ${fn.code}`);
    }
  }
}

async function seedPositions() {
  console.log('\n📌 Seed Positions...');

  for (const pos of POSITIONS) {
    const existing = await prisma.position.findUnique({
      where: { code: pos.code },
    });

    if (!existing) {
      await prisma.position.create({
        data: {
          code: pos.code,
          name: pos.name,
          description: pos.description,
          level: pos.level,
          isActive: true,
        },
      });
      console.log(`  ✅ Tạo position: ${pos.code}`);
    } else {
      await prisma.position.update({
        where: { code: pos.code },
        data: {
          name: pos.name,
          description: pos.description,
          level: pos.level,
          isActive: true,
        },
      });
      console.log(`  ⏩ Position đã tồn tại: ${pos.code}`);
    }
  }
}

async function seedPositionGrants(grants: SeedGrant[]) {
  console.log('\n📌 Seed Position Grants...');

  for (const grant of grants) {
    const position = await prisma.position.findUnique({
      where: { code: grant.positionCode },
    });

    const fn = await prisma.function.findUnique({
      where: { code: grant.functionCode },
    });

    if (!position) {
      throw new Error(`Position không tồn tại: ${grant.positionCode}`);
    }

    if (!fn) {
      throw new Error(`Function không tồn tại: ${grant.functionCode}`);
    }

    await prisma.positionFunction.upsert({
      where: {
        positionId_functionId: {
          positionId: position.id,
          functionId: fn.id,
        },
      },
      update: {
        scope: grant.scope,
        conditions: grant.conditions !== null ? grant.conditions as unknown as Prisma.InputJsonValue : undefined,
        isActive: true,
      },
      create: {
        positionId: position.id,
        functionId: fn.id,
        scope: grant.scope,
        conditions: grant.conditions !== null ? grant.conditions as unknown as Prisma.InputJsonValue : undefined,
        isActive: true,
      },
    });

    console.log(`  ✅ Grant: ${grant.positionCode} -> ${grant.functionCode} [${grant.scope}]`);
  }
}

async function main() {
  console.log('🚀 Bắt đầu seed Positions & Functions RBAC...');

  const functions = flattenFunctions();

  await seedFunctions(functions);
  await seedPositions();

  const grants = POSITIONS.flatMap((pos) => grantsForPosition(pos.code, functions));
  await seedPositionGrants(grants);

  const totalFunctions = await prisma.function.count({
    where: { isActive: true },
  });

  const totalPositions = await prisma.position.count({
    where: { isActive: true },
  });

  const totalGrants = await prisma.positionFunction.count({
    where: { isActive: true },
  });

  console.log('\n==================================================');
  console.log('✅ Hoàn tất seed Positions & Functions RBAC');
  console.log(`Functions active : ${totalFunctions}`);
  console.log(`Positions active : ${totalPositions}`);
  console.log(`Grants active    : ${totalGrants}`);
  console.log('==================================================');
}

main()
  .catch((e) => {
    console.error('❌ Lỗi:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });