import "server-only";
/**
 * Permission Grant System - Phase 3
 * Hệ thống phân quyền chi tiết theo QĐ 144/BQP
 * 
 * Features:
 * - Cấp quyền theo UNIT hoặc PERSONNEL cụ thể
 * - Hỗ trợ thời hạn (expiresAt)
 * - Audit logging đầy đủ
 * - Kiểm tra field-level cho dữ liệu nhạy cảm
 */

import { prisma } from '@/lib/db';
import { PermissionType, PermissionScopeType, UserRole } from '@prisma/client';
import { logView } from '@/lib/audit-service';

// Danh sách field nhạy cảm cần quyền PERSONNEL_EDIT_SENSITIVE
export const SENSITIVE_FIELDS = [
  'citizenId',
  'militaryIdNumber',
  'partyCardNumber',
  'insuranceNumber',
  'healthInsuranceNumber',
  'bankAccount',
  'beneficiaryPhone',
];

// Roles có quyền admin mặc định (bypass permission grant)
export const ADMIN_ROLES: UserRole[] = [
  UserRole.ADMIN,
  UserRole.QUAN_TRI_HE_THONG,
];

// Roles có quyền view mặc định theo đơn vị
export const UNIT_COMMANDER_ROLES: UserRole[] = [
  UserRole.CHI_HUY_HOC_VIEN,
  UserRole.CHI_HUY_KHOA_PHONG,
  UserRole.CHU_NHIEM_BO_MON,
];

interface PermissionCheckResult {
  allowed: boolean;
  reason?: string;
  scope?: PermissionScopeType;
  grantId?: string;
}

interface PermissionCheckOptions {
  personnelId?: string;      // ID của cán bộ cần thao tác
  unitId?: string;           // Unit của cán bộ cần thao tác
  fields?: string[];         // Các field đang được sửa (để check sensitive)
}

/**
 * Lấy danh sách unit IDs mà user được phân quyền
 */
async function getSubordinateUnitIds(unitId: string): Promise<string[]> {
  const result: string[] = [unitId];
  const children = await prisma.unit.findMany({
    where: { parentId: unitId },
    select: { id: true },
  });
  for (const child of children) {
    const childUnits = await getSubordinateUnitIds(child.id);
    result.push(...childUnits);
  }
  return result;
}

/**
 * Kiểm tra quyền của user
 * 
 * Logic ưu tiên:
 * 1. Admin roles → cho phép tất cả
 * 2. Grant với scope ALL → cho phép
 * 3. Grant với scope UNIT → kiểm tra personnel thuộc unit
 * 4. Grant với scope PERSONNEL → kiểm tra personnelId trong danh sách
 * 5. Grant với scope SELF → chỉ cho phép thao tác bản thân
 */
export async function checkPermission(
  userId: string,
  userRole: UserRole,
  permission: PermissionType,
  options: PermissionCheckOptions = {}
): Promise<PermissionCheckResult> {
  const { personnelId, unitId, fields = [] } = options;

  // 1. Admin bypass
  if (ADMIN_ROLES.includes(userRole)) {
    return { allowed: true, reason: 'Admin role', scope: PermissionScopeType.ALL };
  }

  // 2. Kiểm tra nếu sửa field nhạy cảm mà không có quyền SENSITIVE
  if (permission === PermissionType.PERSONNEL_EDIT && fields.length > 0) {
    const sensitiveFieldsInRequest = fields.filter(f => SENSITIVE_FIELDS.includes(f));
    if (sensitiveFieldsInRequest.length > 0) {
      // Cần kiểm tra quyền PERSONNEL_EDIT_SENSITIVE thay vì PERSONNEL_EDIT
      const sensitiveCheck = await checkPermission(
        userId,
        userRole,
        PermissionType.PERSONNEL_EDIT_SENSITIVE,
        { personnelId, unitId }
      );
      if (!sensitiveCheck.allowed) {
        return {
          allowed: false,
          reason: `Không có quyền sửa thông tin nhạy cảm: ${sensitiveFieldsInRequest.join(', ')}`,
        };
      }
    }
  }

  // 3. Lấy tất cả grants còn hiệu lực của user
  const now = new Date();
  const grants = await prisma.userPermissionGrant.findMany({
    where: {
      userId,
      permission,
      isRevoked: false,
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: now } },
      ],
    },
    include: {
      personnelGrants: true,
    },
    orderBy: [
      // Ưu tiên scope ALL > UNIT > PERSONNEL > SELF
      { scopeType: 'asc' },
    ],
  });

  if (grants.length === 0) {
    // Không có grant nào → kiểm tra role mặc định
    return checkDefaultRolePermission(userId, userRole, permission, options);
  }

  // 4. Kiểm tra từng grant theo thứ tự ưu tiên
  for (const grant of grants) {
    switch (grant.scopeType) {
      case PermissionScopeType.ALL:
        return { allowed: true, scope: grant.scopeType, grantId: grant.id };

      case PermissionScopeType.UNIT:
        if (grant.unitId && unitId) {
          const subordinateUnits = await getSubordinateUnitIds(grant.unitId);
          if (subordinateUnits.includes(unitId)) {
            return { allowed: true, scope: grant.scopeType, grantId: grant.id };
          }
        }
        break;

      case PermissionScopeType.PERSONNEL:
        if (personnelId) {
          const personnelIds = grant.personnelGrants.map(pg => pg.personnelId);
          if (personnelIds.includes(personnelId)) {
            return { allowed: true, scope: grant.scopeType, grantId: grant.id };
          }
        }
        break;

      case PermissionScopeType.SELF:
        if (personnelId === userId) {
          return { allowed: true, scope: grant.scopeType, grantId: grant.id };
        }
        break;
    }
  }

  return { allowed: false, reason: 'Không có quyền phù hợp' };
}

