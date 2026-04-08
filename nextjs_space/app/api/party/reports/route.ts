/**
 * API: Party Reports - Báo cáo Đảng
 * Path: /api/party/reports
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireAnyFunction } from '@/lib/rbac/middleware';
import { PARTY } from '@/lib/rbac/function-codes';
import prisma from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAnyFunction(request, [PARTY.VIEW_REPORT, PARTY.VIEW]);
    if (!authResult.allowed) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get('type') || 'annual'; // annual | quarterly | membership
    const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : new Date().getFullYear();

    if (reportType === 'membership') {
      // Báo cáo tình hình đảng viên theo đơn vị
      const membersByUnit = await prisma.user.groupBy({
        by: ['unitId'],
        where: {
          partyMember: { deletedAt: null },
        },
        _count: { id: true },
      });

      const units = await prisma.unit.findMany({
        where: { id: { in: membersByUnit.map(m => m.unitId).filter(Boolean) as string[] } },
        select: { id: true, name: true, code: true },
      });

      const unitMap = units.reduce((acc, u) => { acc[u.id] = u; return acc; }, {} as Record<string, any>);

      return NextResponse.json({
        reportType: 'membership',
        year,
        data: membersByUnit.map(m => ({
          unit: m.unitId ? unitMap[m.unitId] : null,
          memberCount: m._count.id,
        })),
      });
    }

    if (reportType === 'annual') {
      // Báo cáo đánh giá phân loại đảng viên năm
      const evaluations = await prisma.partyActivity.findMany({
        where: { activityType: 'EVALUATION', evaluationYear: year, deletedAt: null },
        include: {
          partyMember: {
            include: {
              user: {
                select: {
                  name: true,
                  militaryId: true,
                  rank: true,
                  unitRelation: { select: { name: true } },
                },
              },
            },
          },
        },
        orderBy: { evaluationGrade: 'asc' },
      });

      const gradeOrder = ['XUAT_SAC', 'HOAN_THANH_XUAT_SAC', 'HOAN_THANH_TOT', 'HOAN_THANH', 'KHONG_HOAN_THANH'];
      const byGrade = gradeOrder.reduce((acc, g) => {
        acc[g] = evaluations.filter(e => e.evaluationGrade === g).length;
        return acc;
      }, {} as Record<string, number>);

      return NextResponse.json({
        reportType: 'annual',
        year,
        totalEvaluated: evaluations.length,
        byGrade,
        data: evaluations,
      });
    }

    // Quarterly: thống kê hoạt động theo quý
    const quarters = [1, 2, 3, 4];
    const quarterlyData = await Promise.all(
      quarters.map(async (q) => {
        const startMonth = (q - 1) * 3 + 1;
        const endMonth = q * 3;
        const startDate = new Date(`${year}-${String(startMonth).padStart(2, '0')}-01`);
        const endDate = new Date(`${year}-${String(endMonth).padStart(2, '0')}-${endMonth === 12 ? 31 : 30}`);

        const count = await prisma.partyActivity.count({
          where: {
            activityType: { not: 'EVALUATION' },
            activityDate: { gte: startDate, lte: endDate },
            deletedAt: null,
          },
        });
        return { quarter: q, activityCount: count };
      })
    );

    return NextResponse.json({
      reportType: 'quarterly',
      year,
      data: quarterlyData,
    });
  } catch (error) {
    console.error('[Party Reports GET]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
