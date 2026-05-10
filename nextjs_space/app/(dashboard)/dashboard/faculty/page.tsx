"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import {
  Loader2, Users, RefreshCw, FlaskConical, BookUser, BarChart3,
  Upload, ClipboardCheck, ExternalLink, Award, GraduationCap,
  TrendingUp, Building2, BookOpen, ChevronRight, Star, Layers,
  ArrowUpRight, AlertTriangle, ShieldCheck, Activity,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface TopResearcher {
  userId: string;
  name: string;
  email: string;
  academicRank: string;
  academicDegree: string;
  publications: number;
  citations: number;
  researchProjects: number;
}

interface FacultyStats {
  overview: {
    totalFaculty: number;
    byRank: Record<string, number>;
    byDegree: Record<string, number>;
  };
  byDepartment: Array<{
    departmentId: string;
    departmentName: string;
    count: number;
  }>;
  research: {
    totalProjects: number;
    publicationsPerFaculty: number;
  };
  topResearchers?: TopResearcher[];
}

interface WorkloadAlertItem {
  id: string;
  alertType: "OVERLOAD" | "UNDERLOAD";
  message: string | null;
  faculty: {
    id: string;
    name: string;
    militaryId?: string;
    unit: { id: string; name: string } | null;
  };
  snapshot: {
    academicYear: string;
    semesterCode: string;
    totalHoursWeekly: number;
    weeklyHoursLimit: number;
  };
}

interface EISItem {
  facultyId: string;
  facultyName: string;
  department?: string;
  score: number;
  level: string;
  color: string;
}

interface EISDistribution {
  excellent: number;
  good: number;
  average: number;
  needsImprovement: number;
}

interface EISAllResponse {
  faculty: EISItem[];
  statistics: {
    total: number;
    averageScore: number;
    distribution: EISDistribution;
  };
}

