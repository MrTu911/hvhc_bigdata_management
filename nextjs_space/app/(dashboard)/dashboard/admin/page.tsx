/**
 * Dashboard Quản trị hệ thống — Redesigned v2
 * Full-featured admin panel: real stats, services health, users, audit log, quick links
 */
'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Users, Server, Shield, Database, Activity, AlertTriangle,
  CheckCircle2, Clock, TrendingUp, Settings, RefreshCw,
  KeyRound, Building2, Layers, LayoutDashboard, Link2,
  FileText, Network, Lock, UserCog, ChevronRight, XCircle,
  AlertCircle, Cpu, HardDrive, BarChart3, Wifi, WifiOff,
  Zap, GitBranch, Package, Eye, BadgeCheck, BookOpen,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts';
import Link from 'next/link';

// ─── Types ──────────────────────────────────────────────────────────────────
interface Overview {
  totalUsers: number; activeUsers: number;
  totalServices: number; healthyServices: number;
  totalStorage: number; dailyRequests: number;
}
interface UserItem {
  id: string; name: string; email: string;
  role: string; status: string; lastLogin: string; createdAt: string;
}
interface Service {
  id: string; name: string; type: string; status: string;
  uptime: number; responseTime: number; lastChecked: string;
}
interface AuditLog {
  id: string; action: string; user: string; resource: string;
  severity: string; success: boolean; ipAddress: string; timestamp: string;
}
interface SystemStats {
  usersByRole:   { role: string; count: number }[];
  storageByType: { type: string; size: number; unit: string }[];
  activityByDay: { date: string; logins: number; uploads: number; queries: number }[];
}

// ─── Helpers ────────────────────────────────────────────────────────────────
const ROLE_LABELS: Record<string, string> = {
  QUAN_TRI_HE_THONG: 'Quản trị HT',
  CHI_HUY_HOC_VIEN:  'Chỉ huy HV',
  CHI_HUY_KHOA:      'Chỉ huy Khoa',
  CHU_NHIEM_BO_MON:  'CN Bộ môn',
  GIANG_VIEN:        'Giảng viên',
  CAN_BO:            'Cán bộ',
  HOC_VIEN:          'Học viên',
  NGHIEN_CUU_VIEN:   'NCV',
  KY_THUAT_VIEN:     'KTV',
};
const ROLE_COLORS = ['#4f46e5','#0891b2','#059669','#d97706','#dc2626','#7c3aed','#0e7490','#65a30d','#b45309'];

function roleLabel(r: string) { return ROLE_LABELS[r] || r; }

function fmtTime(iso: string) {
  try { return new Date(iso).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' }); }
  catch { return iso; }
}

function initials(name: string) {
  return name.split(' ').slice(-2).map(w => w[0]).join('').toUpperCase().slice(0,2) || '?';
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, icon: Icon, color, bg }: {
  label: string; value: string | number; sub: string;
  icon: React.ElementType; color: string; bg: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 shadow-sm flex items-start gap-3">
      <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: bg }}>
        <Icon className="h-5 w-5" style={{ color }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground font-medium">{label}</p>
        <p className="text-2xl font-extrabold mt-0.5" style={{ color }}>{value}</p>
        <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>
      </div>
    </div>
  );
}

