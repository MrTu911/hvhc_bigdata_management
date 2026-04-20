/**
 * GET /api/personal/my-grade
 * Xem điểm học tập của bản thân — SELF scope.
 * Yêu cầu: VIEW_MY_GRADE (Tầng 2 — Học viên/Sinh viên)
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

  const perm = await authorize(user, PERSONAL.VIEW_GRADE, {});
  if (!perm.allowed) {
    return NextResponse.json({ error: perm.deniedReason ?? 'Không có quyền xem điểm học tập' }, { status: 403 });
  }

  try {
    // Tìm HocVien/StudentProfile liên kết với user
    const hocVien = await prisma.hocVien.findUnique({
      where: { userId: user.id },
      select: { id: true, maHocVien: true, hoTen: true, diemTrungBinh: true, academicStatus: true },
    });

    if (!hocVien) {
      return NextResponse.json({ success: true, data: { hocVien: null, grades: [] } });
    }

    // Lấy điểm qua Registration → GradeRecord (SELF: hocVienId đã là của user)
    const registrations = await prisma.registration.findMany({
      where: { hocVienId: hocVien.id },
      orderBy: { registeredAt: 'desc' },
      select: {
        id: true,
        status: true,
        registeredAt: true,
        course: { select: { id: true, code: true, name: true, credits: true } },
        gradeRecords: {
          select: {
            id: true,
            midtermScore: true,
            finalScore: true,
            assignmentScore: true,
            totalScore: true,
            letterGrade: true,
            status: true,
            gradedAt: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        hocVien,
        grades: registrations.map((r) => ({
          courseId: r.course.id,
          courseCode: r.course.code,
          courseName: r.course.name,
          credits: r.course.credits,
          registrationStatus: r.status,
          registeredAt: r.registeredAt,
          grade: r.gradeRecords[0] ?? null,
        })),
      },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Lỗi không xác định';
    console.error('[GET /api/personal/my-grade]', error);
    return NextResponse.json({ error: 'Lỗi server: ' + msg }, { status: 500 });
  }
}
