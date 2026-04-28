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
  // ── Cấp Quản trị ──────────────────────────────────────────
  {
    code: 'SYSTEM_ADMIN',
    name: 'Quản trị hệ thống',
    description: 'Toàn quyền hệ thống',
    level: 100,
  },
  // ── Cấp Học viện ──────────────────────────────────────────
  {
    code: 'GIAM_DOC',
    name: 'Giám đốc Học viện',
    description: 'VIEW toàn bộ CSDL + APPROVE cấp học viện (tốt nghiệp, NCKH, khen thưởng, kỷ luật)',
    level: 95,
  },
  {
    code: 'CHINH_UY',
    name: 'Chính ủy Học viện',
    description: 'VIEW toàn bộ CSDL, phụ trách chính trị tư tưởng',
    level: 93,
  },
  {
    code: 'PHO_CHINH_UY',
    name: 'Phó Chính ủy Học viện',
    description: 'VIEW toàn bộ CSDL, hỗ trợ Chính ủy',
    level: 92,
  },
  {
    code: 'PHO_GIAM_DOC',
    name: 'Phó Giám đốc Học viện',
    description: 'VIEW toàn bộ CSDL, phụ trách công tác được giao',
    level: 90,
  },
  {
    code: 'PHO_GIAM_DOC_KH',
    name: 'Phó Giám đốc phụ trách Khoa học',
    description: 'VIEW domain nghiên cứu khoa học, giảng viên, giáo dục',
    level: 88,
  },
  {
    code: 'PHO_GIAM_DOC_HC_HCKT',
    name: 'Phó Giám đốc phụ trách Hậu cần-Kỹ thuật',
    description: 'VIEW domain nhân sự, bảo hiểm, chính sách',
    level: 87,
  },
  // ── Cấp Khoa/Phòng ────────────────────────────────────────
  {
    code: 'TRUONG_KHOA',
    name: 'Trưởng Khoa',
    description: 'Quản lý cấp khoa: FACULTY + EDUCATION + RESEARCH',
    level: 80,
  },
  {
    code: 'PHO_TRUONG_KHOA',
    name: 'Phó Trưởng Khoa',
    description: 'Hỗ trợ Trưởng Khoa, không APPROVE/DELETE',
    level: 78,
  },
  {
    code: 'TRUONG_PHONG_DANG',
    name: 'Trưởng phòng Chính trị',
    description: 'Full CRUD: PARTY + AWARDS + PERSONNEL',
    level: 70,
  },
  {
    code: 'TRUONG_PHONG_DAO_TAO',
    name: 'Trưởng phòng Đào tạo',
    description: 'Full CRUD: EDUCATION + STUDENT + TRAINING + EXAM',
    level: 70,
  },
  {
    code: 'TRUONG_PHONG_NHAN_SU',
    name: 'Trưởng phòng Nhân sự/Hậu cần',
    description: 'Full CRUD: PERSONNEL + INSURANCE + POLICY',
    level: 70,
  },
  {
    code: 'TRUONG_PHONG_KHOA_HOC',
    name: 'Trưởng phòng Khoa học',
    description: 'Full CRUD: RESEARCH + SCIENCE',
    level: 70,
  },
  {
    code: 'TRUONG_PHONG_CHINH_SACH',
    name: 'Trưởng phòng Chính sách',
    description: 'Full CRUD: POLICY + INSURANCE',
    level: 70,
  },
  {
    code: 'PHO_TRUONG_PHONG',
    name: 'Phó Trưởng phòng',
    description: 'VIEW + CREATE + UPDATE, không APPROVE/DELETE',
    level: 65,
  },
  {
    code: 'B1_TRUONG_PHONG',
    name: 'Trưởng ban Đào tạo (B1)',
    description: 'Full CRUD tương đương Trưởng phòng Đào tạo',
    level: 68,
  },
  {
    code: 'B2_TRUONG_PHONG',
    name: 'Trưởng ban Khoa học (B2)',
    description: 'Full CRUD: RESEARCH + SCIENCE',
    level: 68,
  },
  {
    code: 'B3_CNCT',
    name: 'Chính trị viên Hệ (B3)',
    description: 'PARTY + AWARDS + student conduct trong đơn vị',
    level: 68,
  },
  {
    code: 'B3_PCNCT_BT',
    name: 'Phó Chính trị viên Hệ (B3)',
    description: 'PARTY + AWARDS, giới hạn DELETE',
    level: 65,
  },
  {
    code: 'CHI_HUY_KHOA',
    name: 'Chỉ huy Khoa',
    description: 'Quản lý cấp khoa tương đương Trưởng Khoa',
    level: 80,
  },
  {
    code: 'CHI_HUY_PHONG',
    name: 'Chỉ huy Phòng',
    description: 'Full CRUD PERSONNEL + INSURANCE + POLICY trong đơn vị',
    level: 70,
  },
  // ── Cấp Hệ/Tiểu đoàn/Ban ─────────────────────────────────
  {
    code: 'CHI_HUY_HE',
    name: 'Hệ trưởng',
    description: 'Quản lý học viên và rèn luyện trong Hệ',
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
  // ── Cấp Bộ môn ────────────────────────────────────────────
  {
    code: 'CHI_HUY_BO_MON',
    name: 'Chỉ huy Bộ môn',
    description: 'Quản lý cấp bộ môn',
    level: 72,
  },
  {
    code: 'CHU_NHIEM_BO_MON',
    name: 'Chủ nhiệm Bộ môn',
    description: 'Tương thích dữ liệu cũ, tương đương CHI_HUY_BO_MON',
    level: 71,
  },
  {
    code: 'PHO_CHU_NHIEM_BM',
    name: 'Phó Chủ nhiệm Bộ môn',
    description: 'Hỗ trợ Chủ nhiệm Bộ môn',
    level: 70,
  },
  // ── Cấp Cán bộ chuyên môn ─────────────────────────────────
  {
    code: 'GIANG_VIEN',
    name: 'Giảng viên',
    description: 'Giảng dạy và quản lý học vụ trong phạm vi đơn vị',
    level: 50,
  },
  {
    code: 'GIANG_VIEN_CHINH',
    name: 'Giảng viên chính',
    description: 'Giảng viên có thâm niên, tương đương GIANG_VIEN',
    level: 52,
  },
  {
    code: 'TRO_GIANG',
    name: 'Trợ giảng',
    description: 'Hỗ trợ giảng dạy, quyền tương đương GIANG_VIEN',
    level: 48,
  },
  {
    code: 'NGHIEN_CUU_VIEN',
    name: 'Nghiên cứu viên',
    description: 'Nghiên cứu khoa học, tập trung RESEARCH + SCIENCE',
    level: 50,
  },
  {
    code: 'TRO_LY',
    name: 'Trợ lý',
    description: 'Hỗ trợ nghiệp vụ hành chính',
    level: 45,
  },
  {
    code: 'NHAN_VIEN',
    name: 'Nhân viên',
    description: 'Nhân viên nghiệp vụ',
    level: 40,
  },
  {
    code: 'CHUYEN_VIEN',
    name: 'Chuyên viên',
    description: 'Chuyên viên nghiệp vụ, VIEW + CREATE',
    level: 42,
  },
  {
    code: 'KY_THUAT_VIEN',
    name: 'Kỹ thuật viên',
    description: 'Hỗ trợ kỹ thuật, giám sát hệ thống',
    level: 35,
  },
  {
    code: 'CAN_BO_DANG',
    name: 'Cán bộ Đảng',
    description: 'Cán bộ chuyên trách đảng vụ tại cơ quan chính trị',
    level: 42,
  },
  {
    code: 'CAN_BO_TO_CHUC',
    name: 'Cán bộ Tổ chức',
    description: 'Cán bộ chuyên trách công tác tổ chức',
    level: 42,
  },
  {
    code: 'CAN_BO_TAI_CHINH',
    name: 'Cán bộ Tài chính',
    description: 'Cán bộ kế toán/tài chính, INSURANCE + POLICY',
    level: 42,
  },
  {
    code: 'CAN_BO_THU_VIEN',
    name: 'Cán bộ Thư viện',
    description: 'Quản lý học liệu và kho tài liệu',
    level: 42,
  },
  // ── Cấp Người học ─────────────────────────────────────────
  {
    code: 'HOC_VIEN_QUAN_SU',
    name: 'Học viên quân sự',
    description: 'Học viên hệ chỉ huy, chỉ xem hồ sơ cá nhân',
    level: 10,
  },
  {
    code: 'HOC_VIEN_CAO_HOC',
    name: 'Học viên cao học',
    description: 'Học viên sau đại học, chỉ xem hồ sơ cá nhân',
    level: 10,
  },
  {
    code: 'SINH_VIEN',
    name: 'Sinh viên dân sự',
    description: 'Sinh viên cử nhân, chỉ xem hồ sơ học tập cá nhân',
    level: 10,
  },
  {
    code: 'SINH_VIEN_DAN_SU',
    name: 'Sinh viên dân sự',
    description: 'Alias cho SINH_VIEN để tương thích cũ',
    level: 10,
  },
  {
    code: 'GUEST',
    name: 'Khách',
    description: 'Chỉ xem dashboard cơ bản',
    level: 1,
  },
];

