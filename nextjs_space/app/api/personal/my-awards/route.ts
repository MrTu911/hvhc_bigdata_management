/**
 * GET /api/personal/my-awards
 * Xem khen thưởng và kỷ luật của bản thân — SELF scope.
 * Yêu cầu: VIEW_MY_AWARD
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

  const perm = await authorize(user, PERSONAL.VIEW_AWARD, {});
  if (!perm.allowed) {
    return NextResponse.json({ error: perm.deniedReason ?? 'Không có quyền xem khen thưởng/kỷ luật' }, { status: 403 });
  }

  try {
    const awardsRecords = await prisma.awardsRecord.findMany({
      where: { userId: user.id },
      orderBy: { year: 'desc' },
      select: {
        id: true,
        type: true,
        description: true,
        year: true,
        awardedBy: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: awardsRecords,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Lỗi không xác định';
    console.error('[GET /api/personal/my-awards]', error);
    return NextResponse.json({ error: 'Lỗi server: ' + msg }, { status: 500 });
  }
}
