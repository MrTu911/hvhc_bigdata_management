"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  GraduationCap, RefreshCw, Users, BookOpen, AlertTriangle,
  BadgeCheck, ShieldCheck, Loader2, TrendingUp, TrendingDown,
  FileText, Building2, Star, Award, ChevronRight, Clock,
  BarChart3, Activity, BookMarked, Layers, Target, Zap, Shield,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from "recharts";

const fmt = (n: number) => n.toLocaleString("vi-VN");

// ─── Types ─────────────────────────────────────────────────────────────────

interface FacultyStats {
  overview: {
    totalFaculty: number;
    byRank: Record<string, number>;
    byDegree: Record<string, number>;
  };
  byDepartment: Array<{ departmentId: string; departmentName: string; count: number }>;
  research: { totalProjects: number; publicationsPerFaculty: number };
  topResearchers: Array<{
    userId: string; name: string; academicRank: string;
    academicDegree: string; publications: number; citations: number; researchProjects: number;
  }>;
}

interface EduDashData {
  currentTerm: { id: string; name: string; code: string; startDate: string; endDate: string } | null;
  currentYear: { id: string; name: string } | null;
  students: { total: number; active: number };
  civilStudents: {
    total: number; active: number; avgGpa: number | null;
    byFaculty: Array<{ faculty: string; count: number }>;
  };
  warnings: { total: number; critical: number; high: number; medium: number; low: number; warningRate: number };
  thesis: { draft: number; inProgress: number; defended: number; archived: number; total: number };
  graduation: { pending: number; eligible: number; ineligible: number; approved: number };
  diplomas: number;
  termSections: number;
  termEnrollments: number;
  byTrainingSystem: Array<{
    systemId: string; systemCode: string; systemName: string;
    totalStudents: number; activeStudents: number;
  }>;
}

interface EduStats {
  currentTerm: { id: string; name: string } | null;
  currentYear: { id: string; name: string } | null;
  overview: {
    programs: number; curriculumPlans: number; courses: number;
    classSections: number; students: number; faculty: number; totalCredits: number;
  };
  charts: {
    programsByType: Array<{ type: string; count: number }>;
    coursesBySemester: Array<{ semester: string; count: number }>;
  };
  roomUtilization: { total: number; inUse: number; available: number; utilizationRate: number };
  activities: { recentEnrollments: number; completedSessions: number; upcomingSessions: number };
}

interface TrendsData {
  graduation: Array<{ academicYear: string; approved: number; eligible: number; ineligible: number }>;
  warnings: Array<{ academicYear: string; critical: number; high: number; medium: number; low: number; total: number }>;
  thesis: Array<{ academicYear: string; defended: number; inProgress: number; avgDefenseScore: number | null }>;
}

interface BattalionStat {
  id: string;
  code: string;
  name: string;
  parent: { id: string; code: string; name: string } | null;
  commander: { id: string; name: string } | null;
  totalStudents: number;
  activeStudents: number;
  warningCount: number;
  criticalWarnings: number;
  avgGpa: number | null;
  activeRate: number;
}

// ─── Color palette ────────────────────────────────────────────────────────

const PALETTE = {
  blue: "#1d4ed8",
  lightBlue: "#3b82f6",
  indigo: "#4f46e5",
  green: "#16a34a",
  lightGreen: "#22c55e",
  amber: "#d97706",
  red: "#dc2626",
  orange: "#ea580c",
  purple: "#7c3aed",
  teal: "#0d9488",
  slate: "#475569",
  emerald: "#059669",
};

const WARNING_COLORS = {
  CRITICAL: "#dc2626",
  HIGH: "#ea580c",
  MEDIUM: "#d97706",
  LOW: "#3b82f6",
};

// ─── Sub-components ───────────────────────────────────────────────────────

function StatCard({
  icon: Icon, label, value, sub, color, trend, onClick,
}: {
  icon: React.ElementType; label: string; value: string | number;
  sub?: string; color: string; trend?: "up" | "down" | "neutral"; onClick?: () => void;
}) {
  return (
    <Card
      className={`relative overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-200 ${onClick ? "cursor-pointer hover:-translate-y-0.5" : ""}`}
      onClick={onClick}
    >
      <div className={`absolute inset-0 opacity-5`} style={{ background: color }} />
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">{label}</p>
            <p className="text-3xl font-bold text-slate-800 leading-none">{typeof value === "number" ? fmt(value) : value}</p>
            {sub && <p className="text-xs text-slate-500 mt-1.5">{sub}</p>}
          </div>
          <div className="flex flex-col items-end gap-1">
            <div className="rounded-xl p-2.5" style={{ background: `${color}18` }}>
              <Icon className="h-5 w-5" style={{ color }} />
            </div>
            {trend === "up" && <TrendingUp className="h-3.5 w-3.5 text-green-500" />}
            {trend === "down" && <TrendingDown className="h-3.5 w-3.5 text-red-500" />}
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-b" style={{ background: color }} />
      </CardContent>
    </Card>
  );
}

