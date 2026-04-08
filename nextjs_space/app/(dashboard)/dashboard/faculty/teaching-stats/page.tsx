'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/components/providers/language-provider';
import {
  Users,
  GraduationCap,
  BookOpen,
  TrendingUp,
  Award,
  BarChart3,
  Building2,
  Clock
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function TeachingStatsPage() {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'academy' | 'unit' | 'personal'>('academy');
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetchStats();
  }, [viewMode]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/faculty/teaching-stats?mode=${viewMode}`);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error:', error);
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-fuchsia-600 bg-clip-text text-transparent">
            Thống kê Giảng dạy
          </h1>
          <p className="text-muted-foreground mt-1">
            Thống kê hoạt động giảng dạy toàn học viện
          </p>
        </div>
        <Select value={viewMode} onValueChange={(v: any) => setViewMode(v)}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Chế độ xem" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="academy">Toàn Học viện</SelectItem>
            <SelectItem value="unit">Theo Đơn vị</SelectItem>
            <SelectItem value="personal">Cá nhân</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Tổng Giảng viên</p>
                <p className="text-3xl font-bold">{stats?.totalFaculty || 0}</p>
              </div>
              <Users className="h-12 w-12 text-blue-100" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Tổng Môn giảng dạy</p>
                <p className="text-3xl font-bold">{stats?.totalSubjects || 0}</p>
              </div>
              <BookOpen className="h-12 w-12 text-green-100" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-violet-600 text-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Tổng số tiết</p>
                <p className="text-3xl font-bold">{stats?.totalHours || 0}</p>
              </div>
              <Clock className="h-12 w-12 text-purple-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500 to-orange-600 text-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-100 text-sm">Điểm TB Kết quả</p>
                <p className="text-3xl font-bold">{(stats?.avgGrade || 0).toFixed(2)}</p>
              </div>
              <TrendingUp className="h-12 w-12 text-amber-100" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Tổng quan</TabsTrigger>
          <TabsTrigger value="by-unit">Theo Đơn vị</TabsTrigger>
          <TabsTrigger value="by-subject">Theo Môn học</TabsTrigger>
          <TabsTrigger value="top-faculty">Top Giảng viên</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Teaching Hours by Month */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-blue-500" />
                  Số tiết giảng dạy theo tháng
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={stats?.hoursByMonth || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="hours" fill="#8884d8" name="Số tiết" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Grade Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-green-500" />
                  Phân bố Điểm số
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={stats?.gradeDistribution || []}
                      dataKey="count"
                      nameKey="range"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label
                    >
                      {(stats?.gradeDistribution || []).map((_: any, index: number) => (
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
        </TabsContent>

        <TabsContent value="by-unit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-indigo-500" />
                Thống kê theo Đơn vị
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={stats?.byUnit || []} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="unitName" type="category" width={150} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="facultyCount" fill="#8884d8" name="GV" />
                  <Bar dataKey="subjectCount" fill="#82ca9d" name="Môn học" />
                  <Bar dataKey="hours" fill="#ffc658" name="Số tiết" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="by-subject" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-cyan-500" />
                Thống kê theo Môn học
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(stats?.bySubject || []).slice(0, 15).map((subject: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div>
                      <p className="font-medium">{subject.name}</p>
                      <p className="text-sm text-muted-foreground">{subject.code}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge variant="outline">{subject.facultyCount} GV</Badge>
                      <Badge variant="secondary">{subject.hours} tiết</Badge>
                      <Badge className="bg-green-100 text-green-700">
                        {(subject.avgGrade || 0).toFixed(2)} điểm
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="top-faculty" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-amber-500" />
                Top Giảng viên Xuất sắc
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(stats?.topFaculty || []).map((faculty: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-semibold">{faculty.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {faculty.academicDegree} | {faculty.unit}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Số tiết</p>
                        <p className="font-semibold">{faculty.totalHours}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Điểm TB</p>
                        <p className="font-semibold text-green-600">{(faculty.avgGrade || 0).toFixed(2)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">HV hướng dẫn</p>
                        <p className="font-semibold">{faculty.studentCount}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
