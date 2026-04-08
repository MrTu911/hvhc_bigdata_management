/**
 * API: Analytics Summary
 * GET /api/analytics/summary
 * 
 * Trả về thống kê tổng hợp cho dashboard
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/rbac/middleware';
import prisma from '@/lib/db';
import { ServiceStatus, UserStatus, QueryStatus, FileStatus } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (!authResult.allowed) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'today'; // today, week, month

    // 2. Calculate date range
    const now = new Date();
    let startDate = new Date();
    
    switch (period) {
      case 'today':
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
    }

    // 3. Parallel queries cho hiệu suất tốt hơn
    const [
      totalUsers,
      activeUsers,
      newUsers,
      totalServices,
      servicesStatus,
      totalFiles,
      totalQueries,
      filesInPeriod,
      queriesInPeriod,
      recentFiles,
      recentQueries,
      latestMetrics,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({
        where: {
          status: UserStatus.ACTIVE,
          lastLoginAt: { gte: startDate },
        },
      }),
      prisma.user.count({
        where: { createdAt: { gte: startDate } },
      }),
      prisma.bigDataService.count({ where: { isActive: true } }),
      prisma.bigDataService.groupBy({
        by: ['status'],
        _count: true,
      }),
      prisma.researchFile.count(),
      prisma.dataQuery.count(),
      prisma.researchFile.count({
        where: { uploadedAt: { gte: startDate } },
      }),
      prisma.dataQuery.count({
        where: { submittedAt: { gte: startDate } },
      }),
      prisma.researchFile.findMany({
        take: 5,
        orderBy: { uploadedAt: 'desc' },
        select: {
          id: true,
          fileName: true,
          fileSize: true,
          uploadedAt: true,
          uploadedBy: true,
        },
      }),
      prisma.dataQuery.findMany({
        take: 5,
        orderBy: { submittedAt: 'desc' },
        select: {
          id: true,
          queryType: true,
          status: true,
          executionTime: true,
          submittedAt: true,
        },
      }),
      prisma.serviceMetric.findMany({
        take: 10,
        orderBy: { timestamp: 'desc' },
        select: {
          cpuUsage: true,
          memoryUsage: true,
          diskUsage: true,
        },
      }),
    ]);

    // 4. Process service status counts
    const servicesByStatus = servicesStatus.reduce((acc, item) => {
      acc[item.status] = item._count;
      return acc;
    }, {} as Record<ServiceStatus, number>);

    const healthyServices = servicesByStatus[ServiceStatus.HEALTHY] || 0;
    const degradedServices = servicesByStatus[ServiceStatus.DEGRADED] || 0;
    const downServices = servicesByStatus[ServiceStatus.DOWN] || 0;

    // 5. Calculate total storage
    const totalStorageResult = await prisma.researchFile.aggregate({
      _sum: { fileSize: true },
    });
    const totalStorageGB = ((totalStorageResult._sum.fileSize || 0) / (1024 ** 3)).toFixed(2);

    // 6. Calculate average metrics
    const avgCpu = latestMetrics.reduce((sum, m) => sum + (m.cpuUsage || 0), 0) / (latestMetrics.length || 1);
    const avgMemory = latestMetrics.reduce((sum, m) => sum + (m.memoryUsage || 0), 0) / (latestMetrics.length || 1);
    const avgDisk = latestMetrics.reduce((sum, m) => sum + (m.diskUsage || 0), 0) / (latestMetrics.length || 1);

    // 7. Calculate data uploaded in period
    const dataUploadedResult = await prisma.researchFile.aggregate({
      where: { uploadedAt: { gte: startDate } },
      _sum: { fileSize: true },
    });
    const dataUploadedGB = ((dataUploadedResult._sum.fileSize || 0) / (1024 ** 3)).toFixed(2);

    // 8. Calculate average query time
    const avgQueryTimeResult = await prisma.dataQuery.aggregate({
      where: {
        submittedAt: { gte: startDate },
        status: QueryStatus.COMPLETED,
      },
      _avg: { executionTime: true },
    });
    const avgQueryTime = avgQueryTimeResult._avg.executionTime || 0;

    // 9. Get active alerts
    const activeAlerts = await prisma.serviceAlert.count({
      where: { status: 'ACTIVE' },
    });

    // 10. Build response
    const summary = {
      users: { total: totalUsers, active: activeUsers, new: newUsers },
      services: { total: totalServices, healthy: healthyServices, degraded: degradedServices, down: downServices },
      data: {
        totalFiles,
        totalQueries,
        totalStorageGB: parseFloat(totalStorageGB),
        filesInPeriod,
        queriesInPeriod,
        dataUploadedGB: parseFloat(dataUploadedGB),
      },
      performance: {
        avgQueryTimeMs: Math.round(avgQueryTime),
        avgCpuUsage: Math.round(avgCpu * 100) / 100,
        avgMemoryUsage: Math.round(avgMemory * 100) / 100,
        avgDiskUsage: Math.round(avgDisk * 100) / 100,
      },
      alerts: { active: activeAlerts },
      recentActivities: { files: recentFiles, queries: recentQueries },
      period,
      generatedAt: new Date().toISOString(),
    };

    return NextResponse.json({ success: true, data: summary });
  } catch (error: any) {
    console.error('Analytics summary error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate analytics summary' },
      { status: 500 }
    );
  }
}
