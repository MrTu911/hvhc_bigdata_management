/**
 * API: Quản lý Gán quyền (PositionFunction)
 * D2.3: CRUD cho ma trận Position-Function
 * 
 * RBAC: SYSTEM.VIEW_RBAC, SYSTEM.MANAGE_RBAC
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireFunction } from '@/lib/rbac/middleware';
import { SYSTEM } from '@/lib/rbac/function-codes';
import prisma from '@/lib/db';
import { logAudit } from '@/lib/audit';
import { clearPermissionCache } from '@/lib/rbac/policy';

export const dynamic = 'force-dynamic';

/** Invalidate permission cache cho tất cả users đang giữ positionId này */
async function invalidateCacheForPosition(positionId: string): Promise<number> {
  const affected = await prisma.userPosition.findMany({
    where: { positionId, isActive: true },
    select: { userId: true },
  });
  for (const { userId } of affected) {
    clearPermissionCache(userId);
  }
  return affected.length;
}

// GET: Lấy danh sách assignments
export async function GET(request: NextRequest) {
  try {
    // RBAC Check: SYSTEM.VIEW_RBAC
    const authResult = await requireFunction(request, SYSTEM.VIEW_RBAC);
    if (!authResult.allowed) {
      return authResult.response!;
    }

    const { searchParams } = new URL(request.url);
    const positionId = searchParams.get('positionId');

    const where = positionId
      ? { positionId, isActive: true }
      : { isActive: true };

    const assignments = await prisma.positionFunction.findMany({
      where,
      include: {
        position: { select: { id: true, code: true, name: true } },
        function: { select: { id: true, code: true, name: true, module: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ assignments });
  } catch (error) {
    console.error('Error fetching position-functions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Gán quyền mới
export async function POST(request: NextRequest) {
  try {
    // RBAC Check: SYSTEM.MANAGE_RBAC
    const authResult = await requireFunction(request, SYSTEM.MANAGE_RBAC);
    if (!authResult.allowed) {
      return authResult.response!;
    }
    const user = authResult.user!;

    const data = await request.json();
    const { positionId, functionId, scope = 'UNIT' } = data;

    if (!positionId || !functionId) {
      return NextResponse.json({ error: 'positionId và functionId là bắt buộc' }, { status: 400 });
    }

    // Check if already exists
    const existing = await prisma.positionFunction.findFirst({
      where: { positionId, functionId }
    });

    if (existing) {
      return NextResponse.json({ error: 'Quyền đã được gán' }, { status: 400 });
    }

    const validScopes = ['SELF', 'UNIT', 'DEPARTMENT', 'ACADEMY'];
    const normalizedScope = scope?.toUpperCase();
    const functionScope = validScopes.includes(normalizedScope) ? normalizedScope : 'UNIT';

    const assignment = await prisma.positionFunction.create({
      data: {
        positionId,
        functionId,
        scope: functionScope
      },
      include: {
        position: { select: { code: true, name: true } },
        function: { select: { code: true, name: true } }
      }
    });

    await logAudit({
      userId: user.id,
      functionCode: SYSTEM.MANAGE_RBAC,
      action: 'CREATE',
      resourceType: 'POSITION_FUNCTION',
      resourceId: assignment.id,
      newValue: JSON.stringify({
        position: assignment.position?.code,
        function: assignment.function?.code,
        scope: functionScope
      }),
      result: 'SUCCESS'
    });

    const cacheInvalidated = await invalidateCacheForPosition(positionId);

    return NextResponse.json({ assignment, message: 'Gán quyền thành công', cacheInvalidated });
  } catch (error) {
    console.error('Error creating position-function:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH: Cập nhật scope của assignment
export async function PATCH(request: NextRequest) {
  try {
    // RBAC Check: SYSTEM.MANAGE_RBAC
    const authResult = await requireFunction(request, SYSTEM.MANAGE_RBAC);
    if (!authResult.allowed) {
      return authResult.response!;
    }
    const user = authResult.user!;

    const data = await request.json();
    const { id, scope } = data;

    if (!id || !scope) {
      return NextResponse.json({ error: 'id và scope là bắt buộc' }, { status: 400 });
    }

    // Validate scope
    const validScopes = ['SELF', 'UNIT', 'DEPARTMENT', 'ACADEMY'];
    const normalizedScope = scope.toUpperCase();
    if (!validScopes.includes(normalizedScope)) {
      return NextResponse.json({ error: 'Scope không hợp lệ' }, { status: 400 });
    }

    const existing = await prisma.positionFunction.findUnique({
      where: { id },
      include: {
        position: { select: { code: true, name: true } },
        function: { select: { code: true, name: true } }
      }
    });

    if (!existing) {
      return NextResponse.json({ error: 'Không tìm thấy assignment' }, { status: 404 });
    }

    const oldScope = existing.scope;
    
    const updated = await prisma.positionFunction.update({
      where: { id },
      data: { scope: normalizedScope },
      include: {
        position: { select: { code: true, name: true } },
        function: { select: { code: true, name: true } }
      }
    });

    await logAudit({
      userId: user.id,
      functionCode: SYSTEM.MANAGE_RBAC,
      action: 'UPDATE',
      resourceType: 'POSITION_FUNCTION',
      resourceId: id,
      oldValue: JSON.stringify({ scope: oldScope }),
      newValue: JSON.stringify({ scope: normalizedScope }),
      result: 'SUCCESS'
    });

    const cacheInvalidated = await invalidateCacheForPosition(existing.positionId);

    return NextResponse.json({
      assignment: updated,
      message: `Đã cập nhật scope từ ${oldScope} → ${normalizedScope}`,
      cacheInvalidated,
    });
  } catch (error) {
    console.error('Error updating position-function scope:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: Hủy gán quyền
export async function DELETE(request: NextRequest) {
  try {
    // RBAC Check: SYSTEM.MANAGE_RBAC
    const authResult = await requireFunction(request, SYSTEM.MANAGE_RBAC);
    if (!authResult.allowed) {
      return authResult.response!;
    }
    const user = authResult.user!;

    const data = await request.json();
    const { positionId, functionId } = data;

    if (!positionId || !functionId) {
      return NextResponse.json({ error: 'positionId và functionId là bắt buộc' }, { status: 400 });
    }

    const existing = await prisma.positionFunction.findFirst({
      where: { positionId, functionId },
      include: {
        position: { select: { code: true, name: true } },
        function: { select: { code: true, name: true } }
      }
    });

    if (!existing) {
      return NextResponse.json({ error: 'Không tìm thấy quyền' }, { status: 404 });
    }

    const affectedPositionId = existing.positionId;

    await prisma.positionFunction.delete({
      where: { id: existing.id }
    });

    await logAudit({
      userId: user.id,
      functionCode: SYSTEM.MANAGE_RBAC,
      action: 'DELETE',
      resourceType: 'POSITION_FUNCTION',
      resourceId: existing.id,
      oldValue: JSON.stringify({
        position: existing.position?.code,
        function: existing.function?.code
      }),
      result: 'SUCCESS'
    });

    const cacheInvalidated = await invalidateCacheForPosition(affectedPositionId);

    return NextResponse.json({ message: 'Hủy gán quyền thành công', cacheInvalidated });
  } catch (error) {
    console.error('Error deleting position-function:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