function allowForSystemAdmin(_fn: SeedFunction): boolean {
  return true;
}

function allowForGiamDoc(fn: SeedFunction): boolean {
  const m = fn.module.toUpperCase();
  if (m === 'SYSTEM') return fn.actionType === 'VIEW';
  if (m === 'DASHBOARD') return fn.code === 'VIEW_DASHBOARD' || fn.code === 'VIEW_DASHBOARD_COMMAND';
  if (m === 'PERSONAL') return true;
  if (['VIEW', 'EXPORT', 'DOWNLOAD'].includes(fn.actionType)) return true;
  // APPROVE/REJECT trong các domain nghiệp vụ cấp học viện
  const approveModules = new Set(['RESEARCH', 'SCIENCE', 'EDUCATION', 'AWARDS', 'POLICY', 'PARTY', 'WORKFLOW']);
  if (approveModules.has(m) && ['APPROVE', 'REJECT'].includes(fn.actionType)) return true;
  // Quyền đặc thù GĐ
  return ['FINALIZE_ACCEPTANCE', 'WF.OVERRIDE', 'EVALUATE_RESEARCH'].includes(fn.code);
}

function allowForPhoGiamDoc(fn: SeedFunction): boolean {
  if (fn.module === 'system') {
    return fn.actionType === 'VIEW';
  }
  if (fn.module === 'dashboard') {
    return fn.code === 'VIEW_DASHBOARD' || fn.code === 'VIEW_DASHBOARD_COMMAND';
  }
  if (fn.module === 'personal') return true;
  return ['VIEW', 'EXPORT', 'DOWNLOAD'].includes(fn.actionType);
}

