/**
 * API: Faculty Teaching Statistics
 * GET /api/faculty/teaching-stats
 *
 * Trả thống kê giảng dạy cho giảng viên hiện tại:
 *   - subjectStats: kết quả từng môn học / lớp
 *   - trendData: xu hướng điểm TB theo học kỳ
 *   - summary: tổng hợp KPI
 *
 * Query params:
 *   subject  – tìm theo tên/mã môn (optional)
 *   year     – lọc theo năm học, vd: "2024-2025" (optional)
 *   semester – lọc theo học kỳ, vd: "HK1" (optional)
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireFunction } from '@/lib/rbac/middleware';
import { FACULTY } from '@/lib/rbac/function-codes';
import { logAudit } from '@/lib/audit';
import { getTeachingAnalytics } from '@/lib/services/faculty/teaching-analytics.service';

export async function GET(req: NextRequest) {
  try {
    const authResult = await requireFunction(req, FACULTY.VIEW_STATS);
    if (!authResult.allowed) {
      return authResult.response!;
    }
    const { user } = authResult;

    // Resolve faculty profile cho user hiện tại
    const currentUser = await prisma.user.findUnique({
      where: { id: user!.id },
      include: { facultyProfile: true },
    });

    if (!currentUser?.facultyProfile) {
      return NextResponse.json(
        { success: false, error: 'Faculty profile not found' },
        { status: 404 }
      );
    }

    // Parse query filters
    const { searchParams } = new URL(req.url);
    const filters = {
      subject:  searchParams.get('subject')  ?? undefined,
      year:     searchParams.get('year')     ?? undefined,
      semester: searchParams.get('semester') ?? undefined,
    };

    const { subjectStats, trendData, summary } = await getTeachingAnalytics(
      currentUser.facultyProfile.id,
      filters
    );

    await logAudit({
      userId: user!.id,
      functionCode: FACULTY.VIEW_STATS,
      action: 'VIEW',
      resourceType: 'TEACHING_ANALYTICS',
      resourceId: currentUser.facultyProfile.id,
      result: 'SUCCESS',
    });

    return NextResponse.json({ success: true, subjectStats, trendData, summary });
  } catch (error) {
    console.error('Error fetching teaching stats:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch teaching statistics',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
