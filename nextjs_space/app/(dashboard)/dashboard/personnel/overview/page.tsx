/**
 * Tổng quan CSDL Cán bộ, Quân nhân HVHC — Redesigned v2
 * Modern military-themed dashboard with comprehensive statistics
 */
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Users, UserCheck, Shield, Star, Building2, GraduationCap,
  RefreshCw, FileSpreadsheet, TrendingUp, UserCog, Award,
  AlertCircle, ChevronRight, BookOpen, Percent, HeartHandshake,
  BarChart3, Activity,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
  RadialBarChart, RadialBar,
} from 'recharts';
import Link from 'next/link';

// ─── Types ─────────────────────────────────────────────────────────────────
interface StatsData {
  summary: {
    total: number; active: number; retired: number;
    transferred: number; suspended: number; resigned: number;
    totalUnits: number; officerCount: number; soldierCount: number;
    partyMemberCount: number;
  };
  byWorkStatus:        { status: string; count: number; label: string }[];
  byPersonnelType:     { type: string; count: number; label: string }[];
  byRank:              { rank: string; count: number }[];
  byEducationLevel:    { level: string; count: number }[];
  byGender:            { gender: string; count: number }[];
  byUnit:              { unitId: string; unitName: string; unitCode: string; count: number }[];
  byRole:              { role: string; count: number; label: string }[];
  ageDistribution:     { range: string; count: number }[];
  byManagementCategory:{ category: string; count: number; label: string }[];
  byManagementLevel:   { level: string; count: number; label: string }[];
}

// ─── Palette ────────────────────────────────────────────────────────────────
const P = {
  navy:   '#1e3a5f',
  blue:   '#2563eb',
  indigo: '#4f46e5',
  green:  '#059669',
  amber:  '#d97706',
  red:    '#dc2626',
  purple: '#7c3aed',
  cyan:   '#0891b2',
  slate:  '#475569',
  rose:   '#e11d48',
};
const RANK_COLORS = ['#1e3a5f','#2563eb','#4f46e5','#7c3aed','#0891b2','#059669','#d97706','#dc2626','#e11d48','#6366f1','#14b8a6','#f59e0b'];
const EDU_COLORS  = ['#4f46e5','#7c3aed','#2563eb','#0891b2','#059669','#d97706'];

// ─── Sub-components ─────────────────────────────────────────────────────────

/** Gradient KPI hero card */
function HeroKPI({
  label, sub, value, icon: Icon, from, to, badge, pct,
}: {
  label: string; sub: string; value: number; icon: React.ElementType;
  from: string; to: string; badge?: string; pct?: string;
}) {
  return (
    <div
      className="relative rounded-2xl overflow-hidden text-white shadow-lg p-5 flex flex-col gap-3"
      style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
    >
      {/* background pattern */}
      <div className="absolute inset-0 opacity-[0.07]"
        style={{ backgroundImage: 'repeating-linear-gradient(45deg,#fff 0,#fff 1px,transparent 0,transparent 8px)', backgroundSize: '10px 10px' }} />
      <div className="relative flex items-start justify-between">
        <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
          <Icon className="h-6 w-6" />
        </div>
        {badge && (
          <span className="text-[10px] font-bold bg-white/20 rounded-full px-2 py-0.5">{badge}</span>
        )}
      </div>
      <div className="relative">
        <p className="text-4xl font-extrabold tracking-tight">{value.toLocaleString('vi-VN')}</p>
        <p className="text-sm font-semibold mt-0.5 opacity-90">{label}</p>
        <p className="text-xs opacity-70 mt-0.5">{sub}</p>
      </div>
      {pct && (
        <div className="relative text-xs opacity-80 flex items-center gap-1">
          <Percent className="h-3 w-3" />
          {pct}
        </div>
      )}
    </div>
  );
}

/** Horizontal stat row — status breakdown */
function StatusRow({ label, count, total, color }: {
  label: string; count: number; total: number; color: string;
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-muted-foreground w-28 shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-xs font-bold w-8 text-right" style={{ color }}>{count}</span>
      <span className="text-xs text-muted-foreground w-8 text-right">{pct}%</span>
    </div>
  );
}

/** Small metric tile */
function MetricTile({ value, label, sub, color }: {
  value: string | number; label: string; sub?: string; color: string;
}) {
  return (
    <div className="rounded-xl border bg-white dark:bg-slate-900 p-3.5 flex flex-col gap-0.5 shadow-md">
      <p className="text-2xl font-extrabold" style={{ color }}>{value}</p>
      <p className="text-xs font-semibold text-foreground">{label}</p>
      {sub && <p className="text-[11px] text-muted-foreground">{sub}</p>}
    </div>
  );
}

