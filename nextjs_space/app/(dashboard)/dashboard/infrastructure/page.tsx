'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Activity, Database, HardDrive, Shield, AlertTriangle,
  CheckCircle2, XCircle, RefreshCw, Clock, Server, Bell, Heart,
  Zap, TrendingUp, Layers, Archive, Play, Pause,
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

// ─── Design tokens ────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  COMPLETED:    { bg: 'bg-emerald-50',  text: 'text-emerald-700',  dot: 'bg-emerald-500'  },
  RUNNING:      { bg: 'bg-blue-50',     text: 'text-blue-700',     dot: 'bg-blue-500'     },
  FAILED:       { bg: 'bg-red-50',      text: 'text-red-700',      dot: 'bg-red-500'      },
  PENDING:      { bg: 'bg-amber-50',    text: 'text-amber-700',    dot: 'bg-amber-500'    },
  CANCELLED:    { bg: 'bg-slate-100',   text: 'text-slate-600',    dot: 'bg-slate-400'    },
  PASS:         { bg: 'bg-emerald-50',  text: 'text-emerald-700',  dot: 'bg-emerald-500'  },
  PARTIAL:      { bg: 'bg-amber-50',    text: 'text-amber-700',    dot: 'bg-amber-500'    },
  FAIL:         { bg: 'bg-red-50',      text: 'text-red-700',      dot: 'bg-red-500'      },
  ACTIVE:       { bg: 'bg-red-50',      text: 'text-red-700',      dot: 'bg-red-500'      },
  ACKNOWLEDGED: { bg: 'bg-amber-50',    text: 'text-amber-700',    dot: 'bg-amber-500'    },
  RESOLVED:     { bg: 'bg-emerald-50',  text: 'text-emerald-700',  dot: 'bg-emerald-500'  },
  IDLE:         { bg: 'bg-slate-100',   text: 'text-slate-600',    dot: 'bg-slate-400'    },
  REQUESTED:    { bg: 'bg-violet-50',   text: 'text-violet-700',   dot: 'bg-violet-500'   },
  IN_PROGRESS:  { bg: 'bg-blue-50',     text: 'text-blue-700',     dot: 'bg-blue-500'     },
  VERIFIED_OK:  { bg: 'bg-emerald-50',  text: 'text-emerald-700',  dot: 'bg-emerald-500'  },
  VERIFIED_FAILED: { bg: 'bg-red-50',   text: 'text-red-700',      dot: 'bg-red-500'      },
  NOT_VERIFIED: { bg: 'bg-slate-100',   text: 'text-slate-600',    dot: 'bg-slate-400'    },
};

