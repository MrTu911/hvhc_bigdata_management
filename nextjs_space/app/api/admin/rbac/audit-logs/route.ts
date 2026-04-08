export const dynamic = 'force-dynamic';

/**
 * API: Audit Logs - Nhật ký kiểm toán
 * GĐ2.8: Chuẩn hóa response + pagination
 * 
 * RBAC: AUDIT.VIEW_LOGS
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireFunction } from '@/lib/rbac/middleware';
import { AUDIT } from '@/lib/rbac/function-codes';
import prisma from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // RBAC Check: AUDIT.VIEW_LOGS
    const authResult = await requireFunction(request, AUDIT.VIEW_LOGS);
    if (!authResult.allowed) {
      return authResult.response!;
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const action = searchParams.get('action');
    const success = searchParams.get('success');
    const userId = searchParams.get('userId');
    const resourceType = searchParams.get('resourceType');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build where clause
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};
    
    if (action) where.action = action;
    if (success !== null) where.success = success === 'true';
    if (userId) where.actorUserId = userId;
    if (resourceType) where.resourceType = resourceType;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ]);

    // Get user info separately for actors
    const actorIds = [...new Set(logs.map(l => l.actorUserId))];
    const actors = await prisma.user.findMany({
      where: { id: { in: actorIds } },
      select: { id: true, name: true, email: true }
    });
    const actorMap = new Map(actors.map(a => [a.id, a]));

    // Transform to expected format
    const formattedLogs = logs.map(log => {
      const actor = actorMap.get(log.actorUserId);
      return {
        id: log.id,
        timestamp: log.createdAt.toISOString(),
        user: actor?.email || 'system',
        userName: actor?.name || 'Hệ thống',
        action: log.action,
        resource: log.resourceType || 'Unknown',
        resourceId: log.resourceId,
        status: log.success ? 'SUCCESS' : 'FAILED',
        severity: log.action === 'DELETE' ? 'HIGH' : 
                  log.action === 'UPDATE' ? 'MEDIUM' : 'LOW',
        ipAddress: log.actorIp || '-',
        details: log.errorMessage || '',
        endpoint: log.endpoint,
        httpMethod: log.httpMethod,
      };
    });

    return NextResponse.json({
      success: true,
      logs: formattedLogs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      }
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch audit logs' },
      { status: 500 }
    );
  }
}