function allowForPhoGiamDocKH(fn: SeedFunction): boolean {
  const allowedModules = new Set(['research', 'science', 'faculty', 'education', 'personal']);
  const m = fn.module.toLowerCase();
  if (m === 'dashboard') return fn.code === 'VIEW_DASHBOARD' || fn.code === 'VIEW_DASHBOARD_COMMAND';
  if (!allowedModules.has(m)) return false;
  return ['VIEW', 'EXPORT', 'DOWNLOAD'].includes(fn.actionType);
}

function allowForPhoGiamDocHCHCKT(fn: SeedFunction): boolean {
  const allowedModules = new Set(['personnel', 'insurance', 'policy', 'awards', 'personal']);
  const m = fn.module.toLowerCase();
  if (m === 'dashboard') return fn.code === 'VIEW_DASHBOARD' || fn.code === 'VIEW_DASHBOARD_COMMAND';
  if (!allowedModules.has(m)) return false;
  return ['VIEW', 'EXPORT', 'DOWNLOAD'].includes(fn.actionType);
}

function allowForTruongPhongDang(fn: SeedFunction): boolean {
  const m = fn.module.toUpperCase();
  if (m === 'PARTY' || m === 'AWARDS') return true;
  if (m === 'PERSONNEL') return true;
  if (m === 'DASHBOARD') return fn.code === 'VIEW_DASHBOARD';
  if (m === 'PERSONAL') return true;
  if (m === 'DOCUMENTS') return ['VIEW', 'CREATE', 'EXPORT', 'DOWNLOAD', 'SEARCH'].includes(fn.actionType);
  return false;
}

