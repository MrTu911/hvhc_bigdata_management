/**
 * RBAC Scope Handler v8.3
 * Xử lý phạm vi quyền: SELF, UNIT, DEPARTMENT, ACADEMY
 * 
 * NGUYÊN TẮC:
 * - ACADEMY: Full access to all units
 * - DEPARTMENT: Access to user's unit and all descendant units
 * - UNIT: Access only to user's unit
 * - SELF: Access only to own resources
 */

import { FunctionScope } from '@prisma/client';
import { AuthUser, AuthContext } from './types';
import prisma from '@/lib/db';

// Cache for department hierarchy (TTL: 5 minutes)
const departmentCache = new Map<string, { units: string[]; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000;

/**
 * Kiểm tra scope có cho phép truy cập resource không
 * 
 * @param userScope - Scope của user (ACADEMY, DEPARTMENT, UNIT, SELF)
 * @param user - User hiện tại
 * @param context - Ngữ cảnh (resourceUnitId, resourceOwnerId, targetUnitId)
 */
export function checkScope(
  userScope: FunctionScope,
  user: AuthUser,
  context: AuthContext
): { allowed: boolean; reason?: string } {
  switch (userScope) {
    case 'ACADEMY':
      // Quyền toàn học viện - luôn được phép
      return { allowed: true, reason: 'Quyền toàn học viện' };

    case 'DEPARTMENT':
      // DEPARTMENT scope yêu cầu kiểm tra hierarchy bất đồng bộ.
      // Sync path chỉ cho phép khi không cần kiểm tra đơn vị (resourceUnitId không có).
      // Mọi trường hợp cần kiểm tra hierarchy phải dùng checkScopeAsync().
      if (!context.resourceUnitId) {
        return { allowed: true, reason: 'Không yêu cầu kiểm tra đơn vị' };
      }
      // Sync check: cùng unit thì cho phép ngay
      if (context.resourceUnitId === user.unitId) {
        return { allowed: true, reason: 'Cùng đơn vị' };
      }
      // FAIL-CLOSED: Không thể kiểm tra hierarchy ở sync mode.
      // Caller phải dùng checkScopeAsync() để kiểm tra đúng.
      return { allowed: false, reason: 'DEPARTMENT scope yêu cầu kiểm tra hierarchy — dùng checkScopeAsync()' };

    case 'UNIT':
      // Quyền trong đơn vị
      if (!context.resourceUnitId) {
        return { allowed: true, reason: 'Không yêu cầu kiểm tra đơn vị' };
      }
      if (context.resourceUnitId === user.unitId) {
        return { allowed: true, reason: 'Cùng đơn vị' };
      }
      return { allowed: false, reason: 'Khác đơn vị' };

    case 'SELF':
      // Chỉ dữ liệu của bản thân
      if (!context.resourceOwnerId) {
        return { allowed: true, reason: 'Không yêu cầu kiểm tra chủ sở hữu' };
      }
      if (context.resourceOwnerId === user.id) {
        return { allowed: true, reason: 'Dữ liệu của bản thân' };
      }
      return { allowed: false, reason: 'Không phải dữ liệu của bản thân' };

    default:
      return { allowed: false, reason: 'Scope không hợp lệ' };
  }
}

/**
 * Kiểm tra scope bất đồng bộ (cho DEPARTMENT scope)
 * Sử dụng khi cần kiểm tra hierarchy
 */
export async function checkScopeAsync(
  userScope: FunctionScope,
  user: AuthUser,
  context: AuthContext
): Promise<{ allowed: boolean; reason?: string }> {
  // Sync check trước
  const syncResult = checkScope(userScope, user, context);
  
  // Nếu không phải DEPARTMENT scope hoặc đã có kết quả rõ ràng, return ngay
  if (userScope !== 'DEPARTMENT' || !context.resourceUnitId || !user.unitId) {
    return syncResult;
  }
  
  // DEPARTMENT scope async check
  try {
    const accessibleUnits = await getAccessibleUnitIds(user, 'DEPARTMENT');
    
    if (accessibleUnits.includes(context.resourceUnitId)) {
      return { allowed: true, reason: 'Resource thuộc phạm vi khoa/phòng' };
    }
    
    return { allowed: false, reason: 'Resource không thuộc phạm vi khoa/phòng của bạn' };
  } catch (error) {
    console.error('[RBAC] Error checking DEPARTMENT scope:', error);
    // FAIL-CLOSED: Lỗi → DENY
    return { allowed: false, reason: 'Lỗi kiểm tra phạm vi' };
  }
}

/**
 * Lấy danh sách unit IDs mà user có quyền truy cập
 */
export async function getAccessibleUnitIds(
  user: AuthUser,
  scope: FunctionScope
): Promise<string[]> {
  if (scope === 'ACADEMY') {
    // Trả về tất cả unit IDs
    const units = await prisma.unit.findMany({
      where: { active: true },
      select: { id: true },
    });
    return units.map((u) => u.id);
  }

  if (scope === 'DEPARTMENT' && user.unitId) {
    // Trả về unit của user và các unit con
    const units = await getUnitAndDescendants(user.unitId);
    return units;
  }

  if (scope === 'UNIT' && user.unitId) {
    return [user.unitId];
  }

  return [];
}

/**
 * Lấy unit và tất cả unit con
 */
async function getUnitAndDescendants(unitId: string): Promise<string[]> {
  const result: string[] = [unitId];

  const children = await prisma.unit.findMany({
    where: { parentId: unitId, active: true },
    select: { id: true },
  });

  for (const child of children) {
    const descendants = await getUnitAndDescendants(child.id);
    result.push(...descendants);
  }

  return result;
}

/**
 * Kiểm tra user có trong cùng hierarchy với target unit không
 */
export async function isInSameHierarchy(
  userUnitId: string | null | undefined,
  targetUnitId: string
): Promise<boolean> {
  if (!userUnitId) return false;

  // Lấy cây đơn vị của user
  const userUnits = await getUnitAndAncestors(userUnitId);
  const targetUnits = await getUnitAndAncestors(targetUnitId);

  // Kiểm tra có giao nhau không
  return userUnits.some((u) => targetUnits.includes(u));
}

/**
 * Lấy unit và tất cả unit cha
 */
async function getUnitAndAncestors(unitId: string): Promise<string[]> {
  const result: string[] = [unitId];

  const unit = await prisma.unit.findUnique({
    where: { id: unitId },
    select: { parentId: true },
  });

  if (unit?.parentId) {
    const ancestors = await getUnitAndAncestors(unit.parentId);
    result.push(...ancestors);
  }

  return result;
}