function ServicePill({ s }: { s: Service }) {
  const ok       = s.status === 'HEALTHY';
  const degraded = s.status === 'DEGRADED';
  const dot      = ok ? 'bg-emerald-500' : degraded ? 'bg-amber-400' : 'bg-red-500';
  const statusText = ok ? 'Online' : degraded ? 'Degraded' : 'Down';

  const TYPE_ICONS: Record<string, React.ElementType> = {
    DATABASE: Database, STORAGE: HardDrive, ETL: GitBranch,
    ANALYTICS: BarChart3, MONITORING: Activity, STREAMING: Zap,
    COMPUTE: Cpu,
  };
  const Icon = TYPE_ICONS[s.type] ?? Server;

  return (
    <div className={`rounded-lg border p-3 flex flex-col gap-1.5 ${
      ok ? 'border-emerald-100 bg-emerald-50/50 dark:border-emerald-900/40 dark:bg-emerald-950/10'
         : degraded ? 'border-amber-100 bg-amber-50/50 dark:border-amber-900/40 dark:bg-amber-950/10'
         : 'border-red-100 bg-red-50/50 dark:border-red-900/40 dark:bg-red-950/10'
    }`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <Icon className={`h-4 w-4 ${ok ? 'text-emerald-600' : degraded ? 'text-amber-500' : 'text-red-500'}`} />
          <span className="text-xs font-semibold text-foreground truncate">{s.name}</span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
          <span className={`text-[10px] font-medium ${ok ? 'text-emerald-700' : degraded ? 'text-amber-600' : 'text-red-600'}`}>
            {statusText}
          </span>
        </div>
      </div>
      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
        <span>Uptime: <strong className="text-foreground">{s.uptime}%</strong></span>
        <span className={`font-medium ${s.responseTime > 300 ? 'text-amber-600' : 'text-foreground'}`}>
          {s.responseTime}ms
        </span>
      </div>
      <div className="w-full h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all"
          style={{ width: `${s.uptime}%`, background: ok ? '#10b981' : degraded ? '#f59e0b' : '#ef4444' }} />
      </div>
    </div>
  );
}

const SEV_STYLE: Record<string, { bg: string; text: string; dot: string }> = {
  CRITICAL: { bg: 'bg-red-100 dark:bg-red-950/30',    text: 'text-red-700 dark:text-red-400',    dot: 'bg-red-500' },
  HIGH:     { bg: 'bg-orange-100 dark:bg-orange-950/30', text: 'text-orange-700 dark:text-orange-400', dot: 'bg-orange-500' },
  MEDIUM:   { bg: 'bg-amber-100 dark:bg-amber-950/30', text: 'text-amber-700 dark:text-amber-400',  dot: 'bg-amber-400' },
  LOW:      { bg: 'bg-slate-100 dark:bg-slate-800',    text: 'text-slate-600 dark:text-slate-400',  dot: 'bg-slate-400' },
};

function AuditRow({ log }: { log: AuditLog }) {
  const sev = SEV_STYLE[log.severity] ?? SEV_STYLE.LOW;
  return (
    <div className="flex items-start gap-3 py-2.5 border-b last:border-0 border-slate-100 dark:border-slate-800/60">
      <div className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${sev.dot}`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-foreground">{log.action}</span>
          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${sev.bg} ${sev.text}`}>
            {log.severity}
          </span>
          {log.success
            ? <CheckCircle2 className="h-3 w-3 text-emerald-500" />
            : <XCircle className="h-3 w-3 text-red-500" />
          }
        </div>
        <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
          <strong className="text-foreground/80">{log.user}</strong>
          {' → '}{log.resource}
          <span className="ml-2 font-mono opacity-60">{log.ipAddress}</span>
        </p>
      </div>
      <span className="text-[10px] text-muted-foreground shrink-0">{fmtTime(log.timestamp)}</span>
    </div>
  );
}

const ADMIN_MODULES = [
  { href: '/dashboard/admin/users',           Icon: Users,         label: 'Người dùng',        sub: 'Quản lý tài khoản',      color: '#4f46e5', bg: '#eef2ff' },
  { href: '/dashboard/admin/rbac',            Icon: Shield,        label: 'Phân quyền RBAC',   sub: 'Vai trò & chức năng',   color: '#0891b2', bg: '#ecfeff' },
  { href: '/dashboard/admin/units',           Icon: Building2,     label: 'Đơn vị',            sub: 'Cơ cấu tổ chức',         color: '#059669', bg: '#f0fdf4' },
  { href: '/dashboard/admin/positions',       Icon: Layers,        label: 'Chức vụ',           sub: 'Danh mục chức vụ',      color: '#d97706', bg: '#fffbeb' },
  { href: '/dashboard/admin/functions',       Icon: KeyRound,      label: 'Chức năng HT',      sub: 'Mã chức năng RBAC',     color: '#7c3aed', bg: '#f5f3ff' },
  { href: '/dashboard/admin/permission-grants', Icon: Lock,        label: 'Cấp quyền đặc biệt', sub: 'Grant permissions',    color: '#dc2626', bg: '#fef2f2' },
  { href: '/dashboard/admin/link-personnel',  Icon: Link2,         label: 'Liên kết cán bộ',   sub: 'User ↔ Personnel',      color: '#0e7490', bg: '#ecfeff' },
  { href: '/dashboard/admin/departments',     Icon: GitBranch,     label: 'Khoa / Phòng',      sub: 'Cơ cấu khoa phòng',     color: '#65a30d', bg: '#f7fee7' },
  { href: '/dashboard/admin/audit-logs',      Icon: FileText,      label: 'Audit Logs',        sub: 'Nhật ký hệ thống',      color: '#b45309', bg: '#fffbeb' },
  { href: '/dashboard/admin/infrastructure',  Icon: Network,       label: 'Hạ tầng',           sub: 'Kết nối dịch vụ',       color: '#475569', bg: '#f8fafc' },
  { href: '/dashboard/admin/api-gateway',     Icon: Zap,           label: 'API Gateway',       sub: 'Quản lý API keys',      color: '#7c3aed', bg: '#faf5ff' },
  { href: '/dashboard/admin/dashboard-management', Icon: LayoutDashboard, label: 'Dashboard', sub: 'Quản lý dashboard',    color: '#0891b2', bg: '#f0f9ff' },
  { href: '/dashboard/admin/acceptance-docs',      Icon: BadgeCheck,      label: 'Hồ sơ Nghiệm thu', sub: '28 tài liệu BQP', color: '#4338ca', bg: '#eef2ff' },
  { href: '/dashboard/admin/project-report',       Icon: BookOpen,        label: 'Báo cáo Sáng kiến', sub: 'Interactive report', color: '#0369a1', bg: '#f0f9ff' },
];

