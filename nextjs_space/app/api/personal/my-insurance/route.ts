/**
 * GET /api/personal/my-insurance
 * Xem thông tin bảo hiểm của bản thân — SELF scope.
 * Số sổ BHXH/BHYT nhạy cảm không trả về (cần VIEW_INSURANCE_SENSITIVE riêng).
 * Yêu cầu: VIEW_MY_INSURANCE
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/rbac/middleware';
import { authorize } from '@/lib/rbac/authorize';
import { PERSONAL } from '@/lib/rbac/function-codes';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (!authResult.allowed) return authResult.response!;
  const user = authResult.user!;

  const perm = await authorize(user, PERSONAL.VIEW_INSURANCE, {});
  if (!perm.allowed) {
    return NextResponse.json({ error: perm.deniedReason ?? 'Không có quyền xem thông tin bảo hiểm' }, { status: 403 });
  }

  try {
    const insurance = await prisma.insuranceInfo.findUnique({
      where: { userId: user.id },
      select: {
        id: true,
        userId: true,
        createdAt: true,
        updatedAt: true,
        // Số sổ BHXH/BHYT không trả về ở đây — cần VIEW_INSURANCE_SENSITIVE riêng
      },
    });

    return NextResponse.json({
      success: true,
      data: insurance,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Lỗi không xác định';
    console.error('[GET /api/personal/my-insurance]', error);
    return NextResponse.json({ error: 'Lỗi server: ' + msg }, { status: 500 });
  }
}
