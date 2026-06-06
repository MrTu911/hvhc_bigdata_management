/**
 * API: Tổng quan Khai thác dữ liệu (chỉ số thật từ catalog DataSource)
 * GET /api/bigdata/overview
 * RBAC: DATA.VIEW
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireFunction } from '@/lib/rbac/middleware';
import { DATA } from '@/lib/rbac/function-codes';
import { logAudit } from '@/lib/audit';
import { getBigDataOverview } from '@/lib/services/bigdata/overview-service';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireFunction(request, DATA.VIEW);
    if (!auth.allowed) {
      return auth.response!;
    }
    const { user } = auth;

    const overview = await getBigDataOverview();

    await logAudit({
      userId: user!.id,
      functionCode: DATA.VIEW,
      action: 'VIEW',
      resourceType: 'BIGDATA_OVERVIEW',
      metadata: { sourceCount: overview.kpis.sourceCount },
      result: 'SUCCESS',
    });

    return NextResponse.json({ success: true, data: overview, error: null });
  } catch (error) {
    console.error('[GET /api/bigdata/overview] error:', error);
    return NextResponse.json(
      { success: false, data: null, error: 'Lỗi hệ thống khi tải tổng quan' },
      { status: 500 },
    );
  }
}
