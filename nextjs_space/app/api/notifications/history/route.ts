/**
 * API Route: Notification History
 * GET /api/notifications/history - Get notification history with filters
 * RBAC: SYSTEM.VIEW_SYSTEM_STATS
 */

import { NextRequest, NextResponse } from 'next/server';
import { getNotificationHistory, getNotificationStats } from '@/lib/notifications/history';
import { requireFunction } from '@/lib/rbac/middleware';
import { SYSTEM } from '@/lib/rbac/function-codes';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireFunction(request, SYSTEM.VIEW_SYSTEM_STATS);
    if (!authResult.allowed) {
      return authResult.response;
    }

    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action') || 'list';

    if (action === 'stats') {
      const timeRange = searchParams.get('timeRange') as 'today' | 'week' | 'month' || 'week';
      const stats = await getNotificationStats(timeRange);
      return NextResponse.json({ stats });
    }

    // Get list with filters
    const filters = {
      type: searchParams.get('type') || undefined,
      recipient: searchParams.get('recipient') || undefined,
      status: searchParams.get('status') || undefined,
      startDate: searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined,
      endDate: searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0,
    };

    const history = await getNotificationHistory(filters);

    return NextResponse.json({
      success: true,
      data: history,
      filters,
    });
  } catch (error: any) {
    console.error('Notification history error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notification history', details: error.message },
      { status: 500 }
    );
  }
}
