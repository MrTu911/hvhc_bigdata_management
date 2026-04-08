import { NextRequest, NextResponse } from 'next/server';
import { requireAnyFunction } from '@/lib/rbac/middleware';
import { PARTY } from '@/lib/rbac/function-codes';
import { logAudit } from '@/lib/audit';
import prisma from '@/lib/db';

type ReportType = 'annual' | 'quarterly' | 'membership';

async function buildPartyReportPayload(reportType: ReportType, year: number) {
  if (reportType === 'membership') {
    const membersByUnit = await prisma.user.groupBy({
      by: ['unitId'],
      where: {
        partyMember: { deletedAt: null },
      },
      _count: { id: true },
    });

    const units = await prisma.unit.findMany({
      where: { id: { in: membersByUnit.map((m) => m.unitId).filter(Boolean) as string[] } },
      select: { id: true, name: true, code: true },
    });

    const unitMap = units.reduce((acc, u) => {
      acc[u.id] = u;
      return acc;
    }, {} as Record<string, { id: string; name: string; code: string }>);

    return {
      reportType,
      year,
      data: membersByUnit.map((m) => ({
        unit: m.unitId ? unitMap[m.unitId] : null,
        memberCount: m._count.id,
      })),
    };
  }

  if (reportType === 'annual') {
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
      acc[g] = evaluations.filter((e) => e.evaluationGrade === g).length;
      return acc;
    }, {} as Record<string, number>);

    return {
      reportType,
      year,
      totalEvaluated: evaluations.length,
      byGrade,
      data: evaluations,
    };
  }

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
    }),
  );

  return {
    reportType,
    year,
    data: quarterlyData,
  };
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAnyFunction(request, [PARTY.EXPORT_REPORT, PARTY.VIEW_REPORT, PARTY.VIEW]);
    if (!authResult.allowed) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const user = authResult.user!;

    const body = await request.json().catch(() => ({}));
    const reportType: ReportType = body?.type ?? 'annual';
    const year = Number(body?.year || new Date().getFullYear());

    if (!['annual', 'quarterly', 'membership'].includes(reportType)) {
      return NextResponse.json({ error: 'type không hợp lệ' }, { status: 400 });
    }

    const payload = await buildPartyReportPayload(reportType, year);

    await logAudit({
      userId: user.id,
      functionCode: PARTY.EXPORT_REPORT,
      action: 'EXPORT',
      resourceType: 'PARTY_REPORT',
      result: 'SUCCESS',
      metadata: { type: reportType, year },
    });

    const fileName = `party-report-${reportType}-${year}.json`;
    return new NextResponse(JSON.stringify(payload, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    console.error('[Party Reports Export POST]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