/**
 * Kiểm tra quyền mặc định theo role (không cần grant)
 */
async function checkDefaultRolePermission(
  userId: string,
  userRole: UserRole,
  permission: PermissionType,
  options: PermissionCheckOptions
): Promise<PermissionCheckResult> {
  const { personnelId, unitId } = options;

  // Chỉ huy đơn vị có quyền VIEW theo đơn vị
  if (UNIT_COMMANDER_ROLES.includes(userRole) && permission === PermissionType.PERSONNEL_VIEW) {
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { unitId: true },
    });

    if (currentUser?.unitId) {
      const subordinateUnits = await getSubordinateUnitIds(currentUser.unitId);
      if (unitId && subordinateUnits.includes(unitId)) {
        return { allowed: true, reason: 'Unit commander role', scope: PermissionScopeType.UNIT };
      }
    }
  }

  // Mọi user đều có thể xem bản thân
  if (permission === PermissionType.PERSONNEL_VIEW && personnelId === userId) {
    return { allowed: true, reason: 'Self access', scope: PermissionScopeType.SELF };
  }

  return { allowed: false, reason: 'Không có quyền mặc định' };
}

/**
 * Helper function để sử dụng trong API routes
 * Throw error nếu không có quyền
 */
export async function requirePermission(
  userId: string,
  userRole: UserRole,
  permission: PermissionType,
  options: PermissionCheckOptions = {}
): Promise<{ scope: PermissionScopeType; grantId?: string }> {
  const result = await checkPermission(userId, userRole, permission, options);
  
  if (!result.allowed) {
    const error = new Error(result.reason || 'Không có quyền thực hiện thao tác này');
    (error as any).statusCode = 403;
    throw error;
  }

  return { scope: result.scope!, grantId: result.grantId };
}

/**
 * Lấy danh sách personnel IDs mà user có quyền thao tác
 * Dùng cho filter trong danh sách
 */
export async function getAccessiblePersonnelIds(
  userId: string,
  userRole: UserRole,
  permission: PermissionType
): Promise<{ type: 'all' | 'list'; ids?: string[] }> {
  // Admin
  if (ADMIN_ROLES.includes(userRole)) {
    return { type: 'all' };
  }

  const now = new Date();
  const grants = await prisma.userPermissionGrant.findMany({
    where: {
      userId,
      permission,
      isRevoked: false,
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: now } },
      ],
    },
    include: {
      personnelGrants: true,
    },
  });

  // Có grant ALL
  if (grants.some(g => g.scopeType === PermissionScopeType.ALL)) {
    return { type: 'all' };
  }

  const personnelIds = new Set<string>();

  for (const grant of grants) {
    if (grant.scopeType === PermissionScopeType.UNIT && grant.unitId) {
      // Lấy tất cả user trong unit và unit con
      const subordinateUnits = await getSubordinateUnitIds(grant.unitId);
      const usersInUnits = await prisma.user.findMany({
        where: { unitId: { in: subordinateUnits } },
        select: { id: true },
      });
      usersInUnits.forEach(u => personnelIds.add(u.id));
    } else if (grant.scopeType === PermissionScopeType.PERSONNEL) {
      grant.personnelGrants.forEach(pg => personnelIds.add(pg.personnelId));
    } else if (grant.scopeType === PermissionScopeType.SELF) {
      personnelIds.add(userId);
    }
  }

  // Thêm từ role mặc định (chỉ huy đơn vị)
  if (UNIT_COMMANDER_ROLES.includes(userRole) && permission === PermissionType.PERSONNEL_VIEW) {
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { unitId: true },
    });
    if (currentUser?.unitId) {
      const subordinateUnits = await getSubordinateUnitIds(currentUser.unitId);
      const usersInUnits = await prisma.user.findMany({
        where: { unitId: { in: subordinateUnits } },
        select: { id: true },
      });
      usersInUnits.forEach(u => personnelIds.add(u.id));
    }
  }

  // Luôn có thể xem bản thân
  if (permission === PermissionType.PERSONNEL_VIEW) {
    personnelIds.add(userId);
  }

  return { type: 'list', ids: Array.from(personnelIds) };
}

/**
 * Kiểm tra xem một field có phải là field nhạy cảm không
 */
export function isSensitiveField(fieldName: string): boolean {
  return SENSITIVE_FIELDS.includes(fieldName);
}

/**
 * Lọc ra các field nhạy cảm từ một object
 */
export function getSensitiveFields(data: Record<string, any>): string[] {
  return Object.keys(data).filter(key => SENSITIVE_FIELDS.includes(key) && data[key] !== undefined);
}
