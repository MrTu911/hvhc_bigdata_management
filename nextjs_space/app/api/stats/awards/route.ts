/**
 * API Thống kê CSDL Khen thưởng — v8.9 fix: dùng AwardsRecord đúng model
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireScopedFunction } from '@/lib/rbac/middleware';
import { AWARDS } from '@/lib/rbac/function-codes';
import prisma from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const authResult = await requireScopedFunction(req, AWARDS.VIEW);
    if (!authResult.allowed) return authResult.response!;

    const [awards, units] = await Promise.all([
      prisma.awardsRecord.findMany({
        select: { id: true, type: true, category: true, year: true, userId: true, createdAt: true },
      }),
      prisma.unit.findMany({ select: { id: true, name: true } }),
    ]);

    const userIds = [...new Set(awards.map(a => a.userId))];
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, unitId: true },
    });
    const userUnitMap = new Map(users.map(u => [u.id, u.unitId]));
    const unitMap = new Map(units.map(u => [u.id, u.name]));

    const currentYear = new Date().getFullYear();
    const total = awards.length;
    // Use most recent year that has data (falls back gracefully if data doesn't reach current year)
    const maxDataYear = awards.reduce((max, a) => Math.max(max, a.year ?? 0), 0);
    const refYear = maxDataYear >= currentYear ? currentYear : maxDataYear;
    const thisYear = awards.filter(a => a.year === refYear).length;

    // By category (type label)
    const typeCountMap = new Map<string, number>();
    awards.forEach(a => {
      const label = a.category || (a.type === 'KHEN_THUONG' ? 'Khen thưởng' : 'Kỷ luật');
      typeCountMap.set(label, (typeCountMap.get(label) || 0) + 1);
    });
    const byType = Array.from(typeCountMap.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    // By unit
    const unitCountMap = new Map<string, number>();
    awards.forEach(a => {
      const unitId = userUnitMap.get(a.userId);
      const unitName = unitId ? unitMap.get(unitId) || 'Chưa xác định' : 'Chưa xác định';
      unitCountMap.set(unitName, (unitCountMap.get(unitName) || 0) + 1);
    });
    const byUnit = Array.from(unitCountMap.entries())
      .map(([unit, count]) => ({ unit, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return NextResponse.json({ total, thisYear, byType, byUnit });
  } catch (error) {
    console.error('Awards stats error:', error);
    return NextResponse.json({ error: 'Lỗi lấy thống kê khen thưởng' }, { status: 500 });
  }
}
