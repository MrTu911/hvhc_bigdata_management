/**
 * API: Quản lý Chức vụ (Position)
 * D2.1: CRUD cho bảng Position
 * 
 * v8.3: Migrated to Function-based RBAC
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { logAudit } from '@/lib/audit';
import { requireFunction } from '@/lib/rbac/middleware';
import { SYSTEM } from '@/lib/rbac/function-codes';

export const dynamic = 'force-dynamic';

// GET: Lấy danh sách positions
export async function GET(request: NextRequest) {
  // RBAC Check: MANAGE_POSITIONS hoặc VIEW_RBAC
  const authResult = await requireFunction(request, SYSTEM.MANAGE_POSITIONS);
  if (!authResult.allowed) {
    return authResult.response!;
  }

  try {
    const positions = await prisma.position.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { 
            functions: true,
            userPositions: true
          }
        }
      }
    });

    // Map to frontend format
    const mappedPositions = positions.map(p => ({
      id: p.id,
      code: p.code,
      name: p.name,
      description: p.description,
      positionScope: p.positionScope,
      scope: p.positionScope.toLowerCase(),
      level: p.level,
      isActive: p.isActive,
      _count: { 
        positionFunctions: p._count.functions,
        userPositions: p._count.userPositions
      }
    }));

    return NextResponse.json({ positions: mappedPositions });
  } catch (error) {
    console.error('Error fetching positions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Tạo position mới
export async function POST(request: NextRequest) {
  // RBAC Check: MANAGE_POSITIONS
  const authResult = await requireFunction(request, SYSTEM.MANAGE_POSITIONS);
  if (!authResult.allowed) {
    return authResult.response!;
  }

  try {
    const data = await request.json();
    const { code, name, description, scope } = data;

    if (!code || !name) {
      return NextResponse.json({ error: 'code và name là bắt buộc' }, { status: 400 });
    }

    // Map scope to enum
    const positionScope = scope?.toUpperCase() === 'SELF' ? 'SELF'
      : scope?.toUpperCase() === 'ACADEMY' ? 'ACADEMY'
      : scope?.toUpperCase() === 'DEPARTMENT' ? 'DEPARTMENT'
      : 'UNIT';

    const position = await prisma.position.create({
      data: {
        code: code.toUpperCase(),
        name,
        description,
        positionScope,
      }
    });

    await logAudit({
      userId: authResult.user!.id,
      functionCode: SYSTEM.MANAGE_POSITIONS,
      action: 'CREATE',
      resourceType: 'POSITION',
      resourceId: position.id,
      newValue: JSON.stringify(position),
      result: 'SUCCESS'
    });

    return NextResponse.json({ position, message: 'Tạo chức vụ thành công' });
  } catch (error: unknown) {
    console.error('Error creating position:', error);
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return NextResponse.json({ error: 'Mã chức vụ đã tồn tại' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT: Cập nhật position
export async function PUT(request: NextRequest) {
  // RBAC Check: MANAGE_POSITIONS
  const authResult = await requireFunction(request, SYSTEM.MANAGE_POSITIONS);
  if (!authResult.allowed) {
    return authResult.response!;
  }

  try {
    const data = await request.json();
    const { id, code, name, description, scope, isActive } = data;

    if (!id) {
      return NextResponse.json({ error: 'id là bắt buộc' }, { status: 400 });
    }

    const oldPosition = await prisma.position.findUnique({ where: { id } });

    // Build update payload — only include fields that were explicitly provided
    const updateData: Record<string, unknown> = {};
    if (code !== undefined) updateData.code = code.toUpperCase();
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (scope !== undefined) {
      updateData.positionScope = scope.toUpperCase() === 'SELF' ? 'SELF'
        : scope.toUpperCase() === 'ACADEMY' ? 'ACADEMY'
        : scope.toUpperCase() === 'DEPARTMENT' ? 'DEPARTMENT'
        : 'UNIT';
    }

    const position = await prisma.position.update({
      where: { id },
      data: updateData,
    });

    await logAudit({
      userId: authResult.user!.id,
      functionCode: SYSTEM.MANAGE_POSITIONS,
      action: 'UPDATE',
      resourceType: 'POSITION',
      resourceId: position.id,
      oldValue: JSON.stringify(oldPosition),
      newValue: JSON.stringify(position),
      result: 'SUCCESS'
    });

    return NextResponse.json({ position, message: 'Cập nhật chức vụ thành công' });
  } catch (error) {
    console.error('Error updating position:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: Xóa position
export async function DELETE(request: NextRequest) {
  // RBAC Check: MANAGE_POSITIONS
  const authResult = await requireFunction(request, SYSTEM.MANAGE_POSITIONS);
  if (!authResult.allowed) {
    return authResult.response!;
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id là bắt buộc' }, { status: 400 });
    }

    // Check if position has assignments
    const assignmentCount = await prisma.positionFunction.count({
      where: { positionId: id }
    });

    const userPositionCount = await prisma.userPosition.count({
      where: { positionId: id }
    });

    if (assignmentCount > 0 || userPositionCount > 0) {
      return NextResponse.json({ 
        error: `Không thể xóa. Chức vụ này đang được gán cho ${userPositionCount} người dùng và ${assignmentCount} quyền.`,
        assignmentCount,
        userPositionCount
      }, { status: 400 });
    }

    const position = await prisma.position.delete({
      where: { id }
    });

    await logAudit({
      userId: authResult.user!.id,
      functionCode: SYSTEM.MANAGE_POSITIONS,
      action: 'DELETE',
      resourceType: 'POSITION',
      resourceId: id,
      oldValue: JSON.stringify(position),
      result: 'SUCCESS'
    });

    return NextResponse.json({ message: 'Đã xóa chức vụ thành công' });
  } catch (error) {
    console.error('Error deleting position:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
