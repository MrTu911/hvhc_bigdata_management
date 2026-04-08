"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Loader2,
  Users,
  RefreshCw,
  FlaskConical,
  BookUser,
  BarChart3,
  Upload,
  ClipboardCheck,
  ExternalLink,
  Award,
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
  topResearchers: TopResearcher[];
}

interface FacultyStatsResponse {
  success: boolean;
  stats: FacultyStats;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const COLORS = [
  "#7c3aed",
  "#8b5cf6",
  "#6366f1",
  "#3b82f6",
  "#0891b2",
  "#059669",
  "#ec4899",
  "#f59e0b",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatNumber(n: number): string {
  return n.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

function getTopEntry(record: Record<string, number>): { name: string; count: number } | null {
  const entries = Object.entries(record);
  if (entries.length === 0) return null;
  const [name, count] = entries.reduce((best, cur) => (cur[1] > best[1] ? cur : best));
  return { name, count };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface KpiCardProps {
  title: string;
  value: string | number;
  sub: string;
  colorClass: string;
  onClick?: () => void;
}

function KpiCard({ title, value, sub, colorClass, onClick }: KpiCardProps) {
  return (
    <Card
      className={`border-l-4 ${colorClass} hover:shadow-md transition-shadow ${onClick ? "cursor-pointer" : ""}`}
      onClick={onClick}
    >
      <CardContent className="pt-5 pb-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">{title}</p>
        <p className="text-3xl font-bold text-gray-800">{value}</p>
        <p className="text-sm text-gray-500 mt-1">{sub}</p>
      </CardContent>
    </Card>
  );
}

interface RankBarChartProps {
  byRank: Record<string, number>;
}

function RankBarChart({ byRank }: RankBarChartProps) {
  const chartData = Object.entries(byRank).map(([rank, count]) => ({ rank, count }));
  if (chartData.length === 0) {
    return <p className="text-center text-gray-400 py-10">Không có dữ liệu</p>;
  }
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="rank" tick={{ fontSize: 12 }} />
        <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
        <Tooltip />
        <Bar dataKey="count" name="Số lượng">
          {chartData.map((_, index) => (
            <Cell key={`rank-cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

interface DegreepiechartProps {
  byDegree: Record<string, number>;
}

function DegreePieChart({ byDegree }: DegreepiechartProps) {
  const chartData = Object.entries(byDegree).map(([name, value]) => ({ name, value }));
  if (chartData.length === 0) {
    return <p className="text-center text-gray-400 py-10">Không có dữ liệu</p>;
  }
  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          outerRadius={90}
          dataKey="value"
          nameKey="name"
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          labelLine={false}
        >
          {chartData.map((_, index) => (
            <Cell key={`degree-cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}

interface TopResearchersTableProps {
  researchers: TopResearcher[];
  onRowClick: (userId: string) => void;
}

function TopResearchersTable({ researchers, onRowClick }: TopResearchersTableProps) {
  const top5 = researchers.slice(0, 5);
  if (top5.length === 0) {
    return <p className="text-center text-gray-400 py-6">Chưa có dữ liệu nhà nghiên cứu.</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b text-gray-500 text-xs uppercase tracking-wide">
            <th className="py-2 px-3 text-center w-10">#</th>
            <th className="py-2 px-3 text-left">Họ tên</th>
            <th className="py-2 px-3 text-left">Học hàm</th>
            <th className="py-2 px-3 text-right">Công bố</th>
            <th className="py-2 px-3 text-right">Trích dẫn</th>
            <th className="py-2 px-3 text-right">Dự án NC</th>
            <th className="py-2 px-3 text-center">Link</th>
          </tr>
        </thead>
        <tbody>
          {top5.map((researcher, index) => (
            <tr
              key={researcher.userId}
              className="border-b hover:bg-violet-50 cursor-pointer transition-colors"
              onClick={() => onRowClick(researcher.userId)}
            >
              <td className="py-2 px-3 text-center font-bold text-violet-600">{index + 1}</td>
              <td className="py-2 px-3">
                <p className="font-medium text-gray-800">{researcher.name}</p>
                <p className="text-xs text-gray-400">{researcher.academicDegree}</p>
              </td>
              <td className="py-2 px-3">
                <Badge variant="secondary">{researcher.academicRank || "—"}</Badge>
              </td>
              <td className="py-2 px-3 text-right font-semibold">{formatNumber(researcher.publications)}</td>
              <td className="py-2 px-3 text-right">{formatNumber(researcher.citations)}</td>
              <td className="py-2 px-3 text-right">{formatNumber(researcher.researchProjects)}</td>
              <td className="py-2 px-3 text-center">
                <ExternalLink className="h-4 w-4 text-violet-500 inline" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface QuickNavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  colorClass: string;
}

function QuickNavGrid({ items, onNavigate }: { items: QuickNavItem[]; onNavigate: (href: string) => void }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((item) => (
        <Card
          key={item.href}
          className={`border-l-4 ${item.colorClass} cursor-pointer hover:shadow-md transition-shadow`}
          onClick={() => onNavigate(item.href)}
        >
          <CardContent className="flex items-center gap-3 py-4">
            <span className="shrink-0">{item.icon}</span>
            <span className="font-medium text-gray-700">{item.label}</span>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FacultyManagementPage() {
  const { status } = useSession();
  const router = useRouter();

  const [stats, setStats] = useState<FacultyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/faculty/stats");
      const json: FacultyStatsResponse = await res.json();
      if (json?.success && json.stats) {
        setStats(json.stats);
      } else {
        // Partial failure — show zeros, not crash
        setStats(null);
      }
    } catch (err) {
      console.error("[FacultyManagementPage] fetch error:", err);
      setError("Không thể tải dữ liệu giảng viên. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
      return;
    }
    if (status === "authenticated") fetchStats();
  }, [status, router, fetchStats]);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-purple-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-4">
        <p className="text-red-600">{error}</p>
        <Button onClick={fetchStats} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Thử lại
        </Button>
      </div>
    );
  }

  // Safe defaults when API returns null/partial data
  const totalFaculty = stats?.overview?.totalFaculty ?? 0;
  const byRank = stats?.overview?.byRank ?? {};
  const byDegree = stats?.overview?.byDegree ?? {};
  const totalProjects = stats?.research?.totalProjects ?? 0;
  const publicationsPerFaculty = stats?.research?.publicationsPerFaculty ?? 0;
  const byDepartment = stats?.byDepartment ?? [];
  const topResearchers = stats?.topResearchers ?? [];

  const topRank = getTopEntry(byRank);
  const topDegree = getTopEntry(byDegree);
  const topDepartment = byDepartment.length > 0
    ? byDepartment.reduce((best, cur) => (cur.count > best.count ? cur : best))
    : null;

  const quickNavItems: QuickNavItem[] = [
    {
      label: "Danh sách GV",
      href: "/dashboard/faculty/list",
      icon: <Users className="h-5 w-5 text-violet-600" />,
      colorClass: "border-violet-500",
    },
    {
      label: "Phân tích hiệu suất",
      href: "/dashboard/faculty/analytics",
      icon: <BarChart3 className="h-5 w-5 text-purple-600" />,
      colorClass: "border-purple-500",
    },
    {
      label: "Phân công giảng dạy",
      href: "/dashboard/education/teaching-assignment",
      icon: <ClipboardCheck className="h-5 w-5 text-indigo-600" />,
      colorClass: "border-indigo-500",
    },
    {
      label: "Nghiên cứu KH",
      href: "/dashboard/faculty/research",
      icon: <FlaskConical className="h-5 w-5 text-blue-600" />,
      colorClass: "border-blue-500",
    },
    {
      label: "Hồ sơ khoa học",
      href: "/dashboard/faculty/scientific-profile",
      icon: <BookUser className="h-5 w-5 text-teal-600" />,
      colorClass: "border-teal-500",
    },
    {
      label: "Nhập GV",
      href: "/dashboard/faculty/import",
      icon: <Upload className="h-5 w-5 text-green-600" />,
      colorClass: "border-green-500",
    },
  ];

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="rounded-xl bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-700 p-6 text-white">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Users className="h-8 w-8 shrink-0" />
            <div>
              <h1 className="text-2xl font-bold">Quản lý Giảng viên</h1>
              <p className="text-sm text-white/80">Tổng quan lực lượng giảng viên toàn học viện</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="border-white/40 text-white hover:bg-white/10"
              onClick={fetchStats}
            >
              <RefreshCw className="mr-1 h-4 w-4" />
              Làm mới
            </Button>
            <Button
              size="sm"
              className="bg-white text-violet-700 hover:bg-white/90"
              onClick={() => router.push("/dashboard/faculty/list")}
            >
              <Users className="mr-1 h-4 w-4" />
              Thêm GV
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Cards — 3 columns */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <KpiCard
          title="Tổng giảng viên"
          value={formatNumber(totalFaculty)}
          sub="Toàn học viện"
          colorClass="border-violet-500"
          onClick={() => router.push("/dashboard/faculty/list")}
        />
        <KpiCard
          title="Dự án nghiên cứu"
          value={formatNumber(totalProjects)}
          sub="Đang thực hiện"
          colorClass="border-purple-500"
          onClick={() => router.push("/dashboard/faculty/research")}
        />
        <KpiCard
          title="Phân bố học hàm"
          value={topRank ? `${topRank.name} (${topRank.count})` : "—"}
          sub="Học hàm nhiều nhất"
          colorClass="border-indigo-500"
        />
        <KpiCard
          title="Phân bố học vị"
          value={topDegree ? `${topDegree.name} (${topDegree.count})` : "—"}
          sub="Học vị nhiều nhất"
          colorClass="border-blue-500"
        />
        <KpiCard
          title="Đơn vị nhiều nhất"
          value={topDepartment ? `${topDepartment.departmentName}` : "—"}
          sub={topDepartment ? `${topDepartment.count} giảng viên` : "Chưa có dữ liệu"}
          colorClass="border-teal-500"
        />
        <KpiCard
          title="Trung bình CB/GV"
          value={publicationsPerFaculty.toFixed(1)}
          sub="publications/GV"
          colorClass="border-green-500"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Phân bố theo Học hàm</CardTitle>
          </CardHeader>
          <CardContent>
            <RankBarChart byRank={byRank} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Phân bố theo Học vị</CardTitle>
          </CardHeader>
          <CardContent>
            <DegreePieChart byDegree={byDegree} />
          </CardContent>
        </Card>
      </div>

      {/* Top Researchers */}
      <Card>
        <CardHeader className="flex flex-row items-center gap-2">
          <Award className="h-5 w-5 text-violet-600" />
          <CardTitle className="text-base">Top Nhà nghiên cứu</CardTitle>
        </CardHeader>
        <CardContent>
          <TopResearchersTable
            researchers={topResearchers}
            onRowClick={(userId) => router.push(`/dashboard/faculty/list?userId=${userId}`)}
          />
        </CardContent>
      </Card>

      {/* Quick Navigation */}
      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
          Điều hướng nhanh
        </h2>
        <QuickNavGrid
          items={quickNavItems}
          onNavigate={(href) => router.push(href)}
        />
      </div>
    </div>
  );
}
