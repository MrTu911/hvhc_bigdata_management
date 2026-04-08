/**
 * API: Thống kê CSDL Quân nhân
 * @version 8.9 - Migrated to function-based RBAC
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireFunction } from '@/lib/rbac/middleware';
import { PERSONNEL } from '@/lib/rbac/function-codes';

export const dynamic = 'force-dynamic';

/**
 * GET - Thống kê CSDL Quân nhân
 * RBAC: PERSONNEL.VIEW_DETAIL
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireFunction(request, PERSONNEL.VIEW_DETAIL);
    if (!authResult.allowed) {
      return authResult.response;
    }

    // Thống kê tổng quan
    const [total, byCategory, byServiceType, allProfiles, byHealthCategory] = await Promise.all([
      prisma.soldierProfile.count(),
      prisma.soldierProfile.groupBy({
        by: ['soldierCategory'],
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } }
      }),
      prisma.soldierProfile.groupBy({
        by: ['serviceType'],
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } }
      }),
      prisma.soldierProfile.findMany({
        include: {
          personnel: {
            select: { unitId: true, unit: { select: { name: true } } }
          }
        }
      }),
      prisma.soldierProfile.groupBy({
        by: ['healthCategory'],
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } }
      })
    ]);

    // Group by unit
    const unitCounts: Record<string, number> = {};
    allProfiles.forEach(s => {
      const unitName = s.personnel?.unit?.name || 'Không xác định';
      unitCounts[unitName] = (unitCounts[unitName] || 0) + 1;
    });

    // Health breakdown by soldier category
    const healthByCategoryMap: Record<string, Record<string, number>> = {};
    allProfiles.forEach(s => {
      const cat = s.soldierCategory || 'Chưa xác định';
      const health = s.healthCategory || 'Chưa kiểm tra';
      if (!healthByCategoryMap[cat]) healthByCategoryMap[cat] = {};
      healthByCategoryMap[cat][health] = (healthByCategoryMap[cat][health] || 0) + 1;
    });

    const healthByCategory = Object.entries(healthByCategoryMap).map(([category, health]) => ({
      category,
      ...health
    }));

    // Soldiers needing follow-up (Loại 4)
    const needsFollowUp = allProfiles.filter(s => s.healthCategory === 'Loại 4').length;

    // Last health check stats
    const checkedCount = allProfiles.filter(s => s.lastHealthCheckDate !== null).length;
    const recentChecks = allProfiles
      .filter(s => s.lastHealthCheckDate !== null)
      .sort((a, b) => new Date(b.lastHealthCheckDate!).getTime() - new Date(a.lastHealthCheckDate!).getTime())
      .slice(0, 5)
      .map(s => ({
        name: s.personnel?.unit?.name || 'N/A',
        healthCategory: s.healthCategory,
        lastHealthCheckDate: s.lastHealthCheckDate
      }));

    return NextResponse.json({
      success: true,
      data: {
        total,
        byCategory: byCategory.map(c => ({
          category: c.soldierCategory || 'Chưa xác định',
          count: c._count.id
        })),
        byServiceType: byServiceType.map(s => ({
          serviceType: s.serviceType || 'Chưa xác định',
          count: s._count.id
        })),
        byUnit: Object.entries(unitCounts).map(([name, count]) => ({ name, count })).slice(0, 10),
        health: {
          byCategory: byHealthCategory.map(h => ({
            healthCategory: h.healthCategory || 'Chưa kiểm tra',
            count: h._count.id
          })),
          byUnitCategory: healthByCategory,
          needsFollowUp,
          checkedCount,
          recentChecks
        }
      }
    });
  } catch (error) {
    console.error('Error fetching soldier stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
