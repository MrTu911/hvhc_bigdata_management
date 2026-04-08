/**
 * M01 – UC-01: Tắt MFA
 * POST /api/auth/mfa/disable
 * Body: { token: string }  ← phải xác nhận OTP hiện tại trước khi tắt
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/rbac/middleware';
import { verifyToken, disableMfa } from '@/lib/services/auth/mfa.service';
import { logSecurityEvent, getClientIp } from '@/lib/audit';
import prisma from '@/lib/db';

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth.allowed) return auth.response!;

  try {
    const body = await request.json();
    const { token } = body;

    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Phải cung cấp OTP hiện tại để tắt MFA' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: auth.user!.id },
      select: { mfaEnabled: true, mfaSecret: true },
    });

    if (!user?.mfaEnabled || !user.mfaSecret) {
      return NextResponse.json(
        { success: false, error: 'MFA chưa được bật' },
        { status: 400 }
      );
    }

    const isValid = verifyToken(user.mfaSecret, token);
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: 'Mã OTP không đúng' },
        { status: 401 }
      );
    }

    await disableMfa(auth.user!.id);

    await logSecurityEvent({
      userId: auth.user!.id,
      eventType: 'SYSTEM_CONFIG_CHANGE',
      severity: 'HIGH',
      ipAddress: getClientIp(request),
      details: { action: 'MFA_DISABLED' },
    });

    return NextResponse.json({
      success: true,
      message: 'MFA đã được tắt.',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Lỗi tắt MFA' },
      { status: 500 }
    );
  }
}