/** Custom tooltip for charts */
function ChartTip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-white dark:bg-slate-900 shadow-lg px-3 py-2 text-xs">
      {label && <p className="font-semibold text-foreground mb-1">{label}</p>}
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color || p.fill }}>{p.name || 'Số lượng'}: <strong>{p.value} người</strong></p>
      ))}
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function PersonnelOverviewPage() {
  const { status } = useSession();
  const router = useRouter();
  const [stats, setStats]   = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true); setError(null);
      const res = await fetch('/api/personnel/stats');
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Lỗi tải dữ liệu'); }
      setStats(await res.json());
      setLastUpdated(new Date());
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
    else if (status === 'authenticated') fetchStats();
  }, [status, router, fetchStats]);

  useEffect(() => {
    if (status === 'authenticated') {
      const id = setInterval(fetchStats, 60000);
      return () => clearInterval(id);
    }
  }, [status, fetchStats]);

  // ── Loading skeleton ───────────────────────────────────────────────────────
  if (status === 'loading' || loading) {
    return (
      <div className="p-4 md:p-6 space-y-5 max-w-[1400px] mx-auto">
        <Skeleton className="h-32 w-full rounded-2xl" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-36 rounded-2xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {[1,2,3].map(i => <Skeleton key={i} className="h-56 rounded-xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {[1,2].map(i => <Skeleton key={i} className="h-72 rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
          <CardContent className="pt-6 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
            <p className="text-red-600 text-sm">{error}</p>
            <Button onClick={fetchStats} variant="outline" size="sm" className="ml-auto">
              <RefreshCw className="w-4 h-4 mr-2" />Thử lại
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!stats) return null;

  const { summary } = stats;
  const partyPct  = summary.total > 0 ? ((summary.partyMemberCount / summary.total) * 100).toFixed(1) : '0';
  const activePct = summary.total > 0 ? ((summary.active / summary.total) * 100).toFixed(1) : '0';
  const femalePct = (() => {
    const f = stats.byGender.find(g => g.gender === 'Nữ')?.count || 0;
    return summary.total > 0 ? ((f / summary.total) * 100).toFixed(1) : '0';
  })();
  const phDCount = stats.byEducationLevel.filter(e =>
    e.level?.toLowerCase().includes('tiến sĩ') || e.level === 'TS' || e.level === 'TSKH'
  ).reduce((s, e) => s + e.count, 0);
  const masterCount = stats.byEducationLevel.filter(e =>
    e.level?.toLowerCase().includes('thạc sĩ') || e.level === 'ThS'
  ).reduce((s, e) => s + e.count, 0);

  // Rank data — abbreviate for chart
  const rankData = stats.byRank
    .sort((a, b) => b.count - a.count)
    .map(item => ({
      name: item.rank
        ?.replace('Thiếu tướng','Th.Tướng').replace('Chuẩn đô đốc','C.Đ.Đốc')
        .replace('Đại tá','Đ.Tá').replace('Thượng tá','Th.Tá')
        .replace('Trung tá','Tr.Tá').replace('Thiếu tá','T.Tá')
        .replace('Đại úy','Đ.Úy').replace('Thượng úy','Th.Úy')
        .replace('Trung úy','Tr.Úy').replace('Thiếu úy','T.Úy')
        || item.rank,
      fullName: item.rank,
      count: item.count,
    }));

  // Age distribution with colour ramp
  const ageData = stats.ageDistribution.map((a, i) => ({
    ...a,
    fill: [P.cyan, P.blue, P.navy, P.indigo, P.slate][i] ?? P.slate,
  }));

  // Gender pie
  const genderData = stats.byGender.map(g => ({
    name: g.gender,
    value: g.count,
    fill: g.gender === 'Nam' ? P.blue : P.rose,
  }));

  // Education top-5 sorted
  const eduData = [...stats.byEducationLevel]
    .sort((a, b) => b.count - a.count)
    .slice(0, 6)
    .map((e, i) => ({ ...e, fill: EDU_COLORS[i] ?? P.slate }));

  // Unit top-10 — max for bar width
  const unitMax = Math.max(...stats.byUnit.map(u => u.count), 1);

  // Management organ bar
  const organData = stats.byManagementLevel.map((m, i) => ({
    ...m, fill: [P.blue, P.green][i] ?? P.slate,
  }));

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-[1400px] mx-auto">

      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <div className="rounded-2xl overflow-hidden shadow-md border border-slate-200 dark:border-slate-700">
        {/* Banner */}
        <div className="h-20 relative flex items-center px-6 gap-4"
          style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 60%, #1e3a5f 100%)' }}>
          <div className="absolute inset-0 opacity-[0.06]"
            style={{ backgroundImage: 'repeating-linear-gradient(45deg,#fff 0,#fff 1px,transparent 0,transparent 8px)', backgroundSize: '10px 10px' }} />
          <div className="absolute right-6 opacity-[0.12] select-none">
            <Users className="h-16 w-16 text-white" />
          </div>
          <div className="relative">
            <h1 className="text-xl md:text-2xl font-extrabold text-white tracking-tight">
              Tổng quan CSDL Cán bộ, Quân nhân
            </h1>
            <p className="text-blue-100 text-xs mt-0.5">
              Học viện Hậu cần — Thống kê tổng hợp CSDL Sĩ quan và Quân nhân
            </p>
          </div>
          <div className="ml-auto relative flex items-center gap-2">
            {lastUpdated && (
              <span className="text-blue-100 text-[11px] hidden md:block">
                Cập nhật: {lastUpdated.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            <Button onClick={fetchStats} size="sm" variant="ghost"
              className="text-white hover:bg-white/20 border border-white/30">
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" />Làm mới
            </Button>
            <Link href="/dashboard/personnel/list">
              <Button size="sm" className="bg-white text-blue-800 hover:bg-blue-50 font-semibold">
                <Users className="w-3.5 h-3.5 mr-1.5" />Xem CSDL
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* ── Hero KPI row ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <HeroKPI
          label="Tổng cán bộ, quân nhân"
          sub="CSDL Sĩ quan + Quân nhân"
          value={summary.total}
          icon={Users}
          from="#1e3a5f" to="#2563eb"
          badge="TỔNG SỐ"
          pct={`Đang công tác: ${activePct}%`}
        />
        <HeroKPI
          label="Diện Cán bộ quản lý"
          sub="Sĩ quan các cấp"
          value={summary.officerCount}
          icon={Star}
          from="#3730a3" to="#4f46e5"
          badge="SĨ QUAN"
          pct={`${summary.total > 0 ? ((summary.officerCount / summary.total)*100).toFixed(1) : 0}% tổng số`}
        />
        <HeroKPI
          label="Diện Quân lực quản lý"
          sub="QNCN, CCQP, HSQ"
          value={summary.soldierCount}
          icon={Shield}
          from="#065f46" to="#059669"
          badge="QUÂN NHÂN"
          pct={`${summary.total > 0 ? ((summary.soldierCount / summary.total)*100).toFixed(1) : 0}% tổng số`}
        />
        <HeroKPI
          label="Đảng viên ĐCSVN"
          sub="Tỷ lệ đảng viên trong HVHC"
          value={summary.partyMemberCount}
          icon={Award}
          from="#991b1b" to="#dc2626"
          badge="ĐẢNG VIÊN"
          pct={`${partyPct}% tổng cán bộ`}
        />
      </div>

      {/* ── Status + key metrics row ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Work status breakdown */}
        <Card className="border-slate-200 dark:border-slate-700 shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Activity className="h-4 w-4 text-blue-600" />
              Trạng thái công tác
            </CardTitle>
            <CardDescription className="text-xs">Phân bố theo tình trạng hiện tại</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pb-4">
            <StatusRow label="Đang công tác"    count={summary.active}      total={summary.total} color={P.green} />
            <StatusRow label="Chuyển công tác"  count={summary.transferred} total={summary.total} color={P.blue} />
            <StatusRow label="Nghỉ hưu"         count={summary.retired}     total={summary.total} color={P.amber} />
            <StatusRow label="Xuất ngũ / Thôi"  count={summary.resigned}    total={summary.total} color={P.slate} />
            {summary.suspended > 0 &&
              <StatusRow label="Tạm đình chỉ"   count={summary.suspended}   total={summary.total} color={P.red} />
            }
            {/* work-status from byWorkStatus — extra statuses */}
            {stats.byWorkStatus
              .filter(s => !['DANG_CONG_TAC','CHUYEN_CONG_TAC','NGHI_HUU','XUAT_NGU'].includes(s.status) && s.count > 0)
              .map(s => (
                <StatusRow key={s.status} label={s.label} count={s.count} total={summary.total} color={P.rose} />
              ))
            }
          </CardContent>
        </Card>

        {/* Key metrics grid */}
        <Card className="border-slate-200 dark:border-slate-700 shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-indigo-600" />
              Chỉ số quan trọng
            </CardTitle>
            <CardDescription className="text-xs">Các chỉ tiêu nhân sự then chốt</CardDescription>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="grid grid-cols-2 gap-2.5">
              <MetricTile value={summary.active}           label="Đang công tác"    sub={`${activePct}%`}  color={P.green} />
              <MetricTile value={summary.totalUnits}       label="Đơn vị"           sub="trong HVHC"       color={P.blue}  />
              <MetricTile value={phDCount || '—'}          label="Tiến sĩ"          sub="Học vị TS/TSKH"   color={P.purple}/>
              <MetricTile value={masterCount || '—'}       label="Thạc sĩ"          sub="Học vị ThS"        color={P.indigo}/>
              <MetricTile value={`${partyPct}%`}           label="Tỷ lệ Đảng viên"  sub={`${summary.partyMemberCount} người`} color={P.red} />
              <MetricTile value={`${femalePct}%`}          label="Cán bộ nữ"        sub={`${stats.byGender.find(g=>g.gender==='Nữ')?.count||0} người`} color={P.rose} />
            </div>
          </CardContent>
        </Card>

        {/* Gender + management organ */}
        <Card className="border-slate-200 dark:border-slate-700 shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <HeartHandshake className="h-4 w-4 text-cyan-600" />
              Cơ cấu cán bộ
            </CardTitle>
            <CardDescription className="text-xs">Giới tính & cơ quan quản lý</CardDescription>
          </CardHeader>
          <CardContent className="pb-4 space-y-4">
            {/* Gender donut */}
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Giới tính</p>
              <div className="flex items-center gap-3">
                <ResponsiveContainer width={80} height={80}>
                  <PieChart>
                    <Pie data={genderData} dataKey="value" cx="50%" cy="50%"
                      innerRadius={22} outerRadius={36} paddingAngle={3}>
                      {genderData.map((g, i) => <Cell key={i} fill={g.fill} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-1.5">
                  {genderData.map(g => (
                    <div key={g.name} className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: g.fill }} />
                        {g.name}
                      </span>
                      <span className="font-bold">{g.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {/* Management organ */}
            {organData.length > 0 && (
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Cơ quan quản lý</p>
                <div className="space-y-2">
                  {organData.map(o => (
                    <div key={o.level} className="flex items-center gap-2 text-xs">
                      <span className="w-24 shrink-0 text-muted-foreground">{o.label}</span>
                      <div className="flex-1 h-2 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${summary.total > 0 ? (o.count/summary.total)*100 : 0}%`, background: o.fill }} />
                      </div>
                      <span className="font-bold w-8 text-right" style={{ color: o.fill }}>{o.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Charts row: Rank + Age ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Rank distribution */}
        <Card className="border-slate-200 dark:border-slate-700 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Star className="h-4 w-4 text-amber-500" />
              Phân bố theo Quân hàm
            </CardTitle>
            <CardDescription className="text-xs">Thống kê cấp bậc (top {rankData.length} quân hàm)</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={rankData} layout="vertical" margin={{ top: 4, right: 20, left: 12, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" width={62} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTip />} />
                <Bar dataKey="count" radius={[0, 5, 5, 0]} name="Số lượng" maxBarSize={18}>
                  {rankData.map((_, i) => <Cell key={i} fill={RANK_COLORS[i % RANK_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Age distribution */}
        <Card className="border-slate-200 dark:border-slate-700 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Users className="h-4 w-4 text-cyan-600" />
              Phân bố theo Độ tuổi
            </CardTitle>
            <CardDescription className="text-xs">Cơ cấu tuổi cán bộ, quân nhân</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={ageData} margin={{ top: 4, right: 20, left: 0, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
                <XAxis dataKey="range" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTip />} />
                <Bar dataKey="count" radius={[5, 5, 0, 0]} name="Số lượng" maxBarSize={52}>
                  {ageData.map((a, i) => <Cell key={i} fill={a.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* ── Education + Personnel type ────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Education level */}
        <Card className="border-slate-200 dark:border-slate-700 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-purple-600" />
              Phân bố theo Trình độ học vấn
            </CardTitle>
            <CardDescription className="text-xs">Thống kê học vị, bằng cấp</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={eduData} margin={{ top: 4, right: 20, left: 0, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
                <XAxis dataKey="level" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTip />} />
                <Bar dataKey="count" radius={[5, 5, 0, 0]} name="Số lượng" maxBarSize={52}>
                  {eduData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Personnel type breakdown */}
        <Card className="border-slate-200 dark:border-slate-700 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Shield className="h-4 w-4 text-blue-600" />
              Phân bố theo Đối tượng cán bộ
            </CardTitle>
            <CardDescription className="text-xs">Sĩ quan / QNCN / CNV / Học viên QS</CardDescription>
          </CardHeader>
          <CardContent className="pt-2 pb-4">
            <div className="space-y-3">
              {stats.byPersonnelType.sort((a, b) => b.count - a.count).map((pt, i) => {
                const pct = summary.total > 0 ? ((pt.count / summary.total) * 100).toFixed(1) : '0';
                const cols = [P.blue, P.indigo, P.green, P.cyan, P.amber, P.purple];
                const col  = cols[i % cols.length];
                return (
                  <div key={pt.type} className="flex items-center gap-3">
                    <span className="w-5 h-5 rounded-md flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                      style={{ background: col }}>{i + 1}</span>
                    <span className="text-xs text-muted-foreground flex-1 min-w-0 truncate">{pt.label}</span>
                    <div className="w-32 h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: col }} />
                    </div>
                    <span className="text-xs font-bold w-8 text-right" style={{ color: col }}>{pt.count}</span>
                    <span className="text-xs text-muted-foreground w-9 text-right">{pct}%</span>
                  </div>
                );
              })}
              {stats.byPersonnelType.length === 0 && (
                <p className="text-xs text-muted-foreground py-8 text-center">Chưa có dữ liệu phân loại</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Unit distribution (full-width table + mini-bars) ─────────────── */}
      <Card className="border-slate-200 dark:border-slate-700 shadow-md">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Building2 className="h-4 w-4 text-amber-600" />
                Phân bố theo Đơn vị (Top {stats.byUnit.length})
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">Số lượng cán bộ theo đơn vị trực thuộc HVHC</CardDescription>
            </div>
            <Link href="/dashboard/admin/units">
              <Button variant="ghost" size="sm" className="text-xs h-7">
                Tất cả đơn vị <ChevronRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800">
                  <th className="text-left py-2 pr-4 font-semibold text-muted-foreground w-6">#</th>
                  <th className="text-left py-2 pr-4 font-semibold text-muted-foreground">Đơn vị</th>
                  <th className="text-left py-2 pr-4 font-semibold text-muted-foreground w-14">Mã</th>
                  <th className="py-2 pr-4 font-semibold text-muted-foreground w-48 text-left">Tỷ lệ</th>
                  <th className="text-right py-2 font-semibold text-muted-foreground w-16">Số lượng</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                {stats.byUnit.map((u, i) => {
                  const barPct = (u.count / unitMax) * 100;
                  const shade  = i < 3 ? P.navy : i < 6 ? P.blue : P.cyan;
                  return (
                    <tr key={u.unitId} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="py-2.5 pr-4 text-muted-foreground font-mono">{i + 1}</td>
                      <td className="py-2.5 pr-4 font-medium text-foreground truncate max-w-[200px]">{u.unitName}</td>
                      <td className="py-2.5 pr-4 text-muted-foreground font-mono">{u.unitCode}</td>
                      <td className="py-2.5 pr-4">
                        <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all"
                            style={{ width: `${barPct}%`, background: shade }} />
                        </div>
                      </td>
                      <td className="py-2.5 text-right font-bold" style={{ color: shade }}>{u.count}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* ── Quick nav links ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { href: '/dashboard/personnel/list',     Icon: Users,          label: 'CSDL Sĩ quan, Quân nhân', color: P.blue,   bg: '#eff6ff' },
          { href: '/dashboard/personnel/stats',    Icon: FileSpreadsheet,label: 'Thống kê chi tiết',        color: P.purple, bg: '#f5f3ff' },
          { href: '/dashboard/officer-management', Icon: Star,           label: 'Quản lý Sĩ quan',          color: P.indigo, bg: '#eef2ff' },
          { href: '/dashboard/soldier-management', Icon: Shield,         label: 'Quản lý Quân nhân',        color: P.green,  bg: '#f0fdf4' },
        ].map(({ href, Icon, label, color, bg }) => (
          <Link href={href} key={href}>
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4
              flex items-center gap-3 hover:shadow-md transition-all cursor-pointer group
              hover:border-current dark:hover:border-current"
              style={{ '--hover-color': color } as React.CSSProperties}>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors"
                style={{ background: bg }}>
                <Icon className="h-5 w-5" style={{ color }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-foreground leading-tight">{label}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform shrink-0" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
