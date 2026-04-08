/**
 * API Thống kê CSDL Đào tạo
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireScopedFunction } from '@/lib/rbac/middleware';
import { EDUCATION } from '@/lib/rbac/function-codes';
import prisma from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const authResult = await requireScopedFunction(req, EDUCATION.VIEW_PROGRAM);
    if (!authResult.allowed) {
      return authResult.response!;
    }

    // Lấy danh sách môn học
    const courses = await prisma.course.findMany();

    const totalCourses = courses.length;
    const totalCredits = courses.reduce((sum, c) => sum + (c.credits || 0), 0);

    // Lịch giảng dạy tuần này (demo data)
    const schedule = [
      { day: 'Thứ 2', time: '7:30-9:30', course: 'Triết học ML', room: 'A101', instructor: 'PGS.TS Nguyễn Văn A' },
      { day: 'Thứ 2', time: '9:45-11:45', course: 'Tư tưởng HCM', room: 'A102', instructor: 'TS. Trần Văn B' },
      { day: 'Thứ 3', time: '7:30-9:30', course: 'Lý luận chính trị', room: 'B201', instructor: 'PGS.TS Lê Văn C' },
      { day: 'Thứ 4', time: '13:30-15:30', course: 'Quản lý nhà nước', room: 'A103', instructor: 'TS. Phạm Thị D' },
      { day: 'Thứ 5', time: '7:30-9:30', course: 'Xây dựng Đảng', room: 'C301', instructor: 'GS.TS Hoàng Văn E' },
    ];

    // Phân bố môn học theo kỳ
    const bySemester = [
      { semester: 'Kỳ 1', count: Math.max(Math.floor(totalCourses * 0.2), 1) },
      { semester: 'Kỳ 2', count: Math.max(Math.floor(totalCourses * 0.2), 1) },
      { semester: 'Kỳ 3', count: Math.max(Math.floor(totalCourses * 0.2), 1) },
      { semester: 'Kỳ 4', count: Math.max(Math.floor(totalCourses * 0.2), 1) },
      { semester: 'Kỳ 5', count: Math.max(Math.floor(totalCourses * 0.1), 1) },
      { semester: 'Kỳ 6', count: Math.max(Math.floor(totalCourses * 0.1), 1) },
    ];

    return NextResponse.json({
      totalCourses,
      totalCredits,
      schedule,
      bySemester,
    });
  } catch (error) {
    console.error('Education stats error:', error);
    return NextResponse.json(
      { error: 'Lỗi lấy thống kê đào tạo' },
      { status: 500 }
    );
  }
}
