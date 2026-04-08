/**
 * Trang Quản lý Chức năng (Function) - CRUD đầy đủ
 * Thay thế việc fix cứng trong code
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import {
  Key,
  Plus,
  Trash2,
  Search,
  RefreshCw,
  Edit,
  Shield,
  Eye,
  FileEdit,
  Trash,
  CheckCircle,
  Download,
  Upload,
  AlertTriangle,
  ArrowLeft,
  Zap,
} from 'lucide-react';
import Link from 'next/link';

interface Function {
  id: string;
  code: string;
  name: string;
  description?: string;
  module: string;
  actionType: string;
  isCritical: boolean;
  isActive: boolean;
  _count?: { positions: number };
}

const MODULE_OPTIONS = [
  { value: 'PERSONNEL', label: 'Quản lý Nhân sự', color: 'bg-blue-500', icon: '👤' },
  { value: 'TRAINING', label: 'Đào tạo & Huấn luyện', color: 'bg-green-500', icon: '📚' },
  { value: 'EDUCATION', label: 'Giáo dục - Đào tạo', color: 'bg-emerald-500', icon: '🎓' },
  { value: 'RESEARCH', label: 'Nghiên cứu Khoa học', color: 'bg-purple-500', icon: '🔬' },
  { value: 'PARTY', label: 'Công tác Đảng', color: 'bg-red-500', icon: '☆' },
  { value: 'POLICY', label: 'Chính sách & Phúc lợi', color: 'bg-orange-500', icon: '📋' },
  { value: 'INSURANCE', label: 'Bảo hiểm Xã hội', color: 'bg-teal-500', icon: '🛡️' },
  { value: 'AWARDS', label: 'Khen thưởng & Kỷ luật', color: 'bg-yellow-600', icon: '🏆' },
  { value: 'STUDENT', label: 'Quản lý Học viên', color: 'bg-indigo-500', icon: '🎓' },
  { value: 'FACULTY', label: 'Giảng viên', color: 'bg-cyan-500', icon: '👨‍🏫' },
  { value: 'DASHBOARD', label: 'Dashboard & Báo cáo', color: 'bg-pink-500', icon: '📊' },
  { value: 'SYSTEM', label: 'Quản trị Hệ thống', color: 'bg-gray-600', icon: '⚙️' },
  { value: 'ADMIN', label: 'Quản trị', color: 'bg-slate-600', icon: '🔐' },
];

const ACTION_OPTIONS = [
  { value: 'VIEW',    label: 'Xem',          icon: Eye,         color: 'text-blue-500' },
  { value: 'CREATE',  label: 'Tạo mới',      icon: Plus,        color: 'text-green-500' },
  { value: 'UPDATE',  label: 'Cập nhật',     icon: FileEdit,    color: 'text-orange-500' },
  { value: 'DELETE',  label: 'Xóa',          icon: Trash,       color: 'text-red-500' },
  { value: 'APPROVE', label: 'Phê duyệt',    icon: CheckCircle, color: 'text-purple-500' },
  { value: 'REJECT',  label: 'Từ chối',      icon: AlertTriangle, color: 'text-rose-500' },
  { value: 'SUBMIT',  label: 'Gửi yêu cầu', icon: Upload,      color: 'text-sky-500' },
  { value: 'EXPORT',  label: 'Xuất dữ liệu', icon: Download,   color: 'text-cyan-500' },
  { value: 'IMPORT',  label: 'Nhập dữ liệu', icon: Upload,     color: 'text-amber-500' },
];

export default function FunctionManagementPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [functions, setFunctions] = useState<Function[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterModule, setFilterModule] = useState<string>('all');
  const [filterAction, setFilterAction] = useState<string>('all');
  const [filterActive, setFilterActive] = useState<string>('all');
  
  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedFunction, setSelectedFunction] = useState<Function | null>(null);
  const [saving, setSaving] = useState(false);
  
  // Form data
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    module: 'PERSONNEL',
    actionType: 'VIEW',
    isCritical: false,
    isActive: true
  });

  const fetchFunctions = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/rbac/functions');
      if (res.ok) {
        const data = await res.json();
        setFunctions(data.functions || []);
      }
    } catch (error) {
      console.error('Error fetching functions:', error);
      toast({ title: 'Lỗi', description: 'Không thể tải danh sách chức năng', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchFunctions();
  }, [fetchFunctions]);

  const handleOpenCreate = () => {
    setSelectedFunction(null);
    setFormData({
      code: '',
      name: '',
      description: '',
      module: 'PERSONNEL',
      actionType: 'VIEW',
      isCritical: false,
      isActive: true
    });
    setDialogOpen(true);
  };

  const handleOpenEdit = (func: Function) => {
    setSelectedFunction(func);
    setFormData({
      code: func.code,
      name: func.name,
      description: func.description || '',
      module: func.module,
      actionType: func.actionType,
      isCritical: func.isCritical,
      isActive: func.isActive
    });
    setDialogOpen(true);
  };

  const handleOpenDelete = (func: Function) => {
    setSelectedFunction(func);
    setDeleteDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.code || !formData.name || !formData.module) {
      toast({ title: 'Lỗi', description: 'Vui lòng nhập mã, tên và module', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      const url = '/api/admin/rbac/functions';
      const method = selectedFunction ? 'PUT' : 'POST';
      const body = selectedFunction 
        ? { id: selectedFunction.id, ...formData }
        : formData;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await res.json();
      if (res.ok) {
        toast({ title: 'Thành công', description: data.message });
        setDialogOpen(false);
        fetchFunctions();
      } else {
        toast({ title: 'Lỗi', description: data.error, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Lỗi', description: 'Không thể lưu chức năng', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedFunction) return;

    try {
      const res = await fetch(`/api/admin/rbac/functions?id=${selectedFunction.id}`, {
        method: 'DELETE'
      });

      const data = await res.json();
      if (res.ok) {
        toast({ title: 'Thành công', description: data.message });
        setDeleteDialogOpen(false);
        fetchFunctions();
      } else {
        toast({ title: 'Lỗi', description: data.error, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Lỗi', description: 'Không thể xóa chức năng', variant: 'destructive' });
    }
  };

  const handleToggleActive = async (func: Function) => {
    try {
      const res = await fetch('/api/admin/rbac/functions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: func.id, isActive: !func.isActive })
      });

      if (res.ok) {
        toast({ title: 'Đã cập nhật trạng thái' });
        fetchFunctions();
      }
    } catch (error) {
      toast({ title: 'Lỗi', variant: 'destructive' });
    }
  };

  // Filter functions
  const term = searchTerm.toLowerCase();
  const filteredFunctions = functions.filter(f => {
    const matchSearch = term === '' ||
      (f.code ?? '').toLowerCase().includes(term) ||
      (f.name ?? '').toLowerCase().includes(term) ||
      (f.description ?? '').toLowerCase().includes(term);
    const matchModule = filterModule === 'all' || f.module === filterModule;
    const matchAction = filterAction === 'all' || f.actionType === filterAction;
    const matchActive = filterActive === 'all' ||
      (filterActive === 'active' ? f.isActive : !f.isActive);
    return matchSearch && matchModule && matchAction && matchActive;
  });

  // Stats
  const totalFunctions = functions.length;
  const activeFunctions = functions.filter(f => f.isActive).length;
  const criticalFunctions = functions.filter(f => f.isCritical).length;
  const moduleStats = MODULE_OPTIONS.map(m => ({
    ...m,
    count: functions.filter(f => f.module === m.value).length
  })).filter(m => m.count > 0);

  const getModuleInfo = (module: string) => {
    return MODULE_OPTIONS.find(m => m.value === module) || { label: module, color: 'bg-gray-500', icon: '📁' };
  };

  const getActionInfo = (action: string) => {
    return ACTION_OPTIONS.find(a => a.value === action) || ACTION_OPTIONS[0];
  };

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
        <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-10"><Key className="h-24 w-24" /></div>
        <div className="relative p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Link href="/dashboard/admin" className="flex items-center gap-1 text-indigo-100 hover:text-white text-sm transition-colors">
                  <ArrowLeft className="h-3.5 w-3.5" />Quản trị hệ thống
                </Link>
                <span className="text-indigo-300">/</span>
                <span className="text-sm text-white font-medium">Chức năng</span>
              </div>
              <h1 className="text-2xl font-bold flex items-center gap-3">
                <Key className="h-7 w-7 text-indigo-100" />Quản lý Chức năng
              </h1>
              <p className="text-indigo-100 mt-1 text-sm">Thêm, sửa, xóa các chức năng (quyền) trong hệ thống RBAC</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={fetchFunctions} className="border-white/40 bg-white/20 text-white hover:bg-white/30">
                <RefreshCw className="h-4 w-4 mr-2" />Làm mới
              </Button>
              <Button onClick={handleOpenCreate} className="bg-white text-indigo-700 hover:bg-indigo-50 font-semibold">
                <Plus className="h-4 w-4 mr-2" />Thêm chức năng
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Tổng chức năng', value: totalFunctions, icon: Key, color: 'bg-indigo-100 text-indigo-600' },
          { label: 'Đang hoạt động', value: activeFunctions, icon: CheckCircle, color: 'bg-emerald-100 text-emerald-600' },
          { label: 'Chức năng quan trọng', value: criticalFunctions, icon: Zap, color: 'bg-red-100 text-red-600' },
          { label: 'Số module', value: moduleStats.length, icon: Shield, color: 'bg-purple-100 text-purple-600' },
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

      {/* Module Distribution */}
      <div className="rounded-xl border bg-white p-4 shadow-sm">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Phân bổ theo Module</p>
        <div className="flex flex-wrap gap-2">
          {moduleStats.map(m => (
            <span key={m.value} className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-xs font-medium">
              <span>{m.icon}</span>{m.label}: <strong>{m.count}</strong>
            </span>
          ))}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-50 rounded-xl border p-4 flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="text-xs font-medium text-slate-500 mb-1.5 block">Tìm kiếm</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input placeholder="Tìm theo mã hoặc tên chức năng..." value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 bg-white" />
          </div>
        </div>
        <div className="w-48">
          <label className="text-xs font-medium text-slate-500 mb-1.5 block">Module</label>
          <Select value={filterModule} onValueChange={setFilterModule}>
            <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả module</SelectItem>
              {MODULE_OPTIONS.map(m => <SelectItem key={m.value} value={m.value}><span className="mr-1">{m.icon}</span>{m.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="w-40">
          <label className="text-xs font-medium text-slate-500 mb-1.5 block">Hành động</label>
          <Select value={filterAction} onValueChange={setFilterAction}>
            <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              {ACTION_OPTIONS.map(a => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}
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
          Hiển thị <span className="font-semibold text-slate-800">{filteredFunctions.length}</span> / {totalFunctions}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b bg-slate-50 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-slate-800">Danh sách chức năng</h3>
            <p className="text-xs text-slate-500 mt-0.5">Quản lý các chức năng (quyền) có thể gán cho chức vụ</p>
          </div>
        </div>
        <ScrollArea className="h-[500px]">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead className="font-semibold text-slate-600 w-52">Mã chức năng</TableHead>
                <TableHead className="font-semibold text-slate-600">Tên chức năng</TableHead>
                <TableHead className="font-semibold text-slate-600 w-40">Module</TableHead>
                <TableHead className="font-semibold text-slate-600 w-28">Hành động</TableHead>
                <TableHead className="font-semibold text-slate-600 w-24 text-center">Quan trọng</TableHead>
                <TableHead className="font-semibold text-slate-600 w-24 text-center">Trạng thái</TableHead>
                <TableHead className="font-semibold text-slate-600 w-24 text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFunctions.map((func) => {
                const moduleInfo = getModuleInfo(func.module);
                const actionInfo = getActionInfo(func.actionType);
                const ActionIcon = actionInfo.icon;
                return (
                  <TableRow key={func.id} className="hover:bg-slate-50 transition-colors">
                    <TableCell>
                      <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-700">{func.code}</span>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-slate-800">{func.name}</div>
                      {func.description && <div className="text-xs text-slate-500 truncate max-w-xs mt-0.5">{func.description}</div>}
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center gap-1 text-white text-xs px-2 py-0.5 rounded-full font-medium ${moduleInfo.color}`}>
                        <span>{moduleInfo.icon}</span>{moduleInfo.label.split(' ')[0]}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <ActionIcon className={`h-3.5 w-3.5 ${actionInfo.color}`} />
                        <span className="text-sm text-slate-700">{actionInfo.label}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {func.isCritical ? (
                        <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs font-medium">
                          <Zap className="h-3 w-3" />Có
                        </span>
                      ) : <span className="text-slate-300">—</span>}
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch checked={func.isActive} onCheckedChange={() => handleToggleActive(func)} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-blue-50" onClick={() => handleOpenEdit(func)}>
                          <Edit className="h-3.5 w-3.5 text-blue-600" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-red-50" onClick={() => handleOpenDelete(func)}>
                          <Trash2 className="h-3.5 w-3.5 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filteredFunctions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-slate-400">
                    <Key className="h-10 w-10 mx-auto mb-2 opacity-30" />
                    <p>Không tìm thấy chức năng nào</p>
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
            <DialogTitle>
              {selectedFunction ? 'Chỉnh sửa chức năng' : 'Thêm chức năng mới'}
            </DialogTitle>
            <DialogDescription>
              {selectedFunction ? 'Cập nhật thông tin chức năng' : 'Tạo một chức năng (quyền) mới'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">Mã chức năng *</Label>
                <Input
                  id="code"
                  placeholder="VD: PERSONNEL.VIEW"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase().replace(/\s+/g, '_') })}
                  disabled={!!selectedFunction}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="module">Module *</Label>
                <Select value={formData.module} onValueChange={(v) => setFormData({ ...formData, module: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MODULE_OPTIONS.map(m => (
                      <SelectItem key={m.value} value={m.value}>
                        <span className="mr-1">{m.icon}</span> {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Tên chức năng *</Label>
              <Input
                id="name"
                placeholder="VD: Xem hồ sơ nhân sự"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="actionType">Loại hành động *</Label>
              <Select value={formData.actionType} onValueChange={(v) => setFormData({ ...formData, actionType: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACTION_OPTIONS.map(a => {
                    const Icon = a.icon;
                    return (
                      <SelectItem key={a.value} value={a.value}>
                        <div className="flex items-center gap-2">
                          <Icon className={`h-4 w-4 ${a.color}`} />
                          {a.label}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Mô tả</Label>
              <Textarea
                id="description"
                placeholder="Mô tả chi tiết về chức năng này..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isCritical"
                checked={formData.isCritical}
                onCheckedChange={(v) => setFormData({ ...formData, isCritical: !!v })}
              />
              <div>
                <Label htmlFor="isCritical" className="cursor-pointer">Chức năng quan trọng</Label>
                <p className="text-xs text-muted-foreground">Chức năng ảnh hưởng đến dữ liệu nhạy cảm, cần kiểm soát chặt</p>
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label>Kích hoạt</Label>
                <p className="text-sm text-muted-foreground">Chức năng sẽ có hiệu lực trong hệ thống</p>
              </div>
              <Switch
                checked={formData.isActive}
                onCheckedChange={(v) => setFormData({ ...formData, isActive: v })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Hủy</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Đang lưu...' : (selectedFunction ? 'Cập nhật' : 'Tạo mới')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Xác nhận xóa chức năng
            </AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa chức năng <strong>{selectedFunction?.name}</strong> ({selectedFunction?.code})?
              <br /><br />
              <span className="text-red-500">Lưu ý: Không thể xóa nếu chức năng đang được gán cho chức vụ.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
