'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  UserPlus, Edit, Lock, Unlock, Key, Search,
  Users, UserCheck, UserX, Building2, ArrowLeft,
  Shield, RefreshCw, AlertTriangle,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface UserStats {
  totalUsers: number;
  activeUsers: number;
  lockedUsers: number;
  usersWithUnit: number;
  roleDistribution: Array<{ role: string; count: number }>;
}

const ROLE_LABEL: Record<string, string> = {
  HOC_VIEN: 'Học viên QS',
  HOC_VIEN_SINH_VIEN: 'Học viên DS',
  GIANG_VIEN: 'Giảng viên',
  NGHIEN_CUU_VIEN: 'NC viên',
  CHU_NHIEM_BO_MON: 'CN Bộ môn',
  CHI_HUY_BO_MON: 'Chỉ huy BM',
  CHI_HUY_KHOA_PHONG: 'Chỉ huy KP',
  CHI_HUY_HE: 'Chỉ huy hệ',
  CHI_HUY_TIEU_DOAN: 'Chỉ huy TĐ',
  CHI_HUY_BAN: 'Chỉ huy ban',
  CHI_HUY_HOC_VIEN: 'Chỉ huy HV',
  QUAN_TRI_HE_THONG: 'Quản trị HT',
  ADMIN: 'Admin',
};

const ROLE_COLOR: Record<string, string> = {
  HOC_VIEN: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400',
  HOC_VIEN_SINH_VIEN: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
  GIANG_VIEN: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
  NGHIEN_CUU_VIEN: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
  CHU_NHIEM_BO_MON: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  CHI_HUY_BO_MON: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  CHI_HUY_KHOA_PHONG: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  CHI_HUY_HE: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  CHI_HUY_TIEU_DOAN: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  CHI_HUY_BAN: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  CHI_HUY_HOC_VIEN: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
  QUAN_TRI_HE_THONG: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  ADMIN: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

const ROLE_OPTIONS = [
  { group: 'Học viên', items: [
    { value: 'HOC_VIEN', label: 'Học viên quân sự' },
    { value: 'HOC_VIEN_SINH_VIEN', label: 'Học viên dân sự' },
  ]},
  { group: 'Giảng viên & Nghiên cứu', items: [
    { value: 'GIANG_VIEN', label: 'Giảng viên' },
    { value: 'NGHIEN_CUU_VIEN', label: 'Nghiên cứu viên' },
  ]},
  { group: 'Cán bộ chỉ huy', items: [
    { value: 'CHI_HUY_BO_MON', label: 'Chỉ huy bộ môn' },
    { value: 'CHI_HUY_KHOA_PHONG', label: 'Chỉ huy khoa / phòng' },
    { value: 'CHI_HUY_HE', label: 'Chỉ huy hệ' },
    { value: 'CHI_HUY_TIEU_DOAN', label: 'Chỉ huy tiểu đoàn' },
    { value: 'CHI_HUY_BAN', label: 'Chỉ huy ban' },
    { value: 'CHI_HUY_HOC_VIEN', label: 'Chỉ huy học viện' },
  ]},
  { group: 'Hệ thống', items: [
    { value: 'QUAN_TRI_HE_THONG', label: 'Quản trị hệ thống' },
    { value: 'ADMIN', label: 'Admin (toàn quyền)' },
  ]},
];

function RoleSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger><SelectValue /></SelectTrigger>
      <SelectContent className="max-h-[320px]">
        {ROLE_OPTIONS.map(group => (
          <div key={group.group}>
            <div className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">{group.group}</div>
            {group.items.map(item => (
              <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
            ))}
          </div>
        ))}
      </SelectContent>
    </Select>
  );
}

