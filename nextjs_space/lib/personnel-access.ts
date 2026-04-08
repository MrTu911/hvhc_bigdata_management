import "server-only";
/**
 * Personnel Access Control - Scope-based RBAC
 * Phase 2: SELF/UNIT/ALL permissions
 */

import { prisma } from '@/lib/db';
import { UserRole } from '@prisma/client';

/**
 * Access scopes for personnel data
 */
export type AccessScope = 'SELF' | 'UNIT' | 'ALL';

/**
 * Permission types for personnel
 */
export type PersonnelPermission = 'VIEW' | 'CREATE' | 'UPDATE' | 'DELETE' | 'EXPORT';

/**
 * Role to scope mapping
 */
const ROLE_SCOPE_MAP: Record<UserRole, AccessScope> = {
  // Quản trị hệ thống - full access
  QUAN_TRI_HE_THONG: 'ALL',
  ADMIN: 'ALL',
  
  // Chỉ huy cấp cao
  CHI_HUY_HOC_VIEN: 'ALL',
  CHI_HUY_KHOA_PHONG: 'UNIT',
  
  // Chỉ huy cấp trung (MỚI)
  CHI_HUY_HE: 'UNIT',
  CHI_HUY_TIEU_DOAN: 'UNIT',
  CHI_HUY_BAN: 'UNIT',
  CHI_HUY_BO_MON: 'UNIT',
  CHU_NHIEM_BO_MON: 'UNIT', // @deprecated - giữ để tương thích
  
  // Giảng viên & Nghiên cứu
  GIANG_VIEN: 'SELF',
  NGHIEN_CUU_VIEN: 'SELF',
  
  // Nhân viên hỗ trợ (MỚI)
  TRO_LY: 'UNIT',
  NHAN_VIEN: 'SELF',
  KY_THUAT_VIEN: 'SELF',
  
  // Học viên
  HOC_VIEN: 'SELF',
  HOC_VIEN_SINH_VIEN: 'SELF',
};

/**
 * Role to permissions mapping
 */
const ROLE_PERMISSIONS: Record<UserRole, PersonnelPermission[]> = {
  // Quản trị hệ thống - full permissions
  QUAN_TRI_HE_THONG: ['VIEW', 'CREATE', 'UPDATE', 'DELETE', 'EXPORT'],
  ADMIN: ['VIEW', 'CREATE', 'UPDATE', 'DELETE', 'EXPORT'],
  
  // Chỉ huy cấp cao
  CHI_HUY_HOC_VIEN: ['VIEW', 'CREATE', 'UPDATE', 'DELETE', 'EXPORT'],
  CHI_HUY_KHOA_PHONG: ['VIEW', 'CREATE', 'UPDATE', 'EXPORT'],
  
  // Chỉ huy cấp trung (MỚI)
  CHI_HUY_HE: ['VIEW', 'UPDATE', 'EXPORT'],
  CHI_HUY_TIEU_DOAN: ['VIEW', 'UPDATE', 'EXPORT'],
  CHI_HUY_BAN: ['VIEW', 'UPDATE'],
  CHI_HUY_BO_MON: ['VIEW', 'UPDATE'],
  CHU_NHIEM_BO_MON: ['VIEW', 'UPDATE'], // @deprecated
  
  // Giảng viên & Nghiên cứu
  GIANG_VIEN: ['VIEW'],
  NGHIEN_CUU_VIEN: ['VIEW'],
  
  // Nhân viên hỗ trợ (MỚI)
  TRO_LY: ['VIEW', 'CREATE', 'UPDATE'],
  NHAN_VIEN: ['VIEW'],
  KY_THUAT_VIEN: ['VIEW'],
  
  // Học viên
  HOC_VIEN: ['VIEW'],
  HOC_VIEN_SINH_VIEN: ['VIEW'],
};

/**
 * Get user's access scope for personnel data
 */
