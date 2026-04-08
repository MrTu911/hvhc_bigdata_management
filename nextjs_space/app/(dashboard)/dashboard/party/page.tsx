/**
 * Công tác Đảng — Dashboard tổng quan (v2)
 * Dữ liệu từ /api/party/dashboard/stats (UC-72)
 */
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import {
  Users, UserCheck, UserPlus, CalendarCheck,
  ShieldAlert, CheckCircle2, AlertTriangle,
  Wallet, FileText, Activity, ClipboardList,
  ArrowRight, Plus, RefreshCw, TrendingUp,
  Building2, Star, Award, Eye,
} from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import Link from 'next/link';
import {
  PARTY_STATUS_LABELS,
  PARTY_STATUS_COLORS,
  REVIEW_GRADE_MAP,
  REVIEW_GRADES,
} from '@/lib/constants/party.labels';

// ── Types ───────────────────────────────────────────────────────────────────
interface DashboardStats {
  year: number;
  orgId: string | null;
  kpis: {
    totalMembers: number;
    newlyAdmitted: number;
    attendanceRate: number;
    totalFeeDebt: number;
    debtMemberCount: number;
    disciplineCount: number;
    inspectionCount: number;
  };
  distributions: {
    membersByStatus: Record<string, number>;
    reviewGrades: Record<string, number>;
    inspectionTypes: Record<string, number>;
  };
  fee: { expected: number; actual: number; debt: number };
}

// ── Helpers ─────────────────────────────────────────────────────────────────
function fmt(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}tr`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}k`;
  return String(value);
}

function pct(a: number, b: number): number {
  if (!b) return 0;
  return Math.round((a / b) * 100);
}

// ── Custom Tooltip cho Pie ───────────────────────────────────────────────────
function PieTooltip({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number; payload: { color: string } }> }) {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="rounded-lg border bg-white px-3 py-2 shadow-lg text-sm">
      <div className="flex items-center gap-2">
        <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: d.payload.color }} />
        <span className="font-medium">{d.name}</span>
        <span className="text-muted-foreground">— {d.value}</span>
      </div>
    </div>
  );
}

