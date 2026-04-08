/**
 * TRANG TỔNG QUAN CSDL ĐÀO TẠO
 * Dashboard chính cho module đào tạo
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BookOpen, GraduationCap, Users, CalendarDays, Building2, Clock, 
  TrendingUp, BarChart3, PieChart, FileText, ChevronRight, RefreshCw,
  Layers, BookMarked, CalendarCheck, School
} from 'lucide-react';
import { PieChart as RechartsPie, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Link from 'next/link';
import { useLanguage } from '@/components/providers/language-provider';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function EducationDashboard() {
  const { t } = useLanguage();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTerm, setSelectedTerm] = useState<string>('');
  const [terms, setTerms] = useState<any[]>([]);

  const fetchStats = async (termId?: string) => {
    try {
      setLoading(true);
      const url = termId ? `/api/education/stats?termId=${termId}` : '/api/education/stats';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
        if (data.currentTerm && !selectedTerm) {
          setSelectedTerm(data.currentTerm.id);
        }
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTerms = async () => {
    try {
      const res = await fetch('/api/education/terms');
      if (res.ok) {
        const data = await res.json();
        setTerms(data);
      }
    } catch (error) {
      console.error('Failed to fetch terms:', error);
    }
  };

  useEffect(() => {
    fetchTerms();
    fetchStats();
  }, []);

  useEffect(() => {
    if (selectedTerm) {
      fetchStats(selectedTerm);
    }
  }, [selectedTerm]);

  const quickLinks = [
    { href: '/dashboard/education/programs', icon: BookOpen, label: 'Chương trình đào tạo', count: stats?.overview?.programs || 0 },
    { href: '/dashboard/education/curriculum', icon: Layers, label: 'Khung CTĐT', count: stats?.overview?.curriculumPlans || 0 },
    { href: '/dashboard/education/schedule', icon: CalendarDays, label: 'Lịch huấn luyện', count: stats?.overview?.classSections || 0 },
    { href: '/dashboard/education/rooms', icon: Building2, label: 'Phòng học', count: stats?.roomUtilization?.total || 0 },
    { href: '/dashboard/student', icon: GraduationCap, label: 'Học viên', count: stats?.overview?.students || 0 },
    { href: '/dashboard/faculty', icon: Users, label: 'Giảng viên', count: stats?.overview?.faculty || 0 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">CSDL Đào tạo</h1>
          <p className="text-muted-foreground">Tổng quan chương trình, khung đào tạo và lịch huấn luyện</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedTerm} onValueChange={setSelectedTerm}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Chọn học kỳ" />
            </SelectTrigger>
            <SelectContent>
              {terms.map((term) => (
                <SelectItem key={term.id} value={term.id}>
                  {term.name} {term.isCurrent && '(Đang diễn ra)'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={() => fetchStats(selectedTerm)}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Current Term Info */}
      {stats?.currentTerm && (
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg">{stats.currentTerm.name}</h3>
                <p className="text-blue-100">
                  {stats.currentYear?.name || 'Năm học hiện tại'}
                </p>
              </div>
              <Badge variant="secondary" className="bg-white text-blue-600">
                <Clock className="h-3 w-3 mr-1" />
                Đang diễn ra
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chương trình đào tạo</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.overview?.programs || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.overview?.curriculumPlans || 0} khung CTĐT
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Môn học / Học phần</CardTitle>
            <BookMarked className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.overview?.courses || 0}</div>
            <p className="text-xs text-muted-foreground">
              Tổng {stats?.overview?.totalCredits || 0} tín chỉ
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lớp học phần</CardTitle>
            <School className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.overview?.classSections || 0}</div>
            <p className="text-xs text-muted-foreground">
              Học kỳ hiện tại
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sử dụng phòng học</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.roomUtilization?.utilizationRate || 0}%</div>
            <p className="text-xs text-muted-foreground">
              {stats?.roomUtilization?.inUse || 0}/{stats?.roomUtilization?.total || 0} phòng
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Activity Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CalendarCheck className="h-4 w-4 text-green-500" />
              Buổi học đã hoàn thành
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{stats?.activities?.completedSessions || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-500" />
              Buổi học sắp tới
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{stats?.activities?.upcomingSessions || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4 text-purple-500" />
              Ghi danh mới (7 ngày)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">{stats?.activities?.recentEnrollments || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Chương trình theo loại hình</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPie>
                  <Pie
                    data={stats?.charts?.programsByType || []}
                    dataKey="count"
                    nameKey="type"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ name, percent }: any) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {(stats?.charts?.programsByType || []).map((_: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </RechartsPie>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Phân bố môn học theo học kỳ</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats?.charts?.coursesBySemester || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="semester" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8884d8" name="Số môn" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Links */}
      <Card>
        <CardHeader>
          <CardTitle>Truy cập nhanh</CardTitle>
          <CardDescription>Các chức năng chính của module đào tạo</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {quickLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                <Card className="hover:bg-accent cursor-pointer transition-colors">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <link.icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{link.label}</p>
                        <p className="text-sm text-muted-foreground">{link.count} bản ghi</p>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