const HEALTH_STYLES: Record<HealthLevel, { card: string; text: string; badge: string; icon: string }> = {
  OK:       { card: 'border-emerald-200 bg-emerald-50/60', text: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-800', icon: 'text-emerald-600' },
  WARNING:  { card: 'border-amber-200 bg-amber-50/60',    text: 'text-amber-700',   badge: 'bg-amber-100 text-amber-800',    icon: 'text-amber-600'   },
  CRITICAL: { card: 'border-red-200 bg-red-50/60',        text: 'text-red-700',     badge: 'bg-red-100 text-red-800',        icon: 'text-red-600'     },
  UNKNOWN:  { card: 'border-slate-200 bg-slate-50/60',    text: 'text-slate-500',   badge: 'bg-slate-100 text-slate-600',    icon: 'text-slate-400'   },
};

const SEVERITY_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  CRITICAL: { bg: 'bg-red-100',    text: 'text-red-800',    border: 'border-red-300'    },
  ERROR:    { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-300' },
  WARNING:  { bg: 'bg-amber-100',  text: 'text-amber-800',  border: 'border-amber-300'  },
  INFO:     { bg: 'bg-sky-100',    text: 'text-sky-800',    border: 'border-sky-300'    },
};

const TIER_STYLES: Record<string, { bg: string; text: string; icon: string }> = {
  HOT:     { bg: 'bg-orange-100', text: 'text-orange-800', icon: '🔥' },
  COLD:    { bg: 'bg-sky-100',    text: 'text-sky-800',    icon: '❄️' },
  ARCHIVE: { bg: 'bg-slate-100',  text: 'text-slate-700',  icon: '📦' },
};

// ─── Shared components ────────────────────────────────────────────────────────

function StatusBadge({ status, label }: { status: string; label?: string }) {
  const s = STATUS_STYLES[status] ?? { bg: 'bg-slate-100', text: 'text-slate-600', dot: 'bg-slate-400' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${s.bg} ${s.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {label ?? status}
    </span>
  );
}

function HealthBadge({ level }: { level: HealthLevel }) {
  const s = HEALTH_STYLES[level];
  return (
    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${s.badge}`}>
      {level}
    </span>
  );
}

function FreshnessIndicator({ minutes }: { minutes: number | null }) {
  if (minutes === null) return (
    <div className="flex items-center gap-2 text-red-600">
      <XCircle className="h-4 w-4" />
      <span className="text-sm font-medium">Chưa có backup</span>
    </div>
  );
  if (minutes > 90) return (
    <div className="flex items-center gap-2 text-red-600">
      <AlertTriangle className="h-4 w-4" />
      <span className="text-sm font-medium">{minutes} phút — CRITICAL</span>
    </div>
  );
  if (minutes > 60) return (
    <div className="flex items-center gap-2 text-amber-600">
      <Clock className="h-4 w-4" />
      <span className="text-sm font-medium">{minutes} phút — WARNING</span>
    </div>
  );
  return (
    <div className="flex items-center gap-2 text-emerald-600">
      <CheckCircle2 className="h-4 w-4" />
      <span className="text-sm font-medium">{minutes} phút — OK</span>
    </div>
  );
}

function SectionCard({ title, icon: Icon, children, className = '' }: {
  title: string; icon: React.ElementType; children: React.ReactNode; className?: string;
}) {
  return (
    <Card className={`shadow-sm ${className}`}>
      <CardHeader className="pb-3 border-b bg-slate-50/50 rounded-t-xl">
        <CardTitle className="text-sm font-semibold flex items-center gap-2 text-slate-700">
          <Icon className="h-4 w-4 text-slate-500" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">{children}</CardContent>
    </Card>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({
  label, value, icon: Icon, iconColor, valueColor, subtitle,
}: {
  label: string; value: React.ReactNode; icon: React.ElementType;
  iconColor?: string; valueColor?: string; subtitle?: string;
}) {
  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="pt-5 pb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
            <p className={`text-2xl font-bold mt-1.5 ${valueColor ?? 'text-slate-800'}`}>{value}</p>
            {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
          </div>
          <div className={`p-2.5 rounded-xl ${iconColor ?? 'bg-slate-100'}`}>
            <Icon className="h-5 w-5 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Pipelines Tab ────────────────────────────────────────────────────────────

const PIPELINE_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  ETL_PG_TO_CLICKHOUSE: { label: 'ETL → CH',     color: 'bg-violet-100 text-violet-800' },
  DATA_QUALITY:         { label: 'Data Quality',  color: 'bg-sky-100 text-sky-800'       },
  BACKUP:               { label: 'Backup',        color: 'bg-emerald-100 text-emerald-800' },
  AI_REFRESH:           { label: 'AI Refresh',    color: 'bg-pink-100 text-pink-800'     },
  CUSTOM:               { label: 'Custom',        color: 'bg-slate-100 text-slate-700'   },
};

function PipelinesTab({
  pipelines, onRefresh,
}: { pipelines: PipelineSummary[]; onRefresh: () => void }) {
  const [triggering, setTriggering] = useState<string | null>(null);
  const [toggling,   setToggling]   = useState<string | null>(null);

  const triggerRun = async (id: string) => {
    setTriggering(id);
    try {
      const res  = await fetch('/api/infrastructure/pipelines', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'trigger', definitionId: id }),
      });
      const data = await res.json();
      if (!data.success) alert(data.error);
      else onRefresh();
    } finally { setTriggering(null); }
  };

  const toggleActive = async (id: string, currentActive: boolean) => {
    setToggling(id);
    try {
      const res  = await fetch('/api/infrastructure/pipelines', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isActive: !currentActive }),
      });
      const data = await res.json();
      if (!data.success) alert(data.error);
      else onRefresh();
    } finally { setToggling(null); }
  };

  const active   = pipelines.filter((p) => p.isActive).length;
  const inactive = pipelines.length - active;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4 text-sm text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          {active} active
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-slate-300" />
          {inactive} paused
        </span>
      </div>

      <div className="space-y-2">
        {pipelines.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <Layers className="h-10 w-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm">Chưa có pipeline nào</p>
          </div>
        )}
        {pipelines.map((p) => {
          const typeInfo = PIPELINE_TYPE_LABELS[p.pipelineType] ?? { label: p.pipelineType, color: 'bg-slate-100 text-slate-700' };
          const isBusy = triggering === p.id || toggling === p.id;
          return (
            <div
              key={p.id}
              className={`flex items-center gap-4 rounded-xl border px-4 py-3 transition-colors ${
                p.isActive ? 'bg-white hover:bg-slate-50/80' : 'bg-slate-50/60 opacity-70'
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeInfo.color}`}>
                    {typeInfo.label}
                  </span>
                  <span className="font-medium text-sm text-slate-800 truncate">{p.name}</span>
                  {!p.isActive && (
                    <span className="text-xs text-slate-400">(paused)</span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                  <span>Chạy lần cuối: {p.lastRunAt ? new Date(p.lastRunAt).toLocaleString('vi-VN') : '—'}</span>
                  {p.lastRunStatus && <StatusBadge status={p.lastRunStatus} />}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {p.isActive && (
                  <Button
                    size="sm" variant="outline"
                    disabled={isBusy}
                    onClick={() => triggerRun(p.id)}
                    className="h-7 text-xs gap-1 border-slate-200 hover:border-blue-300 hover:text-blue-700"
                  >
                    {triggering === p.id
                      ? <RefreshCw className="h-3 w-3 animate-spin" />
                      : <Play className="h-3 w-3" />
                    }
                    Chạy
                  </Button>
                )}
                <Button
                  size="sm" variant="ghost"
                  disabled={isBusy}
                  onClick={() => toggleActive(p.id, p.isActive)}
                  className={`h-7 text-xs gap-1 ${
                    p.isActive
                      ? 'text-red-600 hover:bg-red-50 hover:text-red-700'
                      : 'text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700'
                  }`}
                >
                  {toggling === p.id
                    ? <RefreshCw className="h-3 w-3 animate-spin" />
                    : p.isActive ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />
                  }
                  {p.isActive ? 'Pause' : 'Resume'}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Warehouse Tab ────────────────────────────────────────────────────────────

function WarehouseTab({
  status, jobs,
}: { status: WarehouseStatus | null; jobs: SyncJob[] }) {
  const SYNC_STATUS_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
    IDLE:      { bg: 'bg-slate-100',   text: 'text-slate-600',   dot: 'bg-slate-400'   },
    RUNNING:   { bg: 'bg-blue-100',    text: 'text-blue-800',    dot: 'bg-blue-500'    },
    COMPLETED: { bg: 'bg-emerald-100', text: 'text-emerald-800', dot: 'bg-emerald-500' },
    FAILED:    { bg: 'bg-red-100',     text: 'text-red-800',     dot: 'bg-red-500'     },
  };

  return (
    <div className="space-y-5">
      {status && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Tổng sync jobs',  value: status.totalActive, color: 'text-slate-800' },
            { label: 'Đang chạy',       value: status.running,     color: status.running > 0 ? 'text-blue-600' : 'text-slate-800' },
            { label: 'Lỗi',            value: status.failed,      color: status.failed > 0  ? 'text-red-600'  : 'text-emerald-600' },
            { label: 'Stale ≥ 2h',     value: status.staleCount,  color: status.staleCount > 0 ? 'text-amber-600' : 'text-slate-800' },
          ].map((item) => (
            <div key={item.label} className="rounded-xl border bg-white px-4 py-3">
              <p className="text-xs text-slate-400 font-medium">{item.label}</p>
              <p className={`text-2xl font-bold mt-1 ${item.color}`}>{item.value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-2">
        {jobs.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <Database className="h-10 w-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm">Chưa có sync job nào</p>
          </div>
        )}
        {jobs.map((j) => {
          const s = SYNC_STATUS_STYLES[j.status] ?? { bg: 'bg-slate-100', text: 'text-slate-600', dot: 'bg-slate-400' };
          return (
            <div
              key={j.id}
              className={`rounded-xl border px-4 py-3 ${j.isActive ? 'bg-white' : 'bg-slate-50/60 opacity-60'}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-semibold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
                      {j.sourceTable}
                    </span>
                    <span className="text-slate-400 text-xs">→</span>
                    <span className="font-mono text-xs text-violet-700 bg-violet-50 px-1.5 py-0.5 rounded">
                      {j.targetDataset}
                    </span>
                    <span className="text-xs px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">{j.syncMode}</span>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${s.bg} ${s.text}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${s.dot} ${j.status === 'RUNNING' ? 'animate-pulse' : ''}`} />
                      {j.status}
                    </span>
                  </div>
                  {j.errorMessage && (
                    <p className="text-xs text-red-600 mt-1.5 bg-red-50 px-2 py-1 rounded">
                      {j.errorMessage}
                    </p>
                  )}
                </div>
                <div className="text-right shrink-0 text-xs text-slate-400">
                  {j.lastSyncAt && (
                    <p>{new Date(j.lastSyncAt).toLocaleString('vi-VN')}</p>
                  )}
                  <div className="flex items-center justify-end gap-3 mt-0.5">
                    {j.lastSyncRowCount != null && (
                      <span className="text-slate-600 font-medium">
                        {j.lastSyncRowCount.toLocaleString()} rows
                      </span>
                    )}
                    {j.lastSyncDurationMs && (
                      <span>{(j.lastSyncDurationMs / 1000).toFixed(1)}s</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Health Tab ───────────────────────────────────────────────────────────────

function HealthTab({ snapshot }: { snapshot: HealthSnapshot | null }) {
  if (!snapshot) {
    return (
      <div className="text-center py-12 text-slate-400">
        <Activity className="h-10 w-10 mx-auto mb-2 opacity-40 animate-pulse" />
        <p className="text-sm">Đang tải health metrics...</p>
      </div>
    );
  }

  const overallStyle = HEALTH_STYLES[snapshot.overall];

  return (
    <div className="space-y-5">
      <div className={`flex items-center gap-4 rounded-xl border-2 px-5 py-4 ${overallStyle.card}`}>
        <Heart className={`h-6 w-6 ${overallStyle.icon} flex-shrink-0`} />
        <div className="flex-1">
          <p className="text-sm font-semibold text-slate-700">Tổng quan hệ thống</p>
          <div className="flex items-center gap-3 mt-1">
            <HealthBadge level={snapshot.overall} />
            <span className="text-xs text-slate-400">
              Cập nhật: {new Date(snapshot.checkedAt).toLocaleString('vi-VN')}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {snapshot.metrics.map((m) => {
          const s = HEALTH_STYLES[m.level];
          const pct = m.threshold && m.value !== null
            ? Math.min(100, (m.value / m.threshold.critical) * 100)
            : null;

          return (
            <div key={m.metricName} className={`rounded-xl border-2 p-4 ${s.card}`}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-slate-700">{m.displayName}</p>
                <HealthBadge level={m.level} />
              </div>
              <p className={`text-3xl font-bold ${s.text}`}>
                {m.value !== null ? `${m.value}${m.unit ?? ''}` : '—'}
              </p>
              {pct !== null && (
                <div className="mt-3">
                  <div className="h-1.5 rounded-full bg-white/60 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        m.level === 'CRITICAL' ? 'bg-red-500' :
                        m.level === 'WARNING'  ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )}
              {m.threshold && (
                <p className="text-xs text-slate-400 mt-2">
                  ⚠️ Warning ≥ {m.threshold.warning}{m.unit ?? ''} · 🔴 Critical ≥ {m.threshold.critical}{m.unit ?? ''}
                </p>
              )}
              {m.value === null && (
                <p className="text-xs text-slate-400 mt-2">Không lấy được metric</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Alerts Tab ───────────────────────────────────────────────────────────────

function AlertsTab({
  alerts, summary, onRefresh,
}: { alerts: InfraAlert[]; summary: AlertSummary | null; onRefresh: () => void }) {
  const [acking, setAcking] = useState<string | null>(null);

  const acknowledge = async (alertId: string) => {
    setAcking(alertId);
    try {
      const res = await fetch(`/api/infrastructure/alerts/${alertId}/ack`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'acknowledge' }),
      });
      const data = await res.json();
      if (!data.success) alert(data.error); else onRefresh();
    } finally { setAcking(null); }
  };

  const resolve = async (alertId: string) => {
    setAcking(alertId);
    try {
      const res = await fetch(`/api/infrastructure/alerts/${alertId}/ack`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'resolve' }),
      });
      const data = await res.json();
      if (!data.success) alert(data.error); else onRefresh();
    } finally { setAcking(null); }
  };

  return (
    <div className="space-y-5">
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Đang active',      value: summary.active,       color: summary.active > 0 ? 'text-red-600' : 'text-emerald-600' },
            { label: 'Acknowledged',     value: summary.acknowledged, color: 'text-amber-600' },
            { label: 'Critical',         value: summary.critical,     color: summary.critical > 0 ? 'text-red-700' : 'text-slate-400' },
            { label: 'Warning',          value: summary.warning,      color: summary.warning > 0  ? 'text-amber-700' : 'text-slate-400' },
          ].map((item) => (
            <div key={item.label} className="rounded-xl border bg-white px-4 py-3">
              <p className="text-xs text-slate-400 font-medium">{item.label}</p>
              <p className={`text-2xl font-bold mt-1 ${item.color}`}>{item.value}</p>
            </div>
          ))}
        </div>
      )}

      {alerts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-14 text-slate-400 gap-2">
          <div className="p-4 rounded-full bg-emerald-50">
            <CheckCircle2 className="h-8 w-8 text-emerald-500" />
          </div>
          <p className="text-sm font-medium text-slate-600">Không có cảnh báo active</p>
          <p className="text-xs">Hệ thống đang hoạt động bình thường</p>
        </div>
      ) : (
        <div className="space-y-2">
          {alerts.map((a) => {
            const sv = SEVERITY_STYLES[a.severity] ?? { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200' };
            return (
              <div
                key={a.id}
                className={`rounded-xl border px-4 py-3 flex items-start justify-between gap-4 bg-white ${
                  a.status === 'RESOLVED' ? 'opacity-60' : ''
                }`}
              >
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className={`mt-0.5 flex-shrink-0 p-1.5 rounded-lg ${sv.bg}`}>
                    <AlertTriangle className={`h-3.5 w-3.5 ${sv.text}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold border ${sv.bg} ${sv.text} ${sv.border}`}>
                        {a.severity}
                      </span>
                      <StatusBadge status={a.status} />
                      {a.service && (
                        <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                          {a.service.name}
                        </span>
                      )}
                    </div>
                    <p className="font-semibold text-sm text-slate-800">{a.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{a.message}</p>
                    <p className="text-xs text-slate-400 mt-1.5">
                      {new Date(a.triggeredAt).toLocaleString('vi-VN')}
                      {a.acknowledgedAt && (
                        <span className="ml-2">· Acked {new Date(a.acknowledgedAt).toLocaleString('vi-VN')}</span>
                      )}
                    </p>
                  </div>
                </div>
                {a.status !== 'RESOLVED' && (
                  <div className="flex gap-2 shrink-0">
                    {a.status === 'ACTIVE' && (
                      <Button
                        size="sm" variant="outline"
                        disabled={acking === a.id}
                        onClick={() => acknowledge(a.id)}
                        className="h-7 text-xs border-amber-200 text-amber-700 hover:bg-amber-50"
                      >
                        {acking === a.id ? <RefreshCw className="h-3 w-3 animate-spin" /> : 'Ack'}
                      </Button>
                    )}
                    <Button
                      size="sm" variant="outline"
                      disabled={acking === a.id}
                      onClick={() => resolve(a.id)}
                      className="h-7 text-xs border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                    >
                      {acking === a.id ? <RefreshCw className="h-3 w-3 animate-spin" /> : 'Resolve'}
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Data Quality Tab ─────────────────────────────────────────────────────────

function DataQualityTab({ summary }: { summary: DQTableSummary[] }) {
  const total    = summary.length;
  const passing  = summary.filter((s) => s.failingRules === 0).length;
  const failing  = total - passing;

  return (
    <div className="space-y-5">
      {total > 0 && (
        <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border">
          <div className="flex-1">
            <div className="flex justify-between text-xs text-slate-500 mb-1.5">
              <span>Bảng đạt chuẩn</span>
              <span>{passing}/{total}</span>
            </div>
            <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all"
                style={{ width: total ? `${(passing / total) * 100}%` : '0%' }}
              />
            </div>
          </div>
          <div className="flex gap-4 text-sm shrink-0">
            <span className="text-emerald-600 font-semibold">{passing} OK</span>
            {failing > 0 && <span className="text-red-600 font-semibold">{failing} lỗi</span>}
          </div>
        </div>
      )}

      {summary.length === 0 && (
        <div className="text-center py-12 text-slate-400">
          <Database className="h-10 w-10 mx-auto mb-2 opacity-40" />
          <p className="text-sm">Chưa có data quality rules</p>
        </div>
      )}
      <div className="space-y-2">
        {summary.map((s) => (
          <div
            key={s.targetTable}
            className={`flex items-center justify-between rounded-xl border px-4 py-3 ${
              s.failingRules > 0 ? 'bg-red-50/60 border-red-200' : 'bg-white'
            }`}
          >
            <div>
              <p className="font-semibold text-sm text-slate-800 font-mono">{s.targetTable}</p>
              <p className="text-xs text-slate-400 mt-0.5">
                {s.totalRules} rules · Kiểm tra:{' '}
                {s.lastCheckedAt ? new Date(s.lastCheckedAt).toLocaleString('vi-VN') : 'Chưa có'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {s.failingRules === 0 ? (
                <div className="flex items-center gap-1.5 text-emerald-600">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="text-xs font-semibold">Đạt</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-red-600">
                  <XCircle className="h-4 w-4" />
                  <span className="text-xs font-semibold">{s.failingRules} rule lỗi</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Backups Tab ──────────────────────────────────────────────────────────────

const BACKUP_TYPE_LABELS: Record<string, string> = {
  POSTGRESQL_FULL:        'PG Full',
  POSTGRESQL_INCREMENTAL: 'PG Incr.',
  MINIO_CONFIG:           'MinIO Cfg',
  AIRFLOW_DAGS:           'Airflow DAGs',
  GRAFANA:                'Grafana',
};

function BackupsTab({
  jobs, freshness, restoreJobs,
}: { jobs: BackupJob[]; freshness: BackupFreshness; restoreJobs: RestoreJob[] }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 rounded-xl border bg-slate-50/60 px-5 py-4">
        <div className="p-2.5 rounded-xl bg-blue-100">
          <Clock className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <p className="text-xs font-medium text-slate-500">Backup gần nhất (PostgreSQL Full)</p>
          <div className="mt-1">
            <FreshnessIndicator minutes={freshness.freshnessMinutes} />
          </div>
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Backup Jobs gần đây</p>
        <div className="space-y-2">
          {jobs.length === 0 && (
            <div className="text-center py-8 text-slate-400 text-sm">Chưa có backup job</div>
          )}
          {jobs.map((j) => (
            <div key={j.id} className="flex items-center justify-between rounded-xl border px-4 py-3 bg-white">
              <div className="flex items-center gap-3">
                <div className="p-1.5 rounded-lg bg-slate-100">
                  <HardDrive className="h-3.5 w-3.5 text-slate-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700">
                    {BACKUP_TYPE_LABELS[j.backupType] ?? j.backupType}
                  </p>
                  <p className="text-xs text-slate-400">
                    {j.startedAt ? new Date(j.startedAt).toLocaleString('vi-VN') : '—'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {j.sizeBytes && (
                  <span className="text-xs text-slate-500">
                    {(Number(j.sizeBytes) / 1024 / 1024 / 1024).toFixed(1)} GB
                  </span>
                )}
                <StatusBadge status={j.status} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {restoreJobs.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Restore Jobs</p>
          <div className="space-y-2">
            {restoreJobs.map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-xl border px-4 py-3 bg-white">
                <div>
                  <p className="text-sm font-medium text-slate-700">{r.targetEnvironment}</p>
                  <p className="text-xs text-slate-400">
                    ← {r.backupJob.backupType}
                    {r.startedAt && <span> · {new Date(r.startedAt).toLocaleString('vi-VN')}</span>}
                  </p>
                </div>
                <div className="flex items-center gap-2">
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

// ─── DR Tab ───────────────────────────────────────────────────────────────────

function DRTab({ readiness }: { readiness: DRReadiness | null }) {
  if (!readiness) return (
    <div className="text-center py-12 text-slate-400">
      <Shield className="h-10 w-10 mx-auto mb-2 opacity-40 animate-pulse" />
      <p className="text-sm">Đang tải...</p>
    </div>
  );

  const rtoOk = readiness.rtoGap === null || readiness.rtoGap <= 0;
  const rpoOk = readiness.rpoGap === null || readiness.rpoGap <= 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl border bg-white px-4 py-4">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">DR Plans Active</p>
          <p className="text-3xl font-bold text-slate-800 mt-1">{readiness.planCount}</p>
        </div>
        <div className="rounded-xl border bg-white px-4 py-4">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Diễn tập gần nhất</p>
          <div className="mt-2">
            {readiness.lastOutcome
              ? <StatusBadge status={readiness.lastOutcome} />
              : <p className="text-sm text-slate-400">Chưa diễn tập</p>
            }
          </div>
          {readiness.lastExercisedAt && (
            <p className="text-xs text-slate-400 mt-1">
              {new Date(readiness.lastExercisedAt).toLocaleDateString('vi-VN')}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className={`rounded-xl border-2 px-4 py-4 ${rtoOk ? 'border-emerald-200 bg-emerald-50/60' : 'border-red-200 bg-red-50/60'}`}>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">RTO Gap</p>
          <p className={`text-2xl font-bold mt-1.5 ${rtoOk ? 'text-emerald-700' : 'text-red-700'}`}>
            {readiness.rtoGap === null ? '—'
              : readiness.rtoGap > 0 ? `+${readiness.rtoGap} min`
              : `${Math.abs(readiness.rtoGap)} min buffer`}
          </p>
          <p className={`text-xs mt-1 font-medium ${rtoOk ? 'text-emerald-600' : 'text-red-600'}`}>
            {rtoOk ? '✓ Đạt mục tiêu' : '✗ Vượt mục tiêu'}
          </p>
        </div>
        <div className={`rounded-xl border-2 px-4 py-4 ${rpoOk ? 'border-emerald-200 bg-emerald-50/60' : 'border-red-200 bg-red-50/60'}`}>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">RPO Gap</p>
          <p className={`text-2xl font-bold mt-1.5 ${rpoOk ? 'text-emerald-700' : 'text-red-700'}`}>
            {readiness.rpoGap === null ? '—'
              : readiness.rpoGap > 0 ? `+${readiness.rpoGap} min`
              : `${Math.abs(readiness.rpoGap)} min buffer`}
          </p>
          <p className={`text-xs mt-1 font-medium ${rpoOk ? 'text-emerald-600' : 'text-red-600'}`}>
            {rpoOk ? '✓ Đạt mục tiêu' : '✗ Vượt mục tiêu'}
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Storage Tab ──────────────────────────────────────────────────────────────

function StorageTab({ buckets }: { buckets: StorageBucket[] }) {
  const grouped = {
    HOT:     buckets.filter((b) => b.accessTier === 'HOT'),
    COLD:    buckets.filter((b) => b.accessTier === 'COLD'),
    ARCHIVE: buckets.filter((b) => b.accessTier === 'ARCHIVE'),
  };

  return (
    <div className="space-y-5">
      {(['HOT', 'COLD', 'ARCHIVE'] as const).map((tier) => {
        const list = grouped[tier];
        if (!list.length) return null;
        const s = TIER_STYLES[tier];
        return (
          <div key={tier}>
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${s.bg} ${s.text}`}>
                {s.icon} {tier} — {list.length} buckets
              </span>
            </div>
            <div className="space-y-2">
              {list.map((b) => (
                <div key={b.id} className="flex items-center justify-between rounded-xl border px-4 py-3 bg-white">
                  <div>
                    <p className="text-sm font-semibold text-slate-800 font-mono">{b.bucketName}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{b.moduleDomain}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-400">
                      Retention: {b.retentionDays ? `${b.retentionDays}d` : '∞'}
                    </span>
                    {!b.isActive && <Badge variant="secondary" className="text-xs">Inactive</Badge>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
      {buckets.length === 0 && (
        <div className="text-center py-12 text-slate-400">
          <Archive className="h-10 w-10 mx-auto mb-2 opacity-40" />
          <p className="text-sm">Chưa có storage bucket nào</p>
        </div>
      )}
    </div>
  );
}

// ─── Thresholds Tab ───────────────────────────────────────────────────────────

function ThresholdsTab({ policies }: { policies: ThresholdPolicy[] }) {
  return (
    <div className="space-y-2">
      {policies.map((p) => (
        <div key={p.id} className="flex items-center justify-between rounded-xl border px-4 py-3 bg-white">
          <div>
            <p className="text-sm font-semibold text-slate-800">{p.displayName}</p>
            <p className="text-xs text-slate-400 font-mono">{p.metricName}</p>
            {p.autoAction && (
              <p className="text-xs text-slate-500 mt-1 max-w-sm">{p.autoAction}</p>
            )}
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="text-center">
              <p className="text-xs text-slate-400">Warning</p>
              <p className="text-sm font-bold text-amber-600">
                {p.warningThreshold}{p.unit ?? ''}
              </p>
            </div>
            <div className="h-8 w-px bg-slate-200" />
            <div className="text-center">
              <p className="text-xs text-slate-400">Critical</p>
              <p className="text-sm font-bold text-red-600">
                {p.criticalThreshold}{p.unit ?? ''}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

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
  const [lastRefreshed,   setLastRefreshed]   = useState<Date | null>(null);

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

      if (pl.success)     setPipelines(pl.data);
      if (dq.success)     setDqSummary(dq.data);
      if (bk.success)     setBackupJobs(bk.data.jobs);
      if (rs.success)     setRestoreJobs(rs.data.jobs);
      if (fr.success)     setFreshness(fr.data);
      if (dr.success)     setDrReadiness(dr.data);
      if (st.success)     setBuckets(st.data);
      if (th.success)     setThresholds(th.data);
      if (whSt.success)   setWarehouseStatus(whSt.data);
      if (whJobs.success) setWarehouseJobs(whJobs.data.jobs);
      if (hl.success)     setHealthSnapshot(hl.data);
      if (al.success)     setAlerts(al.data.alerts);
      if (alSum.success)  setAlertSummary(alSum.data);
      setLastRefreshed(new Date());
    } catch {
      setError('Không thể tải dữ liệu hạ tầng');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const failingDQTables  = dqSummary.filter((s) => s.failingRules > 0).length;
  const activeAlertCount = alertSummary?.active ?? 0;
  const criticalCount    = alertSummary?.critical ?? 0;

  const overallHealth = healthSnapshot?.overall ?? 'UNKNOWN';
  const healthColorMap: Record<HealthLevel, string> = {
    OK:       'bg-emerald-500',
    WARNING:  'bg-amber-500',
    CRITICAL: 'bg-red-500',
    UNKNOWN:  'bg-slate-400',
  };

  return (
    <div className="space-y-6 p-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-slate-700 to-slate-900">
              <Server className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">Hạ tầng & Dữ liệu</h1>
              <p className="text-xs text-slate-400 mt-0.5">M12 — Observability · Pipeline · Backup · Disaster Recovery</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {lastRefreshed && (
            <p className="text-xs text-slate-400 hidden md:block">
              Cập nhật: {lastRefreshed.toLocaleTimeString('vi-VN')}
            </p>
          )}
          <Button
            variant="outline" size="sm"
            onClick={fetchAll}
            disabled={isLoading}
            className="gap-1.5 border-slate-200 hover:border-slate-300"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Làm mới
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />{error}
        </div>
      )}

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          label="Pipelines Active"
          value={pipelines.filter((p) => p.isActive).length}
          subtitle={`/ ${pipelines.length} tổng`}
          icon={Activity}
          iconColor="bg-violet-500"
          valueColor="text-violet-700"
        />
        <KpiCard
          label="DQ Bảng lỗi"
          value={failingDQTables}
          subtitle={`/ ${dqSummary.length} bảng kiểm tra`}
          icon={Database}
          iconColor={failingDQTables > 0 ? 'bg-red-500' : 'bg-emerald-500'}
          valueColor={failingDQTables > 0 ? 'text-red-600' : 'text-emerald-600'}
        />
        <KpiCard
          label="System Health"
          value={overallHealth}
          icon={Heart}
          iconColor={healthColorMap[overallHealth]}
          valueColor={
            overallHealth === 'CRITICAL' ? 'text-red-600' :
            overallHealth === 'WARNING'  ? 'text-amber-600' :
            overallHealth === 'OK'       ? 'text-emerald-600' : 'text-slate-500'
          }
        />
        <KpiCard
          label="Alerts Active"
          value={activeAlertCount}
          subtitle={criticalCount > 0 ? `${criticalCount} critical` : 'Không có critical'}
          icon={Bell}
          iconColor={activeAlertCount > 0 ? 'bg-red-500' : 'bg-emerald-500'}
          valueColor={activeAlertCount > 0 ? 'text-red-600' : 'text-emerald-600'}
        />
      </div>

      {/* Mini summary row */}
      {warehouseStatus && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded-xl border bg-white px-4 py-3 flex items-center gap-3">
            <TrendingUp className="h-4 w-4 text-blue-500 flex-shrink-0" />
            <div>
              <p className="text-xs text-slate-400">Warehouse jobs</p>
              <p className="text-sm font-bold text-slate-700">{warehouseStatus.totalActive} active</p>
            </div>
          </div>
          <div className="rounded-xl border bg-white px-4 py-3 flex items-center gap-3">
            <Zap className={`h-4 w-4 flex-shrink-0 ${warehouseStatus.running > 0 ? 'text-blue-500' : 'text-slate-300'}`} />
            <div>
              <p className="text-xs text-slate-400">Đang sync</p>
              <p className={`text-sm font-bold ${warehouseStatus.running > 0 ? 'text-blue-600' : 'text-slate-400'}`}>
                {warehouseStatus.running} jobs
              </p>
            </div>
          </div>
          <div className="rounded-xl border bg-white px-4 py-3 flex items-center gap-3">
            <HardDrive className="h-4 w-4 text-emerald-500 flex-shrink-0" />
            <div>
              <p className="text-xs text-slate-400">Storage buckets</p>
              <p className="text-sm font-bold text-slate-700">{buckets.length} buckets</p>
            </div>
          </div>
          <div className="rounded-xl border bg-white px-4 py-3 flex items-center gap-3">
            <Shield className="h-4 w-4 text-violet-500 flex-shrink-0" />
            <div>
              <p className="text-xs text-slate-400">DR Plans</p>
              <p className="text-sm font-bold text-slate-700">{drReadiness?.planCount ?? '—'} active</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Tabs */}
      <Tabs defaultValue="health">
        <TabsList className="grid grid-cols-4 md:grid-cols-8 w-full h-auto bg-slate-100 p-1 rounded-xl gap-0.5">
          {[
            { value: 'health',    label: 'Health',    icon: Heart    },
            { value: 'alerts',    label: 'Alerts',    icon: Bell, badge: activeAlertCount > 0 ? activeAlertCount : undefined },
            { value: 'pipelines', label: 'Pipelines', icon: Activity },
            { value: 'warehouse', label: 'Warehouse', icon: Database },
            { value: 'quality',   label: 'DQ',        icon: CheckCircle2, badge: failingDQTables > 0 ? failingDQTables : undefined },
            { value: 'backup',    label: 'Backup',    icon: HardDrive },
            { value: 'dr',        label: 'DR',        icon: Shield   },
            { value: 'storage',   label: 'Storage',   icon: Archive  },
          ].map(({ value, label, icon: Icon, badge }) => (
            <TabsTrigger
              key={value}
              value={value}
              className="flex items-center gap-1 text-xs h-8 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm relative"
            >
              <Icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{label}</span>
              {badge !== undefined && (
                <span className="absolute -top-1 -right-1 h-4 min-w-[16px] px-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {badge}
                </span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="mt-4">
          <TabsContent value="health">
            <SectionCard title="System Health Metrics" icon={Heart}>
              <HealthTab snapshot={healthSnapshot} />
            </SectionCard>
          </TabsContent>

          <TabsContent value="alerts">
            <SectionCard title="Infrastructure Alerts" icon={Bell}>
              <AlertsTab alerts={alerts} summary={alertSummary} onRefresh={fetchAll} />
            </SectionCard>
          </TabsContent>

          <TabsContent value="pipelines">
            <SectionCard title="Pipeline Definitions" icon={Activity}>
              <PipelinesTab pipelines={pipelines} onRefresh={fetchAll} />
            </SectionCard>
          </TabsContent>

          <TabsContent value="warehouse">
            <SectionCard title="Warehouse Sync Jobs  (PostgreSQL → ClickHouse)" icon={Database}>
              <WarehouseTab status={warehouseStatus} jobs={warehouseJobs} />
            </SectionCard>
          </TabsContent>

          <TabsContent value="quality">
            <SectionCard title="Data Quality theo bảng" icon={CheckCircle2}>
              <DataQualityTab summary={dqSummary} />
            </SectionCard>
          </TabsContent>

          <TabsContent value="backup">
            <SectionCard title="Backup & Restore" icon={HardDrive}>
              <BackupsTab jobs={backupJobs} freshness={freshness} restoreJobs={restoreJobs} />
            </SectionCard>
          </TabsContent>

          <TabsContent value="dr" className="space-y-4">
            <SectionCard title="Disaster Recovery Readiness" icon={Shield}>
              <DRTab readiness={drReadiness} />
            </SectionCard>
            <SectionCard title="Alert Threshold Policies" icon={AlertTriangle}>
              <ThresholdsTab policies={thresholds} />
            </SectionCard>
          </TabsContent>

          <TabsContent value="storage">
            <SectionCard title="Storage Buckets (MinIO)" icon={Archive}>
              <StorageTab buckets={buckets} />
            </SectionCard>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
