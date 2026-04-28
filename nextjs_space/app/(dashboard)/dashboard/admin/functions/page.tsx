'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  ChevronLeft,
  ChevronRight,
  Users,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';

interface FunctionItem {
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

const PAGE_SIZE = 20;

const MODULE_OPTIONS = [
  { value: 'PERSONNEL', label: 'Quản lý Nhân sự',        color: 'bg-blue-500',    icon: '👤' },
  { value: 'TRAINING',  label: 'Đào tạo & Huấn luyện',   color: 'bg-green-500',   icon: '📚' },
  { value: 'EDUCATION', label: 'Giáo dục - Đào tạo',     color: 'bg-emerald-500', icon: '🎓' },
  { value: 'RESEARCH',  label: 'Nghiên cứu Khoa học',    color: 'bg-purple-500',  icon: '🔬' },
  { value: 'PARTY',     label: 'Công tác Đảng',          color: 'bg-red-500',     icon: '☆'  },
  { value: 'POLICY',    label: 'Chính sách & Phúc lợi',  color: 'bg-orange-500',  icon: '📋' },
  { value: 'INSURANCE', label: 'Bảo hiểm Xã hội',        color: 'bg-teal-500',    icon: '🛡️' },
  { value: 'AWARDS',    label: 'Khen thưởng & Kỷ luật',  color: 'bg-yellow-600',  icon: '🏆' },
  { value: 'STUDENT',   label: 'Quản lý Học viên',       color: 'bg-indigo-500',  icon: '🎓' },
  { value: 'FACULTY',   label: 'Giảng viên',             color: 'bg-cyan-500',    icon: '👨‍🏫' },
  { value: 'DASHBOARD', label: 'Dashboard & Báo cáo',    color: 'bg-pink-500',    icon: '📊' },
  { value: 'SYSTEM',    label: 'Quản trị Hệ thống',      color: 'bg-gray-600',    icon: '⚙️' },
  { value: 'ADMIN',     label: 'Quản trị',               color: 'bg-slate-600',   icon: '🔐' },
];

const ACTION_OPTIONS = [
  { value: 'VIEW',    label: 'Xem',           icon: Eye,           color: 'text-blue-500'   },
  { value: 'CREATE',  label: 'Tạo mới',       icon: Plus,          color: 'text-green-500'  },
  { value: 'UPDATE',  label: 'Cập nhật',      icon: FileEdit,      color: 'text-orange-500' },
  { value: 'DELETE',  label: 'Xóa',           icon: Trash,         color: 'text-red-500'    },
  { value: 'APPROVE', label: 'Phê duyệt',     icon: CheckCircle,   color: 'text-purple-500' },
  { value: 'REJECT',  label: 'Từ chối',       icon: AlertTriangle, color: 'text-rose-500'   },
  { value: 'SUBMIT',  label: 'Gửi yêu cầu',  icon: Upload,        color: 'text-sky-500'    },
  { value: 'EXPORT',  label: 'Xuất dữ liệu',  icon: Download,      color: 'text-cyan-500'   },
  { value: 'IMPORT',  label: 'Nhập dữ liệu',  icon: Upload,        color: 'text-amber-500'  },
];

function getModuleInfo(module: string) {
  return MODULE_OPTIONS.find(m => m.value === module) ?? { label: module, color: 'bg-gray-500', icon: '📁' };
}

function getActionInfo(action: string) {
  return ACTION_OPTIONS.find(a => a.value === action) ?? ACTION_OPTIONS[0];
}

function generateCode(module: string, actionType: string): string {
  if (!module || !actionType) return '';
  return `${module}.${actionType}`;
}

export default function FunctionManagementPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [functions, setFunctions] = useState<FunctionItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterModule, setFilterModule] = useState<string>('all');
  const [filterAction, setFilterAction] = useState<string>('all');
  const [filterActive, setFilterActive] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [toggleConfirmOpen, setToggleConfirmOpen] = useState(false);
  const [pendingToggleFunc, setPendingToggleFunc] = useState<FunctionItem | null>(null);
  const [selectedFunction, setSelectedFunction] = useState<FunctionItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [codeAutoGenerated, setCodeAutoGenerated] = useState(true);

  // Form data
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    module: 'PERSONNEL',
    actionType: 'VIEW',
    isCritical: false,
    isActive: true,
  });

  const fetchFunctions = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/rbac/functions');
      if (res.ok) {
        const data = await res.json();
        setFunctions(data.functions || []);
      }
    } catch {
      toast({ title: 'Lỗi', description: 'Không thể tải danh sách chức năng', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchFunctions(); }, [fetchFunctions]);

  // Reset page khi filter thay đổi
  useEffect(() => { setCurrentPage(1); }, [searchTerm, filterModule, filterAction, filterActive]);

  const handleOpenCreate = () => {
    setSelectedFunction(null);
    setCodeAutoGenerated(true);
    setFormData({ code: generateCode('PERSONNEL', 'VIEW'), name: '', description: '', module: 'PERSONNEL', actionType: 'VIEW', isCritical: false, isActive: true });
    setDialogOpen(true);
  };

  const handleOpenEdit = (func: FunctionItem) => {
    setSelectedFunction(func);
    setCodeAutoGenerated(false);
    setFormData({
      code: func.code,
      name: func.name,
      description: func.description || '',
      module: func.module,
      actionType: func.actionType,
      isCritical: func.isCritical,
      isActive: func.isActive,
    });
    setDialogOpen(true);
  };

  const handleOpenDelete = (func: FunctionItem) => {
    setSelectedFunction(func);
    setDeleteDialogOpen(true);
  };

  // Cập nhật code tự động khi module/actionType thay đổi (chỉ khi tạo mới và chưa chỉnh tay)
  const handleFormModuleChange = (value: string) => {
    const next = { ...formData, module: value };
    if (codeAutoGenerated) next.code = generateCode(value, formData.actionType);
    setFormData(next);
  };

  const handleFormActionChange = (value: string) => {
    const next = { ...formData, actionType: value };
    if (codeAutoGenerated) next.code = generateCode(formData.module, value);
    setFormData(next);
  };

  const handleCodeChange = (value: string) => {
    setCodeAutoGenerated(false);
    setFormData({ ...formData, code: value.toUpperCase().replace(/\s+/g, '_') });
  };

  const handleSave = async () => {
    if (!formData.code || !formData.name || !formData.module) {
      toast({ title: 'Lỗi', description: 'Vui lòng nhập mã, tên và module', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const method = selectedFunction ? 'PUT' : 'POST';
      const body = selectedFunction ? { id: selectedFunction.id, ...formData } : formData;
      const res = await fetch('/api/admin/rbac/functions', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) {
        toast({ title: 'Thành công', description: data.message || (selectedFunction ? 'Cập nhật chức năng thành công' : 'Tạo chức năng thành công') });
        setDialogOpen(false);
        fetchFunctions();
      } else {
        toast({ title: `Lỗi ${res.status}`, description: data.error || data.message || 'Không thể lưu chức năng', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Lỗi kết nối', description: 'Không thể lưu chức năng', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedFunction) return;
    try {
      const res = await fetch(`/api/admin/rbac/functions?id=${selectedFunction.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        toast({ title: 'Đã xóa', description: data.message || `Đã xóa chức năng "${selectedFunction.code}"` });
        setDeleteDialogOpen(false);
        fetchFunctions();
      } else {
        toast({ title: `Không thể xóa (${res.status})`, description: data.error || data.message || 'Xóa chức năng thất bại', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Lỗi kết nối', description: 'Không thể xóa chức năng', variant: 'destructive' });
    }
  };

  // Nếu function là critical → yêu cầu confirm trước khi toggle
  const handleToggleActive = (func: FunctionItem) => {
    if (func.isCritical) {
      setPendingToggleFunc(func);
      setToggleConfirmOpen(true);
    } else {
      doToggleActive(func);
    }
  };

  const doToggleActive = async (func: FunctionItem) => {
    try {
      const res = await fetch('/api/admin/rbac/functions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: func.id, isActive: !func.isActive }),
      });
      if (res.ok) {
        toast({ title: 'Đã cập nhật', description: `${func.code} → ${func.isActive ? 'Tắt' : 'Bật'}` });
        fetchFunctions();
      } else {
        const data = await res.json().catch(() => ({}));
        toast({ title: `Lỗi ${res.status}`, description: data.error || 'Không thể đổi trạng thái', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Lỗi kết nối', description: 'Không thể đổi trạng thái chức năng', variant: 'destructive' });
    }
  };

  const handleConfirmToggle = async () => {
    if (!pendingToggleFunc) return;
    await doToggleActive(pendingToggleFunc);
    setToggleConfirmOpen(false);
    setPendingToggleFunc(null);
  };

  // Filter
  const filteredFunctions = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return functions.filter(f => {
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
  }, [functions, searchTerm, filterModule, filterAction, filterActive]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredFunctions.length / PAGE_SIZE));
  const pagedFunctions = filteredFunctions.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const hasActiveFilters = searchTerm !== '' || filterModule !== 'all' || filterAction !== 'all' || filterActive !== 'all';

  const resetFilters = () => {
    setSearchTerm('');
    setFilterModule('all');
    setFilterAction('all');
    setFilterActive('all');
  };

  // Stats
  const totalFunctions   = functions.length;
  const activeFunctions  = functions.filter(f => f.isActive).length;
  const criticalFunctions = functions.filter(f => f.isCritical).length;
  const moduleStats = MODULE_OPTIONS
    .map(m => ({ ...m, count: functions.filter(f => f.module === m.value).length }))
    .filter(m => m.count > 0);

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
      {/* Banner */}
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
          { label: 'Tổng chức năng',      value: totalFunctions,    icon: Key,         color: 'bg-indigo-100 text-indigo-600'   },
          { label: 'Đang hoạt động',      value: activeFunctions,   icon: CheckCircle, color: 'bg-emerald-100 text-emerald-600' },
          { label: 'Chức năng quan trọng', value: criticalFunctions, icon: Zap,         color: 'bg-red-100 text-red-600'         },
          { label: 'Số module',           value: moduleStats.length, icon: Shield,      color: 'bg-purple-100 text-purple-600'   },
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
            <button
              key={m.value}
              onClick={() => setFilterModule(filterModule === m.value ? 'all' : m.value)}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors
                ${filterModule === m.value
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
            >
              <span>{m.icon}</span>{m.label}: <strong>{m.count}</strong>
            </button>
          ))}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-50 rounded-xl border p-4 flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="text-xs font-medium text-slate-500 mb-1.5 block">Tìm kiếm</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Tìm theo mã hoặc tên chức năng..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white"
            />
          </div>
        </div>
        <div className="w-48">
          <label className="text-xs font-medium text-slate-500 mb-1.5 block">Module</label>
          <Select value={filterModule} onValueChange={setFilterModule}>
            <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả module</SelectItem>
              {MODULE_OPTIONS.map(m => (
                <SelectItem key={m.value} value={m.value}><span className="mr-1">{m.icon}</span>{m.label}</SelectItem>
              ))}
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
        <div className="flex items-center gap-3 self-end pb-0.5">
          <span className="text-sm text-slate-500">
            Hiển thị <span className="font-semibold text-slate-800">{filteredFunctions.length}</span> / {totalFunctions}
          </span>
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium"
            >
              <XCircle className="h-3.5 w-3.5" />Xóa filter
            </button>
          )}
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

        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead className="font-semibold text-slate-600 w-52">Mã chức năng</TableHead>
              <TableHead className="font-semibold text-slate-600">Tên chức năng</TableHead>
              <TableHead className="font-semibold text-slate-600 w-44">Module</TableHead>
              <TableHead className="font-semibold text-slate-600 w-28">Hành động</TableHead>
              <TableHead className="font-semibold text-slate-600 w-24 text-center">Quan trọng</TableHead>
              <TableHead className="font-semibold text-slate-600 w-24 text-center">Chức vụ</TableHead>
              <TableHead className="font-semibold text-slate-600 w-24 text-center">Trạng thái</TableHead>
              <TableHead className="font-semibold text-slate-600 w-24 text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pagedFunctions.map((func) => {
              const moduleInfo = getModuleInfo(func.module);
              const actionInfo = getActionInfo(func.actionType);
              const ActionIcon = actionInfo.icon;
              const positionCount = func._count?.positions ?? 0;
              return (
                <TableRow key={func.id} className="hover:bg-slate-50 transition-colors">
                  <TableCell>
                    <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-700">{func.code}</span>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-slate-800">{func.name}</div>
                    {func.description && (
                      <div className="text-xs text-slate-500 truncate max-w-xs mt-0.5">{func.description}</div>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center gap-1 text-white text-xs px-2 py-0.5 rounded-full font-medium ${moduleInfo.color}`}>
                      <span>{moduleInfo.icon}</span>
                      <span className="max-w-[6rem] truncate">{moduleInfo.label}</span>
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
                    {positionCount > 0 ? (
                      <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full text-xs font-medium">
                        <Users className="h-3 w-3" />{positionCount}
                      </span>
                    ) : (
                      <span className="text-slate-300 text-xs">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <Switch
                      checked={func.isActive}
                      onCheckedChange={() => handleToggleActive(func)}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-blue-50" onClick={() => handleOpenEdit(func)}>
                        <Edit className="h-3.5 w-3.5 text-blue-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:bg-red-50"
                        onClick={() => handleOpenDelete(func)}
                        disabled={positionCount > 0}
                        title={positionCount > 0 ? `Đang dùng bởi ${positionCount} chức vụ` : 'Xóa'}
                      >
                        <Trash2 className={`h-3.5 w-3.5 ${positionCount > 0 ? 'text-slate-300' : 'text-red-500'}`} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {pagedFunctions.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12 text-slate-400">
                  <Key className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  <p className="font-medium">Không tìm thấy chức năng nào</p>
                  {hasActiveFilters && (
                    <button
                      onClick={resetFilters}
                      className="mt-2 text-xs text-indigo-600 hover:text-indigo-800 font-medium underline"
                    >
                      Xóa filter để xem tất cả
                    </button>
                  )}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-5 py-3 border-t bg-slate-50 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Trang {currentPage} / {totalPages} &middot; {filteredFunctions.length} kết quả
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => p - 1)}
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                .reduce<(number | 'ellipsis')[]>((acc, p, idx, arr) => {
                  if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('ellipsis');
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, idx) =>
                  p === 'ellipsis' ? (
                    <span key={`e${idx}`} className="px-1 text-slate-400 text-xs">…</span>
                  ) : (
                    <Button
                      key={p}
                      variant={currentPage === p ? 'default' : 'outline'}
                      size="icon"
                      className="h-7 w-7 text-xs"
                      onClick={() => setCurrentPage(p as number)}
                    >
                      {p}
                    </Button>
                  )
                )}
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => p + 1)}
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedFunction ? 'Chỉnh sửa chức năng' : 'Thêm chức năng mới'}</DialogTitle>
            <DialogDescription>
              {selectedFunction ? 'Cập nhật thông tin chức năng' : 'Tạo một chức năng (quyền) mới'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="module">Module *</Label>
                <Select value={formData.module} onValueChange={handleFormModuleChange} disabled={!!selectedFunction}>
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
              <div className="space-y-2">
                <Label htmlFor="actionType">Loại hành động *</Label>
                <Select value={formData.actionType} onValueChange={handleFormActionChange} disabled={!!selectedFunction}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
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
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="code">Mã chức năng *</Label>
                {!selectedFunction && codeAutoGenerated && (
                  <span className="text-xs text-indigo-500 font-medium">Tự động tạo từ Module + Hành động</span>
                )}
              </div>
              <Input
                id="code"
                placeholder="VD: PERSONNEL.VIEW"
                value={formData.code}
                onChange={(e) => handleCodeChange(e.target.value)}
                disabled={!!selectedFunction}
                className="font-mono"
              />
              {!selectedFunction && !codeAutoGenerated && (
                <button
                  type="button"
                  onClick={() => {
                    setCodeAutoGenerated(true);
                    setFormData(prev => ({ ...prev, code: generateCode(prev.module, prev.actionType) }));
                  }}
                  className="text-xs text-indigo-500 hover:text-indigo-700 font-medium"
                >
                  ↺ Tự động tạo lại từ Module + Hành động
                </button>
              )}
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
              <Label htmlFor="description">Mô tả</Label>
              <Textarea
                id="description"
                placeholder="Mô tả chi tiết về chức năng này..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="flex items-start space-x-2">
              <Checkbox
                id="isCritical"
                checked={formData.isCritical}
                onCheckedChange={(v) => setFormData({ ...formData, isCritical: !!v })}
              />
              <div>
                <Label htmlFor="isCritical" className="cursor-pointer">Chức năng quan trọng</Label>
                <p className="text-xs text-muted-foreground">Ảnh hưởng đến dữ liệu nhạy cảm — bật/tắt sẽ yêu cầu xác nhận</p>
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

      {/* Confirm toggle isActive cho isCritical */}
      <AlertDialog open={toggleConfirmOpen} onOpenChange={setToggleConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-amber-500" />
              Xác nhận thay đổi trạng thái
            </AlertDialogTitle>
            <AlertDialogDescription>
              Chức năng <strong>{pendingToggleFunc?.code}</strong> được đánh dấu là{' '}
              <span className="text-red-600 font-semibold">quan trọng</span>.{' '}
              {pendingToggleFunc?.isActive
                ? 'Tắt chức năng này có thể làm mất quyền truy cập của các chức vụ đang dùng nó.'
                : 'Bật chức năng này sẽ kích hoạt quyền cho tất cả chức vụ đang được gán.'}
              <br /><br />
              Bạn có chắc chắn muốn {pendingToggleFunc?.isActive ? 'tắt' : 'bật'} không?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingToggleFunc(null)}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmToggle}
              className={pendingToggleFunc?.isActive ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'}
            >
              {pendingToggleFunc?.isActive ? 'Xác nhận tắt' : 'Xác nhận bật'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation */}
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
