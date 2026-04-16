/**
 * M07 – Student Scope Service
 *
 * Resolve phạm vi dữ liệu học viên được phép xem dựa theo actor và FunctionScope.
 * Kết quả là Prisma.HocVienWhereInput bổ sung vào mọi truy vấn HocVien.
 *
 * Phân quyền theo scope:
 *   ACADEMY    → không filter (thấy tất cả HV trong học viện)
 *   DEPARTMENT → HV thuộc đơn vị/khoa trong phạm vi cùng cấp department
 *   UNIT       → HV thuộc đơn vị nhỏ hơn (tiểu đội, trung đội)
 *   SELF       → phân nhánh theo loại actor:
 *                  • GIANG_VIEN / role giảng viên  → HV do mình cố vấn HOẶC trong lớp mình dạy
 *                  • HOC_VIEN / HOC_VIEN_SINH_VIEN → chỉ chính mình
 *                  • role quản lý cao hơn           → fallback ACADEMY (không filter)
 *
 * Lưu ý kiến trúc:
 *   - Đây là "scope filter" – KHÔNG thay thế RBAC function code.
 *   - Mọi API phải check function code trước, sau đó mới gọi buildStudentScopeFilter.
 *   - Filter này là additional restriction, không bao giờ mở rộng quyền.
 *   - Scope SELF với giảng viên phải tra DB (lớp đang dạy) – tránh gọi nhiều lần/request.
 */

import 'server-only';
import prisma from '@/lib/db';
import { FunctionScope, UserRole } from '@prisma/client';
import { AuthUser } from '@/lib/rbac/types';
import { getAccessibleUnitIds } from '@/lib/rbac/scope';

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * Kết quả resolve scope: chứa Prisma where clause và metadata debug.
 */
export interface StudentScopeFilter {
  /** Prisma where clause – spread thêm vào truy vấn HocVien */
  where: Record<string, unknown>;
  /** Loại scope đã áp dụng, phục vụ log/audit */
  appliedScope: 'ACADEMY' | 'DEPARTMENT' | 'UNIT' | 'SELF_ADVISOR' | 'SELF_STUDENT' | 'SELF_ADMIN';
  /** Giải thích ngắn gọn cho debugging */
  reason: string;
}

// ─── Roles phân loại ──────────────────────────────────────────────────────────

const FACULTY_ROLES: UserRole[] = [
  UserRole.GIANG_VIEN,
  UserRole.NGHIEN_CUU_VIEN,
  UserRole.CHU_NHIEM_BO_MON,
  UserRole.CHI_HUY_BO_MON,
];

const STUDENT_ROLES: UserRole[] = [
  UserRole.HOC_VIEN,
  UserRole.HOC_VIEN_SINH_VIEN,
];

const ADMIN_ROLES: UserRole[] = [
  UserRole.ADMIN,
  UserRole.QUAN_TRI_HE_THONG,
  UserRole.CHI_HUY_HOC_VIEN,
  UserRole.CHI_HUY_KHOA_PHONG,
  UserRole.CHI_HUY_HE,
  UserRole.CHI_HUY_TIEU_DOAN,
  UserRole.TRO_LY,
  UserRole.NHAN_VIEN,
];

// ─── Core ─────────────────────────────────────────────────────────────────────

/**
 * Xây dựng where clause lọc HocVien theo scope của actor.
 *
 * Ngoài FunctionScope chuẩn, hàm này cũng xét Unit.type của user:
 *   - Unit.type = 'HE'       → filter theo trainingSystemUnitId (CHI_HUY_HE)
 *   - Unit.type = 'TIEUDOAN' → filter theo battalionUnitId (CHI_HUY_TIEU_DOAN)
 *
 * @param user          AuthUser từ session (chứa id, role, unitId)
 * @param scope         FunctionScope từ RBAC (SELF | UNIT | DEPARTMENT | ACADEMY)
 */
