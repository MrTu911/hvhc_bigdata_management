/**
 * M12 – Consolidated Infrastructure Admin Dashboard
 * GET /api/infrastructure/dashboard
 *
 * Tổng hợp toàn bộ trạng thái hạ tầng thành một response duy nhất.
 * Dùng cho admin dashboard — tất cả panel trong một lần fetch.
 *
 * Yêu cầu quyền INFRA.VIEW (read-only view tổng quan).
 * Mỗi section được fetch song song — lỗi một section không chặn section khác.
 *
 * Response:
 *   health        — metrics probe + overall level
 *   alerts        — summary ACTIVE/CRITICAL count + top 5 unresolved
 *   pipelines     — tổng pipeline, fail/pass 24h, in-progress count
 *   backup        — freshness, last completed job
 *   dq            — failing rules count by severity
 *   dr            — readiness status + last exercise
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireFunction } from '@/lib/rbac/middleware';
import { INFRA } from '@/lib/rbac/function-codes';
import { getHealthSnapshot } from '@/lib/services/infrastructure/health.service';
import { getAlertSummary, listInfraAlerts } from '@/lib/services/infrastructure/alert.service';
import { getBackupFreshnessMinutes, listBackupJobs, getDRReadiness } from '@/lib/services/infrastructure/backup.service';
import { getQualitySummaryByTable, getLatestResultPerRule } from '@/lib/services/infrastructure/data-quality.service';
import prisma from '@/lib/db';

export async function GET(req: NextRequest) {
  const auth = await requireFunction(req, INFRA.VIEW);
  if (!auth.allowed) return auth.response!;

  const startedAt = Date.now();

  // Fetch tất cả sections song song — lỗi từng section trả null thay vì crash toàn dashboard
  const [
    healthResult,
    alertSummaryResult,
    topAlertsResult,
    backupFreshnessResult,
    latestBackupResult,
    pipelineStatsResult,
    dqLatestResult,
    drReadinessResult,
  ] = await Promise.allSettled([
    getHealthSnapshot(),
    getAlertSummary(),
    listInfraAlerts({ status: 'ACTIVE', pageSize: 5, page: 1 }),
    getBackupFreshnessMinutes('POSTGRESQL_FULL'),
    listBackupJobs({ page: 1, pageSize: 1 }),
    fetchPipelineStats(),
    getLatestResultPerRule(),
    getDRReadiness(),
  ]);

  const health       = healthResult.status       === 'fulfilled' ? healthResult.value       : null;
  const alertSummary = alertSummaryResult.status === 'fulfilled' ? alertSummaryResult.value : null;
  const topAlerts    = topAlertsResult.status    === 'fulfilled' ? topAlertsResult.value    : null;
  const backupAge    = backupFreshnessResult.status === 'fulfilled' ? backupFreshnessResult.value : null;
  const latestBackup = latestBackupResult.status === 'fulfilled' ? latestBackupResult.value.jobs[0] ?? null : null;
  const pipelineStats = pipelineStatsResult.status === 'fulfilled' ? pipelineStatsResult.value : null;
  const dqLatest     = dqLatestResult.status     === 'fulfilled' ? dqLatestResult.value     : null;
  const drReadiness  = drReadinessResult.status  === 'fulfilled' ? drReadinessResult.value  : null;

  // DQ summary counts từ latest results
  const dqSummary = dqLatest ? {
    totalRules:      dqLatest.length,
    failingCritical: dqLatest.filter((r) => !r.passed && r.severity === 'CRITICAL').length,
    failingError:    dqLatest.filter((r) => !r.passed && r.severity === 'ERROR').length,
    failingTotal:    dqLatest.filter((r) => !r.passed).length,
    overallStatus:   computeDqStatus(dqLatest),
  } : null;

  return NextResponse.json({
    success: true,
    data: {
      fetchedAt:   new Date().toISOString(),
      durationMs:  Date.now() - startedAt,
      health: health ? {
        overall:  health.overall,
        checkedAt: health.checkedAt,
        metrics:  health.metrics.map((m) => ({
          name:      m.metricName,
          display:   m.displayName,
          value:     m.value,
          unit:      m.unit,
          level:     m.level,
          threshold: m.threshold,
        })),
      } : null,
      alerts: {
        summary:    alertSummary,
        topActive:  topAlerts?.alerts ?? [],
      },
      pipelines:    pipelineStats,
      backup: {
        freshnessMinutes: backupAge,
        freshnessOk:      backupAge !== null && backupAge <= 120,
        latestJob: latestBackup ? {
          id:          latestBackup.id,
          backupType:  latestBackup.backupType,
          status:      latestBackup.status,
          completedAt: latestBackup.completedAt,
          sizeBytes:   latestBackup.sizeBytes,
        } : null,
      },
      dataQuality: dqSummary,
      dr: drReadiness ? {
        overallStatus:        drReadiness.overallStatus,
        planCount:            drReadiness.planCount,
        lastExercisedAt:      drReadiness.lastExercisedAt,
        exerciseDaysAgo:      drReadiness.exerciseDaysAgo,
        lastOutcome:          drReadiness.lastOutcome,
        backupFreshnessOk:    drReadiness.backupFreshnessOk,
        lastRestoreVerifiedAt: drReadiness.lastRestoreVerifiedAt,
        rtoGap:               drReadiness.rtoGap,
        rpoGap:               drReadiness.rpoGap,
      } : null,
    },
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function fetchPipelineStats() {
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [total, inProgress, recentRuns] = await Promise.all([
    prisma.pipelineDefinition.count({ where: { isActive: true } }),
    prisma.pipelineRun.count({ where: { status: 'RUNNING' } }),
    prisma.pipelineRun.findMany({
      where:   { startedAt: { gte: since24h } },
      select:  { status: true },
    }),
  ]);

  const completed = recentRuns.filter((r) => r.status === 'COMPLETED').length;
  const failed    = recentRuns.filter((r) => r.status === 'FAILED').length;
  const total24h  = recentRuns.length;

  return {
    activeDefinitions: total,
    inProgress,
    last24h: {
      total:     total24h,
      completed,
      failed,
      failRate:  total24h > 0 ? Math.round((failed / total24h) * 100) : 0,
    },
  };
}

function computeDqStatus(
  results: Array<{ passed: boolean; severity: string }>,
): 'HEALTHY' | 'ERROR' | 'CRITICAL' | 'WARNING' {
  if (results.some((r) => !r.passed && r.severity === 'CRITICAL')) return 'CRITICAL';
  if (results.some((r) => !r.passed && r.severity === 'ERROR'))    return 'ERROR';
  if (results.some((r) => !r.passed))                             return 'WARNING';
  return 'HEALTHY';
}
