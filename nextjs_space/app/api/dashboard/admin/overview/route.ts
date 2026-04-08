import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { logAudit } from '@/lib/audit';
import { requireFunction } from '@/lib/rbac/middleware';
import { DASHBOARD } from '@/lib/rbac/function-codes';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Check authorization using Function-based RBAC
    const authResult = await requireFunction(request, DASHBOARD.VIEW_ADMIN);
    if (!authResult.allowed) {
      return authResult.response!;
    }
    const user = authResult.user!;

    // Get real data from database
    const [
      totalUsers,
      activeUsers,
      totalServices,
      healthyServices,
      totalStorage,
      dailyRequests
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { status: 'ACTIVE' } }),
      prisma.bigDataService.count(),
      prisma.bigDataService.count({ where: { status: 'HEALTHY' } }),
      prisma.dataQuery.aggregate({
        _sum: { dataSize: true }
      }),
      prisma.systemLog.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        }
      })
    ]);

    // Convert storage to TB (assuming dataSize is in GB)
    const storageTB = totalStorage._sum?.dataSize 
      ? Number((totalStorage._sum.dataSize / 1024).toFixed(2))
      : 0;

    const overview = {
      totalUsers,
      activeUsers,
      totalServices,
      healthyServices,
      totalStorage: storageTB,
      dailyRequests
    };

    // Audit log
    await logAudit({
      userId: user.id,
      functionCode: DASHBOARD.VIEW_ADMIN,
      action: 'VIEW',
      resourceType: 'ADMIN_DASHBOARD',
      result: 'SUCCESS',
    });

    return NextResponse.json({ overview });
  } catch (error) {
    console.error('Error fetching admin overview:', error);
    return NextResponse.json(
      { error: 'Failed to fetch overview' },
      { status: 500 }
    );
  }
}