function RankSelect({ value, ranks, onChange }: { value: string; ranks: any[]; onChange: (v: string) => void }) {
  const RANK_CATS: Record<string, string> = { BIEN_CHE: 'Binh sĩ', SI_QUAN: 'Sĩ quan', HOC_VIEN: 'Học viên', CNVQP: 'CNVQP' };
  return (
    <Select value={value || 'none'} onValueChange={(v) => onChange(v === 'none' ? '' : v)}>
      <SelectTrigger><SelectValue placeholder="Chọn quân hàm" /></SelectTrigger>
      <SelectContent className="max-h-[280px]">
        <SelectItem value="none">-- Không chọn --</SelectItem>
        {['BIEN_CHE', 'SI_QUAN', 'HOC_VIEN', 'CNVQP'].map(cat => {
          const catRanks = ranks.filter(r => r.category === cat);
          if (!catRanks.length) return null;
          return (
            <div key={cat}>
              <div className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">{RANK_CATS[cat]}</div>
              {catRanks.map((r: any) => <SelectItem key={r.shortCode} value={r.name}>{r.name}</SelectItem>)}
            </div>
          );
        })}
      </SelectContent>
    </Select>
  );
}

export default function UsersManagementPage() {
  const searchParams = useSearchParams();

  const [users, setUsers] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [positions, setPositions] = useState<any[]>([]);
  const [ranks, setRanks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [unitIdFilter, setUnitIdFilter] = useState('ALL');
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [stats, setStats] = useState<UserStats>({
    totalUsers: 0, activeUsers: 0, lockedUsers: 0, usersWithUnit: 0, roleDistribution: [],
  });

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [isDeactivateOpen, setIsDeactivateOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [deactivateInfo, setDeactivateInfo] = useState<any>(null);

  const [formData, setFormData] = useState({
    name: '', email: '', password: '', role: 'HOC_VIEN',
    militaryId: '', rank: '', position: '', phone: '', unitId: '', status: 'ACTIVE',
  });
  const [newPassword, setNewPassword] = useState('');

  // Pre-populate unitId from URL param
  useEffect(() => {
    const unitIdFromUrl = searchParams.get('unitId');
    if (unitIdFromUrl && units.length > 0) {
      const unit = units.find((u: any) => u.id === unitIdFromUrl);
      if (unit) {
        setFormData(prev => ({ ...prev, unitId: unitIdFromUrl }));
        setIsAddOpen(true);
        toast.info(`Thêm nhân sự vào: ${unit.name}`);
      }
    }
  }, [searchParams, units]);

  // Also pre-filter by unitId from URL
  useEffect(() => {
    const unitIdFromUrl = searchParams.get('unitId');
    if (unitIdFromUrl) setUnitIdFilter(unitIdFromUrl);
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/rbac/users/stats');
      const data = await res.json();
      if (res.ok) setStats(data);
    } catch {
      // non-fatal
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: '20',
        ...(search && { search }),
        ...(roleFilter && roleFilter !== 'ALL' && { role: roleFilter }),
        ...(statusFilter && statusFilter !== 'ALL' && { status: statusFilter }),
        ...(unitIdFilter && unitIdFilter !== 'ALL' && { unitId: unitIdFilter }),
      });
      const res = await fetch(`/api/admin/rbac/users?${params}`);
      const data = await res.json();
      if (res.ok) {
        setUsers(data.data || []);
        setPagination(prev => ({
          ...prev,
          totalPages: data.pagination?.totalPages ?? 1,
          total: data.pagination?.total ?? 0,
        }));
      } else {
        toast.error(data.error || 'Không thể tải danh sách người dùng');
      }
    } catch {
      toast.error('Lỗi kết nối khi tải danh sách người dùng');
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, statusFilter, unitIdFilter, pagination.page]);

  const fetchUnits = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/units?flat=true');
      const data = await res.json();
      if (res.ok) setUnits(data.data || []);
    } catch {
      console.error('Failed to fetch units');
    }
  }, []);

  const fetchPositions = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/rbac/positions');
      const data = await res.json();
      if (res.ok) setPositions(data.positions?.filter((p: any) => p.isActive) || []);
    } catch {
      console.error('Failed to fetch positions');
    }
  }, []);

  const fetchRanks = useCallback(async () => {
    try {
      const res = await fetch('/api/master-data/ranks');
      const data = await res.json();
      if (res.ok && data.data) setRanks(data.data);
    } catch {
      console.error('Failed to fetch ranks');
    }
  }, []);

  useEffect(() => {
    fetchStats();
    fetchUnits();
    fetchPositions();
    fetchRanks();
  }, [fetchStats, fetchUnits, fetchPositions, fetchRanks]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const refreshData = useCallback(() => {
    fetchUsers();
    fetchStats();
  }, [fetchUsers, fetchStats]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/rbac/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, rank: formData.rank || null }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Tạo tài khoản thành công!');
        setIsAddOpen(false);
        resetForm();
        refreshData();
      } else {
        toast.error(data.error || 'Không thể tạo tài khoản');
      }
    } catch {
      toast.error('Lỗi khi tạo tài khoản');
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/rbac/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedUser.id, ...formData, rank: formData.rank || null }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Cập nhật thành công!');
        setIsEditOpen(false);
        refreshData();
      } else {
        toast.error(data.error || 'Không thể cập nhật');
      }
    } catch {
      toast.error('Lỗi khi cập nhật');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa người dùng này?')) return;
    try {
      const res = await fetch(`/api/admin/rbac/users?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || 'Đã xóa người dùng');
        refreshData();
      } else if (res.status === 409 && data.canDeactivate) {
        // Has dependencies — offer deactivate
        setDeactivateInfo({ userId: id, ...data });
        setIsDeactivateOpen(true);
      } else {
        toast.error(data.error || 'Không thể xóa người dùng');
      }
    } catch {
      toast.error('Lỗi khi xóa người dùng');
    }
  };

  const handleForceDeactivate = async () => {
    if (!deactivateInfo?.userId) return;
    try {
      const res = await fetch(`/api/admin/rbac/users?id=${deactivateInfo.userId}&forceDeactivate=true`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || 'Đã vô hiệu hóa tài khoản');
        setIsDeactivateOpen(false);
        setDeactivateInfo(null);
        refreshData();
      } else {
        toast.error(data.error || 'Không thể vô hiệu hóa');
      }
    } catch {
      toast.error('Lỗi khi vô hiệu hóa tài khoản');
    }
  };

  const handleToggleStatus = async (id: string, status: string) => {
    const newStatus = status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      const res = await fetch('/api/admin/rbac/users/toggle-status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(newStatus === 'ACTIVE' ? 'Đã mở khóa tài khoản' : 'Đã khóa tài khoản');
        refreshData();
      } else {
        toast.error(data.error || 'Không thể thay đổi trạng thái');
      }
    } catch {
      toast.error('Lỗi khi thay đổi trạng thái');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/rbac/users/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedUser.id, newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Đã đổi mật khẩu thành công');
        setIsResetOpen(false);
        setNewPassword('');
      } else {
        toast.error(data.error || 'Không thể đổi mật khẩu');
      }
    } catch {
      toast.error('Lỗi khi đổi mật khẩu');
    }
  };

  const resetForm = () => {
    setFormData({ name: '', email: '', password: '', role: 'HOC_VIEN', militaryId: '', rank: '', position: '', phone: '', unitId: '', status: 'ACTIVE' });
  };

  const openEditDialog = (user: any) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
      militaryId: user.militaryId || '',
      rank: user.rank || '',
      position: user.position || '',
      phone: user.phone || '',
      unitId: user.unitId || '',
      status: user.status,
    });
    setIsEditOpen(true);
  };

  const isFiltered = search || (roleFilter && roleFilter !== 'ALL') || (statusFilter && statusFilter !== 'ALL') || (unitIdFilter && unitIdFilter !== 'ALL');

  const userFormFields = (isCreate: boolean) => (
    <div className="space-y-4">
      {/* Login info (create only) */}
      {isCreate && (
        <div className="border rounded-lg p-4 bg-primary/5">
          <h4 className="font-semibold text-sm mb-3">Thông tin đăng nhập</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Email đăng nhập *</Label>
              <Input type="email" value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required placeholder="vd: nguyenvana@hvhc.edu.vn" />
            </div>
            <div>
              <Label>Mật khẩu *</Label>
              <Input type="password" value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required minLength={6} placeholder="Tối thiểu 6 ký tự" />
            </div>
          </div>
        </div>
      )}

      {/* Personal info */}
      <div className="border rounded-lg p-4">
        <h4 className="font-semibold text-sm mb-3">Thông tin cá nhân</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Họ và tên *</Label>
            <Input value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required placeholder="Nguyễn Văn A" />
          </div>
          <div>
            <Label>Số điện thoại</Label>
            <Input value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="0123456789" />
          </div>
          {!isCreate && (
            <div>
              <Label>Email đăng nhập</Label>
              <Input type="email" value={formData.email} disabled className="opacity-60 cursor-not-allowed" />
            </div>
          )}
        </div>
      </div>

      {/* Military info */}
      <div className="border rounded-lg p-4">
        <h4 className="font-semibold text-sm mb-3">Thông tin quân sự</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Mã quân nhân</Label>
            <Input value={formData.militaryId}
              onChange={(e) => setFormData({ ...formData, militaryId: e.target.value })}
              placeholder="VD: QN123456" />
          </div>
          <div>
            <Label>Quân hàm</Label>
            <RankSelect value={formData.rank} ranks={ranks} onChange={(v) => setFormData({ ...formData, rank: v })} />
          </div>
          <div className="col-span-2">
            <Label>Chức vụ</Label>
            <Select
              value={formData.position && positions.find((p: any) => p.name === formData.position) ? formData.position : 'none'}
              onValueChange={(v) => setFormData({ ...formData, position: v === 'none' ? '' : v })}
            >
              <SelectTrigger><SelectValue placeholder="Chọn chức vụ..." /></SelectTrigger>
              <SelectContent className="max-h-[300px]">
                <SelectItem value="none">-- Không chọn --</SelectItem>
                {positions.map((pos: any) => (
                  <SelectItem key={pos.id} value={pos.name}>{pos.name} ({pos.code})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Assignment & role */}
      <div className="border rounded-lg p-4">
        <h4 className="font-semibold text-sm mb-3">Phân bổ & Vai trò</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className={isCreate ? '' : 'col-span-1'}>
            <Label>Đơn vị {isCreate && '*'}</Label>
            <Select
              value={formData.unitId || 'none'}
              onValueChange={(v) => setFormData({ ...formData, unitId: v === 'none' ? '' : v })}
            >
              <SelectTrigger className={isCreate && !formData.unitId ? 'border-destructive' : ''}>
                <SelectValue placeholder={isCreate ? '⚠ Chọn đơn vị (bắt buộc)' : 'Chọn đơn vị'} />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {!isCreate && <SelectItem value="none">-- Không thuộc đơn vị nào --</SelectItem>}
                {units.map((unit: any) => (
                  <SelectItem key={unit.id} value={unit.id}>
                    {'  '.repeat(unit.level - 1)}{unit.code} — {unit.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isCreate && !formData.unitId && (
              <p className="text-xs text-destructive mt-1">Bắt buộc chọn đơn vị</p>
            )}
          </div>
          <div>
            <Label>Vai trò hệ thống *</Label>
            <RoleSelect value={formData.role} onChange={(v) => setFormData({ ...formData, role: v })} />
          </div>
          {!isCreate && (
            <div>
              <Label>Trạng thái tài khoản</Label>
              <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">
                    <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />Hoạt động</span>
                  </SelectItem>
                  <SelectItem value="INACTIVE">
                    <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" />Bị khóa</span>
                  </SelectItem>
                  <SelectItem value="SUSPENDED">
                    <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />Tạm đình chỉ</span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/admin">
            <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Users className="h-5 w-5" /> Quản lý Người dùng
            </h1>
            <p className="text-sm text-muted-foreground">Quản lý tài khoản, vai trò và trạng thái người dùng</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={refreshData}>
            <RefreshCw className="w-4 h-4 mr-1.5" /> Làm mới
          </Button>
          <Button size="sm" onClick={() => { resetForm(); setIsAddOpen(true); }}>
            <UserPlus className="w-4 h-4 mr-1.5" /> Thêm người dùng
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Tổng người dùng', value: stats.totalUsers, sub: 'Trong hệ thống', icon: Users, colorClass: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' },
          { label: 'Đang hoạt động', value: stats.activeUsers, sub: `${stats.totalUsers > 0 ? ((stats.activeUsers / stats.totalUsers) * 100).toFixed(0) : 0}% tổng số`, icon: UserCheck, colorClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
          { label: 'Bị khóa', value: stats.lockedUsers, sub: 'Tài khoản khóa/tạm đình chỉ', icon: UserX, colorClass: 'bg-red-500/10 text-red-600 dark:text-red-400' },
          { label: 'Có đơn vị', value: stats.usersWithUnit, sub: `${stats.totalUsers > 0 ? ((stats.usersWithUnit / stats.totalUsers) * 100).toFixed(0) : 0}% đã phân bổ`, icon: Building2, colorClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' },
        ].map(({ label, value, sub, icon: Icon, colorClass }) => (
          <Card key={label}>
            <CardContent className="pt-5">
              <div className="flex items-start gap-3">
                <div className={`rounded-lg p-2.5 ${colorClass}`}><Icon className="h-5 w-5" /></div>
                <div>
                  <p className="text-2xl font-bold">{value}</p>
                  <p className="text-sm font-medium">{label}</p>
                  <p className="text-xs text-muted-foreground">{sub}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="bg-muted/30 rounded-xl border p-4 flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Tìm theo tên, email, mã quân nhân..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPagination(prev => ({ ...prev, page: 1 })); }}
            className="pl-10"
          />
        </div>
        <div className="w-[200px]">
          <Select value={unitIdFilter} onValueChange={(v) => { setUnitIdFilter(v); setPagination(prev => ({ ...prev, page: 1 })); }}>
            <SelectTrigger><SelectValue placeholder="Tất cả đơn vị" /></SelectTrigger>
            <SelectContent className="max-h-[300px]">
              <SelectItem value="ALL">Tất cả đơn vị</SelectItem>
              {units.map((unit: any) => (
                <SelectItem key={unit.id} value={unit.id}>
                  <span className="text-xs">{unit.code} — {unit.name}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-[180px]">
          <Select value={roleFilter} onValueChange={(v) => { setRoleFilter(v); setPagination(prev => ({ ...prev, page: 1 })); }}>
            <SelectTrigger><SelectValue placeholder="Tất cả vai trò" /></SelectTrigger>
            <SelectContent className="max-h-[300px]">
              <SelectItem value="ALL">Tất cả vai trò</SelectItem>
              {ROLE_OPTIONS.flatMap(g => g.items).map(item => (
                <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-[160px]">
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPagination(prev => ({ ...prev, page: 1 })); }}>
            <SelectTrigger><SelectValue placeholder="Trạng thái" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
              <SelectItem value="ACTIVE">Hoạt động</SelectItem>
              <SelectItem value="INACTIVE">Bị khóa</SelectItem>
              <SelectItem value="SUSPENDED">Tạm đình chỉ</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {isFiltered && (
          <Badge variant="secondary" className="text-xs px-3 py-1.5">
            Đang lọc · {pagination.total} kết quả
          </Badge>
        )}
      </div>

      {/* Table */}
      <div className="rounded-xl border overflow-hidden">
        <div className="px-5 py-3.5 border-b bg-muted/30 flex items-center justify-between">
          <h3 className="font-semibold text-sm">Danh sách người dùng</h3>
          <span className="text-xs text-muted-foreground">
            Tổng {pagination.total} · Trang {pagination.page}/{pagination.totalPages}
          </span>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/20">
                <TableHead>Họ tên</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Vai trò</TableHead>
                <TableHead>Đơn vị</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <TableCell key={j}><div className="h-4 bg-muted rounded animate-pulse" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-14">
                    <Users className="mx-auto h-10 w-10 text-muted-foreground/30 mb-2" />
                    <p className="text-muted-foreground">Không có dữ liệu</p>
                  </TableCell>
                </TableRow>
              ) : users.map((user) => (
                <TableRow key={user.id} className="hover:bg-accent/30 transition-colors">
                  <TableCell>
                    <div className="font-medium">{user.name}</div>
                    {user.militaryId && (
                      <div className="text-xs font-mono text-muted-foreground">{user.militaryId}</div>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">{user.email}</TableCell>
                  <TableCell>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ROLE_COLOR[user.role] || 'bg-muted text-muted-foreground'}`}>
                      {ROLE_LABEL[user.role] || user.role}
                    </span>
                  </TableCell>
                  <TableCell>
                    {user.unitRelation ? (
                      <div>
                        <div className="text-sm">{user.unitRelation.name}</div>
                        <span className="text-xs font-mono bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                          {user.unitRelation.code}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs bg-destructive/10 text-destructive px-2 py-0.5 rounded-full">Chưa gán</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      user.status === 'ACTIVE'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                        : user.status === 'SUSPENDED'
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      {user.status === 'ACTIVE' ? 'Hoạt động' : user.status === 'SUSPENDED' ? 'Đình chỉ' : 'Bị khóa'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button size="sm" variant="ghost" title="Chỉnh sửa" onClick={() => openEditDialog(user)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm" variant="ghost"
                        title={user.status === 'ACTIVE' ? 'Khóa tài khoản' : 'Mở khóa'}
                        onClick={() => handleToggleStatus(user.id, user.status)}
                      >
                        {user.status === 'ACTIVE'
                          ? <Lock className="w-4 h-4 text-amber-500" />
                          : <Unlock className="w-4 h-4 text-emerald-500" />}
                      </Button>
                      <Button size="sm" variant="ghost" title="Đổi mật khẩu" onClick={() => { setSelectedUser(user); setNewPassword(''); setIsResetOpen(true); }}>
                        <Key className="w-4 h-4 text-purple-500" />
                      </Button>
                      <Button size="sm" variant="ghost" title="Xóa" onClick={() => handleDelete(user.id)}>
                        <Shield className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-muted/30 border">
        <span className="text-sm text-muted-foreground">
          Trang <span className="font-semibold">{pagination.page}</span> / {pagination.totalPages}
        </span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm"
            onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
            disabled={pagination.page <= 1}>Trước</Button>
          <Button variant="outline" size="sm"
            onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
            disabled={pagination.page >= pagination.totalPages}>Sau</Button>
        </div>
      </div>

      {/* Add Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Thêm người dùng mới</DialogTitle>
            <DialogDescription>Mọi nhân sự phải được gán vào một đơn vị</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            {userFormFields(true)}
            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>Hủy</Button>
              <Button type="submit" disabled={!formData.unitId || !formData.email || !formData.name || !formData.password}>
                Tạo tài khoản
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Chỉnh sửa: {selectedUser?.name}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            {userFormFields(false)}
            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>Hủy</Button>
              <Button type="submit">Lưu thay đổi</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={isResetOpen} onOpenChange={setIsResetOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Đổi mật khẩu</DialogTitle>
            <DialogDescription>{selectedUser?.name} ({selectedUser?.email})</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <Label>Mật khẩu mới *</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required minLength={6}
                placeholder="Tối thiểu 6 ký tự"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsResetOpen(false)}>Hủy</Button>
              <Button type="submit">Đổi mật khẩu</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Deactivate Conflict Dialog */}
      <Dialog open={isDeactivateOpen} onOpenChange={setIsDeactivateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="w-5 h-5" />
              Không thể xóa tài khoản
            </DialogTitle>
            <DialogDescription>
              {deactivateInfo?.user?.name} — tài khoản có dữ liệu liên quan
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">{deactivateInfo?.suggestion}</p>
            {deactivateInfo?.constraints?.length > 0 && (
              <div className="rounded-lg border bg-muted/30 p-3 space-y-1">
                {deactivateInfo.constraints.map((c: string, i: number) => (
                  <p key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                    <span className="text-amber-500 mt-0.5">•</span> {c}
                  </p>
                ))}
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setIsDeactivateOpen(false)}>Hủy</Button>
            <Button variant="default" onClick={handleForceDeactivate} className="bg-amber-600 hover:bg-amber-700">
              Vô hiệu hóa tài khoản
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
