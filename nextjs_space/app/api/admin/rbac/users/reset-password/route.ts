/**
 * POST /api/admin/rbac/users/reset-password
 * Đổi mật khẩu cho tài khoản
 * 
 * v8.3: Migrated to Function-based RBAC
 */

export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { requireFunction } from '@/lib/rbac/middleware';
import { SYSTEM } from '@/lib/rbac/function-codes';
import { logAudit } from '@/lib/audit';

export async function POST(request: NextRequest) {
  // RBAC Check: RESET_PASSWORD
  const authResult = await requireFunction(request, SYSTEM.RESET_PASSWORD);
  if (!authResult.allowed) {
    return authResult.response!;
  }

  try {
    const body = await request.json();
    const { id, newPassword } = body;

    if (!id || !newPassword) {
      return NextResponse.json(
        { error: 'User ID and new password required' },
        { status: 400 }
      );
    }

    // Validate password length
    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const user = await prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    await logAudit({
      userId: authResult.user!.id,
      functionCode: SYSTEM.RESET_PASSWORD,
      action: 'RESET_PASSWORD',
      resourceType: 'USER',
      resourceId: user.id,
      newValue: { email: user.email },
      result: 'SUCCESS',
    });

    return NextResponse.json({
      message: 'Password reset successfully',
      user,
    });
  } catch (error: any) {
    console.error('POST /api/admin/rbac/users/reset-password error:', error);
    return NextResponse.json(
      { error: 'Failed to reset password', details: error.message },
      { status: 500 }
    );
  }
}
