'use client';

import { useEffect, useState } from 'react';
import { useLanguage } from '@/components/providers/language-provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Users, UserCheck, GraduationCap, Briefcase, Search, 
  Download, Filter, TrendingUp, Shield
} from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface StatsData {
  total: number;
  active: number;
  recentUsers: number;
  commandOfficers: number;
  faculty: number;
  students: number;
  byRole: Record<string, number>;
  byType: Record<string, number>;
  byUnit: Array<{ unit: string; count: number }>;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  personnelType?: string;
  employeeId?: string;
  position?: string;
  rank?: string;
  department?: string;
  status: string;
}

const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

export default function HumanResourcesPage() {
  const { t, language } = useLanguage();
  const [stats, setStats] = useState<StatsData | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [users, searchQuery, roleFilter, typeFilter, statusFilter]);

  const fetchData = async () => {
    try {
      const [statsRes, usersRes] = await Promise.all([
        fetch('/api/users/stats'),
        fetch('/api/users?limit=1000'),
      ]);

      if (statsRes.ok) {
        const result = await statsRes.json();
        setStats(result.data);
      }

      if (usersRes.ok) {
        const result = await usersRes.json();
        setUsers(result.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...users];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (u) =>
          u.name?.toLowerCase().includes(query) ||
          u.email?.toLowerCase().includes(query) ||
          u.employeeId?.toLowerCase().includes(query) ||
          u.department?.toLowerCase().includes(query)
      );
    }

    if (roleFilter !== 'all') {
      filtered = filtered.filter((u) => u.role === roleFilter);
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter((u) => u.personnelType === typeFilter);
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((u) => u.status === statusFilter);
    }

    setFilteredUsers(filtered);
  };

  const handleExport = (format: 'excel' | 'csv') => {
    console.log('Export to', format);
    // TODO: Implement export functionality
  };

  const activeFilterCount = [roleFilter, typeFilter, statusFilter].filter((f) => f !== 'all').length;

  // Prepare chart data
  const pieData = stats?.byType
    ? Object.entries(stats.byType).map(([key, value]) => ({
        name: getPersonnelLabel(key),
        value,
      }))
    : [];

  const barData = stats?.byUnit || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">
          {language === 'vi' ? 'Quản lý Nhân sự Tổng quan' : 'Human Resources Overview'}
        </h2>
        <p className="text-muted-foreground mt-1">
          {language === 'vi'
            ? 'Tổng quan nhân sự toàn Học viện - Phân loại theo vai trò và đơn vị'
            : 'Academy-wide personnel overview - By role and unit'}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {language === 'vi' ? 'Tổng nhân sự' : 'Total Personnel'}
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+{stats?.recentUsers || 0}</span>{' '}
              {language === 'vi' ? 'trong 30 ngày' : 'last 30 days'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {language === 'vi' ? 'Cán bộ chỉ huy' : 'Command Officers'}
            </CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.commandOfficers || 0}</div>
            <p className="text-xs text-muted-foreground">
              {language === 'vi' ? 'Học viện - Khoa - Bộ môn' : 'Academy - Faculty - Dept'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {language === 'vi' ? 'Giảng viên' : 'Faculty'}
            </CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.faculty || 0}</div>
            <p className="text-xs text-muted-foreground">
              {language === 'vi' ? 'Giảng dạy & nghiên cứu' : 'Teaching & research'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {language === 'vi' ? 'Học viên' : 'Students'}
            </CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.students || 0}</div>
            <p className="text-xs text-muted-foreground">
              {language === 'vi' ? 'Quân sự & dân sự' : 'Military & civilian'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{language === 'vi' ? 'Phân bố theo loại nhân sự' : 'Distribution by Personnel Type'}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{language === 'vi' ? 'Nhân sự theo đơn vị' : 'Personnel by Unit'}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="unit" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Data Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{language === 'vi' ? 'Danh sách nhân sự' : 'Personnel List'}</CardTitle>
              <CardDescription>
                {filteredUsers.length} / {users.length}{' '}
                {language === 'vi' ? 'người' : 'people'}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => handleExport('excel')}>
                <Download className="h-4 w-4 mr-2" />
                Excel
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleExport('csv')}>
                <Download className="h-4 w-4 mr-2" />
                CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filter Panel */}
          <div className="grid gap-4 md:grid-cols-4 mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={language === 'vi' ? 'Tìm kiếm...' : 'Search...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger>
                <SelectValue placeholder={language === 'vi' ? 'Vai trò' : 'Role'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{language === 'vi' ? 'Tất cả vai trò' : 'All roles'}</SelectItem>
                <SelectItem value="GIANG_VIEN">{t('role.GIANG_VIEN')}</SelectItem>
                <SelectItem value="NGHIEN_CUU_VIEN">{t('role.NGHIEN_CUU_VIEN')}</SelectItem>
                <SelectItem value="HOC_VIEN">{t('role.HOC_VIEN')}</SelectItem>
                <SelectItem value="CHI_HUY_HOC_VIEN">{t('role.CHI_HUY_HOC_VIEN')}</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder={language === 'vi' ? 'Loại nhân sự' : 'Personnel Type'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{language === 'vi' ? 'Tất cả loại' : 'All types'}</SelectItem>
                <SelectItem value="CAN_BO_CHI_HUY">
                  {language === 'vi' ? 'Cán bộ chỉ huy' : 'Command Officer'}
                </SelectItem>
                <SelectItem value="GIANG_VIEN">
                  {language === 'vi' ? 'Giảng viên' : 'Faculty'}
                </SelectItem>
                <SelectItem value="HOC_VIEN_QUAN_SU">
                  {language === 'vi' ? 'Học viên quân sự' : 'Military Student'}
                </SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder={language === 'vi' ? 'Trạng thái' : 'Status'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{language === 'vi' ? 'Tất cả' : 'All'}</SelectItem>
                <SelectItem value="ACTIVE">{t('status.ACTIVE')}</SelectItem>
                <SelectItem value="INACTIVE">{t('status.INACTIVE')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {activeFilterCount > 0 && (
            <div className="mb-4 flex items-center gap-2">
              <Badge variant="secondary">
                <Filter className="h-3 w-3 mr-1" />
                {activeFilterCount} {language === 'vi' ? 'bộ lọc đang áp dụng' : 'filters active'}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setRoleFilter('all');
                  setTypeFilter('all');
                  setStatusFilter('all');
                  setSearchQuery('');
                }}
              >
                {language === 'vi' ? 'Xóa bộ lọc' : 'Clear filters'}
              </Button>
            </div>
          )}

          {/* Table */}
          <div className="rounded-md border">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="p-3 text-left font-medium">
                      {language === 'vi' ? 'Họ tên' : 'Name'}
                    </th>
                    <th className="p-3 text-left font-medium">
                      {language === 'vi' ? 'Mã CB/HV' : 'ID'}
                    </th>
                    <th className="p-3 text-left font-medium">
                      {language === 'vi' ? 'Vai trò' : 'Role'}
                    </th>
                    <th className="p-3 text-left font-medium">
                      {language === 'vi' ? 'Loại nhân sự' : 'Type'}
                    </th>
                    <th className="p-3 text-left font-medium">
                      {language === 'vi' ? 'Chức vụ' : 'Position'}
                    </th>
                    <th className="p-3 text-left font-medium">
                      {language === 'vi' ? 'Đơn vị' : 'Unit'}
                    </th>
                    <th className="p-3 text-left font-medium">
                      {language === 'vi' ? 'Trạng thái' : 'Status'}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b hover:bg-muted/50">
                      <td className="p-3">
                        <div className="font-medium">{user.name}</div>
                        <div className="text-xs text-muted-foreground">{user.email}</div>
                      </td>
                      <td className="p-3">
                        {user.employeeId || user.id.slice(0, 8)}
                      </td>
                      <td className="p-3">
                        <Badge variant="outline">{t(`role.${user.role}`)}</Badge>
                      </td>
                      <td className="p-3">
                        {user.personnelType && (
                          <span className="text-xs">{getPersonnelLabel(user.personnelType)}</span>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="text-sm">{user.position || '-'}</div>
                        {user.rank && (
                          <div className="text-xs text-primary">{user.rank}</div>
                        )}
                      </td>
                      <td className="p-3">{user.department || '-'}</td>
                      <td className="p-3">
                        <Badge
                          variant={user.status === 'ACTIVE' ? 'default' : 'secondary'}
                        >
                          {t(`status.${user.status}`)}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function getPersonnelLabel(type: string): string {
  const labels: Record<string, string> = {
    CAN_BO_CHI_HUY: 'Cán bộ chỉ huy',
    GIANG_VIEN: 'Giảng viên',
    NGHIEN_CUU_VIEN: 'Nghiên cứu viên',
    CONG_NHAN_VIEN: 'Công nhân viên',
    HOC_VIEN_QUAN_SU: 'Học viên QS',
    SINH_VIEN_DAN_SU: 'Sinh viên DS',
  };
  return labels[type] || type;
}
