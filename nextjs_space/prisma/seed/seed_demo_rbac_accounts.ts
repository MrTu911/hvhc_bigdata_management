/**
 * seed_demo_rbac_accounts.ts
 *
 * Tạo 13 tài khoản demo chuẩn theo từng nhóm chức vụ HVHC.
 * Đồng thời refresh toàn bộ PositionFunction grants cho 46 positions.
 *
 * Chạy: npx tsx --require dotenv/config prisma/seed/seed_demo_rbac_accounts.ts
 *
 * Tài khoản demo:
 *   admin@demo.hvhc.edu.vn      → SYSTEM_ADMIN   (toàn quyền)
 *   giamdoc@demo.hvhc.edu.vn   → GIAM_DOC        (VIEW ALL)
 *   chinhuy@demo.hvhc.edu.vn   → CHINH_UY        (VIEW ALL)
 *   pgd.kh@demo.hvhc.edu.vn    → PHO_GIAM_DOC_KH (VIEW science domain)
 *   tpct@demo.hvhc.edu.vn      → TRUONG_PHONG_DANG   (full CRUD Chính trị)
 *   ctv.he@demo.hvhc.edu.vn    → B3_CNCT         (CTCT Hệ)
 *   tpdt@demo.hvhc.edu.vn      → TRUONG_PHONG_DAO_TAO (full CRUD Đào tạo)
 *   tpns@demo.hvhc.edu.vn      → TRUONG_PHONG_NHAN_SU (full CRUD Nhân sự)
 *   truongkhoa@demo.hvhc.edu.vn → TRUONG_KHOA    (quản lý Khoa)
 *   chihuyhe@demo.hvhc.edu.vn  → CHI_HUY_HE      (quản lý Hệ)
 *   giangvien@demo.hvhc.edu.vn → GIANG_VIEN      (giảng dạy)
 *   hocvien@demo.hvhc.edu.vn   → HOC_VIEN_QUAN_SU (SELF)
 *   sinhvien@demo.hvhc.edu.vn  → SINH_VIEN       (SELF)
 *
 *   Mật khẩu: Demo@2025 (hoặc env DEMO_PASSWORD)
 */

import { PrismaClient, UserStatus, FunctionScope } from '@prisma/client';
import bcrypt from 'bcryptjs';
import 'dotenv/config';
import { FUNCTION_CODES } from '../../lib/rbac/function-codes';

const prisma = new PrismaClient();
const DEMO_PASSWORD = process.env.DEMO_PASSWORD || 'Demo@2025';

// ────────────────────────────────────────────────────────────
// DEMO ACCOUNTS
// ────────────────────────────────────────────────────────────

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
    description: 'Toàn quyền — quản trị hệ thống RBAC, users, audit',
  },
  {
    email: 'giamdoc@demo.hvhc.edu.vn',
    name: 'Thiếu tướng Nguyễn Văn Hòa',
    rank: 'Thiếu tướng',
    militaryId: 'DEMO_GD_001',
    positionCode: 'GIAM_DOC',
    positionScope: 'ACADEMY',
    unitCode: 'BGD',
    isPrimary: true,
    description: 'Giám đốc Học viện — VIEW toàn bộ CSDL',
  },
  {
    email: 'chinhuy@demo.hvhc.edu.vn',
    name: 'Thiếu tướng Trần Văn Đức',
    rank: 'Thiếu tướng',
    militaryId: 'DEMO_CU_001',
    positionCode: 'CHINH_UY',
    positionScope: 'ACADEMY',
    unitCode: 'BGD',
    isPrimary: true,
    description: 'Chính ủy Học viện — VIEW toàn bộ CSDL',
  },
  {
    email: 'pgd.kh@demo.hvhc.edu.vn',
    name: 'Đại tá Lê Minh Khoa',
    rank: 'Đại tá',
    militaryId: 'DEMO_PGD_KH_001',
    positionCode: 'PHO_GIAM_DOC_KH',
    positionScope: 'ACADEMY',
    unitCode: 'BGD',
    isPrimary: true,
    description: 'Phó GĐ phụ trách Khoa học — VIEW RESEARCH, SCIENCE, FACULTY',
  },
  {
    email: 'tpct@demo.hvhc.edu.vn',
    name: 'Thượng tá Phạm Đức Dũng',
    rank: 'Thượng tá',
    militaryId: 'DEMO_TPCT_001',
    positionCode: 'TRUONG_PHONG_DANG',
    positionScope: 'DEPARTMENT',
    unitCode: 'B3',
    isPrimary: true,
    description: 'Trưởng phòng Chính trị — full CRUD PARTY + AWARDS + PERSONNEL',
  },
  {
    email: 'ctv.he@demo.hvhc.edu.vn',
    name: 'Trung tá Nguyễn Văn Chính',
    rank: 'Trung tá',
    militaryId: 'DEMO_CTV_001',
    positionCode: 'B3_CNCT',
    positionScope: 'UNIT',
    unitCode: 'HE2',
    isPrimary: true,
    description: 'Chính trị viên Hệ 2 — PARTY + AWARDS + student conduct UNIT scope',
  },
  {
    email: 'tpdt@demo.hvhc.edu.vn',
    name: 'Đại tá Vũ Thanh Long',
    rank: 'Đại tá',
    militaryId: 'DEMO_TPDT_001',
    positionCode: 'TRUONG_PHONG_DAO_TAO',
    positionScope: 'DEPARTMENT',
    unitCode: 'B1',
    isPrimary: true,
    description: 'Trưởng phòng Đào tạo — full CRUD EDUCATION + STUDENT + EXAM',
  },
  {
    email: 'tpns@demo.hvhc.edu.vn',
    name: 'Thượng tá Trần Thị Hương',
    rank: 'Thượng tá',
    militaryId: 'DEMO_TPNS_001',
    positionCode: 'TRUONG_PHONG_NHAN_SU',
    positionScope: 'DEPARTMENT',
    unitCode: 'B4',
    isPrimary: true,
    description: 'Trưởng phòng Hậu cần — full CRUD PERSONNEL + INSURANCE + POLICY',
  },
  {
    email: 'truongkhoa@demo.hvhc.edu.vn',
    name: 'Đại tá Phạm Đức Lực',
    rank: 'Đại tá',
    militaryId: 'DEMO_TK_001',
    positionCode: 'TRUONG_KHOA',
    positionScope: 'DEPARTMENT',
    unitCode: 'K1',
    isPrimary: true,
    description: 'Trưởng Khoa Chỉ huy HC — FACULTY + EDUCATION + RESEARCH',
  },
  {
    email: 'chihuyhe@demo.hvhc.edu.vn',
    name: 'Thượng tá Lê Văn Hùng',
    rank: 'Thượng tá',
    militaryId: 'DEMO_CHE_001',
    positionCode: 'CHI_HUY_HE',
    positionScope: 'UNIT',
    unitCode: 'HE3',
    isPrimary: true,
    description: 'Hệ trưởng Hệ 3 — quản lý học viên + rèn luyện',
  },
  {
    email: 'giangvien@demo.hvhc.edu.vn',
    name: 'Trung tá Nguyễn Văn Bình',
    rank: 'Trung tá',
    militaryId: 'DEMO_GV_001',
    positionCode: 'GIANG_VIEN',
    positionScope: 'UNIT',
    unitCode: 'K1',
    isPrimary: true,
    description: 'Giảng viên Khoa HC — EDUCATION + RESEARCH',
  },
  {
    email: 'hocvien@demo.hvhc.edu.vn',
    name: 'Thiếu tá Trần Văn Tuân',
    rank: 'Thiếu tá',
    militaryId: 'DEMO_HV_001',
    positionCode: 'HOC_VIEN_QUAN_SU',
    positionScope: 'SELF',
    unitCode: 'HE2',
    isPrimary: true,
    description: 'Học viên Hệ chỉ huy — chỉ xem hồ sơ cá nhân',
  },
  {
    email: 'sinhvien@demo.hvhc.edu.vn',
    name: 'Binh nhất Nguyễn Văn Anh',
    rank: 'Binh nhất',
    militaryId: 'DEMO_SV_001',
    positionCode: 'SINH_VIEN',
    positionScope: 'SELF',
    unitCode: 'DD_TD1_1',
    isPrimary: true,
    description: 'Sinh viên cử nhân — chỉ xem hồ sơ học tập cá nhân',
  },
];

