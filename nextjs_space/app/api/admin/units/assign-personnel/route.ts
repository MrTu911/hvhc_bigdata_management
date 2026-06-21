import { NextRequest, NextResponse } from 'next/server';
import { requireFunction, orgRateLimiter } from '@/lib/rbac/middleware';
import { SYSTEM } from '@/lib/rbac/function-codes';
import prisma from '@/lib/db';
import { logAudit } from '@/lib/audit';
import { projectUnitMembership } from '@/lib/services/org/unit-membership.service';

// POST: Assign multiple users to a unit
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireFunction(request, SYSTEM.MANAGE_USERS, undefined, {
      rateLimiter: orgRateLimiter,
    });
    if (!authResult.allowed) {
      // Trả nguyên response của middleware (vd 429) để client phân biệt được rate-limit
      if (authResult.response) return authResult.response;
      return NextResponse.json({ error: authResult.authResult?.deniedReason || 'Không có quyền' }, { status: 403 });
    }
    const { user } = authResult;

    const body = await request.json();
    const { unitId, userIds } = body;

    if (!unitId || !userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        { error: 'unitId và userIds (array) là bắt buộc' },
        { status: 400 }
      );
    }

    // Verify unit exists
    const unit = await prisma.unit.findUnique({
      where: { id: unitId },
    });

    if (!unit) {
      return NextResponse.json({ error: 'Đơn vị không tồn tại' }, { status: 404 });
    }

    // Gán user vào đơn vị, đồng bộ cả 3 cột unitId (Personnel nguồn chuẩn → User → Faculty)
    // trong cùng transaction qua service chung.
    const result = await prisma.$transaction((tx) =>
      projectUnitMembership(tx, { userIds, unitId })
    );

    // Log the action
    await logAudit({
      userId: user!.id,
      functionCode: SYSTEM.MANAGE_USERS,
      action: 'UPDATE',
      resourceType: 'UNIT',
      resourceId: unitId,
      newValue: { unitId, userIds, count: result.usersUpdated, personnelSynced: result.personnelUpdated, facultySynced: result.facultyUpdated },
      result: 'SUCCESS'
    });

    return NextResponse.json({
      success: true,
      count: result.usersUpdated,
      personnelSynced: result.personnelUpdated,
      message: `Đã gán ${result.usersUpdated} nhân sự vào đơn vị ${unit.name}`,
    });
  } catch (error) {
    console.error('Error assigning personnel to unit:', error);
    return NextResponse.json(
      { error: 'Lỗi khi gán nhân sự vào đơn vị' },
      { status: 500 }
    );
  }
}

// DELETE: Remove a user from a unit (set unitId to null)
export async function DELETE(request: NextRequest) {
  try {
    const authResult = await requireFunction(request, SYSTEM.MANAGE_USERS, undefined, {
      rateLimiter: orgRateLimiter,
    });
    if (!authResult.allowed) {
      if (authResult.response) return authResult.response;
      return NextResponse.json({ error: 'Không có quyền' }, { status: 403 });
    }
    const { user } = authResult;

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const unitId = searchParams.get('unitId');

    if (!userId) {
      return NextResponse.json({ error: 'userId là bắt buộc' }, { status: 400 });
    }

    // Gỡ user khỏi đơn vị + đồng bộ cả 3 cột (Personnel/User/Faculty) trong cùng transaction
    await prisma.$transaction((tx) =>
      projectUnitMembership(tx, { userIds: [userId], unitId: null })
    );

    await logAudit({
      userId: user!.id,
      functionCode: SYSTEM.MANAGE_USERS,
      action: 'UPDATE',
      resourceType: 'UNIT',
      resourceId: unitId || 'unknown',
      newValue: { userId, unitId: null, action: 'unassign' },
      result: 'SUCCESS'
    });

    return NextResponse.json({ success: true, message: 'Đã xóa nhân sự khỏi đơn vị' });
  } catch (error) {
    console.error('Error removing personnel from unit:', error);
    return NextResponse.json({ error: 'Lỗi khi xóa nhân sự khỏi đơn vị' }, { status: 500 });
  }
}
