'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  CheckCircle2, AlertCircle, Clock, RefreshCw, Shield,
  BarChart2, Database, BookOpen, Users,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface DataQualityScore {
  entityType:   'PROJECT' | 'PUBLICATION' | 'SCIENTIST';
  completeness: number;
  accuracy:     number;
  timeliness:   number;
  overallScore: number;
  sampleSize:   number;
  evaluatedAt:  string;
}

interface DataQualityReport {
  scores:      DataQualityScore[];
  overallAvg:  number;
  generatedAt: string;
  fromCache:   boolean;
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const ENTITY_CONFIG: Record<string, {
  label: string;
  icon: typeof Database;
  color: string;
  gradient: string;
}> = {
  PROJECT:     { label: 'Đề tài NCKH',      icon: BarChart2, color: 'text-violet-600', gradient: 'from-violet-500 to-purple-600' },
  PUBLICATION: { label: 'Công bố KH',        icon: BookOpen,  color: 'text-blue-600',   gradient: 'from-blue-500 to-indigo-600'   },
  SCIENTIST:   { label: 'Nhà Khoa học',      icon: Users,     color: 'text-amber-600',  gradient: 'from-amber-500 to-orange-600'  },
};

const DIMENSION_LABELS: Record<string, string> = {
  completeness: 'Đầy đủ',
  accuracy:     'Chính xác',
  timeliness:   'Kịp thời',
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

function scoreColor(score: number): string {
  if (score >= 80) return 'text-emerald-600';
  if (score >= 60) return 'text-amber-600';
  return 'text-red-500';
}

function scoreBg(score: number): string {
  if (score >= 80) return 'bg-emerald-50 border-emerald-200';
  if (score >= 60) return 'bg-amber-50 border-amber-200';
  return 'bg-red-50 border-red-200';
}

function ScoreBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            value >= 80 ? 'bg-emerald-500' : value >= 60 ? 'bg-amber-500' : 'bg-red-500'
          }`}
          style={{ width: `${Math.min(value, 100)}%` }}
        />
      </div>
      <span className={`text-xs font-semibold w-10 text-right ${color}`}>
        {value.toFixed(1)}%
      </span>
    </div>
  );
}

function QualityBadge({ score }: { score: number }) {
  if (score >= 80) return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Tốt</Badge>;
  if (score >= 60) return <Badge className="bg-amber-100 text-amber-700 border-amber-200">Trung bình</Badge>;
  return <Badge className="bg-red-100 text-red-700 border-red-200">Cần cải thiện</Badge>;
}

// ─── Score Card ────────────────────────────────────────────────────────────────

function EntityScoreCard({ score }: { score: DataQualityScore }) {
  const cfg = ENTITY_CONFIG[score.entityType] ?? {
    label: score.entityType, icon: Database, color: 'text-slate-600', gradient: 'from-slate-500 to-gray-600',
  };
  const Icon = cfg.icon;

  return (
    <Card className={`border ${scoreBg(score.overallScore)}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg bg-gradient-to-br ${cfg.gradient} shadow-sm`}>
              <Icon className="h-4 w-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold">{cfg.label}</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                {score.sampleSize} mẫu · {new Date(score.evaluatedAt).toLocaleDateString('vi-VN')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-2xl font-bold ${scoreColor(score.overallScore)}`}>
              {score.overallScore.toFixed(1)}
            </span>
            <QualityBadge score={score.overallScore} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2.5 pt-0">
        {(['completeness', 'accuracy', 'timeliness'] as const).map((dim) => (
          <div key={dim}>
            <div className="flex justify-between mb-1">
              <span className="text-xs text-muted-foreground">{DIMENSION_LABELS[dim]}</span>
            </div>
            <ScoreBar value={score[dim]} color={scoreColor(score[dim])} />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export default function ScienceDataQualityPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [report, setReport] = useState<DataQualityReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/science/data-quality');
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error ?? `HTTP ${res.status}`);
      }
      const json = await res.json();
      setReport(json.data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === 'unauthenticated') { router.push('/login'); return; }
    if (status === 'authenticated') fetchReport();
  }, [status, fetchReport, router]);

  if (status === 'loading' || loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-8 w-64 bg-muted animate-pulse rounded" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-52 bg-muted animate-pulse rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 flex flex-col items-center gap-4 text-center">
        <AlertCircle className="h-10 w-10 text-destructive" />
        <p className="text-sm text-destructive">{error}</p>
        <Button size="sm" onClick={fetchReport} type="button">Thử lại</Button>
      </div>
    );
  }

  const overallAvg = report?.overallAvg ?? 0;

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 shadow">
              <CheckCircle2 className="h-4 w-4 text-white" />
            </div>
            <h1 className="text-xl font-bold">Chất lượng Dữ liệu Khoa học</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Đánh giá mức độ đầy đủ, chính xác và kịp thời của dữ liệu KHQL
          </p>
        </div>
        <div className="flex items-center gap-2">
          {report?.fromCache && (
            <Badge variant="outline" className="text-xs gap-1">
              <Clock className="h-3 w-3" /> Từ cache
            </Badge>
          )}
          <Button variant="outline" size="sm" onClick={fetchReport} className="gap-1" type="button">
            <RefreshCw className="h-3.5 w-3.5" /> Làm mới
          </Button>
        </div>
      </div>

      {/* Overall score banner */}
      <Card className={`border ${scoreBg(overallAvg)}`}>
        <CardContent className="py-5 px-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-1">
                Điểm chất lượng tổng hợp
              </p>
              <p className={`text-4xl font-bold ${scoreColor(overallAvg)}`}>
                {overallAvg.toFixed(1)}<span className="text-lg font-normal text-muted-foreground">/100</span>
              </p>
              {report && (
                <p className="text-xs text-muted-foreground mt-1">
                  Tính lúc {new Date(report.generatedAt).toLocaleString('vi-VN')}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-xs">
                <span className="w-3 h-3 rounded-full bg-emerald-500 shrink-0" />
                <span className="text-muted-foreground">≥ 80 — Tốt</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="w-3 h-3 rounded-full bg-amber-500 shrink-0" />
                <span className="text-muted-foreground">60–79 — Trung bình</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="w-3 h-3 rounded-full bg-red-500 shrink-0" />
                <span className="text-muted-foreground">&lt; 60 — Cần cải thiện</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Entity score cards */}
      {report && report.scores.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {report.scores.map((s) => (
            <EntityScoreCard key={s.entityType} score={s} />
          ))}
        </div>
      ) : (
        !loading && (
          <div className="flex flex-col items-center py-16 text-center">
            <Shield className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">Chưa có dữ liệu để đánh giá chất lượng</p>
          </div>
        )
      )}

      {/* Dimension explanation */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Cách tính điểm chất lượng</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            {[
              {
                label: 'Đầy đủ (40%)',
                desc: 'Tỷ lệ trường bắt buộc không rỗng — tiêu đề, tóm tắt, lĩnh vực, ngày tháng...',
                color: 'bg-violet-100 text-violet-700',
              },
              {
                label: 'Chính xác (40%)',
                desc: 'Tỷ lệ bản ghi qua kiểm tra cross-field — ngày kết thúc sau ngày bắt đầu, giá trị enum hợp lệ...',
                color: 'bg-blue-100 text-blue-700',
              },
              {
                label: 'Kịp thời (20%)',
                desc: 'Tỷ lệ bản ghi được cập nhật trong ngưỡng quy định — Đề tài: 90 ngày, Công bố: 180 ngày...',
                color: 'bg-teal-100 text-teal-700',
              },
            ].map(({ label, desc, color }) => (
              <div key={label} className="space-y-1.5">
                <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${color}`}>{label}</span>
                <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