// Map positionCode → legacy role (backward compat với session.user.role)
const POSITION_TO_LEGACY_ROLE: Record<string, string> = {
  SYSTEM_ADMIN:           'QUAN_TRI_HE_THONG',
  QUAN_TRI_HE_THONG:      'QUAN_TRI_HE_THONG',
  GIAM_DOC:               'CHI_HUY_HOC_VIEN',
  CHINH_UY:               'CHI_HUY_HOC_VIEN',
  PHO_CHINH_UY:           'CHI_HUY_HOC_VIEN',
  PHO_GIAM_DOC:           'CHI_HUY_HOC_VIEN',
  PHO_GIAM_DOC_KH:        'CHI_HUY_HOC_VIEN',
  PHO_GIAM_DOC_HC_HCKT:   'CHI_HUY_HOC_VIEN',
  TRUONG_PHONG_DANG:      'CHI_HUY_KHOA_PHONG',
  TRUONG_PHONG_DAO_TAO:   'CHI_HUY_KHOA_PHONG',
  TRUONG_PHONG_NHAN_SU:   'CHI_HUY_KHOA_PHONG',
  TRUONG_PHONG_KHOA_HOC:  'CHI_HUY_KHOA_PHONG',
  TRUONG_PHONG_CHINH_SACH:'CHI_HUY_KHOA_PHONG',
  B1_TRUONG_PHONG:        'CHI_HUY_KHOA_PHONG',
  B2_TRUONG_PHONG:        'CHI_HUY_KHOA_PHONG',
  B3_CNCT:                'CHI_HUY_KHOA_PHONG',
  B3_PCNCT_BT:            'CHI_HUY_KHOA_PHONG',
  CHI_HUY_KHOA:           'CHI_HUY_KHOA_PHONG',
  CHI_HUY_PHONG:          'CHI_HUY_KHOA_PHONG',
  PHO_TRUONG_PHONG:       'CHI_HUY_KHOA_PHONG',
  TRUONG_KHOA:            'CHI_HUY_KHOA_PHONG',
  PHO_TRUONG_KHOA:        'CHI_HUY_KHOA_PHONG',
  CHU_NHIEM_BO_MON:       'CHU_NHIEM_BO_MON',
  CHI_HUY_BO_MON:         'CHU_NHIEM_BO_MON',
  PHO_CHU_NHIEM_BM:       'CHU_NHIEM_BO_MON',
  CHI_HUY_HE:             'CHI_HUY_KHOA_PHONG',
  CHI_HUY_TIEU_DOAN:      'CHI_HUY_KHOA_PHONG',
  CHI_HUY_BAN:            'CHI_HUY_KHOA_PHONG',
  GIANG_VIEN:             'GIANG_VIEN',
  GIANG_VIEN_CHINH:       'GIANG_VIEN',
  TRO_GIANG:              'GIANG_VIEN',
  NGHIEN_CUU_VIEN:        'NGHIEN_CUU_VIEN',
  CAN_BO_DANG:            'KY_THUAT_VIEN',
  CAN_BO_TO_CHUC:         'KY_THUAT_VIEN',
  CAN_BO_TAI_CHINH:       'KY_THUAT_VIEN',
  CAN_BO_THU_VIEN:        'KY_THUAT_VIEN',
  TRO_LY:                 'KY_THUAT_VIEN',
  NHAN_VIEN:              'KY_THUAT_VIEN',
  CHUYEN_VIEN:            'KY_THUAT_VIEN',
  KY_THUAT_VIEN:          'KY_THUAT_VIEN',
  HOC_VIEN_QUAN_SU:       'HOC_VIEN_SINH_VIEN',
  HOC_VIEN:               'HOC_VIEN_SINH_VIEN',
  HOC_VIEN_CAO_HOC:       'HOC_VIEN_SINH_VIEN',
  SINH_VIEN:              'HOC_VIEN_SINH_VIEN',
  SINH_VIEN_DAN_SU:       'HOC_VIEN_SINH_VIEN',
  GUEST:                  'HOC_VIEN_SINH_VIEN',
};

