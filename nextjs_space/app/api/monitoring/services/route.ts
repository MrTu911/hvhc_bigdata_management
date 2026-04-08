/**
 * API Route: Real-time Service Monitoring
 * GET - Get all BigData services status
 * POST - Health check for all services
 * 
 * RBAC: MONITORING.VIEW_SERVICES, MONITORING.MANAGE_SERVICES
 */

import { NextRequest, NextResponse } from "next/server";
import { requireFunction, requireAuth } from "@/lib/rbac/middleware";
import { MONITORING } from "@/lib/rbac/function-codes";
import prisma from "@/lib/db";

/**
 * GET: Get all BigData services status
 */
export async function GET(request: NextRequest) {
  try {
    // RBAC Check: MONITORING.VIEW_SERVICES
    const authResult = await requireFunction(request, MONITORING.VIEW_SERVICES);
    if (!authResult.allowed) {
      return authResult.response!;
    }

    // Get all services with latest metrics
    const services = await prisma.bigDataService.findMany({
      where: {
        isActive: true,
      },
      include: {
        metrics: {
          orderBy: {
            timestamp: "desc",
          },
          take: 1, // Latest metric only
        },
        alerts: {
          where: {
            status: "ACTIVE",
          },
          orderBy: {
            triggeredAt: "desc",
          },
          take: 5,
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    // Calculate overall health
    const totalServices = services.length;
    const healthyServices = services.filter(s => s.status === "HEALTHY").length;
    const degradedServices = services.filter(s => s.status === "DEGRADED").length;
    const downServices = services.filter(s => s.status === "DOWN").length;

    return NextResponse.json({
      success: true,
      summary: {
        total: totalServices,
        healthy: healthyServices,
        degraded: degradedServices,
        down: downServices,
        healthPercentage: totalServices > 0 
          ? Math.round((healthyServices / totalServices) * 100)
          : 0,
      },
      services: services.map(service => ({
        id: service.id,
        name: service.name,
        type: service.type,
        status: service.status,
        url: service.url,
        uptime: service.uptime,
        lastChecked: service.lastChecked,
        latestMetrics: service.metrics[0] || null,
        activeAlerts: service.alerts.length,
      })),
    });

  } catch (error: any) {
    console.error("Get services error:", error);
    return NextResponse.json(
      {
        error: "Failed to retrieve services",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * POST: Health check for all services
 */
export async function POST(request: NextRequest) {
  try {
    // RBAC Check: MONITORING.MANAGE_SERVICES
    const authResult = await requireFunction(request, MONITORING.MANAGE_SERVICES);
    if (!authResult.allowed) {
      return authResult.response!;
    }

    // Get all active services
    const services = await prisma.bigDataService.findMany({
      where: { isActive: true },
    });

    const healthCheckResults = [];

    // Perform health checks
    for (const service of services) {
      try {
        const startTime = Date.now();
        
        // Simple HTTP health check
        const response = await fetch(service.url || `http://${service.host}:${service.port}`, {
          method: "GET",
          signal: AbortSignal.timeout(5000), // 5 second timeout
        });

        const responseTime = Date.now() - startTime;
        const isHealthy = response.ok;

        // Update service status
        const newStatus = isHealthy ? "HEALTHY" : "DEGRADED";
        
        await prisma.bigDataService.update({
          where: { id: service.id },
          data: {
            status: newStatus,
            lastChecked: new Date(),
          },
        });

        // Log metric
        await prisma.serviceMetric.create({
          data: {
            serviceId: service.id,
            metricName: "response_time",
            metricValue: responseTime,
            unit: "ms",
          },
        });

        healthCheckResults.push({
          service: service.name,
          status: newStatus,
          responseTime,
          healthy: isHealthy,
        });

      } catch (error: any) {
        // Service is down
        await prisma.bigDataService.update({
          where: { id: service.id },
          data: {
            status: "DOWN",
            lastChecked: new Date(),
          },
        });

        // Create alert if not already exists
        const existingAlert = await prisma.serviceAlert.findFirst({
          where: {
            serviceId: service.id,
            status: "ACTIVE",
            severity: "CRITICAL",
          },
        });

        if (!existingAlert) {
          await prisma.serviceAlert.create({
            data: {
              serviceId: service.id,
              title: `Service ${service.name} is DOWN`,
              message: `Failed to connect to ${service.name}: ${error.message}`,
              severity: "CRITICAL",
              status: "ACTIVE",
            },
          });
        }

        healthCheckResults.push({
          service: service.name,
          status: "DOWN",
          healthy: false,
          error: error.message,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: "Health check completed",
      results: healthCheckResults,
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error("Health check error:", error);
    return NextResponse.json(
      {
        error: "Failed to perform health check",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