export async function buildStudentScopeFilter(
  user: AuthUser,
  scope: FunctionScope,
): Promise<StudentScopeFilter> {
  // ── ACADEMY: không filter ────────────────────────────────────────────────
  if (scope === FunctionScope.ACADEMY) {
    // Nhưng vẫn kiểm tra Unit.type để giới hạn nếu user là CHI_HUY_HE / CHI_HUY_TIEU_DOAN
    // với scope ACADEMY (defensive: đảm bảo đúng scope dù role có scope cao)
    const unitFilter = await buildUnitTypeFilter(user);
    if (unitFilter) return unitFilter;

    return {
      where: {},
      appliedScope: 'ACADEMY',
      reason: 'Scope ACADEMY – xem tất cả học viên trong học viện',
    };
  }

  // ── DEPARTMENT / UNIT: filter theo đơn vị ───────────────────────────────
  if (scope === FunctionScope.DEPARTMENT || scope === FunctionScope.UNIT) {
    // Nếu đơn vị user là HE hoặc TIEUDOAN, ưu tiên unit-type filter
    const unitFilter = await buildUnitTypeFilter(user);
    if (unitFilter) return unitFilter;

    return buildUnitScopeFilter(user, scope);
  }

  // ── SELF: phân nhánh theo loại role actor ────────────────────────────────
  const userRole = user.role as UserRole;

  if (FACULTY_ROLES.includes(userRole)) {
    return buildFacultyAdvisorFilter(user.id);
  }

  if (STUDENT_ROLES.includes(userRole)) {
    return buildSelfStudentFilter(user.id);
  }

  // Các role khác ở scope SELF → fallback không filter (quản lý cao)
  return {
    where: {},
    appliedScope: 'SELF_ADMIN',
    reason: `Scope SELF với role ${userRole} – fallback không filter`,
  };
}

/**
 * Kiểm tra xem một actor cụ thể có quyền xem một học viên cụ thể không.
 * Dùng cho `GET /api/student/[id]/academic-summary` (single resource check).
 *
 * @returns true nếu được phép, false nếu không
 */
export async function canActorViewStudent(
  actorUserId: string,
  actorRole: UserRole,
  scope: FunctionScope,
  targetHocVienId: string,
): Promise<boolean> {
  // ACADEMY scope → luôn được xem
  if (scope === FunctionScope.ACADEMY) return true;

  // Student tự xem profile mình
  if (STUDENT_ROLES.includes(actorRole)) {
    const hv = await prisma.hocVien.findUnique({
      where: { id: targetHocVienId },
      select: { userId: true },
    });
    return hv?.userId === actorUserId;
  }

  // Faculty: kiểm tra advisee HOẶC trong lớp đang dạy
  if (FACULTY_ROLES.includes(actorRole)) {
    const facultyProfile = await prisma.facultyProfile.findFirst({
      where: { userId: actorUserId },
      select: { id: true },
    });
    if (!facultyProfile) return false;

    return isFacultyAllowedToViewStudent(facultyProfile.id, targetHocVienId);
  }

  // DEPARTMENT / UNIT scope: kiểm tra học viên có thuộc đơn vị không
  if (scope === FunctionScope.DEPARTMENT || scope === FunctionScope.UNIT || scope === FunctionScope.ACADEMY) {
    const authUser: AuthUser = { id: actorUserId, email: '', role: actorRole };

    // Ưu tiên unit-type filter (HE / TIEUDOAN) trước khi dùng scope chuẩn
    const unitTypeFilter = await buildUnitTypeFilter(authUser);
    if (unitTypeFilter) {
      const count = await prisma.hocVien.count({
        where: { id: targetHocVienId, ...unitTypeFilter.where },
      });
      return count > 0;
    }

    if (scope === FunctionScope.ACADEMY) return true;

    const filter = await buildUnitScopeFilter(authUser, scope as FunctionScope.DEPARTMENT | FunctionScope.UNIT);
    const count = await prisma.hocVien.count({
      where: { id: targetHocVienId, ...filter.where },
    });
    return count > 0;
  }

  // SELF + admin role → không filter
  return true;
}

