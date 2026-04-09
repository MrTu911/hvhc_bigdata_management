/**
 * M18 Analytics API
 * GET /api/templates/analytics
 *
 * Query params:
 *   days   = 7 | 30 | 90  (default 30)
 *   top    = number        (default 10, max 20)
 *
 * Response:
 *   summary     – KPI cards
 *   dailyTrend  – chart data by day
 *   topTemplates – ranked list
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireScopedFunction } from '@/lib/rbac/middleware';
import { TEMPLATES } from '@/lib/rbac/function-codes';
import {
  getAnalyticsSummary,
  getDailyTrend,
  getTopTemplates,
  getFormatBreakdown,
} from '@/lib/services/template/template-analytics.service';

const VALID_DAYS = [7, 30, 90] as const;
type Days = (typeof VALID_DAYS)[number];

export async function GET(request: NextRequest) {
  try {
    const { user, response } = await requireScopedFunction(request, TEMPLATES.VIEW_ANALYTICS);
    if (!user) return response!;

    const { searchParams } = new URL(request.url);

    const rawDays = parseInt(searchParams.get('days') ?? '30');
    const days: Days = (VALID_DAYS.includes(rawDays as Days) ? rawDays : 30) as Days;

    const rawTop = parseInt(searchParams.get('top') ?? '10');
    const top = Math.min(Math.max(rawTop, 1), 20);

    const [summary, dailyTrend, topTemplates, formatBreakdown] = await Promise.all([
      getAnalyticsSummary(),
      getDailyTrend(days),
      getTopTemplates(top, days),
      getFormatBreakdown(days),
    ]);

    return NextResponse.json({
      success: true,
      data: { summary, dailyTrend, topTemplates, formatBreakdown, days },
      error: null,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Lỗi lấy analytics';
    console.error('[GET /api/templates/analytics]', error);
    return NextResponse.json({ success: false, data: null, error: msg }, { status: 500 });
  }
}
