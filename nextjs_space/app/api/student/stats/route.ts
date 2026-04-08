/**
 * Student Stats API
 * RBAC: Function-based with Scope filtering
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireScopedFunction } from '@/lib/rbac/middleware';
import { STUDENT } from '@/lib/rbac/function-codes';
import prisma from '@/lib/db';

// GET: Thống kê học viên
export async function GET(request: NextRequest) {
  try {
    // RBAC Check với Scope: VIEW_STUDENT
    const { user, response } = await requireScopedFunction(request, STUDENT.VIEW);
    if (!user) {
      return response!;
    }

    // Total students
    const totalStudents = await prisma.hocVien.count();

    // Students by status
    const studentsByStatus = await prisma.hocVien.groupBy({
      by: ['trangThai'],
      _count: true,
    });

    // Students by khoaHoc
    const studentsByKhoaHoc = await prisma.hocVien.groupBy({
      by: ['khoaHoc'],
      _count: true,
      orderBy: {
        khoaHoc: 'desc',
      },
    });

    // Students by nganh
    const studentsByNganh = await prisma.hocVien.groupBy({
      by: ['nganh'],
      _count: true,
      orderBy: {
        _count: {
          nganh: 'desc',
        },
      },
      take: 10,
    });

    // Average GPA
    const avgGPA = await prisma.hocVien.aggregate({
      _avg: {
        diemTrungBinh: true,
      },
    });

    // GPA distribution
    const students = await prisma.hocVien.findMany({
      select: { diemTrungBinh: true },
    });

    const gpaDistribution = {
      xuatSac: students.filter(s => s.diemTrungBinh >= 9).length,
      gioi: students.filter(s => s.diemTrungBinh >= 8 && s.diemTrungBinh < 9).length,
      kha: students.filter(s => s.diemTrungBinh >= 7 && s.diemTrungBinh < 8).length,
      trungBinh: students.filter(s => s.diemTrungBinh >= 5 && s.diemTrungBinh < 7).length,
      yeu: students.filter(s => s.diemTrungBinh < 5).length,
    };

    // Top students
    const topStudents = await prisma.hocVien.findMany({
      orderBy: {
        diemTrungBinh: 'desc',
      },
      take: 10,
      include: {
        giangVienHuongDan: {
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    // Recent results
    const recentResults = await prisma.ketQuaHocTap.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      take: 20,
      include: {
        hocVien: {
          select: {
            hoTen: true,
            maHocVien: true,
            lop: true,
          },
        },
      },
    });

    // Pass/Fail statistics
    const allResults = await prisma.ketQuaHocTap.findMany();
    const passFailStats = {
      total: allResults.length,
      passed: allResults.filter(r => r.ketQua === 'Đạt').length,
      failed: allResults.filter(r => r.ketQua === 'Không đạt').length,
      passRate: allResults.length > 0 
        ? ((allResults.filter(r => r.ketQua === 'Đạt').length / allResults.length) * 100).toFixed(1)
        : '0',
    };

    return NextResponse.json({
      totalStudents,
      studentsByStatus,
      studentsByKhoaHoc,
      studentsByNganh,
      avgGPA: avgGPA._avg.diemTrungBinh?.toFixed(2) || '0.00',
      gpaDistribution,
      topStudents,
      recentResults,
      passFailStats,
    });
  } catch (error: any) {
    console.error('Error fetching student stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch student stats', details: error.message },
      { status: 500 }
    );
  }
}
