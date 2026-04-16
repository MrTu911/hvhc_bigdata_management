'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Brain, AlertTriangle, Users, TrendingUp, ShieldCheck, MessageSquare,
  Bell, BarChart2, GraduationCap, RefreshCw, Send, Bot, User,
  CheckCircle, XCircle, ChevronRight, Zap, Target, Star,
  Activity, Clock, Award
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, ResponsiveContainer, Tooltip,
} from 'recharts';

// ─── Types ────────────────────────────────────────────────────────────────────

interface EarlyWarning {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  title: string;
  description: string;
  affectedEntities: number;
  detectedAt: string | Date;
  acknowledged: boolean;
  aiConfidence: number;
}

interface PromotionCandidate {
  id: string;
  name: string;
  militaryId: string;
  rank: string;
  position: string;
  unit?: string;
  overallScore: number;
  promotionReadiness: number;
  stabilityIndex: number;
}

interface StabilityRiskFactor {
  factor: string;
  severity: string;
  description: string;
  affectedPersonnel?: number;
}

interface HRDimension {
  label: string;
  score: number;
  max: number;
  details: string;
}

interface HRAnalysis {
  dimensions: HRDimension[];
  overallScore: number;
  stabilityIndex: number;
  promotionReadiness: number;
}

interface PersonnelSubject {
  id: string;
  name: string;
  militaryId: string;
  rank: string;
  position: string;
  unitRelation?: { name: string };
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  aiMode?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SEVERITY_CONFIG = {
  critical: {
    label: 'Khẩn cấp',
    border: 'border-l-red-600',
    bg: 'bg-red-50 dark:bg-red-950/30',
    badge: 'bg-red-600 text-white',
    icon: 'text-red-600',
  },
  high: {
    label: 'Cao',
    border: 'border-l-orange-500',
    bg: 'bg-orange-50 dark:bg-orange-950/30',
    badge: 'bg-orange-500 text-white',
    icon: 'text-orange-500',
  },
  medium: {
    label: 'Trung bình',
    border: 'border-l-yellow-500',
    bg: 'bg-yellow-50 dark:bg-yellow-950/30',
    badge: 'bg-yellow-500 text-white',
    icon: 'text-yellow-600',
  },
  low: {
    label: 'Thấp',
    border: 'border-l-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    badge: 'bg-blue-400 text-white',
    icon: 'text-blue-500',
  },
};

const COMMANDER_PROMPTS = [
  'Tình hình học viên rủi ro trong tháng này?',
  'Nhân sự đơn vị nào cần chú ý đặc biệt?',
  'Dự báo thiếu hụt nhân lực 3 tháng tới?',
  'Ai đủ điều kiện thăng tiến trong quý này?',
  'Tổng hợp cảnh báo quan trọng hôm nay?',
  'Đánh giá chỉ số ổn định đơn vị hiện tại?',
];

// ─── Utility helpers ──────────────────────────────────────────────────────────

function formatTimeAgo(date: string | Date): string {
  const d = new Date(date);
  const now = Date.now();
  const diff = now - d.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  return `${Math.floor(hours / 24)} ngày trước`;
}

function getReadinessLabel(score: number): { label: string; color: string } {
  if (score >= 0.8) return { label: 'Sẵn sàng cao', color: 'text-green-600' };
  if (score >= 0.6) return { label: 'Sẵn sàng', color: 'text-blue-600' };
  if (score >= 0.4) return { label: 'Cần phát triển', color: 'text-yellow-600' };
  return { label: 'Chưa sẵn sàng', color: 'text-red-600' };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function KPICard({
  icon: Icon,
  label,
  value,
  sub,
  color,
  loading,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
  loading?: boolean;
}) {
  return (
    <Card className="relative overflow-hidden">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-muted-foreground font-medium">{label}</span>
          <div className={cn('p-2 rounded-lg', color + '/10')}>
            <Icon className={cn('h-5 w-5', color)} />
          </div>
        </div>
        {loading ? (
          <div className="h-8 w-16 bg-muted animate-pulse rounded" />
        ) : (
          <div className={cn('text-3xl font-bold', color)}>{value}</div>
        )}
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </CardContent>
    </Card>
  );
}

function SeverityBadge({ severity }: { severity: string }) {
  const cfg = SEVERITY_CONFIG[severity as keyof typeof SEVERITY_CONFIG];
  if (!cfg) return null;
  return (
    <span className={cn('text-xs px-2 py-0.5 rounded-full font-semibold', cfg.badge)}>
      {cfg.label}
    </span>
  );
}

function WarningCard({
  warning,
  onAcknowledge,
}: {
  warning: EarlyWarning;
  onAcknowledge?: (id: string) => void;
}) {
  const cfg = SEVERITY_CONFIG[warning.severity] ?? SEVERITY_CONFIG.low;
  return (
    <div
      className={cn(
        'p-4 rounded-lg border-l-4 transition-all hover:shadow-md',
        cfg.border,
        cfg.bg,
        warning.acknowledged && 'opacity-50'
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <AlertTriangle className={cn('h-4 w-4 flex-shrink-0', cfg.icon)} />
            <SeverityBadge severity={warning.severity} />
            <Badge variant="outline" className="text-xs">
              {warning.category}
            </Badge>
            {warning.acknowledged && (
              <Badge variant="secondary" className="text-xs">
                Đã xử lý
              </Badge>
            )}
          </div>
          <p className="font-semibold text-sm mb-1">{warning.title}</p>
          <p className="text-sm text-muted-foreground line-clamp-2">{warning.description}</p>
          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
            <span>Ảnh hưởng: <strong>{warning.affectedEntities}</strong></span>
            <span>Độ tin cậy AI: <strong>{Math.round(warning.aiConfidence * 100)}%</strong></span>
            <span>{formatTimeAgo(warning.detectedAt)}</span>
          </div>
        </div>
        {!warning.acknowledged && onAcknowledge && (
          <Button
            size="sm"
            variant="outline"
            className="flex-shrink-0"
            onClick={() => onAcknowledge(warning.id)}
          >
            <CheckCircle className="h-4 w-4 mr-1" />
            Xử lý
          </Button>
        )}
      </div>
    </div>
  );
}

// ─── Tab: Tổng quan ───────────────────────────────────────────────────────────

function TabOverview() {
  const [warnings, setWarnings] = useState<EarlyWarning[]>([]);
  const [promotionCandidates, setPromotionCandidates] = useState<PromotionCandidate[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [wRes, pRes] = await Promise.allSettled([
        fetch('/api/ai/early-warnings'),
        fetch('/api/ai/promotion-forecast?limit=5'),
      ]);

      if (wRes.status === 'fulfilled' && wRes.value.ok) {
        const d = await wRes.value.json();
        setWarnings(d.warnings ?? []);
      }
      if (pRes.status === 'fulfilled' && pRes.value.ok) {
        const d = await pRes.value.json();
        setPromotionCandidates(d.data ?? []);
      }
    } catch (e) {
      console.error('[TabOverview] fetch error', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const unacked = warnings.filter((w) => !w.acknowledged);
  const criticalCount = unacked.filter((w) => w.severity === 'critical').length;
  const highCount = unacked.filter((w) => w.severity === 'high').length;
  const topWarnings = [...unacked]
    .sort((a, b) => {
      const order = { critical: 0, high: 1, medium: 2, low: 3 };
      return (order[a.severity] ?? 9) - (order[b.severity] ?? 9);
    })
    .slice(0, 3);

  const acknowledgeWarning = (id: string) => {
    setWarnings((prev) => prev.map((w) => (w.id === id ? { ...w, acknowledged: true } : w)));
  };

  return (
    <div className="space-y-6">
      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard
          icon={Zap}
          label="Cảnh báo khẩn cấp"
          value={loading ? '-' : criticalCount}
          sub={loading ? '' : `${highCount} mức cao`}
          color="text-red-600"
          loading={loading}
        />
        <KPICard
          icon={Bell}
          label="Chưa xử lý"
          value={loading ? '-' : unacked.length}
          sub={loading ? '' : `/ ${warnings.length} tổng`}
          color="text-orange-500"
          loading={loading}
        />
        <KPICard
          icon={Star}
          label="Nhân sự thăng tiến"
          value={loading ? '-' : promotionCandidates.length}
          sub="tiềm năng xác định"
          color="text-blue-600"
          loading={loading}
        />
        <KPICard
          icon={ShieldCheck}
          label="Trạng thái AI"
          value="Hoạt động"
          sub="Cập nhật liên tục"
          color="text-green-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top 3 Critical Warnings */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                Cảnh báo ưu tiên cao
              </CardTitle>
              <Badge variant="destructive">{unacked.length} chưa xử lý</Badge>
            </div>
            <CardDescription>Các cảnh báo cần chỉ huy quan tâm ngay</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            ) : topWarnings.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
                <p className="text-muted-foreground text-sm">Không có cảnh báo cần xử lý</p>
              </div>
            ) : (
              <div className="space-y-3">
                {topWarnings.map((w) => (
                  <WarningCard key={w.id} warning={w} onAcknowledge={acknowledgeWarning} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Promotion Candidates */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              Nhân sự tiềm năng thăng tiến
            </CardTitle>
            <CardDescription>Dự báo AI dựa trên 6 chiều đánh giá</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-12 bg-muted animate-pulse rounded" />
                ))}
              </div>
            ) : promotionCandidates.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                Chưa có dữ liệu dự báo
              </div>
            ) : (
              <div className="space-y-3">
                {promotionCandidates.map((c, idx) => {
                  const readiness = getReadinessLabel(c.promotionReadiness);
                  return (
                    <div
                      key={c.id}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm flex-shrink-0">
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{c.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {c.rank} · {c.position}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className={cn('text-sm font-bold', readiness.color)}>
                          {readiness.label}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {Math.round(c.promotionReadiness * 100)}%
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* AI System Status */}
      <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/40 dark:to-indigo-950/40 border-purple-200 dark:border-purple-800">
        <CardContent className="pt-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <Brain className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-semibold">Phân tích Nhân sự</p>
                <p className="text-xs text-muted-foreground">Radar 6D · Độ chính xác 87%</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-semibold">Cảnh báo Sớm</p>
                <p className="text-xs text-muted-foreground">Cập nhật mỗi 60 giây</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <MessageSquare className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-semibold">Tư vấn AI</p>
                <p className="text-xs text-muted-foreground">Chat thông minh · Bảo mật theo scope</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Tab: Cảnh báo Sớm ───────────────────────────────────────────────────────

function TabEarlyWarnings() {
  const [warnings, setWarnings] = useState<EarlyWarning[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'critical'>('active');
  const [refreshing, setRefreshing] = useState(false);

  const fetchWarnings = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const res = await fetch('/api/ai/early-warnings');
      if (res.ok) {
        const data = await res.json();
        setWarnings(data.warnings ?? []);
      }
    } catch (e) {
      console.error('[TabEarlyWarnings]', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchWarnings();
    const interval = setInterval(() => fetchWarnings(true), 60000);
    return () => clearInterval(interval);
  }, [fetchWarnings]);

  const acknowledgeWarning = async (id: string) => {
    try {
      await fetch('/api/ai/early-warnings', { method: 'POST', body: JSON.stringify({ id }) });
      setWarnings((prev) => prev.map((w) => (w.id === id ? { ...w, acknowledged: true } : w)));
    } catch (e) {
      console.error('[acknowledgeWarning]', e);
    }
  };

  const filtered = warnings.filter((w) => {
    if (filter === 'active') return !w.acknowledged;
    if (filter === 'critical') return w.severity === 'critical' || w.severity === 'high';
    return true;
  });

  const counts = {
    critical: warnings.filter((w) => !w.acknowledged && (w.severity === 'critical' || w.severity === 'high')).length,
    active: warnings.filter((w) => !w.acknowledged).length,
    all: warnings.length,
  };

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-2">
          {[
            { key: 'active', label: `Chưa xử lý (${counts.active})` },
            { key: 'critical', label: `Khẩn cấp (${counts.critical})` },
            { key: 'all', label: `Tất cả (${counts.all})` },
          ].map(({ key, label }) => (
            <Button
              key={key}
              size="sm"
              variant={filter === key ? 'default' : 'outline'}
              onClick={() => setFilter(key as typeof filter)}
            >
              {label}
            </Button>
          ))}
        </div>
        <Button size="sm" variant="outline" onClick={() => fetchWarnings(true)} disabled={refreshing}>
          <RefreshCw className={cn('h-4 w-4 mr-1', refreshing && 'animate-spin')} />
          Làm mới
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-3" />
          <p className="text-lg font-semibold">Tình hình ổn định</p>
          <p className="text-muted-foreground text-sm">Không có cảnh báo trong danh mục này</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((w) => (
            <WarningCard key={w.id} warning={w} onAcknowledge={acknowledgeWarning} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Tab: Phân tích Nhân sự ───────────────────────────────────────────────────

function HRRadarChart({ dimensions }: { dimensions: HRDimension[] }) {
  const data = dimensions.map((d) => ({
    label: d.label,
    value: d.score,
    fullMark: d.max,
  }));

  return (
    <ResponsiveContainer width="100%" height={320}>
      <RadarChart data={data}>
        <PolarGrid stroke="#e5e7eb" />
        <PolarAngleAxis dataKey="label" tick={{ fill: '#6b7280', fontSize: 12 }} />
        <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#9ca3af', fontSize: 10 }} />
        <Radar
          name="Đánh giá"
          dataKey="value"
          stroke="#6366f1"
          fill="#6366f1"
          fillOpacity={0.5}
        />
        <Tooltip
          content={({ active, payload }) => {
            if (active && payload?.length) {
              const d = payload[0].payload;
              const dim = dimensions.find((x) => x.label === d.label);
              return (
                <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border text-sm">
                  <p className="font-semibold mb-1">{d.label}</p>
                  <p className="text-indigo-600 font-bold">{d.value.toFixed(0)} điểm</p>
                  {dim && <p className="text-muted-foreground text-xs mt-1">{dim.details}</p>}
                </div>
              );
            }
            return null;
          }}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}

function TabPersonnel() {
  const [searchId, setSearchId] = useState('');
  const [inputId, setInputId] = useState('');
  const [analysis, setAnalysis] = useState<HRAnalysis | null>(null);
  const [subject, setSubject] = useState<PersonnelSubject | null>(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [promotionList, setPromotionList] = useState<PromotionCandidate[]>([]);
  const [stabilityRisks, setStabilityRisks] = useState<StabilityRiskFactor[]>([]);
  const [loadingLists, setLoadingLists] = useState(true);
  const [analysisError, setAnalysisError] = useState('');

  const fetchLists = useCallback(async () => {
    setLoadingLists(true);
    try {
      const [pRes, sRes] = await Promise.allSettled([
        fetch('/api/ai/promotion-forecast?limit=10'),
        fetch('/api/ai/stability-index'),
      ]);

      if (pRes.status === 'fulfilled' && pRes.value.ok) {
        const d = await pRes.value.json();
        setPromotionList(d.data ?? []);
      }
      if (sRes.status === 'fulfilled' && sRes.value.ok) {
        const d = await sRes.value.json();
        setStabilityRisks(d.data?.riskFactors ?? []);
      }
    } catch (e) {
      console.error('[TabPersonnel] fetchLists', e);
    } finally {
      setLoadingLists(false);
    }
  }, []);

  useEffect(() => {
    fetchLists();
  }, [fetchLists]);

  const analyzePersonnel = async () => {
    if (!inputId.trim()) return;
    setSearchId(inputId.trim());
    setLoadingAnalysis(true);
    setAnalysisError('');
    setAnalysis(null);
    setSubject(null);

    try {
      const res = await fetch('/api/ai/hr-analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: inputId.trim() }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setAnalysisError(err.error || 'Không tìm thấy nhân sự');
        return;
      }

      const data = await res.json();
      setAnalysis(data.analysis);
      setSubject(data.subject);
    } catch (e) {
      setAnalysisError('Lỗi kết nối, vui lòng thử lại');
    } finally {
      setLoadingAnalysis(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* HR Analysis Search */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart2 className="h-5 w-5 text-indigo-500" />
            Phân tích nhân sự 6 chiều (AI)
          </CardTitle>
          <CardDescription>
            Nhập ID người dùng để xem radar đánh giá: Năng lực · Kinh nghiệm · Đào tạo · Khen thưởng · Nghiên cứu · Ổn định
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Input
              placeholder="Nhập User ID hoặc mã cán bộ..."
              value={inputId}
              onChange={(e) => setInputId(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && analyzePersonnel()}
              className="max-w-sm"
            />
            <Button onClick={analyzePersonnel} disabled={loadingAnalysis || !inputId.trim()}>
              {loadingAnalysis ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Target className="h-4 w-4 mr-1" />
                  Phân tích
                </>
              )}
            </Button>
          </div>

          {analysisError && (
            <div className="flex items-center gap-2 text-red-600 text-sm p-3 bg-red-50 dark:bg-red-950/30 rounded-lg">
              <XCircle className="h-4 w-4 flex-shrink-0" />
              {analysisError}
            </div>
          )}

          {analysis && subject && (
            <div className="mt-4">
              {/* Subject header */}
              <div className="flex items-center gap-3 p-4 bg-indigo-50 dark:bg-indigo-950/30 rounded-lg mb-4">
                <div className="h-12 w-12 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                  {subject.name?.charAt(0) ?? '?'}
                </div>
                <div>
                  <p className="font-bold">{subject.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {subject.rank} · {subject.position}
                    {subject.unitRelation && ` · ${subject.unitRelation.name}`}
                  </p>
                </div>
                <div className="ml-auto text-right">
                  <p className="text-3xl font-bold text-indigo-600">{analysis.overallScore}</p>
                  <p className="text-xs text-muted-foreground">điểm tổng hợp</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Radar */}
                <div>
                  <p className="text-sm font-semibold mb-2 text-center">Biểu đồ 6 chiều</p>
                  <HRRadarChart dimensions={analysis.dimensions} />
                </div>

                {/* Dimensions breakdown */}
                <div className="space-y-3">
                  {analysis.dimensions.map((dim) => (
                    <div key={dim.label}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium">{dim.label}</span>
                        <span className="text-muted-foreground">
                          {dim.score.toFixed(0)}/{dim.max}
                        </span>
                      </div>
                      <Progress value={(dim.score / dim.max) * 100} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-1">{dim.details}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Readiness scores */}
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-lg text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {Math.round(analysis.promotionReadiness * 100)}%
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Sẵn sàng thăng tiến</p>
                </div>
                <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg text-center">
                  <p className="text-2xl font-bold text-blue-600">
                    {Math.round(analysis.stabilityIndex * 100)}%
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Chỉ số ổn định</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Promotion Forecast List */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Award className="h-5 w-5 text-blue-500" />
              Danh sách thăng tiến tiềm năng
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingLists ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-14 bg-muted animate-pulse rounded" />
                ))}
              </div>
            ) : promotionList.length === 0 ? (
              <p className="text-center text-muted-foreground text-sm py-6">Chưa có dữ liệu</p>
            ) : (
              <div className="space-y-2">
                {promotionList.map((c, idx) => {
                  const readiness = getReadinessLabel(c.promotionReadiness);
                  return (
                    <div
                      key={c.id}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => {
                        setInputId(c.id);
                        analyzePersonnel();
                      }}
                    >
                      <span className="w-6 text-center text-sm font-bold text-muted-foreground">
                        {idx + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{c.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {c.rank} · {c.position}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={cn('text-xs font-semibold', readiness.color)}>
                          {Math.round(c.promotionReadiness * 100)}%
                        </span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stability Risk Factors */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="h-5 w-5 text-orange-500" />
              Yếu tố rủi ro ổn định đơn vị
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingLists ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-14 bg-muted animate-pulse rounded" />
                ))}
              </div>
            ) : stabilityRisks.length === 0 ? (
              <div className="text-center py-6">
                <ShieldCheck className="h-10 w-10 text-green-500 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Đơn vị ổn định, không có rủi ro</p>
              </div>
            ) : (
              <div className="space-y-3">
                {stabilityRisks.slice(0, 6).map((risk, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-800"
                  >
                    <AlertTriangle className="h-4 w-4 text-orange-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold">{risk.factor}</p>
                      <p className="text-xs text-muted-foreground">{risk.description}</p>
                      {risk.affectedPersonnel !== undefined && (
                        <p className="text-xs text-orange-600 mt-1">
                          Ảnh hưởng: {risk.affectedPersonnel} người
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── Tab: Dự báo Đào tạo ─────────────────────────────────────────────────────

interface TrainingPrediction {
  id: string;
  name: string;
  currentScore: number;
  predictedScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  confidence: number;
}

const RISK_CONFIG = {
  high: { label: 'Rủi ro cao', color: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' },
  medium: { label: 'Trung bình', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300' },
  low: { label: 'Thấp', color: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' },
};

function TabTraining() {
  const [predictions, setPredictions] = useState<TrainingPrediction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPredictions = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/demo/predict-training');
        if (res.ok) {
          const d = await res.json();
          if (d.success) setPredictions(d.data ?? []);
        }
      } catch (e) {
        console.error('[TabTraining]', e);
      } finally {
        setLoading(false);
      }
    };
    loadPredictions();
  }, []);

  const high = predictions.filter((p) => p.riskLevel === 'high');
  const medium = predictions.filter((p) => p.riskLevel === 'medium');
  const low = predictions.filter((p) => p.riskLevel === 'low');

  return (
    <div className="space-y-5">
      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard icon={GraduationCap} label="Tổng học viên" value={predictions.length} color="text-indigo-600" loading={loading} />
        <KPICard icon={AlertTriangle} label="Rủi ro cao" value={high.length} color="text-red-600" loading={loading} />
        <KPICard icon={Clock} label="Cần theo dõi" value={medium.length} color="text-yellow-600" loading={loading} />
        <KPICard icon={CheckCircle} label="Ổn định" value={low.length} color="text-green-600" loading={loading} />
      </div>

      {/* Predictions table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Brain className="h-5 w-5 text-purple-500" />
            Dự báo kết quả học viên
          </CardTitle>
          <CardDescription>
            AI dự đoán điểm số cuối kỳ và đánh giá mức độ rủi ro từng học viên
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-12 bg-muted animate-pulse rounded" />
              ))}
            </div>
          ) : predictions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Chưa có dữ liệu dự báo</p>
          ) : (
            <div className="space-y-2">
              {/* Priority: high risk first */}
              {[...predictions]
                .sort((a, b) => {
                  const order = { high: 0, medium: 1, low: 2 };
                  return order[a.riskLevel] - order[b.riskLevel];
                })
                .map((pred) => {
                  const trend = pred.predictedScore - pred.currentScore;
                  const risk = RISK_CONFIG[pred.riskLevel];
                  return (
                    <div
                      key={pred.id}
                      className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/40 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{pred.name}</p>
                      </div>
                      <div className="flex items-center gap-6 flex-shrink-0 text-sm">
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground">Hiện tại</p>
                          <p className="font-semibold">{pred.currentScore.toFixed(1)}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground">Dự báo</p>
                          <p className={cn('font-bold', trend >= 0 ? 'text-green-600' : 'text-red-600')}>
                            {pred.predictedScore.toFixed(1)}
                            <span className="text-xs ml-1">
                              ({trend >= 0 ? '+' : ''}{trend.toFixed(1)})
                            </span>
                          </p>
                        </div>
                        <span className={cn('text-xs px-2 py-1 rounded-full font-semibold', risk.color)}>
                          {risk.label}
                        </span>
                        <div className="flex items-center gap-1 w-24">
                          <Progress value={pred.confidence} className="h-1.5 flex-1" />
                          <span className="text-xs text-muted-foreground w-8">{pred.confidence}%</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* At-risk highlight */}
      {high.length > 0 && (
        <Card className="border-red-300 bg-red-50 dark:bg-red-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-red-700 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              {high.length} học viên cần can thiệp ngay
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {high.map((p) => (
                <Badge key={p.id} variant="destructive">
                  {p.name} ({p.currentScore.toFixed(1)} → {p.predictedScore.toFixed(1)})
                </Badge>
              ))}
            </div>
            <p className="text-sm text-red-600 mt-3">
              Đề xuất: Sắp xếp gặp trực tiếp, tăng cường phụ đạo, thông báo giảng viên chủ nhiệm.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Tab: Tư vấn AI Chat ──────────────────────────────────────────────────────

function TabAIChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || loading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content,
          role: 'commander',
          history: messages.slice(-10),
          context: 'Chỉ huy đang sử dụng module Trí Tuệ Chỉ Huy AI để phân tích tình hình đơn vị',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: data.response,
            timestamp: new Date(),
            aiMode: data.aiMode,
          },
        ]);
      }
    } catch (e) {
      console.error('[TabAIChat]', e);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'Lỗi kết nối tới AI. Vui lòng thử lại.',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-280px)] min-h-[500px]">
      {/* Message area */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-2 pb-4">
        {messages.length === 0 && (
          <div className="text-center py-10">
            <div className="w-16 h-16 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center mx-auto mb-4">
              <Brain className="h-8 w-8 text-indigo-600" />
            </div>
            <h3 className="font-semibold text-lg mb-1">Trợ lý AI Chỉ Huy</h3>
            <p className="text-muted-foreground text-sm mb-6">
              Tôi có thể phân tích nhân sự, tổng hợp tình hình và hỗ trợ ra quyết định dựa trên dữ liệu thực tế của đơn vị.
            </p>

            {/* Suggested prompts */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-xl mx-auto">
              {COMMANDER_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => sendMessage(prompt)}
                  className="text-left text-sm p-3 rounded-lg border hover:bg-muted/60 transition-colors text-muted-foreground hover:text-foreground"
                >
                  <ChevronRight className="h-3 w-3 inline mr-1" />
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn('flex gap-3', msg.role === 'user' ? 'justify-end' : 'justify-start')}
          >
            {msg.role === 'assistant' && (
              <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center flex-shrink-0">
                <Bot className="h-4 w-4 text-indigo-600" />
              </div>
            )}

            <div
              className={cn(
                'max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed',
                msg.role === 'user'
                  ? 'bg-indigo-600 text-white rounded-br-sm'
                  : 'bg-muted rounded-bl-sm'
              )}
            >
              <p className="whitespace-pre-wrap">{msg.content}</p>
              <div
                className={cn(
                  'flex items-center gap-2 mt-1 text-xs',
                  msg.role === 'user' ? 'text-indigo-200 justify-end' : 'text-muted-foreground'
                )}
              >
                <span>{msg.timestamp.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                {msg.aiMode && msg.aiMode !== 'online' && (
                  <Badge variant="outline" className="text-xs py-0">
                    {msg.aiMode}
                  </Badge>
                )}
              </div>
            </div>

            {msg.role === 'user' && (
              <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0">
                <User className="h-4 w-4 text-white" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 justify-start">
            <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
              <Bot className="h-4 w-4 text-indigo-600 animate-pulse" />
            </div>
            <div className="bg-muted px-4 py-3 rounded-2xl rounded-bl-sm">
              <div className="flex gap-1 items-center h-4">
                {[0, 150, 300].map((delay) => (
                  <div
                    key={delay}
                    className="h-2 w-2 bg-indigo-400 rounded-full animate-bounce"
                    style={{ animationDelay: `${delay}ms` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Separator */}
      <div className="border-t pt-4">
        {/* Quick prompts (when chat started) */}
        {messages.length > 0 && (
          <div className="flex gap-2 mb-3 overflow-x-auto pb-2">
            {COMMANDER_PROMPTS.slice(0, 3).map((prompt) => (
              <button
                key={prompt}
                onClick={() => sendMessage(prompt)}
                disabled={loading}
                className="text-xs px-3 py-1.5 rounded-full border hover:bg-muted/60 transition-colors whitespace-nowrap text-muted-foreground flex-shrink-0"
              >
                {prompt}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder="Hỏi AI về tình hình đơn vị, nhân sự, học viên..."
            disabled={loading}
            className="flex-1"
          />
          <Button onClick={() => sendMessage()} disabled={loading || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          AI được giới hạn theo phạm vi quyền của bạn · Không cung cấp thông tin nhạy cảm vượt scope
        </p>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AIAdvisorPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [lastRefresh, setLastRefresh] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setLastRefresh(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <div className="p-2 bg-indigo-600 rounded-xl">
              <Brain className="h-6 w-6 text-white" />
            </div>
            Trí Tuệ Chỉ Huy AI
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Hệ thống phân tích thông minh · Hỗ trợ ra quyết định · Cảnh báo sớm
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground flex-shrink-0">
          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          <span>Cập nhật {lastRefresh.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-5">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="overview" className="gap-1.5">
            <BarChart2 className="h-4 w-4" />
            Tổng quan
          </TabsTrigger>
          <TabsTrigger value="warnings" className="gap-1.5">
            <AlertTriangle className="h-4 w-4" />
            Cảnh báo Sớm
          </TabsTrigger>
          <TabsTrigger value="personnel" className="gap-1.5">
            <Users className="h-4 w-4" />
            Phân tích Nhân sự
          </TabsTrigger>
          <TabsTrigger value="training" className="gap-1.5">
            <GraduationCap className="h-4 w-4" />
            Dự báo Đào tạo
          </TabsTrigger>
          <TabsTrigger value="chat" className="gap-1.5">
            <MessageSquare className="h-4 w-4" />
            Tư vấn AI
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <TabOverview />
        </TabsContent>

        <TabsContent value="warnings">
          <TabEarlyWarnings />
        </TabsContent>

        <TabsContent value="personnel">
          <TabPersonnel />
        </TabsContent>

        <TabsContent value="training">
          <TabTraining />
        </TabsContent>

        <TabsContent value="chat">
          <TabAIChat />
        </TabsContent>
      </Tabs>
    </div>
  );
}
