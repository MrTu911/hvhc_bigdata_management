/**
 * PATCH /api/admin/rbac/users/toggle-status
 * Khóa/Mở khóa tài khoản
 * 
 * v8.3: Migrated to Function-based RBAC
 */

export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireFunction } from '@/lib/rbac/middleware';
import { SYSTEM } from '@/lib/rbac/function-codes';
import { logAudit } from '@/lib/audit';

export async function PATCH(request: NextRequest) {
  // RBAC Check: TOGGLE_USER_STATUS
  const authResult = await requireFunction(request, SYSTEM.TOGGLE_USER_STATUS);
  if (!authResult.allowed) {
    return authResult.response!;
  }

  try {
    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json(
        { error: 'User ID and status required' },
        { status: 400 }
      );
    }

    // Không cho khóa chính mình
    if (id === authResult.user!.id) {
      return NextResponse.json(
        { error: 'Cannot lock/unlock yourself' },
        { status: 400 }
      );
    }

    // Validate status
    const validStatuses = ['ACTIVE', 'INACTIVE', 'SUSPENDED'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    // Get old status for audit
    const oldUser = await prisma.user.findUnique({
      where: { id },
      select: { status: true }
    });

    const user = await prisma.user.update({
      where: { id },
      data: { status },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
      },
    });

    await logAudit({
      userId: authResult.user!.id,
      functionCode: SYSTEM.TOGGLE_USER_STATUS,
      action: 'TOGGLE_STATUS',
      resourceType: 'USER',
      resourceId: user.id,
      oldValue: { status: oldUser?.status },
      newValue: { status: user.status },
      result: 'SUCCESS',
    });

    return NextResponse.json({
      message: `User status changed to ${status}`,
      user,
    });
  } catch (error: any) {
    console.error('PATCH /api/admin/rbac/users/toggle-status error:', error);
    return NextResponse.json(
      { error: 'Failed to toggle user status', details: error.message },
      { status: 500 }
    );
  }
}
