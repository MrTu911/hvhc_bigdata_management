import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/rbac/middleware';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

// Check health of all services
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (!authResult.allowed) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const services = await prisma.bigDataService.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        type: true,
        status: true,
        host: true,
        port: true,
        url: true,
        uptime: true,
        lastChecked: true,
      },
    });

    // Perform health checks (simplified version)
    const healthChecks = await Promise.all(
      services.map(async (service: any) => {
        try {
          // In production, this would make actual HTTP requests to service endpoints
          // For now, simulate health check with random status
          const isHealthy = Math.random() > 0.2; // 80% healthy
          
          const newStatus = isHealthy ? 'HEALTHY' : 'DOWN';
          const newUptime = isHealthy ? (service.uptime || 0) + 1 : 0;

          // Update service status
          await prisma.bigDataService.update({
            where: { id: service.id },
            data: {
              status: newStatus,
              uptime: newUptime,
              lastChecked: new Date(),
            },
          });

          return {
            ...service,
            status: newStatus,
            uptime: newUptime,
            lastChecked: new Date(),
          };
        } catch (error) {
          console.error(`Health check failed for ${service.name}:`, error);
          return {
            ...service,
            status: 'UNKNOWN',
          };
        }
      })
    );

    return NextResponse.json({ success: true, data: healthChecks });
  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