interface DashboardData {
  stats: FacultyStats | null;
  alerts: WorkloadAlertItem[];
  alertTotal: number;
  eis: EISAllResponse | null;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const RANK_COLORS = ["#6366f1", "#8b5cf6", "#a78bfa", "#c4b5fd", "#ddd6fe"];
const DEGREE_COLORS = ["#0ea5e9", "#38bdf8", "#7dd3fc", "#bae6fd", "#e0f2fe"];
const DEPT_BAR_COLORS = [
  "bg-indigo-500", "bg-purple-500", "bg-sky-500",
  "bg-teal-500", "bg-violet-500", "bg-blue-500",
];

const EIS_LEVELS = [
  {
    key: "excellent" as keyof EISDistribution,
    label: "Xuất sắc",
    range: "≥ 80",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    text: "text-emerald-700",
    badge: "bg-emerald-100 text-emerald-700",
    dot: "bg-emerald-500",
  },
  {
    key: "good" as keyof EISDistribution,
    label: "Tốt",
    range: "60–79",
    bg: "bg-blue-50",
    border: "border-blue-200",
    text: "text-blue-700",
    badge: "bg-blue-100 text-blue-700",
    dot: "bg-blue-500",
  },
  {
    key: "average" as keyof EISDistribution,
    label: "Trung bình",
    range: "40–59",
    bg: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-700",
    badge: "bg-amber-100 text-amber-700",
    dot: "bg-amber-500",
  },
  {
    key: "needsImprovement" as keyof EISDistribution,
    label: "Cần cải thiện",
    range: "< 40",
    bg: "bg-orange-50",
    border: "border-orange-200",
    text: "text-orange-700",
    badge: "bg-orange-100 text-orange-700",
    dot: "bg-orange-500",
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number): string {
  return n.toLocaleString("vi-VN", { maximumFractionDigits: 0 });
}

function getTopEntry(rec: Record<string, number>): { name: string; count: number } | null {
  const entries = Object.entries(rec);
  if (!entries.length) return null;
  const [name, count] = entries.reduce((a, b) => (b[1] > a[1] ? b : a));
  return { name, count };
}

function totalFromRecord(rec: Record<string, number>): number {
  return Object.values(rec).reduce((s, v) => s + v, 0);
}

async function safeFetch(url: string) {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    console.warn("[FacultyCommandCenter] fetch failed:", url, e);
    return null;
  }
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function CommandCenterSkeleton() {
  return (
    <div className="animate-pulse space-y-5 p-4 lg:p-6">
      <div className="h-28 rounded-2xl bg-slate-200" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-28 rounded-2xl bg-slate-200" />)}
      </div>
      <div className="h-20 rounded-2xl bg-slate-200" />
      <div className="h-10 w-72 rounded-xl bg-slate-200" />
      <div className="h-72 rounded-2xl bg-slate-200" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => <div key={i} className="h-16 rounded-2xl bg-slate-200" />)}
      </div>
    </div>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

interface KpiCardProps {
  title: string;
  value: React.ReactNode;
  sub: string;
  icon: React.ReactNode;
  gradient: string;
  onClick?: () => void;
  pulse?: boolean;
}

function KpiCard({ title, value, sub, icon, gradient, onClick, pulse }: KpiCardProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl ${gradient} p-5 text-white shadow-md transition-transform ${onClick ? "cursor-pointer hover:-translate-y-0.5 hover:shadow-lg" : ""}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-0.5 min-w-0 flex-1 pr-3">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-white/70">{title}</p>
          <p className="text-3xl font-extrabold tracking-tight leading-none pt-1">{value}</p>
          <p className="text-xs text-white/80 pt-1">{sub}</p>
        </div>
        <div className={`rounded-xl bg-white/20 p-2.5 shrink-0 ${pulse ? "animate-pulse" : ""}`}>
          {icon}
        </div>
      </div>
      <div className="pointer-events-none absolute -right-5 -top-5 h-20 w-20 rounded-full bg-white/10" />
    </div>
  );
}

// ─── Alert Panel ──────────────────────────────────────────────────────────────

interface AlertPanelProps {
  alerts: WorkloadAlertItem[];
  alertTotal: number;
  onViewAll: () => void;
  onRowClick: (facultyId: string) => void;
}

function AlertPanel({ alerts, alertTotal, onViewAll, onRowClick }: AlertPanelProps) {
  if (alertTotal === 0) {
    return (
      <div className="flex items-center gap-3 rounded-2xl bg-emerald-50 border border-emerald-100 px-5 py-3">
        <ShieldCheck className="h-5 w-5 text-emerald-500 shrink-0" />
        <p className="text-sm font-medium text-emerald-700">Không có cảnh báo tải giảng — Đội ngũ đang hoạt động ổn định.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-red-50 border border-red-100 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-red-100">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-red-500 shrink-0" />
          <span className="text-sm font-semibold text-red-800">Cảnh báo Tải giảng</span>
          <span className="rounded-full bg-red-500 text-white text-[11px] font-bold px-2 py-0.5 animate-pulse">
            {alertTotal}
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs text-red-600 hover:bg-red-100"
          onClick={onViewAll}
        >
          Xem tất cả
          <ChevronRight className="ml-1 h-3 w-3" />
        </Button>
      </div>
      <div className="divide-y divide-red-50">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className="flex items-center gap-3 px-5 py-2.5 hover:bg-red-100/60 cursor-pointer transition-colors"
            onClick={() => onRowClick(alert.faculty.id)}
          >
            <span
              className={`shrink-0 rounded-md px-2 py-0.5 text-[11px] font-bold ${
                alert.alertType === "OVERLOAD"
                  ? "bg-red-100 text-red-700"
                  : "bg-amber-100 text-amber-700"
              }`}
            >
              {alert.alertType === "OVERLOAD" ? "QUÁ TẢI" : "THIẾU TẢI"}
            </span>
            <span className="font-semibold text-sm text-slate-800 min-w-0 truncate">
              {alert.faculty.name}
            </span>
            <span className="text-xs text-slate-500 truncate hidden sm:block">
              {alert.faculty.unit?.name ?? "Chưa phân công"}
            </span>
            <span className="ml-auto shrink-0 text-xs font-mono text-slate-600 whitespace-nowrap">
              {alert.snapshot.totalHoursWeekly}h / {alert.snapshot.weeklyHoursLimit}h tuần
            </span>
            <span className="shrink-0 text-[11px] text-slate-400 hidden md:block">
              {alert.snapshot.semesterCode} {alert.snapshot.academicYear}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Charts ───────────────────────────────────────────────────────────────────

function RankBarChart({ byRank }: { byRank: Record<string, number> }) {
  const data = Object.entries(byRank).map(([rank, count]) => ({ rank, count }));
  if (!data.length)
    return <p className="py-14 text-center text-sm text-slate-400">Không có dữ liệu</p>;
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 4 }} barSize={28}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="rank" tick={{ fontSize: 11, fill: "#64748b" }} />
        <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#64748b" }} />
        <Tooltip
          contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,.1)" }}
          cursor={{ fill: "#f8fafc" }}
        />
        <Bar dataKey="count" name="Số GV" radius={[5, 5, 0, 0]}>
          {data.map((_, i) => <Cell key={i} fill={RANK_COLORS[i % RANK_COLORS.length]} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function DegreePieChart({ byDegree }: { byDegree: Record<string, number> }) {
  const data = Object.entries(byDegree).map(([name, value]) => ({ name, value }));
  if (!data.length)
    return <p className="py-14 text-center text-sm text-slate-400">Không có dữ liệu</p>;
  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={data}
          cx="50%" cy="50%"
          innerRadius={50} outerRadius={80}
          dataKey="value" nameKey="name"
          paddingAngle={2}
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          labelLine={false}
        >
          {data.map((_, i) => <Cell key={i} fill={DEGREE_COLORS[i % DEGREE_COLORS.length]} />)}
        </Pie>
        <Tooltip contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,.1)" }} />
        <Legend iconType="circle" iconSize={8} />
      </PieChart>
    </ResponsiveContainer>
  );
}

function DeptBar({ name, count, max, index }: { name: string; count: number; max: number; index: number }) {
  const pct = max > 0 ? (count / max) * 100 : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="max-w-[72%] truncate font-medium text-slate-700">{name}</span>
        <span className="font-bold text-slate-900">{count}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full ${DEPT_BAR_COLORS[index % DEPT_BAR_COLORS.length]} transition-all duration-700`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ─── EIS Distribution Row ─────────────────────────────────────────────────────

function EISDistributionRow({
  distribution,
  total,
}: {
  distribution: EISDistribution;
  total: number;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {EIS_LEVELS.map((lvl) => {
        const count = distribution[lvl.key] ?? 0;
        const pct = total > 0 ? ((count / total) * 100).toFixed(0) : "0";
        return (
          <div
            key={lvl.key}
            className={`rounded-xl border ${lvl.border} ${lvl.bg} p-3 space-y-1`}
          >
            <div className="flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full ${lvl.dot} shrink-0`} />
              <span className={`text-xs font-semibold ${lvl.text}`}>{lvl.label}</span>
            </div>
            <p className={`text-2xl font-extrabold ${lvl.text}`}>{count}</p>
            <p className="text-[11px] text-slate-500">{pct}% · EIS {lvl.range}</p>
          </div>
        );
      })}
    </div>
  );
}

