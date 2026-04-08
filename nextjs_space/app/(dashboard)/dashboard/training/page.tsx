/**
 * Dashboard Đào tạo - Kết nối dữ liệu thực
 * D1.2: Phòng Đào tạo
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/components/providers/language-provider';
import {
  BookOpen,
  GraduationCap,
  Target,
  Trophy,
  Users,
  TrendingUp,
  BarChart3,
  Award,
  RefreshCw,
  FileText,
  CheckCircle
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';

interface TrainingData {
  overview: {
    totalCourses: number;
    activeCourses: number;
    totalRegistrations: number;
    totalStudents: number;
    activeStudents: number;
    avgGrade: string | number;
    totalGraded: number;
    passRate: string | number;
    excellenceRate: string | number;
  };
  gradeDistribution: {
    excellent: number;
    good: number;
    average: number;
    weak: number;
  };
  topCourses: Array<{
    id: string;
    code: string;
    name: string;
    credits: number;
    currentStudents: number;
    maxStudents: number;
    semester: string;
    year: number;
  }>;
  coursesBySemester: Array<{
    semester: string;
    year: number;
    count: number;
  }>;
  topStudents: Array<{
    id: string;
    maHocVien: string;
    hoTen: string;
    lop: string;
    khoa: string;
    gpa: number;
    totalSubjects: number;
  }>;
}

const GRADE_COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444'];

export default function TrainingDashboardPage() {
  const { t } = useLanguage();
  const [data, setData] = useState<TrainingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/dashboard/training');
      const result = await res.json();
      if (result.success) {
        setData(result.data);
      } else {
        setError(result.error || 'Lỗi tải dữ liệu');
      }
    } catch (err) {
      setError('Không thể kết nối server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const gradeChartData = data ? [
    { name: 'Xuất sắc (≥8.5)', value: data.gradeDistribution.excellent, color: '#22c55e' },
    { name: 'Giỏi (7-8.4)', value: data.gradeDistribution.good, color: '#3b82f6' },
    { name: 'Khá (5-6.9)', value: data.gradeDistribution.average, color: '#f59e0b' },
    { name: 'Yếu (<5)', value: data.gradeDistribution.weak, color: '#ef4444' }
  ] : [];

  const semesterChartData = data?.coursesBySemester.map(c => ({
    name: `${c.semester} ${c.year}`,
    courses: c.count
  })) || [];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-red-500 mb-4">{error}</p>
        <Button onClick={fetchData}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Thử lại
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <GraduationCap className="h-8 w-8 text-blue-600" />
            Dashboard Đào tạo
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Thống kê và quản lý hoạt động đào tạo toàn viện
          </p>
        </div>
        <Button variant="outline" onClick={fetchData}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Làm mới
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300 flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Môn học
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-800 dark:text-blue-100">
              {data?.overview.totalCourses || 0}
            </div>
            <p className="text-sm text-blue-600 dark:text-blue-400">
              {data?.overview.activeCourses || 0} đang hoạt động
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Học viên
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-800 dark:text-green-100">
              {data?.overview.totalStudents || 0}
            </div>
            <p className="text-sm text-green-600 dark:text-green-400">
              {data?.overview.activeStudents || 0} đang học
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300 flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              Điểm TB
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-800 dark:text-purple-200">
              {data?.overview.avgGrade || 0}
            </div>
            <p className="text-sm text-purple-600 dark:text-purple-400">
              {data?.overview.totalGraded || 0} kết quả học tập
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-orange-700 dark:text-orange-300 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Tỷ lệ đạt
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-800 dark:text-orange-200">
              {data?.overview.passRate || 0}%
            </div>
            <p className="text-sm text-orange-600 dark:text-orange-400">
              Xuất sắc: {data?.overview.excellenceRate || 0}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="overview">Tổng quan</TabsTrigger>
          <TabsTrigger value="courses">Môn học</TabsTrigger>
          <TabsTrigger value="students">Học viên</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Grade Distribution Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Phân bố học lực
                </CardTitle>
                <CardDescription>Phân loại kết quả học tập theo điểm số</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={gradeChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                    >
                      {gradeChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Courses by Semester Bar Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Môn học theo học kỳ
                </CardTitle>
                <CardDescription>Số lượng môn học mở trong từng học kỳ</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={semesterChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="courses" fill="#3b82f6" name="Số môn học" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Courses Tab */}
        <TabsContent value="courses" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Top môn học theo số đăng ký
              </CardTitle>
              <CardDescription>Danh sách môn học có nhiều học viên đăng ký nhất</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data?.topCourses.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">Chưa có dữ liệu môn học</p>
                ) : (
                  data?.topCourses.map((course, index) => (
                    <div key={course.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 dark:hover:bg-gray-800 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{course.name}</p>
                          <p className="text-sm text-gray-500">
                            Mã: {course.code} • {course.credits} tín chỉ • {course.semester} {course.year}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">{course.currentStudents}/{course.maxStudents}</p>
                        <Progress 
                          value={(course.currentStudents / course.maxStudents) * 100} 
                          className="w-24 h-2"
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Students Tab */}
        <TabsContent value="students" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Top học viên xuất sắc
              </CardTitle>
              <CardDescription>Học viên có GPA cao nhất</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data?.topStudents.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">Chưa có dữ liệu học viên</p>
                ) : (
                  data?.topStudents.map((student, index) => (
                    <div key={student.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 dark:hover:bg-gray-800 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                          index < 3 ? 'bg-yellow-100 text-yellow-600' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{student.hoTen}</p>
                          <p className="text-sm text-gray-500">
                            {student.maHocVien} • Lớp: {student.lop || 'N/A'} • Khoa: {student.khoa || 'N/A'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={`${
                          student.gpa >= 8.5 ? 'bg-green-500' :
                          student.gpa >= 7 ? 'bg-blue-500' :
                          student.gpa >= 5 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}>
                          GPA: {student.gpa}
                        </Badge>
                        <p className="text-xs text-gray-500 mt-1">{student.totalSubjects} môn</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