function allowForTruongPhongDaoTao(fn: SeedFunction): boolean {
  const fullModules = new Set(['EDUCATION', 'STUDENT', 'TRAINING', 'EXAM', 'QUESTION_BANK', 'LEARNING_MATERIAL']);
  const m = fn.module.toUpperCase();
  if (fullModules.has(m)) return true;
  if (m === 'FACULTY') return ['VIEW', 'EXPORT'].includes(fn.actionType);
  if (m === 'PERSONNEL') return ['VIEW', 'EXPORT'].includes(fn.actionType);
  if (m === 'DASHBOARD') return fn.code === 'VIEW_DASHBOARD';
  if (m === 'PERSONAL') return true;
  return false;
}

function allowForTruongPhongNhanSu(fn: SeedFunction): boolean {
  const fullModules = new Set(['PERSONNEL', 'INSURANCE', 'POLICY']);
  const m = fn.module.toUpperCase();
  if (fullModules.has(m)) return true;
  if (m === 'AWARDS') return ['VIEW', 'EXPORT'].includes(fn.actionType);
  if (m === 'DASHBOARD') return fn.code === 'VIEW_DASHBOARD';
  if (m === 'PERSONAL') return true;
  return false;
}

function allowForTruongPhongKhoaHoc(fn: SeedFunction): boolean {
  const fullModules = new Set(['RESEARCH', 'SCIENCE']);
  const m = fn.module.toUpperCase();
  if (fullModules.has(m)) return true;
  if (m === 'FACULTY') return ['VIEW', 'EXPORT'].includes(fn.actionType);
  if (m === 'DASHBOARD') return fn.code === 'VIEW_DASHBOARD';
  if (m === 'PERSONAL') return true;
  return false;
}

function allowForTruongPhongChinhSach(fn: SeedFunction): boolean {
  const m = fn.module.toUpperCase();
  if (m === 'POLICY' || m === 'INSURANCE') return true;
  if (m === 'PERSONNEL') return ['VIEW', 'EXPORT'].includes(fn.actionType);
  if (m === 'DASHBOARD') return fn.code === 'VIEW_DASHBOARD';
  if (m === 'PERSONAL') return true;
  return false;
}

function allowForPhoTruongPhong(fn: SeedFunction): boolean {
  const m = fn.module.toUpperCase();
  const limited = new Set(['VIEW', 'CREATE', 'UPDATE', 'EXPORT', 'IMPORT', 'SUBMIT']);
  if (m === 'PERSONNEL' || m === 'INSURANCE' || m === 'POLICY') return limited.has(fn.actionType);
  if (m === 'AWARDS') return ['VIEW', 'EXPORT'].includes(fn.actionType);
  if (m === 'DASHBOARD') return fn.code === 'VIEW_DASHBOARD';
  if (m === 'PERSONAL') return true;
  return false;
}

function allowForCanBoDang(fn: SeedFunction): boolean {
  const m = fn.module.toUpperCase();
  if (m === 'PARTY') return !['UPDATE', 'APPROVE', 'DELETE'].includes(fn.actionType);
  if (m === 'AWARDS') return ['VIEW', 'CREATE', 'EXPORT'].includes(fn.actionType);
  if (m === 'PERSONNEL') return ['VIEW', 'CREATE', 'EXPORT'].includes(fn.actionType);
  if (m === 'DASHBOARD') return fn.code === 'VIEW_DASHBOARD';
  if (m === 'PERSONAL') return true;
  return false;
}

function allowForCanBoTaiChinh(fn: SeedFunction): boolean {
  const m = fn.module.toUpperCase();
  if (m === 'INSURANCE') return true;
  if (m === 'POLICY') return ['VIEW', 'CREATE', 'UPDATE', 'EXPORT'].includes(fn.actionType);
  if (m === 'AWARDS') return ['VIEW', 'EXPORT'].includes(fn.actionType);
  if (m === 'PERSONNEL') return ['VIEW', 'EXPORT'].includes(fn.actionType);
  if (m === 'DASHBOARD') return fn.code === 'VIEW_DASHBOARD';
  if (m === 'PERSONAL') return true;
  return false;
}