// ─── EIS Top 5 Table ──────────────────────────────────────────────────────────

function EISTop5Table({
  items,
  onRowClick,
}: {
  items: EISItem[];
  onRowClick: (facultyId: string) => void;
}) {
  const medals = ["🥇", "🥈", "🥉", "4", "5"];
  const levelBadge: Record<string, string> = {
    "Xuất sắc": "bg-emerald-100 text-emerald-700",
    "Tốt": "bg-blue-100 text-blue-700",
    "Trung bình": "bg-amber-100 text-amber-700",
    "Cần cải thiện": "bg-orange-100 text-orange-700",
  };

  if (!items.length)
    return (
      <div className="flex flex-col items-center justify-center py-10 text-slate-400">
        <Activity className="mb-2 h-8 w-8 opacity-40" />
        <p className="text-sm">Chưa có dữ liệu EIS</p>
      </div>
    );

  return (
    <div className="divide-y divide-slate-100">
      {items.map((item, i) => (
        <div
          key={item.facultyId}
          className="flex items-center gap-3 py-2.5 px-1 cursor-pointer hover:bg-indigo-50/60 transition-colors rounded-lg"
          onClick={() => onRowClick(item.facultyId)}
        >
          <span className="w-6 text-center text-base leading-none shrink-0">{medals[i]}</span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-800">{item.facultyName}</p>
            {item.department && (
              <p className="text-[11px] text-slate-400 truncate">{item.department}</p>
            )}
          </div>
          <span className={`shrink-0 rounded-md px-2 py-0.5 text-[11px] font-bold ${levelBadge[item.level] ?? "bg-slate-100 text-slate-600"}`}>
            {item.level}
          </span>
          <span className="shrink-0 font-mono text-sm font-bold text-slate-700 w-10 text-right">
            {item.score}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Top Researchers Table ────────────────────────────────────────────────────

function TopResearchersTable({
  researchers,
  onRowClick,
}: {
  researchers: TopResearcher[];
  onRowClick: (userId: string) => void;
}) {
  if (!researchers.length)
    return (
      <div className="flex flex-col items-center justify-center py-10 text-slate-400">
        <FlaskConical className="mb-2 h-8 w-8 opacity-40" />
        <p className="text-sm">Chưa có dữ liệu nhà nghiên cứu nổi bật.</p>
        <p className="text-xs mt-1">Xem chi tiết tại trang Nghiên cứu KH.</p>
      </div>
    );

  return (
    <div className="divide-y divide-slate-100">
      {researchers.slice(0, 5).map((r, i) => (
        <div
          key={r.userId}
          className="flex items-center gap-3 py-2.5 px-1 cursor-pointer hover:bg-indigo-50/60 transition-colors rounded-lg"
          onClick={() => onRowClick(r.userId)}
        >
          <span className="w-6 text-center text-base shrink-0">{["🥇","🥈","🥉","4","5"][i]}</span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-800">{r.name}</p>
            <p className="text-[11px] text-slate-400">{r.academicDegree || "—"}</p>
          </div>
          <Badge variant="secondary" className="shrink-0 bg-indigo-100 text-indigo-700">
            {r.academicRank || "—"}
          </Badge>
          <div className="text-right shrink-0">
            <p className="text-sm font-bold text-slate-800">{r.publications}</p>
            <p className="text-[10px] text-slate-400">Công bố</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Quick Nav Card ───────────────────────────────────────────────────────────

interface NavItem {
  label: string;
  desc: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
  color: string;
  bg: string;
}

function QuickNavCard({ item, onNavigate }: { item: NavItem; onNavigate: (href: string) => void }) {
  return (
    <button
      type="button"
      onClick={() => onNavigate(item.href)}
      className="group flex w-full items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md"
    >
      <div className={`rounded-xl ${item.bg} p-2.5 ${item.color} shrink-0 transition-transform group-hover:scale-110`}>
        {item.icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-sm text-slate-800">{item.label}</p>
        <p className="mt-0.5 truncate text-xs text-slate-500">{item.desc}</p>
      </div>
      {item.badge && (
        <Badge className="shrink-0 bg-indigo-600 text-white text-[10px] px-1.5">{item.badge}</Badge>
      )}
      <ArrowUpRight className="h-4 w-4 shrink-0 text-slate-300 transition-colors group-hover:text-indigo-500" />
    </button>
  );
}

// ─── Section Title ────────────────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div className="h-4 w-1 rounded-full bg-indigo-600 shrink-0" />
      <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500">{children}</h2>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FacultyCommandCenterPage() {
  const { status } = useSession();
  const router = useRouter();

  const [dashData, setDashData] = useState<DashboardData>({
    stats: null,
    alerts: [],
    alertTotal: 0,
    eis: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsRes, alertsRes, eisRes] = await Promise.all([
        safeFetch("/api/faculty/stats"),
        safeFetch("/api/faculty/workload/alerts?pageSize=5"),
        safeFetch("/api/faculty/eis?all=true"),
      ]);

      setDashData({
        stats: statsRes?.success && statsRes.stats ? statsRes.stats : null,
        alerts: alertsRes?.success ? (alertsRes.data?.items ?? []) : [],
        alertTotal: alertsRes?.success ? (alertsRes.data?.total ?? 0) : 0,
        eis: eisRes?.statistics ? eisRes : null,
      });
      setLastUpdated(new Date());
    } catch {
      setError("Không thể tải dữ liệu. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/auth/signin"); return; }
    if (status === "authenticated") fetchAll();
  }, [status, router, fetchAll]);

  if (loading) return <CommandCenterSkeleton />;

  // Safe derived values
  const totalFaculty = dashData.stats?.overview?.totalFaculty ?? 0;
  const byRank = dashData.stats?.overview?.byRank ?? {};
  const byDegree = dashData.stats?.overview?.byDegree ?? {};
  const byDepartment = dashData.stats?.byDepartment ?? [];
  const totalProjects = dashData.stats?.research?.totalProjects ?? 0;
  const publicationsPerFaculty = dashData.stats?.research?.publicationsPerFaculty ?? 0;
  const topResearchers = dashData.stats?.topResearchers ?? [];
  const maxDeptCount = byDepartment.length ? Math.max(...byDepartment.map((d) => d.count)) : 0;
  const totalRankCount = totalFromRecord(byRank);

  const eisAvg = dashData.eis?.statistics?.averageScore ?? null;
  const eisDist = dashData.eis?.statistics?.distribution;
  const eisTotal = dashData.eis?.statistics?.total ?? 0;
  const eisFaculty = dashData.eis?.faculty ?? [];
  const eisTop5 = [...eisFaculty].sort((a, b) => b.score - a.score).slice(0, 5);
  const eisExcellent = eisDist?.excellent ?? 0;
  const eisGood = eisDist?.good ?? 0;

  const topRank = getTopEntry(byRank);

  const navItems: NavItem[] = [
    {
      label: "Danh sách Giảng viên",
      desc: "Tìm kiếm, xem hồ sơ và quản lý GV",
      href: "/dashboard/faculty/list",
      icon: <Users className="h-5 w-5" />,
      color: "text-indigo-600", bg: "bg-indigo-50",
      badge: totalFaculty > 0 ? fmt(totalFaculty) : undefined,
    },
    {
      label: "Phân tích Hiệu suất",
      desc: "Tải giảng, EIS, đánh giá đội ngũ",
      href: "/dashboard/faculty/analytics",
      icon: <BarChart3 className="h-5 w-5" />,
      color: "text-violet-600", bg: "bg-violet-50",
      badge: dashData.alertTotal > 0 ? `${dashData.alertTotal} cảnh báo` : undefined,
    },
    {
      label: "Phân công Giảng dạy",
      desc: "Giao môn học, lịch dạy theo học kỳ",
      href: "/dashboard/education/teaching-assignment",
      icon: <ClipboardCheck className="h-5 w-5" />,
      color: "text-purple-600", bg: "bg-purple-50",
    },
    {
      label: "Nghiên cứu Khoa học",
      desc: "Đề tài, dự án NC đang thực hiện",
      href: "/dashboard/faculty/research",
      icon: <FlaskConical className="h-5 w-5" />,
      color: "text-sky-600", bg: "bg-sky-50",
      badge: totalProjects > 0 ? fmt(totalProjects) : undefined,
    },
    {
      label: "Hồ sơ Khoa học",
      desc: "Công trình, bài báo, giáo trình",
      href: "/dashboard/faculty/scientific-profile",
      icon: <BookUser className="h-5 w-5" />,
      color: "text-teal-600", bg: "bg-teal-50",
    },
    {
      label: "Nhập dữ liệu GV",
      desc: "Import danh sách GV từ Excel",
      href: "/dashboard/faculty/import",
      icon: <Upload className="h-5 w-5" />,
      color: "text-emerald-600", bg: "bg-emerald-50",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50/60 p-4 lg:p-6">
      <div className="mx-auto max-w-7xl space-y-5">

        {/* ── Inline Error Banner ── */}
        {error && (
          <div className="flex items-center gap-3 rounded-xl bg-red-50 border border-red-200 px-4 py-3">
            <AlertTriangle className="h-5 w-5 text-red-500 shrink-0" />
            <p className="text-sm text-red-700 flex-1">{error}</p>
            <Button size="sm" variant="outline" onClick={fetchAll}
              className="border-red-300 text-red-600 hover:bg-red-100">
              <RefreshCw className="mr-1.5 h-3 w-3" />Thử lại
            </Button>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════
            HEADER
        ═══════════════════════════════════════════════════════════ */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-900 via-indigo-700 to-violet-700 p-6 text-white shadow-lg">
          <div className="pointer-events-none absolute right-0 top-0 h-64 w-64 -translate-y-1/3 translate-x-1/3 rounded-full bg-white/10 blur-2xl" />
          <div className="pointer-events-none absolute bottom-0 left-1/4 h-40 w-40 translate-y-1/2 rounded-full bg-violet-400/20 blur-xl" />

          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="rounded-2xl bg-white/20 p-3 backdrop-blur-sm shrink-0">
                <GraduationCap className="h-8 w-8 text-white" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-white/60 mb-0.5">
                  Phòng Đào tạo · Học viện Hậu cần
                </p>
                <h1 className="text-2xl font-extrabold tracking-tight">Quản lý Đội ngũ Giảng viên</h1>
                <p className="text-sm text-white/70 mt-0.5">
                  {totalFaculty > 0 ? `${fmt(totalFaculty)} giảng viên` : "Đang tải dữ liệu..."}
                  {topRank ? ` · Học hàm chủ yếu: ${topRank.name} (${topRank.count}/${totalRankCount})` : ""}
                </p>
                {lastUpdated && (
                  <p className="text-[11px] text-white/40 mt-1">
                    Cập nhật {lastUpdated.toLocaleTimeString("vi-VN")}
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                className="border-white/30 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20"
                onClick={fetchAll}
              >
                <RefreshCw className="mr-1.5 h-4 w-4" />Làm mới
              </Button>
              <Button
                size="sm"
                className="bg-white font-semibold text-indigo-700 shadow hover:bg-white/90"
                onClick={() => router.push("/dashboard/faculty/list")}
              >
                <Users className="mr-1.5 h-4 w-4" />Xem danh sách
              </Button>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════
            SECTION 1 — EXECUTIVE OVERVIEW (4 KPI Cards)
        ═══════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <KpiCard
            title="Tổng Giảng viên"
            value={fmt(totalFaculty)}
            sub="đang hoạt động tại HV"
            icon={<Users className="h-6 w-6 text-white" />}
            gradient="bg-gradient-to-br from-indigo-600 to-indigo-800"
            onClick={() => router.push("/dashboard/faculty/list")}
          />
          <KpiCard
            title="Cảnh báo Tải giảng"
            value={dashData.alertTotal === 0 ? "Ổn định" : dashData.alertTotal}
            sub={dashData.alertTotal === 0 ? "Không có bất thường" : "GV cần xem xét ngay"}
            icon={
              dashData.alertTotal === 0
                ? <ShieldCheck className="h-6 w-6 text-white" />
                : <AlertTriangle className="h-6 w-6 text-white" />
            }
            gradient={
              dashData.alertTotal === 0
                ? "bg-gradient-to-br from-emerald-500 to-teal-700"
                : "bg-gradient-to-br from-red-500 to-rose-700"
            }
            pulse={dashData.alertTotal > 0}
            onClick={() => router.push("/dashboard/faculty/analytics")}
          />
          <KpiCard
            title="Điểm EIS Trung bình"
            value={eisAvg !== null ? eisAvg.toFixed(1) : "—"}
            sub={
              eisDist
                ? `Xuất sắc: ${eisExcellent} · Tốt: ${eisGood}`
                : "Chưa có dữ liệu EIS"
            }
            icon={<Star className="h-6 w-6 text-white" />}
            gradient="bg-gradient-to-br from-violet-600 to-purple-800"
            onClick={() => router.push("/dashboard/faculty/analytics")}
          />
          <KpiCard
            title="Đề tài NC Đang chạy"
            value={fmt(totalProjects)}
            sub={
              publicationsPerFaculty > 0
                ? `TB ${publicationsPerFaculty.toFixed(1)} CB/GV`
                : "toàn học viện"
            }
            icon={<FlaskConical className="h-6 w-6 text-white" />}
            gradient="bg-gradient-to-br from-sky-600 to-cyan-700"
            onClick={() => router.push("/dashboard/faculty/research")}
          />
        </div>

        {/* ═══════════════════════════════════════════════════════════
            SECTION 2 — ALERT PANEL
        ═══════════════════════════════════════════════════════════ */}
        <AlertPanel
          alerts={dashData.alerts}
          alertTotal={dashData.alertTotal}
          onViewAll={() => router.push("/dashboard/faculty/analytics")}
          onRowClick={(id) => router.push(`/dashboard/faculty/list?userId=${id}`)}
        />

        {/* ═══════════════════════════════════════════════════════════
            SECTION 3 — CHẤT LƯỢNG ĐỘI NGŨ (TABS)
        ═══════════════════════════════════════════════════════════ */}
        <div>
          <Tabs defaultValue="structure" className="w-full">
            <div className="flex items-center justify-between mb-4">
              <SectionTitle>Chất lượng Đội ngũ</SectionTitle>
              <TabsList className="bg-slate-100 h-8">
                <TabsTrigger value="structure" className="text-xs h-6 px-3">Cơ cấu</TabsTrigger>
                <TabsTrigger value="performance" className="text-xs h-6 px-3">Hiệu suất</TabsTrigger>
                <TabsTrigger value="research" className="text-xs h-6 px-3">Nghiên cứu</TabsTrigger>
              </TabsList>
            </div>

              {/* Tab: Cơ cấu */}
              <TabsContent value="structure" className="mt-0">
                <div className="grid gap-4 lg:grid-cols-3">
                  <Card className="rounded-2xl border-0 shadow-sm">
                    <CardHeader className="flex flex-row items-center gap-2 pb-1 pt-4 px-4">
                      <div className="rounded-lg bg-indigo-50 p-1.5">
                        <Layers className="h-4 w-4 text-indigo-600" />
                      </div>
                      <CardTitle className="text-sm font-semibold text-slate-700">Phân bố Học hàm</CardTitle>
                    </CardHeader>
                    <CardContent className="px-3 pb-4">
                      <RankBarChart byRank={byRank} />
                    </CardContent>
                  </Card>

                  <Card className="rounded-2xl border-0 shadow-sm">
                    <CardHeader className="flex flex-row items-center gap-2 pb-1 pt-4 px-4">
                      <div className="rounded-lg bg-sky-50 p-1.5">
                        <GraduationCap className="h-4 w-4 text-sky-600" />
                      </div>
                      <CardTitle className="text-sm font-semibold text-slate-700">Phân bố Học vị</CardTitle>
                    </CardHeader>
                    <CardContent className="px-3 pb-4">
                      <DegreePieChart byDegree={byDegree} />
                    </CardContent>
                  </Card>

                  <Card className="rounded-2xl border-0 shadow-sm">
                    <CardHeader className="flex flex-row items-center gap-2 pb-1 pt-4 px-4">
                      <div className="rounded-lg bg-violet-50 p-1.5">
                        <Building2 className="h-4 w-4 text-violet-600" />
                      </div>
                      <CardTitle className="text-sm font-semibold text-slate-700">Phân bố theo Đơn vị</CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-4 space-y-3">
                      {byDepartment.length === 0 ? (
                        <p className="py-8 text-center text-sm text-slate-400">Không có dữ liệu</p>
                      ) : (
                        byDepartment.slice(0, 7).map((d, i) => (
                          <DeptBar key={d.departmentId} name={d.departmentName} count={d.count} max={maxDeptCount} index={i} />
                        ))
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Tab: Hiệu suất */}
              <TabsContent value="performance" className="mt-0 space-y-4">
                {eisDist ? (
                  <EISDistributionRow distribution={eisDist} total={eisTotal} />
                ) : (
                  <div className="rounded-xl bg-slate-50 border border-slate-200 py-6 text-center text-sm text-slate-400">
                    Chưa có dữ liệu EIS. Chạy tính điểm tại trang Phân tích Hiệu suất.
                  </div>
                )}

                <div className="grid gap-4 lg:grid-cols-2">
                  <Card className="rounded-2xl border-0 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
                      <div className="flex items-center gap-2">
                        <div className="rounded-lg bg-amber-50 p-1.5">
                          <Star className="h-4 w-4 text-amber-500" />
                        </div>
                        <CardTitle className="text-sm font-semibold text-slate-700">Top 5 GV theo EIS</CardTitle>
                      </div>
                      <Button
                        variant="ghost" size="sm"
                        className="h-7 text-xs text-indigo-600 hover:bg-indigo-50"
                        onClick={() => router.push("/dashboard/faculty/analytics")}
                      >
                        Xem tất cả <ChevronRight className="ml-1 h-3 w-3" />
                      </Button>
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                      <EISTop5Table
                        items={eisTop5}
                        onRowClick={(id) => router.push(`/dashboard/faculty/list?userId=${id}`)}
                      />
                    </CardContent>
                  </Card>

                  <Card className="rounded-2xl border-0 shadow-sm">
                    <CardHeader className="flex flex-row items-center gap-2 pb-2 pt-4 px-4">
                      <div className="rounded-lg bg-violet-50 p-1.5">
                        <Activity className="h-4 w-4 text-violet-600" />
                      </div>
                      <CardTitle className="text-sm font-semibold text-slate-700">Tổng quan Điểm EIS</CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-4 space-y-4">
                      {eisAvg !== null ? (
                        <>
                          <div className="text-center py-4">
                            <p className="text-5xl font-extrabold text-violet-700">{eisAvg.toFixed(1)}</p>
                            <p className="text-sm text-slate-500 mt-1">Điểm EIS trung bình toàn HV</p>
                            <p className="text-xs text-slate-400 mt-0.5">Trên tổng {fmt(eisTotal)} giảng viên</p>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-center text-sm">
                            <div className="rounded-xl bg-emerald-50 py-3">
                              <p className="text-2xl font-bold text-emerald-700">{eisExcellent}</p>
                              <p className="text-xs text-emerald-600">Xuất sắc</p>
                            </div>
                            <div className="rounded-xl bg-blue-50 py-3">
                              <p className="text-2xl font-bold text-blue-700">{eisGood}</p>
                              <p className="text-xs text-blue-600">Tốt</p>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                          <Activity className="mb-2 h-8 w-8 opacity-40" />
                          <p className="text-sm">Chưa có dữ liệu EIS</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Tab: Nghiên cứu */}
              <TabsContent value="research" className="mt-0">
                <div className="grid gap-4 lg:grid-cols-2">
                  <Card className="rounded-2xl border-0 shadow-sm">
                    <CardHeader className="flex flex-row items-center gap-2 pb-2 pt-4 px-4">
                      <div className="rounded-lg bg-sky-50 p-1.5">
                        <FlaskConical className="h-4 w-4 text-sky-600" />
                      </div>
                      <CardTitle className="text-sm font-semibold text-slate-700">Tổng quan Nghiên cứu</CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-4 space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { label: "Đề tài đang chạy", value: fmt(totalProjects), color: "text-sky-700", bg: "bg-sky-50" },
                          { label: "CB / GV (TB)", value: publicationsPerFaculty > 0 ? publicationsPerFaculty.toFixed(1) : "—", color: "text-indigo-700", bg: "bg-indigo-50" },
                        ].map((item) => (
                          <div key={item.label} className={`rounded-xl ${item.bg} p-3 text-center`}>
                            <p className={`text-2xl font-extrabold ${item.color}`}>{item.value}</p>
                            <p className="text-xs text-slate-500 mt-0.5">{item.label}</p>
                          </div>
                        ))}
                      </div>
                      <Button
                        className="w-full bg-sky-600 hover:bg-sky-700 text-white"
                        size="sm"
                        onClick={() => router.push("/dashboard/faculty/research")}
                      >
                        Xem chi tiết Nghiên cứu KH
                        <ArrowUpRight className="ml-2 h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="rounded-2xl border-0 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
                      <div className="flex items-center gap-2">
                        <div className="rounded-lg bg-amber-50 p-1.5">
                          <Award className="h-4 w-4 text-amber-500" />
                        </div>
                        <CardTitle className="text-sm font-semibold text-slate-700">Nhà nghiên cứu Nổi bật</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                      <TopResearchersTable
                        researchers={topResearchers}
                        onRowClick={(uid) => router.push(`/dashboard/faculty/list?userId=${uid}`)}
                      />
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>

        {/* ═══════════════════════════════════════════════════════════
            SECTION 4 — QUICK ACTIONS
        ═══════════════════════════════════════════════════════════ */}
        <div>
          <SectionTitle>Điều hướng nhanh</SectionTitle>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {navItems.map((item) => (
              <QuickNavCard key={item.href} item={item} onNavigate={(href) => router.push(href)} />
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
