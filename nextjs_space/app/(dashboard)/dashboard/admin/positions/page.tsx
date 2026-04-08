/**
 * Trang Quản lý Chức vụ - Redesigned with Indigo Admin Design System
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import {
  Shield, Plus, Trash2, Search, RefreshCw, Edit, Users, Key,
  Building2, Globe, User, AlertTriangle, ArrowLeft, CheckCircle, XCircle,
} from 'lucide-react';
import Link from 'next/link';

interface Position {
  id: string;
  code: string;
  name: string;
  description?: string;
  positionScope?: string;
  scope?: string;
  level?: number;
  isActive: boolean;
  _count?: { positionFunctions: number; userPositions?: number };
}

const SCOPE_OPTIONS = [
  { value: 'SELF', label: 'Cá nhân (SELF)', description: 'Chỉ ảnh hưởng đến bản thân', icon: User, color: 'text-slate-500', bg: 'bg-slate-100 text-slate-700' },
  { value: 'UNIT', label: 'Đơn vị (UNIT)', description: 'Ảnh hưởng đến đơn vị trực thuộc', icon: Building2, color: 'text-blue-500', bg: 'bg-blue-100 text-blue-700' },
  { value: 'DEPARTMENT', label: 'Khoa/Phòng (DEPARTMENT)', description: 'Ảnh hưởng đến toàn khoa/phòng', icon: Building2, color: 'text-emerald-500', bg: 'bg-emerald-100 text-emerald-700' },
  { value: 'ACADEMY', label: 'Học viện (ACADEMY)', description: 'Ảnh hưởng đến toàn học viện', icon: Globe, color: 'text-purple-500', bg: 'bg-purple-100 text-purple-700' },
];

export default function PositionManagementPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [positions, setPositions] = useState<Position[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterScope, setFilterScope] = useState<string>('all');
  const [filterActive, setFilterActive] = useState<string>('all');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    code: '', name: '', description: '', scope: 'UNIT', level: 0, isActive: true
  });

  const fetchPositions = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      const res = await fetch('/api/admin/rbac/positions?withStats=true');
      if (res.ok) {
        const data = await res.json();
        setPositions(data.positions || []);
      }
    } catch (error) {
      toast({ title: 'Lỗi', description: 'Không thể tải danh sách chức vụ', variant: 'destructive' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [toast]);

  useEffect(() => { fetchPositions(); }, [fetchPositions]);

  const handleOpenCreate = () => {
    setSelectedPosition(null);
    setFormData({ code: '', name: '', description: '', scope: 'UNIT', level: 0, isActive: true });
    setDialogOpen(true);
  };

  const handleOpenEdit = (position: Position) => {
    setSelectedPosition(position);
    setFormData({
      code: position.code,
      name: position.name,
      description: position.description || '',
      scope: (position.positionScope || position.scope || 'UNIT').toUpperCase(),
      level: position.level || 0,
      isActive: position.isActive
    });
    setDialogOpen(true);
  };

  const handleOpenDelete = (position: Position) => {
    setSelectedPosition(position);
    setDeleteDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.code || !formData.name) {
      toast({ title: 'Lỗi', description: 'Vui lòng nhập mã và tên chức vụ', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const url = '/api/admin/rbac/positions';
      const method = selectedPosition ? 'PUT' : 'POST';
      const body = selectedPosition ? { id: selectedPosition.id, ...formData } : formData;
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();
      if (res.ok) {
        toast({ title: 'Thành công', description: data.message });
        setDialogOpen(false);
        fetchPositions(true);
      } else {
        toast({ title: 'Lỗi', description: data.error, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Lỗi', description: 'Không thể lưu chức vụ', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedPosition) return;
    try {
      const res = await fetch(`/api/admin/rbac/positions?id=${selectedPosition.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        toast({ title: 'Thành công', description: data.message });
        setDeleteDialogOpen(false);
        fetchPositions(true);
      } else {
        toast({ title: 'Lỗi', description: data.error, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Lỗi', description: 'Không thể xóa chức vụ', variant: 'destructive' });
    }
  };

  const handleToggleActive = async (position: Position) => {
    try {
      const res = await fetch('/api/admin/rbac/positions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: position.id, isActive: !position.isActive })
      });
      if (res.ok) { toast({ title: 'Đã cập nhật trạng thái' }); fetchPositions(true); }
    } catch {
      toast({ title: 'Lỗi', variant: 'destructive' });
    }
  };

  const filteredPositions = positions.filter(p => {
    const matchSearch = searchTerm === '' ||
      p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchScope = filterScope === 'all' || (p.positionScope || p.scope || '').toUpperCase() === filterScope;
    const matchActive = filterActive === 'all' || (filterActive === 'active' ? p.isActive : !p.isActive);
    return matchSearch && matchScope && matchActive;
  });

  const totalPositions = positions.length;
  const activePositions = positions.filter(p => p.isActive).length;
  const totalFunctions = positions.reduce((sum, p) => sum + (p._count?.positionFunctions || 0), 0);
  const totalUsers = positions.reduce((sum, p) => sum + (p._count?.userPositions || 0), 0);

  const getScopeInfo = (scope: string) =>
    SCOPE_OPTIONS.find(s => s.value === scope?.toUpperCase()) || SCOPE_OPTIONS[1];

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-32 rounded-2xl" />
        <div className="grid grid-cols-4 gap-4">{[1,2,3,4].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
        <Skeleton className="h-[400px] rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Indigo Banner */}
      <div className="relative rounded-2xl overflow-hidden text-white bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,.05) 10px, rgba(255,255,255,.05) 20px)' }} />
        <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-10">
          <Shield className="h-24 w-24" />
        </div>
        <div className="relative p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Link href="/dashboard/admin" className="flex items-center gap-1 text-indigo-100 hover:text-white text-sm transition-colors">
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Quản trị hệ thống
                </Link>
                <span className="text-indigo-300">/</span>
                <span className="text-sm text-white font-medium">Chức vụ</span>
              </div>
              <h1 className="text-2xl font-bold flex items-center gap-3">
                <Shield className="h-7 w-7 text-indigo-100" />
                Quản lý Chức vụ
              </h1>
              <p className="text-indigo-100 mt-1 text-sm">Thêm, sửa, xóa các chức vụ trong hệ thống RBAC</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => fetchPositions(true)}
                className="border-white/40 bg-white/20 text-white hover:bg-white/30">
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />Làm mới
              </Button>
              <Button onClick={handleOpenCreate}
                className="bg-white text-indigo-700 hover:bg-indigo-50 font-semibold">
                <Plus className="h-4 w-4 mr-2" />Thêm chức vụ
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Tổng chức vụ', value: totalPositions, icon: Shield, color: 'bg-indigo-100 text-indigo-600' },
          { label: 'Đang hoạt động', value: activePositions, icon: CheckCircle, color: 'bg-emerald-100 text-emerald-600' },
          { label: 'Tổng gán quyền', value: totalFunctions, icon: Key, color: 'bg-blue-100 text-blue-600' },
          { label: 'Người dùng gán', value: totalUsers, icon: Users, color: 'bg-purple-100 text-purple-600' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-xl border bg-white p-4 flex items-start gap-3 shadow-sm">
            <div className={`rounded-lg p-2.5 ${color}`}><Icon className="h-5 w-5" /></div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{value}</p>
              <p className="text-sm text-slate-500 mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-50 rounded-xl border p-4 flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="text-xs font-medium text-slate-500 mb-1.5 block">Tìm kiếm</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Tìm theo mã hoặc tên chức vụ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white"
            />
          </div>
        </div>
        <div className="w-48">
          <label className="text-xs font-medium text-slate-500 mb-1.5 block">Phạm vi</label>
          <Select value={filterScope} onValueChange={setFilterScope}>
            <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả phạm vi</SelectItem>
              {SCOPE_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="w-40">
          <label className="text-xs font-medium text-slate-500 mb-1.5 block">Trạng thái</label>
          <Select value={filterActive} onValueChange={setFilterActive}>
            <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="active">Đang hoạt động</SelectItem>
              <SelectItem value="inactive">Đã tắt</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="text-sm text-slate-500 self-end pb-2">
          Hiển thị <span className="font-semibold text-slate-800">{filteredPositions.length}</span> / {totalPositions} chức vụ
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b bg-slate-50 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-slate-800">Danh sách chức vụ</h3>
            <p className="text-xs text-slate-500 mt-0.5">Quản lý các chức vụ và phạm vi quyền hạn trong hệ thống</p>
          </div>
        </div>
        <ScrollArea className="h-[500px]">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead className="w-36 font-semibold text-slate-600">Mã</TableHead>
                <TableHead className="font-semibold text-slate-600">Tên chức vụ</TableHead>
                <TableHead className="w-44 font-semibold text-slate-600">Phạm vi</TableHead>
                <TableHead className="w-28 text-center font-semibold text-slate-600">Quyền</TableHead>
                <TableHead className="w-28 text-center font-semibold text-slate-600">Người dùng</TableHead>
                <TableHead className="w-28 text-center font-semibold text-slate-600">Trạng thái</TableHead>
                <TableHead className="w-24 text-right font-semibold text-slate-600">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPositions.map((position) => {
                const scopeInfo = getScopeInfo(position.positionScope || position.scope || '');
                const ScopeIcon = scopeInfo.icon;
                return (
                  <TableRow key={position.id} className="hover:bg-slate-50 transition-colors">
                    <TableCell>
                      <span className="font-mono text-sm bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                        {position.code}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium text-slate-800">{position.name}</div>
                        {position.description && (
                          <div className="text-xs text-slate-500 truncate max-w-xs mt-0.5">{position.description}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${scopeInfo.bg}`}>
                        <ScopeIcon className="h-3 w-3" />
                        {scopeInfo.label.split(' ')[0]}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full text-xs font-medium">
                        <Key className="h-3 w-3" />
                        {position._count?.positionFunctions || 0}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full text-xs font-medium">
                        <Users className="h-3 w-3" />
                        {position._count?.userPositions || 0}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch checked={position.isActive} onCheckedChange={() => handleToggleActive(position)} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-blue-50" onClick={() => handleOpenEdit(position)}>
                          <Edit className="h-3.5 w-3.5 text-blue-600" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-red-50" onClick={() => handleOpenDelete(position)}>
                          <Trash2 className="h-3.5 w-3.5 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filteredPositions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-slate-400">
                    <Shield className="h-10 w-10 mx-auto mb-2 opacity-30" />
                    <p>Không tìm thấy chức vụ nào</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-indigo-600" />
              {selectedPosition ? 'Chỉnh sửa chức vụ' : 'Thêm chức vụ mới'}
            </DialogTitle>
            <DialogDescription>
              {selectedPosition ? 'Cập nhật thông tin chức vụ' : 'Tạo một chức vụ mới trong hệ thống'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">Mã chức vụ *</Label>
                <Input
                  id="code"
                  placeholder="VD: GIAM_DOC"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase().replace(/\s+/g, '_') })}
                  disabled={!!selectedPosition}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="scope">Phạm vi *</Label>
                <Select value={formData.scope} onValueChange={(v) => setFormData({ ...formData, scope: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SCOPE_OPTIONS.map(s => (
                      <SelectItem key={s.value} value={s.value}>
                        <div className="flex items-center gap-2">
                          <s.icon className={`h-4 w-4 ${s.color}`} />
                          {s.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Tên chức vụ *</Label>
              <Input
                id="name"
                placeholder="VD: Giám đốc Học viện"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Mô tả</Label>
              <Textarea
                id="description"
                placeholder="Mô tả chi tiết về chức vụ này..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3 bg-slate-50">
              <div>
                <Label>Kích hoạt</Label>
                <p className="text-xs text-slate-500 mt-0.5">Chức vụ sẽ có hiệu lực trong hệ thống</p>
              </div>
              <Switch
                checked={formData.isActive}
                onCheckedChange={(v) => setFormData({ ...formData, isActive: v })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Hủy</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700">
              {saving ? 'Đang lưu...' : (selectedPosition ? 'Cập nhật' : 'Tạo mới')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Xác nhận xóa chức vụ
            </AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa chức vụ <strong>{selectedPosition?.name}</strong> ({selectedPosition?.code})?
              <br /><br />
              <span className="text-red-500 font-medium">Lưu ý: Không thể xóa nếu chức vụ đang được gán cho người dùng hoặc có quyền.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Xóa</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
