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
    const { code, name, description, scope, positionScope: positionScopeField, level, isActive } = data;

    if (!code || !name) {
      return NextResponse.json({ error: 'code và name là bắt buộc' }, { status: 400 });
    }

    // Accept both positionScope (from UI form) and scope (legacy)
    const rawScope = positionScopeField || scope;
    const validScopes = ['SELF', 'UNIT', 'DEPARTMENT', 'ACADEMY'];
    const normalizedScope = rawScope?.toUpperCase();
    const positionScope = validScopes.includes(normalizedScope) ? normalizedScope : 'UNIT';

    const position = await prisma.position.create({
      data: {
        code: code.toUpperCase(),
        name,
        description,
        positionScope: positionScope as any,
        level: typeof level === 'number' ? level : 0,
        isActive: isActive !== undefined ? isActive : true,
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
    const { id, code, name, description, scope, positionScope: positionScopeField, isActive, level } = data;

    if (!id) {
      return NextResponse.json({ error: 'id là bắt buộc' }, { status: 400 });
    }

    const oldPosition = await prisma.position.findUnique({ where: { id } });
    if (!oldPosition) {
      return NextResponse.json({ error: 'Chức vụ không tồn tại' }, { status: 404 });
    }

    // Kiểm tra trùng code nếu code thay đổi
    if (code !== undefined && code.toUpperCase() !== oldPosition.code) {
      const existing = await prisma.position.findUnique({ where: { code: code.toUpperCase() } });
      if (existing) {
        return NextResponse.json({ error: `Mã chức vụ "${code.toUpperCase()}" đã được dùng bởi chức vụ "${existing.name}"` }, { status: 409 });
      }
    }

    // Build update payload — only include fields that were explicitly provided
    const updateData: Record<string, unknown> = {};
    if (code !== undefined) updateData.code = code.toUpperCase();
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (level !== undefined) updateData.level = typeof level === 'number' ? level : 0;
    // Accept both positionScope (from UI form) and scope (legacy)
    const rawScope = positionScopeField ?? scope;
    if (rawScope !== undefined) {
      const validScopes = ['SELF', 'UNIT', 'DEPARTMENT', 'ACADEMY'];
      const normalizedScope = rawScope.toUpperCase();
      updateData.positionScope = validScopes.includes(normalizedScope) ? normalizedScope : 'UNIT';
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
  } catch (error: unknown) {
    console.error('Error updating position:', error);
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return NextResponse.json({ error: 'Mã chức vụ đã tồn tại, vui lòng chọn mã khác' }, { status: 409 });
    }
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
