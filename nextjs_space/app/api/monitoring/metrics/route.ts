// API Route: System Metrics & Performance Data
import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireFunction } from "@/lib/rbac/middleware";
import { MONITORING } from "@/lib/rbac/function-codes";
import prisma from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (!authResult.allowed) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const serviceId = searchParams.get("serviceId");
    const hours = parseInt(searchParams.get("hours") || "24");
    const metricName = searchParams.get("metricName");

    // Calculate time range
    const startTime = new Date();
    startTime.setHours(startTime.getHours() - hours);

    // Build query
    const whereClause: any = {
      timestamp: {
        gte: startTime,
      },
    };

    if (serviceId) {
      whereClause.serviceId = serviceId;
    }

    if (metricName) {
      whereClause.metricName = metricName;
    }

    // Get metrics
    const metrics = await prisma.serviceMetric.findMany({
      where: whereClause,
      orderBy: {
        timestamp: "asc",
      },
      take: 1000, // Limit to 1000 data points
    });

    // Aggregate by service if no specific service requested
    if (!serviceId) {
      const groupedMetrics: Record<string, any[]> = {};
      
      for (const metric of metrics) {
        if (!groupedMetrics[metric.serviceId]) {
          groupedMetrics[metric.serviceId] = [];
        }
        groupedMetrics[metric.serviceId].push(metric);
      }

      return NextResponse.json({
        success: true,
        timeRange: {
          start: startTime,
          end: new Date(),
          hours,
        },
        metricsByService: groupedMetrics,
        totalDataPoints: metrics.length,
      });
    }

    // Return metrics for specific service
    return NextResponse.json({
      success: true,
      timeRange: {
        start: startTime,
        end: new Date(),
        hours,
      },
      metrics,
      totalDataPoints: metrics.length,
    });

  } catch (error: any) {
    console.error("Get metrics error:", error);
    return NextResponse.json(
      {
        error: "Failed to retrieve metrics",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * POST: Record new metrics
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireFunction(request, MONITORING.MANAGE_SERVICES);
    if (!authResult.allowed) {
      return NextResponse.json({ error: authResult.authResult?.deniedReason || 'Không có quyền' || "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { serviceId, metrics: metricsData } = body;

    if (!serviceId || !metricsData) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify service exists
    const service = await prisma.bigDataService.findUnique({
      where: { id: serviceId },
    });

    if (!service) {
      return NextResponse.json(
        { error: "Service not found" },
        { status: 404 }
      );
    }

    // Create metrics
    const createdMetrics = [];
    
    for (const metricData of metricsData) {
      const metric = await prisma.serviceMetric.create({
        data: {
          serviceId,
          metricName: metricData.name,
          metricValue: metricData.value,
          unit: metricData.unit || null,
          cpuUsage: metricData.cpuUsage || null,
          memoryUsage: metricData.memoryUsage || null,
          diskUsage: metricData.diskUsage || null,
          networkIn: metricData.networkIn || null,
          networkOut: metricData.networkOut || null,
        },
      });
      
      createdMetrics.push(metric);
    }

    return NextResponse.json({
      success: true,
      message: "Metrics recorded successfully",
      metrics: createdMetrics,
    });

  } catch (error: any) {
    console.error("Record metrics error:", error);
    return NextResponse.json(
      {
        error: "Failed to record metrics",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
