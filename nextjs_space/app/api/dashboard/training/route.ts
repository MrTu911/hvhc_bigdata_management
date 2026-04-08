/**
 * API: Dashboard Đào tạo
 * GET /api/dashboard/training
 * Thống kê và dữ liệu đào tạo từ database thực
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireFunction } from '@/lib/rbac/middleware';
import { TRAINING } from '@/lib/rbac/function-codes';
import { cached, CACHE_TTL, dashboardCacheKey } from '@/lib/cache';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Check authorization using Function-based RBAC
    const authResult = await requireFunction(request, TRAINING.VIEW);
    if (!authResult.allowed) {
      return authResult.response!;
    }

    const user = authResult.user!;
    const cacheKey = dashboardCacheKey(user.id, 'training');

    const data = await cached(cacheKey, CACHE_TTL.DASHBOARD_DATA, async () => {
      // 1. Thống kê tổng quan khóa học
      const [totalCourses, activeCourses] = await Promise.all([
        prisma.course.count(),
        prisma.course.count({ where: { isActive: true } })
      ]);

      // 2. Thống kê đăng ký học
      const totalRegistrations = await prisma.registration.count();
      const registrationsByStatus = await prisma.registration.groupBy({
        by: ['status'],
        _count: { id: true }
      });

      // 3. Thống kê điểm từ KetQuaHocTap
      const gradeStats = await prisma.ketQuaHocTap.aggregate({
        _avg: { diemTongKet: true },
        _count: { id: true }
      });

      // 4. Phân bố học lực
      const allGrades = await prisma.ketQuaHocTap.findMany({
        where: { diemTongKet: { not: null } },
        select: { diemTongKet: true, xepLoai: true }
      });

      const gradeDistribution = {
        excellent: allGrades.filter(g => g.diemTongKet && g.diemTongKet >= 8.5).length,
        good: allGrades.filter(g => g.diemTongKet && g.diemTongKet >= 7 && g.diemTongKet < 8.5).length,
        average: allGrades.filter(g => g.diemTongKet && g.diemTongKet >= 5 && g.diemTongKet < 7).length,
        weak: allGrades.filter(g => g.diemTongKet && g.diemTongKet < 5).length
      };

      // 5. Top môn học theo đăng ký
      const topCourses = await prisma.course.findMany({
        take: 10,
        orderBy: { currentStudents: 'desc' },
        select: {
          id: true,
          code: true,
          name: true,
          credits: true,
          currentStudents: true,
          maxStudents: true,
          semester: true,
          year: true
        }
      });

      // 6. Thống kê theo học kỳ
      const coursesBySemester = await prisma.course.groupBy({
        by: ['semester', 'year'],
        _count: { id: true },
        orderBy: [{ year: 'desc' }, { semester: 'asc' }],
        take: 6
      });

      // 7. Thống kê học viên
      const totalStudents = await prisma.hocVien.count();
      const activeStudents = await prisma.hocVien.count({
        where: { trangThai: 'Đang học' }
      });

      // 8. Top học viên theo điểm
      const topStudents = await prisma.hocVien.findMany({
        take: 10,
        where: {
          ketQuaHocTap: { some: { diemTongKet: { not: null } } }
        },
        include: {
          ketQuaHocTap: {
            where: { diemTongKet: { not: null } },
            select: { diemTongKet: true }
          }
        }
      });

      const studentsWithGPA = topStudents.map(s => {
        const grades = s.ketQuaHocTap.map(k => k.diemTongKet || 0);
        const gpa = grades.length > 0 ? grades.reduce((a, b) => a + b, 0) / grades.length : 0;
        return {
          id: s.id,
          maHocVien: s.maHocVien,
          hoTen: s.hoTen,
          lop: s.lop,
          khoa: s.khoaHoc,
          gpa: parseFloat(gpa.toFixed(2)),
          totalSubjects: grades.length
        };
      }).sort((a, b) => b.gpa - a.gpa).slice(0, 10);

      // 9. Tỷ lệ đạt và xuất sắc
      const totalGradedCount = allGrades.length;
      const passRate = totalGradedCount > 0
        ? ((gradeDistribution.excellent + gradeDistribution.good + gradeDistribution.average) / totalGradedCount * 100).toFixed(1)
        : 0;
      const excellenceRate = totalGradedCount > 0
        ? (gradeDistribution.excellent / totalGradedCount * 100).toFixed(1)
        : 0;

      return {
        overview: {
          totalCourses,
          activeCourses,
          totalRegistrations,
          totalStudents,
          activeStudents,
          avgGrade: gradeStats._avg.diemTongKet?.toFixed(2) || 0,
          totalGraded: gradeStats._count.id,
          passRate,
          excellenceRate
        },
        gradeDistribution,
        registrationsByStatus: registrationsByStatus.map(r => ({
          status: r.status,
          count: r._count.id
        })),
        topCourses,
        coursesBySemester: coursesBySemester.map(c => ({
          semester: c.semester,
          year: c.year,
          count: c._count.id
        })),
        topStudents: studentsWithGPA
      };
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Training dashboard error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