// ─── Private helpers ──────────────────────────────────────────────────────────

/**
 * Kiểm tra Unit.type của user để áp dụng filter đúng cho CHI_HUY_HE / CHI_HUY_TIEU_DOAN.
 *
 * - Unit.type = 'HE'       → filter trainingSystemUnitId = user.unitId
 * - Unit.type = 'TIEUDOAN' → filter battalionUnitId = user.unitId
 * - Các loại Unit khác      → trả null (để caller tiếp tục xử lý scope bình thường)
 */
async function buildUnitTypeFilter(user: AuthUser): Promise<StudentScopeFilter | null> {
  if (!user.unitId) return null;

  const unit = await prisma.unit.findUnique({
    where: { id: user.unitId },
    select: { id: true, type: true, name: true },
  });

  if (!unit) return null;

  if (unit.type === 'HE') {
    return {
      where: { trainingSystemUnitId: unit.id },
      appliedScope: 'UNIT',
      reason: `CHI_HUY_HE – chỉ xem học viên thuộc Hệ "${unit.name}" (trainingSystemUnitId=${unit.id})`,
    };
  }

  if (unit.type === 'TIEUDOAN') {
    return {
      where: { battalionUnitId: unit.id },
      appliedScope: 'UNIT',
      reason: `CHI_HUY_TIEU_DOAN – chỉ xem học viên thuộc Tiểu đoàn "${unit.name}" (battalionUnitId=${unit.id})`,
    };
  }

  return null;
}

/**
 * Filter cho DEPARTMENT và UNIT scope.
 * HocVien không có unitId trực tiếp – join qua StudentClass.unitId hoặc khoaQuanLy.
 * Hiện tại dùng khoaQuanLy (string field) là best-effort; khi chuẩn hóa sẽ dùng classId.unit.
 */
async function buildUnitScopeFilter(
  user: AuthUser,
  scope: FunctionScope.DEPARTMENT | FunctionScope.UNIT,
): Promise<StudentScopeFilter> {
  const accessibleUnitIds = await getAccessibleUnitIds(user, scope);

  if (accessibleUnitIds.length === 0) {
    // Không có đơn vị accessible → không thấy HV nào (fail-closed)
    return {
      where: { id: { in: [] } },
      appliedScope: scope === FunctionScope.DEPARTMENT ? 'DEPARTMENT' : 'UNIT',
      reason: `Scope ${scope} – không tìm thấy đơn vị accessible, trả rỗng`,
    };
  }

  // Lấy tên đơn vị để map với khoaQuanLy (legacy string field)
  const units = await prisma.unit.findMany({
    where: { id: { in: accessibleUnitIds } },
    select: { name: true, code: true },
  });
  const unitNames = units.map((u) => u.name);

  // Đồng thời filter theo classId → StudentClass.unitId nếu có dữ liệu đó
  const studentClasses = await prisma.studentClass.findMany({
    where: { unitId: { in: accessibleUnitIds } },
    select: { id: true },
  });
  const classIds = studentClasses.map((c) => c.id);

  const orClauses: object[] = [];
  if (unitNames.length > 0) orClauses.push({ khoaQuanLy: { in: unitNames } });
  if (classIds.length > 0)  orClauses.push({ classId: { in: classIds } });

  if (orClauses.length === 0) {
    return {
      where: { id: { in: [] } },
      appliedScope: scope === FunctionScope.DEPARTMENT ? 'DEPARTMENT' : 'UNIT',
      reason: `Scope ${scope} – không có đơn vị/lớp khớp`,
    };
  }

  return {
    where: { OR: orClauses },
    appliedScope: scope === FunctionScope.DEPARTMENT ? 'DEPARTMENT' : 'UNIT',
    reason: `Scope ${scope} – lọc theo ${accessibleUnitIds.length} đơn vị`,
  };
}