// ────────────────────────────────────────────────────────────
// FUNCTION PREDICATE TYPES
// ────────────────────────────────────────────────────────────

type SeedFunction = {
  id: string;
  code: string;
  name: string;
  module: string;
  actionType: string;
  isCritical: boolean;
};

// ────────────────────────────────────────────────────────────
// resolveScope — scope cho từng position
// ────────────────────────────────────────────────────────────

function resolveScope(positionCode: string): FunctionScope {
  const ACADEMY = new Set([
    'SYSTEM_ADMIN', 'QUAN_TRI_HE_THONG',
    'GIAM_DOC', 'CHINH_UY', 'PHO_CHINH_UY',
    'PHO_GIAM_DOC', 'PHO_GIAM_DOC_KH', 'PHO_GIAM_DOC_HC_HCKT',
  ]);
  const DEPARTMENT = new Set([
    'TRUONG_PHONG_DANG', 'TRUONG_PHONG_DAO_TAO', 'TRUONG_PHONG_NHAN_SU',
    'TRUONG_PHONG_KHOA_HOC', 'TRUONG_PHONG_CHINH_SACH', 'PHO_TRUONG_PHONG',
    'B1_TRUONG_PHONG', 'B2_TRUONG_PHONG', 'B2_TRUONG_PHÒNG', // B2 có 2 variants trong DB
    'B3_CNCT', 'B3_PCNCT_BT',
    'CHI_HUY_KHOA', 'CHI_HUY_PHONG',
    'TRUONG_KHOA', 'PHO_TRUONG_KHOA',
  ]);
  const UNIT = new Set([
    'CHU_NHIEM_BO_MON', 'CHI_HUY_BO_MON', 'PHO_CHU_NHIEM_BM',
    'GIANG_VIEN', 'GIANG_VIEN_CHINH', 'TRO_GIANG', 'NGHIEN_CUU_VIEN',
    'TRO_LY', 'NHAN_VIEN', 'CHUYEN_VIEN', 'KY_THUAT_VIEN',
    'CAN_BO_DANG', 'CAN_BO_TO_CHUC', 'CAN_BO_TAI_CHINH', 'CAN_BO_THU_VIEN',
    'CHI_HUY_HE', 'CHI_HUY_TIEU_DOAN', 'CHI_HUY_BAN',
  ]);

  if (ACADEMY.has(positionCode)) return 'ACADEMY';
  if (DEPARTMENT.has(positionCode)) return 'DEPARTMENT';
  if (UNIT.has(positionCode)) return 'UNIT';
  return 'SELF';
}

// ────────────────────────────────────────────────────────────
// getFunctionAllowPredicate — phân quyền theo nhóm
// ────────────────────────────────────────────────────────────

