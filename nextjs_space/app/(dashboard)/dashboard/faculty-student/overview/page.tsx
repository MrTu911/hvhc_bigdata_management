'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/components/providers/language-provider';
import DashboardHeader from '@/components/dashboard/dashboard-header';
import {
  Users,
  GraduationCap,
  BookOpen,
  FlaskConical,
  TrendingUp,
  Award,
  BarChart3,
  Calendar
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import Link from 'next/link';

interface OverviewData {
  faculty: {
    total: number;
    byDegree: { degree: string; count: number }[];
    byRank: { rank: string; count: number }[];
  };
  students: {
    total: number;
    byStatus: { status: string; count: number }[];
    byClass: { class: string; count: number }[];
  };
  teaching: {
    totalSubjects: number;
    totalResults: number;
    avgGrade: number;
  };
  research: {
    totalProjects: number;
    totalPublications: number;
  };
  recentFaculty: any[];
  recentStudents: any[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function FacultyStudentOverviewPage() {
  const { t } = useLanguage();
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/faculty-student/overview');
      const result = await res.json();
      if (res.ok) {
        setData(result);
      } else {
        console.error('API Error:', result.error);
        // Set default data to prevent crashes
        setData({
          faculty: { total: 0, byDegree: [], byRank: [] },
          students: { total: 0, byStatus: [], byClass: [] },
          teaching: { totalSubjects: 0, totalResults: 0, avgGrade: 0 },
          research: { totalProjects: 0, totalPublications: 0 },
          recentFaculty: [],
          recentStudents: [],
        });
      }
    } catch (error) {
      console.error('Error:', error);
      // Set default data to prevent crashes
      setData({
        faculty: { total: 0, byDegree: [], byRank: [] },
        students: { total: 0, byStatus: [], byClass: [] },
        teaching: { totalSubjects: 0, totalResults: 0, avgGrade: 0 },
        research: { totalProjects: 0, totalPublications: 0 },
        recentFaculty: [],
        recentStudents: [],
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header with Logo */}
      <DashboardHeader
        title="CSDL GIẢNG VIÊN - HỌC VIÊN"
        subtitle="Quản lý và theo dõi thông tin giảng viên, học viên toàn học viện"
        badge="GV-HV"
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Tổng Giảng viên</p>
                <p className="text-3xl font-bold">{data?.faculty.total || 0}</p>
              </div>
              <Users className="h-12 w-12 text-blue-100" />
            </div>
            <Link href="/dashboard/faculty/list" className="text-blue-100 text-sm hover:underline mt-2 block">
              Xem danh sách →
            </Link>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Tổng Học viên</p>
                <p className="text-3xl font-bold">{data?.students.total || 0}</p>
              </div>
              <GraduationCap className="h-12 w-12 text-green-100" />
            </div>
            <Link href="/dashboard/student/list" className="text-green-100 text-sm hover:underline mt-2 block">
              Xem danh sách →
            </Link>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-violet-600 text-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Điểm TB Chung</p>
                <p className="text-3xl font-bold">{(data?.teaching.avgGrade || 0).toFixed(2)}</p>
              </div>
              <TrendingUp className="h-12 w-12 text-purple-200" />
            </div>
            <span className="text-purple-100 text-sm mt-2 block">
              Từ {data?.teaching.totalResults || 0} kết quả
            </span>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500 to-orange-600 text-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-100 text-sm">Đề tài NCKH</p>
                <p className="text-3xl font-bold">{data?.research.totalProjects || 0}</p>
              </div>
              <FlaskConical className="h-12 w-12 text-amber-100" />
            </div>
            <span className="text-amber-100 text-sm mt-2 block">
              {data?.research.totalPublications || 0} bài báo
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Faculty by Degree */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-blue-500" />
              Giảng viên theo Học vị
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data?.faculty.byDegree || []}
                  dataKey="count"
                  nameKey="degree"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                >
                  {(data?.faculty.byDegree || []).map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Students by Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-green-500" />
              Học viên theo Trạng thái
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data?.students.byStatus || []}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                >
                  {(data?.students.byStatus || []).map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Bar Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Faculty by Rank */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-purple-500" />
              Giảng viên theo Học hàm
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data?.faculty.byRank || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="rank" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#8884d8" name="Số lượng" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Students by Class */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-cyan-500" />
              Học viên theo Lớp (Top 10)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data?.students.byClass || []} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="class" type="category" width={100} />
                <Tooltip />
                <Bar dataKey="count" fill="#00C49F" name="Số lượng" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Quick Access Links */}
      <Card>
        <CardHeader>
          <CardTitle>Truy cập nhanh</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link
              href="/dashboard/faculty/list"
              className="flex flex-col items-center p-4 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors"
            >
              <Users className="h-8 w-8 text-blue-600 mb-2" />
              <span className="text-sm font-medium text-center">Danh sách Giảng viên</span>
            </Link>
            <Link
              href="/dashboard/faculty/profile"
              className="flex flex-col items-center p-4 rounded-lg bg-orange-50 hover:bg-orange-100 transition-colors"
            >
              <Award className="h-8 w-8 text-orange-600 mb-2" />
              <span className="text-sm font-medium text-center">Hồ sơ Giảng viên</span>
            </Link>
            <Link
              href="/dashboard/faculty/student-guidance"
              className="flex flex-col items-center p-4 rounded-lg bg-rose-50 hover:bg-rose-100 transition-colors"
            >
              <Users className="h-8 w-8 text-rose-600 mb-2" />
              <span className="text-sm font-medium text-center">Hướng dẫn HV</span>
            </Link>
            <Link
              href="/dashboard/faculty/teaching-stats"
              className="flex flex-col items-center p-4 rounded-lg bg-purple-50 hover:bg-purple-100 transition-colors"
            >
              <BarChart3 className="h-8 w-8 text-purple-600 mb-2" />
              <span className="text-sm font-medium text-center">Thống kê GD</span>
            </Link>
            <Link
              href="/dashboard/student/list"
              className="flex flex-col items-center p-4 rounded-lg bg-green-50 hover:bg-green-100 transition-colors"
            >
              <GraduationCap className="h-8 w-8 text-green-600 mb-2" />
              <span className="text-sm font-medium text-center">Danh sách HV</span>
            </Link>
            <Link
              href="/dashboard/student/stats"
              className="flex flex-col items-center p-4 rounded-lg bg-cyan-50 hover:bg-cyan-100 transition-colors"
            >
              <TrendingUp className="h-8 w-8 text-cyan-600 mb-2" />
              <span className="text-sm font-medium text-center">Thống kê HV</span>
            </Link>
            <Link
              href="/dashboard/research/overview"
              className="flex flex-col items-center p-4 rounded-lg bg-teal-50 hover:bg-teal-100 transition-colors"
            >
              <FlaskConical className="h-8 w-8 text-teal-600 mb-2" />
              <span className="text-sm font-medium text-center">NCKH</span>
            </Link>
            <Link
              href="/dashboard/education/overview"
              className="flex flex-col items-center p-4 rounded-lg bg-indigo-50 hover:bg-indigo-100 transition-colors"
            >
              <BookOpen className="h-8 w-8 text-indigo-600 mb-2" />
              <span className="text-sm font-medium text-center">Giáo dục ĐT</span>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
