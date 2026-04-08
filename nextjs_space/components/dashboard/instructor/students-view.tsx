
'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  BookOpen, 
  TrendingUp, 
  AlertTriangle,
  Search,
  Download
} from 'lucide-react';
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
  ResponsiveContainer
} from 'recharts';

interface Stats {
  totalStudents: number;
  totalClasses: number;
  avgAttendance: number;
  pendingGrades: number;
}

interface Student {
  id: string;
  name: string;
  email: string;
  class: string;
  grade: number;
  attendance: number;
  assignments: {
    completed: number;
    total: number;
  };
  performance: 'excellent' | 'good' | 'average' | 'poor';
  alert: {
    level: 'none' | 'low' | 'medium' | 'high';
    message: string;
  };
  lastActive: string;
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'];

export function InstructorStudentsView() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [performanceFilter, setPerformanceFilter] = useState('all');

  useEffect(() => {
    fetchDashboardData();
  }, [performanceFilter]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, studentsRes] = await Promise.all([
        fetch('/api/dashboard/instructor/stats'),
        fetch(`/api/dashboard/instructor/students?performance=${performanceFilter}`)
      ]);

      const statsData = await statsRes.json();
      const studentsData = await studentsRes.json();

      setStats(statsData);
      setStudents(studentsData.students || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.class.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const performanceData = [
    { name: 'Xuất sắc', value: students.filter(s => s.performance === 'excellent').length },
    { name: 'Khá', value: students.filter(s => s.performance === 'good').length },
    { name: 'Trung bình', value: students.filter(s => s.performance === 'average').length },
    { name: 'Yếu', value: students.filter(s => s.performance === 'poor').length },
  ];

  const alertStudents = students.filter(s => s.alert.level !== 'none');
  const criticalAlerts = students.filter(s => s.alert.level === 'high').length;

  const classPerformance = ['K65', 'K66', 'K67'].map(className => {
    const classStudents = students.filter(s => s.class === className);
    const avgGrade = classStudents.reduce((sum, s) => sum + s.grade, 0) / classStudents.length || 0;
    const avgAttendance = classStudents.reduce((sum, s) => sum + s.attendance, 0) / classStudents.length || 0;
    
    return {
      class: className,
      grade: parseFloat(avgGrade.toFixed(1)),
      attendance: parseFloat(avgAttendance.toFixed(1))
    };
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Tổng số học viên</p>
              <h3 className="text-2xl font-bold mt-2">{stats?.totalStudents || 0}</h3>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Users className="w-6 h-6 text-blue-600 dark:text-blue-300" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Số lớp giảng dạy</p>
              <h3 className="text-2xl font-bold mt-2">{stats?.totalClasses || 0}</h3>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
              <BookOpen className="w-6 h-6 text-green-600 dark:text-green-300" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Điểm danh TB</p>
              <h3 className="text-2xl font-bold mt-2">{stats?.avgAttendance.toFixed(1) || 0}%</h3>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-300" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Cảnh báo</p>
              <h3 className="text-2xl font-bold mt-2">{alertStudents.length}</h3>
              {criticalAlerts > 0 && (
                <p className="text-xs text-red-600 mt-1">{criticalAlerts} nghiêm trọng</p>
              )}
            </div>
            <div className="p-3 bg-red-100 dark:bg-red-900 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-300" />
            </div>
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Phân bố kết quả học tập</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={performanceData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }: any) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {performanceData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Hiệu suất theo lớp</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={classPerformance}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="class" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="grade" name="Điểm TB" fill="#3b82f6" />
              <Bar dataKey="attendance" name="Điểm danh %" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Students Table */}
      <Card className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold">Danh sách học viên</h3>
          <div className="flex gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Tìm kiếm học viên..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            <select
              value={performanceFilter}
              onChange={(e) => setPerformanceFilter(e.target.value)}
              className="px-4 py-2 border rounded-md bg-background"
            >
              <option value="all">Tất cả</option>
              <option value="excellent">Xuất sắc</option>
              <option value="good">Khá</option>
              <option value="average">Trung bình</option>
              <option value="poor">Yếu</option>
            </select>
            <Button className="gap-2">
              <Download className="w-4 h-4" />
              Xuất
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4">Họ tên</th>
                <th className="text-left py-3 px-4">Lớp</th>
                <th className="text-center py-3 px-4">Điểm TB</th>
                <th className="text-center py-3 px-4">Điểm danh</th>
                <th className="text-center py-3 px-4">Bài tập</th>
                <th className="text-center py-3 px-4">Xếp loại</th>
                <th className="text-center py-3 px-4">Cảnh báo</th>
                <th className="text-center py-3 px-4">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student) => (
                <tr key={student.id} className="border-b hover:bg-muted/50">
                  <td className="py-3 px-4">
                    <div>
                      <p className="font-medium">{student.name}</p>
                      <p className="text-xs text-muted-foreground">{student.email}</p>
                    </div>
                  </td>
                  <td className="py-3 px-4">{student.class}</td>
                  <td className="text-center py-3 px-4">
                    <span className={`font-semibold ${
                      student.grade >= 8.5 ? 'text-green-600' :
                      student.grade >= 7.0 ? 'text-blue-600' :
                      student.grade >= 5.5 ? 'text-orange-600' :
                      'text-red-600'
                    }`}>
                      {student.grade.toFixed(1)}
                    </span>
                  </td>
                  <td className="text-center py-3 px-4">{student.attendance.toFixed(1)}%</td>
                  <td className="text-center py-3 px-4">
                    {student.assignments.completed}/{student.assignments.total}
                  </td>
                  <td className="text-center py-3 px-4">
                    <Badge variant={
                      student.performance === 'excellent' ? 'default' :
                      student.performance === 'good' ? 'secondary' :
                      student.performance === 'average' ? 'outline' : 'destructive'
                    }>
                      {student.performance === 'excellent' ? 'Xuất sắc' :
                       student.performance === 'good' ? 'Khá' :
                       student.performance === 'average' ? 'TB' : 'Yếu'}
                    </Badge>
                  </td>
                  <td className="text-center py-3 px-4">
                    {student.alert.level !== 'none' && (
                      <span className={`flex items-center justify-center gap-1 text-xs ${
                        student.alert.level === 'high' ? 'text-red-600' :
                        student.alert.level === 'medium' ? 'text-orange-600' :
                        'text-yellow-600'
                      }`}>
                        <AlertTriangle className="w-3 h-3" />
                        {student.alert.message}
                      </span>
                    )}
                  </td>
                  <td className="text-center py-3 px-4">
                    <Button variant="ghost" size="sm">
                      Chi tiết
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
