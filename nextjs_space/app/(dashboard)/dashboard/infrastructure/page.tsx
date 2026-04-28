'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Activity, Database, HardDrive, Shield, AlertTriangle,
  CheckCircle2, XCircle, RefreshCw, Clock, Server, Bell, Heart,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PipelineSummary {
  id: string; name: string; pipelineType: string;
  isActive: boolean; lastRunAt: string | null; lastRunStatus: string | null;
}

interface DQTableSummary {
  targetTable: string; totalRules: number; failingRules: number;
  lastCheckedAt: string | null;
}

interface BackupJob {
  id: string; backupType: string; status: string;
  startedAt: string | null; completedAt: string | null; sizeBytes: string | null;
}

interface RestoreJob {
  id: string; targetEnvironment: string; status: string;
  requestedById: string; startedAt: string | null; verificationStatus: string;
  backupJob: { backupType: string; completedAt: string | null };
}

interface DRReadiness {
  planCount: number; lastExercisedAt: string | null;
  lastOutcome: string | null; rtoGap: number | null; rpoGap: number | null;
}

interface StorageBucket {
  id: string; bucketName: string; moduleDomain: string;
  retentionDays: number | null; accessTier: string; isActive: boolean;
}

interface ThresholdPolicy {
  id: string; metricName: string; displayName: string;
  warningThreshold: number; criticalThreshold: number; unit: string | null;
  autoAction: string | null;
}

interface BackupFreshness { freshnessMinutes: number | null; }

interface SyncJob {
  id: string; sourceTable: string; targetDataset: string;
  syncMode: string; status: string; isActive: boolean;
  lastSyncAt: string | null; lastSyncRowCount: number | null;
  lastSyncDurationMs: number | null; errorMessage: string | null;
}

interface WarehouseStatus {
  totalActive: number; running: number; failed: number;
  staleCount: number; failRate: number;
  staleJobs: Pick<SyncJob, 'id' | 'sourceTable' | 'targetDataset' | 'lastSyncAt' | 'status'>[];
}

type HealthLevel = 'OK' | 'WARNING' | 'CRITICAL' | 'UNKNOWN';

interface MetricReading {
  metricName: string; displayName: string;
  value: number | null; unit: string | null;
  level: HealthLevel;
  threshold: { warning: number; critical: number } | null;
}

interface HealthSnapshot {
  checkedAt: string;
  overall: HealthLevel;
  metrics: MetricReading[];
}

interface InfraAlert {
  id: string; title: string; message: string;
  severity: string; status: string;
  triggeredAt: string;
  acknowledgedAt: string | null; acknowledgedBy: string | null;
  service: { id: string; name: string; type: string } | null;
}

interface AlertSummary {
  active: number; acknowledged: number; critical: number; warning: number;
}

// ─── Status helpers ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    COMPLETED:    'bg-green-100 text-green-800',
    RUNNING:      'bg-blue-100 text-blue-800',
    FAILED:       'bg-red-100 text-red-800',
    PENDING:      'bg-yellow-100 text-yellow-800',
    CANCELLED:    'bg-gray-100 text-gray-700',
    PASS:         'bg-green-100 text-green-800',
    PARTIAL:      'bg-yellow-100 text-yellow-800',
    FAIL:         'bg-red-100 text-red-800',
    ACTIVE:       'bg-red-100 text-red-800',
    ACKNOWLEDGED: 'bg-yellow-100 text-yellow-800',
    RESOLVED:     'bg-green-100 text-green-800',
  };
  return (
    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${map[status] ?? 'bg-gray-100 text-gray-700'}`}>
      {status}
    </span>
  );
}

function HealthLevelBadge({ level }: { level: HealthLevel }) {
  const map: Record<HealthLevel, string> = {
    OK:       'bg-green-100 text-green-800',
    WARNING:  'bg-yellow-100 text-yellow-800',
    CRITICAL: 'bg-red-100 text-red-800',
    UNKNOWN:  'bg-gray-100 text-gray-600',
  };
  return (
    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${map[level]}`}>
      {level}
    </span>
  );
}