function getFunctionAllowPredicate(positionCode: string): (fn: SeedFunction) => boolean {
  // ── Nhóm P: Quản trị hệ thống ─────────────────────────────
  if (positionCode === 'SYSTEM_ADMIN') return () => true;

  if (positionCode === 'QUAN_TRI_HE_THONG') {
    const allowed = new Set(['SYSTEM', 'DASHBOARD', 'AUDIT', 'MONITORING', 'SECURITY']);
    return (fn) => allowed.has(fn.module.toUpperCase());
  }

  // ── Nhóm A0: Giám đốc Học viện — VIEW ALL + APPROVE cấp học viện ────
  // GIAM_DOC có quyền phê duyệt các nghiệp vụ cấp học viện (tốt nghiệp, NCKH,
  // khen thưởng, kỷ luật, đảng vụ). Không có CRUD để tránh chồng chức năng phòng ban.
  if (positionCode === 'GIAM_DOC') {
    const viewActions = new Set(['VIEW', 'EXPORT', 'DOWNLOAD']);
    // Modules được phép phê duyệt ở cấp học viện
    const approveModules = new Set(['RESEARCH', 'SCIENCE', 'EDUCATION', 'AWARDS', 'POLICY', 'PARTY', 'WORKFLOW']);
    return (fn) => {
      const m = fn.module.toUpperCase();
      if (m === 'SYSTEM') return fn.actionType === 'VIEW';
      if (m === 'DASHBOARD') return fn.code === 'VIEW_DASHBOARD' || fn.code === 'VIEW_DASHBOARD_COMMAND';
      if (m === 'PERSONAL') return true;
      // Cho phép VIEW/EXPORT mọi module
      if (viewActions.has(fn.actionType)) return true;
      // Cho phép APPROVE/REJECT/FINALIZE trong các module nghiệp vụ cấp HV
      if (approveModules.has(m) && ['APPROVE', 'REJECT'].includes(fn.actionType)) return true;
      // Các quyền đặc thù của GĐ theo function code cụ thể
      const directorCodes = new Set([
        'FINALIZE_ACCEPTANCE',   // Kết luận nghiệm thu hội đồng KH
        'WF.OVERRIDE',           // Force action workflow (đặc quyền GĐ)
        'EVALUATE_RESEARCH',     // Đánh giá đề tài NCKH
      ]);
      return directorCodes.has(fn.code);
    };
  }

  // ── Nhóm A: Chỉ huy Học viện — VIEW ALL ───────────────────
  // CHINH_UY, PHO_CHINH_UY, PHO_GIAM_DOC: xem toàn bộ CSDL (không APPROVE)
  if (['CHINH_UY', 'PHO_CHINH_UY', 'PHO_GIAM_DOC'].includes(positionCode)) {
    const viewActions = new Set(['VIEW', 'EXPORT', 'DOWNLOAD']);
    return (fn) => {
      const m = fn.module.toUpperCase();
      // No system management
      if (m === 'SYSTEM') return fn.actionType === 'VIEW';
      if (m === 'DASHBOARD') return fn.code === 'VIEW_DASHBOARD' || fn.code === 'VIEW_DASHBOARD_COMMAND';
      if (m === 'PERSONAL') return true; // Cá nhân của họ
      return viewActions.has(fn.actionType);
    };
  }

  // PHO_GIAM_DOC_KH: chỉ VIEW domain Khoa học
  if (positionCode === 'PHO_GIAM_DOC_KH') {
    const allowedModules = new Set(['RESEARCH', 'SCIENCE', 'FACULTY', 'EDUCATION', 'DASHBOARD', 'PERSONAL']);
    return (fn) => {
      if (!allowedModules.has(fn.module.toUpperCase())) return false;
      if (fn.module.toUpperCase() === 'DASHBOARD') return fn.code === 'VIEW_DASHBOARD';
      return ['VIEW', 'EXPORT'].includes(fn.actionType);
    };
  }

  // PHO_GIAM_DOC_HC_HCKT: chỉ VIEW domain Hậu cần-Kỹ thuật
  if (positionCode === 'PHO_GIAM_DOC_HC_HCKT') {
    const allowedModules = new Set(['PERSONNEL', 'INSURANCE', 'POLICY', 'AWARDS', 'DASHBOARD', 'PERSONAL']);
    return (fn) => {
      if (!allowedModules.has(fn.module.toUpperCase())) return false;
      if (fn.module.toUpperCase() === 'DASHBOARD') return fn.code === 'VIEW_DASHBOARD';
      return ['VIEW', 'EXPORT'].includes(fn.actionType);
    };
  }

  // ── Nhóm B: Phòng Chính trị — full CRUD: PARTY + AWARDS + PERSONNEL ──
  if (['TRUONG_PHONG_DANG', 'B3_CNCT', 'B3_PCNCT_BT'].includes(positionCode)) {
    const fullModules = new Set(['PARTY', 'AWARDS']);
    return (fn) => {
      const m = fn.module.toUpperCase();
      if (fullModules.has(m)) return true; // Tất cả actions
      if (m === 'PERSONNEL') return true;  // Full PERSONNEL access
      if (m === 'DASHBOARD') return fn.code === 'VIEW_DASHBOARD';
      if (m === 'PERSONAL') return true;
      if (m === 'DOCUMENTS') return ['VIEW', 'CREATE', 'EXPORT', 'DOWNLOAD', 'SEARCH'].includes(fn.actionType);
      return false;
    };
  }

  // ── Nhóm B2: Trợ lý Cơ quan Chính trị — VIEW + CREATE + DELETE (không UPDATE) ──
  if (['CAN_BO_DANG', 'CAN_BO_TO_CHUC'].includes(positionCode)) {
    const allowedActions = new Set(['VIEW', 'CREATE', 'DELETE', 'EXPORT', 'DOWNLOAD', 'SEARCH', 'MANAGE_ACTIVITY', 'MANAGE_FEE']);
    return (fn) => {
      const m = fn.module.toUpperCase();
      if (m === 'PARTY') return fn.actionType !== 'UPDATE' && fn.actionType !== 'APPROVE';
      if (m === 'AWARDS') return ['VIEW', 'CREATE', 'EXPORT'].includes(fn.actionType);
      if (m === 'PERSONNEL') return ['VIEW', 'CREATE', 'EXPORT'].includes(fn.actionType);
      if (m === 'DASHBOARD') return fn.code === 'VIEW_DASHBOARD';
      if (m === 'PERSONAL') return true;
      return false;
    };
  }

  // ── Nhóm C: Phòng Hậu cần/Nhân sự — full CRUD: PERSONNEL + INSURANCE + POLICY ──
  if (['TRUONG_PHONG_NHAN_SU', 'CHI_HUY_PHONG'].includes(positionCode)) {
    const fullModules = new Set(['PERSONNEL', 'INSURANCE', 'POLICY']);
    return (fn) => {
      const m = fn.module.toUpperCase();
      if (fullModules.has(m)) return true;
      if (m === 'AWARDS') return ['VIEW', 'EXPORT'].includes(fn.actionType);
      if (m === 'DASHBOARD') return fn.code === 'VIEW_DASHBOARD';
      if (m === 'PERSONAL') return true;
      if (m === 'DOCUMENTS') return ['VIEW', 'CREATE', 'EXPORT', 'DOWNLOAD'].includes(fn.actionType);
      return false;
    };
  }

  // ── Nhóm C2: Trợ lý Văn phòng/Nhân sự — VIEW + CREATE (không UPDATE/DELETE) ──
  if (['TRO_LY', 'NHAN_VIEN', 'CHUYEN_VIEN'].includes(positionCode)) {
    return (fn) => {
      const m = fn.module.toUpperCase();
      if (m === 'PERSONNEL') return ['VIEW', 'CREATE', 'EXPORT'].includes(fn.actionType);
      if (m === 'INSURANCE') return ['VIEW', 'CREATE'].includes(fn.actionType);
      if (m === 'POLICY') return fn.code === 'CREATE_POLICY_REQUEST' || fn.actionType === 'VIEW';
      if (m === 'AWARDS') return fn.actionType === 'VIEW';
      if (m === 'DASHBOARD') return fn.code === 'VIEW_DASHBOARD';
      if (m === 'PERSONAL') return true;
      if (m === 'DOCUMENTS') return ['VIEW', 'DOWNLOAD'].includes(fn.actionType);
      return false;
    };
  }

  // ── Nhóm C3: Cán bộ Tài chính ─────────────────────────────
  if (positionCode === 'CAN_BO_TAI_CHINH') {
    return (fn) => {
      const m = fn.module.toUpperCase();
      if (m === 'INSURANCE') return true;
      if (m === 'POLICY') return ['VIEW', 'CREATE', 'UPDATE', 'EXPORT'].includes(fn.actionType);
      if (m === 'AWARDS') return ['VIEW', 'EXPORT'].includes(fn.actionType);
      if (m === 'PERSONNEL') return ['VIEW', 'EXPORT'].includes(fn.actionType);
      if (m === 'DASHBOARD') return fn.code === 'VIEW_DASHBOARD';
      if (m === 'PERSONAL') return true;
      return false;
    };
  }

  // ── Nhóm D: Phòng Đào tạo — full CRUD: EDUCATION + STUDENT + TRAINING + EXAM ──
  if (['TRUONG_PHONG_DAO_TAO', 'B1_TRUONG_PHONG'].includes(positionCode)) {
    const fullModules = new Set(['EDUCATION', 'STUDENT', 'TRAINING', 'EXAM', 'QUESTION_BANK', 'LEARNING_MATERIAL']);
    return (fn) => {
      const m = fn.module.toUpperCase();
      if (fullModules.has(m)) return true;
      if (m === 'FACULTY') return ['VIEW', 'VIEW_STATS', 'VIEW_INSTRUCTORS', 'VIEW_CLASSES', 'EXPORT'].includes(fn.actionType) || ['VIEW', 'EXPORT'].includes(fn.actionType);
      if (m === 'PERSONNEL') return ['VIEW', 'EXPORT'].includes(fn.actionType);
      if (m === 'DASHBOARD') return fn.code === 'VIEW_DASHBOARD';
      if (m === 'PERSONAL') return true;
      if (m === 'DOCUMENTS') return ['VIEW', 'CREATE', 'EXPORT', 'DOWNLOAD'].includes(fn.actionType);
      return false;
    };
  }

  // ── Nhóm E: Phòng Khoa học — full CRUD: RESEARCH + SCIENCE ──
  if (['TRUONG_PHONG_KHOA_HOC', 'B2_TRUONG_PHONG', 'B2_TRUONG_PHÒNG'].includes(positionCode)) {
    const fullModules = new Set(['RESEARCH', 'SCIENCE']);
    return (fn) => {
      const m = fn.module.toUpperCase();
      if (fullModules.has(m)) return true;
      if (m === 'FACULTY') return ['VIEW', 'VIEW_RESEARCH', 'VIEW_STATS', 'EXPORT'].includes(fn.actionType) || fn.actionType === 'VIEW';
      if (m === 'DASHBOARD') return fn.code === 'VIEW_DASHBOARD';
      if (m === 'PERSONAL') return true;
      if (m === 'DOCUMENTS') return ['VIEW', 'CREATE', 'EXPORT', 'DOWNLOAD'].includes(fn.actionType);
      return false;
    };
  }

  // ── Nhóm F: Phòng Chính sách — full CRUD: POLICY + INSURANCE ──
  if (positionCode === 'TRUONG_PHONG_CHINH_SACH') {
    return (fn) => {
      const m = fn.module.toUpperCase();
      if (m === 'POLICY' || m === 'INSURANCE') return true;
      if (m === 'PERSONNEL') return ['VIEW', 'VIEW_DETAIL', 'EXPORT'].includes(fn.actionType);
      if (m === 'DASHBOARD') return fn.code === 'VIEW_DASHBOARD';
      if (m === 'PERSONAL') return true;
      return false;
    };
  }

  // ── Nhóm G: Phó Trưởng Phòng — như trưởng nhưng không APPROVE/DELETE ──
  if (positionCode === 'PHO_TRUONG_PHONG') {
    return (fn) => {
      const m = fn.module.toUpperCase();
      const limitedActions = new Set(['VIEW', 'CREATE', 'UPDATE', 'EXPORT', 'IMPORT', 'SUBMIT']);
      if (m === 'PERSONNEL') return limitedActions.has(fn.actionType);
      if (m === 'INSURANCE') return limitedActions.has(fn.actionType);
      if (m === 'POLICY') return limitedActions.has(fn.actionType) || fn.code === 'CREATE_POLICY_REQUEST';
      if (m === 'AWARDS') return ['VIEW', 'EXPORT'].includes(fn.actionType);
      if (m === 'DASHBOARD') return fn.code === 'VIEW_DASHBOARD';
      if (m === 'PERSONAL') return true;
      return false;
    };
  }

  // ── Nhóm H: Cấp Khoa — FACULTY + EDUCATION + RESEARCH (DEPARTMENT scope) ──
  if (['TRUONG_KHOA', 'CHI_HUY_KHOA', 'PHO_TRUONG_KHOA'].includes(positionCode)) {
    const fullModules = new Set(['FACULTY', 'EDUCATION', 'RESEARCH', 'SCIENCE', 'QUESTION_BANK', 'LEARNING_MATERIAL', 'EXAM']);
    return (fn) => {
      const m = fn.module.toUpperCase();
      if (fullModules.has(m)) return true;
      if (m === 'STUDENT') return ['VIEW', 'VIEW_DETAIL', 'GPA_VIEW', 'CONDUCT_VIEW', 'DASHBOARD_VIEW', 'PROFILE360_VIEW', 'EXPORT'].includes(fn.actionType) || fn.actionType === 'VIEW';
      if (m === 'PERSONNEL') return ['VIEW', 'VIEW_DETAIL', 'EXPORT'].includes(fn.actionType);
      if (m === 'TRAINING') return ['VIEW', 'VIEW_GRADE', 'APPROVE_GRADE', 'REJECT_GRADE'].includes(fn.actionType) || fn.actionType === 'VIEW';
      if (m === 'DASHBOARD') return fn.code === 'VIEW_DASHBOARD';
      if (m === 'PERSONAL') return true;
      if (m === 'DOCUMENTS') return ['VIEW', 'CREATE', 'EXPORT', 'DOWNLOAD'].includes(fn.actionType);
      if (m === 'AI') return ['VIEW', 'USE_CHAT'].includes(fn.actionType) || fn.actionType === 'VIEW';
      return false;
    };
  }

  // ── Nhóm I: Bộ môn — như Khoa nhưng UNIT scope ──
  if (['CHU_NHIEM_BO_MON', 'CHI_HUY_BO_MON', 'PHO_CHU_NHIEM_BM'].includes(positionCode)) {
    const fullModules = new Set(['FACULTY', 'EDUCATION', 'RESEARCH', 'QUESTION_BANK', 'LEARNING_MATERIAL', 'EXAM']);
    return (fn) => {
      const m = fn.module.toUpperCase();
      if (fullModules.has(m)) return !['APPROVE_GRADUATION', 'RUN_GRADUATION', 'APPROVE_PROGRAM', 'MANAGE_TRAINING_SYSTEM'].includes(fn.code);
      if (m === 'STUDENT') return ['VIEW', 'VIEW_DETAIL', 'EXPORT'].includes(fn.actionType) || fn.actionType === 'VIEW';
      if (m === 'TRAINING') return ['VIEW', 'VIEW_GRADE', 'CREATE_GRADE_DRAFT', 'SUBMIT_GRADE'].includes(fn.actionType) || fn.actionType === 'VIEW';
      if (m === 'PERSONNEL') return ['VIEW', 'EXPORT'].includes(fn.actionType);
      if (m === 'DASHBOARD') return fn.code === 'VIEW_DASHBOARD';
      if (m === 'PERSONAL') return true;
      return false;
    };
  }

  // ── Nhóm J: Giảng viên ────────────────────────────────────
  if (['GIANG_VIEN', 'GIANG_VIEN_CHINH', 'TRO_GIANG'].includes(positionCode)) {
    const allowedModules = new Set(['TRAINING', 'EDUCATION', 'FACULTY', 'RESEARCH', 'QUESTION_BANK', 'LEARNING_MATERIAL', 'EXAM', 'STUDENT', 'AI', 'DOCUMENTS', 'DASHBOARD', 'PERSONAL', 'SCIENCE']);
    return (fn) => {
      const m = fn.module.toUpperCase();
      if (!allowedModules.has(m)) return false;
      if (m === 'DASHBOARD') return fn.code === 'VIEW_DASHBOARD' || fn.code === 'VIEW_DASHBOARD_FACULTY';
      if (m === 'PERSONAL') return true;
      if (m === 'STUDENT') return ['VIEW', 'VIEW_DETAIL', 'CONDUCT_VIEW', 'GPA_VIEW'].includes(fn.actionType) || fn.actionType === 'VIEW';
      if (m === 'AI') return ['VIEW', 'USE_CHAT', 'ANALYZE_FEEDBACK', 'GENERATE_REPORT'].includes(fn.actionType);
      if (m === 'TRAINING') return ['VIEW', 'VIEW_GRADE', 'CREATE_GRADE_DRAFT', 'SUBMIT_GRADE'].includes(fn.actionType) || fn.actionType === 'VIEW';
      return ['VIEW', 'CREATE', 'UPDATE', 'SUBMIT', 'EXPORT', 'IMPORT', 'DOWNLOAD', 'UPLOAD'].includes(fn.actionType);
    };
  }

  // ── Nhóm J2: Nghiên cứu viên ──────────────────────────────
  if (positionCode === 'NGHIEN_CUU_VIEN') {
    const allowedModules = new Set(['RESEARCH', 'SCIENCE', 'FACULTY', 'DOCUMENTS', 'DATA', 'DASHBOARD', 'PERSONAL', 'AI', 'ML']);
    return (fn) => {
      const m = fn.module.toUpperCase();
      if (!allowedModules.has(m)) return false;
      if (m === 'DASHBOARD') return fn.code === 'VIEW_DASHBOARD';
      if (m === 'PERSONAL') return true;
      if (m === 'FACULTY') return ['VIEW', 'VIEW_RESEARCH', 'EXPORT'].includes(fn.actionType) || fn.actionType === 'VIEW';
      return ['VIEW', 'CREATE', 'UPDATE', 'SUBMIT', 'EXPORT', 'IMPORT', 'DOWNLOAD', 'UPLOAD'].includes(fn.actionType);
    };
  }

  // ── Nhóm K: Hệ trưởng — quản lý học viên trong Hệ ────────
  if (positionCode === 'CHI_HUY_HE') {
    return (fn) => {
      const m = fn.module.toUpperCase();
      if (m === 'EDUCATION') return ['VIEW_STUDENT', 'VIEW_CONDUCT', 'MANAGE_CONDUCT', 'VIEW_ENROLLMENT', 'VIEW_TRAINING_SYSTEM', 'MANAGE_TRAINING_SYSTEM', 'VIEW_SCHEDULE', 'VIEW_GRADUATION', 'VIEW_WARNING'].includes(fn.code) || fn.actionType === 'VIEW';
      if (m === 'STUDENT') return true;
      if (m === 'TRAINING') return ['VIEW', 'VIEW_GRADE'].includes(fn.actionType);
      if (m === 'PERSONNEL') return ['VIEW', 'VIEW_DETAIL', 'EXPORT'].includes(fn.actionType);
      if (m === 'PARTY') return ['VIEW', 'VIEW_MEMBER', 'VIEW_ACTIVITY', 'VIEW_REVIEW'].includes(fn.actionType) || fn.actionType === 'VIEW';
      if (m === 'AWARDS') return ['VIEW', 'EXPORT'].includes(fn.actionType);
      if (m === 'DASHBOARD') return fn.code === 'VIEW_DASHBOARD';
      if (m === 'PERSONAL') return true;
      return false;
    };
  }

  // ── Nhóm L: Tiểu đoàn — quản lý học viên trong TDB ───────
  if (['CHI_HUY_TIEU_DOAN', 'CHI_HUY_BAN'].includes(positionCode)) {
    return (fn) => {
      const m = fn.module.toUpperCase();
      if (m === 'EDUCATION') return ['VIEW_STUDENT', 'VIEW_CONDUCT', 'MANAGE_CONDUCT', 'VIEW_ENROLLMENT', 'VIEW_BATTALION', 'MANAGE_BATTALION', 'VIEW_GRADUATION', 'VIEW_WARNING'].includes(fn.code) || fn.actionType === 'VIEW';
      if (m === 'STUDENT') return ['VIEW', 'CONDUCT_VIEW', 'GPA_VIEW', 'DASHBOARD_VIEW'].includes(fn.actionType) || fn.actionType === 'VIEW';
      if (m === 'TRAINING') return ['VIEW', 'VIEW_GRADE'].includes(fn.actionType);
      if (m === 'PARTY') return fn.actionType === 'VIEW';
      if (m === 'AWARDS') return fn.actionType === 'VIEW';
      if (m === 'DASHBOARD') return fn.code === 'VIEW_DASHBOARD';
      if (m === 'PERSONAL') return true;
      return false;
    };
  }

  // ── Nhóm M: Cán bộ thư viện ────────────────────────────────
  if (positionCode === 'CAN_BO_THU_VIEN') {
    return (fn) => {
      const m = fn.module.toUpperCase();
      if (m === 'LEARNING_MATERIAL') return true;
      if (m === 'DOCUMENTS') return ['VIEW', 'CREATE', 'SEARCH', 'DOWNLOAD', 'UPLOAD', 'EXPORT'].includes(fn.actionType);
      if (m === 'DASHBOARD') return fn.code === 'VIEW_DASHBOARD';
      if (m === 'PERSONAL') return true;
      return false;
    };
  }

  // ── Nhóm N: Kỹ thuật viên ──────────────────────────────────
  if (positionCode === 'KY_THUAT_VIEN') {
    return (fn) => {
      const m = fn.module.toUpperCase();
      if (m === 'MONITORING') return fn.actionType === 'VIEW' || fn.code.startsWith('VIEW_');
      if (m === 'SYSTEM') return ['VIEW_SYSTEM_HEALTH', 'VIEW_INFRASTRUCTURE', 'VIEW_SYSTEM_STATS'].includes(fn.code);
      if (m === 'DATA') return ['VIEW', 'QUERY'].includes(fn.actionType);
      if (m === 'DOCUMENTS') return fn.actionType === 'VIEW';
      if (m === 'DASHBOARD') return fn.code === 'VIEW_DASHBOARD';
      if (m === 'PERSONAL') return true;
      return false;
    };
  }

  // ── Nhóm O: Học viên — SELF scope ──────────────────────────
  if (['HOC_VIEN_QUAN_SU', 'HOC_VIEN', 'HOC_VIEN_CAO_HOC', 'SINH_VIEN', 'SINH_VIEN_DAN_SU'].includes(positionCode)) {
    const WHITELIST = new Set([
      // Dashboard
      'VIEW_DASHBOARD', 'VIEW_DASHBOARD_STUDENT',
      // Personal
      'MANAGE_MY_PROFILE', 'VIEW_MY_NOTIFICATIONS', 'VIEW_MY_TASKS',
      'MANAGE_MY_SECURITY', 'VIEW_MY_CAREER_HISTORY', 'REQUEST_MY_INFO_UPDATE',
      'VIEW_MY_GRADE', 'VIEW_MY_CONDUCT', 'VIEW_MY_SCHEDULE',
      'VIEW_MY_GRADUATION', 'VIEW_MY_AWARD', 'VIEW_MY_POLICY',
      'VIEW_MY_INSURANCE', 'VIEW_MY_RESEARCH', 'VIEW_MY_PUBLICATIONS',
      // Education / Training
      'VIEW_STUDENT', 'VIEW_COURSE', 'VIEW_GRADE', 'VIEW_SCHEDULE',
      'VIEW_ATTENDANCE', 'VIEW_ENROLLMENT', 'VIEW_THESIS',
      'VIEW_WARNING', 'VIEW_GRADUATION', 'VIEW_REPOSITORY',
      'VIEW_TRAINING', 'VIEW_LEARNING_MATERIAL', 'DOWNLOAD_LEARNING_MATERIAL',
      // Exam & Registration
      'REGISTER_COURSE', 'REGISTER_EXAM', 'VIEW_EXAM_REG',
      'VIEW_EXAM_SESSION', 'VIEW_EXAM_PLAN',
      // Self-submit
      'SUBMIT_PERSONNEL',
    ]);
    return (fn) => WHITELIST.has(fn.code);
  }

  // ── Nhóm Q: Guest ──────────────────────────────────────────
  if (positionCode === 'GUEST') {
    return (fn) => fn.code === 'VIEW_DASHBOARD';
  }

  // Default: không có quyền gì
  return () => false;
}

