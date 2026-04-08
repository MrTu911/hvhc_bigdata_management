/**
 * API Route: System Statistics
 * GET /api/monitoring/stats - Get aggregated system statistics
 * RBAC: MONITORING.VIEW_SERVICES
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireFunction } from '@/lib/rbac/middleware';
import { MONITORING } from '@/lib/rbac/function-codes';
import { prisma as db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireFunction(request, MONITORING.VIEW_SERVICES);
    if (!authResult.allowed) {
      return authResult.response;
    }

    // Calculate various system statistics
    
    // 1. Request statistics (mock - in production would come from logs/metrics)
    const totalRequests = Math.floor(Math.random() * 50000) + 10000;
    const successRate = 95 + Math.random() * 4;
    const avgResponseTime = Math.floor(Math.random() * 100) + 50;

    // 2. Active users (sessions in last hour)
    let activeUsers = 0;
    try {
      const result = await db.$queryRaw<any[]>`
        SELECT COUNT(DISTINCT user_id)::int as count
        FROM login_audit
        WHERE login_time > NOW() - INTERVAL '1 hour'
          AND status = 'success'
      `;
      activeUsers = result[0]?.count || 0;
    } catch (error) {
      console.warn('Failed to get active users:', error);
    }

    // 3. Queue size (pending ETL jobs)
    let queueSize = 0;
    try {
      const result = await db.$queryRaw<any[]>`
        SELECT COUNT(*)::int as count
        FROM etl_executions
        WHERE execution_status = 'pending'
      `;
      queueSize = result[0]?.count || 0;
    } catch (error) {
      console.warn('Failed to get queue size:', error);
    }

    // 4. Data processing stats
    let dataStats = {
      totalDatasets: 0,
      processingJobs: 0,
      completedToday: 0
    };
    try {
      const dataResult = await db.$queryRaw<any[]>`
        SELECT 
          (SELECT COUNT(*)::int FROM datasets) as total_datasets,
          (SELECT COUNT(*)::int FROM etl_executions WHERE execution_status = 'running') as processing_jobs,
          (SELECT COUNT(*)::int FROM etl_executions 
           WHERE execution_status = 'completed' 
           AND created_at > CURRENT_DATE) as completed_today
      `;
      if (dataResult && dataResult[0]) {
        dataStats = {
          totalDatasets: dataResult[0].total_datasets || 0,
          processingJobs: dataResult[0].processing_jobs || 0,
          completedToday: dataResult[0].completed_today || 0
        };
      }
    } catch (error) {
      console.warn('Failed to get data stats:', error);
    }

    // 5. ML training stats
    let mlStats = {
      activeTraining: 0,
      completedToday: 0,
      failedToday: 0
    };
    try {
      const mlResult = await db.$queryRaw<any[]>`
        SELECT 
          (SELECT COUNT(*)::int FROM ml_runs WHERE status = 'RUNNING') as active_training,
          (SELECT COUNT(*)::int FROM ml_runs 
           WHERE status = 'FINISHED' 
           AND start_time > EXTRACT(EPOCH FROM CURRENT_DATE) * 1000) as completed_today,
          (SELECT COUNT(*)::int FROM ml_runs 
           WHERE status = 'FAILED' 
           AND start_time > EXTRACT(EPOCH FROM CURRENT_DATE) * 1000) as failed_today
      `;
      if (mlResult && mlResult[0]) {
        mlStats = {
          activeTraining: mlResult[0].active_training || 0,
          completedToday: mlResult[0].completed_today || 0,
          failedToday: mlResult[0].failed_today || 0
        };
      }
    } catch (error) {
      console.warn('Failed to get ML stats:', error);
    }

    return NextResponse.json({
      success: true,
      stats: {
        totalRequests,
        successRate,
        avgResponseTime,
        activeUsers,
        queueSize,
        ...dataStats,
        ...mlStats,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error('System stats error:', error);
    return NextResponse.json(
      { error: 'Failed to get system statistics', details: error.message },
      { status: 500 }
    );
  }
}
