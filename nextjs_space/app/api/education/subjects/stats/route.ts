/**
 * GET /api/education/subjects/stats
 *
 * Returns aggregate statistics for the subjects page KPI cards:
 * - total active subjects
 * - total credits across all active subjects
 * - count by courseType
 * - count by unit (top N)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireFunction } from '@/lib/rbac/middleware';
import { TRAINING } from '@/lib/rbac/function-codes';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const auth = await requireFunction(req, TRAINING.VIEW_COURSE);
  if (!auth.allowed) return auth.response!;

  try {
    const [typeCounts, creditAgg, unitCounts] = await Promise.all([
      // Count by courseType
      prisma.curriculumCourse.groupBy({
        by: ['courseType'],
        where: { isActive: true },
        _count: { _all: true },
      }),

      // Sum of credits
      prisma.curriculumCourse.aggregate({
        where: { isActive: true },
        _count: { _all: true },
        _sum: { credits: true },
      }),

      // Count by program → unit (top 8 units by subject count)
      prisma.curriculumCourse.groupBy({
        by: ['curriculumPlanId'],
        where: { isActive: true },
        _count: { _all: true },
        orderBy: { _count: { curriculumPlanId: 'desc' } },
        take: 20,
      }),
    ]);

    // Resolve unit names via curriculumPlanId → CurriculumPlan → Program → Unit
    const planIds = unitCounts.map(r => r.curriculumPlanId);
    const plans = planIds.length > 0
      ? await prisma.curriculumPlan.findMany({
          where: { id: { in: planIds } },
          select: {
            id: true,
            program: {
              select: {
                unit: { select: { id: true, name: true, code: true } },
              },
            },
          },
        })
      : [];

    // Aggregate by unit (multiple plans may share the same unit)
    const unitMap: Record<string, { name: string; code: string; count: number }> = {};
    for (const planRow of unitCounts) {
      const plan = plans.find(p => p.id === planRow.curriculumPlanId);
      const unit = plan?.program?.unit;
      if (!unit) continue;
      if (!unitMap[unit.id]) {
        unitMap[unit.id] = { name: unit.name, code: unit.code, count: 0 };
      }
      unitMap[unit.id].count += planRow._count._all;
    }

    const byUnit = Object.entries(unitMap)
      .map(([id, v]) => ({ unitId: id, ...v }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    const byType: Record<string, number> = {};
    for (const row of typeCounts) {
      byType[row.courseType ?? 'UNKNOWN'] = row._count._all;
    }

    return NextResponse.json({
      success: true,
      data: {
        total: creditAgg._count._all,
        totalCredits: creditAgg._sum.credits ?? 0,
        byType,
        byUnit,
      },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('GET /api/education/subjects/stats error:', error);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
