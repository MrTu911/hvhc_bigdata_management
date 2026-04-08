/**
 * API: Export Audit Logs
 * GET /api/audit/export - Xuất audit logs ra CSV/Excel
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireFunction } from '@/lib/rbac/middleware';
import { AUDIT } from '@/lib/rbac/function-codes';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // RBAC: Require EXPORT_LOGS permission
    const authResult = await requireFunction(request, AUDIT.EXPORT_LOGS);
    if (!authResult.allowed) {
      return authResult.response!;
    }

    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'csv';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const action = searchParams.get('action');
    const resourceType = searchParams.get('resourceType');

    const where: any = {};

    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    if (action && action !== 'all') {
      where.action = action;
    }

    if (resourceType && resourceType !== 'all') {
      where.resourceType = resourceType;
    }

    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 10000,
    });

    if (format === 'csv') {
      const headers = ['ID', 'Thời gian', 'Người thực hiện', 'Hành động', 'Loại tài nguyên', 'ID tài nguyên', 'Kết quả', 'IP'];
      const rows = logs.map(log => [
        log.id,
        log.createdAt.toISOString(),
        log.actorUserId,
        log.action,
        log.resourceType,
        log.resourceId || '',
        log.success ? 'Thành công' : 'Thất bại',
        log.actorIp || '',
      ]);

      const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const bom = '\uFEFF';

      return new NextResponse(bom + csvContent, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="audit_logs_${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    }

    return NextResponse.json(logs);
  } catch (error) {
    console.error('Export audit logs error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
