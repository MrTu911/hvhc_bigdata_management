
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (session.user.role !== 'CHI_HUY_HOC_VIEN') {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Command access only' },
        { status: 403 }
      );
    }

    // Get system performance statistics
    const [services, queries, metrics, recentLogs] = await Promise.all([
      prisma.bigDataService.findMany({
        include: {
          _count: {
            select: {
              alerts: true,
              metrics: true
            }
          }
        }
      }),
      
      prisma.dataQuery.findMany({
        where: {
          submittedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
        }
      }),
      
      prisma.serviceMetric.findMany({
        where: {
          timestamp: { gte: new Date(Date.now() - 60 * 60 * 1000) } // Last hour
        },
        orderBy: { timestamp: 'desc' }
      }),
      
      prisma.systemLog.findMany({
        where: {
          createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) }, // Last hour
          level: { in: ['ERROR', 'CRITICAL'] }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      })
    ]);

    // Calculate service health
    const servicesByStatus = services.reduce((acc, service) => {
      acc[service.status] = (acc[service.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Calculate uptime (mock calculation)
    const totalServices = services.length;
    const healthyServices = servicesByStatus['HEALTHY'] || 0;
    const uptime = totalServices > 0 ? (healthyServices / totalServices) * 100 : 100;

    // Query performance
    const completedQueries = queries.filter(q => q.status === 'COMPLETED');
    const totalExecutionTime = completedQueries.reduce((sum, q) => {
      return sum + (q.executionTime || 0);
    }, 0);
    const avgExecutionTime = completedQueries.length > 0 
      ? totalExecutionTime / completedQueries.length 
      : 0;

    // Performance timeline (last 24 hours)
    const performanceTimeline = Array.from({ length: 24 }, (_, i) => {
      const hour = new Date();
      hour.setHours(hour.getHours() - (23 - i));
      const hourStart = new Date(hour.getFullYear(), hour.getMonth(), hour.getDate(), hour.getHours());
      const hourEnd = new Date(hourStart.getTime() + 60 * 60 * 1000);
      
      const hourQueries = queries.filter(q => 
        q.submittedAt >= hourStart && q.submittedAt < hourEnd
      );
      
      const hourMetrics = metrics.filter(m => 
        m.timestamp >= hourStart && m.timestamp < hourEnd
      );
      
      const avgCpu = hourMetrics.length > 0
        ? hourMetrics.reduce((sum, m) => sum + (m.cpuUsage || 50), 0) / hourMetrics.length
        : 45 + Math.random() * 20;
      
      const avgMemory = hourMetrics.length > 0
        ? hourMetrics.reduce((sum, m) => sum + (m.memoryUsage || 60), 0) / hourMetrics.length
        : 55 + Math.random() * 20;
      
      return {
        time: hourStart.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        queries: hourQueries.length,
        cpu: Math.round(avgCpu),
        memory: Math.round(avgMemory),
        responseTime: hourQueries.length > 0 
          ? Math.round(hourQueries.reduce((sum, q) => sum + (q.executionTime || 0), 0) / hourQueries.length)
          : Math.round(100 + Math.random() * 50)
      };
    });

    // Resource utilization
    const latestMetrics = metrics.slice(0, Math.min(10, metrics.length));
    const avgCpu = latestMetrics.length > 0
      ? latestMetrics.reduce((sum, m) => sum + (m.cpuUsage || 50), 0) / latestMetrics.length
      : 45;
    const avgMemory = latestMetrics.length > 0
      ? latestMetrics.reduce((sum, m) => sum + (m.memoryUsage || 60), 0) / latestMetrics.length
      : 55;
    const diskUsage = 24; // Mock value

    // Service details
    const serviceDetails = services.map(service => ({
      id: service.id,
      name: service.name,
      type: service.type,
      status: service.status,
      uptime: service.status === 'HEALTHY' ? '99.9%' : service.status === 'DEGRADED' ? '95.5%' : '0%',
      alertCount: service._count.alerts,
      lastCheck: service.lastChecked,
      responseTime: Math.round(50 + Math.random() * 150) // Mock response time
    }));

    const stats = {
      overview: {
        totalServices: totalServices,
        healthyServices: healthyServices,
        degradedServices: servicesByStatus['DEGRADED'] || 0,
        downServices: servicesByStatus['DOWN'] || 0,
        uptime: Math.round(uptime * 10) / 10,
        totalQueries: queries.length,
        avgResponseTime: Math.round(avgExecutionTime)
      },
      resources: {
        cpu: Math.round(avgCpu),
        memory: Math.round(avgMemory),
        disk: diskUsage,
        network: {
          inbound: Math.round(1024 + Math.random() * 512), // MB/s
          outbound: Math.round(512 + Math.random() * 256)
        }
      },
      performance: {
        timeline: performanceTimeline,
        services: serviceDetails,
        recentErrors: recentLogs.map(log => ({
          id: log.id,
          level: log.level,
          message: log.description,
          timestamp: log.createdAt
        }))
      },
      storage: {
        total: 1000, // GB
        used: 240, // GB
        available: 760, // GB
        datasets: queries.filter(q => q.status === 'COMPLETED').length,
        models: Math.floor(queries.length * 0.3) // Assume 30% are model-related
      }
    };

    return NextResponse.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching system performance:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch system performance',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
