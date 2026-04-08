/**
 * API: Quản lý Chức vụ (Positions)
 * - GET: Lấy danh sách chức vụ
 * - POST: Tạo chức vụ mới
 * - PUT: Cập nhật chức vụ
 * - DELETE: Xóa/Vô hiệu hóa chức vụ
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireFunction } from '@/lib/rbac/middleware';
import { SYSTEM } from '@/lib/rbac/function-codes';
import prisma from '@/lib/db';
import { logAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

// GET: Lấy danh sách chức vụ
export async function GET(req: NextRequest) {
  try {
    const authResult = await requireAuth(req);
    if (!authResult.allowed) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';
    const withStats = searchParams.get('withStats') === 'true';

    const positions = await prisma.position.findMany({
      where: includeInactive ? {} : { isActive: true },
      include: {
        functions: withStats ? {
          include: { function: { select: { code: true, name: true } } }
        } : false,
        _count: withStats ? {
          select: { userPositions: true }
        } : false,
      },
      orderBy: [{ level: 'asc' }, { name: 'asc' }],
    });

    return NextResponse.json({
      success: true,
      positions,
      total: positions.length,
    });
  } catch (error: any) {
    console.error('Position GET Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: Tạo chức vụ mới
export async function POST(req: NextRequest) {
  try {
    const authResult = await requireFunction(req, SYSTEM.MANAGE_RBAC);
    if (!authResult.allowed) {
      return NextResponse.json({ error: authResult.authResult?.deniedReason || 'Không có quyền' || 'Forbidden' }, { status: 403 });
    }
    const { user } = authResult;

    const body = await req.json();
    const { code, name, description, positionScope, level } = body;

    if (!code || !name) {
      return NextResponse.json(
        { error: 'Mã chức vụ và tên là bắt buộc' },
        { status: 400 }
      );
    }

    // Kiểm tra trùng mã
    const existing = await prisma.position.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Mã chức vụ đã tồn tại' },
        { status: 400 }
      );
    }

    const position = await prisma.position.create({
      data: {
        code: code.toUpperCase(),
        name,
        description: description || null,
        positionScope: positionScope || 'UNIT',
        level: level ?? 5,
      },
    });

    await logAudit({
      userId: user!.id,
      functionCode: SYSTEM.MANAGE_RBAC,
      action: 'CREATE',
      resourceType: 'POSITION',
      resourceId: position.id,
      newValue: position,
      result: 'SUCCESS',
    });

    return NextResponse.json({
      success: true,
      position,
    });
  } catch (error: any) {
    console.error('Position POST Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT: Cập nhật chức vụ
export async function PUT(req: NextRequest) {
  try {
    const authResult = await requireFunction(req, SYSTEM.MANAGE_RBAC);
    if (!authResult.allowed) {
      return NextResponse.json({ error: authResult.authResult?.deniedReason || 'Không có quyền' || 'Forbidden' }, { status: 403 });
    }
    const { user } = authResult;

    const body = await req.json();
    const { id, name, description, positionScope, level, isActive } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'ID chức vụ là bắt buộc' },
        { status: 400 }
      );
    }

    const existing = await prisma.position.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Chức vụ không tồn tại' },
        { status: 404 }
      );
    }

    const position = await prisma.position.update({
      where: { id },
      data: {
        name: name ?? existing.name,
        description: description !== undefined ? description : existing.description,
        positionScope: positionScope ?? existing.positionScope,
        level: level ?? existing.level,
        isActive: isActive ?? existing.isActive,
      },
    });

    await logAudit({
      userId: user!.id,
      functionCode: SYSTEM.MANAGE_RBAC,
      action: 'UPDATE',
      resourceType: 'POSITION',
      resourceId: position.id,
      oldValue: existing,
      newValue: position,
      result: 'SUCCESS',
    });

    return NextResponse.json({
      success: true,
      position,
    });
  } catch (error: any) {
    console.error('Position PUT Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE: Xóa/Vô hiệu hóa chức vụ
export async function DELETE(req: NextRequest) {
  try {
    const authResult = await requireFunction(req, SYSTEM.MANAGE_RBAC);
    if (!authResult.allowed) {
      return NextResponse.json({ error: authResult.authResult?.deniedReason || 'Không có quyền' || 'Forbidden' }, { status: 403 });
    }
    const { user } = authResult;

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID chức vụ là bắt buộc' },
        { status: 400 }
      );
    }

    const existing = await prisma.position.findUnique({
      where: { id },
      include: {
        _count: {
          select: { userPositions: true }
        }
      }
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Chức vụ không tồn tại' },
        { status: 404 }
      );
    }

    // Kiểm tra có user nào đang giữ chức vụ này không
    if (existing._count.userPositions > 0) {
      // Không xóa, chỉ vô hiệu hóa
      await prisma.position.update({
        where: { id },
        data: { isActive: false },
      });

      await logAudit({
        userId: user!.id,
        functionCode: SYSTEM.MANAGE_RBAC,
        action: 'DEACTIVATE',
        resourceType: 'POSITION',
        resourceId: id,
        oldValue: existing,
        result: 'SUCCESS',
      });

      return NextResponse.json({
        success: true,
        message: `Chức vụ đã được vô hiệu hóa (có ${existing._count.userPositions} người đang giữ chức vụ này)`,
        deactivated: true,
      });
    }

    // Không có ai giữ chức vụ -> xóa hẳn
    await prisma.position.delete({ where: { id } });

    await logAudit({
      userId: user!.id,
      functionCode: SYSTEM.MANAGE_RBAC,
      action: 'DELETE',
      resourceType: 'POSITION',
      resourceId: id,
      oldValue: existing,
      result: 'SUCCESS',
    });

    return NextResponse.json({
      success: true,
      message: 'Đã xóa chức vụ',
    });
  } catch (error: any) {
    console.error('Position DELETE Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
