/**
 * API: Nhật ký Hoạt động (Audit Logs)
 * GET /api/audit - Lấy danh sách audit logs với filters
 * 
 * RBAC: AUDIT.VIEW_LOGS
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireFunction } from '@/lib/rbac/middleware';
import { AUDIT } from '@/lib/rbac/function-codes';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // RBAC Check: AUDIT.VIEW_LOGS
    const authResult = await requireFunction(request, AUDIT.VIEW_LOGS);
    if (!authResult.allowed) {
      return authResult.response!;
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const action = searchParams.get('action') || '';
    const result = searchParams.get('result') || '';
    const resourceType = searchParams.get('resourceType') || '';

    const where: any = {};

    if (search) {
      where.OR = [
        { actorUserId: { contains: search, mode: 'insensitive' } },
        { resourceType: { contains: search, mode: 'insensitive' } },
        { resourceId: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (action && action !== 'all') {
      where.action = action;
    }

    if (result && result !== 'all') {
      if (result === 'SUCCESS') {
        where.success = true;
      } else if (result === 'FAILURE') {
        where.success = false;
      } else if (result === 'DENIED') {
        where.errorMessage = { contains: 'denied', mode: 'insensitive' };
      }
    }

    if (resourceType && resourceType !== 'all') {
      where.resourceType = resourceType;
    }

    const [total, logs] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    // Lấy thông tin user cho các logs
    const userIds = [...new Set(logs.map(log => log.actorUserId))];
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true },
    });
    const userMap = new Map(users.map(u => [u.id, u]));

    // Transform data
    // action field format: "[FUNCTION_CODE] ACTION" (xem logAudit() trong lib/audit.ts)
    const transformedLogs = logs.map(log => {
      const actionMatch = log.action.match(/^\[([^\]]+)\]\s*(.*)$/);
      const functionCode = actionMatch?.[1] ?? '';
      const action = actionMatch?.[2] ?? log.action;

      return {
        id: log.id,
        userId: log.actorUserId,
        functionCode,
        action,
        resourceType: log.resourceType,
        resourceId: log.resourceId,
        oldValue: log.beforeData,
        newValue: log.afterData,
        result: log.success ? 'SUCCESS' : (log.errorMessage?.toLowerCase().includes('denied') ? 'DENIED' : 'FAILURE'),
        ipAddress: log.actorIp,
        userAgent: log.actorUserAgent,
        timestamp: log.createdAt.toISOString(),
        user: userMap.get(log.actorUserId) ?? null,
      };
    });

    return NextResponse.json({
      logs: transformedLogs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error: any) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json(
      { error: 'Lỗi khi lấy nhật ký hoạt động', details: error.message },
      { status: 500 }
    );
  }
}