// ── Quick Action Link ────────────────────────────────────────────────────────
function QuickLink({ href, icon: Icon, label, color }: {
  href: string; icon: React.ElementType; label: string; color: string;
}) {
  return (
    <Link href={href}>
      <div className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border hover:shadow-md transition-all cursor-pointer hover:-translate-y-0.5 ${color}`}>
        <Icon className="h-5 w-5" />
        <span className="text-xs font-medium text-center leading-tight">{label}</span>
      </div>
    </Link>
  );
}

// ── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, icon: Icon, borderColor, textColor, bgIcon }: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; borderColor: string; textColor: string; bgIcon: string;
}) {
  return (
    <Card className={`border-l-4 ${borderColor} hover:shadow-md transition-shadow`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-0.5">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</p>
            <p className={`text-3xl font-bold ${textColor}`}>{value}</p>
            {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
          </div>
          <div className={`p-2.5 rounded-xl ${bgIcon}`}>
            <Icon className={`h-5 w-5 ${textColor}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Loading Skeleton ─────────────────────────────────────────────────────────
function LoadingSkeleton() {
  return (
    <div className="p-6 space-y-6">
      <Skeleton className="h-28 w-full rounded-2xl" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton className="h-80 rounded-xl" />
        <Skeleton className="h-80 rounded-xl" />
      </div>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────
export default function PartyDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/party/dashboard/stats');
      if (res.ok) {
        setStats(await res.json());
      } else {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? `Lỗi ${res.status}`);
      }
    } catch {
      setError('Không thể kết nối đến máy chủ');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  if (loading) return <LoadingSkeleton />;

  // ── Computed values ────────────────────────────────────────────────────────
  const kpis = stats?.kpis;
  const total = kpis?.totalMembers ?? 0;
  const chinhThuc = stats?.distributions.membersByStatus['CHINH_THUC'] ?? 0;
  const duBi = stats?.distributions.membersByStatus['CHINH_THUC'] !== undefined
    ? (stats?.distributions.membersByStatus['DU_BI'] ?? 0)
    : 0;

  // Pie data — trạng thái đảng viên
  const statusPieData = stats
    ? Object.entries(stats.distributions.membersByStatus)
        .filter(([, v]) => v > 0)
        .map(([status, count]) => ({
          name: PARTY_STATUS_LABELS[status as keyof typeof PARTY_STATUS_LABELS] ?? status,
          value: count,
          color: PARTY_STATUS_COLORS[status as keyof typeof PARTY_STATUS_COLORS] ?? '#6b7280',
        }))
    : [];

  // Bar data — xếp loại đánh giá
  const reviewBarData = REVIEW_GRADES.map((g) => ({
    name: g.short,
    fullName: g.label,
    count: stats?.distributions.reviewGrades[g.key] ?? 0,
    color: g.color,
  })).filter((d) => d.count > 0);

  // Phần trăm thu phí
  const feeRate = stats ? pct(stats.fee.actual, stats.fee.expected) : 0;

  // Trạng thái list (sorted)
  const statusList = stats
    ? Object.entries(stats.distributions.membersByStatus)
        .filter(([, v]) => v > 0)
        .sort(([, a], [, b]) => b - a)
    : [];

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="p-6 space-y-6">

        {/* ── Hero Banner ─────────────────────────────────────────────────── */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-700 via-red-600 to-rose-500 p-6 text-white shadow-lg">
          {/* Decorative circles */}
          <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/5" />
          <div className="pointer-events-none absolute -right-4 top-8 h-28 w-28 rounded-full bg-white/5" />

          <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Star className="h-5 w-5 text-yellow-300 fill-yellow-300" />
                <span className="text-red-200 text-sm font-medium uppercase tracking-widest">
                  Công tác Đảng — Năm {stats?.year}
                </span>
              </div>
              <h1 className="text-3xl font-bold tracking-tight">Tổng quan Đảng vụ</h1>
              <p className="text-red-200 mt-1 text-sm">
                Học viện Hậu cần · {total} đảng viên · {chinhThuc} đang sinh hoạt
              </p>
            </div>

            {/* Hero inline stats */}
            <div className="flex gap-4">
              <div className="rounded-xl bg-white/10 px-4 py-3 text-center backdrop-blur-sm">
                <p className="text-2xl font-bold">{total}</p>
                <p className="text-xs text-red-200">Tổng ĐV</p>
              </div>
              <div className="rounded-xl bg-white/10 px-4 py-3 text-center backdrop-blur-sm">
                <p className="text-2xl font-bold">{kpis?.attendanceRate ?? 0}%</p>
                <p className="text-xs text-red-200">Tham dự họp</p>
              </div>
              <div className="rounded-xl bg-white/10 px-4 py-3 text-center backdrop-blur-sm">
                <p className="text-2xl font-bold">{feeRate}%</p>
                <p className="text-xs text-red-200">Thu phí</p>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="relative mt-4 flex flex-wrap gap-2">
            <Link href="/dashboard/party/members">
              <Button size="sm" variant="outline" className="border-white/30 bg-white/10 text-white hover:bg-white/20">
                <Users className="h-4 w-4 mr-1.5" /> Danh sách Đảng viên
              </Button>
            </Link>
            <Link href="/dashboard/party/admissions">
              <Button size="sm" variant="outline" className="border-white/30 bg-white/10 text-white hover:bg-white/20">
                <UserPlus className="h-4 w-4 mr-1.5" /> Kết nạp
              </Button>
            </Link>
            <Link href="/dashboard/party/meetings">
              <Button size="sm" variant="outline" className="border-white/30 bg-white/10 text-white hover:bg-white/20">
                <CalendarCheck className="h-4 w-4 mr-1.5" /> Sinh hoạt
              </Button>
            </Link>
            <Button
              size="sm"
              variant="outline"
              className="border-white/30 bg-white/10 text-white hover:bg-white/20 ml-auto"
              onClick={fetchStats}
            >
              <RefreshCw className="h-4 w-4 mr-1.5" /> Làm mới
            </Button>
          </div>
        </div>

        {/* ── Error banner ────────────────────────────────────────────────── */}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 flex items-center gap-3 text-red-700">
            <AlertTriangle className="h-5 w-5 flex-shrink-0" />
            <span className="text-sm">{error}</span>
            <Button size="sm" variant="ghost" className="ml-auto text-red-700 hover:text-red-900" onClick={fetchStats}>
              Thử lại
            </Button>
          </div>
        )}

        {/* ── KPI Row 1 — Core metrics ─────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard
            label="Tổng Đảng viên"
            value={total}
            sub="Toàn học viện"
            icon={Users}
            borderColor="border-l-red-600"
            textColor="text-red-600"
            bgIcon="bg-red-50"
          />
          <KpiCard
            label="Đang sinh hoạt"
            value={chinhThuc}
            sub={`${pct(chinhThuc, total)}% tổng ĐV`}
            icon={UserCheck}
            borderColor="border-l-emerald-500"
            textColor="text-emerald-600"
            bgIcon="bg-emerald-50"
          />
          <KpiCard
            label="Đảng viên Dự bị"
            value={duBi}
            sub="Đang trong thời gian dự bị"
            icon={TrendingUp}
            borderColor="border-l-blue-500"
            textColor="text-blue-600"
            bgIcon="bg-blue-50"
          />
          <KpiCard
            label="Kết nạp trong năm"
            value={kpis?.newlyAdmitted ?? 0}
            sub={`Năm ${stats?.year}`}
            icon={UserPlus}
            borderColor="border-l-violet-500"
            textColor="text-violet-600"
            bgIcon="bg-violet-50"
          />
        </div>

        {/* ── KPI Row 2 — Operations ──────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <KpiCard
            label="Tỷ lệ tham dự họp"
            value={`${kpis?.attendanceRate ?? 0}%`}
            sub="Trung bình các cuộc họp"
            icon={CalendarCheck}
            borderColor="border-l-amber-500"
            textColor="text-amber-600"
            bgIcon="bg-amber-50"
          />
          <KpiCard
            label="Kỷ luật trong năm"
            value={kpis?.disciplineCount ?? 0}
            sub={kpis?.disciplineCount ? 'Cần theo dõi' : 'Không có vi phạm'}
            icon={ShieldAlert}
            borderColor={kpis?.disciplineCount ? 'border-l-red-500' : 'border-l-slate-300'}
            textColor={kpis?.disciplineCount ? 'text-red-600' : 'text-slate-500'}
            bgIcon={kpis?.disciplineCount ? 'bg-red-50' : 'bg-slate-50'}
          />
          <KpiCard
            label="Đảng viên nợ phí"
            value={kpis?.debtMemberCount ?? 0}
            sub={`Tổng nợ: ${fmt(kpis?.totalFeeDebt ?? 0)}đ`}
            icon={Wallet}
            borderColor={kpis?.debtMemberCount ? 'border-l-orange-500' : 'border-l-slate-300'}
            textColor={kpis?.debtMemberCount ? 'text-orange-600' : 'text-slate-500'}
            bgIcon={kpis?.debtMemberCount ? 'bg-orange-50' : 'bg-slate-50'}
          />
        </div>

        {/* ── Charts Row ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* Donut: Phân bố trạng thái */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Phân bố trạng thái</CardTitle>
              <CardDescription>Tình trạng sinh hoạt Đảng viên</CardDescription>
            </CardHeader>
            <CardContent>
              {statusPieData.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusPieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={95}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {statusPieData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} stroke="white" strokeWidth={2} />
                        ))}
                      </Pie>
                      <Tooltip content={<PieTooltip />} />
                      <Legend
                        iconType="circle"
                        iconSize={8}
                        formatter={(value) => <span className="text-xs text-slate-600">{value}</span>}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex h-64 items-center justify-center text-muted-foreground text-sm">
                  Chưa có dữ liệu
                </div>
              )}
            </CardContent>
          </Card>

          {/* Bar: Kết quả đánh giá */}
          <Card className="lg:col-span-3">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Kết quả đánh giá Đảng viên</CardTitle>
              <CardDescription>Phân loại xếp loại — Năm {stats?.year}</CardDescription>
            </CardHeader>
            <CardContent>
              {reviewBarData.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={reviewBarData} barSize={36}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                      <Tooltip
                        formatter={(value, _, props) => [value, props.payload.fullName]}
                        contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0' }}
                      />
                      <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                        {reviewBarData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex h-64 items-center justify-center text-muted-foreground text-sm">
                  Chưa có dữ liệu đánh giá năm {stats?.year}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Detail Row ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Status breakdown table */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Chi tiết theo trạng thái</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {statusList.length > 0 ? statusList.map(([status, count]) => {
                const label = PARTY_STATUS_LABELS[status as keyof typeof PARTY_STATUS_LABELS] ?? status;
                const color = PARTY_STATUS_COLORS[status as keyof typeof PARTY_STATUS_COLORS] ?? '#6b7280';
                const pctVal = pct(count, total);
                return (
                  <div key={status}>
                    <div className="flex justify-between text-sm mb-1">
                      <div className="flex items-center gap-1.5">
                        <span className="inline-block w-2 h-2 rounded-full" style={{ background: color }} />
                        <span className="text-slate-700">{label}</span>
                      </div>
                      <span className="font-semibold text-slate-900">{count} <span className="text-xs font-normal text-muted-foreground">({pctVal}%)</span></span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pctVal}%`, background: color }}
                      />
                    </div>
                  </div>
                );
              }) : (
                <p className="text-sm text-muted-foreground">Chưa có dữ liệu</p>
              )}
            </CardContent>
          </Card>

          {/* Fee collection progress */}
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">Thu Đảng phí</CardTitle>
                <CardDescription>Tình hình thu phí năm {stats?.year}</CardDescription>
              </div>
              <Link href="/dashboard/party/fees">
                <Button variant="ghost" size="sm" className="h-7 text-xs">
                  Chi tiết <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Progress bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tiến độ thu phí</span>
                  <span className="font-bold text-emerald-600">{feeRate}%</span>
                </div>
                <Progress value={feeRate} className="h-3 bg-slate-100" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Đã thu: {fmt(stats?.fee.actual ?? 0)}đ</span>
                  <span>KH: {fmt(stats?.fee.expected ?? 0)}đ</span>
                </div>
              </div>

              {/* Fee stats */}
              <div className="grid grid-cols-3 gap-2 pt-1">
                {[
                  { label: 'Phải nộp', value: stats?.fee.expected ?? 0, cls: 'text-slate-700' },
                  { label: 'Đã nộp', value: stats?.fee.actual ?? 0, cls: 'text-emerald-600' },
                  { label: 'Còn nợ', value: stats?.fee.debt ?? 0, cls: 'text-red-600' },
                ].map((item) => (
                  <div key={item.label} className="rounded-lg bg-slate-50 p-2.5 text-center">
                    <p className="text-[10px] text-muted-foreground">{item.label}</p>
                    <p className={`text-sm font-bold ${item.cls}`}>{fmt(item.value)}đ</p>
                  </div>
                ))}
              </div>

              {/* Debt members */}
              {(kpis?.debtMemberCount ?? 0) > 0 && (
                <div className="rounded-lg bg-orange-50 border border-orange-100 px-3 py-2 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-500 flex-shrink-0" />
                  <span className="text-xs text-orange-700">
                    <span className="font-semibold">{kpis!.debtMemberCount}</span> đảng viên còn nợ phí
                  </span>
                </div>
              )}

              {/* Discipline & Inspection summary */}
              <div className="space-y-2 pt-2 border-t">
                <div className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-1.5 text-sm">
                    <ShieldAlert className="h-4 w-4 text-red-500" />
                    <span className="text-slate-700">Kỷ luật năm {stats?.year}</span>
                  </div>
                  <Badge variant={kpis?.disciplineCount ? 'destructive' : 'outline'}>
                    {kpis?.disciplineCount ?? 0}
                  </Badge>
                </div>
                <div className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-1.5 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-amber-500" />
                    <span className="text-slate-700">Đợt kiểm tra / giám sát</span>
                  </div>
                  <Badge className="bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-200">
                    {kpis?.inspectionCount ?? 0}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Review grade summary */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Xếp loại Đảng viên</CardTitle>
              <CardDescription>Chi tiết kết quả đánh giá năm {stats?.year}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {REVIEW_GRADES.map((g) => {
                const count = stats?.distributions.reviewGrades[g.key] ?? 0;
                const p = pct(count, total);
                return (
                  <div key={g.key} className={`rounded-lg px-3 py-2.5 ${g.bg} border ${g.border}`}>
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-semibold ${g.text}`}>{g.label}</span>
                      <span className={`text-sm font-bold ${g.text}`}>{count}</span>
                    </div>
                    <div className="mt-1.5 h-1 bg-white/70 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${p}%`, background: g.color }}
                      />
                    </div>
                    <p className={`text-[10px] mt-0.5 ${g.text} opacity-70`}>{p}% tổng đảng viên</p>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* ── Quick Actions Grid ──────────────────────────────────────── */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Activity className="h-4 w-4 text-red-600" />
              Truy cập nhanh các nghiệp vụ Đảng
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-10 gap-3">
              <QuickLink href="/dashboard/party/members"
                icon={Users} label="Đảng viên"
                color="bg-red-50 border-red-100 text-red-700 hover:border-red-300" />
              <QuickLink href="/dashboard/party/admissions"
                icon={UserPlus} label="Kết nạp"
                color="bg-emerald-50 border-emerald-100 text-emerald-700 hover:border-emerald-300" />
              <QuickLink href="/dashboard/party/meetings"
                icon={CalendarCheck} label="Sinh hoạt"
                color="bg-blue-50 border-blue-100 text-blue-700 hover:border-blue-300" />
              <QuickLink href="/dashboard/party/activities"
                icon={Activity} label="Hoạt động"
                color="bg-violet-50 border-violet-100 text-violet-700 hover:border-violet-300" />
              <QuickLink href="/dashboard/party/fees"
                icon={Wallet} label="Đảng phí"
                color="bg-amber-50 border-amber-100 text-amber-700 hover:border-amber-300" />
              <QuickLink href="/dashboard/party/reviews"
                icon={ClipboardList} label="Đánh giá"
                color="bg-teal-50 border-teal-100 text-teal-700 hover:border-teal-300" />
              <QuickLink href="/dashboard/party/disciplines"
                icon={ShieldAlert} label="Kỷ luật"
                color="bg-rose-50 border-rose-100 text-rose-700 hover:border-rose-300" />
              <QuickLink href="/dashboard/party/inspections"
                icon={Eye} label="Kiểm tra"
                color="bg-orange-50 border-orange-100 text-orange-700 hover:border-orange-300" />
              <QuickLink href="/dashboard/party/transfers"
                icon={ArrowRight} label="Chuyển sinh"
                color="bg-cyan-50 border-cyan-100 text-cyan-700 hover:border-cyan-300" />
              <QuickLink href="/dashboard/party/orgs"
                icon={Building2} label="Chi bộ"
                color="bg-indigo-50 border-indigo-100 text-indigo-700 hover:border-indigo-300" />
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mt-3">
              <QuickLink href="/dashboard/party/awards"
                icon={Award} label="Khen thưởng"
                color="bg-yellow-50 border-yellow-100 text-yellow-700 hover:border-yellow-300" />
              <QuickLink href="/dashboard/party/evaluations"
                icon={Star} label="Nhận xét ĐV"
                color="bg-pink-50 border-pink-100 text-pink-700 hover:border-pink-300" />
              <QuickLink href="/dashboard/party/reports"
                icon={FileText} label="Báo cáo"
                color="bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-400" />
              <QuickLink href="/dashboard/party/members/create"
                icon={Plus} label="Tạo hồ sơ"
                color="bg-green-50 border-green-100 text-green-700 hover:border-green-300" />
              <QuickLink href="/dashboard/party/list"
                icon={ClipboardList} label="Danh mục"
                color="bg-gray-50 border-gray-200 text-gray-700 hover:border-gray-400" />
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
