'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/components/providers/language-provider';
import { BookOpen, GraduationCap, Users, FileText, Calendar, Building2, Award, TrendingUp, Clock, CheckCircle } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, LineChart, Line, CartesianGrid } from 'recharts';
import Link from 'next/link';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

const PROGRAM_TYPE_LABELS: Record<string, string> = {
  UNDERGRADUATE: 'Đại học',
  GRADUATE: 'Sau đại học',
  POSTGRADUATE: 'Cao học',
  DOCTORAL: 'Nghiên cứu sinh',
  PROFESSIONAL: 'Bồi dưỡng',
  SHORT_COURSE: 'Ngắn hạn',
};

const STATUS_LABELS: Record<string, string> = {
  OPEN: 'Đang mở',
  CLOSED: 'Đã đóng',
  COMPLETED: 'Hoàn thành',
  SCHEDULED: 'Dự kiến',
  IN_PROGRESS: 'Đang tiến hành',
  ENROLLED: 'Đã ghi danh',
  CANCELLED: 'Đã hủy',
};

export default function EducationDatabaseOverviewPage() {
  const { t } = useLanguage();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/education/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get data from API response
  const overview = stats?.overview || {};
  const charts = stats?.charts || {};
  const roomUtil = stats?.roomUtilization || {};
  const activities = stats?.activities || {};

  const kpiCards = [
    {
      title: 'Chương trình đào tạo',
      value: overview.programs || 0,
      icon: BookOpen,
      color: 'bg-blue-500',
      href: '/dashboard/education/programs',
    },
    {
      title: 'Môn học (Khung CT)',
      value: overview.courses || 0,
      icon: FileText,
      color: 'bg-green-500',
      href: '/dashboard/education/curriculum',
    },
    {
      title: 'Học viên',
      value: overview.students || 0,
      icon: GraduationCap,
      color: 'bg-purple-500',
      href: '/dashboard/student/list',
    },
    {
      title: 'Giảng viên',
      value: overview.faculty || 0,
      icon: Users,
      color: 'bg-amber-500',
      href: '/dashboard/faculty/list',
    },
    {
      title: 'Phòng học',
      value: roomUtil.total || 0,
      icon: Building2,
      color: 'bg-rose-500',
      href: '/dashboard/education/rooms',
    },
    {
      title: 'Lớp học phần',
      value: overview.classSections || 0,
      icon: Calendar,
      color: 'bg-cyan-500',
      href: '/dashboard/education/schedule',
    },
    {
      title: 'Tổng tín chỉ',
      value: overview.totalCredits || 0,
      icon: Award,
      color: 'bg-indigo-500',
      href: '/dashboard/education/curriculum',
    },
    {
      title: 'Tỷ lệ sử dụng phòng',
      value: `${roomUtil.utilizationRate || 0}%`,
      icon: TrendingUp,
      color: 'bg-emerald-500',
      href: '/dashboard/education/rooms',
    },
  ];

  // Transform API data for charts
  const programsByType = (charts.programsByType || []).map((p: any) => ({
    name: PROGRAM_TYPE_LABELS[p.type] || p.type || 'Khác',
    value: p.count,
  }));

  const coursesBySemester = (charts.coursesBySemester || []).map((c: any) => ({
    semester: c.semester,
    count: c.count,
  }));

  const enrollmentStats = (charts.enrollmentStats || []).map((e: any) => ({
    name: STATUS_LABELS[e.status] || e.status || 'Khác',
    value: e.count,
  }));

  const sessionStats = (charts.sessionStats || []).map((s: any) => ({
    status: STATUS_LABELS[s.status] || s.status || 'Khác',
    count: s.count,
  }));

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Tổng quan CSDL Giáo dục - Đào tạo</h1>
        <p className="text-muted-foreground mt-2">
          Tổng hợp dữ liệu giáo dục, đào tạo của Học viện Hậu cần
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpiCards.map((card, index) => (
          <Link key={index} href={card.href}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{card.title}</p>
                    <p className="text-2xl font-bold mt-1">{card.value}</p>
                  </div>
                  <div className={`p-3 rounded-full ${card.color}`}>
                    <card.icon className="h-5 w-5 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Program Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Phân bố chương trình đào tạo</CardTitle>
            <CardDescription>Theo loại hình đào tạo</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {programsByType.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={programsByType}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {programsByType.map((_: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Chưa có dữ liệu chương trình
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Course by Semester */}
        <Card>
          <CardHeader>
            <CardTitle>Môn học theo học kỳ</CardTitle>
            <CardDescription>Phân bố môn học trong khung chương trình</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {coursesBySemester.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={coursesBySemester}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="semester" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" name="Số môn" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Chưa có dữ liệu môn học
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Second Charts Row */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Enrollment Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Trạng thái ghi danh</CardTitle>
            <CardDescription>Thống kê ghi danh lớp học phần</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {enrollmentStats.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={enrollmentStats}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {enrollmentStats.map((_: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Chưa có dữ liệu ghi danh
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Session Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Trạng thái buổi học</CardTitle>
            <CardDescription>Thống kê buổi học trong học kỳ</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {sessionStats.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sessionStats} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="status" type="category" width={100} />
                    <Tooltip />
                    <Bar dataKey="count" name="Số buổi" fill="#10b981" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Chưa có dữ liệu buổi học
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activities Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Hoạt động gần đây</CardTitle>
          <CardDescription>Thống kê hoạt động 7 ngày qua</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-3xl font-bold text-blue-600">{activities.recentEnrollments || 0}</div>
              <div className="text-sm text-muted-foreground mt-1">Ghi danh mới</div>
            </div>
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="text-3xl font-bold text-green-600">{activities.completedSessions || 0}</div>
              <div className="text-sm text-muted-foreground mt-1">Buổi hoàn thành</div>
            </div>
            <div className="text-center p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
              <div className="text-3xl font-bold text-amber-600">{activities.upcomingSessions || 0}</div>
              <div className="text-sm text-muted-foreground mt-1">Buổi sắp tới</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Links */}
      <Card>
        <CardHeader>
          <CardTitle>Truy cập nhanh</CardTitle>
          <CardDescription>Các chức năng thường dùng</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/dashboard/education/programs" className="p-4 border rounded-lg hover:bg-accent transition-colors text-center">
              <BookOpen className="h-8 w-8 mx-auto mb-2 text-blue-500" />
              <p className="font-medium">Chương trình ĐT</p>
            </Link>
            <Link href="/dashboard/education/subjects" className="p-4 border rounded-lg hover:bg-accent transition-colors text-center">
              <FileText className="h-8 w-8 mx-auto mb-2 text-green-500" />
              <p className="font-medium">Quản lý môn học</p>
            </Link>
            <Link href="/dashboard/education/schedule" className="p-4 border rounded-lg hover:bg-accent transition-colors text-center">
              <Calendar className="h-8 w-8 mx-auto mb-2 text-amber-500" />
              <p className="font-medium">Lịch huấn luyện</p>
            </Link>
            <Link href="/dashboard/education/rooms" className="p-4 border rounded-lg hover:bg-accent transition-colors text-center">
              <Building2 className="h-8 w-8 mx-auto mb-2 text-purple-500" />
              <p className="font-medium">Phòng học</p>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
