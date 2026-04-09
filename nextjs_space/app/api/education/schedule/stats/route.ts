/**
 * GET /api/education/schedule/stats?termId=...
 *
 * Statistics for the schedule page KPI section.
 * Scoped to a term when termId is provided, otherwise uses the current term.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireFunction } from '@/lib/rbac/middleware';
import { EDUCATION } from '@/lib/rbac/function-codes';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const auth = await requireFunction(req, EDUCATION.VIEW_CLASS_SECTION);
  if (!auth.allowed) return auth.response!;

  try {
    const { searchParams } = new URL(req.url);
    let termId = searchParams.get('termId');

    // Fall back to current term when no termId supplied
    if (!termId) {
      const current = await prisma.term.findFirst({ where: { isCurrent: true }, select: { id: true } });
      termId = current?.id ?? null;
    }

    const termFilter = termId ? { termId } : {};

    const [sectionStatusCounts, sessionStatusCounts, roomsInUse, totalRooms] = await Promise.all([
      prisma.classSection.groupBy({
        by: ['status'],
        where: { isActive: true, ...termFilter },
        _count: { _all: true },
      }),

      prisma.trainingSession.groupBy({
        by: ['status'],
        where: termFilter,
        _count: { _all: true },
      }),

      termId
        ? prisma.classSection.findMany({
            where: { isActive: true, termId, roomId: { not: null } },
            select: { roomId: true },
            distinct: ['roomId'],
          })
        : Promise.resolve([]),

      prisma.room.count({ where: { isActive: true } }),
    ]);

    const byStatus: Record<string, number> = {};
    for (const row of sectionStatusCounts) {
      byStatus[row.status] = row._count._all;
    }

    const bySessionStatus: Record<string, number> = {};
    for (const row of sessionStatusCounts) {
      bySessionStatus[row.status] = row._count._all;
    }

    const totalSections = Object.values(byStatus).reduce((s, c) => s + c, 0);
    const activeSections = (byStatus['OPEN'] ?? 0) + (byStatus['IN_PROGRESS'] ?? 0);
    const totalSessions = Object.values(bySessionStatus).reduce((s, c) => s + c, 0);
    const completedSessions = bySessionStatus['COMPLETED'] ?? 0;
    const scheduledSessions = bySessionStatus['SCHEDULED'] ?? 0;

    return NextResponse.json({
      success: true,
      data: {
        totalSections,
        activeSections,
        totalSessions,
        completedSessions,
        scheduledSessions,
        byStatus,
        bySessionStatus,
        roomUtilization: {
          total: totalRooms,
          inUse: roomsInUse.length,
          utilizationRate: totalRooms > 0 ? Math.round((roomsInUse.length / totalRooms) * 100) : 0,
        },
      },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('GET /api/education/schedule/stats error:', error);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
