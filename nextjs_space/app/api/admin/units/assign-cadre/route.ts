/**
 * Gán/gỡ CÁN BỘ (Personnel) vào đơn vị — nguồn sự thật là Personnel.unitId.
 *
 * Khác `/api/admin/units/assign-personnel` (gán theo tài khoản User): route này nhận trực tiếp
 * `personnelIds`, nên quản lý được cả cán bộ CHƯA có tài khoản User. Dù vào theo Personnel,
 * service `projectUnitMembership` vẫn đồng bộ ngược sang User.unitId + FacultyProfile.unitId
 * (nếu có liên kết) trong cùng transaction.
 *
 * RBAC: SYSTEM.ASSIGN_PERSONNEL (function code dành riêng cho gán nhân sự vào đơn vị).
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireFunction, orgRateLimiter } from '@/lib/rbac/middleware';
import { SYSTEM } from '@/lib/rbac/function-codes';
import prisma from '@/lib/db';
import { logAudit } from '@/lib/audit';
import { projectUnitMembership } from '@/lib/services/org/unit-membership.service';

// POST: gán nhiều cán bộ vào một đơn vị
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireFunction(request, SYSTEM.ASSIGN_PERSONNEL, undefined, {
      rateLimiter: orgRateLimiter,
    });
    if (!authResult.allowed) {
      if (authResult.response) return authResult.response;
      return NextResponse.json({ error: authResult.authResult?.deniedReason || 'Không có quyền' }, { status: 403 });
    }
    const { user } = authResult;

    const body = await request.json();
    const { unitId, personnelIds } = body;

    if (!unitId || !Array.isArray(personnelIds) || personnelIds.length === 0) {
      return NextResponse.json(
        { error: 'unitId và personnelIds (array) là bắt buộc' },
        { status: 400 }
      );
    }

    const unit = await prisma.unit.findUnique({ where: { id: unitId }, select: { name: true } });
    if (!unit) {
      return NextResponse.json({ error: 'Đơn vị không tồn tại' }, { status: 404 });
    }

    const result = await prisma.$transaction((tx) =>
      projectUnitMembership(tx, { personnelIds, unitId })
    );

    await logAudit({
      userId: user!.id,
      functionCode: SYSTEM.ASSIGN_PERSONNEL,
      action: 'UPDATE',
      resourceType: 'UNIT',
      resourceId: unitId,
      newValue: { unitId, personnelIds, personnelUpdated: result.personnelUpdated, usersSynced: result.usersUpdated, facultySynced: result.facultyUpdated },
      result: 'SUCCESS',
    });

    return NextResponse.json({
      success: true,
      count: result.personnelUpdated,
      usersSynced: result.usersUpdated,
      message: `Đã gán ${result.personnelUpdated} cán bộ vào đơn vị ${unit.name}`,
    });
  } catch (error) {
    console.error('Error assigning cadre to unit:', error);
    return NextResponse.json({ error: 'Lỗi khi gán cán bộ vào đơn vị' }, { status: 500 });
  }
}

// DELETE: gỡ một cán bộ khỏi đơn vị
export async function DELETE(request: NextRequest) {
  try {
    const authResult = await requireFunction(request, SYSTEM.ASSIGN_PERSONNEL, undefined, {
      rateLimiter: orgRateLimiter,
    });
    if (!authResult.allowed) {
      if (authResult.response) return authResult.response;
      return NextResponse.json({ error: 'Không có quyền' }, { status: 403 });
    }
    const { user } = authResult;

    const { searchParams } = new URL(request.url);
    const personnelId = searchParams.get('personnelId');
    const unitId = searchParams.get('unitId');

    if (!personnelId) {
      return NextResponse.json({ error: 'personnelId là bắt buộc' }, { status: 400 });
    }

    await prisma.$transaction((tx) =>
      projectUnitMembership(tx, { personnelIds: [personnelId], unitId: null })
    );

    await logAudit({
      userId: user!.id,
      functionCode: SYSTEM.ASSIGN_PERSONNEL,
      action: 'UPDATE',
      resourceType: 'UNIT',
      resourceId: unitId || 'unknown',
      newValue: { personnelId, unitId: null, action: 'unassign' },
      result: 'SUCCESS',
    });

    return NextResponse.json({ success: true, message: 'Đã gỡ cán bộ khỏi đơn vị' });
  } catch (error) {
    console.error('Error removing cadre from unit:', error);
    return NextResponse.json({ error: 'Lỗi khi gỡ cán bộ khỏi đơn vị' }, { status: 500 });
  }
}