function allowForCanBoThuVien(fn: SeedFunction): boolean {
  const m = fn.module.toUpperCase();
  if (m === 'LEARNING_MATERIAL') return true;
  if (m === 'DOCUMENTS') return ['VIEW', 'CREATE', 'SEARCH', 'DOWNLOAD', 'UPLOAD', 'EXPORT'].includes(fn.actionType);
  if (m === 'DASHBOARD') return fn.code === 'VIEW_DASHBOARD';
  if (m === 'PERSONAL') return true;
  return false;
}

function allowForKyThuatVien(fn: SeedFunction): boolean {
  const m = fn.module.toUpperCase();
  if (m === 'MONITORING') return fn.actionType === 'VIEW' || fn.code.startsWith('VIEW_');
  if (m === 'SYSTEM') return ['VIEW_SYSTEM_HEALTH', 'VIEW_INFRASTRUCTURE', 'VIEW_SYSTEM_STATS'].includes(fn.code);
  if (m === 'DATA') return ['VIEW', 'QUERY'].includes(fn.actionType);
  if (m === 'DOCUMENTS') return fn.actionType === 'VIEW';
  if (m === 'DASHBOARD') return fn.code === 'VIEW_DASHBOARD';
  if (m === 'PERSONAL') return true;
  return false;
}

function allowForChiHuyHe(fn: SeedFunction): boolean {
  const m = fn.module.toUpperCase();
  if (m === 'STUDENT') return true;
  if (m === 'EDUCATION') return ['VIEW', 'MANAGE_CONDUCT'].includes(fn.actionType) || fn.actionType === 'VIEW';
  if (m === 'TRAINING') return ['VIEW', 'VIEW_GRADE'].includes(fn.actionType);
  if (m === 'PERSONNEL') return ['VIEW', 'EXPORT'].includes(fn.actionType);
  if (m === 'PARTY') return fn.actionType === 'VIEW';
  if (m === 'AWARDS') return ['VIEW', 'EXPORT'].includes(fn.actionType);
  if (m === 'DASHBOARD') return fn.code === 'VIEW_DASHBOARD';
  if (m === 'PERSONAL') return true;
  return false;
}

