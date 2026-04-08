/**
 * API: AI Anomaly Alerts - Danh sách cảnh báo bất thường đang hoạt động
 * Path: /api/ai/anomaly/alerts
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireFunction } from '@/lib/rbac/middleware';
import { AI } from '@/lib/rbac/function-codes';
import prisma from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireFunction(request, AI.VIEW_EARLY_WARNINGS);
    if (!authResult.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const severity = searchParams.get('severity') || '';
    const domain = searchParams.get('domain') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Fetch cached AI insights that are anomaly-related
    const where: any = { type: { startsWith: 'ANOMALY' } };
    if (severity) where.data = { path: ['severity'], equals: severity };

    const [insights, total] = await Promise.all([
      prisma.aIInsight.findMany({
        where,
        orderBy: { generatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.aIInsight.count({ where }),
    ]);

    // Also check real-time system alerts
    const systemAlerts = await prisma.serviceAlert.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { triggeredAt: 'desc' },
      take: 10,
    }).catch(() => []);

    // Generate dynamic alerts based on current data
    const now = new Date();
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      pendingAwards,
      expiringInsurance,
      disciplinesThisMonth,
    ] = await Promise.all([
      // Khen thưởng đang chờ duyệt quá lâu (>14 ngày)
      prisma.policyRecord.count({
        where: {
          deletedAt: null,
          workflowStatus: { in: ['PROPOSED', 'UNDER_REVIEW'] },
          proposedAt: { lt: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000) },
        },
      }),
      // Bảo hiểm sắp hết hạn (30 ngày tới)
      prisma.insuranceInfo.count({
        where: {
          deletedAt: null,
          healthInsuranceEndDate: { gte: now, lte: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) },
        },
      }),
      // Kỷ luật trong tháng này
      prisma.policyRecord.count({
        where: {
          deletedAt: null,
          recordType: 'DISCIPLINE',
          workflowStatus: 'APPROVED',
          decisionDate: { gte: last30Days },
        },
      }),
    ]);

    const dynamicAlerts = [];
    if (pendingAwards > 0) {
      dynamicAlerts.push({
        id: 'pending-awards',
        type: 'ANOMALY_WORKFLOW',
        severity: pendingAwards > 10 ? 'HIGH' : 'MEDIUM',
        domain: 'awards',
        title: 'Khen thưởng chờ duyệt quá hạn',
        description: `${pendingAwards} hồ sơ khen thưởng đang chờ duyệt hơn 14 ngày`,
        count: pendingAwards,
        createdAt: now.toISOString(),
      });
    }
    if (expiringInsurance > 0) {
      dynamicAlerts.push({
        id: 'expiring-insurance',
        type: 'ANOMALY_INSURANCE',
        severity: expiringInsurance > 20 ? 'HIGH' : 'MEDIUM',
        domain: 'insurance',
        title: 'Bảo hiểm sắp hết hạn',
        description: `${expiringInsurance} thẻ bảo hiểm hết hạn trong 30 ngày tới`,
        count: expiringInsurance,
        createdAt: now.toISOString(),
      });
    }
    if (disciplinesThisMonth > 5) {
      dynamicAlerts.push({
        id: 'disciplines-spike',
        type: 'ANOMALY_DISCIPLINE',
        severity: disciplinesThisMonth > 10 ? 'HIGH' : 'MEDIUM',
        domain: 'awards',
        title: 'Tăng đột biến kỷ luật',
        description: `${disciplinesThisMonth} kỷ luật được phê duyệt trong 30 ngày qua`,
        count: disciplinesThisMonth,
        createdAt: now.toISOString(),
      });
    }

    const filtered = domain
      ? dynamicAlerts.filter(a => a.domain === domain)
      : dynamicAlerts;

    return NextResponse.json({
      alerts: filtered,
      systemAlerts,
      cachedInsights: insights,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
      summary: {
        total: filtered.length,
        critical: filtered.filter(a => a.severity === 'CRITICAL').length,
        high: filtered.filter(a => a.severity === 'HIGH').length,
        medium: filtered.filter(a => a.severity === 'MEDIUM').length,
      },
    });
  } catch (error) {
    console.error('[Anomaly Alerts GET]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
