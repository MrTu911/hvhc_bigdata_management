'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import {
  ChevronRight,
  ChevronDown,
  Plus,
  Edit,
  Trash2,
  Building2,
  UserPlus,
  Users,
  X,
  TreePine,
  LayoutGrid,
  Search,
  User,
  Check,
  AlertCircle,
  ArrowLeft,
  RefreshCw,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface Unit {
  id: string;
  code: string;
  name: string;
  level: number;
  type: string;
  parentId: string | null;
  description?: string;
  children: Unit[];
  _count: { users: number; children: number };
}

interface Personnel {
  id: string;
  name: string;
  email: string;
  militaryId?: string;
  rank?: string;
  position?: string;
  phone?: string;
  status: string;
  role: string;
}

const ROLE_LABELS: Record<string, { label: string; color: string }> = {
  QUAN_TRI_HE_THONG: { label: 'Quản trị', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  CHI_HUY_HOC_VIEN: { label: 'Chỉ huy HV', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
  CHI_HUY_KHOA_PHONG: { label: 'Chỉ huy KP', color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' },
  CHU_NHIEM_BO_MON: { label: 'Ch.nhiệm BM', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  GIANG_VIEN: { label: 'Giảng viên', color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400' },
  NGHIEN_CUU_VIEN: { label: 'NC viên', color: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400' },
  HOC_VIEN: { label: 'Học viên', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  SINH_VIEN: { label: 'Sinh viên', color: 'bg-lime-100 text-lime-700 dark:bg-lime-900/30 dark:text-lime-400' },
};

export default function UnitsManagementPage() {
  const router = useRouter();
  const [units, setUnits] = useState<Unit[]>([]);
  const [flatUnits, setFlatUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'tree' | 'table'>('tree');

  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [loadingPersonnel, setLoadingPersonnel] = useState(false);
  const [personnelSearch, setPersonnelSearch] = useState('');

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [unassigningId, setUnassigningId] = useState<string | null>(null);

  const [isAssignPersonnelOpen, setIsAssignPersonnelOpen] = useState(false);
  const [availablePersonnel, setAvailablePersonnel] = useState<Personnel[]>([]);
  const [loadingAvailablePersonnel, setLoadingAvailablePersonnel] = useState(false);
  const [availablePersonnelSearch, setAvailablePersonnelSearch] = useState('');
  const [selectedPersonnelIds, setSelectedPersonnelIds] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    type: '',
    level: 1,
    parentId: '',
    description: '',
  });

  const [unitTypes, setUnitTypes] = useState<{ code: string; nameVi: string; shortName?: string }[]>([]);

  useEffect(() => {
    fetchUnits();
    fetchUnitTypes();
  }, []);

  const fetchUnitTypes = async () => {
    try {
      const res = await fetch('/api/master-data/MD_UNIT_TYPE');
      const json = await res.json();
      if (res.ok && json.data?.items) {
        setUnitTypes(json.data.items);
      }
    } catch {
      console.error('Không thể tải danh sách loại đơn vị');
    }
  };

  const fetchUnits = async () => {
    try {
      setLoading(true);
      const [treeRes, flatRes] = await Promise.all([
        fetch('/api/admin/units'),
        fetch('/api/admin/units?flat=true'),
      ]);

      const treeData = await treeRes.json();
      const flatData = await flatRes.json();

      if (treeRes.ok) setUnits(treeData.data || []);
      if (flatRes.ok) setFlatUnits(flatData.data || []);
    } catch {
      toast.error('Không thể tải danh sách đơn vị');
    } finally {
      setLoading(false);
    }
  };

  const fetchPersonnel = useCallback(async (unitId: string) => {
    try {
      setLoadingPersonnel(true);
      const res = await fetch(`/api/admin/rbac/users?unitId=${unitId}&limit=100`);
      const data = await res.json();
      if (res.ok) {
        setPersonnel(data.data || []);
      }
    } catch {
      console.error('Error fetching personnel');
    } finally {
      setLoadingPersonnel(false);
    }
  }, []);

  const fetchAvailablePersonnel = useCallback(async () => {
    try {
      setLoadingAvailablePersonnel(true);
      const res = await fetch('/api/admin/rbac/users?noUnit=true&limit=500');
      const data = await res.json();
      if (res.ok) {
        setAvailablePersonnel(data.data || []);
      }
    } catch {
      console.error('Error fetching available personnel');
    } finally {
      setLoadingAvailablePersonnel(false);
    }
  }, []);

  const handleAssignPersonnel = async () => {
    if (!selectedUnit || selectedPersonnelIds.length === 0) return;
    try {
      const res = await fetch('/api/admin/units/assign-personnel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unitId: selectedUnit.id, userIds: selectedPersonnelIds }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Đã gán ${data.count} nhân sự vào đơn vị thành công!`);
        setIsAssignPersonnelOpen(false);
        setSelectedPersonnelIds([]);
        fetchPersonnel(selectedUnit.id);
        fetchUnits();
      } else {
        toast.error(data.error || 'Không thể gán nhân sự');
      }
    } catch {
      toast.error('Lỗi khi gán nhân sự vào đơn vị');
    }
  };

  const handleUnassign = async (userId: string) => {
    if (!selectedUnit) return;
    setUnassigningId(userId);
    try {
      const res = await fetch(
        `/api/admin/units/assign-personnel?userId=${userId}&unitId=${selectedUnit.id}`,
        { method: 'DELETE' }
      );
      if (res.ok) {
        toast.success('Đã xóa nhân sự khỏi đơn vị');
        fetchPersonnel(selectedUnit.id);
        fetchUnits();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Không thể xóa nhân sự');
      }
    } catch {
      toast.error('Lỗi khi xóa nhân sự');
    } finally {
      setUnassigningId(null);
    }
  };

  const handleExpandAll = () => {
    const allIds = new Set<string>();
    const collect = (list: Unit[]) => {
      list.forEach(u => {
        if (u.children?.length) { allIds.add(u.id); collect(u.children); }
      });
    };
    collect(units);
    setExpandedIds(allIds);
  };

  const handleCollapseAll = () => setExpandedIds(new Set());

  const openAssignPersonnelDialog = () => {
    fetchAvailablePersonnel();
    setSelectedPersonnelIds([]);
    setAvailablePersonnelSearch('');
    setIsAssignPersonnelOpen(true);
  };

  const filteredAvailablePersonnel = availablePersonnel.filter(p =>
    p.name?.toLowerCase().includes(availablePersonnelSearch.toLowerCase()) ||
    p.email?.toLowerCase().includes(availablePersonnelSearch.toLowerCase()) ||
    p.militaryId?.toLowerCase().includes(availablePersonnelSearch.toLowerCase()) ||
    p.rank?.toLowerCase().includes(availablePersonnelSearch.toLowerCase())
  );

  const togglePersonnelSelection = (id: string) => {
    setSelectedPersonnelIds(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const handleUnitClick = (unit: Unit) => {
    if (selectedUnit?.id === unit.id) {
      setSelectedUnit(null);
      setPersonnel([]);
    } else {
      setSelectedUnit(unit);
      fetchPersonnel(unit.id);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/units', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          parentId: formData.parentId || null,
          description: formData.description || null,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Tạo đơn vị thành công!');
        setIsAddOpen(false);
        fetchUnits();
        resetForm();
      } else if (res.status === 409) {
        toast.error(`Mã đơn vị "${formData.code}" đã tồn tại`, {
          description: 'Vui lòng chọn mã khác.',
          duration: 5000,
        });
      } else {
        toast.error(data.error || data.message || 'Không thể tạo đơn vị', {
          description: res.status >= 500 ? `Lỗi hệ thống (${res.status})` : `HTTP ${res.status}`,
        });
      }
    } catch {
      toast.error('Lỗi kết nối', { description: 'Không thể tạo đơn vị. Kiểm tra kết nối mạng.' });
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/units', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingUnit?.id,
          ...formData,
          parentId: formData.parentId || null,
          description: formData.description || null,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Cập nhật đơn vị thành công!');
        setIsEditOpen(false);
        fetchUnits();
      } else {
        toast.error(data.error || data.message || 'Không thể cập nhật đơn vị', {
          description: res.status === 409 ? 'Mã đơn vị đã tồn tại'
            : res.status >= 500 ? `Lỗi hệ thống (${res.status})`
            : `HTTP ${res.status}`,
        });
      }
    } catch {
      toast.error('Lỗi kết nối', { description: 'Không thể cập nhật đơn vị. Kiểm tra kết nối mạng.' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn vô hiệu hóa đơn vị này?')) return;
    try {
      const res = await fetch(`/api/admin/units?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Đã vô hiệu hóa đơn vị');
        fetchUnits();
        if (selectedUnit?.id === id) {
          setSelectedUnit(null);
          setPersonnel([]);
        }
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || data.message || 'Không thể vô hiệu hóa đơn vị', {
          description: res.status >= 500 ? `Lỗi hệ thống (${res.status})` : `HTTP ${res.status}`,
        });
      }
    } catch {
      toast.error('Lỗi kết nối', { description: 'Không thể vô hiệu hóa đơn vị. Kiểm tra kết nối mạng.' });
    }
  };

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = new Set(expandedIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    setExpandedIds(next);
  };

  const resetForm = () => {
    setFormData({ code: '', name: '', type: '', level: 1, parentId: '', description: '' });
  };

  const openEditDialog = (unit: Unit, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingUnit(unit);
    setFormData({
      code: unit.code,
      name: unit.name,
      type: unit.type,
      level: unit.level,
      parentId: unit.parentId || '',
      description: unit.description || '',
    });
    setIsEditOpen(true);
  };

  const filteredPersonnel = personnel.filter(p =>
    p.name?.toLowerCase().includes(personnelSearch.toLowerCase()) ||
    p.email?.toLowerCase().includes(personnelSearch.toLowerCase()) ||
    p.militaryId?.toLowerCase().includes(personnelSearch.toLowerCase())
  );

  const renderUnit = (unit: Unit, depth = 0) => {
    const hasChildren = unit.children && unit.children.length > 0;
    const isExpanded = expandedIds.has(unit.id);
    const isSelected = selectedUnit?.id === unit.id;

    return (
      <div key={unit.id}>
        <div
          className={`flex items-center gap-2 py-3 px-4 border-b cursor-pointer transition-colors hover:bg-accent/50 ${
            isSelected ? 'bg-accent border-l-4 border-l-primary' : ''
          }`}
          style={{ paddingLeft: `${depth * 32 + 16}px` }}
          onClick={() => handleUnitClick(unit)}
        >
          <div className="w-6 h-6 flex items-center justify-center">
            {hasChildren ? (
              <button onClick={(e) => toggleExpand(unit.id, e)} className="hover:bg-muted rounded p-1">
                {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
            ) : (
              <span className="w-4" />
            )}
          </div>

          <Building2 className={`w-5 h-5 flex-shrink-0 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />

          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm truncate">{unit.name}</div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
              <span className="font-mono bg-muted px-1.5 py-0.5 rounded">{unit.code}</span>
              <Badge variant="outline" className="text-xs">Cấp {unit.level}</Badge>
              <span className="flex items-center gap-1 bg-green-500/10 text-green-600 dark:text-green-400 px-1.5 py-0.5 rounded">
                <Users className="w-3 h-3" />
                {unit._count.users}
              </span>
            </div>
          </div>

          <div className="flex gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                const ts = Date.now().toString(36).toUpperCase().slice(-4);
                setFormData({
                  code: `${unit.code}_${ts}`,
                  name: '',
                  type: '',
                  level: unit.level + 1,
                  parentId: unit.id,
                  description: '',
                });
                setIsAddOpen(true);
              }}
              title="Thêm đơn vị con"
            >
              <Plus className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={(e) => openEditDialog(unit, e)} title="Sửa">
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => { e.stopPropagation(); handleDelete(unit.id); }}
              title="Vô hiệu hóa"
            >
              <Trash2 className="w-4 h-4 text-destructive" />
            </Button>
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div>{unit.children.map(child => renderUnit(child, depth + 1))}</div>
        )}
      </div>
    );
  };

  const flattenForTable = (list: Unit[], result: Unit[] = []): Unit[] => {
    list.forEach(u => { result.push(u); if (u.children) flattenForTable(u.children, result); });
    return result;
  };

  const tableUnits = flattenForTable(units);
  const level1Units = tableUnits.filter(u => u.level === 1);
  const level2Units = tableUnits.filter(u => u.level === 2);
  const level3Units = tableUnits.filter(u => u.level === 3);

  const unitForm = (onSubmit: (e: React.FormEvent) => void, submitLabel: string, onCancel: () => void) => (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Mã đơn vị *</Label>
          <Input
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
            required
            placeholder="VD: CNTT"
          />
        </div>
        <div>
          <Label>Loại đơn vị *</Label>
          <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
            <SelectTrigger><SelectValue placeholder="Chọn loại" /></SelectTrigger>
            <SelectContent>
              {unitTypes.map(t => (
                <SelectItem key={t.code} value={t.nameVi}>
                  {t.nameVi}{t.shortName ? ` (${t.shortName})` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <Label>Tên đơn vị *</Label>
        <Input
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
          placeholder="Tên đầy đủ của đơn vị"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Cấp độ *</Label>
          <Select value={formData.level.toString()} onValueChange={(v) => setFormData({ ...formData, level: parseInt(v) })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Cấp 1 (Học viện)</SelectItem>
              <SelectItem value="2">Cấp 2 (Khoa/Phòng)</SelectItem>
              <SelectItem value="3">Cấp 3 (Bộ môn/Ban)</SelectItem>
              <SelectItem value="4">Cấp 4 (Tiểu đoàn)</SelectItem>
              <SelectItem value="5">Cấp 5 (Đại đội/Tổ)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Đơn vị cha</Label>
          <Select
            value={formData.parentId || 'NONE'}
            onValueChange={(v) => setFormData({ ...formData, parentId: v === 'NONE' ? '' : v })}
          >
            <SelectTrigger><SelectValue placeholder="Chọn đơn vị cha" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="NONE">-- Không có (đơn vị gốc) --</SelectItem>
              {flatUnits.map((unit) => (
                <SelectItem key={unit.id} value={unit.id}>
                  {'  '.repeat(unit.level - 1)}{unit.code} – {unit.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <Label>Mô tả</Label>
        <Input
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Mô tả ngắn về đơn vị"
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>Hủy</Button>
        <Button type="submit">{submitLabel}</Button>
      </div>
    </form>
  );

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="h-16 rounded-xl bg-muted animate-pulse" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />)}
        </div>
        <div className="h-[500px] rounded-xl bg-muted animate-pulse" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/admin">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Building2 className="h-5 w-5" /> Quản lý Đơn vị
            </h1>
            <p className="text-sm text-muted-foreground">Cơ cấu tổ chức và phân bổ nhân sự theo đơn vị</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <div className="flex border rounded-lg overflow-hidden">
            <Button
              size="sm"
              variant={viewMode === 'tree' ? 'default' : 'ghost'}
              className="rounded-none"
              onClick={() => setViewMode('tree')}
            >
              <TreePine className="w-4 h-4 mr-1.5" /> Cây
            </Button>
            <Button
              size="sm"
              variant={viewMode === 'table' ? 'default' : 'ghost'}
              className="rounded-none border-l"
              onClick={() => setViewMode('table')}
            >
              <LayoutGrid className="w-4 h-4 mr-1.5" /> Bảng
            </Button>
          </div>
          <Button variant="outline" size="sm" onClick={fetchUnits}>
            <RefreshCw className="w-4 h-4 mr-1.5" /> Làm mới
          </Button>
          <Button
            size="sm"
            onClick={() => { resetForm(); setIsAddOpen(true); }}
          >
            <Plus className="w-4 h-4 mr-1.5" /> Thêm đơn vị
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-start gap-3">
              <div className="rounded-lg p-2.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tổng đơn vị</p>
                <p className="text-2xl font-bold">{flatUnits.length}</p>
                <p className="text-xs text-muted-foreground">
                  {level1Units.length} cấp 1 · {level2Units.length} cấp 2 · {level3Units.length} cấp 3+
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-start gap-3">
              <div className="rounded-lg p-2.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tổng nhân sự</p>
                <p className="text-2xl font-bold">{flatUnits.reduce((s, u) => s + u._count.users, 0)}</p>
                <p className="text-xs text-muted-foreground">đã gán vào đơn vị</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-start gap-3">
              <div className="rounded-lg p-2.5 bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Khoa / Phòng ban</p>
                <p className="text-2xl font-bold">
                  {flatUnits.filter(u => ['Khoa', 'Phòng', 'Ban'].includes(u.type)).length}
                </p>
                <p className="text-xs text-muted-foreground">đơn vị chức năng</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-start gap-3">
              <div className="rounded-lg p-2.5 bg-orange-500/10 text-orange-600 dark:text-orange-400">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Bộ môn / Tiểu đoàn</p>
                <p className="text-2xl font-bold">
                  {flatUnits.filter(u => ['Bộ môn', 'Tiểu đoàn', 'Đại đội'].includes(u.type)).length}
                </p>
                <p className="text-xs text-muted-foreground">đơn vị cơ sở</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-12 gap-4">
        {/* Tree / Table */}
        <div className={selectedUnit ? 'col-span-7' : 'col-span-12'}>
          <Card className="overflow-hidden">
            <CardHeader className="py-3 px-5 border-b bg-muted/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-muted-foreground" />
                  <CardTitle className="text-sm font-semibold">
                    {viewMode === 'tree' ? 'Cây đơn vị' : 'Bảng đơn vị'}
                  </CardTitle>
                  <span className="text-xs text-muted-foreground">— click để xem nhân sự</span>
                </div>
                <div className="flex items-center gap-2">
                  {viewMode === 'tree' && (
                    <>
                      <button onClick={handleExpandAll} className="text-xs text-primary hover:underline">Mở tất cả</button>
                      <span className="text-muted-foreground">|</span>
                      <button onClick={handleCollapseAll} className="text-xs text-muted-foreground hover:underline">Thu gọn</button>
                      <span className="text-muted-foreground">|</span>
                    </>
                  )}
                  <Badge variant="secondary" className="text-xs">{flatUnits.length} đơn vị</Badge>
                </div>
              </div>
            </CardHeader>

            {viewMode === 'tree' ? (
              <ScrollArea className="h-[600px]">
                {units.length === 0 ? (
                  <div className="text-center py-16 text-muted-foreground">Chưa có đơn vị nào</div>
                ) : (
                  <div>{units.map(unit => renderUnit(unit, 0))}</div>
                )}
              </ScrollArea>
            ) : (
              <ScrollArea className="h-[600px]">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead>Mã</TableHead>
                      <TableHead>Tên đơn vị</TableHead>
                      <TableHead>Loại</TableHead>
                      <TableHead>Cấp</TableHead>
                      <TableHead>Đơn vị cha</TableHead>
                      <TableHead className="text-center">Nhân sự</TableHead>
                      <TableHead className="text-right">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tableUnits.map(unit => {
                      const parent = flatUnits.find(u => u.id === unit.parentId);
                      const isSelected = selectedUnit?.id === unit.id;
                      return (
                        <TableRow
                          key={unit.id}
                          className={`cursor-pointer hover:bg-accent/50 transition-colors ${isSelected ? 'bg-accent' : ''}`}
                          onClick={() => handleUnitClick(unit)}
                        >
                          <TableCell className="font-mono text-sm">
                            {'  '.repeat(unit.level - 1)}{unit.code}
                          </TableCell>
                          <TableCell className="font-medium">{unit.name}</TableCell>
                          <TableCell className="text-muted-foreground">{unit.type}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">Cấp {unit.level}</Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {parent ? parent.name : <span className="text-muted-foreground/40">—</span>}
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="inline-flex items-center gap-1 text-xs font-medium bg-green-500/10 text-green-600 dark:text-green-400 px-2 py-0.5 rounded-full">
                              <Users className="w-3 h-3" />{unit._count.users}
                            </span>
                          </TableCell>
                          <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex justify-end gap-1">
                              <Button size="sm" variant="ghost" onClick={() => router.push(`/dashboard/admin/users?unitId=${unit.id}`)}>
                                <UserPlus className="w-4 h-4" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={(e) => openEditDialog(unit, e)}>
                                <Edit className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </ScrollArea>
            )}
          </Card>
        </div>

        {/* Personnel Panel */}
        {selectedUnit && (
          <div className="col-span-5">
            <Card className="overflow-hidden">
              <CardHeader className="py-3 px-5 border-b bg-muted/30">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <CardTitle className="text-sm font-semibold truncate max-w-[180px]">
                        {selectedUnit.name}
                      </CardTitle>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{personnel.length} người trong đơn vị</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => { setSelectedUnit(null); setPersonnel([]); }}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>

              <div className="flex gap-2 px-4 py-3 border-b">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Tìm theo tên, email, mã..."
                    value={personnelSearch}
                    onChange={(e) => setPersonnelSearch(e.target.value)}
                    className="pl-9 h-9"
                  />
                </div>
                <Button onClick={openAssignPersonnelDialog} size="sm" className="whitespace-nowrap">
                  <UserPlus className="w-4 h-4 mr-1.5" /> Thêm
                </Button>
              </div>

              <ScrollArea className="h-[480px]">
                {loadingPersonnel ? (
                  <div className="space-y-2 p-3">
                    {[1, 2, 3].map(i => <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />)}
                  </div>
                ) : filteredPersonnel.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
                    <Users className="w-10 h-10 opacity-30" />
                    <p className="text-sm font-medium">
                      {personnel.length === 0 ? 'Chưa có nhân sự trong đơn vị này' : 'Không tìm thấy kết quả'}
                    </p>
                    {personnel.length === 0 && (
                      <p className="text-xs opacity-50">Nhấn "Thêm" để gán nhân sự</p>
                    )}
                  </div>
                ) : (
                  <div className="p-3 space-y-2">
                    {filteredPersonnel.map(person => {
                      const roleInfo = ROLE_LABELS[person.role] || { label: person.role, color: 'bg-muted text-muted-foreground' };
                      return (
                        <div
                          key={person.id}
                          className="p-3 border rounded-lg hover:bg-accent/50 transition-colors group"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div
                              className="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer"
                              onClick={() => router.push(`/dashboard/admin/users?search=${person.email}`)}
                            >
                              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                                <User className="w-4 h-4 text-primary" />
                              </div>
                              <div className="min-w-0">
                                <div className="font-medium text-sm truncate">{person.name || 'Chưa có tên'}</div>
                                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                                  <span className="text-xs text-muted-foreground truncate max-w-[140px]">{person.email}</span>
                                  {person.militaryId && (
                                    <span className="text-xs text-muted-foreground font-mono">{person.militaryId}</span>
                                  )}
                                </div>
                                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${roleInfo.color}`}>
                                    {roleInfo.label}
                                  </span>
                                  {person.rank && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
                                      {person.rank}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={() => handleUnassign(person.id)}
                              disabled={unassigningId === person.id}
                              className="opacity-0 group-hover:opacity-100 p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all flex-shrink-0"
                              title="Xóa khỏi đơn vị"
                            >
                              {unassigningId === person.id
                                ? <div className="w-3.5 h-3.5 border-2 border-destructive/50 border-t-transparent rounded-full animate-spin" />
                                : <X className="w-3.5 h-3.5" />
                              }
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </Card>
          </div>
        )}
      </div>

      {/* Add Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Thêm đơn vị mới</DialogTitle>
            <DialogDescription>Mã đơn vị phải duy nhất trong hệ thống</DialogDescription>
          </DialogHeader>
          {unitForm(handleCreate, 'Tạo đơn vị', () => setIsAddOpen(false))}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chỉnh sửa đơn vị</DialogTitle>
            <DialogDescription>
              Cập nhật thông tin đơn vị
              {editingUnit && (
                <span className="ml-1 font-mono text-xs bg-muted px-1.5 py-0.5 rounded">{editingUnit.code}</span>
              )}
            </DialogDescription>
          </DialogHeader>
          {unitForm(handleUpdate, 'Cập nhật', () => setIsEditOpen(false))}
        </DialogContent>
      </Dialog>

      {/* Assign Personnel Dialog */}
      <Dialog open={isAssignPersonnelOpen} onOpenChange={setIsAssignPersonnelOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-primary" />
              Gán nhân sự vào: {selectedUnit?.name}
            </DialogTitle>
            <DialogDescription>
              Chọn nhân sự chưa có đơn vị để gán. Đã chọn: {selectedPersonnelIds.length} người
            </DialogDescription>
          </DialogHeader>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Tìm theo tên, email, quân hàm..."
              value={availablePersonnelSearch}
              onChange={(e) => setAvailablePersonnelSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <ScrollArea className="h-[400px] border rounded-lg">
            {loadingAvailablePersonnel ? (
              <div className="text-center py-8 text-muted-foreground">Đang tải danh sách nhân sự...</div>
            ) : filteredAvailablePersonnel.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-40" />
                {availablePersonnel.length === 0
                  ? 'Không có nhân sự nào chưa được gán đơn vị'
                  : 'Không tìm thấy kết quả phù hợp'}
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {filteredAvailablePersonnel.map(person => {
                  const isSelected = selectedPersonnelIds.includes(person.id);
                  return (
                    <div
                      key={person.id}
                      onClick={() => togglePersonnelSelection(person.id)}
                      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all border-2 ${
                        isSelected ? 'bg-accent border-primary/50' : 'hover:bg-accent/50 border-transparent'
                      }`}
                    >
                      <Checkbox checked={isSelected} className="pointer-events-none" />
                      <div className="w-9 h-9 bg-muted rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm truncate">{person.name || 'Chưa có tên'}</div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                          <span className="truncate max-w-[160px]">{person.email}</span>
                          {person.militaryId && <span className="font-mono">{person.militaryId}</span>}
                        </div>
                        <div className="flex items-center gap-1.5 mt-1">
                          {(() => {
                            const r = ROLE_LABELS[person.role] || { label: person.role, color: 'bg-muted text-muted-foreground' };
                            return <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${r.color}`}>{r.label}</span>;
                          })()}
                          {person.rank && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">{person.rank}</span>
                          )}
                        </div>
                      </div>
                      {isSelected && <Check className="w-5 h-5 text-primary flex-shrink-0" />}
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>

          <div className="flex justify-between items-center pt-2">
            <p className="text-sm text-muted-foreground">
              Hiển thị {filteredAvailablePersonnel.length} / {availablePersonnel.length} nhân sự
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsAssignPersonnelOpen(false)}>Hủy</Button>
              <Button onClick={handleAssignPersonnel} disabled={selectedPersonnelIds.length === 0} className="gap-2">
                <UserPlus className="w-4 h-4" />
                Gán {selectedPersonnelIds.length} người
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
