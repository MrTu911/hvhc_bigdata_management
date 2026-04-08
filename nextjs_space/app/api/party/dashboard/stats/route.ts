/**
 * API: Party Dashboard Stats (UC-72)
 * Path: /api/party/dashboard/stats
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireAnyFunction } from '@/lib/rbac/middleware';
import { PARTY } from '@/lib/rbac/function-codes';
import { PartyDashboardService } from '@/lib/services/party/party-dashboard.service';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAnyFunction(request, [PARTY.VIEW_DASHBOARD, PARTY.VIEW]);
    if (!authResult.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : new Date().getFullYear();
    const orgId = searchParams.get('orgId') || undefined;

    const stats = await PartyDashboardService.getDashboardStats(year, orgId);

    return NextResponse.json(stats);
  } catch (error) {
    console.error('[Party Dashboard Stats GET]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
