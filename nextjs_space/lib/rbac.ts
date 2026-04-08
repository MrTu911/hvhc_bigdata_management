import "server-only";
import prisma from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * @deprecated v8.3: File này đã được thay thế bởi lib/rbac/authorize.ts
 * 
 * KHÔNG SỬ DỤNG FILE NÀY CHO CÁC TÍNH NĂNG MỚI!
 * 
 * Thay vì: import { authorize, hasPermission } from '@/lib/rbac';
 * Sử dụng: import { authorize } from '@/lib/rbac/authorize';
 *         import { hasPermission } from '@/lib/rbac/policy';
 * 
 * File này chỉ được giữ lại để tương thích với code cũ và sẽ bị XÓA
 * trong phiên bản tiếp theo.
 * 
 * ------------------------------------------------------------------
 * LEGACY RBAC Authorization System for HVHC BigData Management
 * Phân quyền theo cấp tổ chức và vai trò quân sự
 * ------------------------------------------------------------------
 */

console.warn('[DEPRECATED] lib/rbac.ts is deprecated. Use lib/rbac/authorize.ts instead.');

interface User {
  id: string;
  email: string;
  role: string;
  unitId?: string | null;
  department?: string | null;
}

interface AuthorizationResult {
  authorized: boolean;
  reason?: string;
}

/**
 * Kiểm tra quyền truy cập dựa trên vai trò và đơn vị
 */
export async function authorize(
  user: User,
  targetUnitId?: string | null,
  action: 'read' | 'write' | 'delete' = 'read'
): Promise<AuthorizationResult> {
  // ADMIN và QUAN_TRI_HE_THONG có toàn quyền
  if (user.role === 'ADMIN' || user.role === 'QUAN_TRI_HE_THONG') {
    return { authorized: true };
  }

  // Nếu không có targetUnitId, cho phép truy cập (dữ liệu công khai)
  if (!targetUnitId) {
    return { authorized: true };
  }

  try {
    // Lấy thông tin target unit
    const targetUnit = await prisma.unit.findUnique({
      where: { id: targetUnitId },
      select: {
        id: true,
        level: true,
        parentId: true,
        type: true,
      },
    });

    if (!targetUnit) {
      return { authorized: false, reason: 'Target unit not found' };
    }

    // CHI_HUY_HOC_VIEN - Truy cập toàn học viện
    if (user.role === 'CHI_HUY_HOC_VIEN') {
      // Có thể xem tất cả các đơn vị cấp dưới
      return { authorized: true };
    }

    // CHI_HUY_KHOA_PHONG - Chỉ truy cập đơn vị trực thuộc và cấp dưới
    if (user.role === 'CHI_HUY_KHOA_PHONG') {
      if (!user.unitId) {
        return { authorized: false, reason: 'User unit not assigned' };
      }

      // Kiểm tra nếu target unit là chính đơn vị của user
      if (targetUnitId === user.unitId) {
        return { authorized: true };
      }

      // Kiểm tra nếu target unit là đơn vị con
      const isChildUnit = await checkIfChildUnit(user.unitId, targetUnitId);
      if (isChildUnit) {
        return { authorized: true };
      }

      return { authorized: false, reason: 'Outside unit hierarchy' };
    }

    // CHU_NHIEM_BO_MON - Chỉ truy cập bộ môn của mình
    if (user.role === 'CHU_NHIEM_BO_MON') {
      if (!user.unitId) {
        return { authorized: false, reason: 'User unit not assigned' };
      }

      if (targetUnitId === user.unitId) {
        return { authorized: true };
      }

      // Kiểm tra nếu target unit là đơn vị con trực tiếp
      const isDirectChild = await checkIfDirectChild(user.unitId, targetUnitId);
      if (isDirectChild) {
        return { authorized: true };
      }

      return { authorized: false, reason: 'Outside department scope' };
    }

    // GIANG_VIEN, NGHIEN_CUU_VIEN - Chỉ truy cập dữ liệu của chính mình
    if (['GIANG_VIEN', 'NGHIEN_CUU_VIEN'].includes(user.role)) {
      // Chỉ cho phép read, không cho write/delete
      if (action === 'write' || action === 'delete') {
        return { authorized: false, reason: 'Insufficient permissions for write/delete' };
      }

      // Có thể xem dữ liệu trong cùng đơn vị
      if (targetUnitId === user.unitId) {
        return { authorized: true };
      }

      return { authorized: false, reason: 'Can only access own unit data' };
    }

    // Mặc định: không cho phép
    return { authorized: false, reason: 'Unauthorized role' };
  } catch (error) {
    console.error('Authorization error:', error);
    return { authorized: false, reason: 'Authorization check failed' };
  }
}

/**
 * Kiểm tra nếu targetUnitId là đơn vị con (bất kỳ cấp) của parentUnitId
 */
