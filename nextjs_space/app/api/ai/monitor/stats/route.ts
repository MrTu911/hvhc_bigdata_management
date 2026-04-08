/**
 * API endpoint cho AI Monitoring Statistics
 * RBAC: AI.VIEW_MONITOR
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireFunction } from '@/lib/rbac/middleware';
import { AI } from '@/lib/rbac/function-codes';

export async function GET(request: NextRequest) {
  try {
    // RBAC Check: AI.VIEW_MONITOR
    const authResult = await requireFunction(request, AI.VIEW_MONITOR);
    if (!authResult.allowed) {
      return authResult.response!;
    }

    const { searchParams } = new URL(request.url);
    const hours = parseInt(searchParams.get('hours') || '24');

    const startDate = new Date();
    startDate.setHours(startDate.getHours() - hours);

    // Lấy logs trong khoảng thời gian
    const logs = await prisma.aIApiLog.findMany({
      where: {
        createdAt: {
          gte: startDate,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Tính thống kê tổng quát
    const totalCalls = logs.length;
    const successCalls = logs.filter(l => l.success).length;
    const failedCalls = totalCalls - successCalls;
    const avgResponseTime = logs.reduce((sum, l) => sum + (l.responseTime || 0), 0) / totalCalls || 0;

    // Provider distribution
    const providerStats = logs.reduce((acc: any, log) => {
      acc[log.provider] = (acc[log.provider] || 0) + 1;
      return acc;
    }, {});

    // Endpoint distribution
    const endpointStats = logs.reduce((acc: any, log) => {
      acc[log.endpoint] = (acc[log.endpoint] || 0) + 1;
      return acc;
    }, {});

    // Hourly stats (24 hours)
    const hourlyStats = [];
    for (let i = 0; i < 24; i++) {
      const hourStart = new Date();
      hourStart.setHours(hourStart.getHours() - i, 0, 0, 0);
      const hourEnd = new Date(hourStart);
      hourEnd.setHours(hourEnd.getHours() + 1);

      const hourLogs = logs.filter(l => {
        const logDate = new Date(l.createdAt);
        return logDate >= hourStart && logDate < hourEnd;
      });

      hourlyStats.unshift({
        hour: hourStart.getHours(),
        totalCalls: hourLogs.length,
        successCalls: hourLogs.filter(l => l.success).length,
        failedCalls: hourLogs.filter(l => !l.success).length,
        avgResponseTime: hourLogs.reduce((sum, l) => sum + (l.responseTime || 0), 0) / hourLogs.length || 0,
      });
    }

    // Recent errors
    const recentErrors = logs
      .filter(l => !l.success)
      .slice(0, 10)
      .map(l => ({
        id: l.id,
        provider: l.provider,
        endpoint: l.endpoint,
        errorMessage: l.errorMessage,
        createdAt: l.createdAt,
      }));

    return NextResponse.json({
      summary: {
        totalCalls,
        successCalls,
        failedCalls,
        successRate: totalCalls > 0 ? (successCalls / totalCalls) * 100 : 0,
        avgResponseTime: Math.round(avgResponseTime),
      },
      providerStats,
      endpointStats,
      hourlyStats,
      recentErrors,
    });
  } catch (error: any) {
    console.error('Error fetching AI stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch AI statistics' },
      { status: 500 }
    );
  }
}
