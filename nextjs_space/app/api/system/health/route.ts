import { requireFunction } from "@/lib/rbac/middleware";
import { SYSTEM } from "@/lib/rbac/function-codes";

import { NextRequest, NextResponse } from 'next/server';
import { HealthCheckService } from '@/lib/monitoring/health-check';

/**
 * GET /api/system/health - Get system health status
 * RBAC: SYSTEM.VIEW_SYSTEM_HEALTH
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireFunction(request, SYSTEM.VIEW_SYSTEM_HEALTH);
    if (!authResult.allowed) {
      return authResult.response;
    }

    const { searchParams } = new URL(request.url);
    const detailed = searchParams.get('detailed') === 'true';
    
    if (detailed) {
      const health = await HealthCheckService.getSystemHealth();
      
      return NextResponse.json({
        success: true,
        data: health
      });
    } else {
      // Quick health check
      const checks = await HealthCheckService.runAllChecks();
      const isHealthy = checks.every(c => c.status === 'healthy' || c.status === 'degraded');
      
      return NextResponse.json({
        success: true,
        status: isHealthy ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error: any) {
    console.error('Error checking system health:', error);
    return NextResponse.json(
      { success: false, error: error.message, status: 'unhealthy' },
      { status: 500 }
    );
  }
}
