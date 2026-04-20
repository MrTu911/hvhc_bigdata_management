/**
 * GET /api/personal/my-career
 * Xem quá trình công tác của bản thân — SELF scope.
 * Yêu cầu: VIEW_MY_CAREER_HISTORY
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

  const perm = await authorize(user, PERSONAL.VIEW_CAREER_HISTORY, {});
  if (!perm.allowed) {
    return NextResponse.json({ error: perm.deniedReason ?? 'Không có quyền xem quá trình công tác' }, { status: 403 });
  }

  try {
    const [careerHistories, userPositions] = await Promise.all([
      prisma.careerHistory.findMany({
        where: { userId: user.id, deletedAt: null },
        orderBy: { eventDate: 'desc' },
        select: {
          id: true,
          eventType: true,
          eventDate: true,
          effectiveDate: true,
          endDate: true,
          title: true,
          newPosition: true,
          oldPosition: true,
          newUnit: true,
          oldUnit: true,
          newRank: true,
          oldRank: true,
          decisionNumber: true,
          notes: true,
        },
      }),
      prisma.userPosition.findMany({
        where: { userId: user.id },
        orderBy: { startDate: 'desc' },
        select: {
          id: true,
          startDate: true,
          endDate: true,
          isPrimary: true,
          isActive: true,
          notes: true,
          position: { select: { code: true, name: true } },
          unit: { select: { id: true, name: true, code: true } },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: { careerHistories, positions: userPositions },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Lỗi không xác định';
    console.error('[GET /api/personal/my-career]', error);
    return NextResponse.json({ error: 'Lỗi server: ' + msg }, { status: 500 });
  }
}
