import { requireFunction } from "@/lib/rbac/middleware";
import { SYSTEM } from "@/lib/rbac/function-codes";

import { NextRequest, NextResponse } from 'next/server';
import { HealthCheckService } from '@/lib/monitoring/health-check';

/**
 * GET /api/system/health/history - Get health check history
 * RBAC: SYSTEM.VIEW_SYSTEM_HEALTH
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireFunction(request, SYSTEM.VIEW_SYSTEM_HEALTH);
    if (!authResult.allowed) {
      return authResult.response;
    }

    const { searchParams } = new URL(request.url);
    const serviceName = searchParams.get('service') || undefined;
    const hours = parseInt(searchParams.get('hours') || '24');
    
    const history = await HealthCheckService.getHealthHistory(serviceName, hours);
    
    return NextResponse.json({
      success: true,
      data: history,
      count: history.length
    });
  } catch (error: any) {
    console.error('Error fetching health history:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
