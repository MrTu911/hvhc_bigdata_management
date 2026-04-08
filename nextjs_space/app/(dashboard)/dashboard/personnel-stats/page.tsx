/**
 * Dashboard Cán bộ - Ban Cán bộ
 * D1.4: Thống kê quân nhân/cán bộ từ database thực
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/components/providers/language-provider';
import {
  Users,
  Building2,
  GraduationCap,
  Shield,
  TrendingUp,
  UserCheck,
  UserX,
  RefreshCw,
  Activity,
  Clock,
  BarChart3,
  PieChartIcon
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
  ResponsiveContainer
} from 'recharts';

interface PersonnelData {
  overview: {
    totalUsers: number;
    activeUsers: number;
    inactiveUsers: number;
    totalDepartments: number;
    totalUnits: number;
    activeRate: string | number;
  };
  usersByRole: Array<{ role: string; count: number }>;
  usersByRank: Array<{ rank: string; count: number }>;
  usersByDepartment: Array<{ department: string; count: number }>;
  usersByEducation: Array<{ education: string; count: number }>;
  usersByGender: Array<{ gender: string; count: number }>;
  usersByPersonnelType: Array<{ type: string; count: number }>;
  ageDistribution: Array<{ age: string; count: number }>;
  recentUsers: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    rank: string;
    department: string;
    position: string;
    status: string;
    createdAt: string;
  }>;
  recentLogins: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    lastLoginAt: string;
  }>;
}

const ROLE_LABELS: Record<string, string> = {
  QUAN_TRI_HE_THONG: 'Quản trị HT',
  CHI_HUY_HOC_VIEN: 'Chi huy HV',
  CHI_HUY_KHOA_PHONG: 'Trưởng Khoa/Phòng',
  CHU_NHIEM_BO_MON: 'Chủ nhiệm BM',
  GIANG_VIEN: 'Giảng viên',
  NGHIEN_CUU_VIEN: 'Nghiên cứu viên',
  HOC_VIEN_SINH_VIEN: 'Học viên/SV',
  KY_THUAT_VIEN: 'Kỹ thuật viên',
  ADMIN: 'Admin',
  HOC_VIEN: 'Học viên'
};

const ROLE_COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'];
const GENDER_COLORS = ['#3b82f6', '#ec4899', '#94a3b8'];
const AGE_COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444'];

export default function PersonnelDashboardPage() {
  const { t } = useLanguage();
  const [data, setData] = useState<PersonnelData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/dashboard/personnel');
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

  const roleChartData = data?.usersByRole.map((item, index) => ({
    name: ROLE_LABELS[item.role] || item.role,
    value: item.count,
    color: ROLE_COLORS[index % ROLE_COLORS.length]
  })) || [];

  const genderChartData = data?.usersByGender.map((item, index) => ({
    name: item.gender === 'Nam' ? 'Nam' : item.gender === 'Nữ' ? 'Nữ' : 'Khác',
    value: item.count,
    color: GENDER_COLORS[index % GENDER_COLORS.length]
  })) || [];

  const ageChartData = data?.ageDistribution.map((item, index) => ({
    name: item.age,
    value: item.count,
    color: AGE_COLORS[index % AGE_COLORS.length]
  })) || [];

  const departmentChartData = data?.usersByDepartment.map(d => ({
    name: d.department.length > 15 ? d.department.substring(0, 15) + '...' : d.department,
    'Số lượng': d.count
  })) || [];

  const rankChartData = data?.usersByRank.slice(0, 10).map(r => ({
    name: r.rank,
    'Số lượng': r.count
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
            <Users className="h-8 w-8 text-blue-600" />
            Dashboard Cán bộ
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Thống kê và quản lý nhân sự toàn viện
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
              <Users className="h-4 w-4" />
              Tổng cán bộ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-800 dark:text-blue-100">
              {data?.overview.totalUsers || 0}
            </div>
            <p className="text-sm text-blue-600 dark:text-blue-400">
              <UserCheck className="h-3 w-3 inline mr-1" />
              {data?.overview.activeUsers || 0} hoạt động
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Tỷ lệ hoạt động
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-800 dark:text-green-100">
              {data?.overview.activeRate || 0}%
            </div>
            <p className="text-sm text-green-600 dark:text-green-400">
              <UserX className="h-3 w-3 inline mr-1" />
              {data?.overview.inactiveUsers || 0} không hoạt động
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300 flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Khoa/Phòng
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-800 dark:text-purple-200">
              {data?.overview.totalDepartments || 0}
            </div>
            <p className="text-sm text-purple-600 dark:text-purple-400">
              {data?.overview.totalUnits || 0} đơn vị trực thuộc
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-orange-700 dark:text-orange-300 flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Vai trò
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-800 dark:text-orange-200">
              {data?.usersByRole.length || 0}
            </div>
            <p className="text-sm text-orange-600 dark:text-orange-400">
              Loại vai trò khác nhau
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-lg grid-cols-4">
          <TabsTrigger value="overview">Tổng quan</TabsTrigger>
          <TabsTrigger value="structure">Cơ cấu</TabsTrigger>
          <TabsTrigger value="recent">Gần đây</TabsTrigger>
          <TabsTrigger value="activity">Hoạt động</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Role Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChartIcon className="h-5 w-5" />
                  Phân bố theo vai trò
                </CardTitle>
                <CardDescription>Số lượng cán bộ theo vai trò hệ thống</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={roleChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                    >
                      {roleChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Gender Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Phân bố giới tính
                </CardTitle>
                <CardDescription>Tỷ lệ nam/nữ trong tổ chức</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={genderChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                    >
                      {genderChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Structure Tab */}
        <TabsContent value="structure" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Department Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Phân bố theo đơn vị
                </CardTitle>
                <CardDescription>Top 10 đơn vị có nhiều cán bộ nhất</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={departmentChartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="Số lượng" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Rank Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Phân bố theo cấp bậc
                </CardTitle>
                <CardDescription>Top 10 cấp bậc quân hàm</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={rankChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} height={60} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="Số lượng" fill="#8b5cf6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Age Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Phân bố độ tuổi
                </CardTitle>
                <CardDescription>Cơ cấu tuổi cán bộ</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={ageChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" name="Số lượng">
                      {ageChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Education Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5" />
                  Trình độ học vấn
                </CardTitle>
                <CardDescription>Phân bố theo trình độ đào tạo</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data?.usersByEducation.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm">{item.education}</span>
                      <Badge variant="secondary">{item.count}</Badge>
                    </div>
                  ))}
                  {(!data?.usersByEducation || data.usersByEducation.length === 0) && (
                    <p className="text-center text-gray-500 py-4">Chưa có dữ liệu</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Recent Tab */}
        <TabsContent value="recent" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Cán bộ mới thêm
              </CardTitle>
              <CardDescription>Danh sách cán bộ được thêm gần đây</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data?.recentUsers.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">Chưa có dữ liệu</p>
                ) : (
                  data?.recentUsers.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50/60 transition-colors dark:hover:bg-gray-800">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 font-bold">
                          {user.name?.charAt(0) || '?'}
                        </div>
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-sm text-gray-500">
                            {user.rank && `${user.rank} • `}
                            {user.position || user.department || user.email}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={user.status === 'ACTIVE' ? 'bg-green-500' : 'bg-red-500'}>
                          {user.status === 'ACTIVE' ? 'Hoạt động' : 'Không HD'}
                        </Badge>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(user.createdAt).toLocaleDateString('vi-VN')}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Đăng nhập gần đây
              </CardTitle>
              <CardDescription>Người dùng đăng nhập mới nhất</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data?.recentLogins.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">Chưa có dữ liệu đăng nhập</p>
                ) : (
                  data?.recentLogins.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50/60 transition-colors dark:hover:bg-gray-800">
                      <div className="flex items-center gap-4">
                        <Activity className="h-5 w-5 text-green-500" />
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline">{ROLE_LABELS[user.role] || user.role}</Badge>
                        <p className="text-xs text-gray-500 mt-1">
                          {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString('vi-VN') : 'N/A'}
                        </p>
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