// ─── Main page ───────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [overview, setOverview]       = useState<Overview | null>(null);
  const [users, setUsers]             = useState<UserItem[]>([]);
  const [services, setServices]       = useState<Service[]>([]);
  const [auditLogs, setAuditLogs]     = useState<AuditLog[]>([]);
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null);
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true); else setRefreshing(true);
    try {
      const [ovRes, usrRes, svcRes, audRes, stRes] = await Promise.all([
        fetch('/api/dashboard/admin/overview'),
        fetch('/api/dashboard/admin/users'),
        fetch('/api/dashboard/admin/services'),
        fetch('/api/dashboard/admin/audit'),
        fetch('/api/dashboard/admin/system-stats'),
      ]);
      const [ov, usr, svc, aud, st] = await Promise.all([
        ovRes.ok  ? ovRes.json()  : null,
        usrRes.ok ? usrRes.json() : { users: [] },
        svcRes.ok ? svcRes.json() : { services: [] },
        audRes.ok ? audRes.json() : { auditLogs: [] },
        stRes.ok  ? stRes.json()  : { stats: null },
      ]);
      if (ov?.overview)  setOverview(ov.overview);
      setUsers(usr?.users ?? []);
      setServices(svc?.services ?? []);
      setAuditLogs(aud?.auditLogs ?? []);
      if (st?.stats) setSystemStats(st.stats);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Admin data fetch error', err);
    } finally {
      setLoading(false); setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const id = setInterval(() => fetchData(true), 30000);
    return () => clearInterval(id);
  }, [fetchData]);

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="p-4 md:p-6 space-y-5 max-w-[1400px] mx-auto">
        <Skeleton className="h-24 w-full rounded-2xl" />
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
          {[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {[1,2,3].map(i => <Skeleton key={i} className="h-64 rounded-xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {[1,2].map(i => <Skeleton key={i} className="h-72 rounded-xl" />)}
        </div>
      </div>
    );
  }

  // Derived stats
  const healthyCount  = services.filter(s => s.status === 'HEALTHY').length;
  const degradedCount = services.filter(s => s.status === 'DEGRADED').length;
  const downCount     = services.filter(s => s.status === 'DOWN').length;
  const sysHealthPct  = services.length > 0 ? Math.round((healthyCount / services.length) * 100) : 100;

  const roleData = (systemStats?.usersByRole ?? [])
    .sort((a, b) => b.count - a.count)
    .map((r, i) => ({ ...r, fill: ROLE_COLORS[i % ROLE_COLORS.length], label: roleLabel(r.role) }));
  const roleMax = Math.max(...roleData.map(r => r.count), 1);

  const activityData = (systemStats?.activityByDay ?? []).map(d => ({
    ...d,
    name: d.date.slice(5), // MM-DD
  }));

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-[1400px] mx-auto">

      {/* ── Banner ───────────────────────────────────────────────────────── */}
      <div className="rounded-2xl overflow-hidden shadow-md border border-indigo-200 dark:border-indigo-900">
        <div className="h-20 relative flex items-center px-6 gap-4 bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500">
          <div className="absolute inset-0 opacity-[0.06]"
            style={{ backgroundImage: 'repeating-linear-gradient(45deg,#fff 0,#fff 1px,transparent 0,transparent 8px)', backgroundSize: '10px 10px' }} />
          <div className="absolute right-6 opacity-[0.12] select-none">
            <Settings className="h-16 w-16 text-white" />
          </div>
          {/* Health dot */}
          <div className={`relative w-3 h-3 rounded-full shrink-0 ${sysHealthPct >= 90 ? 'bg-emerald-400' : sysHealthPct >= 70 ? 'bg-amber-400' : 'bg-red-400'}`}>
            <span className="absolute inset-0 rounded-full animate-ping opacity-60"
              style={{ background: sysHealthPct >= 90 ? '#34d399' : '#fbbf24' }} />
          </div>
          <div className="relative flex-1">
            <h1 className="text-xl md:text-2xl font-extrabold text-white tracking-tight">
              Bảng điều khiển Quản trị hệ thống
            </h1>
            <p className="text-indigo-100 text-xs mt-0.5">
              Giám sát, cấu hình và quản lý toàn bộ HVHC BigData Platform
            </p>
          </div>
          <div className="relative flex items-center gap-2">
            {lastUpdated && (
              <span className="text-indigo-100 text-[11px] hidden md:block">
                {lastUpdated.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            )}
            <Button size="sm" variant="ghost" onClick={() => fetchData(true)} disabled={refreshing}
              className="text-white hover:bg-white/20 border border-white/30">
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${refreshing ? 'animate-spin' : ''}`} />
              Làm mới
            </Button>
            <Link href="/dashboard/admin/rbac">
              <Button size="sm" className="bg-white text-indigo-800 hover:bg-indigo-50 font-semibold">
                <Shield className="w-3.5 h-3.5 mr-1.5" />RBAC
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* ── KPI strip ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
        <KpiCard label="Tổng người dùng"     value={overview?.totalUsers ?? '—'}     sub={`${overview?.activeUsers ?? 0} đang hoạt động`}      icon={Users}    color="#4f46e5" bg="#eef2ff" />
        <KpiCard label="Dịch vụ khỏe mạnh"  value={`${healthyCount}/${services.length}`} sub={degradedCount > 0 ? `${degradedCount} degraded` : 'Tất cả online'} icon={Server}   color={sysHealthPct >= 90 ? '#059669' : '#d97706'} bg={sysHealthPct >= 90 ? '#f0fdf4' : '#fffbeb'} />
        <KpiCard label="Uptime hệ thống"     value={`${sysHealthPct}%`}              sub="Tính theo trung bình dịch vụ"                           icon={Activity} color={sysHealthPct >= 90 ? '#059669' : '#d97706'} bg={sysHealthPct >= 90 ? '#f0fdf4' : '#fffbeb'} />
        <KpiCard label="Yêu cầu hôm nay"    value={(overview?.dailyRequests ?? 0).toLocaleString()} sub="System log events / 24h"            icon={TrendingUp} color="#0891b2" bg="#ecfeff" />
        <KpiCard label="Dung lượng lưu trữ" value={`${overview?.totalStorage ?? 0} TB`} sub="Datasets + Models + Docs"                         icon={Database} color="#7c3aed" bg="#f5f3ff" />
        <KpiCard label="Sự kiện audit"       value={auditLogs.length}                sub="Log gần nhất trong hệ thống"                          icon={FileText} color="#b45309" bg="#fffbeb" />
      </div>

      {/* ── Services + Users + Role chart ────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Services grid */}
        <Card className="lg:col-span-2 border-slate-200 dark:border-slate-700 shadow-md">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Server className="h-4 w-4 text-indigo-600" />
                Trạng thái dịch vụ hạ tầng
              </CardTitle>
              <div className="flex items-center gap-2 text-[11px]">
                <span className="flex items-center gap-1 text-emerald-600"><span className="w-2 h-2 rounded-full bg-emerald-500" />{healthyCount} healthy</span>
                {degradedCount > 0 && <span className="flex items-center gap-1 text-amber-600"><span className="w-2 h-2 rounded-full bg-amber-400" />{degradedCount} degraded</span>}
                {downCount > 0 && <span className="flex items-center gap-1 text-red-600"><span className="w-2 h-2 rounded-full bg-red-500" />{downCount} down</span>}
              </div>
            </div>
            <CardDescription className="text-xs">PostgreSQL · MinIO · Airflow · Spark · Kafka · Monitoring</CardDescription>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2.5">
              {services.map(s => <ServicePill key={s.id} s={s} />)}
              {services.length === 0 && (
                <p className="text-xs text-muted-foreground col-span-3 py-8 text-center">Chưa có dữ liệu dịch vụ</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Role distribution */}
        <Card className="border-slate-200 dark:border-slate-700 shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <UserCog className="h-4 w-4 text-indigo-600" />
              Phân bố vai trò
            </CardTitle>
            <CardDescription className="text-xs">Người dùng theo vai trò hệ thống</CardDescription>
          </CardHeader>
          <CardContent className="pb-4 space-y-2">
            {roleData.map(r => (
              <div key={r.role} className="flex items-center gap-2">
                <span className="text-[11px] text-muted-foreground w-24 shrink-0 truncate">{r.label}</span>
                <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all"
                    style={{ width: `${(r.count / roleMax) * 100}%`, background: r.fill }} />
                </div>
                <span className="text-xs font-bold w-6 text-right" style={{ color: r.fill }}>{r.count}</span>
              </div>
            ))}
            {roleData.length === 0 && (
              <p className="text-xs text-muted-foreground py-6 text-center">Chưa có dữ liệu</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Activity chart + Recent users + Audit ────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Activity 7-day bar chart */}
        <Card className="border-slate-200 dark:border-slate-700 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-indigo-600" />
              Hoạt động 7 ngày gần nhất
            </CardTitle>
            <CardDescription className="text-xs">Đăng nhập · Upload · Query</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            {activityData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={activityData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', fontSize: '11px' }}
                    formatter={(v: any, name: any) => [`${v}`, name === 'logins' ? 'Đăng nhập' : name === 'uploads' ? 'Upload' : 'Query']}
                  />
                  <Bar dataKey="logins"  fill="#4f46e5" radius={[3,3,0,0]} maxBarSize={14} name="logins" />
                  <Bar dataKey="uploads" fill="#0891b2" radius={[3,3,0,0]} maxBarSize={14} name="uploads" />
                  <Bar dataKey="queries" fill="#059669" radius={[3,3,0,0]} maxBarSize={14} name="queries" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-48 flex items-center justify-center">
                <p className="text-xs text-muted-foreground">Chưa có dữ liệu hoạt động</p>
              </div>
            )}
            {/* Storage summary row */}
            {systemStats?.storageByType && (
              <div className="mt-3 grid grid-cols-4 gap-1.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                {systemStats.storageByType.map(s => (
                  <div key={s.type} className="text-center">
                    <p className="text-xs font-bold text-foreground">{s.size} <span className="text-[10px] font-normal text-muted-foreground">{s.unit}</span></p>
                    <p className="text-[10px] text-muted-foreground">{s.type}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent users */}
        <Card className="border-slate-200 dark:border-slate-700 shadow-md">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Users className="h-4 w-4 text-indigo-600" />
                Người dùng gần nhất
              </CardTitle>
              <Link href="/dashboard/admin/users">
                <Button variant="ghost" size="sm" className="text-xs h-7">
                  Tất cả <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
                </Button>
              </Link>
            </div>
            <CardDescription className="text-xs">Đăng nhập gần nhất theo thứ tự thời gian</CardDescription>
          </CardHeader>
          <CardContent className="pb-2">
            <div className="space-y-0 divide-y divide-slate-100 dark:divide-slate-800/60">
              {users.slice(0, 8).map(u => {
                const active = u.status === 'ACTIVE';
                return (
                  <div key={u.id} className="flex items-center gap-3 py-2 hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors rounded-lg px-1">
                    <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-950/50 flex items-center justify-center shrink-0">
                      <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300">{initials(u.name)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate">{u.name}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{roleLabel(u.role)}</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                      <span className="text-[10px] text-muted-foreground">{fmtTime(u.lastLogin)}</span>
                    </div>
                  </div>
                );
              })}
              {users.length === 0 && (
                <p className="text-xs text-muted-foreground py-8 text-center">Chưa có dữ liệu người dùng</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Audit log feed ───────────────────────────────────────────────── */}
      <Card className="border-slate-200 dark:border-slate-700 shadow-md">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Eye className="h-4 w-4 text-amber-600" />
              Nhật ký hoạt động hệ thống (Audit Log)
            </CardTitle>
            <Link href="/dashboard/admin/audit-logs">
              <Button variant="ghost" size="sm" className="text-xs h-7">
                Xem đầy đủ <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
              </Button>
            </Link>
          </div>
          <CardDescription className="text-xs">Các sự kiện LOGIN · UPLOAD · PERMISSION_CHANGE · DELETE · FAILED_LOGIN</CardDescription>
        </CardHeader>
        <CardContent className="pb-3">
          <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {auditLogs.map(log => <AuditRow key={log.id} log={log} />)}
            {auditLogs.length === 0 && (
              <p className="text-xs text-muted-foreground py-8 text-center">Chưa có sự kiện audit</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Admin module grid ─────────────────────────────────────────────── */}
      <div>
        <h2 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
          <Package className="h-4 w-4 text-indigo-600" />
          Phân hệ Quản trị
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {ADMIN_MODULES.map(({ href, Icon, label, sub, color, bg }) => (
            <Link href={href} key={href}>
              <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3.5
                flex flex-col items-center gap-2 text-center hover:shadow-md transition-all cursor-pointer group">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
                  style={{ background: bg }}>
                  <Icon className="h-5 w-5" style={{ color }} />
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-foreground leading-tight">{label}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{sub}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
