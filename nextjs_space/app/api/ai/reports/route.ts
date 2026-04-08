import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireFunction } from '@/lib/rbac/middleware';
import { AI } from '@/lib/rbac/function-codes';

/**
 * API Monthly Reports List
 * Lấy danh sách báo cáo hàng tháng
 * GET: Lấy danh sách báo cáo
 * 
 * RBAC: AI.GENERATE_REPORT
 */

export async function GET(request: NextRequest) {
  try {
    // RBAC Check: AI.GENERATE_REPORT
    const authResult = await requireFunction(request, AI.GENERATE_REPORT);
    if (!authResult.allowed) {
      return authResult.response!;
    }

    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get('reportType');
    const year = searchParams.get('year');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: any = {};
    if (reportType) {
      where.reportType = reportType;
    }
    if (year) {
      where.year = parseInt(year);
    }

    const reports = await prisma.monthlyReport.findMany({
      where,
      orderBy: [
        { year: 'desc' },
        { month: 'desc' },
      ],
      take: limit,
    });

    return NextResponse.json({
      success: true,
      reports,
    });
  } catch (error: any) {
    console.error('GET reports error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reports', details: error.message },
      { status: 500 }
    );
  }
}
