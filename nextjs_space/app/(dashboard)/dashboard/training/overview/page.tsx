/**
 * Dashboard Đào tạo - Phòng Đào tạo
 * Thống kê học viên, kết quả học tập, môn học
 */
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
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
} from 'recharts';
import { GraduationCap, Users, BookOpen, TrendingUp, Award } from 'lucide-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

interface DashboardData {
  year: string;
  semester?: string;
  summary: {
    totalStudents: number;
    totalResults: number;
    avgScore: number;
  };
  studentsByStatus: { status: string; label: string; count: number }[];
  studentsByDepartment: { departmentId: string; departmentName: string; count: number }[];
  gradeDistribution: { grade: string; label: string; count: number }[];
  topCourses: { courseCode: string; avgScore: number; count: number }[];
  recentResults: {
    id: string;
    studentName: string;
    studentCode: string;
    courseCode: string;
    courseName: string;
    finalScore: number | null;
    grade: string;
    updatedAt: string;
  }[];
}

export default function TrainingDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [semester, setSemester] = useState<string>('');

  useEffect(() => {
    fetchData();
  }, [year, semester]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ year });
      if (semester) params.append('semester', semester);
      
      const res = await fetch(`/api/dashboard/training?${params}`);
      if (res.ok) {
        const result = await res.json();
        setData(result);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const years = Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() - i).toString());

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard Đào tạo</h1>
          <p className="text-muted-foreground">Thống kê học viên và kết quả học tập</p>
        </div>
        <div className="flex gap-2">
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Năm" />
            </SelectTrigger>
            <SelectContent>
              {years.map((y) => (
                <SelectItem key={y} value={y}>Năm {y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={semester} onValueChange={setSemester}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Học kỳ" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="1">Học kỳ 1</SelectItem>
              <SelectItem value="2">Học kỳ 2</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Tổng học viên</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.summary.totalStudents.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Kết quả học tập</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.summary.totalResults.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Điểm TB chung</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.summary.avgScore || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Xếp loại Giỏi trở lên</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data?.gradeDistribution
                ?.filter((g) => ['XUAT_SAC', 'GIOI'].includes(g.grade))
                .reduce((sum, g) => sum + g.count, 0)
                .toLocaleString() || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="status" className="space-y-4">
        <TabsList>
          <TabsTrigger value="status">Trạng thái</TabsTrigger>
          <TabsTrigger value="grade">Xếp loại</TabsTrigger>
          <TabsTrigger value="department">Theo khoa</TabsTrigger>
          <TabsTrigger value="courses">Môn học</TabsTrigger>
        </TabsList>

        <TabsContent value="status" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Học viên theo trạng thái</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={data?.studentsByStatus || []}
                      dataKey="count"
                      nameKey="label"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={({ name, value }: any) => `${name}: ${value}`}
                    >
                      {data?.studentsByStatus?.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Danh sách trạng thái</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data?.studentsByStatus?.map((s, i) => (
                    <div key={s.status} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <span>{s.label}</span>
                      </div>
                      <Badge variant="secondary">{s.count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="grade" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Phân bố xếp loại học lực</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data?.gradeDistribution || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8884d8" name="Số lượng" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="department" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Học viên theo khoa</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data?.studentsByDepartment || []} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="departmentName" type="category" width={150} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#00C49F" name="Số học viên" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="courses" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top môn học theo điểm TB</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data?.topCourses || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="courseCode" />
                  <YAxis domain={[0, 10]} />
                  <Tooltip />
                  <Bar dataKey="avgScore" fill="#FFBB28" name="Điểm TB" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Recent Results */}
      <Card>
        <CardHeader>
          <CardTitle>Kết quả học tập gần đây</CardTitle>
          <CardDescription>10 kết quả cập nhật mới nhất</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase bg-muted">
                <tr>
                  <th className="px-4 py-3">Học viên</th>
                  <th className="px-4 py-3">Mã HV</th>
                  <th className="px-4 py-3">Môn học</th>
                  <th className="px-4 py-3">Điểm TK</th>
                  <th className="px-4 py-3">Xếp loại</th>
                </tr>
              </thead>
              <tbody>
                {data?.recentResults?.map((r) => (
                  <tr key={r.id} className="border-b">
                    <td className="px-4 py-3 font-medium">{r.studentName}</td>
                    <td className="px-4 py-3">{r.studentCode}</td>
                    <td className="px-4 py-3">{r.courseName || r.courseCode}</td>
                    <td className="px-4 py-3">{r.finalScore?.toFixed(1) || '-'}</td>
                    <td className="px-4 py-3">
                      <Badge variant={r.grade === 'XUAT_SAC' || r.grade === 'GIOI' ? 'default' : 'secondary'}>
                        {r.grade || 'Chưa xếp loại'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