function FreshnessAlert({ minutes }: { minutes: number | null }) {
  if (minutes === null) return <span className="text-red-600 text-sm font-medium">Chưa có backup</span>;
  if (minutes > 90) return <span className="text-red-600 text-sm font-medium">{minutes} phút — CRITICAL</span>;
  if (minutes > 60) return <span className="text-yellow-600 text-sm font-medium">{minutes} phút — WARNING</span>;
  return <span className="text-green-600 text-sm font-medium">{minutes} phút — OK</span>;
}

// ─── Section components ───────────────────────────────────────────────────────

function PipelinesTab({
  pipelines, onRefresh,
}: { pipelines: PipelineSummary[]; onRefresh: () => void }) {
  const [triggering, setTriggering] = useState<string | null>(null);
  const [toggling,   setToggling]   = useState<string | null>(null);

  const triggerRun = async (definitionId: string) => {
    setTriggering(definitionId);
    try {
      const res  = await fetch('/api/infrastructure/pipelines', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ action: 'trigger', definitionId }),
      });
      const data = await res.json();
      if (!data.success) alert(data.error);
      else onRefresh();
    } finally {
      setTriggering(null);
    }
  };

  const toggleActive = async (id: string, currentActive: boolean) => {
    setToggling(id);
    try {
      const res  = await fetch('/api/infrastructure/pipelines', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ id, isActive: !currentActive }),
      });
      const data = await res.json();
      if (!data.success) alert(data.error);
      else onRefresh();
    } finally {
      setToggling(null);
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-muted-foreground">
            <th className="pb-2 pr-4">Tên</th>
            <th className="pb-2 pr-4">Loại</th>
            <th className="pb-2 pr-4">Trạng thái lần cuối</th>
            <th className="pb-2 pr-4">Chạy lần cuối</th>
            <th className="pb-2">Hành động</th>
          </tr>
        </thead>
        <tbody>
          {pipelines.length === 0 && (
            <tr><td colSpan={5} className="py-6 text-center text-muted-foreground">Chưa có pipeline nào</td></tr>
          )}
          {pipelines.map((p) => (
            <tr key={p.id} className={`border-b last:border-0 ${!p.isActive ? 'opacity-50' : ''}`}>
              <td className="py-2 pr-4 font-medium">
                {p.name}
                {!p.isActive && <span className="ml-2 text-xs text-muted-foreground">(disabled)</span>}
              </td>
              <td className="py-2 pr-4 text-muted-foreground">{p.pipelineType}</td>
              <td className="py-2 pr-4">
                {p.lastRunStatus ? <StatusBadge status={p.lastRunStatus} /> : <span className="text-muted-foreground">—</span>}
              </td>
              <td className="py-2 pr-4 text-muted-foreground">
                {p.lastRunAt ? new Date(p.lastRunAt).toLocaleString('vi-VN') : '—'}
              </td>
              <td className="py-2 flex gap-2">
                {p.isActive && (
                  <Button
                    size="sm" variant="outline"
                    disabled={triggering === p.id || toggling === p.id}
                    onClick={() => triggerRun(p.id)}
                  >
                    {triggering === p.id ? <RefreshCw className="h-3 w-3 animate-spin" /> : 'Chạy'}
                  </Button>
                )}
                <Button
                  size="sm"
                  variant={p.isActive ? 'destructive' : 'outline'}
                  disabled={toggling === p.id || triggering === p.id}
                  onClick={() => toggleActive(p.id, p.isActive)}
                  title={p.isActive ? 'Disable pipeline (emergency stop)' : 'Enable pipeline'}
                >
                  {toggling === p.id
                    ? <RefreshCw className="h-3 w-3 animate-spin" />
                    : p.isActive ? 'Disable' : 'Enable'
                  }
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function WarehouseTab({
  status, jobs,
}: { status: WarehouseStatus | null; jobs: SyncJob[] }) {
  const syncStatusColor: Record<string, string> = {
    IDLE:      'bg-gray-100 text-gray-700',
    RUNNING:   'bg-blue-100 text-blue-800',
    COMPLETED: 'bg-green-100 text-green-800',
    FAILED:    'bg-red-100 text-red-800',
  };

  return (
    <div className="space-y-6">
      {status && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded border p-3">
            <p className="text-xs text-muted-foreground">Tổng sync job</p>
            <p className="text-xl font-bold mt-1">{status.totalActive}</p>
          </div>
          <div className="rounded border p-3">
            <p className="text-xs text-muted-foreground">Đang chạy</p>
            <p className={`text-xl font-bold mt-1 ${status.running > 0 ? 'text-blue-600' : ''}`}>
              {status.running}
            </p>
          </div>
          <div className="rounded border p-3">
            <p className="text-xs text-muted-foreground">Lỗi</p>
            <p className={`text-xl font-bold mt-1 ${status.failed > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {status.failed}
            </p>
          </div>
          <div className="rounded border p-3">
            <p className="text-xs text-muted-foreground">Stale (≥2h)</p>
            <p className={`text-xl font-bold mt-1 ${status.staleCount > 0 ? 'text-yellow-600' : ''}`}>
              {status.staleCount}
            </p>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th className="pb-2 pr-4">Bảng nguồn (PG)</th>
              <th className="pb-2 pr-4">Dataset đích (CH)</th>
              <th className="pb-2 pr-4">Mode</th>
              <th className="pb-2 pr-4">Trạng thái</th>
              <th className="pb-2 pr-4">Sync lần cuối</th>
              <th className="pb-2">Rows</th>
            </tr>
          </thead>
          <tbody>
            {jobs.length === 0 && (
              <tr>
                <td colSpan={6} className="py-6 text-center text-muted-foreground">
                  Chưa có sync job nào
                </td>
              </tr>
            )}
            {jobs.map((j) => (
              <tr key={j.id} className={`border-b last:border-0 ${!j.isActive ? 'opacity-50' : ''}`}>
                <td className="py-2 pr-4 font-medium font-mono text-xs">{j.sourceTable}</td>
                <td className="py-2 pr-4 text-muted-foreground font-mono text-xs">{j.targetDataset}</td>
                <td className="py-2 pr-4">
                  <span className="text-xs px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">{j.syncMode}</span>
                </td>
                <td className="py-2 pr-4">
                  <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${syncStatusColor[j.status] ?? 'bg-gray-100 text-gray-700'}`}>
                    {j.status}
                  </span>
                  {j.errorMessage && (
                    <p className="text-xs text-red-600 mt-0.5 max-w-[160px] truncate" title={j.errorMessage}>
                      {j.errorMessage}
                    </p>
                  )}
                </td>
                <td className="py-2 pr-4 text-muted-foreground text-xs">
                  {j.lastSyncAt ? new Date(j.lastSyncAt).toLocaleString('vi-VN') : '—'}
                  {j.lastSyncDurationMs && (
                    <span className="ml-1 text-muted-foreground">
                      ({(j.lastSyncDurationMs / 1000).toFixed(1)}s)
                    </span>
                  )}
                </td>
                <td className="py-2 text-muted-foreground">
                  {j.lastSyncRowCount?.toLocaleString() ?? '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function HealthTab({ snapshot }: { snapshot: HealthSnapshot | null }) {
  const levelBorder: Record<HealthLevel, string> = {
    OK:       'border-green-200 bg-green-50',
    WARNING:  'border-yellow-200 bg-yellow-50',
    CRITICAL: 'border-red-200 bg-red-50',
    UNKNOWN:  'border-gray-200 bg-gray-50',
  };

  const valueColor: Record<HealthLevel, string> = {
    OK:       'text-green-700',
    WARNING:  'text-yellow-700',
    CRITICAL: 'text-red-700',
    UNKNOWN:  'text-gray-500',
  };

  if (!snapshot) {
    return <p className="text-muted-foreground text-sm py-6 text-center">Đang tải health metrics...</p>;
  }

  return (
    <div className="space-y-4">
      {/* Overall */}
      <div className={`flex items-center gap-3 rounded border px-4 py-3 ${levelBorder[snapshot.overall]}`}>
        <Heart className={`h-5 w-5 ${valueColor[snapshot.overall]}`} />
        <div>
          <p className="text-sm font-semibold">Tổng quan hệ thống</p>
          <div className="flex items-center gap-2 mt-0.5">
            <HealthLevelBadge level={snapshot.overall} />
            <span className="text-xs text-muted-foreground">
              Cập nhật: {new Date(snapshot.checkedAt).toLocaleString('vi-VN')}
            </span>
          </div>
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {snapshot.metrics.map((m) => (
          <div key={m.metricName} className={`rounded border p-4 ${levelBorder[m.level]}`}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium">{m.displayName}</p>
              <HealthLevelBadge level={m.level} />
            </div>
            <p className={`text-2xl font-bold ${valueColor[m.level]}`}>
              {m.value !== null ? `${m.value}${m.unit ?? ''}` : '—'}
            </p>
            {m.threshold && (
              <p className="text-xs text-muted-foreground mt-1">
                Warning ≥ {m.threshold.warning}{m.unit ?? ''} · Critical ≥ {m.threshold.critical}{m.unit ?? ''}
              </p>
            )}
            {m.value === null && (
              <p className="text-xs text-muted-foreground mt-1">Không lấy được metric</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function AlertsTab({
  alerts, summary, onRefresh,
}: { alerts: InfraAlert[]; summary: AlertSummary | null; onRefresh: () => void }) {
  const [acking, setAcking] = useState<string | null>(null);

  const severityColor: Record<string, string> = {
    CRITICAL: 'bg-red-100 text-red-800',
    ERROR:    'bg-orange-100 text-orange-800',
    WARNING:  'bg-yellow-100 text-yellow-800',
    INFO:     'bg-blue-100 text-blue-800',
  };

  const acknowledge = async (alertId: string) => {
    setAcking(alertId);
    try {
      const res  = await fetch(`/api/infrastructure/alerts/${alertId}/ack`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ action: 'acknowledge' }),
      });
      const data = await res.json();
      if (!data.success) alert(data.error);
      else onRefresh();
    } finally {
      setAcking(null);
    }
  };

  const resolve = async (alertId: string) => {
    setAcking(alertId);
    try {
      const res  = await fetch(`/api/infrastructure/alerts/${alertId}/ack`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ action: 'resolve' }),
      });
      const data = await res.json();
      if (!data.success) alert(data.error);
      else onRefresh();
    } finally {
      setAcking(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Summary */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded border p-3">
            <p className="text-xs text-muted-foreground">Active</p>
            <p className={`text-xl font-bold mt-1 ${summary.active > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {summary.active}
            </p>
          </div>
          <div className="rounded border p-3">
            <p className="text-xs text-muted-foreground">Đã acknowledge</p>
            <p className="text-xl font-bold mt-1 text-yellow-600">{summary.acknowledged}</p>
          </div>
          <div className="rounded border p-3">
            <p className="text-xs text-muted-foreground">Critical</p>
            <p className={`text-xl font-bold mt-1 ${summary.critical > 0 ? 'text-red-700' : ''}`}>
              {summary.critical}
            </p>
          </div>
          <div className="rounded border p-3">
            <p className="text-xs text-muted-foreground">Warning</p>
            <p className={`text-xl font-bold mt-1 ${summary.warning > 0 ? 'text-yellow-700' : ''}`}>
              {summary.warning}
            </p>
          </div>
        </div>
      )}

      {/* Alert list */}
      {alerts.length === 0 ? (
        <div className="flex items-center justify-center py-10 text-muted-foreground gap-2">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          <span>Không có cảnh báo nào đang active</span>
        </div>
      ) : (
        <div className="space-y-2">
          {alerts.map((a) => (
            <div key={a.id} className="rounded border px-4 py-3 flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className={`text-xs px-2 py-0.5 rounded font-medium ${severityColor[a.severity] ?? 'bg-gray-100 text-gray-700'}`}>
                    {a.severity}
                  </span>
                  <StatusBadge status={a.status} />
                  {a.service && (
                    <span className="text-xs text-muted-foreground">{a.service.name}</span>
                  )}
                </div>
                <p className="font-medium text-sm">{a.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{a.message}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(a.triggeredAt).toLocaleString('vi-VN')}
                  {a.acknowledgedAt && (
                    <span className="ml-2">· Acknowledged {new Date(a.acknowledgedAt).toLocaleString('vi-VN')}</span>
                  )}
                </p>
              </div>
              {a.status !== 'RESOLVED' && (
                <div className="flex gap-2 shrink-0">
                  {a.status === 'ACTIVE' && (
                    <Button
                      size="sm" variant="outline"
                      disabled={acking === a.id}
                      onClick={() => acknowledge(a.id)}
                    >
                      {acking === a.id ? <RefreshCw className="h-3 w-3 animate-spin" /> : 'Ack'}
                    </Button>
                  )}
                  <Button
                    size="sm" variant="outline"
                    disabled={acking === a.id}
                    onClick={() => resolve(a.id)}
                    className="text-green-700 hover:text-green-800"
                  >
                    {acking === a.id ? <RefreshCw className="h-3 w-3 animate-spin" /> : 'Resolve'}
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DataQualityTab({ summary }: { summary: DQTableSummary[] }) {
  return (
    <div className="space-y-3">
      {summary.length === 0 && (
        <p className="text-center text-muted-foreground py-6">Chưa có data quality rules</p>
      )}
      {summary.map((s) => (
        <div key={s.targetTable} className="flex items-center justify-between rounded border px-4 py-3">
          <div>
            <p className="font-medium text-sm">{s.targetTable}</p>
            <p className="text-xs text-muted-foreground">
              {s.totalRules} rules · Kiểm tra lần cuối:{' '}
              {s.lastCheckedAt ? new Date(s.lastCheckedAt).toLocaleString('vi-VN') : 'Chưa có'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {s.failingRules === 0
              ? <CheckCircle2 className="h-4 w-4 text-green-600" />
              : <XCircle      className="h-4 w-4 text-red-600" />
            }
            <span className={`text-sm font-medium ${s.failingRules > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {s.failingRules === 0 ? 'OK' : `${s.failingRules} rule lỗi`}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function BackupsTab({
  jobs, freshness, restoreJobs,
}: { jobs: BackupJob[]; freshness: BackupFreshness; restoreJobs: RestoreJob[] }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 rounded border px-4 py-3 bg-muted/30">
        <Clock className="h-5 w-5 text-muted-foreground" />
        <div>
          <p className="text-sm font-medium">Backup gần nhất (PostgreSQL Full)</p>
          <FreshnessAlert minutes={freshness.freshnessMinutes} />
        </div>
      </div>

      <div>
        <h4 className="text-sm font-semibold mb-2">Backup Jobs gần đây</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="pb-2 pr-4">Loại</th>
                <th className="pb-2 pr-4">Trạng thái</th>
                <th className="pb-2 pr-4">Bắt đầu</th>
                <th className="pb-2">Kích thước</th>
              </tr>
            </thead>
            <tbody>
              {jobs.length === 0 && (
                <tr><td colSpan={4} className="py-4 text-center text-muted-foreground">Chưa có backup job</td></tr>
              )}
              {jobs.map((j) => (
                <tr key={j.id} className="border-b last:border-0">
                  <td className="py-2 pr-4">{j.backupType}</td>
                  <td className="py-2 pr-4"><StatusBadge status={j.status} /></td>
                  <td className="py-2 pr-4 text-muted-foreground">
                    {j.startedAt ? new Date(j.startedAt).toLocaleString('vi-VN') : '—'}
                  </td>
                  <td className="py-2 text-muted-foreground">
                    {j.sizeBytes ? `${(Number(j.sizeBytes) / 1024 / 1024).toFixed(1)} MB` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {restoreJobs.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold mb-2">Restore Jobs</h4>
          <div className="space-y-2">
            {restoreJobs.map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded border px-4 py-2 text-sm">
                <div>
                  <span className="font-medium">{r.targetEnvironment}</span>
                  <span className="text-muted-foreground ml-2">← {r.backupJob.backupType}</span>
                </div>
                <div className="flex gap-2">
                  <StatusBadge status={r.status} />
                  <StatusBadge status={r.verificationStatus} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function DRTab({ readiness }: { readiness: DRReadiness | null }) {
  if (!readiness) return <p className="text-muted-foreground text-sm">Đang tải...</p>;

  const rtoOk = readiness.rtoGap === null || readiness.rtoGap <= 0;
  const rpoOk = readiness.rpoGap === null || readiness.rpoGap <= 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded border p-4">
          <p className="text-xs text-muted-foreground">DR Plans đang active</p>
          <p className="text-2xl font-bold mt-1">{readiness.planCount}</p>
        </div>
        <div className="rounded border p-4">
          <p className="text-xs text-muted-foreground">Kết quả diễn tập gần nhất</p>
          {readiness.lastOutcome
            ? <StatusBadge status={readiness.lastOutcome} />
            : <p className="text-sm text-muted-foreground mt-1">Chưa diễn tập</p>}
          {readiness.lastExercisedAt && (
            <p className="text-xs text-muted-foreground mt-1">
              {new Date(readiness.lastExercisedAt).toLocaleDateString('vi-VN')}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className={`rounded border p-4 ${rtoOk ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
          <p className="text-xs text-muted-foreground">RTO Gap</p>
          <p className={`text-xl font-bold mt-1 ${rtoOk ? 'text-green-700' : 'text-red-700'}`}>
            {readiness.rtoGap === null ? '—' : readiness.rtoGap > 0 ? `+${readiness.rtoGap} phút` : `${readiness.rtoGap} phút`}
          </p>
          <p className="text-xs text-muted-foreground">{rtoOk ? 'Đạt mục tiêu' : 'Vượt mục tiêu'}</p>
        </div>
        <div className={`rounded border p-4 ${rpoOk ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
          <p className="text-xs text-muted-foreground">RPO Gap</p>
          <p className={`text-xl font-bold mt-1 ${rpoOk ? 'text-green-700' : 'text-red-700'}`}>
            {readiness.rpoGap === null ? '—' : readiness.rpoGap > 0 ? `+${readiness.rpoGap} phút` : `${readiness.rpoGap} phút`}
          </p>
          <p className="text-xs text-muted-foreground">{rpoOk ? 'Đạt mục tiêu' : 'Vượt mục tiêu'}</p>
        </div>
      </div>
    </div>
  );
}

function StorageTab({ buckets }: { buckets: StorageBucket[] }) {
  const tierColor: Record<string, string> = {
    HOT:     'bg-orange-100 text-orange-800',
    COLD:    'bg-blue-100 text-blue-800',
    ARCHIVE: 'bg-gray-100 text-gray-700',
  };
  return (
    <div className="space-y-2">
      {buckets.map((b) => (
        <div key={b.id} className="flex items-center justify-between rounded border px-4 py-3">
          <div>
            <p className="font-medium text-sm">{b.bucketName}</p>
            <p className="text-xs text-muted-foreground">{b.moduleDomain}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-xs px-2 py-0.5 rounded font-medium ${tierColor[b.accessTier] ?? 'bg-gray-100'}`}>
              {b.accessTier}
            </span>
            <span className="text-xs text-muted-foreground">
              {b.retentionDays ? `${b.retentionDays}d` : 'Vĩnh viễn'}
            </span>
            {!b.isActive && <Badge variant="secondary">Inactive</Badge>}
          </div>
        </div>
      ))}
    </div>
  );
}

function ThresholdsTab({ policies }: { policies: ThresholdPolicy[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-muted-foreground">
            <th className="pb-2 pr-4">Metric</th>
            <th className="pb-2 pr-4">Warning</th>
            <th className="pb-2 pr-4">Critical</th>
            <th className="pb-2">Hành động tự động</th>
          </tr>
        </thead>
        <tbody>
          {policies.map((p) => (
            <tr key={p.id} className="border-b last:border-0">
              <td className="py-2 pr-4">
                <p className="font-medium">{p.displayName}</p>
                <p className="text-xs text-muted-foreground">{p.metricName}</p>
              </td>
              <td className="py-2 pr-4 text-yellow-700 font-medium">
                {p.warningThreshold}{p.unit ?? ''}
              </td>
              <td className="py-2 pr-4 text-red-700 font-medium">
                {p.criticalThreshold}{p.unit ?? ''}
              </td>
              <td className="py-2 text-muted-foreground text-xs">{p.autoAction ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function InfrastructureDashboardPage() {
  const [pipelines,       setPipelines]       = useState<PipelineSummary[]>([]);
  const [dqSummary,       setDqSummary]       = useState<DQTableSummary[]>([]);
  const [backupJobs,      setBackupJobs]      = useState<BackupJob[]>([]);
  const [restoreJobs,     setRestoreJobs]     = useState<RestoreJob[]>([]);
  const [freshness,       setFreshness]       = useState<BackupFreshness>({ freshnessMinutes: null });
  const [drReadiness,     setDrReadiness]     = useState<DRReadiness | null>(null);
  const [buckets,         setBuckets]         = useState<StorageBucket[]>([]);
  const [thresholds,      setThresholds]      = useState<ThresholdPolicy[]>([]);
  const [warehouseStatus, setWarehouseStatus] = useState<WarehouseStatus | null>(null);
  const [warehouseJobs,   setWarehouseJobs]   = useState<SyncJob[]>([]);
  const [healthSnapshot,  setHealthSnapshot]  = useState<HealthSnapshot | null>(null);
  const [alerts,          setAlerts]          = useState<InfraAlert[]>([]);
  const [alertSummary,    setAlertSummary]    = useState<AlertSummary | null>(null);
  const [isLoading,       setIsLoading]       = useState(true);
  const [error,           setError]           = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [
        plRes, dqRes, bkRes, rsRes, frRes, drRes,
        stRes, thRes, whStatusRes, whJobsRes, hlRes, alRes, alSumRes,
      ] = await Promise.all([
        fetch('/api/infrastructure/pipelines'),
        fetch('/api/infrastructure/data-quality/rules?view=summary'),
        fetch('/api/infrastructure/backups?pageSize=10'),
        fetch('/api/infrastructure/restore?pageSize=10'),
        fetch('/api/infrastructure/backups?view=freshness'),
        fetch('/api/infrastructure/dr?view=readiness'),
        fetch('/api/infrastructure/storage'),
        fetch('/api/infrastructure/alert-thresholds'),
        fetch('/api/infrastructure/warehouse?view=status'),
        fetch('/api/infrastructure/warehouse?pageSize=50'),
        fetch('/api/infrastructure/metrics/health'),
        fetch('/api/infrastructure/alerts?status=ACTIVE&pageSize=50'),
        fetch('/api/infrastructure/alerts?view=summary'),
      ]);

      const [
        pl, dq, bk, rs, fr, dr, st, th, whSt, whJobs, hl, al, alSum,
      ] = await Promise.all([
        plRes.json(), dqRes.json(), bkRes.json(), rsRes.json(),
        frRes.json(), drRes.json(), stRes.json(), thRes.json(),
        whStatusRes.json(), whJobsRes.json(),
        hlRes.json(), alRes.json(), alSumRes.json(),
      ]);

      if (pl.success)    setPipelines(pl.data);
      if (dq.success)    setDqSummary(dq.data);
      if (bk.success)    setBackupJobs(bk.data.jobs);
      if (rs.success)    setRestoreJobs(rs.data.jobs);
      if (fr.success)    setFreshness(fr.data);
      if (dr.success)    setDrReadiness(dr.data);
      if (st.success)    setBuckets(st.data);
      if (th.success)    setThresholds(th.data);
      if (whSt.success)  setWarehouseStatus(whSt.data);
      if (whJobs.success) setWarehouseJobs(whJobs.data.jobs);
      if (hl.success)    setHealthSnapshot(hl.data);
      if (al.success)    setAlerts(al.data.alerts);
      if (alSum.success) setAlertSummary(alSum.data);
    } catch {
      setError('Không thể tải dữ liệu hạ tầng');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const failingDQTables  = dqSummary.filter((s) => s.failingRules > 0).length;
  const failedBackups    = backupJobs.filter((j) => j.status === 'FAILED').length;
  const activeAlertCount = alertSummary?.active ?? 0;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Hạ tầng & Dữ liệu</h1>
          <p className="text-muted-foreground text-sm mt-1">M12 – Observability, Pipeline, Backup & DR</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchAll} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
          Làm mới
        </Button>
      </div>

      {error && (
        <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />{error}
        </div>
      )}

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Activity className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-xs text-muted-foreground">Pipelines active</p>
                <p className="text-xl font-bold">{pipelines.filter((p) => p.isActive).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Database className={`h-5 w-5 ${failingDQTables > 0 ? 'text-red-600' : 'text-green-600'}`} />
              <div>
                <p className="text-xs text-muted-foreground">DQ Bảng lỗi</p>
                <p className={`text-xl font-bold ${failingDQTables > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {failingDQTables}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Heart className={`h-5 w-5 ${healthSnapshot?.overall === 'CRITICAL' ? 'text-red-600' : healthSnapshot?.overall === 'WARNING' ? 'text-yellow-600' : 'text-green-600'}`} />
              <div>
                <p className="text-xs text-muted-foreground">System Health</p>
                <p className={`text-xl font-bold ${healthSnapshot?.overall === 'CRITICAL' ? 'text-red-600' : healthSnapshot?.overall === 'WARNING' ? 'text-yellow-600' : ''}`}>
                  {healthSnapshot?.overall ?? '—'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Bell className={`h-5 w-5 ${activeAlertCount > 0 ? 'text-red-600' : 'text-green-600'}`} />
              <div>
                <p className="text-xs text-muted-foreground">Alerts active</p>
                <p className={`text-xl font-bold ${activeAlertCount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {activeAlertCount}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main tabs */}
      <Tabs defaultValue="health">
        <TabsList className="grid grid-cols-4 md:grid-cols-8 w-full max-w-4xl">
          <TabsTrigger value="health">Health</TabsTrigger>
          <TabsTrigger value="alerts" className="relative">
            Alerts
            {activeAlertCount > 0 && (
              <span className="ml-1 text-xs bg-red-500 text-white rounded-full px-1">{activeAlertCount}</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="pipelines">Pipelines</TabsTrigger>
          <TabsTrigger value="warehouse">Warehouse</TabsTrigger>
          <TabsTrigger value="quality">Data Quality</TabsTrigger>
          <TabsTrigger value="backup">Backup</TabsTrigger>
          <TabsTrigger value="dr">DR</TabsTrigger>
          <TabsTrigger value="storage">Storage</TabsTrigger>
        </TabsList>

        <TabsContent value="health">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Heart className="h-4 w-4" />System Health Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <HealthTab snapshot={healthSnapshot} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Bell className="h-4 w-4" />Infrastructure Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AlertsTab alerts={alerts} summary={alertSummary} onRefresh={fetchAll} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pipelines">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Server className="h-4 w-4" />Pipeline Definitions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <PipelinesTab pipelines={pipelines} onRefresh={fetchAll} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="warehouse">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Database className="h-4 w-4" />Warehouse Sync Jobs (PG → ClickHouse)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <WarehouseTab status={warehouseStatus} jobs={warehouseJobs} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quality">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />Data Quality theo bảng
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DataQualityTab summary={dqSummary} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="backup">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <HardDrive className="h-4 w-4" />Backup & Restore
              </CardTitle>
            </CardHeader>
            <CardContent>
              <BackupsTab jobs={backupJobs} freshness={freshness} restoreJobs={restoreJobs} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dr">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="h-4 w-4" />Disaster Recovery Readiness
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DRTab readiness={drReadiness} />
            </CardContent>
          </Card>
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-base">Alert Thresholds</CardTitle>
            </CardHeader>
            <CardContent>
              <ThresholdsTab policies={thresholds} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="storage">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <HardDrive className="h-4 w-4" />Storage Buckets
              </CardTitle>
            </CardHeader>
            <CardContent>
              <StorageTab buckets={buckets} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