async function checkIfChildUnit(
  parentUnitId: string,
  targetUnitId: string
): Promise<boolean> {
  let currentUnit = await prisma.unit.findUnique({
    where: { id: targetUnitId },
    select: { parentId: true },
  });

  while (currentUnit?.parentId) {
    if (currentUnit.parentId === parentUnitId) {
      return true;
    }

    currentUnit = await prisma.unit.findUnique({
      where: { id: currentUnit.parentId },
      select: { parentId: true },
    });
  }

  return false;
}

/**
 * Kiểm tra nếu targetUnitId là đơn vị con trực tiếp của parentUnitId
 */
async function checkIfDirectChild(
  parentUnitId: string,
  targetUnitId: string
): Promise<boolean> {
  const targetUnit = await prisma.unit.findUnique({
    where: { id: targetUnitId },
    select: { parentId: true },
  });

  return targetUnit?.parentId === parentUnitId;
}

/**
 * Middleware helper để kiểm tra quyền trong API routes
 */
export async function requireAuth(allowedRoles?: string[]) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return {
      error: 'Unauthorized',
      status: 401,
    };
  }

  if (allowedRoles && !allowedRoles.includes(session.user.role)) {
    return {
      error: 'Forbidden',
      status: 403,
    };
  }

  return {
    user: session.user,
  };
}

/**
 * Filter dữ liệu theo quyền của user
 */
export async function applyDataFilter(user: User) {
  // ADMIN và QUAN_TRI_HE_THONG xem tất cả
  if (user.role === 'ADMIN' || user.role === 'QUAN_TRI_HE_THONG') {
    return {};
  }

  // CHI_HUY_HOC_VIEN xem tất cả
  if (user.role === 'CHI_HUY_HOC_VIEN') {
    return {};
  }

  // CHI_HUY_KHOA_PHONG xem đơn vị của mình và cấp dưới
  if (user.role === 'CHI_HUY_KHOA_PHONG' && user.unitId) {
    const childUnits = await getChildUnits(user.unitId);
    return {
      unitId: {
        in: [user.unitId, ...childUnits],
      },
    };
  }

  // CHU_NHIEM_BO_MON xem bộ môn của mình
  if (user.role === 'CHU_NHIEM_BO_MON' && user.unitId) {
    const childUnits = await getDirectChildUnits(user.unitId);
    return {
      unitId: {
        in: [user.unitId, ...childUnits],
      },
    };
  }

  // Các vai trò khác chỉ xem của mình
  if (user.unitId) {
    return {
      unitId: user.unitId,
    };
  }

  // Mặc định: chỉ xem dữ liệu của chính mình
  return {
    userId: user.id,
  };
}

/**
 * Lấy tất cả các đơn vị con (bất kỳ cấp)
 */
async function getChildUnits(parentUnitId: string): Promise<string[]> {
  const children = await prisma.unit.findMany({
    where: { parentId: parentUnitId },
    select: { id: true },
  });

  const childIds = children.map((c) => c.id);

  // Đệ quy lấy các cấp tiếp theo
  const grandChildren = await Promise.all(
    childIds.map((id) => getChildUnits(id))
  );

  return [...childIds, ...grandChildren.flat()];
}

/**
 * Lấy các đơn vị con trực tiếp
 */
async function getDirectChildUnits(parentUnitId: string): Promise<string[]> {
  const children = await prisma.unit.findMany({
    where: { parentId: parentUnitId },
    select: { id: true },
  });

  return children.map((c) => c.id);
}

/**
 * Permission type for route access
 */
export type Permission = {
  module: string;
  action: string;
};

/**
 * Check if user has specific permission
 */
export function hasPermission(userRole: string, permission: Permission): boolean {
  // ADMIN and QUAN_TRI_HE_THONG have all permissions
  if (userRole === 'ADMIN' || userRole === 'QUAN_TRI_HE_THONG') {
    return true;
  }

  // Define role-based permissions
  const rolePermissions: Record<string, string[]> = {
    CHI_HUY_HOC_VIEN: ['DASHBOARD', 'USERS', 'ANALYTICS', 'REPORTS', 'MONITORING'],
    CHI_HUY_KHOA_PHONG: ['DASHBOARD', 'FACULTY', 'STUDENTS', 'ANALYTICS'],
    CHU_NHIEM_BO_MON: ['DASHBOARD', 'FACULTY', 'STUDENTS'],
    GIANG_VIEN: ['DASHBOARD', 'FACULTY', 'MY_STUDENTS'],
    NGHIEN_CUU_VIEN: ['DASHBOARD', 'RESEARCH', 'ANALYTICS'],
    HOC_VIEN: ['DASHBOARD', 'STUDENT'],
    HOC_VIEN_SINH_VIEN: ['DASHBOARD', 'STUDENT'],
    KY_THUAT_VIEN: ['DASHBOARD', 'SYSTEM', 'MONITORING'],
  };

  const allowedModules = rolePermissions[userRole] || [];
  return allowedModules.includes(permission.module);
}

/**
 * Check if user can access a specific route
 */
