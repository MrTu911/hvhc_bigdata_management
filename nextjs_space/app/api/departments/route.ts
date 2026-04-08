import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { logAudit } from '@/lib/audit';
import { requireFunction, requireAuth } from '@/lib/rbac/middleware';
import { DEPARTMENT } from '@/lib/rbac/function-codes';

export const dynamic = 'force-dynamic';

// GET: Danh sách khoa/phòng
export async function GET(req: NextRequest) {
  try {
    // RBAC Check: Chỉ cần đăng nhập để xem danh sách
    const authResult = await requireAuth(req);
    if (!authResult.allowed) {
      return authResult.response!;
    }

    const departments = await prisma.department.findMany({
      orderBy: [{ level: 'asc' }, { sortOrder: 'asc' }, { name: 'asc' }],
    });

    return NextResponse.json({
      departments,
      total: departments.length
    });
  } catch (error: any) {
    console.error('Error fetching departments:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: Tạo khoa/phòng mới
export async function POST(req: NextRequest) {
  try {
    // RBAC Check: DEPARTMENT.CREATE
    const authResult = await requireFunction(req, DEPARTMENT.CREATE);
    if (!authResult.allowed) {
      return authResult.response!;
    }
    const user = authResult.user!;

    const body = await req.json();
    const { code, name, shortName, fullName, parentId, level, description, address, phone, email, sortOrder, isActive } = body;

    if (!code || !name) {
      return NextResponse.json({ error: 'Mã và tên là bắt buộc' }, { status: 400 });
    }

    // Kiểm tra mã trùng
    const existing = await prisma.department.findUnique({ where: { code } });
    if (existing) {
      return NextResponse.json({ error: 'Mã khoa/phòng đã tồn tại' }, { status: 400 });
    }

    const department = await prisma.department.create({
      data: {
        code,
        name,
        shortName: shortName || null,
        fullName: fullName || null,
        parentId: parentId || null,
        level: level || 2,
        description: description || null,
        address: address || null,
        phone: phone || null,
        email: email || null,
        sortOrder: sortOrder || 0,
        isActive: isActive !== false,
      }
    });

    await logAudit({
      userId: user.id,
      functionCode: DEPARTMENT.CREATE,
      action: 'CREATE',
      resourceType: 'DEPARTMENT',
      resourceId: department.id,
      newValue: department,
      result: 'SUCCESS'
    });

    return NextResponse.json({ department, message: 'Tạo khoa/phòng thành công' }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating department:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT: Cập nhật khoa/phòng
export async function PUT(req: NextRequest) {
  try {
    // RBAC Check: DEPARTMENT.UPDATE
    const authResult = await requireFunction(req, DEPARTMENT.UPDATE);
    if (!authResult.allowed) {
      return authResult.response!;
    }
    const user = authResult.user!;

    const body = await req.json();
    const { id, code, name, shortName, fullName, parentId, level, description, address, phone, email, sortOrder, isActive } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID là bắt buộc' }, { status: 400 });
    }

    const existing = await prisma.department.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Khoa/phòng không tồn tại' }, { status: 404 });
    }

    const department = await prisma.department.update({
      where: { id },
      data: {
        code: code || existing.code,
        name: name || existing.name,
        shortName: shortName !== undefined ? shortName : existing.shortName,
        fullName: fullName !== undefined ? fullName : existing.fullName,
        parentId: parentId !== undefined ? (parentId || null) : existing.parentId,
        level: level !== undefined ? level : existing.level,
        description: description !== undefined ? description : existing.description,
        address: address !== undefined ? address : existing.address,
        phone: phone !== undefined ? phone : existing.phone,
        email: email !== undefined ? email : existing.email,
        sortOrder: sortOrder !== undefined ? sortOrder : existing.sortOrder,
        isActive: isActive !== undefined ? isActive : existing.isActive,
      }
    });

    await logAudit({
      userId: user.id,
      functionCode: DEPARTMENT.UPDATE,
      action: 'UPDATE',
      resourceType: 'DEPARTMENT',
      resourceId: department.id,
      oldValue: existing,
      newValue: department,
      result: 'SUCCESS'
    });

    return NextResponse.json({ department, message: 'Cập nhật khoa/phòng thành công' });
  } catch (error: any) {
    console.error('Error updating department:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE: Xóa khoa/phòng
export async function DELETE(req: NextRequest) {
  try {
    // RBAC Check: DEPARTMENT.DELETE
    const authResult = await requireFunction(req, DEPARTMENT.DELETE);
    if (!authResult.allowed) {
      return authResult.response!;
    }
    const user = authResult.user!;

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID là bắt buộc' }, { status: 400 });
    }

    const existing = await prisma.department.findUnique({ 
      where: { id }
    });
    
    if (!existing) {
      return NextResponse.json({ error: 'Khoa/phòng không tồn tại' }, { status: 404 });
    }

    await prisma.department.delete({ where: { id } });

    await logAudit({
      userId: user.id,
      functionCode: DEPARTMENT.DELETE,
      action: 'DELETE',
      resourceType: 'DEPARTMENT',
      resourceId: id,
      oldValue: existing,
      result: 'SUCCESS'
    });

    return NextResponse.json({ message: 'Xóa khoa/phòng thành công' });
  } catch (error: any) {
    console.error('Error deleting department:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
