/**
 * GET /api/personal/my-career
 * Xem quá trình công tác của bản thân — SELF scope.
 * Yêu cầu: VIEW_MY_CAREER_HISTORY
 *
 * Trả về:
 *  - summary: thông tin tóm tắt cá nhân (cấp bậc, ngày nhập ngũ, đơn vị/chức vụ hiện tại)
 *  - careerHistories: dòng thời gian sự kiện công tác (đầy đủ thông tin quyết định/đào tạo)
 *  - positions: các chức vụ đã/đang đảm nhiệm
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
    return NextResponse.json(
      { success: false, data: null, error: perm.deniedReason ?? 'Không có quyền xem quá trình công tác' },
      { status: 403 },
    );
  }

  try {
    const [careerHistories, userPositions, profile] = await Promise.all([
      prisma.careerHistory.findMany({
        where: { userId: user.id, deletedAt: null },
        orderBy: { eventDate: 'desc' },
        select: {
          id: true,
          eventType: true,
          eventDate: true,
          effectiveDate: true,
          endDate: true,
          reason: true,
          title: true,
          decisionAuthority: true,
          decisionNumber: true,
          decisionDate: true,
          signerName: true,
          signerPosition: true,
          oldPosition: true,
          newPosition: true,
          oldRank: true,
          newRank: true,
          oldUnit: true,
          newUnit: true,
          trainingName: true,
          trainingInstitution: true,
          trainingResult: true,
          certificateNumber: true,
          attachmentUrl: true,
          notes: true,
        },
      }),
      prisma.userPosition.findMany({
        where: { userId: user.id },
        orderBy: [{ isActive: 'desc' }, { startDate: 'desc' }],
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
      prisma.user.findUnique({
        where: { id: user.id },
        select: {
          name: true,
          rank: true,
          enlistmentDate: true,
          unitRelation: { select: { name: true } },
        },
      }),
    ]);

    const activePosition = userPositions.find((p) => p.isActive) ?? null;

    const summary = {
      fullName: profile?.name ?? null,
      rank: profile?.rank ?? null,
      enlistmentDate: profile?.enlistmentDate ?? null,
      currentUnitName: activePosition?.unit?.name ?? profile?.unitRelation?.name ?? null,
      currentPositionName: activePosition?.position.name ?? null,
    };

    return NextResponse.json({
      success: true,
      data: { summary, careerHistories, positions: userPositions },
      error: null,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Lỗi không xác định';
    console.error('[GET /api/personal/my-career]', error);
    return NextResponse.json(
      { success: false, data: null, error: 'Lỗi server: ' + msg },
      { status: 500 },
    );
  }
}
