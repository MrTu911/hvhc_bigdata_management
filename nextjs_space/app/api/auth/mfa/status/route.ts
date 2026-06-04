/**
 * M01 – UC-01: Trạng thái MFA của user hiện tại
 * GET /api/auth/mfa/status
 * → { success, data: { mfaEnabled } }
 *
 * Dùng cho UI cài đặt bảo mật để hiển thị MFA đang bật hay tắt.
 * Không trả secret — chỉ trả cờ bật/tắt.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/rbac/middleware';
import prisma from '@/lib/db';

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth.allowed) return auth.response!;

  try {
    const user = await prisma.user.findUnique({
      where: { id: auth.user!.id },
      select: { mfaEnabled: true },
    });

    return NextResponse.json({
      success: true,
      data: { mfaEnabled: user?.mfaEnabled ?? false },
      error: null,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, data: null, error: error.message || 'Lỗi đọc trạng thái MFA' },
      { status: 500 }
    );
  }
}
