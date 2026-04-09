/**
 * M10 – UC-59: Thesis Statistics
 * GET /api/education/thesis/stats
 *
 * Returns:
 * - counts by status (DRAFT, IN_PROGRESS, DEFENDED, ARCHIVED)
 * - counts by thesis type
 * - average defense score (defended theses only)
 * - top advisors by thesis count
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireFunction } from '@/lib/rbac/middleware';
import { EDUCATION } from '@/lib/rbac/function-codes';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const auth = await requireFunction(req, EDUCATION.VIEW_THESIS);
    if (!auth.allowed) return auth.response!;

    const [statusCounts, typeCounts, defenseStats, advisorCounts] = await Promise.all([
      // Count by status
      prisma.thesisProject.groupBy({
        by: ['status'],
        _count: { _all: true },
      }),

      // Count by thesis type
      prisma.thesisProject.groupBy({
        by: ['thesisType'],
        _count: { _all: true },
      }),

      // Avg defense score for DEFENDED theses
      prisma.thesisProject.aggregate({
        where: { status: 'DEFENDED', defenseScore: { not: null } },
        _avg: { defenseScore: true },
        _count: { defenseScore: true },
      }),

      // Top advisors by number of theses supervised
      prisma.thesisProject.groupBy({
        by: ['advisorId'],
        where: { advisorId: { not: null } },
        _count: { _all: true },
        orderBy: { _count: { advisorId: 'desc' } },
        take: 5,
      }),
    ]);

    // Resolve advisor names
    const advisorIds = advisorCounts
      .map(a => a.advisorId)
      .filter((id): id is string => id !== null);

    const advisorProfiles = advisorIds.length > 0
      ? await prisma.facultyProfile.findMany({
          where: { id: { in: advisorIds } },
          select: { id: true, user: { select: { name: true } } },
        })
      : [];

    const advisorMap = Object.fromEntries(advisorProfiles.map(p => [p.id, p.user?.name ?? 'Không rõ']));

    const byStatus: Record<string, number> = {
      DRAFT: 0,
      IN_PROGRESS: 0,
      DEFENDED: 0,
      ARCHIVED: 0,
    };
    for (const row of statusCounts) {
      byStatus[row.status] = row._count._all;
    }

    const byType: Record<string, number> = {};
    for (const row of typeCounts) {
      byType[row.thesisType] = row._count._all;
    }

    const topAdvisors = advisorCounts.map(a => ({
      advisorId: a.advisorId,
      name: a.advisorId ? advisorMap[a.advisorId] ?? 'Không rõ' : '—',
      count: a._count._all,
    }));

    return NextResponse.json({
      success: true,
      data: {
        total: Object.values(byStatus).reduce((s, c) => s + c, 0),
        byStatus,
        byType,
        avgDefenseScore: defenseStats._avg.defenseScore
          ? parseFloat(defenseStats._avg.defenseScore.toFixed(2))
          : null,
        defendedWithScore: defenseStats._count.defenseScore,
        topAdvisors,
      },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('GET /api/education/thesis/stats error:', error);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
