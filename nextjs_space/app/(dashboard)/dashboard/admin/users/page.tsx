'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Separator } from '@/components/ui/separator';
import {
  UserPlus, Edit, Lock, Unlock, Key, Search,
  Users, UserCheck, UserX, Building2, ArrowLeft,
  Shield, RefreshCw, AlertTriangle, Trash2,
  ChevronLeft, ChevronRight, SlidersHorizontal,
  Eye, EyeOff, Info,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

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
  HOC_VIEN: 'bg-sky-50 text-sky-700 border border-sky-200 dark:bg-sky-900/20 dark:text-sky-300 dark:border-sky-700',
  HOC_VIEN_SINH_VIEN: 'bg-cyan-50 text-cyan-700 border border-cyan-200 dark:bg-cyan-900/20 dark:text-cyan-300 dark:border-cyan-700',
  GIANG_VIEN: 'bg-violet-50 text-violet-700 border border-violet-200 dark:bg-violet-900/20 dark:text-violet-300 dark:border-violet-700',
  NGHIEN_CUU_VIEN: 'bg-teal-50 text-teal-700 border border-teal-200 dark:bg-teal-900/20 dark:text-teal-300 dark:border-teal-700',
  CHU_NHIEM_BO_MON: 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-700',
  CHI_HUY_BO_MON: 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-700',
  CHI_HUY_KHOA_PHONG: 'bg-orange-50 text-orange-700 border border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-700',
  CHI_HUY_HE: 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-700',
  CHI_HUY_TIEU_DOAN: 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-700',
  CHI_HUY_BAN: 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-700',
  CHI_HUY_HOC_VIEN: 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-900/20 dark:text-rose-300 dark:border-rose-700',
  QUAN_TRI_HE_THONG: 'bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-300 dark:border-indigo-700',
  ADMIN: 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-700',
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

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(-2)
    .map((w) => w[0].toUpperCase())
    .join('');
}

const AVATAR_COLORS = [
  'bg-indigo-500', 'bg-violet-500', 'bg-blue-500', 'bg-teal-500',
  'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-pink-500',
];

function avatarColorFor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function UserAvatar({ name }: { name: string }) {
  return (
    <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0', avatarColorFor(name))}>
      {getInitials(name)}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'ACTIVE') return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-700">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
      Hoạt động
    </span>
  );
  if (status === 'SUSPENDED') return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-700">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
      Đình chỉ
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-700">
      <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
      Bị khóa
    </span>
  );
}

function RoleSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
      <SelectContent className="max-h-[320px]">
        {ROLE_OPTIONS.map(group => (
          <div key={group.group}>
            <div className="px-2 py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{group.group}</div>
            {group.items.map(item => (
              <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
            ))}
            <Separator className="my-1" />
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
      <SelectTrigger className="h-9"><SelectValue placeholder="Chọn quân hàm" /></SelectTrigger>
      <SelectContent className="max-h-[280px]">
        <SelectItem value="none">-- Không chọn --</SelectItem>
        {['BIEN_CHE', 'SI_QUAN', 'HOC_VIEN', 'CNVQP'].map(cat => {
          const catRanks = ranks.filter(r => r.category === cat);
          if (!catRanks.length) return null;
          return (
            <div key={cat}>
              <div className="px-2 py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{RANK_CATS[cat]}</div>
              {catRanks.map((r: any) => <SelectItem key={r.shortCode} value={r.name}>{r.name}</SelectItem>)}
            </div>
          );
        })}
      </SelectContent>
    </Select>
  );
}

function FormSection({ title, children, accent }: { title: string; children: React.ReactNode; accent?: string }) {
  return (
    <div className={cn('rounded-xl border p-4 space-y-3', accent || 'bg-muted/20')}>
      <h4 className="text-sm font-semibold text-foreground">{title}</h4>
      {children}
    </div>
  );
}

function FormField({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-foreground/80">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
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
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ totalPages: 1, total: 0 });
  const [stats, setStats] = useState<UserStats>({
    totalUsers: 0, activeUsers: 0, lockedUsers: 0, usersWithUnit: 0, roleDistribution: [],
  });

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [isDeactivateOpen, setIsDeactivateOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [deactivateInfo, setDeactivateInfo] = useState<any>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const [formData, setFormData] = useState({
    name: '', email: '', password: '', role: 'HOC_VIEN',
    militaryId: '', rank: '', position: '', phone: '', unitId: '', status: 'ACTIVE',
  });
  const [newPassword, setNewPassword] = useState('');

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

  useEffect(() => {
    const unitIdFromUrl = searchParams.get('unitId');
    if (unitIdFromUrl) setUnitIdFilter(unitIdFromUrl);
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/rbac/users/stats');
      const data = await res.json();
      if (res.ok) setStats(data);
    } catch { /* non-fatal */ }
  }, []);

  const fetchUsers = useCallback(async (opts: { search: string; role: string; status: string; unitId: string; page: number }) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: opts.page.toString(),
        limit: '20',
        ...(opts.search && { search: opts.search }),
        ...(opts.role !== 'ALL' && { role: opts.role }),
        ...(opts.status !== 'ALL' && { status: opts.status }),
        ...(opts.unitId !== 'ALL' && { unitId: opts.unitId }),
      });
      const res = await fetch(`/api/admin/rbac/users?${params}`);
      const data = await res.json();
      if (res.ok) {
        setUsers(data.data || []);
        setPagination({
          totalPages: data.pagination?.totalPages ?? 1,
          total: data.pagination?.total ?? 0,
        });
      } else {
        toast.error(data.error || 'Không thể tải danh sách người dùng');
      }
    } catch {
      toast.error('Lỗi kết nối khi tải danh sách người dùng');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUnits = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/units?flat=true');
      const data = await res.json();
      if (res.ok) setUnits(data.data || []);
    } catch { console.error('Failed to fetch units'); }
  }, []);

  const fetchPositions = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/rbac/positions');
      const data = await res.json();
      if (res.ok) setPositions(data.positions?.filter((p: any) => p.isActive) || []);
    } catch { console.error('Failed to fetch positions'); }
  }, []);

  const fetchRanks = useCallback(async () => {
    try {
      const res = await fetch('/api/master-data/ranks');
      const data = await res.json();
      if (res.ok && data.data) setRanks(data.data);
    } catch { console.error('Failed to fetch ranks'); }
  }, []);

  useEffect(() => {
    fetchStats();
    fetchUnits();
    fetchPositions();
    fetchRanks();
  }, [fetchStats, fetchUnits, fetchPositions, fetchRanks]);

  // Single effect — fires immediately whenever any filter or page changes
  useEffect(() => {
    fetchUsers({ search, role: roleFilter, status: statusFilter, unitId: unitIdFilter, page });
  }, [fetchUsers, search, roleFilter, statusFilter, unitIdFilter, page]);

  const refreshData = useCallback(() => {
    fetchUsers({ search, role: roleFilter, status: statusFilter, unitId: unitIdFilter, page });
    fetchStats();
  }, [fetchUsers, fetchStats, search, roleFilter, statusFilter, unitIdFilter, page]);

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
        toast.error(data.error || data.message || 'Không thể tạo tài khoản', {
          description: res.status >= 500 ? `Lỗi hệ thống (${res.status})` : `HTTP ${res.status}`,
        });
      }
    } catch {
      toast.error('Lỗi kết nối', { description: 'Không thể tạo tài khoản. Kiểm tra kết nối mạng.' });
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
        toast.success('Cập nhật tài khoản thành công!');
        setIsEditOpen(false);
        refreshData();
      } else {
        toast.error(data.error || data.message || 'Không thể cập nhật tài khoản', {
          description: res.status >= 500 ? `Lỗi hệ thống (${res.status})` : `HTTP ${res.status}`,
        });
      }
    } catch {
      toast.error('Lỗi kết nối', { description: 'Không thể cập nhật tài khoản. Kiểm tra kết nối mạng.' });
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
        setDeactivateInfo({ userId: id, ...data });
        setIsDeactivateOpen(true);
      } else {
        toast.error(data.error || data.message || 'Không thể xóa người dùng', {
          description: res.status >= 500 ? `Lỗi hệ thống (${res.status})` : `HTTP ${res.status}`,
        });
      }
    } catch {
      toast.error('Lỗi kết nối', { description: 'Không thể xóa người dùng. Kiểm tra kết nối mạng.' });
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
        toast.error(data.error || data.message || 'Không thể vô hiệu hóa tài khoản', {
          description: `HTTP ${res.status}`,
        });
      }
    } catch {
      toast.error('Lỗi kết nối', { description: 'Không thể vô hiệu hóa tài khoản.' });
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
        toast.error(data.error || data.message || 'Không thể thay đổi trạng thái', {
          description: `HTTP ${res.status}`,
        });
      }
    } catch {
      toast.error('Lỗi kết nối', { description: 'Không thể thay đổi trạng thái tài khoản.' });
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
        toast.success('Đã đặt lại mật khẩu thành công');
        setIsResetOpen(false);
        setNewPassword('');
      } else {
        toast.error(data.error || data.message || 'Không thể đặt lại mật khẩu', {
          description: `HTTP ${res.status}`,
        });
      }
    } catch {
      toast.error('Lỗi kết nối', { description: 'Không thể đặt lại mật khẩu.' });
    }
  };

  const resetForm = () => {
    setFormData({ name: '', email: '', password: '', role: 'HOC_VIEN', militaryId: '', rank: '', position: '', phone: '', unitId: '', status: 'ACTIVE' });
    setShowPassword(false);
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

  const isFiltered = search || roleFilter !== 'ALL' || statusFilter !== 'ALL' || unitIdFilter !== 'ALL';
  const activePercent = stats.totalUsers > 0 ? Math.round((stats.activeUsers / stats.totalUsers) * 100) : 0;
  const unitPercent = stats.totalUsers > 0 ? Math.round((stats.usersWithUnit / stats.totalUsers) * 100) : 0;

  const userFormFields = (isCreate: boolean) => (
    <div className="space-y-3">
      {isCreate && (
        <FormSection title="Thông tin đăng nhập" accent="bg-primary/5 border-primary/20">
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Email đăng nhập" required hint="Dùng để đăng nhập hệ thống">
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                placeholder="nguyenvana@hvhc.edu.vn"
                className="h-9"
              />
            </FormField>
            <FormField label="Mật khẩu" required hint="Tối thiểu 6 ký tự">
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  minLength={6}
                  placeholder="••••••••"
                  className="h-9 pr-9"
                />
                <button
                  type="button"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </FormField>
          </div>
        </FormSection>
      )}

      <FormSection title="Thông tin cá nhân">
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Họ và tên" required>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder="Nguyễn Văn A"
              className="h-9"
            />
          </FormField>
          <FormField label="Số điện thoại">
            <Input
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="0912345678"
              className="h-9"
            />
          </FormField>
          {!isCreate && (
            <FormField label="Email đăng nhập" hint="Không thể thay đổi email">
              <Input type="email" value={formData.email} disabled className="h-9 opacity-60 cursor-not-allowed" />
            </FormField>
          )}
        </div>
      </FormSection>

      <FormSection title="Thông tin quân sự">
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Mã quân nhân">
            <Input
              value={formData.militaryId}
              onChange={(e) => setFormData({ ...formData, militaryId: e.target.value })}
              placeholder="QN123456"
              className="h-9"
            />
          </FormField>
          <FormField label="Quân hàm">
            <RankSelect value={formData.rank} ranks={ranks} onChange={(v) => setFormData({ ...formData, rank: v })} />
          </FormField>
          <div className="col-span-2">
            <FormField label="Chức vụ">
              <Select
                value={formData.position && positions.find((p: any) => p.name === formData.position) ? formData.position : 'none'}
                onValueChange={(v) => setFormData({ ...formData, position: v === 'none' ? '' : v })}
              >
                <SelectTrigger className="h-9"><SelectValue placeholder="Chọn chức vụ..." /></SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  <SelectItem value="none">-- Không chọn --</SelectItem>
                  {positions.map((pos: any) => (
                    <SelectItem key={pos.id} value={pos.name}>{pos.name} ({pos.code})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          </div>
        </div>
      </FormSection>

      <FormSection title="Phân bổ & Vai trò">
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Đơn vị" required={isCreate} hint={isCreate ? 'Bắt buộc phải gán đơn vị' : undefined}>
            <Select
              value={formData.unitId || 'none'}
              onValueChange={(v) => setFormData({ ...formData, unitId: v === 'none' ? '' : v })}
            >
              <SelectTrigger className={cn('h-9', isCreate && !formData.unitId && 'border-destructive ring-1 ring-destructive')}>
                <SelectValue placeholder={isCreate ? '⚠ Chọn đơn vị' : 'Chọn đơn vị...'} />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {!isCreate && <SelectItem value="none">-- Không thuộc đơn vị nào --</SelectItem>}
                {units.map((unit: any) => (
                  <SelectItem key={unit.id} value={unit.id}>
                    {'　'.repeat(Math.max(0, unit.level - 1))}{unit.code} — {unit.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Vai trò hệ thống" required>
            <RoleSelect value={formData.role} onChange={(v) => setFormData({ ...formData, role: v })} />
          </FormField>
          {!isCreate && (
            <div className="col-span-2">
              <FormField label="Trạng thái tài khoản">
                <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        Hoạt động
                      </span>
                    </SelectItem>
                    <SelectItem value="INACTIVE">
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-red-500" />
                        Bị khóa
                      </span>
                    </SelectItem>
                    <SelectItem value="SUSPENDED">
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-500" />
                        Tạm đình chỉ
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </FormField>
            </div>
          )}
        </div>
      </FormSection>
    </div>
  );

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      {/* Header Banner */}
      <div className="relative rounded-2xl overflow-hidden text-white bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 shadow-lg">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,.05) 10px, rgba(255,255,255,.05) 20px)' }} />
        <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-10">
          <Users className="h-24 w-24" />
        </div>
        <div className="relative px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Link href="/dashboard/admin" className="flex items-center gap-1 text-indigo-100 hover:text-white text-sm transition-colors">
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Quản trị hệ thống
                </Link>
                <span className="text-indigo-300">/</span>
                <span className="text-sm text-white font-medium">Người dùng</span>
              </div>
              <h1 className="text-2xl font-bold flex items-center gap-3">
                <Users className="h-6 w-6 text-indigo-100" />
                Quản lý Người dùng
              </h1>
              <p className="text-indigo-100 mt-1 text-sm">Quản lý tài khoản, vai trò và trạng thái toàn hệ thống</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={refreshData}
                className="border-white/40 bg-white/20 text-white hover:bg-white/30 h-9">
                <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Làm mới
              </Button>
              <Button onClick={() => { resetForm(); setIsAddOpen(true); }}
                className="bg-white text-indigo-700 hover:bg-indigo-50 font-semibold h-9 shadow-sm">
                <UserPlus className="w-3.5 h-3.5 mr-1.5" /> Thêm người dùng
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Tổng người dùng', value: stats.totalUsers, icon: Users, color: 'bg-indigo-100 text-indigo-600', sub: 'Tài khoản trong hệ thống', progress: null },
          { label: 'Đang hoạt động', value: stats.activeUsers, icon: UserCheck, color: 'bg-emerald-100 text-emerald-600', sub: null, progress: activePercent },
          { label: 'Bị khóa / đình chỉ', value: stats.lockedUsers, icon: UserX, color: 'bg-red-100 text-red-600', sub: 'Tài khoản khóa / đình chỉ', progress: null },
          { label: 'Có đơn vị', value: stats.usersWithUnit, icon: Building2, color: 'bg-amber-100 text-amber-600', sub: null, progress: unitPercent },
        ].map(({ label, value, icon: Icon, color, sub, progress }) => (
          <div key={label} className="rounded-xl border bg-white p-4 flex items-start gap-3 shadow-sm hover:shadow-md transition-shadow">
            <div className={`rounded-lg p-2.5 ${color} flex-shrink-0`}><Icon className="h-5 w-5" /></div>
            <div className="flex-1 min-w-0">
              <p className="text-2xl font-bold text-slate-900">{value}</p>
              <p className="text-sm text-slate-500 mt-0.5">{label}</p>
              {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
              {progress !== null && (
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full rounded-full bg-current transition-all opacity-60" style={{ width: `${progress}%` }} />
                  </div>
                  <span className="text-xs text-slate-500 font-medium">{progress}%</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-50 rounded-xl border p-4 flex flex-wrap gap-3 items-end">
        <div className="flex items-center gap-2 self-center mr-1">
          <SlidersHorizontal className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-500">Lọc:</span>
        </div>
        <div className="flex-1 min-w-[220px]">
          <label className="text-xs font-medium text-slate-500 mb-1.5 block">Tìm kiếm</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <Input
              placeholder="Tên, email, mã quân nhân..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-9 h-9 bg-white"
            />
          </div>
        </div>
        <div className="w-[200px]">
          <label className="text-xs font-medium text-slate-500 mb-1.5 block">Đơn vị</label>
          <Select value={unitIdFilter} onValueChange={(v) => { setUnitIdFilter(v); setPage(1); }}>
            <SelectTrigger className="h-9 bg-white">
              <SelectValue placeholder="Tất cả đơn vị" />
            </SelectTrigger>
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
          <label className="text-xs font-medium text-slate-500 mb-1.5 block">Vai trò</label>
          <Select value={roleFilter} onValueChange={(v) => { setRoleFilter(v); setPage(1); }}>
            <SelectTrigger className="h-9 bg-white">
              <SelectValue placeholder="Tất cả vai trò" />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              <SelectItem value="ALL">Tất cả vai trò</SelectItem>
              {ROLE_OPTIONS.flatMap(g => g.items).map(item => (
                <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-[155px]">
          <label className="text-xs font-medium text-slate-500 mb-1.5 block">Trạng thái</label>
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
            <SelectTrigger className="h-9 bg-white">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tất cả</SelectItem>
              <SelectItem value="ACTIVE">Hoạt động</SelectItem>
              <SelectItem value="INACTIVE">Bị khóa</SelectItem>
              <SelectItem value="SUSPENDED">Tạm đình chỉ</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {isFiltered && (
          <div className="flex items-end gap-2 pb-0.5">
            <Badge variant="secondary" className="text-xs px-2.5 py-1 rounded-full font-medium h-9 flex items-center">
              {pagination.total} kết quả
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              className="h-9 px-3 text-xs text-slate-500 hover:text-slate-800"
              onClick={() => {
                setSearch('');
                setRoleFilter('ALL');
                setStatusFilter('ALL');
                setUnitIdFilter('ALL');
                setPage(1);
              }}
            >
              Xóa bộ lọc
            </Button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-slate-800">Danh sách người dùng</h3>
            {!loading && (
              <Badge variant="outline" className="text-xs font-normal">
                {pagination.total} tài khoản
              </Badge>
            )}
          </div>
          <span className="text-xs text-slate-500">
            Trang {page} / {pagination.totalPages}
          </span>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 hover:bg-slate-50">
                <TableHead className="font-semibold text-xs uppercase tracking-wide text-slate-600 w-[240px]">Người dùng</TableHead>
                <TableHead className="font-semibold text-xs uppercase tracking-wide text-slate-600">Email</TableHead>
                <TableHead className="font-semibold text-xs uppercase tracking-wide text-slate-600">Vai trò</TableHead>
                <TableHead className="font-semibold text-xs uppercase tracking-wide text-slate-600">Đơn vị</TableHead>
                <TableHead className="font-semibold text-xs uppercase tracking-wide text-slate-600">Trạng thái</TableHead>
                <TableHead className="font-semibold text-xs uppercase tracking-wide text-slate-600 text-right w-[140px]">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
                        <div className="space-y-1.5">
                          <div className="h-3.5 w-28 bg-muted rounded animate-pulse" />
                          <div className="h-2.5 w-16 bg-muted rounded animate-pulse" />
                        </div>
                      </div>
                    </TableCell>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <TableCell key={j}><div className="h-4 bg-muted rounded animate-pulse" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-16">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                        <Users className="h-6 w-6 text-muted-foreground/40" />
                      </div>
                      <div>
                        <p className="font-medium text-muted-foreground">Không có dữ liệu</p>
                        <p className="text-sm text-muted-foreground/60 mt-0.5">
                          {isFiltered ? 'Thử thay đổi bộ lọc' : 'Chưa có người dùng nào'}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : users.map((user) => (
                <TableRow key={user.id} className="hover:bg-slate-50 transition-colors group">
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <UserAvatar name={user.name} />
                      <div>
                        <div className="font-medium text-sm leading-tight">{user.name}</div>
                        {user.militaryId && (
                          <div className="text-[11px] font-mono text-muted-foreground mt-0.5">{user.militaryId}</div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{user.email}</TableCell>
                  <TableCell>
                    <span className={cn('text-xs font-medium px-2.5 py-1 rounded-full', ROLE_COLOR[user.role] || 'bg-muted text-muted-foreground')}>
                      {ROLE_LABEL[user.role] || user.role}
                    </span>
                  </TableCell>
                  <TableCell>
                    {user.unitRelation ? (
                      <div>
                        <div className="text-sm leading-tight">{user.unitRelation.name}</div>
                        <span className="text-[11px] font-mono text-muted-foreground">{user.unitRelation.code}</span>
                      </div>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs bg-destructive/8 text-destructive/80 px-2 py-0.5 rounded-full border border-destructive/20">
                        Chưa gán
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={user.status} />
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end items-center gap-0.5 opacity-70 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="sm" variant="ghost"
                        className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20 dark:hover:text-blue-400 rounded-lg"
                        title="Chỉnh sửa thông tin"
                        onClick={() => openEditDialog(user)}
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="sm" variant="ghost"
                        className={cn(
                          'h-8 w-8 p-0 rounded-lg',
                          user.status === 'ACTIVE'
                            ? 'hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-amber-900/20 dark:hover:text-amber-400'
                            : 'hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-900/20 dark:hover:text-emerald-400'
                        )}
                        title={user.status === 'ACTIVE' ? 'Khóa tài khoản' : 'Mở khóa'}
                        onClick={() => handleToggleStatus(user.id, user.status)}
                      >
                        {user.status === 'ACTIVE'
                          ? <Lock className="w-3.5 h-3.5" />
                          : <Unlock className="w-3.5 h-3.5" />}
                      </Button>
                      <Button
                        size="sm" variant="ghost"
                        className="h-8 w-8 p-0 hover:bg-violet-50 hover:text-violet-600 dark:hover:bg-violet-900/20 dark:hover:text-violet-400 rounded-lg"
                        title="Đổi mật khẩu"
                        onClick={() => { setSelectedUser(user); setNewPassword(''); setShowNewPassword(false); setIsResetOpen(true); }}
                      >
                        <Key className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="sm" variant="ghost"
                        className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400 rounded-lg"
                        title="Xóa người dùng"
                        onClick={() => handleDelete(user.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
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
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-500">
          Hiển thị <span className="font-medium text-slate-800">{users.length}</span> / <span className="font-medium text-slate-800">{pagination.total}</span> người dùng
        </span>
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline" size="sm"
            className="h-8 w-8 p-0 rounded-lg"
            onClick={() => setPage(p => p - 1)}
            disabled={page <= 1}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
            const pageNum = pagination.totalPages <= 5
              ? i + 1
              : page <= 3
                ? i + 1
                : page >= pagination.totalPages - 2
                  ? pagination.totalPages - 4 + i
                  : page - 2 + i;
            return (
              <Button
                key={pageNum}
                variant={pageNum === page ? 'default' : 'outline'}
                size="sm"
                className={cn('h-8 w-8 p-0 rounded-lg text-xs',
                  pageNum === page && 'bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-600'
                )}
                onClick={() => setPage(pageNum)}
              >
                {pageNum}
              </Button>
            );
          })}
          <Button
            variant="outline" size="sm"
            className="h-8 w-8 p-0 rounded-lg"
            onClick={() => setPage(p => p + 1)}
            disabled={page >= pagination.totalPages}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Add Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto">
          <DialogHeader className="pb-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                <UserPlus className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <DialogTitle className="text-lg">Thêm người dùng mới</DialogTitle>
                <DialogDescription className="text-xs mt-0.5">Mọi nhân sự phải được gán vào một đơn vị</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <Separator />
          <form onSubmit={handleCreate} className="space-y-4">
            {userFormFields(true)}
            <Separator />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)} className="h-9">Hủy</Button>
              <Button
                type="submit"
                disabled={!formData.unitId || !formData.email || !formData.name || !formData.password}
                className="h-9 bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                <UserPlus className="w-4 h-4 mr-1.5" />
                Tạo tài khoản
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto">
          <DialogHeader className="pb-2">
            <div className="flex items-center gap-3">
              {selectedUser && <UserAvatar name={selectedUser.name} />}
              <div>
                <DialogTitle className="text-lg">Chỉnh sửa tài khoản</DialogTitle>
                <DialogDescription className="text-xs mt-0.5">{selectedUser?.name} · {selectedUser?.email}</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <Separator />
          <form onSubmit={handleUpdate} className="space-y-4">
            {userFormFields(false)}
            <Separator />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)} className="h-9">Hủy</Button>
              <Button type="submit" className="h-9 bg-indigo-600 hover:bg-indigo-700 text-white">
                <Shield className="w-4 h-4 mr-1.5" />
                Lưu thay đổi
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={isResetOpen} onOpenChange={setIsResetOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
                <Key className="w-5 h-5 text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <DialogTitle className="text-base">Đặt lại mật khẩu</DialogTitle>
                <DialogDescription className="text-xs mt-0.5">
                  {selectedUser?.name} · {selectedUser?.email}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <Separator />
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="rounded-xl bg-amber-50 border border-amber-200 dark:bg-amber-900/10 dark:border-amber-700 p-3 flex gap-2.5">
              <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-amber-700 dark:text-amber-300">
                Mật khẩu mới sẽ được áp dụng ngay lập tức. Người dùng cần đăng nhập lại.
              </p>
            </div>
            <FormField label="Mật khẩu mới" required hint="Tối thiểu 6 ký tự">
              <div className="relative">
                <Input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="••••••••"
                  className="h-9 pr-9"
                />
                <button
                  type="button"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {newPassword.length > 0 && newPassword.length < 6 && (
                <p className="text-xs text-destructive mt-1">Mật khẩu quá ngắn (tối thiểu 6 ký tự)</p>
              )}
            </FormField>
            <Separator />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsResetOpen(false)} className="h-9">Hủy</Button>
              <Button type="submit" disabled={newPassword.length < 6} className="h-9 bg-violet-600 hover:bg-violet-700 text-white">
                <Key className="w-4 h-4 mr-1.5" />
                Đặt lại mật khẩu
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Deactivate Conflict Dialog */}
      <Dialog open={isDeactivateOpen} onOpenChange={setIsDeactivateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <DialogTitle className="text-base text-amber-700 dark:text-amber-400">Không thể xóa tài khoản</DialogTitle>
                <DialogDescription className="text-xs mt-0.5">
                  {deactivateInfo?.user?.name} — tài khoản có dữ liệu liên kết
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <Separator />
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">{deactivateInfo?.suggestion}</p>
            {deactivateInfo?.constraints?.length > 0 && (
              <div className="rounded-xl border bg-muted/30 p-3 space-y-1.5">
                {deactivateInfo.constraints.map((c: string, i: number) => (
                  <p key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                    <span className="text-amber-500 mt-0.5 flex-shrink-0">•</span> {c}
                  </p>
                ))}
              </div>
            )}
          </div>
          <Separator />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsDeactivateOpen(false)} className="h-9">Hủy</Button>
            <Button onClick={handleForceDeactivate} className="h-9 bg-amber-600 hover:bg-amber-700 text-white">
              <Lock className="w-4 h-4 mr-1.5" />
              Vô hiệu hóa tài khoản
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
