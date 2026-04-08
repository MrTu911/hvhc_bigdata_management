'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import {
  Users,
  GraduationCap,
  TrendingUp,
  Award,
  BookOpen,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface Stats {
  totalStudents: number;
  studentsByStatus: Array<{ trangThai: string; _count: number }>;
  studentsByKhoaHoc: Array<{ khoaHoc: string; _count: number }>;
  studentsByNganh: Array<{ nganh: string; _count: number }>;
  avgGPA: string;
  gpaDistribution: {
    xuatSac: number;
    gioi: number;
    kha: number;
    trungBinh: number;
    yeu: number;
  };
  topStudents: Array<{
    id: string;
    hoTen: string;
    maHocVien: string;
    lop?: string;
    diemTrungBinh: number;
    giangVienHuongDan?: {
      user: {
        name: string;
      };
    };
  }>;
  passFailStats: {
    total: number;
    passed: number;
    failed: number;
    passRate: string;
  };
}

export default function StudentStatsPage() {
  const { toast } = useToast();
  const { data: session } = useSession() || {};

  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/student/stats');
      const data = await res.json();

      if (res.ok) {
        setStats(data);
      } else {
        toast({
          title: 'Lỗi',
          description: data.error || 'Không thể tải thống kê',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể kết nối đến server',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">Đang tải thống kê...</div>
      </div>
    );
  }

  // Prepare chart data
  const gpaData = [
    { name: 'Xuất sắc (≥9)', value: stats.gpaDistribution.xuatSac, color: '#10b981' },
    { name: 'Giỏi (8-9)', value: stats.gpaDistribution.gioi, color: '#3b82f6' },
    { name: 'Khá (7-8)', value: stats.gpaDistribution.kha, color: '#eab308' },
    { name: 'Trung bình (5-7)', value: stats.gpaDistribution.trungBinh, color: '#f97316' },
    { name: 'Yếu (<5)', value: stats.gpaDistribution.yeu, color: '#ef4444' },
  ];

  const khoaHocData = stats.studentsByKhoaHoc.map((item) => ({
    name: item.khoaHoc || 'Chưa có',
    value: item._count,
  }));

  const statusData = stats.studentsByStatus.map((item) => ({
    name: item.trangThai,
    value: item._count,
  }));

  const passFailData = [
    { name: 'Đạt', value: stats.passFailStats.passed, color: '#10b981' },
    { name: 'Không đạt', value: stats.passFailStats.failed, color: '#ef4444' },
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Thống kê Học viên</h1>
        <p className="text-muted-foreground mt-1">
          Tổng quan về học viên và kết quả học tập
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              Tổng học viên
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStudents}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Điểm TB
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.avgGPA}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Tỷ lệ đạt
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.passFailStats.passRate}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Tổng môn học
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.passFailStats.total}</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* GPA Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Phân bố học lực</CardTitle>
            <CardDescription>Theo điểm trung bình tích lũy</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={gpaData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {gpaData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Pass/Fail */}
        <Card>
          <CardHeader>
            <CardTitle>Kết quả học tập</CardTitle>
            <CardDescription>Tỷ lệ đạt/không đạt</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={passFailData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {passFailData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Students by Khoa Hoc */}
      <Card>
        <CardHeader>
          <CardTitle>Phân bố theo khóa học</CardTitle>
          <CardDescription>Số lượng học viên mỗi khóa</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={khoaHocData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Top Students */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Top 10 học viên xuất sắc
          </CardTitle>
          <CardDescription>Xếp hạng theo điểm trung bình</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stats.topStudents.map((student, index) => (
              <div
                key={student.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-semibold">{student.hoTen}</div>
                    <div className="text-sm text-muted-foreground">
                      {student.maHocVien} - {student.lop || 'Chưa có lớp'}
                    </div>
                    {student.giangVienHuongDan && (
                      <div className="text-xs text-muted-foreground">
                        GVHD: {student.giangVienHuongDan.user.name}
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-600">
                    {student.diemTrungBinh.toFixed(2)}
                  </div>
                  <div className="text-xs text-muted-foreground">Điểm TB</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Students by Nganh */}
      {stats.studentsByNganh.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Phân bố theo ngành</CardTitle>
            <CardDescription>Top 10 ngành nhiều học viên nhất</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={stats.studentsByNganh.map((item) => ({
                  name: item.nganh || 'Chưa có',
                  value: item._count,
                }))}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
