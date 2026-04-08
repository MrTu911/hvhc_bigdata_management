/**
 * RBAC Policy Engine
 * Lấy và kiểm tra policy từ PositionFunction
 */

import { FunctionScope } from '@prisma/client';
import prisma from '@/lib/db';
import { AuthUser, PermissionEntry } from './types';

// Cache for user permissions (5 minutes)
const permissionCache = new Map<string, { permissions: PermissionEntry[]; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Lấy tất cả quyền của user từ UserPosition + PositionFunction
 */
export async function getUserPermissions(userId: string): Promise<PermissionEntry[]> {
  // Check cache
  const cached = permissionCache.get(userId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.permissions;
  }

  // Query from database
  const userPositions = await prisma.userPosition.findMany({
    where: {
      userId,
      isActive: true,
      OR: [
        { endDate: null },
        { endDate: { gte: new Date() } },
      ],
    },
    include: {
      position: {
        include: {
          functions: {
            where: { isActive: true },
            include: {
              function: true,
            },
          },
        },
      },
    },
  });

  const permissions: PermissionEntry[] = [];

  for (const up of userPositions) {
    for (const pf of up.position.functions) {
      permissions.push({
        functionCode: pf.function.code,
        functionName: pf.function.name,
        scope: pf.scope,
        positionCode: up.position.code,
        positionName: up.position.name,
        unitId: up.unitId,
        conditions: pf.conditions as Record<string, unknown> | null,
      });
    }
  }

  // Update cache
  permissionCache.set(userId, { permissions, timestamp: Date.now() });

  return permissions;
}

/**
 * Kiểm tra user có quyền với function code không
 */
export async function hasPermission(
  userId: string,
  functionCode: string
): Promise<{ hasPermission: boolean; scope?: FunctionScope; permission?: PermissionEntry }> {
  const permissions = await getUserPermissions(userId);

  // Tìm quyền với scope rộng nhất
  const matchedPermissions = permissions.filter((p) => p.functionCode === functionCode);

  if (matchedPermissions.length === 0) {
    return { hasPermission: false };
  }

  // Sắp xếp theo scope rộng nhất (ACADEMY > DEPARTMENT > UNIT > SELF)
  const scopePriority: Record<FunctionScope, number> = {
    ACADEMY: 4,
    DEPARTMENT: 3,
    UNIT: 2,
    SELF: 1,
  };

  matchedPermissions.sort((a, b) => scopePriority[b.scope] - scopePriority[a.scope]);

  const bestPermission = matchedPermissions[0];
  return {
    hasPermission: true,
    scope: bestPermission.scope,
    permission: bestPermission,
  };
}

/**
 * Lấy danh sách function codes mà user có quyền
 */
export async function getUserFunctionCodes(userId: string): Promise<string[]> {
  const permissions = await getUserPermissions(userId);
  return [...new Set(permissions.map((p) => p.functionCode))];
}

/**
 * Clear cache khi có thay đổi quyền
 */
export function clearPermissionCache(userId?: string): void {
  if (userId) {
    permissionCache.delete(userId);
  } else {
    permissionCache.clear();
  }
}

/**
 * Kiểm tra user có quyền với module không
 */
export async function hasModuleAccess(
  userId: string,
  module: string
): Promise<boolean> {
  const permissions = await getUserPermissions(userId);
  return permissions.some((p) => p.functionCode.toLowerCase().includes(module.toLowerCase()));
}