// ────────────────────────────────────────────────────────────
// refreshPositionFunctions — áp predicate lên tất cả positions
// ────────────────────────────────────────────────────────────

async function refreshPositionFunctions() {
  console.log('\n📌 Refreshing Position-Function grants...');

  const dbFunctions = await prisma.function.findMany({
    where: { isActive: true },
    select: { id: true, code: true, name: true, module: true, actionType: true, isCritical: true },
  }) as SeedFunction[];

  const positions = await prisma.position.findMany({ where: { isActive: true } });

  let total = 0;
  let deactivated = 0;

  for (const position of positions) {
    const predicate = getFunctionAllowPredicate(position.code);
    const scope = resolveScope(position.code);
    const allowed = dbFunctions.filter(predicate);
    const allowedIds = new Set(allowed.map(f => f.id));

    // Deactivate functions no longer in the predicate
    const deact = await prisma.positionFunction.updateMany({
      where: { positionId: position.id, functionId: { notIn: [...allowedIds] } },
      data: { isActive: false },
    });
    deactivated += deact.count;

    // Upsert allowed functions
    for (const fn of allowed) {
      await prisma.positionFunction.upsert({
        where: { positionId_functionId: { positionId: position.id, functionId: fn.id } },
        update: { scope, isActive: true },
        create: { positionId: position.id, functionId: fn.id, scope, isActive: true },
      });
      total++;
    }

    console.log(`  ✅ ${position.code.padEnd(30)} ${allowed.length.toString().padStart(3)} funcs [${scope}]`);
  }

  console.log(`\n  Grants upserted: ${total} | Deactivated: ${deactivated}`);
}

