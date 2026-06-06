/**
 * M18 — Admin-Doc Group KPI API
 * GET /api/templates/admin-docs/kpis
 *
 * KPI/analytics cho nhóm mẫu văn bản hành chính (Nghị định 30/2020):
 * độ phủ thể thức theo module + thống kê sử dụng.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireScopedFunction } from '@/lib/rbac/middleware';
import { TEMPLATES } from '@/lib/rbac/function-codes';
import { getAdminDocGroupKpis } from '@/lib/services/template/admin-doc-kpi.service';

export async function GET(request: NextRequest) {
  try {
    const { user, response } = await requireScopedFunction(request, TEMPLATES.VIEW_ANALYTICS);
    if (!user) return response!;

    const data = await getAdminDocGroupKpis();
    return NextResponse.json({ success: true, data, error: null });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Lỗi lấy KPI nhóm mẫu văn bản';
    console.error('[GET /api/templates/admin-docs/kpis]', error);
    return NextResponse.json({ success: false, data: null, error: msg }, { status: 500 });
  }
}
