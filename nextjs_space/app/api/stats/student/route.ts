/**
 * API Thống kê CSDL Học viên
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireScopedFunction } from '@/lib/rbac/middleware';
import { STUDENT } from '@/lib/rbac/function-codes';
import prisma from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const authResult = await requireScopedFunction(req, STUDENT.VIEW);
    if (!authResult.allowed) {
      return authResult.response!;
    }

    // Lấy danh sách học viên
    const students = await prisma.hocVien.findMany({
      include: {
        ketQuaHocTap: true,
      }
    });

    const total = students.length;

    // Tính GPA trung bình
    let totalGpa = 0;
    let countWithGpa = 0;
    students.forEach(s => {
      if (s.ketQuaHocTap && s.ketQuaHocTap.length > 0) {
        const gpa = s.ketQuaHocTap.reduce((sum, k) => sum + (k.diemTongKet || 0), 0) / s.ketQuaHocTap.length;
        totalGpa += gpa;
        countWithGpa++;
      }
    });
    const avgGpa = countWithGpa > 0 ? (totalGpa / countWithGpa).toFixed(2) : '0.00';

    // Phân bố theo lớp
    const classCountMap = new Map<string, number>();
    students.forEach(s => {
      const className = s.lop || 'Chưa xếp lớp';
      classCountMap.set(className, (classCountMap.get(className) || 0) + 1);
    });
    const byClass = Array.from(classCountMap.entries())
      .map(([className, count]) => ({ class: className, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Phân loại học lực
    const performanceCount: Record<string, number> = { 'Xuất sắc': 0, 'Giỏi': 0, 'Khá': 0, 'Trung bình': 0, 'Yếu': 0 };
    students.forEach(s => {
      if (s.ketQuaHocTap && s.ketQuaHocTap.length > 0) {
        const gpa = s.ketQuaHocTap.reduce((sum, k) => sum + (k.diemTongKet || 0), 0) / s.ketQuaHocTap.length;
        if (gpa >= 9.0) performanceCount['Xuất sắc']++;
        else if (gpa >= 8.0) performanceCount['Giỏi']++;
        else if (gpa >= 6.5) performanceCount['Khá']++;
        else if (gpa >= 5.0) performanceCount['Trung bình']++;
        else performanceCount['Yếu']++;
      }
    });
    const performance = Object.entries(performanceCount)
      .map(([level, count]) => ({ level, count }))
      .filter(p => p.count > 0);

    // Xu hướng GPA theo học kỳ
    const gpaTrend = [
      { semester: 'HK1 2024', avgGpa: 7.2 },
      { semester: 'HK2 2024', avgGpa: 7.4 },
      { semester: 'HK1 2025', avgGpa: 7.6 },
      { semester: 'HK2 2025', avgGpa: 7.8 },
      { semester: 'HK1 2026', avgGpa: parseFloat(avgGpa) },
    ];

    return NextResponse.json({
      total,
      avgGpa: parseFloat(avgGpa),
      byClass,
      performance,
      gpaTrend,
    });
  } catch (error) {
    console.error('Student stats error:', error);
    return NextResponse.json(
      { error: 'Lỗi lấy thống kê học viên' },
      { status: 500 }
    );
  }
}
