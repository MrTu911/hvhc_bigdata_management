/**
 * API: Party Member Stats
 * GET /api/personnel/party-member/stats - Thống kê Đảng viên
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireFunction } from '@/lib/rbac/middleware';
import { PARTY } from '@/lib/rbac/function-codes';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireFunction(request, PARTY.VIEW);
    if (!authResult.allowed) {
      return NextResponse.json({ error: authResult.authResult?.deniedReason || 'Không có quyền' || 'Forbidden' }, { status: 403 });
    }

    // Tổng số Đảng viên
    const total = await prisma.partyMember.count({ where: { deletedAt: null } });

    // Thống kê theo trạng thái
    const byStatusRaw = await prisma.partyMember.groupBy({
      by: ['status'],
      where: { deletedAt: null },
      _count: { id: true },
    });

    // Parse status counts
    const statusCounts: Record<string, number> = {};
    byStatusRaw.forEach(s => {
      statusCounts[s.status] = s._count.id;
    });

    const active = statusCounts['ACTIVE'] || 0;
    const transferred = statusCounts['TRANSFERRED'] || 0;
    const suspended = statusCounts['SUSPENDED'] || 0;
    const expelled = statusCounts['EXPELLED'] || 0;

    // Thống kê theo đơn vị (chi bộ)
    const partyMembers = await prisma.partyMember.findMany({
      where: { deletedAt: null },
      include: {
        user: {
          include: {
            unitRelation: true,
          },
        },
      },
    });

    // Thống kê theo Chi bộ (partyCell)
    const byCell: Record<string, number> = {};
    partyMembers.forEach(pm => {
      const cellName = pm.partyCell || pm.user?.unitRelation?.name || 'Chưa phân chi bộ';
      byCell[cellName] = (byCell[cellName] || 0) + 1;
    });

    // Thống kê theo năm kết nạp
    const byYear: Record<string, number> = {};
    partyMembers.forEach(pm => {
      if (pm.joinDate) {
        const year = new Date(pm.joinDate).getFullYear().toString();
        byYear[year] = (byYear[year] || 0) + 1;
      }
    });

    // Đảng viên mới trong năm (kết nạp)
    const currentYear = new Date().getFullYear();
    const newThisYear = partyMembers.filter(pm => 
      pm.joinDate && new Date(pm.joinDate).getFullYear() === currentYear
    ).length;

    // Đảng viên chính thức trong năm
    const officialThisYear = partyMembers.filter(pm =>
      pm.officialDate && new Date(pm.officialDate).getFullYear() === currentYear
    ).length;

    // Hoạt động gần đây
    const recentActivities = await prisma.partyActivity.findMany({
      where: { deletedAt: null },
      include: {
        partyMember: {
          include: { user: { select: { name: true } } },
        },
      },
      orderBy: { activityDate: 'desc' },
      take: 5,
    });

    return NextResponse.json({
      total,
      active,
      transferred,
      suspended,
      expelled,
      newThisYear,
      officialThisYear,
      byStatus: byStatusRaw.map(s => ({
        status: s.status,
        count: s._count.id,
      })),
      byCell: Object.entries(byCell)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 6),
      byYear: Object.entries(byYear)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .slice(-6)
        .map(([year, count]) => ({ year, count })),
      recentActivities: recentActivities.map(a => ({
        id: a.id,
        type: a.activityType,
        description: (a as any).content || a.activityType,
        date: a.activityDate?.toISOString() || '',
        memberName: a.partyMember?.user?.name || '',
      })),
    });
  } catch (error) {
    console.error('Party member stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