/**
 * Filter cho giảng viên ở scope SELF.
 * Được xem: HV do mình cố vấn OR HV trong lớp học phần đang dạy.
 */
async function buildFacultyAdvisorFilter(actorUserId: string): Promise<StudentScopeFilter> {
  const facultyProfile = await prisma.facultyProfile.findFirst({
    where: { userId: actorUserId },
    select: { id: true },
  });

  if (!facultyProfile) {
    // User có role GIANG_VIEN nhưng chưa có FacultyProfile → fail-closed
    return {
      where: { id: { in: [] } },
      appliedScope: 'SELF_ADVISOR',
      reason: 'Giảng viên chưa có FacultyProfile – không có quyền xem HV nào',
    };
  }

  const adviseeIds = await getAdviseeIds(facultyProfile.id);
  const classStudentIds = await getClassStudentIds(facultyProfile.id);

  const allAllowedIds = [...new Set([...adviseeIds, ...classStudentIds])];

  if (allAllowedIds.length === 0) {
    return {
      where: { id: { in: [] } },
      appliedScope: 'SELF_ADVISOR',
      reason: 'Giảng viên chưa có học viên cố vấn hoặc lớp đang dạy',
    };
  }

  return {
    where: { id: { in: allAllowedIds } },
    appliedScope: 'SELF_ADVISOR',
    reason: `Giảng viên – ${adviseeIds.length} HV cố vấn, ${classStudentIds.length} HV trong lớp đang dạy`,
  };
}

/**
 * Filter cho học viên tự xem profile mình.
 */
async function buildSelfStudentFilter(actorUserId: string): Promise<StudentScopeFilter> {
  const hv = await prisma.hocVien.findFirst({
    where: { userId: actorUserId },
    select: { id: true },
  });

  if (!hv) {
    return {
      where: { id: { in: [] } },
      appliedScope: 'SELF_STUDENT',
      reason: 'Không tìm thấy HocVien tương ứng với user này',
    };
  }

  return {
    where: { id: hv.id },
    appliedScope: 'SELF_STUDENT',
    reason: 'Học viên chỉ được xem hồ sơ của chính mình',
  };
}

// ─── DB helpers (reusable) ────────────────────────────────────────────────────

/**
 * Lấy danh sách HocVien.id mà giảng viên đang cố vấn học tập.
 */
export async function getAdviseeIds(facultyProfileId: string): Promise<string[]> {
  const students = await prisma.hocVien.findMany({
    where: { giangVienHuongDanId: facultyProfileId, deletedAt: null },
    select: { id: true },
  });
  return students.map((s) => s.id);
}

/**
 * Lấy danh sách HocVien.id đang enrolled trong lớp mà giảng viên đang dạy (ACTIVE sections).
 */
export async function getClassStudentIds(facultyProfileId: string): Promise<string[]> {
  const enrollments = await prisma.classEnrollment.findMany({
    where: {
      classSection: {
        facultyId: facultyProfileId,
        status: 'ACTIVE' as any,
      },
      status: 'ENROLLED' as any,
    },
    select: { hocVienId: true },
  });
  return [...new Set(enrollments.map((e) => e.hocVienId))];
}

/**
 * Kiểm tra nhanh 1 giảng viên có được phép xem 1 học viên cụ thể không.
 * Gộp check advisee + class trong 2 query song song.
 */
async function isFacultyAllowedToViewStudent(
  facultyProfileId: string,
  hocVienId: string,
): Promise<boolean> {
  const [adviseeCount, enrollmentCount] = await Promise.all([
    prisma.hocVien.count({
      where: { id: hocVienId, giangVienHuongDanId: facultyProfileId },
    }),
    prisma.classEnrollment.count({
      where: {
        hocVienId,
        status: 'ENROLLED' as any,
        classSection: {
          facultyId: facultyProfileId,
          status: 'ACTIVE' as any,
        },
      },
    }),
  ]);

  return adviseeCount > 0 || enrollmentCount > 0;
}
