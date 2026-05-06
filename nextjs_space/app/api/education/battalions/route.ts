/**
 * GET /api/education/battalions
 * Danh sách Tiểu đoàn đào tạo kèm stats học viên, cảnh báo, GPA trung bình.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAnyFunction } from '@/lib/rbac/middleware';
import { EDUCATION } from '@/lib/rbac/function-codes';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAnyFunction(req, [
      EDUCATION.VIEW_BATTALION,
      EDUCATION.VIEW_STUDENT,
      EDUCATION.VIEW_TRAINING_SYSTEM,
    ]);
    if (!auth.allowed) return auth.response!;

    const battalions = await prisma.unit.findMany({
      where: { type: 'TIEUDOAN', active: true },
      orderBy: { code: 'asc' },
      select: {
        id: true,
        code: true,
        name: true,
        parent: { select: { id: true, code: true, name: true } },
        commander: { select: { id: true, name: true } },
      },
    });

    if (battalions.length === 0) {
      return NextResponse.json({ success: true, data: [] });
    }

    const battalionIds = battalions.map((b) => b.id);

    const [totalCounts, activeCounts, gpaAggs] = await Promise.all([
      prisma.hocVien.groupBy({
        by: ['battalionUnitId'],
        _count: { id: true },
        where: { deletedAt: null, battalionUnitId: { in: battalionIds } },
      }),
      prisma.hocVien.groupBy({
        by: ['battalionUnitId'],
        _count: { id: true },
        where: { deletedAt: null, currentStatus: 'ACTIVE', battalionUnitId: { in: battalionIds } },
      }),
      prisma.hocVien.groupBy({
        by: ['battalionUnitId'],
        _avg: { diemTrungBinh: true },
        where: { deletedAt: null, battalionUnitId: { in: battalionIds }, diemTrungBinh: { gt: 0 } },
      }),
    ]);

    // Cảnh báo theo tiểu đoàn — join qua hocVien
    const warningRows = await prisma.academicWarning.findMany({
      where: {
        isResolved: false,
        hocVien: { deletedAt: null, battalionUnitId: { in: battalionIds } },
      },
      select: {
        warningLevel: true,
        hocVien: { select: { battalionUnitId: true } },
      },
    });

    const warningByBattalion: Record<string, number> = {};
    const criticalByBattalion: Record<string, number> = {};
    for (const w of warningRows) {
      const bid = w.hocVien?.battalionUnitId;
      if (!bid) continue;
      warningByBattalion[bid] = (warningByBattalion[bid] ?? 0) + 1;
      if (w.warningLevel === 'CRITICAL') {
        criticalByBattalion[bid] = (criticalByBattalion[bid] ?? 0) + 1;
      }
    }

    const data = battalions.map((b) => {
      const total  = totalCounts.find((c) => c.battalionUnitId === b.id)?._count?.id ?? 0;
      const active = activeCounts.find((c) => c.battalionUnitId === b.id)?._count?.id ?? 0;
      const avgGpa = gpaAggs.find((g) => g.battalionUnitId === b.id)?._avg?.diemTrungBinh ?? null;
      return {
        id: b.id,
        code: b.code,
        name: b.name,
        parent: b.parent,
        commander: b.commander,
        totalStudents:    total,
        activeStudents:   active,
        warningCount:     warningByBattalion[b.id]  ?? 0,
        criticalWarnings: criticalByBattalion[b.id] ?? 0,
        avgGpa:    avgGpa ? Math.round(avgGpa * 100) / 100 : null,
        activeRate: total > 0 ? Math.round((active / total) * 100) : 0,
      };
    });

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('GET /api/education/battalions error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
