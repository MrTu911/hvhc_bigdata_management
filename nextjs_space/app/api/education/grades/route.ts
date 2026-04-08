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

    const where: any = {};
    if (classSectionId) where.classSectionId = classSectionId;
    if (hocVienId)      where.hocVienId = hocVienId;
    if (gradeStatus)    where.gradeStatus = gradeStatus;
    if (termId)         where.classSection = { termId };

    // Scope SELF: giảng viên chỉ xem điểm lớp học phần mình phụ trách
    const scope = authResult?.scope ?? 'SELF';
    if (scope === 'SELF' && user) {
      const facultyProfile = await prisma.facultyProfile.findUnique({
        where: { userId: user.id },
        select: { id: true },
      });
      if (facultyProfile) {
        // Lấy danh sách lớp học phần do giảng viên này phụ trách
        where.classSection = {
          ...(where.classSection || {}),
          facultyId: facultyProfile.id,
        };
      }
      // Nếu user không phải giảng viên (không có FacultyProfile) nhưng scope là SELF
      // → không lọc thêm (có thể là cán bộ đào tạo xem điểm học viên mình quản lý)
    }

    const enrollments = await prisma.classEnrollment.findMany({
      where,
      include: {
        hocVien: { select: { id: true, maHocVien: true, hoTen: true } },
        classSection: {
          select: {
            id: true,
            code: true,
            name: true,
            termId: true,
            curriculumCourse: { select: { subjectCode: true, subjectName: true, credits: true } },
          },
        },
        _count: { select: { scoreHistories: true } },
      },
      orderBy: [{ classSection: { code: 'asc' } }, { hocVien: { hoTen: 'asc' } }],
    });

    return NextResponse.json({ success: true, data: enrollments });
  } catch (error: any) {
    console.error('GET /api/education/grades error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch grades' }, { status: 500 });
  }
}
