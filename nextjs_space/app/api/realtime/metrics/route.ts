/**
 * Real-time Metrics API (Server-Sent Events)
 * Provides live system metrics updates
 */

import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/rbac/middleware';
import { prisma } from '@/lib/db';

/**
 * GET /api/realtime/metrics - SSE endpoint for real-time metrics
 */
export async function GET(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (!authResult.allowed) {
    return new Response('Unauthorized', { status: 401 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      // Function to send metrics
      const sendMetrics = async () => {
        try {
          // Fetch latest metrics
          const services = await prisma.bigDataService.findMany({
            include: {
              metrics: {
                take: 1,
                orderBy: { timestamp: 'desc' },
              },
            },
          });

          const activeAlerts = await prisma.serviceAlert.count({
            where: { status: 'ACTIVE' },
          });

          const criticalAlerts = await prisma.serviceAlert.count({
            where: { status: 'ACTIVE', severity: 'CRITICAL' },
          });

          const metrics = {
            timestamp: new Date().toISOString(),
            services: services.map((s) => ({
              id: s.id,
              name: s.name,
              type: s.type,
              status: s.status,
              uptime: s.uptime,
              cpuUsage: s.metrics[0]?.cpuUsage || 0,
              memoryUsage: s.metrics[0]?.memoryUsage || 0,
              diskUsage: s.metrics[0]?.diskUsage || 0,
            })),
            alerts: {
              active: activeAlerts,
              critical: criticalAlerts,
            },
          };

          const data = `data: ${JSON.stringify(metrics)}\n\n`;
          controller.enqueue(encoder.encode(data));
        } catch (error) {
          console.error('Error sending metrics:', error);
        }
      };

      // Send initial metrics
      await sendMetrics();

      // Send metrics every 5 seconds
      const interval = setInterval(sendMetrics, 5000);

      // Cleanup on client disconnect
      req.signal.addEventListener('abort', () => {
        clearInterval(interval);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
