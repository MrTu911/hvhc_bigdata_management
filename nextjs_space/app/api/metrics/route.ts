/**
 * Prometheus Metrics Endpoint
 * GET /api/metrics - Export metrics in Prometheus format
 * RBAC: SYSTEM.VIEW_SYSTEM_STATS
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma as db } from '@/lib/db';
import { requireFunction } from '@/lib/rbac/middleware';
import { SYSTEM } from '@/lib/rbac/function-codes';

// Prometheus text format
function formatPrometheusMetrics(metrics: any[]): string {
  const lines: string[] = [];
  
  // Add header
  lines.push('# HELP hvhc_metrics HVHC Big Data System Metrics');
  lines.push('# TYPE hvhc_metrics gauge');
  lines.push('');
  
  for (const metric of metrics) {
    const labels = Object.entries(metric.labels || {})
      .map(([k, v]) => `${k}="${v}"`)
      .join(',');
    
    const metricLine = labels 
      ? `${metric.name}{${labels}} ${metric.value} ${metric.timestamp}`
      : `${metric.name} ${metric.value} ${metric.timestamp}`;
    
    lines.push(metricLine);
  }
  
  return lines.join('\n');
}

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireFunction(request, SYSTEM.VIEW_SYSTEM_STATS);
    if (!authResult.allowed) {
      return authResult.response;
    }

    // Collect various system metrics
    const metrics: any[] = [];
    const now = Date.now();
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    // 1. User metrics using Prisma ORM
    try {
      const [totalUsers, activeUsers, newUsers] = await Promise.all([
        db.user.count(),
        db.user.count({ where: { status: 'ACTIVE' } }),
        db.user.count({ where: { createdAt: { gte: yesterday } } })
      ]);
      
      metrics.push(
        { name: 'hvhc_users_total', value: totalUsers, labels: {}, timestamp: now },
        { name: 'hvhc_users_active', value: activeUsers, labels: {}, timestamp: now },
        { name: 'hvhc_users_new_24h', value: newUsers, labels: {}, timestamp: now }
      );
    } catch (error) {
      console.warn('Failed to fetch user metrics:', error);
    }
    
    // 2. Data Files metrics (ResearchFile)
    try {
      const [totalFiles, totalSize, newFiles] = await Promise.all([
        db.researchFile.count(),
        db.researchFile.aggregate({ _sum: { fileSize: true } }),
        db.researchFile.count({ where: { uploadedAt: { gte: yesterday } } })
      ]);
      
      metrics.push(
        { name: 'hvhc_datasets_total', value: totalFiles, labels: {}, timestamp: now },
        { name: 'hvhc_data_size_bytes', value: totalSize._sum.fileSize || 0, labels: {}, timestamp: now },
        { name: 'hvhc_datasets_new_24h', value: newFiles, labels: {}, timestamp: now }
      );
    } catch (error) {
      console.warn('Failed to fetch dataset metrics:', error);
    }
    
    // 3. ML Model metrics
    try {
      const [totalModels, deployedModels] = await Promise.all([
        db.mLModel.count(),
        db.mLModel.count({ where: { status: 'DEPLOYED' } })
      ]);
      
      metrics.push(
        { name: 'hvhc_ml_models_total', value: totalModels, labels: {}, timestamp: now },
        { name: 'hvhc_ml_models_deployed', value: deployedModels, labels: {}, timestamp: now }
      );
    } catch (error) {
      console.warn('Failed to fetch ML metrics:', error);
    }
    
    // 4. Department metrics
    try {
      const [totalDepartments, activeDepartments] = await Promise.all([
        db.department.count(),
        db.department.count({ where: { isActive: true } })
      ]);
      
      metrics.push(
        { name: 'hvhc_departments_total', value: totalDepartments, labels: {}, timestamp: now },
        { name: 'hvhc_departments_active', value: activeDepartments, labels: {}, timestamp: now }
      );
    } catch (error) {
      console.warn('Failed to fetch department metrics:', error);
    }
    
    // 5. Unit metrics
    try {
      const [totalUnits, activeUnits] = await Promise.all([
        db.unit.count(),
        db.unit.count({ where: { active: true } })
      ]);
      
      metrics.push(
        { name: 'hvhc_units_total', value: totalUnits, labels: {}, timestamp: now },
        { name: 'hvhc_units_active', value: activeUnits, labels: {}, timestamp: now }
      );
    } catch (error) {
      console.warn('Failed to fetch unit metrics:', error);
    }
    
    // 6. Permission Grant metrics
    try {
      const [totalGrants, activeGrants] = await Promise.all([
        db.userPermissionGrant.count(),
        db.userPermissionGrant.count({
          where: {
            isRevoked: false,
            OR: [
              { expiresAt: null },
              { expiresAt: { gt: new Date() } }
            ]
          }
        })
      ]);
      
      metrics.push(
        { name: 'hvhc_permission_grants_total', value: totalGrants, labels: {}, timestamp: now },
        { name: 'hvhc_permission_grants_active', value: activeGrants, labels: {}, timestamp: now }
      );
    } catch (error) {
      console.warn('Failed to fetch permission metrics:', error);
    }
    
    // 7. System health metrics
    metrics.push({
      name: 'hvhc_system_uptime_seconds',
      value: Math.floor(process.uptime()),
      labels: {},
      timestamp: now
    });
    
    const memUsage = process.memoryUsage();
    metrics.push(
      { name: 'hvhc_memory_usage_bytes', value: memUsage.heapUsed, labels: { type: 'heap_used' }, timestamp: now },
      { name: 'hvhc_memory_usage_bytes', value: memUsage.heapTotal, labels: { type: 'heap_total' }, timestamp: now },
      { name: 'hvhc_memory_usage_bytes', value: memUsage.rss, labels: { type: 'rss' }, timestamp: now }
    );
    
    // Format and return metrics
    const prometheusFormat = formatPrometheusMetrics(metrics);
    
    return new NextResponse(prometheusFormat, {
      headers: {
        'Content-Type': 'text/plain; version=0.0.4',
      },
    });
    
  } catch (error: any) {
    console.error('Metrics collection error:', error);
    return new NextResponse(`# Error: ${error.message}`, {
      status: 500,
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  }
}
