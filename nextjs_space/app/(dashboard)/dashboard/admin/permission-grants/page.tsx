/**
 * Permission Grants Management Page
 * Quản lý phân quyền hồ sơ cán bộ - Phase 3
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Shield,
  Plus,
  Search,
  UserCheck,
  Clock,
  Building2,
  Users,
  AlertTriangle,
  RefreshCw,
  Trash2,
  Loader2,
  CheckCircle2,
  XCircle,
  ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

const PERMISSION_LABELS: Record<string, { label: string; color: string }> = {
  PERSONNEL_VIEW: { label: 'Xem hồ sơ', color: 'bg-blue-100 text-blue-800' },
  PERSONNEL_EDIT: { label: 'Sửa hồ sơ', color: 'bg-green-100 text-green-800' },
  PERSONNEL_EDIT_SENSITIVE: { label: 'Sửa nhạy cảm', color: 'bg-red-100 text-red-800' },
  PERSONNEL_EXPORT: { label: 'Xuất dữ liệu', color: 'bg-purple-100 text-purple-800' },
  PERSONNEL_DELETE: { label: 'Xóa hồ sơ', color: 'bg-orange-100 text-orange-800' },
  PERSONNEL_APPROVE: { label: 'Duyệt thay đổi', color: 'bg-yellow-100 text-yellow-800' },
};

const SCOPE_LABELS: Record<string, { label: string; icon: any }> = {
  ALL: { label: 'Toàn hệ thống', icon: Shield },
  UNIT: { label: 'Theo đơn vị', icon: Building2 },
  PERSONNEL: { label: 'Cá nhân cụ thể', icon: Users },
  SELF: { label: 'Chỉ bản thân', icon: UserCheck },
};

interface Grant {
  id: string;
  userId: string;
  permission: string;
  scopeType: string;
  unitId?: string;
  expiresAt?: string;
  reason?: string;
  grantedAt: string;
  isRevoked: boolean;
  revokedAt?: string;
  revokedReason?: string;
  user: { id: string; name: string; email: string; rank?: string; position?: string };
  grantedBy: { id: string; name: string };
  personnel?: { id: string; name: string; email: string; rank?: string }[];
}

interface Stats {
  totals: { active: number; expired: number; revoked: number; all: number };
  usersWithGrants: number;
  expiringSoon: number;
  byPermission: Record<string, number>;
  byScope: Record<string, number>;
}

interface User {
  id: string;
  name: string;
  email: string;
  rank?: string;
  position?: string;
}

interface Unit {
  id: string;
  name: string;
  code?: string;
}

export default function PermissionGrantsPage() {
  const { data: session } = useSession() || {};

  // Data states
  const [grants, setGrants] = useState<Grant[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });

  // Filter states
  const [statusFilter, setStatusFilter] = useState('active');
  const [permissionFilter, setPermissionFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Form states
  const [formOpen, setFormOpen] = useState(false);
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false);
  const [selectedGrant, setSelectedGrant] = useState<Grant | null>(null);
  const [revokeReason, setRevokeReason] = useState('');

  // Form data
  const [formData, setFormData] = useState({
    userId: '',
    permission: '',
    scopeType: '',
    unitId: '',
    personnelIds: [] as string[],
    expiresAt: '',
    reason: '',
  });

  // Fetch grants
  const fetchGrants = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(pagination.page),
        limit: String(pagination.limit),
        status: statusFilter,
        ...(permissionFilter !== 'ALL' && { permission: permissionFilter }),
      });

      const res = await fetch(`/api/admin/permission-grants?${params}`);
      if (res.ok) {
        const data = await res.json();
        setGrants(data.data || []);
        setPagination(p => ({ ...p, total: data.pagination?.total || 0 }));
      }
    } catch (error) {
      console.error('Error fetching grants:', error);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, statusFilter, permissionFilter]);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/permission-grants/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, []);

  // Fetch users and units for form
  const fetchFormData = useCallback(async () => {
    try {
      const [usersRes, unitsRes] = await Promise.all([
        fetch('/api/admin/rbac/users?limit=500'),
        fetch('/api/admin/units'),
      ]);

      if (usersRes.ok) {
        const data = await usersRes.json();
        setUsers(data.users || []);
      }
      if (unitsRes.ok) {
        const data = await unitsRes.json();
        setUnits(data.data || data.units || []);
      }
    } catch (error) {
      console.error('Error fetching form data:', error);
    }
  }, []);

  useEffect(() => {
    fetchGrants();
    fetchStats();
    fetchFormData();
  }, [fetchGrants, fetchStats, fetchFormData]);

  // Create grant
  const handleCreate = async () => {
    if (!formData.userId || !formData.permission || !formData.scopeType) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/admin/permission-grants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          expiresAt: formData.expiresAt || null,
          unitId: formData.scopeType === 'UNIT' ? formData.unitId : null,
          personnelIds: formData.scopeType === 'PERSONNEL' ? formData.personnelIds : [],
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success('Cấp quyền thành công');
      setFormOpen(false);
      resetForm();
      fetchGrants();
      fetchStats();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Revoke grant
  const handleRevoke = async () => {
    if (!selectedGrant) return;

    setLoading(true);
    try {
      const params = new URLSearchParams({
        id: selectedGrant.id,
        ...(revokeReason && { reason: revokeReason }),
      });

      const res = await fetch(`/api/admin/permission-grants?${params}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success('Thu hồi quyền thành công');
      setRevokeDialogOpen(false);
      setSelectedGrant(null);
      setRevokeReason('');
      fetchGrants();
      fetchStats();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      userId: '',
      permission: '',
      scopeType: '',
      unitId: '',
      personnelIds: [],
      expiresAt: '',
      reason: '',
    });
  };

  const getStatusBadge = (grant: Grant) => {
    if (grant.isRevoked) {
      return <Badge variant="destructive">Thu hồi</Badge>;
    }
    if (grant.expiresAt && new Date(grant.expiresAt) < new Date()) {
      return <Badge variant="secondary">Hết hạn</Badge>;
    }
    return <Badge className="bg-green-500">Hiệu lực</Badge>;
  };

  return (
    <div className="space-y-6 p-6">
      {/* Indigo Banner */}
      <div className="relative rounded-2xl overflow-hidden text-white bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,.05) 10px, rgba(255,255,255,.05) 20px)' }} />
        <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-10"><Shield className="h-24 w-24" /></div>
        <div className="relative px-8 py-6">
          <Link href="/dashboard/admin"
            className="inline-flex items-center gap-1.5 text-indigo-100 hover:text-white text-sm mb-3 transition-colors">
            <ArrowLeft className="h-4 w-4" />Quản trị hệ thống
          </Link>
          <div className="flex items-end justify-between">
            <div>
              <h1 className="text-2xl font-bold">Phân quyền Hồ sơ Cán bộ</h1>
              <p className="text-indigo-100 text-sm mt-1">Quản lý quyền truy cập và chỉnh sửa hồ sơ cán bộ theo QĐ 144/BQP</p>
            </div>
            <Button onClick={() => setFormOpen(true)}
              className="bg-white text-indigo-700 hover:bg-indigo-50 font-semibold">
              <Plus className="h-4 w-4 mr-2" />Cấp quyền mới
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Tiles */}
      {stats && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {[
            { label: 'Hiệu lực', value: stats.totals.active, icon: CheckCircle2, color: 'bg-emerald-100 text-emerald-600' },
            { label: 'Hết hạn', value: stats.totals.expired, icon: Clock, color: 'bg-slate-100 text-slate-600' },
            { label: 'Thu hồi', value: stats.totals.revoked, icon: XCircle, color: 'bg-red-100 text-red-600' },
            { label: 'Người dùng', value: stats.usersWithGrants, icon: Users, color: 'bg-indigo-100 text-indigo-600' },
            { label: 'Sắp hết hạn', value: stats.expiringSoon, icon: AlertTriangle, color: stats.expiringSoon > 0 ? 'bg-yellow-100 text-yellow-600' : 'bg-slate-100 text-slate-400', sub: 'trong 7 ngày' },
          ].map(({ label, value, icon: Icon, color, sub }) => (
            <div key={label} className="rounded-xl border bg-white p-4 flex items-start gap-3 shadow-sm">
              <div className={`rounded-lg p-2.5 ${color}`}><Icon className="h-5 w-5" /></div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{value}</p>
                <p className="text-sm text-slate-500 mt-0.5">{label}</p>
                {sub && <p className="text-xs text-slate-400">{sub}</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-slate-50 rounded-xl border p-4 flex flex-wrap gap-3 items-center">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input placeholder="Tìm theo tên, email..."
            value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white" />
        </div>
        <div className="w-[150px]">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="bg-white"><SelectValue placeholder="Trạng thái" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Hiệu lực</SelectItem>
              <SelectItem value="expired">Hết hạn</SelectItem>
              <SelectItem value="revoked">Đã thu hồi</SelectItem>
              <SelectItem value="all">Tất cả</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="w-[180px]">
          <Select value={permissionFilter} onValueChange={setPermissionFilter}>
            <SelectTrigger className="bg-white"><SelectValue placeholder="Loại quyền" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tất cả quyền</SelectItem>
              {Object.entries(PERMISSION_LABELS).map(([key, { label }]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" size="icon" onClick={() => { fetchGrants(); fetchStats(); }} className="bg-white">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Grants Table */}
      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b flex items-center justify-between">
          <h3 className="font-semibold text-slate-800">Danh sách quyền đã cấp</h3>
          <span className="text-sm text-slate-500">Quản lý các quyền đã cấp cho người dùng</span>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead className="font-semibold text-slate-600">Người dùng</TableHead>
              <TableHead className="font-semibold text-slate-600">Quyền</TableHead>
              <TableHead className="font-semibold text-slate-600">Phạm vi</TableHead>
              <TableHead className="font-semibold text-slate-600">Thời hạn</TableHead>
              <TableHead className="font-semibold text-slate-600">Trạng thái</TableHead>
              <TableHead className="font-semibold text-slate-600">Người cấp</TableHead>
              <TableHead className="font-semibold text-slate-600 text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-indigo-500" />
                </TableCell>
              </TableRow>
            ) : grants.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-14">
                  <Shield className="mx-auto h-10 w-10 text-slate-300 mb-2" />
                  <p className="text-slate-400">Chưa có quyền nào được cấp</p>
                </TableCell>
              </TableRow>
            ) : grants.map((grant) => (
              <TableRow key={grant.id} className={`hover:bg-slate-50 transition-colors ${grant.isRevoked ? 'opacity-50' : ''}`}>
                <TableCell>
                  <p className="font-medium text-slate-900">{grant.user.name}</p>
                  <p className="text-xs text-slate-400">{grant.user.email}</p>
                  {grant.user.rank && <p className="text-xs text-slate-400">{grant.user.rank} - {grant.user.position}</p>}
                </TableCell>
                <TableCell>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${PERMISSION_LABELS[grant.permission]?.color || 'bg-slate-100 text-slate-600'}`}>
                    {PERMISSION_LABELS[grant.permission]?.label || grant.permission}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5 text-sm text-slate-700">
                    {(() => { const ScopeIcon = SCOPE_LABELS[grant.scopeType]?.icon || Shield; return <ScopeIcon className="h-4 w-4 text-slate-400" />; })()}
                    {SCOPE_LABELS[grant.scopeType]?.label || grant.scopeType}
                  </div>
                  {grant.personnel && grant.personnel.length > 0 && (
                    <p className="text-xs text-slate-400 mt-0.5">{grant.personnel.length} cán bộ</p>
                  )}
                </TableCell>
                <TableCell className="text-sm">
                  {grant.expiresAt ? (
                    <div>
                      <p>{format(new Date(grant.expiresAt), 'dd/MM/yyyy', { locale: vi })}</p>
                      {new Date(grant.expiresAt) < new Date() && <p className="text-xs text-red-500">Đã hết hạn</p>}
                    </div>
                  ) : <span className="text-slate-400">Vĩnh viễn</span>}
                </TableCell>
                <TableCell>{getStatusBadge(grant)}</TableCell>
                <TableCell>
                  <p className="text-sm text-slate-700">{grant.grantedBy.name}</p>
                  <p className="text-xs text-slate-400">{format(new Date(grant.grantedAt), 'dd/MM/yyyy HH:mm', { locale: vi })}</p>
                </TableCell>
                <TableCell className="text-right">
                  {!grant.isRevoked && (
                    <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50"
                      onClick={() => { setSelectedGrant(grant); setRevokeDialogOpen(true); }}>
                      <Trash2 className="h-4 w-4 mr-1" />Thu hồi
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Create Grant Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600" />
              Cấp quyền mới
            </DialogTitle>
            <DialogDescription>
              Cấp quyền truy cập/chỉnh sửa hồ sơ cán bộ cho người dùng.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* User Selection */}
            <div className="space-y-2">
              <Label htmlFor="userId">Người dùng *</Label>
              <Select
                value={formData.userId}
                onValueChange={(v) => setFormData({ ...formData, userId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn người dùng" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Permission Selection */}
            <div className="space-y-2">
              <Label htmlFor="permission">Loại quyền *</Label>
              <Select
                value={formData.permission}
                onValueChange={(v) => setFormData({ ...formData, permission: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn quyền" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PERMISSION_LABELS).map(([key, { label }]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formData.permission === 'PERSONNEL_EDIT_SENSITIVE' && (
                <p className="text-xs text-orange-600 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Quyền này cho phép sửa CCCD, BHXH, số thẻ Đảng. Khuyến nghị đặt thời hạn.
                </p>
              )}
            </div>

            {/* Scope Selection */}
            <div className="space-y-2">
              <Label htmlFor="scopeType">Phạm vi *</Label>
              <Select
                value={formData.scopeType}
                onValueChange={(v) => setFormData({ ...formData, scopeType: v, unitId: '', personnelIds: [] })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn phạm vi" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(SCOPE_LABELS).map(([key, { label }]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Unit Selection (if scope = UNIT) */}
            {formData.scopeType === 'UNIT' && (
              <div className="space-y-2">
                <Label htmlFor="unitId">Đơn vị *</Label>
                <Select
                  value={formData.unitId}
                  onValueChange={(v) => setFormData({ ...formData, unitId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn đơn vị" />
                  </SelectTrigger>
                  <SelectContent>
                    {units.map((unit) => (
                      <SelectItem key={unit.id} value={unit.id}>
                        {unit.name} {unit.code && `(${unit.code})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">
                  Bao gồm cả các đơn vị con
                </p>
              </div>
            )}

            {/* Personnel Selection (if scope = PERSONNEL) */}
            {formData.scopeType === 'PERSONNEL' && (
              <div className="space-y-2">
                <Label>Cán bộ cụ thể *</Label>
                <div className="border rounded-lg p-3 max-h-[200px] overflow-y-auto">
                  {users.slice(0, 50).map((user) => (
                    <label key={user.id} className="flex items-center gap-2 py-1 cursor-pointer hover:bg-slate-50/60 transition-colors">
                      <input
                        type="checkbox"
                        checked={formData.personnelIds.includes(user.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({ ...formData, personnelIds: [...formData.personnelIds, user.id] });
                          } else {
                            setFormData({ ...formData, personnelIds: formData.personnelIds.filter(id => id !== user.id) });
                          }
                        }}
                        className="rounded"
                      />
                      <span className="text-sm">{user.name} - {user.email}</span>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-gray-500">
                  Đã chọn: {formData.personnelIds.length} cán bộ
                </p>
              </div>
            )}

            {/* Expires At */}
            <div className="space-y-2">
              <Label htmlFor="expiresAt">Thời hạn (tùy chọn)</Label>
              <Input
                id="expiresAt"
                type="datetime-local"
                value={formData.expiresAt}
                onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
              />
              <p className="text-xs text-gray-500">
                Để trống nếu quyền vĩnh viễn
              </p>
            </div>

            {/* Reason */}
            <div className="space-y-2">
              <Label htmlFor="reason">Lý do cấp quyền</Label>
              <Textarea
                id="reason"
                placeholder="Nhập lý do cấp quyền (nếu có)"
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setFormOpen(false); resetForm(); }}>
              Hủy
            </Button>
            <Button onClick={handleCreate} disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Cấp quyền
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Revoke Confirmation Dialog */}
      <AlertDialog open={revokeDialogOpen} onOpenChange={setRevokeDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Thu hồi quyền</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn thu hồi quyền này? Thao tác này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="revokeReason">Lý do thu hồi</Label>
            <Textarea
              id="revokeReason"
              placeholder="Nhập lý do (tùy chọn)"
              value={revokeReason}
              onChange={(e) => setRevokeReason(e.target.value)}
              rows={2}
              className="mt-2"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setSelectedGrant(null); setRevokeReason(''); }}>
              Hủy
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevoke}
              className="bg-red-600 hover:bg-red-700"
              disabled={loading}
            >
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Thu hồi
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
