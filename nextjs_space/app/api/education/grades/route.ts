/**
 * M10 – UC-56: Danh sách điểm học phần
 * GET /api/education/grades?classSectionId=&hocVienId=&termId=&gradeStatus=
 *
 * Mapping: GradeRecord (design) → ClassEnrollment (codebase)
 *
 * Scope:
 * - SELF  → giảng viên chỉ thấy điểm lớp mình phụ trách (ClassSection.facultyId)
 * - UNIT/DEPARTMENT/ACADEMY → thấy tất cả (đã được function-code guard)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireFunction } from '@/lib/rbac/middleware';
import { EDUCATION } from '@/lib/rbac/function-codes';
import { listGrades } from '@/lib/services/education/grade.service';

export async function GET(req: NextRequest) {
  try {
    const auth = await requireFunction(req, EDUCATION.VIEW_GRADE);
    if (!auth.allowed) return auth.response!;
    const { user, authResult } = auth;

    const { searchParams } = new URL(req.url);
    const classSectionId = searchParams.get('classSectionId');
    const hocVienId      = searchParams.get('hocVienId');
    const termId         = searchParams.get('termId');
    const gradeStatus    = searchParams.get('gradeStatus');

    if (!classSectionId && !hocVienId && !termId) {
      return NextResponse.json(
        { success: false, error: 'Cần ít nhất một trong: classSectionId, hocVienId, termId' },
        { status: 400 }
      );
    }

    // Scope SELF: resolve facultyId của người dùng (nếu là giảng viên)
    let restrictToFacultyId: string | undefined;
    const scope = authResult?.scope ?? 'SELF';
    if (scope === 'SELF' && user) {
      const facultyProfile = await prisma.facultyProfile.findUnique({
        where: { userId: user.id },
        select: { id: true },
      });
      restrictToFacultyId = facultyProfile?.id;
      // Nếu user không có FacultyProfile (cán bộ đào tạo) → không restrict thêm
    }

    const data = await listGrades({
      classSectionId: classSectionId ?? undefined,
      hocVienId: hocVienId ?? undefined,
      termId: termId ?? undefined,
      gradeStatus: gradeStatus ?? undefined,
      restrictToFacultyId,
    });

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('GET /api/education/grades error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch grades' }, { status: 500 });
  }
}
