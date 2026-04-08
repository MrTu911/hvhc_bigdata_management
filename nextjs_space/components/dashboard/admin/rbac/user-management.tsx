
'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  MoreVertical,
  UserPlus,
  Shield,
  CheckCircle,
  XCircle
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  department?: string;
  lastLoginAt: string | null;
  createdAt: string;
}

const ROLES = [
  { value: 'QUAN_TRI_HE_THONG', label: 'Quản trị hệ thống' },
  { value: 'CHI_HUY_HOC_VIEN', label: 'Chỉ huy Học viện' },
  { value: 'CHI_HUY_KHOA_PHONG', label: 'Chỉ huy Khoa/Phòng' },
  { value: 'CHU_NHIEM_BO_MON', label: 'Chủ nhiệm Bộ môn' },
  { value: 'GIANG_VIEN', label: 'Giảng viên' },
  { value: 'NGHIEN_CUU_VIEN', label: 'Nghiên cứu viên' },
  { value: 'HOC_VIEN_SINH_VIEN', label: 'Học viên/Sinh viên' },
  { value: 'KY_THUAT_VIEN', label: 'Kỹ thuật viên' }
];

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showDialog, setShowDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  useEffect(() => {
    fetchUsers();
  }, [roleFilter, statusFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (roleFilter !== 'all') params.append('role', roleFilter);
      if (statusFilter !== 'all') params.append('status', statusFilter);

      const response = await fetch(`/api/admin/rbac/users?${params}`);
      const data = await response.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleLabel = (roleValue: string) => {
    return ROLES.find(r => r.value === roleValue)?.label || roleValue;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge className="gap-1"><CheckCircle className="w-3 h-3" />Hoạt động</Badge>;
      case 'INACTIVE':
        return <Badge variant="secondary">Không hoạt động</Badge>;
      case 'SUSPENDED':
        return <Badge variant="destructive"><XCircle className="w-3 h-3" />Đình chỉ</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleCreateUser = () => {
    setEditingUser(null);
    setShowDialog(true);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setShowDialog(true);
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa người dùng này?')) return;
    
    try {
      await fetch(`/api/admin/rbac/users/${userId}`, { method: 'DELETE' });
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const handleSaveUser = async () => {
    // Implementation for save user
    setShowDialog(false);
    fetchUsers();
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters and Actions */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="flex flex-1 gap-3 w-full md:w-auto">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Tìm kiếm người dùng..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Vai trò" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả vai trò</SelectItem>
                {ROLES.map(role => (
                  <SelectItem key={role.value} value={role.value}>
                    {role.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="ACTIVE">Hoạt động</SelectItem>
                <SelectItem value="INACTIVE">Không hoạt động</SelectItem>
                <SelectItem value="SUSPENDED">Đình chỉ</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleCreateUser} className="gap-2">
            <UserPlus className="w-4 h-4" />
            Thêm người dùng
          </Button>
        </div>
      </Card>

      {/* Users Table */}
      <Card className="p-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">
            Danh sách người dùng ({filteredUsers.length})
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Họ tên</th>
                  <th className="text-left py-3 px-4">Email</th>
                  <th className="text-left py-3 px-4">Vai trò</th>
                  <th className="text-left py-3 px-4">Đơn vị</th>
                  <th className="text-center py-3 px-4">Trạng thái</th>
                  <th className="text-left py-3 px-4">Đăng nhập gần nhất</th>
                  <th className="text-center py-3 px-4">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b hover:bg-muted/50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-primary">
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className="font-medium">{user.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">{user.email}</td>
                    <td className="py-3 px-4">
                      <Badge variant="outline" className="gap-1">
                        <Shield className="w-3 h-3" />
                        {getRoleLabel(user.role)}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-sm">{user.department || '-'}</td>
                    <td className="text-center py-3 px-4">
                      {getStatusBadge(user.status)}
                    </td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">
                      {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString('vi-VN') : 'Chưa đăng nhập'}
                    </td>
                    <td className="text-center py-3 px-4">
                      <div className="flex items-center justify-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleEditUser(user)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDeleteUser(user.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingUser ? 'Chỉnh sửa người dùng' : 'Thêm người dùng mới'}
            </DialogTitle>
            <DialogDescription>
              {editingUser ? 'Cập nhật thông tin người dùng' : 'Tạo tài khoản người dùng mới trong hệ thống'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Họ và tên</Label>
              <Input id="name" placeholder="Nhập họ tên đầy đủ" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="email@example.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Vai trò</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn vai trò" />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map(role => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="department">Đơn vị</Label>
              <Input id="department" placeholder="Tên đơn vị/phòng ban" />
            </div>
            {!editingUser && (
              <div className="space-y-2">
                <Label htmlFor="password">Mật khẩu</Label>
                <Input id="password" type="password" placeholder="Nhập mật khẩu" />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Hủy
            </Button>
            <Button onClick={handleSaveUser}>
              {editingUser ? 'Cập nhật' : 'Tạo mới'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