// ────────────────────────────────────────────────────────────
// ensureUnit — tìm unit theo code (fallback về HVHC)
// ────────────────────────────────────────────────────────────

async function ensureUnit(code: string) {
  const unit = await prisma.unit.findFirst({ where: { code } });
  if (unit) return unit;
  // Fallback về HVHC nếu code không tồn tại
  const fallback = await prisma.unit.findFirst({ where: { code: 'HVHC' } });
  if (!fallback) throw new Error('Unit HVHC not found — run seed_units.ts first');
  console.warn(`  ⚠️  Unit '${code}' not found, using HVHC as fallback`);
  return fallback;
}

// ────────────────────────────────────────────────────────────
// upsertDemoUser
// ────────────────────────────────────────────────────────────

async function upsertDemoUser(account: DemoAccount, hashedPassword: string) {
  const legacyRole = POSITION_TO_LEGACY_ROLE[account.positionCode] || 'KY_THUAT_VIEN';
  const unit = await ensureUnit(account.unitCode);

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
        role: legacyRole,
        unitId: unit.id,
      },
    });
    return existing.id;
  }

  const created = await prisma.user.create({
    data: {
      email: account.email,
      name: account.name,
      password: hashedPassword,
      rank: account.rank,
      militaryId: account.militaryId,
      status: UserStatus.ACTIVE,
      role: legacyRole,
      unitId: unit.id,
    },
  });
  return created.id;
}

