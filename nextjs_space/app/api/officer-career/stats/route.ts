/**
 * API: Thống kê CSDL Cán bộ (kèm sức khỏe)
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireFunction } from '@/lib/rbac/middleware';
import { PERSONNEL } from '@/lib/rbac/function-codes';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireFunction(request, PERSONNEL.VIEW);
    if (!authResult.allowed) {
      return NextResponse.json({ error: authResult.authResult?.deniedReason || 'Forbidden' }, { status: 403 });
    }

    const [total, byRank, byUnitRaw, recentPromotions, allForHealth] = await Promise.all([
      prisma.officerCareer.count(),
      prisma.officerCareer.groupBy({
        by: ['currentRank'],
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
      }),
      prisma.officerCareer.findMany({
        include: { personnel: { select: { unitId: true, unit: { select: { name: true } } } } },
      }),
      prisma.officerPromotion.findMany({
        take: 10,
        orderBy: { effectiveDate: 'desc' },
        include: {
          officerCareer: {
            include: { personnel: { select: { fullName: true, personnelCode: true } } },
          },
        },
      }),
      // Fetch all officers for health aggregation
      prisma.officerCareer.findMany({
        select: {
          healthCategory: true,
          lastHealthCheckDate: true,
          currentRank: true,
        },
      }),
    ]);

    // Group by unit
    const unitCounts: Record<string, number> = {};
    byUnitRaw.forEach(o => {
      const unitName = o.personnel?.unit?.name || 'Không xác định';
      unitCounts[unitName] = (unitCounts[unitName] || 0) + 1;
    });

    // ── Health stats ─────────────────────────────────────────────────────────
    const healthCategories = ['Loại 1', 'Loại 2', 'Loại 3', 'Loại 4'];
    const healthMap: Record<string, number> = {};
    let checkedCount = 0;

    for (const o of allForHealth) {
      const hc = o.healthCategory || 'Chưa kiểm tra';
      healthMap[hc] = (healthMap[hc] || 0) + 1;
      if (o.lastHealthCheckDate) checkedCount++;
    }

    const byHealthCategory = [
      ...healthCategories.map(cat => ({
        healthCategory: cat,
        count: healthMap[cat] || 0,
      })),
      { healthCategory: 'Chưa kiểm tra', count: healthMap['Chưa kiểm tra'] || 0 },
    ];

    // Health by rank group
    const rankGroups = [
      { group: 'Cấp tướng', ranks: ['DAI_TUONG', 'THUONG_TUONG', 'TRUNG_TUONG', 'THIEU_TUONG'] },
      { group: 'Cấp tá',   ranks: ['DAI_TA', 'THUONG_TA', 'TRUNG_TA', 'THIEU_TA'] },
      { group: 'Cấp úy',   ranks: ['DAI_UY', 'THUONG_UY', 'TRUNG_UY', 'THIEU_UY'] },
    ];

    const byRankGroup: Array<Record<string, string | number>> = rankGroups.map(({ group, ranks }) => {
      const row: Record<string, string | number> = { group };
      for (const cat of healthCategories) {
        row[cat] = allForHealth.filter(
          o => ranks.includes(o.currentRank || '') && (o.healthCategory || '') === cat,
        ).length;
      }
      return row;
    });

    // Recent health checks
    const recentChecks = allForHealth
      .filter(o => o.lastHealthCheckDate)
      .sort((a, b) =>
        new Date(b.lastHealthCheckDate!).getTime() - new Date(a.lastHealthCheckDate!).getTime(),
      )
      .slice(0, 5);

    return NextResponse.json({
      success: true,
      data: {
        total,
        byRank: byRank.map(r => ({ rank: r.currentRank || 'Chưa xác định', count: r._count.id })),
        byUnit: Object.entries(unitCounts)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10),
        recentPromotions: recentPromotions.map(p => ({
          id: p.id,
          officerName: p.officerCareer?.personnel?.fullName,
          promotionType: p.promotionType,
          effectiveDate: p.effectiveDate,
          newRank: p.newRank,
          newPosition: p.newPosition,
        })),
        health: {
          byCategory: byHealthCategory,
          byRankGroup,
          needsFollowUp: healthMap['Loại 4'] || 0,
          checkedCount,
          recentChecks,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching officer stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
