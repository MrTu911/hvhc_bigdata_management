/**
 * API: Awards Stats - Thống kê thi đua
 * Path: /api/awards/stats
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireFunction } from '@/lib/rbac/middleware';
import { AWARDS } from '@/lib/rbac/function-codes';
import prisma from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireFunction(request, AWARDS.VIEW);
    if (!authResult.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : new Date().getFullYear();

    const yearFilter = {
      decisionDate: {
        gte: new Date(`${year}-01-01`),
        lt: new Date(`${year + 1}-01-01`),
      },
    };

    const [
      totalAwards,
      totalDisciplines,
      byLevel,
      byWorkflowStatus,
      monthlyTrend,
    ] = await Promise.all([
      prisma.policyRecord.count({ where: { deletedAt: null, recordType: { in: ['REWARD', 'EMULATION'] }, ...yearFilter } }),
      prisma.policyRecord.count({ where: { deletedAt: null, recordType: 'DISCIPLINE', ...yearFilter } }),
      prisma.policyRecord.groupBy({
        by: ['level'],
        where: { deletedAt: null, recordType: { in: ['REWARD', 'EMULATION'] }, ...yearFilter },
        _count: { id: true },
      }),
      prisma.policyRecord.groupBy({
        by: ['workflowStatus'],
        where: { deletedAt: null, recordType: { in: ['REWARD', 'EMULATION'] } },
        _count: { id: true },
      }),
      // Monthly trend (12 months of year)
      Promise.all(
        Array.from({ length: 12 }, (_, i) => {
          const month = i + 1;
          const startDate = new Date(`${year}-${String(month).padStart(2, '0')}-01`);
          const endDate = new Date(year, month, 1);
          return prisma.policyRecord.count({
            where: {
              deletedAt: null,
              recordType: { in: ['REWARD', 'EMULATION', 'DISCIPLINE'] },
              decisionDate: { gte: startDate, lt: endDate },
            },
          }).then(count => ({ month, count }));
        })
      ),
    ]);

    return NextResponse.json({
      year,
      overview: { totalAwards, totalDisciplines, ratio: totalDisciplines > 0 ? (totalAwards / totalDisciplines).toFixed(2) : 'N/A' },
      byLevel: byLevel.reduce((acc, s) => { acc[s.level] = s._count.id; return acc; }, {} as Record<string, number>),
      byWorkflowStatus: byWorkflowStatus.reduce((acc, s) => { acc[s.workflowStatus] = s._count.id; return acc; }, {} as Record<string, number>),
      monthlyTrend,
    });
  } catch (error) {
    console.error('[Awards Stats GET]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
