/**
 * API Thống kê CSDL Đảng viên
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireScopedFunction } from '@/lib/rbac/middleware';
import { PARTY } from '@/lib/rbac/function-codes';
import prisma from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const authResult = await requireScopedFunction(req, PARTY.VIEW);
    if (!authResult.allowed) {
      return authResult.response!;
    }

    // Lấy danh sách đảng viên
    const partyMembers = await prisma.partyMember.findMany({
      include: {
        user: {
          select: {
            name: true,
            unitId: true,
          }
        }
      }
    });

    // Lấy units
    const units = await prisma.unit.findMany({
      select: { id: true, name: true }
    });
    const unitMap = new Map(units.map(u => [u.id, u.name]));

    const total = partyMembers.length;
    
    // Phân loại theo ngày chính thức (có officialDate = chính thức)
    const official = partyMembers.filter(p => p.officialDate !== null).length;
    const probationary = partyMembers.filter(p => p.officialDate === null).length;

    // Group by unit
    const unitCountMap = new Map<string, number>();
    partyMembers.forEach(p => {
      const unitName = p.user?.unitId ? unitMap.get(p.user.unitId) || 'Chưa xác định' : 'Chưa xác định';
      unitCountMap.set(unitName, (unitCountMap.get(unitName) || 0) + 1);
    });
    const byUnit = Array.from(unitCountMap.entries())
      .map(([unit, count]) => ({ unit, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Growth by year
    const yearCountMap = new Map<number, number>();
    partyMembers.forEach(p => {
      if (p.joinDate) {
        const year = new Date(p.joinDate).getFullYear();
        yearCountMap.set(year, (yearCountMap.get(year) || 0) + 1);
      }
    });
    const growth = Array.from(yearCountMap.entries())
      .map(([year, count]) => ({ year, count }))
      .sort((a, b) => a.year - b.year)
      .slice(-5);

    return NextResponse.json({
      total,
      official,
      probationary,
      byUnit,
      growth,
    });
  } catch (error) {
    console.error('Party stats error:', error);
    return NextResponse.json(
      { error: 'Lỗi lấy thống kê đảng viên' },
      { status: 500 }
    );
  }
}
