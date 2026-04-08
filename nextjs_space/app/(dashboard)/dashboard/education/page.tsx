// app/(dashboard)/dashboard/education/page.tsx
// Tổng quan CSDL Giáo dục Đào tạo — Education Database comprehensive overview.
// Implements parallel fetching from three APIs and displays KPI cards, charts, and navigation.

"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  GraduationCap,
  RefreshCw,
  Users,
  BookOpen,
  AlertTriangle,
  BadgeCheck,
  ShieldCheck,
  Loader2,
} from "lucide-react";
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

/** Helper to format numbers with commas */
const formatNumber = (n: number): string =>
  n.toLocaleString(undefined, { maximumFractionDigits: 0 });

/** Types for the three API responses */
interface FacultyStatsResponse {
  success: boolean;
  stats: {
    overview: {
      totalFaculty: number;
      byRank: Record<string, number>;
      byDegree: Record<string, number>;
    };
    byDepartment: Array<{ departmentId: string; departmentName: string; count: number }>;
    research: { totalProjects: number; publicationsPerFaculty: number };
    topResearchers: Array<{
      userId: string;
      name: string;
      email: string;
      academicRank: string;
      academicDegree: string;
      publications: number;
      citations: number;
      researchProjects: number;
    }>;
  };
}

interface EducationDashboardStatsResponse {
  success: boolean;
  data: {
    currentTerm: { id: string; name: string; code: string; startDate: string; endDate: string } | null;
    currentYear: { id: string; name: string } | null;
    students: { total: number; active: number };
    warnings: {
      total: number;
      critical: number;
      high: number;
      medium: number;
      low: number;
      warningRate: number;
    };
    thesis: { draft: number; inProgress: number; defended: number; archived: number; total: number };
    graduation: { pending: number; eligible: number; ineligible: number; approved: number };
    diplomas: number;
    termSections: number;
    termEnrollments: number;
  };
}

interface EducationStatsResponse {
  currentTerm: { id: string; name: string; code: string; startDate: string; endDate: string } | null;
  currentYear: { id: string; name: string } | null;
  overview: {
    programs: number;
    curriculumPlans: number;
    courses: number;
    classSections: number;
    students: number;
    faculty: number;
    totalCredits: number;
  };
  charts: {
    programsByType: Array<{ type: string; count: number }>;
    coursesBySemester: Array<{ semester: string; count: number }>;
  };
  roomUtilization: { total: number; inUse: number; available: number; utilizationRate: number };
  activities: { recentEnrollments: number; completedSessions: number; upcomingSessions: number };
}

