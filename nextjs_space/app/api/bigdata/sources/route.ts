/**
 * API: Danh mục nguồn dữ liệu (Khai thác dữ liệu)
 * GET /api/bigdata/sources?keyword=&kind=
 * RBAC: DATA.VIEW
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireFunction } from '@/lib/rbac/middleware';
import { DATA } from '@/lib/rbac/function-codes';
import { logAudit } from '@/lib/audit';
import { listDataSources } from '@/lib/services/bigdata/data-source-service';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireFunction(request, DATA.VIEW);
    if (!auth.allowed) {
      return auth.response!;
    }
    const { user } = auth;

    const { searchParams } = new URL(request.url);
    const keyword = searchParams.get('keyword') || undefined;
    const kind = searchParams.get('kind') || undefined;

    const items = await listDataSources({ keyword, kind });

    await logAudit({
      userId: user!.id,
      functionCode: DATA.VIEW,
      action: 'VIEW',
      resourceType: 'DATA_SOURCE_CATALOG',
      metadata: { keyword, kind, count: items.length },
      result: 'SUCCESS',
    });

    return NextResponse.json({ success: true, data: items, error: null });
  } catch (error) {
    console.error('[GET /api/bigdata/sources] error:', error);
    return NextResponse.json(
      { success: false, data: null, error: 'Lỗi hệ thống khi tải danh mục nguồn dữ liệu' },
      { status: 500 },
    );
  }
}