function allowForSinhVien(fn: SeedFunction): boolean {
  const whitelist = new Set([
    'VIEW_DASHBOARD', 'VIEW_DASHBOARD_STUDENT',
    'MANAGE_MY_PROFILE', 'VIEW_MY_NOTIFICATIONS', 'VIEW_MY_TASKS',
    'MANAGE_MY_SECURITY', 'VIEW_MY_CAREER_HISTORY', 'REQUEST_MY_INFO_UPDATE',
    'VIEW_MY_GRADE', 'VIEW_MY_CONDUCT', 'VIEW_MY_SCHEDULE',
    'VIEW_MY_GRADUATION', 'VIEW_MY_AWARD', 'VIEW_MY_POLICY',
    'VIEW_MY_INSURANCE', 'VIEW_MY_RESEARCH', 'VIEW_MY_PUBLICATIONS',
    'VIEW_STUDENT', 'VIEW_COURSE', 'VIEW_GRADE', 'VIEW_SCHEDULE',
    'VIEW_ATTENDANCE', 'VIEW_ENROLLMENT', 'VIEW_THESIS',
    'VIEW_WARNING', 'VIEW_GRADUATION', 'VIEW_REPOSITORY',
    'VIEW_TRAINING', 'VIEW_LEARNING_MATERIAL', 'DOWNLOAD_LEARNING_MATERIAL',
    'REGISTER_COURSE', 'REGISTER_EXAM', 'VIEW_EXAM_REG',
    'VIEW_EXAM_SESSION', 'VIEW_EXAM_PLAN',
  ]);
  return whitelist.has(fn.code);
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
    // ── Cấp Quản trị ──
    case 'SYSTEM_ADMIN':
      predicate = allowForSystemAdmin;
      scope = 'ACADEMY';
      break;

    // ── Cấp Học viện (ACADEMY scope) ──
    case 'GIAM_DOC':
      predicate = allowForGiamDoc;
      scope = 'ACADEMY';
      break;
    case 'CHINH_UY':
    case 'PHO_CHINH_UY':
      predicate = allowForPhoGiamDoc; // VIEW-only toàn bộ
      scope = 'ACADEMY';
      break;
    case 'PHO_GIAM_DOC':
      predicate = allowForPhoGiamDoc;
      scope = 'ACADEMY';
      break;
    case 'PHO_GIAM_DOC_KH':
      predicate = allowForPhoGiamDocKH;
      scope = 'ACADEMY';
      break;
    case 'PHO_GIAM_DOC_HC_HCKT':
      predicate = allowForPhoGiamDocHCHCKT;
      scope = 'ACADEMY';
      break;

    // ── Cấp Khoa/Phòng (DEPARTMENT scope) ──
    case 'TRUONG_KHOA':
    case 'PHO_TRUONG_KHOA':
    case 'CHI_HUY_KHOA':
      predicate = allowForTruongKhoa;
      scope = 'DEPARTMENT';
      break;
    case 'TRUONG_PHONG_DANG':
    case 'B3_CNCT':
    case 'B3_PCNCT_BT':
      predicate = allowForTruongPhongDang;
      scope = 'DEPARTMENT';
      break;
    case 'TRUONG_PHONG_DAO_TAO':
    case 'B1_TRUONG_PHONG':
      predicate = allowForTruongPhongDaoTao;
      scope = 'DEPARTMENT';
      break;
    case 'TRUONG_PHONG_NHAN_SU':
    case 'CHI_HUY_PHONG':
      predicate = allowForTruongPhongNhanSu;
      scope = 'DEPARTMENT';
      break;
    case 'TRUONG_PHONG_KHOA_HOC':
    case 'B2_TRUONG_PHONG':
      predicate = allowForTruongPhongKhoaHoc;
      scope = 'DEPARTMENT';
      break;
    case 'TRUONG_PHONG_CHINH_SACH':
      predicate = allowForTruongPhongChinhSach;
      scope = 'DEPARTMENT';
      break;
    case 'PHO_TRUONG_PHONG':
      predicate = allowForPhoTruongPhong;
      scope = 'DEPARTMENT';
      break;

    // ── Cấp Hệ/Tiểu đoàn/Ban (UNIT scope) ──
    case 'CHI_HUY_HE':
    case 'CHI_HUY_TIEU_DOAN':
    case 'CHI_HUY_BAN':
      predicate = allowForChiHuyHe;
      scope = 'UNIT';
      break;

    // ── Cấp Bộ môn (UNIT scope) ──
    case 'CHI_HUY_BO_MON':
    case 'CHU_NHIEM_BO_MON':
    case 'PHO_CHU_NHIEM_BM':
      predicate = allowForChiHuyBoMon;
      scope = 'UNIT';
      break;

    // ── Cán bộ chuyên môn (UNIT scope) ──
    case 'GIANG_VIEN':
    case 'GIANG_VIEN_CHINH':
    case 'TRO_GIANG':
      predicate = allowForGiangVien;
      scope = 'UNIT';
      break;
    case 'NGHIEN_CUU_VIEN':
      predicate = allowForNghienCuuVien;
      scope = 'UNIT';
      break;
    case 'TRO_LY':
    case 'NHAN_VIEN':
    case 'CHUYEN_VIEN':
      predicate = allowForTroLyNhanVienKyThuat;
      scope = 'UNIT';
      break;
    case 'KY_THUAT_VIEN':
      predicate = allowForKyThuatVien;
      scope = 'UNIT';
      break;
    case 'CAN_BO_DANG':
    case 'CAN_BO_TO_CHUC':
      predicate = allowForCanBoDang;
      scope = 'UNIT';
      break;
    case 'CAN_BO_TAI_CHINH':
      predicate = allowForCanBoTaiChinh;
      scope = 'UNIT';
      break;
    case 'CAN_BO_THU_VIEN':
      predicate = allowForCanBoThuVien;
      scope = 'UNIT';
      break;

    // ── Người học (SELF scope) ──
    case 'HOC_VIEN_QUAN_SU':
    case 'HOC_VIEN_CAO_HOC':
      predicate = allowForHocVien;
      scope = 'SELF';
      break;
    case 'SINH_VIEN':
    case 'SINH_VIEN_DAN_SU':
      predicate = allowForSinhVien;
      scope = 'SELF';
      break;
    case 'GUEST':
      predicate = (fn) => fn.code === 'VIEW_DASHBOARD';
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