export function getUserScope(role: UserRole): AccessScope {
  return ROLE_SCOPE_MAP[role] || 'SELF';
}

/**
 * Check if user has permission
 */
export function hasPermission(
  role: UserRole,
  permission: PersonnelPermission
): boolean {
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes(permission);
}

/**
 * Check if user can access specific personnel record
 * @param currentUserId - ID of the current user
 * @param currentUserRole - Role of the current user
 * @param currentUserUnitId - Unit ID of the current user
 * @param targetPersonnelId - ID of the personnel to access
 * @param permission - Required permission
 */
export async function canAccessPersonnel(
  currentUserId: string,
  currentUserRole: UserRole,
  currentUserUnitId: string | null,
  targetPersonnelId: string,
  permission: PersonnelPermission = 'VIEW'
): Promise<boolean> {
  // Check if user has the required permission
  if (!hasPermission(currentUserRole, permission)) {
    return false;
  }

  const scope = getUserScope(currentUserRole);

  // ALL scope - can access any personnel
  if (scope === 'ALL') {
    return true;
  }

  // SELF scope - can only access own record
  if (scope === 'SELF') {
    return currentUserId === targetPersonnelId;
  }

  // UNIT scope - can access personnel in same unit or child units
  if (scope === 'UNIT' && currentUserUnitId) {
    const targetUser = await prisma.user.findUnique({
      where: { id: targetPersonnelId },
      select: { unitId: true },
    });

    if (!targetUser) return false;

    // Same unit
    if (targetUser.unitId === currentUserUnitId) {
      return true;
    }

    // Check if target's unit is a child of current user's unit
    if (targetUser.unitId) {
      const childUnits = await getChildUnitIds(currentUserUnitId);
      return childUnits.includes(targetUser.unitId);
    }
  }

  return false;
}

/**
 * Get all child unit IDs recursively
 */
async function getChildUnitIds(parentUnitId: string): Promise<string[]> {
  const children = await prisma.unit.findMany({
    where: { parentId: parentUnitId },
    select: { id: true },
  });

  const childIds = children.map(c => c.id);
  
  // Recursively get grandchildren
  for (const childId of childIds) {
    const grandchildren = await getChildUnitIds(childId);
    childIds.push(...grandchildren);
  }

  return childIds;
}

/**
 * Build where clause based on user's scope
 * Used for listing personnel
 */
export async function buildScopeWhereClause(
  currentUserId: string,
  currentUserRole: UserRole,
  currentUserUnitId: string | null
): Promise<Record<string, any>> {
  const scope = getUserScope(currentUserRole);

  if (scope === 'ALL') {
    return {}; // No restriction
  }

  if (scope === 'SELF') {
    return { userId: currentUserId };
  }

  if (scope === 'UNIT' && currentUserUnitId) {
    const childUnitIds = await getChildUnitIds(currentUserUnitId);
    const allowedUnitIds = [currentUserUnitId, ...childUnitIds];
    
    return {
      user: {
        unitId: { in: allowedUnitIds },
      },
    };
  }

  // Default: only self
  return { userId: currentUserId };
}

/**
 * Get accessible personnel IDs for a user
 */
export async function getAccessiblePersonnelIds(
  currentUserId: string,
  currentUserRole: UserRole,
  currentUserUnitId: string | null
): Promise<string[] | 'ALL'> {
  const scope = getUserScope(currentUserRole);

  if (scope === 'ALL') {
    return 'ALL';
  }

  if (scope === 'SELF') {
    return [currentUserId];
  }

  if (scope === 'UNIT' && currentUserUnitId) {
    const childUnitIds = await getChildUnitIds(currentUserUnitId);
    const allowedUnitIds = [currentUserUnitId, ...childUnitIds];
    
    const users = await prisma.user.findMany({
      where: { unitId: { in: allowedUnitIds } },
      select: { id: true },
    });
    
    return users.map(u => u.id);
  }

  return [currentUserId];
}