export function canAccessRoute(userRole: string, routePath: string): boolean {
  // ADMIN and QUAN_TRI_HE_THONG can access all routes
  if (userRole === 'ADMIN' || userRole === 'QUAN_TRI_HE_THONG') {
    return true;
  }

  // Common routes accessible by all authenticated users
  const commonRoutes = [
    '/dashboard',
    '/dashboard/settings',
  ];

  // Check common routes first (exact match for /dashboard)
  if (routePath === '/dashboard' || commonRoutes.some(route => routePath === route)) {
    return true;
  }

  // Define route access by role - comprehensive list
  const roleRoutes: Record<string, string[]> = {
    // Chỉ huy Học viện - toàn quyền xem tất cả
    CHI_HUY_HOC_VIEN: [
      '/dashboard/command',
      '/dashboard/personnel',
      '/dashboard/faculty',
      '/dashboard/student',
      '/dashboard/party',
      '/dashboard/policy',
      '/dashboard/insurance',
      '/dashboard/analytics',
      '/dashboard/reports',
      '/dashboard/kpis',
      '/dashboard/ai-',
      '/dashboard/research',
      '/dashboard/human-resources',
      '/dashboard/users',
      '/dashboard/monitoring',
      '/dashboard/alerts',
      '/dashboard/notifications',
      '/dashboard/datalake',
      '/dashboard/data',
      '/dashboard/files',
      '/dashboard/training',
      '/dashboard/ml',
      '/dashboard/security',
      '/dashboard/logs',
      '/dashboard/governance',
    ],
    // Chỉ huy Khoa/Phòng - quản lý đơn vị trực thuộc
    CHI_HUY_KHOA_PHONG: [
      '/dashboard/personnel',
      '/dashboard/faculty',
      '/dashboard/student',
      '/dashboard/party',
      '/dashboard/policy',
      '/dashboard/insurance',
      '/dashboard/analytics',
      '/dashboard/reports',
      '/dashboard/kpis',
      '/dashboard/ai-',
      '/dashboard/research',
    ],
    // Chủ nhiệm bộ môn - quản lý bộ môn
    CHU_NHIEM_BO_MON: [
      '/dashboard/department-head',
      '/dashboard/personnel',
      '/dashboard/faculty',
      '/dashboard/student',
      '/dashboard/analytics',
      '/dashboard/reports',
      '/dashboard/research',
    ],
    // Giảng viên - hồ sơ cá nhân và học viên phụ trách
    GIANG_VIEN: [
      '/dashboard/instructor',
      '/dashboard/faculty/profile',
      '/dashboard/faculty/my-students',
      '/dashboard/faculty/subjects',
      '/dashboard/faculty/research',
      '/dashboard/faculty/teaching-analytics',
      '/dashboard/faculty/scientific-profile',
      '/dashboard/student',
      '/dashboard/analytics',
    ],
    // Nghiên cứu viên
    NGHIEN_CUU_VIEN: [
      '/dashboard/research',
      '/dashboard/faculty/research',
      '/dashboard/faculty/profile',
      '/dashboard/faculty/scientific-profile',
      '/dashboard/analytics',
      '/dashboard/datalake',
      '/dashboard/data',
      '/dashboard/files',
    ],
    // Học viên - xem thông tin cá nhân
    HOC_VIEN: [
      '/dashboard/student',
    ],
    HOC_VIEN_SINH_VIEN: [
      '/dashboard/student',
    ],
    // Kỹ thuật viên - giám sát hệ thống
    KY_THUAT_VIEN: [
      '/dashboard/system',
      '/dashboard/monitoring',
      '/dashboard/realtime',
      '/dashboard/services',
      '/dashboard/alerts',
      '/dashboard/logs',
      '/dashboard/datalake',
      '/dashboard/data',
      '/dashboard/files',
      '/dashboard/ml',
      '/dashboard/ai-training',
    ],
  };

  const allowedRoutes = roleRoutes[userRole] || [];
  
  // Check if the route starts with any of the allowed routes
  return allowedRoutes.some(route => routePath.startsWith(route));
}

/**
 * Get default dashboard route for a role
 */
export function getDefaultDashboard(userRole: string): string {
  const defaultRoutes: Record<string, string> = {
    ADMIN: '/dashboard/admin',
    QUAN_TRI_HE_THONG: '/dashboard/admin',
    CHI_HUY_HOC_VIEN: '/dashboard/command',
    CHI_HUY_KHOA_PHONG: '/dashboard/faculty',
    CHU_NHIEM_BO_MON: '/dashboard/department-head',
    GIANG_VIEN: '/dashboard/instructor',
    NGHIEN_CUU_VIEN: '/dashboard/research',
    HOC_VIEN: '/dashboard/student',
    HOC_VIEN_SINH_VIEN: '/dashboard/student',
    KY_THUAT_VIEN: '/dashboard/system',
  };

  return defaultRoutes[userRole] || '/dashboard';
}
