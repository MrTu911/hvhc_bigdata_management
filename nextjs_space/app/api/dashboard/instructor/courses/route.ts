/**
 * API: Instructor Courses
 * GET /api/dashboard/instructor/courses - Lấy danh sách môn giảng dạy của giảng viên
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireFunction } from '@/lib/rbac/middleware';
import { DASHBOARD } from '@/lib/rbac/function-codes';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Check authorization using Function-based RBAC
    const authResult = await requireFunction(request, DASHBOARD.VIEW_FACULTY);
    if (!authResult.allowed) {
      return authResult.response!;
    }
    const user = authResult.user!;

    // Lấy FacultyProfile của giảng viên
    const facultyProfile = await prisma.facultyProfile.findUnique({
      where: { userId: user.id },
    });

    if (!facultyProfile) {
      return NextResponse.json({
        courses: [],
        message: 'Không tìm thấy hồ sơ giảng viên'
      });
    }

    // Lấy danh sách môn giảng dạy
    const teachingSubjects = await prisma.teachingSubject.findMany({
      where: { facultyId: facultyProfile.id },
      orderBy: { subjectName: 'asc' },
    });

    // Lấy thống kê sinh viên từ KetQuaHocTap
    const courses = await Promise.all(
      teachingSubjects.map(async (subject) => {
        const studentResults = await prisma.ketQuaHocTap.findMany({
          where: { maMon: subject.subjectCode },
        });

        const totalStudents = studentResults.length;
        const avgScore = totalStudents > 0
          ? studentResults.reduce((sum, r) => sum + (r.diemTongKet || 0), 0) / totalStudents
          : 0;

        return {
          id: subject.id,
          code: subject.subjectCode,
          name: subject.subjectName,
          credits: subject.credits || 0,
          semester: subject.semester || 'N/A',
          academicYear: subject.academicYear || 'N/A',
          totalStudents,
          averageScore: Math.round(avgScore * 100) / 100,
        };
      })
    );

    return NextResponse.json({
      courses,
      total: courses.length,
    });
  } catch (error) {
    console.error('Instructor courses error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
