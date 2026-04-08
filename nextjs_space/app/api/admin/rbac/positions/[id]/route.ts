/**
 * API: Chi tiết Chức vụ - Position Detail
 * GET /api/admin/rbac/positions/:id
 * PUT /api/admin/rbac/positions/:id
 * DELETE /api/admin/rbac/positions/:id
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireFunction } from '@/lib/rbac/middleware';
import { SYSTEM } from '@/lib/rbac/function-codes';
import prisma from '@/lib/db';
import { logAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

// GET - Lấy chi tiết position với functions và users
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireAuth(request);
    if (!authResult.allowed) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const positionId = params.id;

    // Lấy position với functions và user positions
    const position = await prisma.position.findUnique({
      where: { id: positionId },
      include: {
        functions: {
          include: {
            function: true
          }
        },
        userPositions: {
          where: { endDate: null }, // Chỉ lấy active
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                rank: true,
              }
            },
            unit: {
              select: {
                name: true
              }
            }
          }
        },
      }
    });

    if (!position) {
      return NextResponse.json({ error: 'Position not found' }, { status: 404 });
    }

    // Format functions
    const functions = position.functions.map((pf: any) => ({
      id: pf.function.id,
      code: pf.function.code,
      name: pf.function.name,
      module: pf.function.module,
      actionType: pf.function.actionType,
      scope: pf.scope,
    }));

    // Format users
    const users = position.userPositions.map((up: any) => ({
      id: up.user!.id,
      name: up.user!.name,
      email: up.user!.email,
      rank: up.user.rank,
      unitName: up.unit?.name,
    }));

    return NextResponse.json({
      position: {
        id: position.id,
        code: position.code,
        name: position.name,
        description: position.description,
        positionScope: position.positionScope,
        isActive: position.isActive,
        _count: {
          positionFunctions: position.functions.length,
          userPositions: position.userPositions.length,
        },
      },
      functions,
      users,
    });
  } catch (error) {
    console.error('Error fetching position detail:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Cập nhật position
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireFunction(request, SYSTEM.MANAGE_RBAC);
    if (!authResult.allowed) {
      return NextResponse.json({ error: authResult.authResult?.deniedReason || 'Không có quyền' || 'Forbidden' }, { status: 403 });
    }
    const { user } = authResult;

    const positionId = params.id;
    const body = await request.json();
    const { code, name, description, positionScope, isActive } = body;

    // Validate
    if (!code || !name) {
      return NextResponse.json({ error: 'Code và Name là bắt buộc' }, { status: 400 });
    }

    // Check duplicate code
    const existing = await prisma.position.findFirst({
      where: {
        code,
        id: { not: positionId }
      }
    });
    if (existing) {
      return NextResponse.json({ error: 'Mã chức vụ đã tồn tại' }, { status: 409 });
    }

    const oldPosition = await prisma.position.findUnique({ where: { id: positionId } });

    const updated = await prisma.position.update({
      where: { id: positionId },
      data: {
        code,
        name,
        description,
        positionScope: positionScope || 'UNIT',
        isActive: isActive ?? true,
      }
    });

    await logAudit({
      userId: user!.id,
      functionCode: SYSTEM.MANAGE_RBAC,
      action: 'UPDATE',
      resourceType: 'POSITION',
      resourceId: positionId,
      oldValue: oldPosition,
      newValue: updated,
      result: 'SUCCESS'
    });

    return NextResponse.json({ position: updated });
  } catch (error) {
    console.error('Error updating position:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Xóa position
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireFunction(request, SYSTEM.MANAGE_RBAC);
    if (!authResult.allowed) {
      return NextResponse.json({ error: authResult.authResult?.deniedReason || 'Không có quyền' || 'Forbidden' }, { status: 403 });
    }
    const { user } = authResult;

    const positionId = params.id;

    // Check if position has users
    const usersCount = await prisma.userPosition.count({
      where: { 
        positionId,
        endDate: null
      }
    });

    if (usersCount > 0) {
      return NextResponse.json({ 
        error: `Không thể xóa - Chức vụ đang được gán cho ${usersCount} người dùng` 
      }, { status: 400 });
    }

    const oldPosition = await prisma.position.findUnique({ where: { id: positionId } });

    // Delete position functions first
    await prisma.positionFunction.deleteMany({
      where: { positionId }
    });

    // Delete position
    await prisma.position.delete({
      where: { id: positionId }
    });

    await logAudit({
      userId: user!.id,
      functionCode: SYSTEM.MANAGE_RBAC,
      action: 'DELETE',
      resourceType: 'POSITION',
      resourceId: positionId,
      oldValue: oldPosition,
      result: 'SUCCESS'
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting position:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
