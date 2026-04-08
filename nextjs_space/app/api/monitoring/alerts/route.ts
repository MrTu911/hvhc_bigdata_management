/**
 * API Route: Service Alerts Management
 * GET - Get all active alerts
 * POST - Create new alert
 * PUT - Update alert (acknowledge/resolve)
 * 
 * RBAC: MONITORING.VIEW_ALERTS, MONITORING.MANAGE_ALERTS
 */

import { NextRequest, NextResponse } from "next/server";
import { requireFunction, requireAuth } from "@/lib/rbac/middleware";
import { MONITORING } from "@/lib/rbac/function-codes";
import prisma from "@/lib/db";

/**
 * GET: Get all active alerts
 */
export async function GET(request: NextRequest) {
  try {
    // RBAC Check: MONITORING.VIEW_ALERTS
    const authResult = await requireFunction(request, MONITORING.VIEW_ALERTS);
    if (!authResult.allowed) {
      return authResult.response!;
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "ACTIVE";
    const severity = searchParams.get("severity");

    const whereClause: any = {
      status: status as any,
    };

    if (severity) {
      whereClause.severity = severity as any;
    }

    const alerts = await prisma.serviceAlert.findMany({
      where: whereClause,
      include: {
        service: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
      orderBy: [
        { severity: "desc" },
        { triggeredAt: "desc" },
      ],
    });

    // Count by severity
    const criticalCount = alerts.filter(a => a.severity === "CRITICAL").length;
    const errorCount = alerts.filter(a => a.severity === "ERROR").length;
    const warningCount = alerts.filter(a => a.severity === "WARNING").length;
    const infoCount = alerts.filter(a => a.severity === "INFO").length;

    return NextResponse.json({
      success: true,
      summary: {
        total: alerts.length,
        critical: criticalCount,
        error: errorCount,
        warning: warningCount,
        info: infoCount,
      },
      alerts,
    });

  } catch (error: any) {
    console.error("Get alerts error:", error);
    return NextResponse.json(
      {
        error: "Failed to retrieve alerts",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * POST: Create new alert
 */
export async function POST(request: NextRequest) {
  try {
    // RBAC Check: MONITORING.MANAGE_ALERTS
    const authResult = await requireFunction(request, MONITORING.MANAGE_ALERTS);
    if (!authResult.allowed) {
      return authResult.response!;
    }

    const body = await request.json();
    const { serviceId, title, message, severity } = body;

    if (!serviceId || !title || !message || !severity) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const alert = await prisma.serviceAlert.create({
      data: {
        serviceId,
        title,
        message,
        severity: severity as any,
        status: "ACTIVE",
      },
      include: {
        service: true,
      },
    });

    return NextResponse.json({
      success: true,
      alert,
    });

  } catch (error: any) {
    console.error("Create alert error:", error);
    return NextResponse.json(
      {
        error: "Failed to create alert",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * PUT: Update alert (acknowledge/resolve)
 */
export async function PUT(request: NextRequest) {
  try {
    // RBAC Check: MONITORING.MANAGE_ALERTS
    const authResult = await requireFunction(request, MONITORING.MANAGE_ALERTS);
    if (!authResult.allowed) {
      return authResult.response!;
    }
    const user = authResult.user!;

    const body = await request.json();
    const { alertId, action } = body; // action: 'acknowledge' or 'resolve'

    if (!alertId || !action) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const updateData: any = {};

    if (action === "acknowledge") {
      updateData.status = "ACKNOWLEDGED";
      updateData.acknowledgedAt = new Date();
      updateData.acknowledgedBy = user.id;
    } else if (action === "resolve") {
      updateData.status = "RESOLVED";
      updateData.resolvedAt = new Date();
      updateData.resolvedBy = user.id;
    }

    const alert = await prisma.serviceAlert.update({
      where: { id: alertId },
      data: updateData,
      include: {
        service: true,
      },
    });

    return NextResponse.json({
      success: true,
      alert,
    });

  } catch (error: any) {
    console.error("Update alert error:", error);
    return NextResponse.json(
      {
        error: "Failed to update alert",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
