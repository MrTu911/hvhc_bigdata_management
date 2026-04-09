/**
 * M18 Analytics API – Per-template detail
 * GET /api/templates/analytics/[templateId]
 *
 * Query params:
 *   days = 7 | 30 | 90 (default 30)
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireScopedFunction } from '@/lib/rbac/middleware';
import { TEMPLATES } from '@/lib/rbac/function-codes';
import { getTemplateAnalyticsDetail } from '@/lib/services/template/template-analytics.service';

const VALID_DAYS = [7, 30, 90] as const;
type Days = (typeof VALID_DAYS)[number];

export async function GET(
  request: NextRequest,
  { params }: { params: { templateId: string } },
) {
  try {
    const { user, response } = await requireScopedFunction(request, TEMPLATES.VIEW_ANALYTICS);
    if (!user) return response!;

    const { searchParams } = new URL(request.url);
    const rawDays = parseInt(searchParams.get('days') ?? '30');
    const days: Days = (VALID_DAYS.includes(rawDays as Days) ? rawDays : 30) as Days;

    const detail = await getTemplateAnalyticsDetail(params.templateId, days);
    if (!detail) {
      return NextResponse.json(
        { success: false, data: null, error: 'Template không tồn tại' },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, data: detail, error: null });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Lỗi lấy analytics';
    console.error('[GET /api/templates/analytics/[templateId]]', error);
    return NextResponse.json({ success: false, data: null, error: msg }, { status: 500 });
  }
}
