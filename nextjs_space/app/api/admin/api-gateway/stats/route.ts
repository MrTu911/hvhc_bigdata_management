import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireFunction } from '@/lib/rbac/middleware';
import { SYSTEM } from '@/lib/rbac/function-codes';

export async function GET(request: NextRequest) {
  try {
    // RBAC: Require MANAGE_API_GATEWAY permission
    const authResult = await requireFunction(request, SYSTEM.MANAGE_API_GATEWAY);
    if (!authResult.allowed) {
      return authResult.response!;
    }

    const now = new Date();
    const today = new Date(now.setHours(0, 0, 0, 0));
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Key statistics
    const [totalKeys, activeKeys, suspendedKeys, revokedKeys] = await Promise.all([
      prisma.externalApiKey.count(),
      prisma.externalApiKey.count({ where: { status: 'ACTIVE' } }),
      prisma.externalApiKey.count({ where: { status: 'SUSPENDED' } }),
      prisma.externalApiKey.count({ where: { status: 'REVOKED' } }),
    ]);

    // Request statistics
    const [todayRequests, weekRequests, monthRequests, totalRequests] = await Promise.all([
      prisma.externalApiLog.count({ where: { createdAt: { gte: today } } }),
      prisma.externalApiLog.count({ where: { createdAt: { gte: last7Days } } }),
      prisma.externalApiLog.count({ where: { createdAt: { gte: last30Days } } }),
      prisma.externalApiLog.count(),
    ]);

    // Error rate
    const errorRequests = await prisma.externalApiLog.count({
      where: {
        createdAt: { gte: last7Days },
        statusCode: { gte: 400 }
      }
    });
    const errorRate = weekRequests > 0 ? ((errorRequests / weekRequests) * 100).toFixed(2) : 0;

    // Average response time
    const avgResponse = await prisma.externalApiLog.aggregate({
      where: { createdAt: { gte: last7Days } },
      _avg: { responseTime: true },
    });

    // Top endpoints
    const topEndpoints = await prisma.externalApiLog.groupBy({
      by: ['endpoint'],
      where: { createdAt: { gte: last7Days } },
      _count: true,
      orderBy: { _count: { endpoint: 'desc' } },
      take: 10,
    });

    // Top API keys by usage
    const topApiKeys = await prisma.externalApiLog.groupBy({
      by: ['apiKeyId'],
      where: { createdAt: { gte: last7Days } },
      _count: true,
      orderBy: { _count: { apiKeyId: 'desc' } },
      take: 5,
    });

    // Get key names
    const keyIds = topApiKeys.map(k => k.apiKeyId);
    const keys = await prisma.externalApiKey.findMany({
      where: { id: { in: keyIds } },
      select: { id: true, name: true, keyPrefix: true }
    });

    const topApiKeysWithNames = topApiKeys.map(k => {
      const key = keys.find(kk => kk.id === k.apiKeyId);
      return {
        ...k,
        name: key?.name || 'Unknown',
        keyPrefix: key?.keyPrefix || 'N/A'
      };
    });

    // Requests by hour (last 24 hours)
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const hourlyLogs = await prisma.externalApiLog.findMany({
      where: { createdAt: { gte: last24Hours } },
      select: { createdAt: true },
    });

    const hourlyStats: { [key: string]: number } = {};
    for (let i = 0; i < 24; i++) {
      const hour = new Date(Date.now() - i * 60 * 60 * 1000).getHours();
      hourlyStats[hour.toString().padStart(2, '0') + ':00'] = 0;
    }
    hourlyLogs.forEach(log => {
      const hour = new Date(log.createdAt).getHours();
      const key = hour.toString().padStart(2, '0') + ':00';
      if (hourlyStats[key] !== undefined) hourlyStats[key]++;
    });

    return NextResponse.json({
      keys: {
        total: totalKeys,
        active: activeKeys,
        suspended: suspendedKeys,
        revoked: revokedKeys,
      },
      requests: {
        today: todayRequests,
        week: weekRequests,
        month: monthRequests,
        total: totalRequests,
      },
      performance: {
        avgResponseTime: Math.round(avgResponse._avg.responseTime || 0),
        errorRate: parseFloat(errorRate as string),
      },
      topEndpoints,
      topApiKeys: topApiKeysWithNames,
      hourlyStats: Object.entries(hourlyStats).map(([hour, count]) => ({ hour, count })).reverse(),
    });
  } catch (error) {
    console.error('Error fetching API stats:', error);
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
  }
}
