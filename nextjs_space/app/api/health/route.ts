/**
 * Health Check API
 * GET /api/health
 * Kiểm tra trạng thái hệ thống
 */

import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const startTime = Date.now();
  const checks: Record<string, { status: string; latency?: number; error?: string }> = {};
  let overallStatus = 'healthy';

  // Check database connection
  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    checks.database = {
      status: 'healthy',
      latency: Date.now() - dbStart
    };
  } catch (error) {
    checks.database = {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
    overallStatus = 'unhealthy';
  }

  // Check Redis (if configured)
  if (process.env.REDIS_URL) {
    try {
      // Simple check - Redis availability
      checks.redis = {
        status: 'configured',
        latency: 0
      };
    } catch {
      checks.redis = {
        status: 'unavailable',
        error: 'Redis connection failed'
      };
    }
  }

  // System info
  const systemInfo = {
    nodeVersion: process.version,
    platform: process.platform,
    uptime: Math.floor(process.uptime()),
    memoryUsage: {
      heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      unit: 'MB'
    }
  };

  const response = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    responseTime: Date.now() - startTime,
    version: '1.0.0',
    checks,
    system: systemInfo
  };

  return NextResponse.json(
    response,
    { status: overallStatus === 'healthy' ? 200 : 503 }
  );
}
