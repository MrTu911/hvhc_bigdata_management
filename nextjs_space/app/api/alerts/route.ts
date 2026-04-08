import { NextRequest, NextResponse } from 'next/server';
import { requireFunction } from '@/lib/rbac/middleware';
import { MONITORING } from '@/lib/rbac/function-codes';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET all alerts
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireFunction(request, MONITORING.VIEW_ALERTS);
    if (!authResult.allowed) {
      return NextResponse.json({ success: false, error: authResult.authResult?.deniedReason || 'Không có quyền' || 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const severity = searchParams.get('severity');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: any = {};
    if (status) where.status = status;
    if (severity) where.severity = severity;

    const [alerts, total] = await Promise.all([
      prisma.serviceAlert.findMany({
        where,
        include: {
          service: {
            select: {
              name: true,
              type: true,
            },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { triggeredAt: 'desc' },
      }),
      prisma.serviceAlert.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: alerts.map((alert: any) => ({
        id: alert.id,
        serviceId: alert.serviceId,
        serviceName: alert.service.name,
        serviceType: alert.service.type,
        title: alert.title,
        message: alert.message,
        severity: alert.severity,
        status: alert.status,
        triggeredAt: alert.triggeredAt,
        acknowledgedAt: alert.acknowledgedAt,
        resolvedAt: alert.resolvedAt,
        metadata: alert.metadata,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get alerts error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
