/**
 * API: Student Performance Analysis
 * RBAC v8.8: Migrated to function-based RBAC
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireFunction } from '@/lib/rbac/middleware';
import { STUDENT, AI } from '@/lib/rbac/function-codes';
import { logAudit } from '@/lib/audit';

interface PerformanceData {
  id: string;
  maHocVien: string;
  hoTen: string;
  lop: string | null;
  khoaHoc: string | null;
  avgGPA: number;
  trend: 'tăng' | 'giảm' | 'ổn định';
  riskLevel: 'Nguy cơ thấp' | 'Xuất sắc' | 'Bình thường';
  gpaHistory: number[];
}

function analyzePerformance(gpaHistory: number[]): {
  avgGPA: number;
  trend: 'tăng' | 'giảm' | 'ổn định';
  riskLevel: 'Nguy cơ thấp' | 'Xuất sắc' | 'Bình thường';
} {
  const avgGPA =
    gpaHistory.length > 0
      ? gpaHistory.reduce((a, b) => a + b, 0) / gpaHistory.length
      : 0;

  let trend: 'tăng' | 'giảm' | 'ổn định' = 'ổn định';
  if (gpaHistory.length >= 2) {
    const diff = gpaHistory[gpaHistory.length - 1] - gpaHistory[0];
    trend = diff > 0.3 ? 'tăng' : diff < -0.3 ? 'giảm' : 'ổn định';
  }

  let riskLevel: 'Nguy cơ thấp' | 'Xuất sắc' | 'Bình thường';
  if (avgGPA < 5 || trend === 'giảm') {
    riskLevel = 'Nguy cơ thấp';
  } else if (avgGPA >= 8 && trend === 'tăng') {
    riskLevel = 'Xuất sắc';
  } else {
    riskLevel = 'Bình thường';
  }

  return {
    avgGPA: parseFloat(avgGPA.toFixed(2)),
    trend,
    riskLevel,
  };
}

// GET /api/student/performance-analysis - Phân tích hiệu suất học tập học viên
export async function GET(req: NextRequest) {
  try {
    // RBAC: Yêu cầu quyền phân tích xu hướng AI
    const authResult = await requireFunction(req, AI.ANALYZE_TRENDS);
    if (!authResult.allowed) {
      return authResult.response!;
    }
    const user = authResult.user!;

    // Lấy query params để lọc
    const { searchParams } = new URL(req.url);
    const departmentFilter = searchParams.get('department') || '';
    const classFilter = searchParams.get('class') || '';
    const riskFilter = searchParams.get('risk') || '';

    // Lấy danh sách học viên với kết quả học tập
    const students = await prisma.hocVien.findMany({
      where: {
        ...(classFilter && { lop: { contains: classFilter, mode: 'insensitive' } }),
        ...(departmentFilter && { nganh: { contains: departmentFilter, mode: 'insensitive' } }),
      },
      include: {
        ketQuaHocTap: {
          select: {
            diemTongKet: true,
            namHoc: true,
            hocKy: true,
          },
          orderBy: [
            { namHoc: 'asc' },
            { hocKy: 'asc' },
          ],
        },
      },
      orderBy: {
        hoTen: 'asc',
      },
    });

    // Phân tích từng học viên
    const performanceData: PerformanceData[] = students.map((student) => {
      // Tạo lịch sử GPA từ kết quả học tập
      const gpaHistory = student.ketQuaHocTap
        .filter((kt) => kt.diemTongKet !== null && kt.diemTongKet !== undefined)
        .map((kt) => kt.diemTongKet as number);

      // Phân tích hiệu suất
      const analysis = analyzePerformance(gpaHistory);

      return {
        id: student.id,
        maHocVien: student.maHocVien,
        hoTen: student.hoTen,
        lop: student.lop,
        khoaHoc: student.khoaHoc,
        avgGPA: analysis.avgGPA,
        trend: analysis.trend,
        riskLevel: analysis.riskLevel,
        gpaHistory,
      };
    });

    // Lọc theo risk level nếu có
    let filteredData = performanceData;
    if (riskFilter) {
      filteredData = performanceData.filter((p) => p.riskLevel === riskFilter);
    }

    // Tính thống kê tổng hợp
    const statistics = {
      total: filteredData.length,
      xuatSac: filteredData.filter((p) => p.riskLevel === 'Xuất sắc').length,
      binhThuong: filteredData.filter((p) => p.riskLevel === 'Bình thường').length,
      nguyCoThap: filteredData.filter((p) => p.riskLevel === 'Nguy cơ thấp').length,
      avgGPAAll:
        filteredData.length > 0
          ? parseFloat(
              (
                filteredData.reduce((sum, p) => sum + p.avgGPA, 0) /
                filteredData.length
              ).toFixed(2)
            )
          : 0,
      trendTang: filteredData.filter((p) => p.trend === 'tăng').length,
      trendGiam: filteredData.filter((p) => p.trend === 'giảm').length,
      trendOnDinh: filteredData.filter((p) => p.trend === 'ổn định').length,
    };

    // Audit log
    await logAudit({
      userId: user!.id,
      functionCode: AI.ANALYZE_TRENDS,
      action: 'VIEW',
      resourceType: 'STUDENT_PERFORMANCE_ANALYSIS',
      result: 'SUCCESS',
    });

    return NextResponse.json({
      success: true,
      generatedAt: new Date().toISOString(),
      totalStudents: filteredData.length,
      statistics,
      performance: filteredData,
    });
  } catch (error) {
    console.error('Performance analysis error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to analyze student performance',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
