/**
 * API: Quản lý Chức năng (Function)
 * D2.2: CRUD cho bảng Function
 * 
 * v8.3: Migrated to Function-based RBAC
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { logAudit } from '@/lib/audit';
import { requireFunction } from '@/lib/rbac/middleware';
import { SYSTEM } from '@/lib/rbac/function-codes';

export const dynamic = 'force-dynamic';

// Module labels cho UI
const MODULE_LABELS: Record<string, string> = {
  'PERSONNEL': 'CSDL Cán bộ - Nhân sự',
  'PARTY': 'CSDL Đảng viên',
  'INSURANCE': 'CSDL Bảo hiểm Xã hội',
  'POLICY': 'CSDL Chính sách',
  'AWARDS': 'CSDL Khen thưởng - Kỷ luật',
  'FACULTY': 'CSDL Giảng viên - Học viên',
  'STUDENT': 'CSDL Giảng viên - Học viên',
  'EDUCATION': 'CSDL Giáo dục - Đào tạo',
  'TRAINING': 'CSDL Giáo dục - Đào tạo',
  'RESEARCH': 'CSDL Nghiên cứu Khoa học',
  'DASHBOARD': 'Dashboard & Báo cáo',
  'SYSTEM': 'Quản trị Hệ thống',
  'ADMIN': 'Quản trị Hệ thống',
  'DATA': 'Hạ tầng BigData',
};

// GET: Lấy danh sách functions
export async function GET(request: NextRequest) {
  // RBAC Check: MANAGE_FUNCTIONS
  const authResult = await requireFunction(request, SYSTEM.MANAGE_FUNCTIONS);
  if (!authResult.allowed) {
    return authResult.response!;
  }

  try {
    const { searchParams } = new URL(request.url);
    const groupBy = searchParams.get('groupBy');

    const rawFunctions = await prisma.function.findMany({
      orderBy: [{ module: 'asc' }, { name: 'asc' }],
      include: {
        _count: {
          select: { positions: true }
        }
      }
    });
    // Normalize module to uppercase so frontend filters always match
    const functions = rawFunctions.map(f => ({ ...f, module: f.module.toUpperCase() }));

    // Nếu yêu cầu nhóm theo module
    if (groupBy === 'module') {
      const grouped: Record<string, any[]> = {};
      
      for (const func of functions) {
        const moduleLabel = MODULE_LABELS[func.module] || func.module;
        if (!grouped[moduleLabel]) {
          grouped[moduleLabel] = [];
        }
        grouped[moduleLabel].push({
          ...func,
          moduleLabel
        });
      }

      return NextResponse.json({ 
        grouped,
        moduleLabels: MODULE_LABELS,
        total: functions.length
      });
    }

    return NextResponse.json({ functions });
  } catch (error) {
    console.error('Error fetching functions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Tạo function mới
export async function POST(request: NextRequest) {
  // RBAC Check: MANAGE_FUNCTIONS
  const authResult = await requireFunction(request, SYSTEM.MANAGE_FUNCTIONS);
  if (!authResult.allowed) {
    return authResult.response!;
  }

  try {
    const data = await request.json();
    const { code, name, module, description, actionType, isCritical, isActive } = data;

    if (!code || !name || !module) {
      return NextResponse.json({ error: 'code, name và module là bắt buộc' }, { status: 400 });
    }

    const func = await prisma.function.create({
      data: {
        code: code.toUpperCase(),
        name,
        module: module.toUpperCase(),
        description: description || null,
        actionType: actionType || 'VIEW',
        isCritical: isCritical === true,
        isActive: isActive !== false,
      }
    });

    await logAudit({
      userId: authResult.user!.id,
      functionCode: SYSTEM.MANAGE_FUNCTIONS,
      action: 'CREATE',
      resourceType: 'FUNCTION',
      resourceId: func.id,
      newValue: JSON.stringify(func),
      result: 'SUCCESS'
    });

    return NextResponse.json({ function: func, message: 'Tạo chức năng thành công' });
  } catch (error: unknown) {
    console.error('Error creating function:', error);
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return NextResponse.json({ error: 'Mã chức năng đã tồn tại' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT: Cập nhật function
export async function PUT(request: NextRequest) {
  // RBAC Check: MANAGE_FUNCTIONS
  const authResult = await requireFunction(request, SYSTEM.MANAGE_FUNCTIONS);
  if (!authResult.allowed) {
    return authResult.response!;
  }

  try {
    const data = await request.json();
    const { id, code, name, module, description, isActive, actionType, isCritical } = data;

    if (!id) {
      return NextResponse.json({ error: 'id là bắt buộc' }, { status: 400 });
    }

    const oldFunc = await prisma.function.findUnique({ where: { id } });

    const func = await prisma.function.update({
      where: { id },
      data: {
        ...(code !== undefined && { code: code.toUpperCase() }),
        ...(name !== undefined && { name }),
        ...(module !== undefined && { module: module.toUpperCase() }),
        ...(description !== undefined && { description: description || null }),
        ...(isActive !== undefined && { isActive }),
        ...(actionType !== undefined && { actionType }),
        ...(isCritical !== undefined && { isCritical }),
      }
    });

    await logAudit({
      userId: authResult.user!.id,
      functionCode: SYSTEM.MANAGE_FUNCTIONS,
      action: 'UPDATE',
      resourceType: 'FUNCTION',
      resourceId: func.id,
      oldValue: JSON.stringify(oldFunc),
      newValue: JSON.stringify(func),
      result: 'SUCCESS'
    });

    return NextResponse.json({ function: func, message: 'Cập nhật chức năng thành công' });
  } catch (error) {
    console.error('Error updating function:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: Xóa function
export async function DELETE(request: NextRequest) {
  // RBAC Check: MANAGE_FUNCTIONS
  const authResult = await requireFunction(request, SYSTEM.MANAGE_FUNCTIONS);
  if (!authResult.allowed) {
    return authResult.response!;
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id là bắt buộc' }, { status: 400 });
    }

    // Check if function is used in positions
    const positionCount = await prisma.positionFunction.count({
      where: { functionId: id }
    });

    if (positionCount > 0) {
      return NextResponse.json({ 
        error: `Không thể xóa. Chức năng này đang được gán cho ${positionCount} chức vụ.`
      }, { status: 400 });
    }

    const func = await prisma.function.delete({
      where: { id }
    });

    await logAudit({
      userId: authResult.user!.id,
      functionCode: SYSTEM.MANAGE_FUNCTIONS,
      action: 'DELETE',
      resourceType: 'FUNCTION',
      resourceId: id,
      oldValue: JSON.stringify(func),
      result: 'SUCCESS'
    });

    return NextResponse.json({ message: 'Đã xóa chức năng thành công' });
  } catch (error) {
    console.error('Error deleting function:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
