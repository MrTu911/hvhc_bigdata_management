/**
 * API: Data Governance Compliance
 * GET /api/governance/compliance - Kiểm tra tuân thủ dữ liệu
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireFunction } from '@/lib/rbac/middleware';
import { GOVERNANCE } from '@/lib/rbac/function-codes';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireFunction(request, GOVERNANCE.VIEW_COMPLIANCE);
    if (!authResult.allowed) {
      return NextResponse.json({ error: authResult.authResult?.deniedReason || 'Không có quyền' || 'Forbidden' }, { status: 403 });
    }

    // Thống kê từ DataQuery
    const queries = await prisma.dataQuery.findMany({
      orderBy: { submittedAt: 'desc' },
      take: 1000,
    });

    // Phân tích tuân thủ
    let compliantCount = 0;
    let nonCompliantCount = 0;
    let warningCount = 0;
    let criticalIssues = 0;

    const issues: any[] = [];

    queries.forEach((query) => {
      // Kiểm tra các quy tắc tuân thủ
      const checks = [];

      // Rule 1: Query phải thành công
      if (query.status === 'FAILED') {
        checks.push({ rule: 'Query Status', status: 'failed', severity: 'warning' });
        nonCompliantCount++;
      } else if (query.status === 'COMPLETED') {
        compliantCount++;
      } else {
        warningCount++;
      }

      // Rule 2: Kiểm tra thời gian thực thi
      if (query.executionTime && query.executionTime > 30000) {
        checks.push({ rule: 'Execution Time', status: 'warning', severity: 'warning' });
        issues.push({
          queryId: query.id,
          type: 'PERFORMANCE',
          message: `Query chạy quá lâu: ${query.executionTime}ms`,
        });
      }

      // Rule 3: Kiểm tra kích thước dữ liệu
      if (query.dataSize && query.dataSize > 100) {
        checks.push({ rule: 'Data Size', status: 'warning', severity: 'critical' });
        criticalIssues++;
        issues.push({
          queryId: query.id,
          type: 'DATA_SIZE',
          message: `Dữ liệu vượt ngưỡng: ${query.dataSize}MB`,
        });
      }
    });

    // Thống kê theo loại query
    const byType = await prisma.dataQuery.groupBy({
      by: ['queryType'],
      _count: { id: true },
    });

    return NextResponse.json({
      summary: {
        total: queries.length,
        compliant: compliantCount,
        nonCompliant: nonCompliantCount,
        warnings: warningCount,
        criticalIssues,
        complianceRate: queries.length > 0 
          ? Math.round((compliantCount / queries.length) * 100) 
          : 100,
      },
      byType: byType.map(t => ({
        type: t.queryType,
        count: t._count.id,
      })),
      recentIssues: issues.slice(0, 10),
      lastChecked: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Governance compliance error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
