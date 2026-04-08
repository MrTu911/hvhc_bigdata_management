/**
 * API: Equipment Maintenance History
 * GET /api/equipment/[id]/history
 * Lịch sử vận hành & bảo trì thiết bị — phục vụ AI Predictive Maintenance (NTK-03, Luồng #16)
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireFunction } from '@/lib/rbac/middleware';
import { LAB } from '@/lib/rbac/function-codes';
import { cached, CACHE_TTL } from '@/lib/cache';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireFunction(request, LAB.VIEW_EQUIPMENT);
    if (!authResult.allowed) {
      return authResult.response!;
    }

    const { id } = params;
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);
    const from = searchParams.get('from'); // ISO date string
    const to = searchParams.get('to');

    const cacheKey = `equipment:history:${id}:${from || ''}:${to || ''}:${limit}`;

    const data = await cached(cacheKey, CACHE_TTL.REALTIME_DATA, async () => {
      // Verify equipment exists
      const equipment = await prisma.labEquipment.findUnique({
        where: { id },
        select: {
          id: true,
          code: true,
          name: true,
          equipmentType: true,
          status: true,
          condition: true,
          brand: true,
          model: true,
          serialNumber: true,
          purchaseDate: true,
          warrantyExpiry: true,
          lastMaintenanceDate: true,
          nextMaintenanceDate: true,
          specifications: true,
          lab: { select: { id: true, name: true, code: true } },
        },
      });

      if (!equipment) return null;

      // Build date filter for maintenance logs
      const dateFilter: any = {};
      if (from) dateFilter.gte = new Date(from);
      if (to) dateFilter.lte = new Date(to);

      const maintenanceLogs = await prisma.equipmentMaintenance.findMany({
        where: {
          equipmentId: id,
          ...(Object.keys(dateFilter).length > 0 ? { performedDate: dateFilter } : {}),
        },
        orderBy: { performedDate: 'desc' },
        take: limit,
        select: {
          id: true,
          maintenanceType: true,
          performedDate: true,
          performedBy: true,
          description: true,
          cost: true,
          findings: true,
          actions: true,
          partsReplaced: true,
          nextScheduled: true,
          status: true,
          createdAt: true,
        },
      });

      // Aggregate statistics for AI Predictive Maintenance
      const totalMaintenances = await prisma.equipmentMaintenance.count({ where: { equipmentId: id } });
      const totalCost = await prisma.equipmentMaintenance.aggregate({
        where: { equipmentId: id },
        _sum: { cost: true },
      });

      const byType = await prisma.equipmentMaintenance.groupBy({
        by: ['maintenanceType'],
        where: { equipmentId: id },
        _count: { id: true },
      });

      // Calculate average days between maintenances (for predictive model)
      let avgDaysBetweenMaintenance: number | null = null;
      if (maintenanceLogs.length >= 2) {
        const sorted = [...maintenanceLogs].sort(
          (a, b) => a.performedDate.getTime() - b.performedDate.getTime()
        );
        let totalDays = 0;
        for (let i = 1; i < sorted.length; i++) {
          totalDays +=
            (sorted[i].performedDate.getTime() - sorted[i - 1].performedDate.getTime()) /
            (1000 * 60 * 60 * 24);
        }
        avgDaysBetweenMaintenance = Math.round(totalDays / (sorted.length - 1));
      }

      // Days since last maintenance
      const daysSinceLastMaintenance = equipment.lastMaintenanceDate
        ? Math.floor(
            (Date.now() - equipment.lastMaintenanceDate.getTime()) / (1000 * 60 * 60 * 24)
          )
        : null;

      // Days until next scheduled maintenance
      const daysUntilNextMaintenance = equipment.nextMaintenanceDate
        ? Math.floor(
            (equipment.nextMaintenanceDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
          )
        : null;

      return {
        equipment,
        history: maintenanceLogs,
        analytics: {
          totalMaintenances,
          totalCost: totalCost._sum.cost ?? 0,
          byType: byType.map(t => ({ type: t.maintenanceType, count: t._count.id })),
          avgDaysBetweenMaintenance,
          daysSinceLastMaintenance,
          daysUntilNextMaintenance,
          maintenanceRisk:
            daysSinceLastMaintenance !== null && avgDaysBetweenMaintenance !== null
              ? daysSinceLastMaintenance > avgDaysBetweenMaintenance * 1.2
                ? 'HIGH'
                : daysSinceLastMaintenance > avgDaysBetweenMaintenance * 0.8
                ? 'MEDIUM'
                : 'LOW'
              : 'UNKNOWN',
        },
      };
    });

    if (!data) {
      return NextResponse.json({ success: false, error: 'Thiết bị không tồn tại' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('[Equipment History GET]', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