export default function EducationOverviewDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [facultyStats, setFacultyStats] = useState<FacultyStatsResponse | null>(null);
  const [eduDashboard, setEduDashboard] = useState<EducationDashboardStatsResponse | null>(null);
  const [eduStats, setEduStats] = useState<EducationStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [facRes, eduDashRes, eduStatRes] = await Promise.all([
        fetch("/api/faculty/stats").then((r) => r.json()),
        fetch("/api/education/dashboard/stats").then((r) => r.json()),
        fetch("/api/education/stats").then((r) => r.json()),
      ]);

      if (facRes?.success) setFacultyStats(facRes as FacultyStatsResponse);
      else setFacultyStats(null);

      if (eduDashRes?.success) setEduDashboard(eduDashRes as EducationDashboardStatsResponse);
      else setEduDashboard(null);

      setEduStats(eduStatRes as EducationStatsResponse);
    } catch (e) {
      console.error(e);
      setError("Không thể tải dữ liệu dashboard. Vui lòng thử lại.");
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
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="mx-auto max-w-lg mt-12">
        <CardHeader>
          <CardTitle>Lỗi</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={fetchAll}>Thử lại</Button>
        </CardContent>
      </Card>
    );
  }

  const go = (path: string) => () => router.push(path);

  const faculty = facultyStats?.stats?.overview;
  const edu = eduDashboard?.data;
  const eduOverview = eduStats?.overview;

  // Header with gradient background
  const Header = () => (
    <header className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 text-white p-6 rounded-b-lg flex items-center justify-between">
      <div>
        <h1 className="flex items-center text-2xl font-bold">
          <GraduationCap className="mr-2 h-6 w-6" />
          Tổng quan Giáo dục Đào tạo
        </h1>
        <p className="text-sm opacity-90">
          {edu?.currentTerm?.name ?? "-"} - {edu?.currentYear?.name ?? "-"}
        </p>
      </div>
      <div className="flex space-x-3">
        <Button variant="outline" size="sm" onClick={fetchAll}>
          <RefreshCw className="mr-1 h-4 w-4" />
          Làm mới
        </Button>
        <Button variant="secondary" size="sm" onClick={go("/dashboard/faculty/list")}>Danh sách GV</Button>
      </div>
    </header>
  );

  // Critical warning banner
  const CriticalAlert = () => {
    if (!edu?.warnings?.critical) return null;
    return (
      <Card className="bg-red-100 border-red-300 my-4">
        <CardContent className="flex items-center justify-between py-2">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <span className="font-medium text-red-800">
              Có {edu.warnings.critical} cảnh báo học tập cấp <strong>khẩn cấp</strong>
            </span>
          </div>
          <Button variant="destructive" size="sm" onClick={go("/dashboard/education/warnings")}>Xem chi tiết</Button>
        </CardContent>
      </Card>
    );
  };

  // Reusable KPI card
  const KPICard = ({
    title,
    value,
    sub,
    borderClass,
    onClick,
  }: {
    title: string;
    value: number;
    sub: string;
    borderClass: string;
    onClick: () => void;
  }) => (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={onClick}>
      <CardHeader className={`border-b-4 ${borderClass}`}>
        <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <p className="text-2xl font-bold text-gray-800">{formatNumber(value)}</p>
        <p className="text-sm text-gray-500">{sub}</p>
      </CardContent>
    </Card>
  );

  const kpiColors = {
    faculty: "border-blue-500",
    student: "border-green-500",
    classSection: "border-indigo-500",
    warning: edu?.warnings?.critical ? "border-red-500" : "border-amber-500",
    graduation: "border-purple-500",
    diploma: "border-emerald-500",
  };

  // Chart components
  const RankBarChart = () => {
    if (!faculty?.byRank) return null;
    const data = Object.entries(faculty.byRank).map(([rank, cnt]) => ({ rank, count: cnt }));
    const COLORS = ["#6366f1", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#ef4444", "#06b6d4", "#3b82f6"];
    return (
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="rank" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="count" fill="#6366f1">
            {data.map((_, i) => (
              <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );
  };

  const DegreePieChart = () => {
    if (!faculty?.byDegree) return null;
    const data = Object.entries(faculty.byDegree).map(([deg, cnt]) => ({ name: deg, value: cnt }));
    const COLORS = ["#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#ef4444", "#06b6d4", "#3b82f6", "#6366f1"];
    return (
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" outerRadius={100} dataKey="value" label>
            {data.map((_, i) => (
              <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    );
  };

  // Thesis pipeline card
  const ThesisPipeline = () => {
    const steps = [
      { label: "DRAFT", count: edu?.thesis?.draft ?? 0 },
      { label: "IN_PROGRESS", count: edu?.thesis?.inProgress ?? 0 },
      { label: "DEFENDED", count: edu?.thesis?.defended ?? 0 },
      { label: "ARCHIVED", count: edu?.thesis?.archived ?? 0 },
    ];
    const total = steps.reduce((a, b) => a + b.count, 0) || 1;
    return (
      <Card>
        <CardHeader>
          <CardTitle>Tiến trình luận văn</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {steps.map((s) => (
            <div key={s.label} className="flex items-center space-x-2">
              <span className="w-24 font-medium">{s.label}</span>
              <Progress value={(s.count / total) * 100} className="h-2 flex-1" />
              <span className="w-12 text-right">{formatNumber(s.count)}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  };

  // Warning breakdown card
  const WarningBreakdown = () => {
    const levels = [
      { label: "CRITICAL", count: edu?.warnings?.critical ?? 0, color: "bg-red-500" },
      { label: "HIGH", count: edu?.warnings?.high ?? 0, color: "bg-orange-500" },
      { label: "MEDIUM", count: edu?.warnings?.medium ?? 0, color: "bg-yellow-500" },
      { label: "LOW", count: edu?.warnings?.low ?? 0, color: "bg-blue-500" },
    ];
    const total = edu?.warnings?.total ?? 1;
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cảnh báo học tập</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {levels.map((lvl) => (
            <div key={lvl.label} className="flex items-center">
              <span className={`inline-block w-3 h-3 mr-2 rounded-full ${lvl.color}`} />
              <span className="flex-1">{lvl.label}</span>
              <span className="font-medium mr-2">{formatNumber(lvl.count)}</span>
              <Progress value={(lvl.count / total) * 100} className="h-2 w-32" />
            </div>
          ))}
          <div className="mt-2 text-sm text-gray-600">
            Tỷ lệ cảnh báo: {edu?.warnings?.warningRate?.toFixed(2) ?? 0}%
          </div>
        </CardContent>
      </Card>
    );
  };

  const GraduationStatus = () => {
    const items = [
      { label: "Chờ xét", count: edu?.graduation?.pending ?? 0, variant: "secondary" },
      { label: "Đủ điều kiện", count: edu?.graduation?.eligible ?? 0, variant: "default" },
      { label: "Chưa đủ", count: edu?.graduation?.ineligible ?? 0, variant: "destructive" },
      { label: "Đã duyệt", count: edu?.graduation?.approved ?? 0, variant: "outline" },
    ];
    return (
      <Card>
        <CardHeader>
          <CardTitle>Trạng thái tốt nghiệp</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {items.map((it) => (
            <Badge key={it.label} variant={it.variant as any} className="px-3 py-1">
              {it.label}: {formatNumber(it.count)}
            </Badge>
          ))}
        </CardContent>
      </Card>
    );
  };

  const QuickNav = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
      <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={go("/dashboard/education/students")}>
        <CardContent className="flex items-center gap-3 py-4">
          <Users className="h-6 w-6 text-indigo-600 shrink-0" />
          <span className="font-medium">Danh sách học viên</span>
        </CardContent>
      </Card>
      <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={go("/dashboard/education/grades")}>
        <CardContent className="flex items-center gap-3 py-4">
          <BookOpen className="h-6 w-6 text-green-600 shrink-0" />
          <span className="font-medium">Quản lý Điểm</span>
        </CardContent>
      </Card>
      <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={go("/dashboard/education/warnings")}>
        <CardContent className="flex items-center gap-3 py-4">
          <AlertTriangle className="h-6 w-6 text-amber-600 shrink-0" />
          <span className="font-medium">Cảnh báo học tập</span>
        </CardContent>
      </Card>
      <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={go("/dashboard/education/graduation")}>
        <CardContent className="flex items-center gap-3 py-4">
          <BadgeCheck className="h-6 w-6 text-purple-600 shrink-0" />
          <span className="font-medium">Xét tốt nghiệp</span>
        </CardContent>
      </Card>
      <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={go("/dashboard/education/conduct")}>
        <CardContent className="flex items-center gap-3 py-4">
          <ShieldCheck className="h-6 w-6 text-teal-600 shrink-0" />
          <span className="font-medium">Điểm rèn luyện</span>
        </CardContent>
      </Card>
      <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={go("/dashboard/faculty/list")}>
        <CardContent className="flex items-center gap-3 py-4">
          <GraduationCap className="h-6 w-6 text-pink-600 shrink-0" />
          <span className="font-medium">Danh sách giảng viên</span>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="p-4 space-y-6">
      <Header />
      <CriticalAlert />
      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KPICard
          title="Tổng giảng viên"
          value={faculty?.totalFaculty ?? 0}
          sub={`${faculty?.totalFaculty ?? 0} đang hoạt động`}
          borderClass={kpiColors.faculty}
          onClick={go("/dashboard/faculty/list")}
        />
        <KPICard
          title="Học viên đang học"
          value={edu?.students?.active ?? 0}
          sub={`Tổng: ${edu?.students?.total ?? 0}`}
          borderClass={kpiColors.student}
          onClick={go("/dashboard/education/students")}
        />
        <KPICard
          title="Lớp học phần HK"
          value={edu?.termSections ?? 0}
          sub={`${edu?.termEnrollments ?? 0} đăng ký`}
          borderClass={kpiColors.classSection}
          onClick={go("/dashboard/education/class-sections")}
        />
        <KPICard
          title="Cảnh báo học tập"
          value={edu?.warnings?.total ?? 0}
          sub={`Khẩn cấp: ${edu?.warnings?.critical ?? 0}`}
          borderClass={kpiColors.warning}
          onClick={go("/dashboard/education/warnings")}
        />
        <KPICard
          title="Chờ/Đủ TN"
          value={edu?.graduation?.eligible ?? 0}
          sub={`Đã duyệt: ${edu?.graduation?.approved ?? 0}`}
          borderClass={kpiColors.graduation}
          onClick={go("/dashboard/education/graduation")}
        />
        <KPICard
          title="Văn bằng đã cấp"
          value={edu?.diplomas ?? 0}
          sub={`Chương trình: ${eduOverview?.programs ?? 0}`}
          borderClass={kpiColors.diploma}
          onClick={go("/dashboard/education/graduation")}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Phân bố theo Học hàm</CardTitle>
          </CardHeader>
          <CardContent>{RankBarChart()}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Phân bố theo Học vị</CardTitle>
          </CardHeader>
          <CardContent>{DegreePieChart()}</CardContent>
        </Card>
      </div>

      {/* Education program overview */}
      <Card>
        <CardHeader>
          <CardTitle>Thông tin chương trình đào tạo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-lg font-medium">{eduOverview?.programs ?? 0}</p>
              <p className="text-sm text-gray-500">Chương trình</p>
            </div>
            <div>
              <p className="text-lg font-medium">{eduOverview?.curriculumPlans ?? 0}</p>
              <p className="text-sm text-gray-500">Kế hoạch giảng dạy</p>
            </div>
            <div>
              <p className="text-lg font-medium">{eduOverview?.courses ?? 0}</p>
              <p className="text-sm text-gray-500">Số học phần</p>
            </div>
            <div>
              <p className="text-lg font-medium">{eduOverview?.totalCredits ?? 0}</p>
              <p className="text-sm text-gray-500">Tổng tín chỉ</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Two column section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ThesisPipeline />
        <WarningBreakdown />
      </div>

      {/* Graduation status */}
      <GraduationStatus />

      {/* Quick navigation */}
      <QuickNav />
    </div>
  );
}
