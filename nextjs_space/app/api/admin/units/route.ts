/**
 * M01 – UC-04: Unit Tree Management API
 * Quản lý cơ cấu tổ chức phân cấp
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireFunction } from '@/lib/rbac/middleware';
import { SYSTEM, PERSONNEL } from '@/lib/rbac/function-codes';
import { logAudit, getClientIp } from '@/lib/audit';
import {
  createUnit,
  updateUnit,
  deactivateUnit,
  getUnitTree,
} from '@/lib/services/org/unit-tree.service';
import prisma from '@/lib/db';

/**
 * GET /api/admin/units
 * Lấy danh sách đơn vị — tree (default) hoặc flat (?flat=true)
 * ?search=... lọc theo code/name
 * ?level=N lọc theo cấp
 */
export async function GET(request: NextRequest) {
  const authResult = await requireFunction(request, PERSONNEL.VIEW);
  if (!authResult.allowed) return authResult.response!;

  try {
    const { searchParams } = new URL(request.url);
    const flat = searchParams.get('flat') === 'true';
    const search = searchParams.get('search') || '';
    const levelParam = searchParams.get('level') || '';

    if (flat) {
      const where: any = { active: true };
      if (search) {
        where.OR = [
          { code: { contains: search, mode: 'insensitive' } },
          { name: { contains: search, mode: 'insensitive' } },
        ];
      }
      if (levelParam) where.level = parseInt(levelParam);

      const units = await prisma.unit.findMany({
        where,
        include: {
          commander: { select: { id: true, name: true, rank: true } },
          _count: { select: { users: true, children: true } },
        },
        orderBy: [{ level: 'asc' }, { code: 'asc' }],
      });
      return NextResponse.json({ success: true, data: units });
    }

    const tree = await getUnitTree();
    return NextResponse.json({ success: true, data: tree });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/admin/units
 * Tạo đơn vị mới
 */
export async function POST(request: NextRequest) {
  const authResult = await requireFunction(request, SYSTEM.MANAGE_UNITS);
  if (!authResult.allowed) return authResult.response!;

  try {
    const body = await request.json();
    const { code, name, type, level, parentId, commanderId, description } = body;

    // Input validation
    const errors: string[] = [];
    if (!code?.trim()) errors.push('Vui lòng nhập Mã đơn vị');
    else if (code.length < 2 || code.length > 20) errors.push('Mã đơn vị phải từ 2-20 ký tự');
    if (!name?.trim()) errors.push('Vui lòng nhập Tên đơn vị');
    if (!type?.trim()) errors.push('Vui lòng chọn Loại đơn vị');
    const levelNum = parseInt(level);
    if (isNaN(levelNum) || levelNum < 1 || levelNum > 5) errors.push('Cấp đơn vị phải từ 1-5');

    if (errors.length > 0) {
      return NextResponse.json({ success: false, error: errors.join('. ') }, { status: 400 });
    }

    const result = await createUnit({
      code: code.trim(),
      name: name.trim(),
      type: type.trim(),
      level: levelNum,
      parentId: parentId || null,
      commanderId: commanderId || null,
      description: description?.trim() || null,
    });

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    await logAudit({
      userId: authResult.user!.id,
      functionCode: SYSTEM.MANAGE_UNITS,
      action: 'CREATE',
      resourceType: 'UNIT',
      resourceId: result.unit.id,
      newValue: { code, name, type, level: levelNum },
      result: 'SUCCESS',
      ipAddress: getClientIp(request),
    });

    return NextResponse.json({ success: true, data: result.unit }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * PUT /api/admin/units
 * Cập nhật đơn vị (bao gồm move trong tree)
 * Body: { id, name?, type?, level?, parentId?, commanderId?, description? }
 *
 * Khi parentId thay đổi → cycle detection + rebuild paths cho toàn cây con.
 */
export async function PUT(request: NextRequest) {
  const authResult = await requireFunction(request, SYSTEM.MANAGE_UNITS);
  if (!authResult.allowed) return authResult.response!;

  try {
    const body = await request.json();
    const { id, name, type, level, parentId, commanderId, description } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Thiếu unit ID' }, { status: 400 });
    }

    const result = await updateUnit(id, {
      name,
      type,
      level: level !== undefined ? parseInt(level) : undefined,
      parentId,
      commanderId,
      description,
    });

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    await logAudit({
      userId: authResult.user!.id,
      functionCode: SYSTEM.MANAGE_UNITS,
      action: 'UPDATE',
      resourceType: 'UNIT',
      resourceId: id,
      oldValue: result.oldData,
      newValue: { name, type, level, parentId },
      result: 'SUCCESS',
      ipAddress: getClientIp(request),
    });

    return NextResponse.json({ success: true, data: result.unit });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/units?id=...
 * Vô hiệu hóa đơn vị (soft delete)
 */
export async function DELETE(request: NextRequest) {
  const authResult = await requireFunction(request, SYSTEM.MANAGE_UNITS);
  if (!authResult.allowed) return authResult.response!;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Thiếu unit ID' }, { status: 400 });
    }

    const result = await deactivateUnit(id);

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    await logAudit({
      userId: authResult.user!.id,
      functionCode: SYSTEM.MANAGE_UNITS,
      action: 'DELETE',
      resourceType: 'UNIT',
      resourceId: id,
      oldValue: { code: result.code, name: result.name },
      result: 'SUCCESS',
      ipAddress: getClientIp(request),
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
