/**
 * API: Quyền hiệu lực của user đang đăng nhập
 * GET /api/me/permissions
 * Trả về: { functionCodes: string[], scopeByFunction: {}, positions: [], unitId: string }
 * 
 * @version 8.9 - Uses requireAuth for self-permission fetching
 * 
 * v8.3 CHUẨN FUNCTION-BASED RBAC:
 * - KHÔNG bypass theo role string (QUAN_TRI_HE_THONG)
 * - Admin phải có Position = SYSTEM_ADMIN với đầy đủ functionCodes được assign
 * - Tất cả logic dựa trên Position → PositionFunction mapping
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/rbac/middleware';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET - Fetch current user's permissions
 * RBAC: requireAuth (user can always fetch their own permissions)
 */
export async function GET(request: NextRequest) {
  try {
    // Use requireAuth instead of requireFunction to avoid circular dependency
    const authResult = await requireAuth(request);
    if (!authResult.allowed) {
      return authResult.response;
    }
    const user = authResult.user!;
    const userId = user.id;

    // Lấy tất cả chức vụ đang hiệu lực của user (qua UserPosition)
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
                function: true
              }
            }
          }
        },
        unit: true
      },
      orderBy: [
        { isPrimary: 'desc' },
        { startDate: 'desc' },
      ],
    });

    // Tập hợp các function codes và scope
    const functionCodes: Set<string> = new Set();
    const scopeByFunction: Record<string, string> = {};
    const positions: Array<{ 
      id: string; 
      code: string; 
      name: string; 
      unitId?: string; 
      unitName?: string; 
      isPrimary: boolean;
    }> = [];

    // Primary position info
    let primaryUnitId: string | null = null;
    let primaryPositionCode: string | null = null;

    for (const up of userPositions) {
      // Track primary position
      if (up.isPrimary || positions.length === 0) {
        primaryUnitId = up.unitId;
        primaryPositionCode = up.position.code;
      }

      // Thêm thông tin chức vụ
      positions.push({
        id: up.position.id,
        code: up.position.code,
        name: up.position.name,
        unitId: up.unitId || undefined,
        unitName: up.unit?.name,
        isPrimary: up.isPrimary
      });

      // Thêm các quyền của chức vụ này
      // v8.3: Chỉ lấy từ PositionFunction, KHÔNG bypass theo role
      for (const pf of up.position.functions) {
        if (pf.function.isActive) {
          functionCodes.add(pf.function.code);
          // Lưu scope (lấy scope rộng nhất nếu có nhiều)
          const currentScope = scopeByFunction[pf.function.code];
          const newScope = pf.scope;
          if (!currentScope || scopePriority(newScope) > scopePriority(currentScope)) {
            scopeByFunction[pf.function.code] = newScope;
          }
        }
      }
    }

    // v8.3: REMOVED - Role-based bypass
    // Admin PHẢI có Position = SYSTEM_ADMIN với functions được assign
    // Không còn auto-grant full quyền theo role string

    return NextResponse.json({
      functionCodes: Array.from(functionCodes),
      scopeByFunction,
      positions,
      role: (user as any).role,
      // v8.3: Thêm unitId và primaryPositionCode
      unitId: primaryUnitId,
      primaryPositionCode,
    });
  } catch (error) {
    console.error('Error fetching user permissions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper: Độ ưu tiên của scope (higher = broader access)
function scopePriority(scope: string): number {
  switch (scope) {
    case 'ACADEMY': return 4;
    case 'DEPARTMENT': return 3;
    case 'UNIT': return 2;
    case 'SELF': return 1;
    case 'INDIVIDUAL': return 1;
    default: return 0;
  }
}
