import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireFunction } from '@/lib/rbac/middleware';
import { DASHBOARD } from '@/lib/rbac/function-codes';
import { cached, CACHE_TTL, dashboardCacheKey } from '@/lib/cache';
import { logAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

// GET dashboard statistics
export async function GET(request: NextRequest) {
  try {
    // Check authorization using Function-based RBAC
    const authResult = await requireFunction(request, DASHBOARD.VIEW);
    if (!authResult.allowed) {
      return authResult.response!;
    }

    const user = authResult.user!;
    const cacheKey = dashboardCacheKey(user.id, 'stats');

    const stats = await cached(cacheKey, CACHE_TTL.DASHBOARD_DATA, async () => {
      // Get service stats
      const [totalServices, healthyServices, degradedServices, downServices] = await Promise.all([
        prisma.bigDataService.count({ where: { isActive: true } }),
        prisma.bigDataService.count({ where: { status: 'HEALTHY', isActive: true } }),
        prisma.bigDataService.count({ where: { status: 'DEGRADED', isActive: true } }),
        prisma.bigDataService.count({ where: { status: 'DOWN', isActive: true } }),
      ]);

      // Get user stats
      const [totalUsers, activeUsers, usersByRole] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { status: 'ACTIVE' } }),
        prisma.user.groupBy({
          by: ['role'],
          _count: { role: true },
        }),
      ]);

      const roleStats = usersByRole.reduce((acc: any, item: any) => {
        acc[item.role] = item._count.role;
        return acc;
      }, {} as Record<string, number>);

      // Get alert stats
      const [activeAlerts, criticalAlerts, warningAlerts] = await Promise.all([
        prisma.serviceAlert.count({ where: { status: 'ACTIVE' } }),
        prisma.serviceAlert.count({ where: { severity: 'CRITICAL', status: 'ACTIVE' } }),
        prisma.serviceAlert.count({ where: { severity: 'WARNING', status: 'ACTIVE' } }),
      ]);

      // Get recent logs
      const recentLogs = await prisma.systemLog.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      });

      // Mock system health (in production, get from Prometheus)
      const systemHealth = {
        cpuUsage: Math.random() * 60 + 20, // 20-80%
        memoryUsage: Math.random() * 50 + 30, // 30-80%
        diskUsage: Math.random() * 40 + 40, // 40-80%
      };

      return {
        services: {
          total: totalServices,
          healthy: healthyServices,
          degraded: degradedServices,
          down: downServices,
        },
        users: {
          total: totalUsers,
          active: activeUsers,
          byRole: roleStats,
        },
        alerts: {
          active: activeAlerts,
          critical: criticalAlerts,
          warning: warningAlerts,
        },
        systemHealth,
        recentLogs: recentLogs.map((log: any) => ({
          id: log.id,
          level: log.level,
          category: log.category,
          action: log.action,
          description: log.description,
          userName: log.user?.name,
          userEmail: log.user?.email,
          createdAt: log.createdAt,
        })),
      };
    });

    await logAudit({
      userId: user.id,
      functionCode: DASHBOARD.VIEW,
      action: 'VIEW',
      resourceType: 'DASHBOARD_STATS',
      result: 'SUCCESS',
    });

    return NextResponse.json({ success: true, data: stats });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
