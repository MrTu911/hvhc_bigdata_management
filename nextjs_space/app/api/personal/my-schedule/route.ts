/**
 * GET /api/personal/my-schedule
 * Xem thời khóa biểu của bản thân — SELF scope.
 * Dùng ClassEnrollment → ClassSection (không qua Course.classSections).
 * Yêu cầu: VIEW_MY_SCHEDULE (Tầng 2 — Học viên/Sinh viên)
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

  const perm = await authorize(user, PERSONAL.VIEW_SCHEDULE, {});
  if (!perm.allowed) {
    return NextResponse.json({ error: perm.deniedReason ?? 'Không có quyền xem thời khóa biểu' }, { status: 403 });
  }

  try {
    const hocVien = await prisma.hocVien.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });

    if (!hocVien) {
      return NextResponse.json({ success: true, data: [] });
    }

    // ClassEnrollment là join table giữa HocVien và ClassSection
    const enrollments = await prisma.classEnrollment.findMany({
      where: {
        hocVienId: hocVien.id,
        status: { in: ['ENROLLED', 'PENDING'] },
      },
      select: {
        id: true,
        status: true,
        enrolledAt: true,
        classSection: {
          select: {
            id: true,
            code: true,
            name: true,
            schedule: true,
            dayOfWeek: true,
            startPeriod: true,
            endPeriod: true,
            startDate: true,
            endDate: true,
            room: { select: { id: true, name: true } },
            term: { select: { id: true, name: true, startDate: true, endDate: true } },
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: enrollments });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Lỗi không xác định';
    console.error('[GET /api/personal/my-schedule]', error);
    return NextResponse.json({ error: 'Lỗi server: ' + msg }, { status: 500 });
  }
}