function SectionTitle({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-base font-semibold text-slate-700 flex items-center gap-2">
        <span className="w-1 h-5 rounded-full bg-indigo-500 inline-block" />
        {children}
      </h2>
      {action}
    </div>
  );
}

function NavCard({
  icon: Icon, label, sub, color, href, router,
}: {
  icon: React.ElementType; label: string; sub: string;
  color: string; href: string; router: ReturnType<typeof useRouter>;
}) {
  return (
    <Card
      className="cursor-pointer border hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 group"
      onClick={() => router.push(href)}
    >
      <CardContent className="p-4 flex items-center gap-3">
        <div className="rounded-xl p-2.5 shrink-0" style={{ background: `${color}15` }}>
          <Icon className="h-5 w-5" style={{ color }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-slate-800 text-sm leading-tight">{label}</p>
          <p className="text-xs text-slate-500 mt-0.5 truncate">{sub}</p>
        </div>
        <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-500 shrink-0 transition-colors" />
      </CardContent>
    </Card>
  );
}

// ─── Main dashboard ───────────────────────────────────────────────────────

export default function EducationDashboard() {
  const { status } = useSession();
  const router = useRouter();

  const [faculty, setFaculty] = useState<FacultyStats | null>(null);
  const [edu, setEdu] = useState<EduDashData | null>(null);
  const [stats, setStats] = useState<EduStats | null>(null);
  const [trends, setTrends] = useState<TrendsData | null>(null);
  const [battalions, setBattalions] = useState<BattalionStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const safeFetch = (url: string) =>
    fetch(url).then((r) => r.json()).catch((e) => {
      console.warn(`[education/page] fetch failed: ${url}`, e);
      return null;
    });

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [facRes, eduRes, statRes, trendRes, batRes] = await Promise.all([
        safeFetch("/api/faculty/stats"),
        safeFetch("/api/education/dashboard/stats"),
        safeFetch("/api/education/stats"),
        safeFetch("/api/education/dashboard/trends?years=4"),
        safeFetch("/api/education/battalions"),
      ]);
      if (facRes?.success) setFaculty(facRes.stats);
      if (eduRes?.success) setEdu(eduRes.data);
      if (statRes?.overview || statRes?.roomUtilization) setStats(statRes);
      if (trendRes?.success) setTrends(trendRes.data);
      if (batRes?.success && Array.isArray(batRes.data)) setBattalions(batRes.data);
      else console.warn("[education/page] battalions:", batRes);
      setLastUpdated(new Date());
    } catch (e) {
      console.error("[education/page] fetchAll error:", e);
      setError("Không thể tải dữ liệu. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/signin");
    else if (status === "authenticated") fetchAll();
  }, [status, router, fetchAll]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4 bg-slate-50">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg">
            <GraduationCap className="h-8 w-8 text-white" />
          </div>
          <Loader2 className="absolute -top-1 -right-1 h-5 w-5 animate-spin text-indigo-400" />
        </div>
        <p className="text-sm text-slate-500 font-medium">Đang tải dữ liệu đào tạo...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <Card className="max-w-sm shadow-lg border-0">
          <CardContent className="p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="h-6 w-6 text-red-500" />
            </div>
            <p className="text-slate-700 font-medium mb-4">{error}</p>
            <Button onClick={fetchAll} className="bg-indigo-600 hover:bg-indigo-700">Thử lại</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const go = (path: string) => () => router.push(path);
  const ov = stats?.overview;

  // KPI primary row
  const primaryKpis = [
    {
      icon: Users, label: "Học viên đang học", color: PALETTE.indigo,
      value: edu?.students?.active ?? 0,
      sub: `Tổng cộng: ${fmt(edu?.students?.total ?? 0)} HV`,
      onClick: go("/dashboard/education/students"),
    },
    {
      icon: GraduationCap, label: "Giảng viên", color: PALETTE.blue,
      value: faculty?.overview?.totalFaculty ?? 0,
      sub: `${faculty?.research?.totalProjects ?? 0} đề tài nghiên cứu`,
      onClick: go("/dashboard/faculty/list"),
    },
    {
      icon: BookOpen, label: "Lớp HP học kỳ này", color: PALETTE.teal,
      value: edu?.termSections ?? 0,
      sub: `${fmt(edu?.termEnrollments ?? 0)} lượt đăng ký`,
      onClick: go("/dashboard/education/course-sections"),
    },
    {
      icon: Layers, label: "Chương trình ĐT", color: PALETTE.purple,
      value: ov?.programs ?? 0,
      sub: `${ov?.courses ?? 0} học phần · ${ov?.totalCredits ?? 0} TC`,
      onClick: go("/dashboard/education/programs"),
    },
    {
      icon: AlertTriangle, label: "Cảnh báo học tập",
      color: (edu?.warnings?.critical ?? 0) > 0 ? PALETTE.red : PALETTE.amber,
      value: edu?.warnings?.total ?? 0,
      sub: `Khẩn cấp: ${edu?.warnings?.critical ?? 0} · Cao: ${edu?.warnings?.high ?? 0}`,
      trend: (edu?.warnings?.critical ?? 0) > 0 ? "up" as const : undefined,
      onClick: go("/dashboard/education/warnings"),
    },
    {
      icon: Award, label: "Đủ điều kiện TN", color: PALETTE.green,
      value: edu?.graduation?.eligible ?? 0,
      sub: `Đã duyệt: ${edu?.graduation?.approved ?? 0} · Văn bằng: ${edu?.diplomas ?? 0}`,
      onClick: go("/dashboard/education/graduation"),
    },
  ];

  // Warning levels data
  const warnLevels = [
    { label: "Khẩn cấp", key: "critical", count: edu?.warnings?.critical ?? 0, color: WARNING_COLORS.CRITICAL },
    { label: "Mức cao", key: "high", count: edu?.warnings?.high ?? 0, color: WARNING_COLORS.HIGH },
    { label: "Mức vừa", key: "medium", count: edu?.warnings?.medium ?? 0, color: WARNING_COLORS.MEDIUM },
    { label: "Mức thấp", key: "low", count: edu?.warnings?.low ?? 0, color: WARNING_COLORS.LOW },
  ];
  const totalWarn = edu?.warnings?.total || 1;

  // Thesis pipeline
  const thesisPipeline = [
    { label: "Đang soạn", count: edu?.thesis?.draft ?? 0, color: PALETTE.slate, key: "draft" },
    { label: "Đang làm", count: edu?.thesis?.inProgress ?? 0, color: PALETTE.blue, key: "in_progress" },
    { label: "Đã bảo vệ", count: edu?.thesis?.defended ?? 0, color: PALETTE.green, key: "defended" },
    { label: "Lưu trữ", count: edu?.thesis?.archived ?? 0, color: PALETTE.purple, key: "archived" },
  ];
  const totalThesis = edu?.thesis?.total || 1;

  // Rank bar chart data
  const rankData = Object.entries(faculty?.overview?.byRank ?? {})
    .map(([rank, count]) => ({ rank, count }))
    .sort((a, b) => b.count - a.count);

  // Degree pie data
  const degreeData = Object.entries(faculty?.overview?.byDegree ?? {})
    .map(([name, value]) => ({ name, value }));
  const DEGREE_COLORS = [PALETTE.indigo, PALETTE.blue, PALETTE.teal, PALETTE.purple, PALETTE.green, PALETTE.amber];

  // Training system colors
  const sysColorMap: Record<string, string> = {
    "HE-SDH": PALETTE.purple,
    "HE-CHTS": PALETTE.blue,
    "HE-CN": PALETTE.green,
    "HE-QT": PALETTE.orange,
  };

  // Trend chart data (reverse for chronological order)
  const gradTrend = [...(trends?.graduation ?? [])].reverse();
  const warnTrend = [...(trends?.warnings ?? [])].reverse();

  // Room utilization
  const roomUtil = stats?.roomUtilization;

  const navItems = [
    { icon: Users, label: "Học viên", sub: "Danh sách & hồ sơ học viên", color: PALETTE.indigo, href: "/dashboard/education/students" },
    { icon: BookMarked, label: "Điểm số", sub: "Quản lý điểm theo học kỳ", color: PALETTE.blue, href: "/dashboard/education/grades" },
    { icon: AlertTriangle, label: "Cảnh báo HT", sub: "Theo dõi & xử lý cảnh báo", color: PALETTE.red, href: "/dashboard/education/warnings" },
    { icon: BadgeCheck, label: "Xét tốt nghiệp", sub: "Kiểm tra điều kiện tốt nghiệp", color: PALETTE.green, href: "/dashboard/education/graduation" },
    { icon: FileText, label: "Khóa luận", sub: "Theo dõi tiến độ khóa luận", color: PALETTE.purple, href: "/dashboard/education/thesis" },
    { icon: ShieldCheck, label: "Rèn luyện", sub: "Điểm rèn luyện học kỳ", color: PALETTE.teal, href: "/dashboard/education/conduct" },
    { icon: Building2, label: "Chương trình ĐT", sub: "Quản lý chương trình & CTGD", color: PALETTE.indigo, href: "/dashboard/education/programs" },
    { icon: BarChart3, label: "Lịch giảng dạy", sub: "Phân công & TKB", color: PALETTE.amber, href: "/dashboard/education/schedule" },
    { icon: Target, label: "Thi & kiểm tra", sub: "Kế hoạch thi học kỳ", color: PALETTE.orange, href: "/dashboard/education/exam-plan" },
    { icon: Activity, label: "Điểm danh", sub: "Theo dõi chuyên cần", color: PALETTE.slate, href: "/dashboard/education/attendance" },
    { icon: Zap, label: "GV & NCKH", sub: "Đội ngũ giảng viên", color: PALETTE.blue, href: "/dashboard/faculty/list" },
    { icon: Star, label: "Tổng quan chi tiết", sub: "Báo cáo tổng thể đào tạo", color: PALETTE.purple, href: "/dashboard/education/overview" },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-blue-800 text-white px-6 py-5">
        <div className="max-w-screen-xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center shrink-0">
              <GraduationCap className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold leading-tight">Tổng quan Giáo dục Đào tạo</h1>
              <p className="text-indigo-200 text-sm mt-0.5">
                {edu?.currentTerm?.name ?? "—"} · {edu?.currentYear?.name ?? "—"}
                {lastUpdated && (
                  <span className="ml-3 opacity-70 text-xs">
                    <Clock className="inline h-3 w-3 mr-0.5" />
                    {lastUpdated.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchAll}
              className="text-white hover:bg-white/10 border border-white/20"
            >
              <RefreshCw className="h-4 w-4 mr-1.5" />
              Làm mới
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-6 py-6 space-y-8">

        {/* ── Critical Alert ──────────────────────────────────────────── */}
        {(edu?.warnings?.critical ?? 0) > 0 && (
          <div
            className="flex items-center justify-between gap-4 bg-red-50 border border-red-200 rounded-xl px-5 py-3.5 shadow-sm cursor-pointer hover:bg-red-100 transition-colors"
            onClick={go("/dashboard/education/warnings")}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-5 w-5 text-red-600 animate-pulse" />
              </div>
              <div>
                <p className="font-semibold text-red-800 text-sm">
                  {edu!.warnings.critical} cảnh báo học tập mức KHẨN CẤP chưa xử lý
                </p>
                <p className="text-xs text-red-600">
                  Tổng {edu!.warnings.total} cảnh báo · Tỷ lệ: {edu!.warnings.warningRate}%
                </p>
              </div>
            </div>
            <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white shrink-0">
              Xem ngay <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}

        {/* ── KPI Grid ────────────────────────────────────────────────── */}
        <div>
          <SectionTitle>Chỉ số tổng quan học kỳ</SectionTitle>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
            {primaryKpis.map((kpi) => (
              <StatCard key={kpi.label} {...kpi} />
            ))}
          </div>
        </div>

        {/* ── Hệ đào tạo ──────────────────────────────────────────────── */}
        {(edu?.byTrainingSystem?.length ?? 0) > 0 && (
          <div>
            <SectionTitle
              action={
                <Button variant="ghost" size="sm" className="text-indigo-600" onClick={go("/dashboard/education/training-systems")}>
                  Xem tất cả <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
                </Button>
              }
            >
              Phân bổ học viên theo Hệ đào tạo
            </SectionTitle>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {edu!.byTrainingSystem.map((sys) => {
                const pct = sys.totalStudents > 0 ? Math.round((sys.activeStudents / sys.totalStudents) * 100) : 0;
                const color = sysColorMap[sys.systemCode] ?? PALETTE.slate;
                return (
                  <Card
                    key={sys.systemId}
                    className="cursor-pointer border-0 shadow-md hover:shadow-xl transition-all hover:-translate-y-0.5 overflow-hidden"
                    onClick={go(`/dashboard/education/training-systems/${sys.systemId}`)}
                  >
                    <div className="h-1 w-full" style={{ background: color }} />
                    <CardContent className="p-4">
                      <Badge
                        className="mb-2 font-mono text-xs"
                        style={{ background: `${color}15`, color, border: "none" }}
                      >
                        {sys.systemCode}
                      </Badge>
                      <p className="text-2xl font-bold text-slate-800">{fmt(sys.totalStudents)}</p>
                      <p className="text-xs text-slate-500 mt-0.5 truncate">{sys.systemName}</p>
                      <div className="mt-3 space-y-1">
                        <div className="flex justify-between text-xs text-slate-500">
                          <span>Đang học</span>
                          <span className="font-medium" style={{ color }}>{fmt(sys.activeStudents)} · {pct}%</span>
                        </div>
                        <Progress value={pct} className="h-1.5 bg-slate-100" />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Tiểu đoàn đào tạo ────────────────────────────────────────── */}
        {battalions.length > 0 && (
          <div>
            <SectionTitle
              action={
                <Button variant="ghost" size="sm" className="text-indigo-600" onClick={go("/dashboard/education/battalions")}>
                  Xem chi tiết <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
                </Button>
              }
            >
              Phân bổ học viên theo Tiểu đoàn đào tạo
            </SectionTitle>

            {/* Bar chart overview */}
            <Card className="border-0 shadow-md mb-4">
              <CardContent className="pt-4 pb-2">
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart
                    data={battalions.map((b) => ({
                      name: b.code,
                      "Đang học": b.activeStudents,
                      "Tổng": b.totalStudents,
                      "Cảnh báo": b.warningCount,
                    }))}
                    margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748b" }} />
                    <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} />
                    <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="Tổng" fill="#e2e8f0" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Đang học" fill={PALETTE.indigo} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Cảnh báo" fill={PALETTE.amber} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Battalion cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
              {battalions.map((bat) => {
                const hasCritical = bat.criticalWarnings > 0;
                const gpaColor =
                  bat.avgGpa === null ? PALETTE.slate
                  : bat.avgGpa >= 3.2 ? PALETTE.green
                  : bat.avgGpa >= 2.5 ? PALETTE.blue
                  : bat.avgGpa >= 2.0 ? PALETTE.amber
                  : PALETTE.red;
                return (
                  <Card
                    key={bat.id}
                    className={`border-0 shadow-sm hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 cursor-pointer overflow-hidden ${hasCritical ? "ring-1 ring-red-200" : ""}`}
                    onClick={go(`/dashboard/education/battalions/${bat.id}`)}
                  >
                    <div className="h-1" style={{ background: hasCritical ? PALETTE.red : PALETTE.indigo }} />
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <Shield className="h-3.5 w-3.5 text-indigo-500" />
                            <span className="text-xs font-semibold text-indigo-600 font-mono">{bat.code}</span>
                          </div>
                          <p className="text-sm font-semibold text-slate-800 mt-0.5 leading-tight">{bat.name}</p>
                        </div>
                        {hasCritical && (
                          <Badge className="bg-red-100 text-red-700 border-0 text-xs shrink-0">
                            {bat.criticalWarnings} khẩn
                          </Badge>
                        )}
                      </div>

                      {bat.parent && (
                        <p className="text-xs text-slate-400 mb-3 truncate">{bat.parent.name}</p>
                      )}

                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-500">Học viên đang học</span>
                          <span className="font-semibold text-indigo-600">{fmt(bat.activeStudents)}/{fmt(bat.totalStudents)}</span>
                        </div>
                        <Progress value={bat.activeRate} className="h-1.5 bg-slate-100" />
                      </div>

                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100">
                        <div className="text-center">
                          <p className="text-xs text-slate-400">GPA TB</p>
                          <p className="text-sm font-bold" style={{ color: gpaColor }}>
                            {bat.avgGpa !== null ? bat.avgGpa.toFixed(2) : "—"}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-slate-400">Cảnh báo</p>
                          <p className="text-sm font-bold" style={{ color: bat.warningCount > 0 ? PALETTE.amber : PALETTE.green }}>
                            {bat.warningCount}
                          </p>
                        </div>
                        {bat.commander && (
                          <div className="text-right max-w-[100px]">
                            <p className="text-xs text-slate-400">Chỉ huy</p>
                            <p className="text-xs text-slate-600 truncate font-medium">{bat.commander.name}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Sinh viên dân sự ─────────────────────────────────────────── */}
        {(edu?.civilStudents?.total ?? 0) > 0 && (
          <div>
            <SectionTitle
              action={
                <Button variant="ghost" size="sm" className="text-indigo-600" onClick={go("/dashboard/education/civil-students")}>
                  Xem danh sách <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
                </Button>
              }
            >
              Sinh viên dân sự
            </SectionTitle>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* KPI tổng quan */}
              <Card className="border-0 shadow-md">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center">
                      <Users className="h-5 w-5 text-teal-600" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Sinh viên dân sự</p>
                      <p className="text-2xl font-bold text-slate-800">{fmt(edu!.civilStudents.total)}</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-500">Đang học</span>
                      <span className="font-semibold text-teal-600">{fmt(edu!.civilStudents.active)}</span>
                    </div>
                    <Progress
                      value={edu!.civilStudents.total > 0 ? Math.round((edu!.civilStudents.active / edu!.civilStudents.total) * 100) : 0}
                      className="h-1.5 bg-slate-100"
                    />
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-500">Điểm TB (thang 10)</span>
                      <span className="font-semibold" style={{
                        color: edu!.civilStudents.avgGpa === null ? PALETTE.slate
                          : edu!.civilStudents.avgGpa >= 8.0 ? PALETTE.green
                          : edu!.civilStudents.avgGpa >= 6.5 ? PALETTE.blue
                          : edu!.civilStudents.avgGpa >= 5.0 ? PALETTE.amber
                          : PALETTE.red
                      }}>
                        {edu!.civilStudents.avgGpa !== null ? edu!.civilStudents.avgGpa.toFixed(2) : "—"}
                      </span>
                    </div>
                    <Button
                      variant="outline" size="sm"
                      className="w-full mt-1 border-teal-200 text-teal-700 hover:bg-teal-50"
                      onClick={go("/dashboard/education/civil-students")}
                    >
                      Quản lý sinh viên dân sự
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Phân bố theo khoa */}
              <Card className="border-0 shadow-md lg:col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600">Phân bố theo Khoa quản lý</CardTitle>
                </CardHeader>
                <CardContent>
                  {edu!.civilStudents.byFaculty.length > 0 ? (
                    <ResponsiveContainer width="100%" height={160}>
                      <BarChart
                        data={edu!.civilStudents.byFaculty}
                        layout="vertical"
                        margin={{ top: 0, right: 20, left: 10, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                        <XAxis type="number" tick={{ fontSize: 11, fill: "#94a3b8" }} />
                        <YAxis
                          type="category"
                          dataKey="faculty"
                          tick={{ fontSize: 10, fill: "#64748b" }}
                          width={120}
                        />
                        <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }} />
                        <Bar dataKey="count" name="Sinh viên" fill={PALETTE.teal} radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-32 text-slate-400 text-sm">
                      Chưa có dữ liệu phân bố khoa
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* ── Warning + Thesis + Graduation ───────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Warning breakdown */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-slate-700 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  Phân tích cảnh báo học tập
                </span>
                <Badge variant="outline" className="text-xs font-normal">
                  {edu?.warnings?.warningRate ?? 0}% HV
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {warnLevels.map((lvl) => (
                <div key={lvl.key}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium" style={{ color: lvl.color }}>{lvl.label}</span>
                    <span className="font-semibold text-slate-700">{fmt(lvl.count)}</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${(lvl.count / totalWarn) * 100}%`, background: lvl.color }}
                    />
                  </div>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-2 border-amber-200 text-amber-700 hover:bg-amber-50"
                onClick={go("/dashboard/education/warnings")}
              >
                Quản lý cảnh báo
              </Button>
            </CardContent>
          </Card>

          {/* Thesis pipeline */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <FileText className="h-4 w-4 text-purple-500" />
                Tiến trình Khóa luận / Luận văn
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {thesisPipeline.map((step) => (
                <div key={step.key}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-600">{step.label}</span>
                    <span className="font-semibold" style={{ color: step.color }}>{fmt(step.count)}</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${(step.count / totalThesis) * 100}%`, background: step.color }}
                    />
                  </div>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-2 border-purple-200 text-purple-700 hover:bg-purple-50"
                onClick={go("/dashboard/education/thesis")}
              >
                Quản lý khóa luận
              </Button>
            </CardContent>
          </Card>

          {/* Graduation status */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <BadgeCheck className="h-4 w-4 text-green-500" />
                Xét tốt nghiệp
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 mb-4">
                {[
                  { label: "Chờ xét duyệt", val: edu?.graduation?.pending ?? 0, color: PALETTE.slate, bg: "bg-slate-50" },
                  { label: "Đủ điều kiện", val: edu?.graduation?.eligible ?? 0, color: PALETTE.green, bg: "bg-green-50" },
                  { label: "Chưa đủ ĐK", val: edu?.graduation?.ineligible ?? 0, color: PALETTE.red, bg: "bg-red-50" },
                  { label: "Đã phê duyệt", val: edu?.graduation?.approved ?? 0, color: PALETTE.indigo, bg: "bg-indigo-50" },
                ].map((item) => (
                  <div key={item.label} className={`${item.bg} rounded-xl p-3 text-center`}>
                    <p className="text-2xl font-bold" style={{ color: item.color }}>{fmt(item.val)}</p>
                    <p className="text-xs text-slate-500 mt-0.5 leading-tight">{item.label}</p>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500 border-t pt-3">
                <span>Văn bằng đã cấp</span>
                <span className="font-bold text-emerald-600 text-base">{fmt(edu?.diplomas ?? 0)}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-3 border-green-200 text-green-700 hover:bg-green-50"
                onClick={go("/dashboard/education/graduation")}
              >
                Xem xét tốt nghiệp
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* ── Trend Charts ─────────────────────────────────────────────── */}
        {gradTrend.length > 0 && (
          <div>
            <SectionTitle>Xu hướng đào tạo theo năm học</SectionTitle>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Graduation trend */}
              <Card className="border-0 shadow-md">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    Kết quả xét tốt nghiệp theo năm
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={gradTrend} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="gradApproved" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={PALETTE.green} stopOpacity={0.2} />
                          <stop offset="95%" stopColor={PALETTE.green} stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="gradIneligible" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={PALETTE.red} stopOpacity={0.15} />
                          <stop offset="95%" stopColor={PALETTE.red} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="academicYear" tick={{ fontSize: 11, fill: "#94a3b8" }} />
                      <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} />
                      <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Area type="monotone" dataKey="approved" name="Đã duyệt TN" stroke={PALETTE.green} fill="url(#gradApproved)" strokeWidth={2} />
                      <Area type="monotone" dataKey="eligible" name="Đủ điều kiện" stroke={PALETTE.blue} fill="none" strokeWidth={1.5} strokeDasharray="4 2" />
                      <Area type="monotone" dataKey="ineligible" name="Chưa đủ ĐK" stroke={PALETTE.red} fill="url(#gradIneligible)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Warning trend */}
              <Card className="border-0 shadow-md">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                    <Activity className="h-4 w-4 text-amber-500" />
                    Xu hướng cảnh báo học tập theo năm
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={warnTrend} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="academicYear" tick={{ fontSize: 11, fill: "#94a3b8" }} />
                      <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} />
                      <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Bar dataKey="critical" name="Khẩn cấp" fill={WARNING_COLORS.CRITICAL} radius={[3, 3, 0, 0]} />
                      <Bar dataKey="high" name="Cao" fill={WARNING_COLORS.HIGH} radius={[3, 3, 0, 0]} />
                      <Bar dataKey="medium" name="Vừa" fill={WARNING_COLORS.MEDIUM} radius={[3, 3, 0, 0]} />
                      <Bar dataKey="low" name="Thấp" fill={WARNING_COLORS.LOW} radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* ── Faculty Charts ───────────────────────────────────────────── */}
        {(faculty?.overview?.totalFaculty ?? 0) > 0 && (
          <div>
            <SectionTitle>Cơ cấu đội ngũ giảng viên</SectionTitle>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* By rank */}
              <Card className="border-0 shadow-md">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600">Phân bố theo Học hàm</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={rankData} layout="vertical" margin={{ top: 5, right: 20, left: 40, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 11, fill: "#94a3b8" }} />
                      <YAxis type="category" dataKey="rank" tick={{ fontSize: 11, fill: "#64748b" }} width={70} />
                      <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }} />
                      <Bar dataKey="count" name="Số GV" fill={PALETTE.indigo} radius={[0, 4, 4, 0]}>
                        {rankData.map((_, i) => (
                          <Cell
                            key={i}
                            fill={[PALETTE.indigo, PALETTE.blue, PALETTE.teal, PALETTE.purple, PALETTE.green, PALETTE.amber][i % 6]}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* By degree */}
              <Card className="border-0 shadow-md">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600">Phân bố theo Học vị</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={degreeData}
                        cx="40%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {degreeData.map((_, i) => (
                          <Cell key={i} fill={DEGREE_COLORS[i % DEGREE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }} />
                      <Legend
                        layout="vertical"
                        align="right"
                        verticalAlign="middle"
                        iconSize={10}
                        wrapperStyle={{ fontSize: 11, right: 0 }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* ── Top Researchers ──────────────────────────────────────────── */}
        {(faculty?.topResearchers?.length ?? 0) > 0 && (
          <div>
            <SectionTitle
              action={
                <Button variant="ghost" size="sm" className="text-indigo-600" onClick={go("/dashboard/faculty/list")}>
                  Xem tất cả GV <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
                </Button>
              }
            >
              Giảng viên có đóng góp nghiên cứu nổi bật
            </SectionTitle>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {faculty!.topResearchers.slice(0, 6).map((r, idx) => (
                <Card key={r.userId} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-4 flex gap-3 items-start">
                    <div className="w-9 h-9 rounded-full shrink-0 flex items-center justify-center text-white font-bold text-sm"
                      style={{
                        background: [PALETTE.indigo, PALETTE.blue, PALETTE.teal, PALETTE.purple, PALETTE.green, PALETTE.amber][idx % 6],
                      }}
                    >
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 text-sm truncate">{r.name}</p>
                      <p className="text-xs text-slate-500">{r.academicRank} · {r.academicDegree}</p>
                      <div className="flex gap-3 mt-2">
                        <span className="text-xs text-slate-500">
                          <span className="font-semibold text-indigo-600">{r.publications}</span> CB
                        </span>
                        <span className="text-xs text-slate-500">
                          <span className="font-semibold text-blue-600">{r.citations}</span> TĐ
                        </span>
                        <span className="text-xs text-slate-500">
                          <span className="font-semibold text-teal-600">{r.researchProjects}</span> ĐT
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* ── Program & Room stats ──────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Program summary */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Layers className="h-4 w-4 text-indigo-500" />
                Thông tin Chương trình Đào tạo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Chương trình", val: ov?.programs ?? 0, color: PALETTE.indigo },
                  { label: "Kế hoạch GD", val: ov?.curriculumPlans ?? 0, color: PALETTE.blue },
                  { label: "Học phần", val: ov?.courses ?? 0, color: PALETTE.teal },
                  { label: "Tổng tín chỉ", val: ov?.totalCredits ?? 0, color: PALETTE.purple },
                ].map((item) => (
                  <div key={item.label} className="bg-slate-50 rounded-xl p-3">
                    <p className="text-xl font-bold" style={{ color: item.color }}>{fmt(item.val)}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{item.label}</p>
                  </div>
                ))}
              </div>
              <Button variant="outline" size="sm" className="w-full mt-4" onClick={go("/dashboard/education/programs")}>
                Xem chương trình đào tạo
              </Button>
            </CardContent>
          </Card>

          {/* Room utilization */}
          {roomUtil && (
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-teal-500" />
                  Tình trạng sử dụng Phòng học
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 mb-4">
                  <div className="relative w-24 h-24 shrink-0">
                    <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                      <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f1f5f9" strokeWidth="3" />
                      <circle
                        cx="18" cy="18" r="15.9" fill="none"
                        stroke={roomUtil.utilizationRate > 80 ? PALETTE.red : PALETTE.teal}
                        strokeWidth="3"
                        strokeDasharray={`${roomUtil.utilizationRate} ${100 - roomUtil.utilizationRate}`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-xl font-bold text-slate-800">{roomUtil.utilizationRate}%</span>
                      <span className="text-xs text-slate-500">SD</span>
                    </div>
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Tổng phòng</span>
                      <span className="font-semibold text-slate-700">{fmt(roomUtil.total)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-teal-600">Đang sử dụng</span>
                      <span className="font-semibold text-teal-600">{fmt(roomUtil.inUse)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Trống</span>
                      <span className="font-semibold text-slate-500">{fmt(roomUtil.available)}</span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 border-t pt-3 text-center">
                  <div>
                    <p className="text-base font-bold text-blue-600">{fmt(stats?.activities?.recentEnrollments ?? 0)}</p>
                    <p className="text-xs text-slate-500">Đăng ký gần đây</p>
                  </div>
                  <div>
                    <p className="text-base font-bold text-green-600">{fmt(stats?.activities?.completedSessions ?? 0)}</p>
                    <p className="text-xs text-slate-500">Tiết đã dạy</p>
                  </div>
                  <div>
                    <p className="text-base font-bold text-amber-600">{fmt(stats?.activities?.upcomingSessions ?? 0)}</p>
                    <p className="text-xs text-slate-500">Tiết sắp tới</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* ── Quick Navigation ─────────────────────────────────────────── */}
        <div>
          <SectionTitle>Truy cập nhanh các phân hệ</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
            {navItems.map((item) => (
              <NavCard key={item.href} {...item} router={router} />
            ))}
          </div>
        </div>

        {/* ── Footer ──────────────────────────────────────────────────── */}
        <div className="text-center text-xs text-slate-400 pb-4">
          Hệ thống Quản lý Giáo dục Đào tạo · Học viện Hậu cần
        </div>
      </div>
    </div>
  );
}
