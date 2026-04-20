/**
 * GET /api/personal/my-conduct
 * Xem điểm rèn luyện của bản thân — SELF scope.
 * Yêu cầu: VIEW_MY_CONDUCT (Tầng 2 — Học viên/Sinh viên)
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

  const perm = await authorize(user, PERSONAL.VIEW_CONDUCT, {});
  if (!perm.allowed) {
    return NextResponse.json({ error: perm.deniedReason ?? 'Không có quyền xem điểm rèn luyện' }, { status: 403 });
  }

  try {
    const hocVien = await prisma.hocVien.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });

    if (!hocVien) {
      return NextResponse.json({ success: true, data: [] });
    }

    const conductRecords = await prisma.studentConductRecord.findMany({
      where: { hocVienId: hocVien.id },
      orderBy: [{ academicYear: 'desc' }, { semesterCode: 'desc' }],
      select: {
        id: true,
        academicYear: true,
        semesterCode: true,
        conductScore: true,
        conductGrade: true,
        rewardSummary: true,
        disciplineSummary: true,
        approvedAt: true,
      },
    });

    return NextResponse.json({ success: true, data: conductRecords });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Lỗi không xác định';
    console.error('[GET /api/personal/my-conduct]', error);
    return NextResponse.json({ error: 'Lỗi server: ' + msg }, { status: 500 });
  }
}