// ────────────────────────────────────────────────────────────
// ensureUserPosition
// ────────────────────────────────────────────────────────────

async function ensureUserPosition(userId: string, positionCode: string, unitId: string | null, isPrimary: boolean) {
  const position = await prisma.position.findFirst({ where: { code: positionCode } });
  if (!position) {
    console.warn(`  ⚠️  Position '${positionCode}' not found in DB — skipping UserPosition`);
    return;
  }

  const existing = await prisma.userPosition.findFirst({
    where: { userId, positionId: position.id },
  });

  if (existing) {
    await prisma.userPosition.update({
      where: { id: existing.id },
      data: { isPrimary, unitId, isActive: true, startDate: existing.startDate ?? new Date('2024-01-01') },
    });
  } else {
    await prisma.userPosition.create({
      data: {
        userId, positionId: position.id,
        unitId, isPrimary, isActive: true,
        startDate: new Date('2024-01-01'),
      },
    });
  }
}

// ────────────────────────────────────────────────────────────
// MAIN
// ────────────────────────────────────────────────────────────

async function main() {
  console.log('='.repeat(65));
  console.log('  SEED DEMO RBAC ACCOUNTS – HVHC');
  console.log('='.repeat(65));

  // Sync Function catalog từ FUNCTION_CODES vào DB
  console.log('\n🔧 Syncing Function catalog...');
  const modules = FUNCTION_CODES as Record<string, Record<string, string>>;
  const dedup = new Map<string, string>();
  for (const [moduleKey, defs] of Object.entries(modules)) {
    for (const code of Object.values(defs as Record<string, string>)) {
      if (!dedup.has(code)) dedup.set(code, moduleKey);
    }
  }

  // Map code prefix → ActionType enum (chỉ 9 valid values)
  const ACTION_TYPE_MAP: Record<string, string> = {
    VIEW: 'VIEW', CREATE: 'CREATE', UPDATE: 'UPDATE', DELETE: 'DELETE',
    APPROVE: 'APPROVE', REJECT: 'REJECT', EXPORT: 'EXPORT', IMPORT: 'IMPORT', SUBMIT: 'SUBMIT',
    MANAGE: 'UPDATE', DOWNLOAD: 'VIEW', UPLOAD: 'CREATE', SYNC: 'UPDATE',
    GENERATE: 'CREATE', PREDICT: 'VIEW', ANALYZE: 'VIEW', USE: 'VIEW',
    RUN: 'SUBMIT', SEARCH: 'VIEW', LINK: 'UPDATE', RESET: 'UPDATE',
    TOGGLE: 'UPDATE', ASSIGN: 'UPDATE', PUBLISH: 'APPROVE', REVIEW: 'VIEW',
    EVALUATE: 'VIEW', QUERY: 'VIEW', SUPERVISE: 'VIEW', MONITOR: 'VIEW',
    REVOKE: 'DELETE', OCR: 'CREATE', PREVIEW: 'VIEW', RETRY: 'SUBMIT',
    REGISTER: 'SUBMIT', WF: 'SUBMIT', FINALIZE: 'APPROVE', OVERRIDE: 'UPDATE',
    CANCEL: 'DELETE', SIGN: 'APPROVE', DESIGN: 'CREATE', INITIATE: 'CREATE',
    ACT: 'SUBMIT', TRIGGER: 'SUBMIT',
  };

  let fnSynced = 0;
  for (const [code, moduleKey] of dedup) {
    const prefix = code.split('_')[0].toUpperCase();
    const actionType = (ACTION_TYPE_MAP[prefix] || 'VIEW') as any;
    await prisma.function.upsert({
      where: { code },
      // Khi update: chỉ cập nhật module và isActive, không thay đổi actionType đã có
      update: { module: moduleKey, isActive: true },
      create: { code, name: code, module: moduleKey, actionType, isActive: true },
    });
    fnSynced++;
  }
  console.log(`  ✅ Synced ${fnSynced} function codes`);

  // Refresh position functions
  await refreshPositionFunctions();

  // Create demo accounts
  console.log('\n👥 Creating demo accounts...');
  const hashedPassword = await bcrypt.hash(DEMO_PASSWORD, 12);

  for (const account of DEMO_ACCOUNTS) {
    const unit = await ensureUnit(account.unitCode);
    const userId = await upsertDemoUser(account, hashedPassword);
    await ensureUserPosition(userId, account.positionCode, unit.id, account.isPrimary);

    console.log(`  ✅ ${account.email.padEnd(38)} → ${account.positionCode} @ ${account.unitCode}`);
  }

  // Summary
  console.log('\n' + '='.repeat(65));
  console.log('  ✅ SEED HOÀN TẤT');
  console.log('='.repeat(65));
  console.log('\nTài khoản demo (mật khẩu: Demo@2025):');
  DEMO_ACCOUNTS.forEach(a => {
    console.log(`  ${a.email.padEnd(38)} [${a.positionCode}]`);
  });
}

main()
  .catch(e => { console.error('\n❌ FAILED:', e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
