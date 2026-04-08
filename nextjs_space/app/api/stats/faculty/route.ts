/**
 * API Thống kê CSDL Giảng viên
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireScopedFunction } from '@/lib/rbac/middleware';
import { FACULTY } from '@/lib/rbac/function-codes';
import prisma from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const authResult = await requireScopedFunction(req, FACULTY.VIEW);
    if (!authResult.allowed) {
      return authResult.response!;
    }

    // Lấy danh sách giảng viên
    const faculty = await prisma.facultyProfile.findMany({
      include: {
        user: true,
      }
    });

    // Lấy units
    const units = await prisma.unit.findMany({
      select: { id: true, name: true }
    });
    const unitMap = new Map(units.map(u => [u.id, u.name]));

    const total = faculty.length;

    // Phân bố theo học vị
    const degreeCountMap = new Map<string, number>();
    faculty.forEach(f => {
      const degree = f.academicDegree || 'Chưa xác định';
      degreeCountMap.set(degree, (degreeCountMap.get(degree) || 0) + 1);
    });
    const byDegree = Array.from(degreeCountMap.entries())
      .map(([degree, count]) => ({ degree, count }));

    // Phân bố theo học hàm
    const titleCountMap = new Map<string, number>();
    faculty.forEach(f => {
      const title = f.academicRank || 'Chưa có';
      titleCountMap.set(title, (titleCountMap.get(title) || 0) + 1);
    });
    const byTitle = Array.from(titleCountMap.entries())
      .map(([title, count]) => ({ title, count }));

    // Phân bố theo đơn vị
    const unitCountMap = new Map<string, number>();
    faculty.forEach(f => {
      const unitName = f.unitId ? unitMap.get(f.unitId) || 'Chưa xác định' : 'Chưa xác định';
      unitCountMap.set(unitName, (unitCountMap.get(unitName) || 0) + 1);
    });
    const byUnit = Array.from(unitCountMap.entries())
      .map(([unit, count]) => ({ unit, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // EIS Radar
    const eisRadar = [
      { dimension: 'Giảng dạy', value: 75, fullMark: 100 },
      { dimension: 'Nghiên cứu', value: 68, fullMark: 100 },
      { dimension: 'Hướng dẫn', value: 72, fullMark: 100 },
      { dimension: 'Quản lý', value: 65, fullMark: 100 },
      { dimension: 'Phục vụ', value: 70, fullMark: 100 },
      { dimension: 'Phát triển', value: 78, fullMark: 100 },
    ];

    return NextResponse.json({
      total,
      byDegree,
      byTitle,
      byUnit,
      eisRadar,
    });
  } catch (error) {
    console.error('Faculty stats error:', error);
    return NextResponse.json(
      { error: 'Lỗi lấy thống kê giảng viên' },
      { status: 500 }
    );
  }
}
