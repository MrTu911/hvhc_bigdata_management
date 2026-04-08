
'use client';

import { useEffect, useState } from 'react';
import { useLanguage } from '@/components/providers/language-provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, UserPlus, Mail, User, Filter, X, Download } from 'lucide-react';

interface UserData {
  id: string;
  email: string;
  name: string;
  role: string;
  status: string;
  militaryId?: string;
  rank?: string;
  department?: string;
  lastLoginAt?: Date;
}

export default function UsersPage() {
  const { t, language } = useLanguage();
  const [users, setUsers] = useState<UserData[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'HOC_VIEN',
    personnelType: 'HOC_VIEN_QUAN_SU',
    employeeId: '',
    position: '',
    department: '',
    militaryId: '',
    rank: '',
    phone: '',
    startDate: '',
    endDate: '',
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [users, search, roleFilter, statusFilter]);

  const applyFilters = () => {
    let filtered = [...users];

    if (search) {
      const query = search.toLowerCase();
      filtered = filtered.filter(
        (u) =>
          u.name?.toLowerCase().includes(query) ||
          u.email?.toLowerCase().includes(query) ||
          u.militaryId?.toLowerCase().includes(query) ||
          u.department?.toLowerCase().includes(query)
      );
    }

    if (roleFilter !== 'all') {
      filtered = filtered.filter((u) => u.role === roleFilter);
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((u) => u.status === statusFilter);
    }

    setFilteredUsers(filtered);
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users');
      if (response.ok) {
        const result = await response.json();
        setUsers(result.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setIsDialogOpen(false);
        setFormData({
          email: '',
          password: '',
          name: '',
          role: 'HOC_VIEN',
          personnelType: 'HOC_VIEN_QUAN_SU',
          employeeId: '',
          position: '',
          department: '',
          militaryId: '',
          rank: '',
          phone: '',
          startDate: '',
          endDate: '',
        });
        fetchUsers();
      } else {
        const error = await response.json();
        alert(error?.error || 'Failed to create user');
      }
    } catch (error) {
      console.error('Failed to add user:', error);
      alert('Failed to create user');
    }
  };

  const activeFilterCount = [roleFilter, statusFilter].filter((f) => f !== 'all').length;

  const handleExport = (format: 'excel' | 'csv') => {
    console.log('Export to', format);
    // TODO: Implement export functionality
  };

  const clearFilters = () => {
    setSearch('');
    setRoleFilter('all');
    setStatusFilter('all');
  };

  const getRoleBadgeColor = (role: string) => {
    const colors = {
      ADMIN: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      GIANG_VIEN: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      HOC_VIEN: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      NGHIEN_CUU_VIEN: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
    };
    return colors[role as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getStatusBadgeColor = (status: string) => {
    const colors = {
      ACTIVE: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      INACTIVE: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
      SUSPENDED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{t('users.title')}</h2>
          <p className="text-muted-foreground mt-1">
            {filteredUsers?.length ?? 0} {t('dashboard.users').toLowerCase()}
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              {t('users.addUser')}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{t('users.addUser')}</DialogTitle>
              <DialogDescription>
                {language === 'vi' 
                  ? 'Thêm người dùng mới vào hệ thống' 
                  : 'Add a new user to the system'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddUser} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t('users.name')}</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">{t('users.email')}</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">
                  {language === 'vi' ? 'Mật khẩu' : 'Password'}
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">{t('users.role')}</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => setFormData({ ...formData, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ADMIN">{t('role.ADMIN')}</SelectItem>
                    <SelectItem value="QUAN_TRI_HE_THONG">{t('role.QUAN_TRI_HE_THONG')}</SelectItem>
                    <SelectItem value="CHI_HUY_HOC_VIEN">{t('role.CHI_HUY_HOC_VIEN')}</SelectItem>
                    <SelectItem value="CHI_HUY_KHOA_PHONG">{t('role.CHI_HUY_KHOA_PHONG')}</SelectItem>
                    <SelectItem value="CHU_NHIEM_BO_MON">{t('role.CHU_NHIEM_BO_MON')}</SelectItem>
                    <SelectItem value="GIANG_VIEN">{t('role.GIANG_VIEN')}</SelectItem>
                    <SelectItem value="NGHIEN_CUU_VIEN">{t('role.NGHIEN_CUU_VIEN')}</SelectItem>
                    <SelectItem value="HOC_VIEN_SINH_VIEN">{t('role.HOC_VIEN_SINH_VIEN')}</SelectItem>
                    <SelectItem value="HOC_VIEN">{t('role.HOC_VIEN')}</SelectItem>
                    <SelectItem value="KY_THUAT_VIEN">{t('role.KY_THUAT_VIEN')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="personnelType">
                  {language === 'vi' ? 'Loại nhân sự' : 'Personnel Type'}
                </Label>
                <Select
                  value={formData.personnelType}
                  onValueChange={(value) => setFormData({ ...formData, personnelType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CAN_BO_CHI_HUY">
                      {language === 'vi' ? 'Cán bộ chỉ huy' : 'Command Officer'}
                    </SelectItem>
                    <SelectItem value="GIANG_VIEN">
                      {language === 'vi' ? 'Giảng viên' : 'Faculty'}
                    </SelectItem>
                    <SelectItem value="NGHIEN_CUU_VIEN">
                      {language === 'vi' ? 'Nghiên cứu viên' : 'Researcher'}
                    </SelectItem>
                    <SelectItem value="CONG_NHAN_VIEN">
                      {language === 'vi' ? 'Công nhân viên' : 'Staff'}
                    </SelectItem>
                    <SelectItem value="HOC_VIEN_QUAN_SU">
                      {language === 'vi' ? 'Học viên quân sự' : 'Military Student'}
                    </SelectItem>
                    <SelectItem value="SINH_VIEN_DAN_SU">
                      {language === 'vi' ? 'Sinh viên dân sự' : 'Civilian Student'}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="employeeId">
                    {language === 'vi' ? 'Mã cán bộ/HV' : 'Employee ID'}
                  </Label>
                  <Input
                    id="employeeId"
                    value={formData.employeeId}
                    onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                    placeholder="CB001, HV2024001..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="position">
                    {language === 'vi' ? 'Chức vụ' : 'Position'}
                  </Label>
                  <Input
                    id="position"
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    placeholder={language === 'vi' ? 'Trưởng khoa, Phó bộ môn...' : 'Dean, Vice Head...'}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="department">{t('users.department')}</Label>
                <Input
                  id="department"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="militaryId">
                    {language === 'vi' ? 'Mã quân nhân' : 'Military ID'}
                  </Label>
                  <Input
                    id="militaryId"
                    value={formData.militaryId}
                    onChange={(e) => setFormData({ ...formData, militaryId: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rank">
                    {language === 'vi' ? 'Quân hàm' : 'Military Rank'}
                  </Label>
                  <Input
                    id="rank"
                    value={formData.rank}
                    onChange={(e) => setFormData({ ...formData, rank: e.target.value })}
                    placeholder={language === 'vi' ? 'Thiếu tá, Trung tá...' : 'Major, Lt. Colonel...'}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">
                    {language === 'vi' ? 'Ngày bắt đầu' : 'Start Date'}
                  </Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">
                    {language === 'vi' ? 'Ngày kết thúc' : 'End Date'}
                  </Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">
                  {language === 'vi' ? 'Số điện thoại' : 'Phone'}
                </Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  {t('common.cancel')}
                </Button>
                <Button type="submit">
                  {t('common.save')}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={t('users.searchPlaceholder')}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10 w-[300px]"
                  />
                </div>

                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder={language === 'vi' ? 'Vai trò' : 'Role'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{language === 'vi' ? 'Tất cả vai trò' : 'All roles'}</SelectItem>
                    <SelectItem value="GIANG_VIEN">{t('role.GIANG_VIEN')}</SelectItem>
                    <SelectItem value="NGHIEN_CUU_VIEN">{t('role.NGHIEN_CUU_VIEN')}</SelectItem>
                    <SelectItem value="HOC_VIEN">{t('role.HOC_VIEN')}</SelectItem>
                    <SelectItem value="CHI_HUY_HOC_VIEN">{t('role.CHI_HUY_HOC_VIEN')}</SelectItem>
                    <SelectItem value="CHI_HUY_KHOA_PHONG">{t('role.CHI_HUY_KHOA_PHONG')}</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder={language === 'vi' ? 'Trạng thái' : 'Status'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{language === 'vi' ? 'Tất cả' : 'All'}</SelectItem>
                    <SelectItem value="ACTIVE">{t('status.ACTIVE')}</SelectItem>
                    <SelectItem value="INACTIVE">{t('status.INACTIVE')}</SelectItem>
                    <SelectItem value="SUSPENDED">{t('status.SUSPENDED')}</SelectItem>
                  </SelectContent>
                </Select>

                {activeFilterCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    <X className="h-4 w-4 mr-2" />
                    {language === 'vi' ? 'Xóa bộ lọc' : 'Clear filters'}
                  </Button>
                )}
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

            {activeFilterCount > 0 && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="gap-1">
                  <Filter className="h-3 w-3" />
                  {activeFilterCount} {language === 'vi' ? 'bộ lọc đang áp dụng' : 'filters active'}
                </Badge>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {filteredUsers?.map((user) => (
              <div
                key={user?.id}
                className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{user?.name}</h3>
                      {user?.rank && (
                        <span className="text-xs text-primary font-medium">
                          {user.rank}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-3 w-3" />
                      <span>{user?.email}</span>
                      {user?.militaryId && (
                        <>
                          <span>•</span>
                          <span>{user.militaryId}</span>
                        </>
                      )}
                    </div>
                    {user?.department && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {user.department}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getRoleBadgeColor(user?.role)}>
                    {t(`role.${user?.role}`)}
                  </Badge>
                  <Badge className={getStatusBadgeColor(user?.status)}>
                    {t(`status.${user?.status}`)}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
