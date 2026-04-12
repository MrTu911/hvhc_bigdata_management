'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Users, Search, Plus, Filter, Download, ChevronLeft, ChevronRight,
  Eye, Edit, Trash2, MoreHorizontal, FileText, Shield, Star,
  AlertTriangle, CheckCircle,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

// ============= CONSTANTS =============

// Used only for client-side type detection (officer vs soldier classification)
const OFFICER_RANK_KEYWORDS = ['tướng', 'tá', 'úy'];
const SOLDIER_RANK_KEYWORDS = ['sĩ', 'binh'];

interface RankItem { id: string; name: string; category: string; }
interface EduLevelItem { id: string; name: string; }
interface PositionItem { code: string; nameVi: string; }

const WORK_STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Đang công tác',
  TRANSFERRED: 'Đã chuyển',
  RETIRED: 'Nghỉ hưu',
  SUSPENDED: 'Đình chỉ',
  RESIGNED: 'Đã thôi việc',
};

const WORK_STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-800',
  TRANSFERRED: 'bg-blue-100 text-blue-800',
  RETIRED: 'bg-gray-100 text-gray-800',
  SUSPENDED: 'bg-red-100 text-red-800',
  RESIGNED: 'bg-orange-100 text-orange-800',
};

// ============= INTERFACES =============

interface Personnel {
  id: string;
  name: string;
  email: string;
  employeeId: string;
  militaryId?: string;
  rank?: string;
  position?: string;
  phone?: string;
  workStatus: string;
  personnelType?: string;
  gender?: string;
  dateOfBirth?: string;
  educationLevel?: string;
  unitRelation?: { id: string; name: string; code: string; type: string };
}

interface Unit {
  id: string;
  name: string;
  code: string;
  type: string;
}

interface PersonnelFormData {
  name: string;
  email: string;
  phone: string;
  gender: string;
  dateOfBirth: string;
  rank: string;
  position: string;
  unitId: string;
  workStatus: string;
  joinDate: string;
  educationLevel: string;
}

const EMPTY_FORM: PersonnelFormData = {
  name: '',
  email: '',
  phone: '',
  gender: '',
  dateOfBirth: '',
  rank: '',
  position: '',
  unitId: '',
  workStatus: 'ACTIVE',
  joinDate: '',
  educationLevel: '',
};

// ============= HELPERS =============

function getPersonnelType(rank?: string): 'OFFICER' | 'SOLDIER' | 'CIVILIAN' {
  if (!rank) return 'CIVILIAN';
  const lower = rank.toLowerCase();
  if (OFFICER_RANK_KEYWORDS.some(k => lower.includes(k))) return 'OFFICER';
  if (SOLDIER_RANK_KEYWORDS.some(k => lower.includes(k))) return 'SOLDIER';
  return 'CIVILIAN';
}

function getRankBadgeColor(rank?: string): string {
  if (!rank) return 'bg-gray-100 text-gray-700';
  if (rank.includes('tướng') || rank.includes('Tướng')) return 'bg-red-100 text-red-800';
  if (rank.includes('tá') || rank.includes('Tá')) return 'bg-yellow-100 text-yellow-800';
  if (rank.includes('úy') || rank.includes('Úy')) return 'bg-blue-100 text-blue-800';
  return 'bg-green-100 text-green-800';
}

// ============= CREATE / EDIT MODAL =============

function PersonnelModal({
  mode,
  personnel,
  units,
  ranks,
  educationLevels,
  positions,
  onClose,
  onSaved,
}: {
  mode: 'create' | 'edit';
  personnel?: Personnel;
  units: Unit[];
  ranks: RankItem[];
  educationLevels: EduLevelItem[];
  positions: PositionItem[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<PersonnelFormData>(
    mode === 'edit' && personnel
      ? {
          name: personnel.name || '',
          email: personnel.email || '',
          phone: personnel.phone || '',
          gender: personnel.gender || '',
          dateOfBirth: personnel.dateOfBirth ? personnel.dateOfBirth.slice(0, 10) : '',
          rank: personnel.rank || '',
          position: personnel.position || '',
          unitId: personnel.unitRelation?.id || '',
          workStatus: personnel.workStatus || 'ACTIVE',
          joinDate: '',
          educationLevel: personnel.educationLevel || '',
        }
      : { ...EMPTY_FORM }
  );
  const [saving, setSaving] = useState(false);

  const update = (field: keyof PersonnelFormData, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async () => {
    if (!form.name.trim()) { toast.error('Họ tên là bắt buộc'); return; }
    if (mode === 'create' && !form.email.trim()) { toast.error('Email là bắt buộc'); return; }

    setSaving(true);
    try {
      let res: Response;
      if (mode === 'create') {
        res = await fetch('/api/personnel', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
      } else {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { email, ...updateData } = form;
        res = await fetch(`/api/personnel/${personnel!.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updateData),
        });
      }
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'Có lỗi xảy ra'); return; }
      toast.success(mode === 'create' ? 'Tạo hồ sơ thành công' : 'Cập nhật thành công');
      onSaved();
    } catch {
      toast.error('Lỗi kết nối');
    } finally {
      setSaving(false);
    }
  };

  const detectedType = getPersonnelType(form.rank);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Thêm mới hồ sơ cán bộ' : `Chỉnh sửa: ${personnel?.name}`}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 py-4">
          {/* Họ tên */}
          <div className="col-span-2">
            <Label>Họ và tên <span className="text-red-500">*</span></Label>
            <Input
              value={form.name}
              onChange={e => update('name', e.target.value)}
              placeholder="Nguyễn Văn A"
            />
          </div>

          {/* Email – chỉ khi tạo mới */}
          {mode === 'create' && (
            <div className="col-span-2">
              <Label>Email <span className="text-red-500">*</span></Label>
              <Input
                type="email"
                value={form.email}
                onChange={e => update('email', e.target.value)}
                placeholder="example@hvhc.edu.vn"
              />
            </div>
          )}

          {/* SĐT + Giới tính */}
          <div>
            <Label>Số điện thoại</Label>
            <Input
              value={form.phone}
              onChange={e => update('phone', e.target.value)}
              placeholder="0123456789"
            />
          </div>
          <div>
            <Label>Giới tính</Label>
            <Select value={form.gender} onValueChange={v => update('gender', v)}>
              <SelectTrigger><SelectValue placeholder="Chọn giới tính" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Nam">Nam</SelectItem>
                <SelectItem value="Nữ">Nữ</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Ngày sinh + Ngày nhập ngũ */}
          <div>
            <Label>Ngày sinh</Label>
            <Input
              type="date"
              value={form.dateOfBirth}
              onChange={e => update('dateOfBirth', e.target.value)}
            />
          </div>
          <div>
            <Label>Ngày nhập ngũ / vào ngành</Label>
            <Input
              type="date"
              value={form.joinDate}
              onChange={e => update('joinDate', e.target.value)}
            />
          </div>

          {/* Quân hàm + Chức vụ */}
          <div>
            <Label>Quân hàm</Label>
            <Select value={form.rank} onValueChange={v => update('rank', v)}>
              <SelectTrigger><SelectValue placeholder="Chọn quân hàm" /></SelectTrigger>
              <SelectContent className="max-h-[280px]">
                {ranks.map((r, idx) => {
                  const prev = ranks[idx - 1];
                  const showCat = !prev || prev.category !== r.category;
                  return (
                    <div key={r.id}>
                      {showCat && <div className="px-2 py-1 text-xs font-semibold text-muted-foreground bg-muted">{r.category}</div>}
                      <SelectItem value={r.name}>{r.name}</SelectItem>
                    </div>
                  );
                })}
              </SelectContent>
            </Select>
            {form.rank && (
              <p className="text-xs text-muted-foreground mt-1">
                Phân loại tự động:{' '}
                {detectedType === 'OFFICER' ? '🎖 Sĩ quan'
                  : detectedType === 'SOLDIER' ? '🪖 Quân nhân'
                  : '👔 Dân sự'}
              </p>
            )}
          </div>
          <div>
            <Label>Chức vụ</Label>
            {positions.length > 0 ? (
              <Select value={form.position} onValueChange={v => update('position', v)}>
                <SelectTrigger><SelectValue placeholder="Chọn chức vụ" /></SelectTrigger>
                <SelectContent>
                  {positions.map(p => (
                    <SelectItem key={p.code} value={p.nameVi}>{p.nameVi}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                value={form.position}
                onChange={e => update('position', e.target.value)}
                placeholder="Giảng viên, Trưởng phòng..."
              />
            )}
          </div>

          {/* Đơn vị */}
          <div className="col-span-2">
            <Label>Đơn vị</Label>
            <Select value={form.unitId} onValueChange={v => update('unitId', v)}>
              <SelectTrigger><SelectValue placeholder="Chọn đơn vị" /></SelectTrigger>
              <SelectContent>
                {units.map(u => (
                  <SelectItem key={u.id} value={u.id}>{u.name} ({u.code})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Trình độ + Trạng thái */}
          <div>
            <Label>Trình độ học vấn</Label>
            <Select value={form.educationLevel} onValueChange={v => update('educationLevel', v)}>
              <SelectTrigger><SelectValue placeholder="Chọn trình độ" /></SelectTrigger>
              <SelectContent className="max-h-[260px]">
                {educationLevels.map(e => (
                  <SelectItem key={e.id} value={e.name}>{e.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {mode === 'edit' && (
            <div>
              <Label>Trạng thái</Label>
              <Select value={form.workStatus} onValueChange={v => update('workStatus', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(WORK_STATUS_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>Hủy</Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? 'Đang lưu...' : mode === 'create' ? 'Tạo mới' : 'Lưu thay đổi'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============= DELETE CONFIRMATION =============

function DeleteModal({
  personnel,
  onClose,
  onDeleted,
}: {
  personnel: Personnel;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/personnel/${personnel.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'Không thể vô hiệu hóa'); return; }
      toast.success('Đã vô hiệu hóa hồ sơ cán bộ');
      onDeleted();
    } catch {
      toast.error('Lỗi kết nối');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Xác nhận vô hiệu hóa
          </DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-2">
          <p className="text-sm text-gray-700">
            Bạn có chắc chắn muốn vô hiệu hóa hồ sơ cán bộ{' '}
            <span className="font-semibold">{personnel.name}</span>?
          </p>
          <p className="text-xs text-muted-foreground">
            Trạng thái sẽ chuyển thành "Đã thôi việc". Dữ liệu vẫn được giữ lại trong hệ thống.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={deleting}>Hủy</Button>
          <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
            {deleting ? 'Đang xử lý...' : 'Xác nhận vô hiệu hóa'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============= MAIN PAGE =============

type TypeTab = 'ALL' | 'OFFICER' | 'SOLDIER';

export default function PersonnelListPage() {
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [ranks, setRanks] = useState<RankItem[]>([]);
  const [educationLevels, setEducationLevels] = useState<EduLevelItem[]>([]);
  const [positions, setPositions] = useState<PositionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeTab, setTypeTab] = useState<TypeTab>('ALL');
  const [rankFilter, setRankFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [stats, setStats] = useState<Record<string, number>>({});
  const [typeStats, setTypeStats] = useState({ OFFICER: 0, SOLDIER: 0, CIVILIAN: 0, TOTAL: 0 });

  // Modal state
  const [createModal, setCreateModal] = useState(false);
  const [editTarget, setEditTarget] = useState<Personnel | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Personnel | null>(null);

  const PAGE_SIZE = 20;

  const fetchPersonnel = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: PAGE_SIZE.toString(),
        ...(search && { search }),
        ...(rankFilter !== 'ALL' && { rank: rankFilter }),
        ...(statusFilter !== 'ALL' && { workStatus: statusFilter }),
        ...(typeTab !== 'ALL' && { type: typeTab }),
      });
      const res = await fetch(`/api/personnel?${params}`);
      const data = await res.json();
      if (data.data) {
        setPersonnel(data.data);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotalCount(data.pagination?.total || 0);
        setStats(data.stats || {});
        if (data.typeStats) setTypeStats(data.typeStats);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, rankFilter, statusFilter, search, typeTab]);

  useEffect(() => {
    fetch('/api/units?limit=200').then(r => r.json()).then(d => { if (d.units) setUnits(d.units); }).catch(() => {});
    fetch('/api/master-data/ranks').then(r => r.json()).then(d => { if (d.success) setRanks(d.data); }).catch(() => {});
    fetch('/api/master-data/education-levels').then(r => r.json()).then(d => { if (d.success) setEducationLevels(d.data); }).catch(() => {});
    fetch('/api/master-data/MD_POSITION_TYPE/items?onlyActive=true').then(r => r.json()).then(d => { if (d.success) setPositions(d.data); }).catch(() => {});
  }, []);

  useEffect(() => { fetchPersonnel(); }, [fetchPersonnel]);

  // Reset to page 1 when tab changes (fetchPersonnel will re-run via useCallback dep)
  useEffect(() => { setCurrentPage(1); }, [typeTab]);

  const handleSearch = () => { setCurrentPage(1); fetchPersonnel(); };

  // Server-side filtering is already applied; render all returned personnel
  const filteredPersonnel = personnel;

  // Use server-side type stats for accurate totals
  const activeCount = stats['ACTIVE'] || 0;

  const handleExport = async (format: 'excel' | 'csv') => {
    try {
      const params = new URLSearchParams({
        format,
        ...(search && { search }),
        ...(rankFilter !== 'ALL' && { rank: rankFilter }),
        ...(statusFilter !== 'ALL' && { workStatus: statusFilter }),
      });
      const res = await fetch(`/api/personnel/export?${params}`);
      if (!res.ok) { toast.error('Xuất dữ liệu thất bại'); return; }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `canbo_${new Date().toISOString().slice(0, 10)}.${format === 'excel' ? 'xlsx' : 'csv'}`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch { toast.error('Lỗi xuất dữ liệu'); }
  };

  const TYPE_TABS: { value: TypeTab; label: string; count: number }[] = [
    { value: 'ALL', label: 'Tất cả', count: typeStats.TOTAL },
    { value: 'OFFICER', label: 'Sĩ quan', count: typeStats.OFFICER },
    { value: 'SOLDIER', label: 'Quân nhân', count: typeStats.SOLDIER },
  ];

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="rounded-xl bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500 p-6 text-white shadow-md">
        <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-white">
            CSDL Sĩ quan, Quân nhân HVHC
          </h1>
          <p className="text-blue-100 text-sm">Tra cứu và quản lý hồ sơ cán bộ theo QĐ 144/BQP</p>
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100">
                <Download className="h-4 w-4 mr-2" />Xuất dữ liệu
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleExport('excel')}>
                <FileText className="h-4 w-4 mr-2" />Xuất Excel (.xlsx)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('csv')}>
                <FileText className="h-4 w-4 mr-2" />Xuất CSV (.csv)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button onClick={() => setCreateModal(true)} className="bg-white text-blue-700 hover:bg-white/90">
            <Plus className="h-4 w-4 mr-2" />Thêm mới
          </Button>
        </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Tổng cán bộ</p>
                <p className="text-2xl font-bold">{totalCount}</p>
              </div>
              <Users className="h-8 w-8 text-blue-300" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Đang công tác</p>
                <p className="text-2xl font-bold text-green-600">{activeCount}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-300" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Sĩ quan</p>
                <p className="text-2xl font-bold text-purple-600">{typeStats.OFFICER}</p>
              </div>
              <Star className="h-8 w-8 text-purple-300" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Quân nhân</p>
                <p className="text-2xl font-bold text-indigo-600">{typeStats.SOLDIER}</p>
              </div>
              <Shield className="h-8 w-8 text-indigo-300" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Type tabs */}
      <div className="flex gap-1 border-b">
        {TYPE_TABS.map(tab => (
          <button
            key={tab.value}
            onClick={() => setTypeTab(tab.value)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
              typeTab === tab.value
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {tab.label}
            <span className={`ml-2 px-1.5 py-0.5 rounded-full text-xs ${
              typeTab === tab.value ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[220px]">
              <label className="text-sm font-medium text-gray-700 mb-1 block">Tìm kiếm</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Tên, mã CB, email, SĐT..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-[180px]">
              <label className="text-sm font-medium text-gray-700 mb-1 block">Quân hàm</label>
              <Select value={rankFilter} onValueChange={v => { setRankFilter(v); setCurrentPage(1); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent className="max-h-[280px]">
                  <SelectItem value="ALL">Tất cả quân hàm</SelectItem>
                  {ranks.map((r, idx) => {
                    const prev = ranks[idx - 1];
                    const showCat = !prev || prev.category !== r.category;
                    return (
                      <div key={r.id}>
                        {showCat && <div className="px-2 py-1 text-xs font-semibold text-muted-foreground bg-muted">{r.category}</div>}
                        <SelectItem value={r.name}>{r.name}</SelectItem>
                      </div>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="w-[180px]">
              <label className="text-sm font-medium text-gray-700 mb-1 block">Trạng thái</label>
              <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setCurrentPage(1); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tất cả</SelectItem>
                  {Object.entries(WORK_STATUS_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleSearch} className="h-10">
              <Filter className="h-4 w-4 mr-2" />Lọc
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results info */}
      <div className="flex justify-between items-center text-sm text-muted-foreground">
        <span>
          Hiển thị <strong>{filteredPersonnel.length}</strong> / <strong>{totalCount}</strong> hồ sơ
          {typeTab !== 'ALL' && (
            <span className="ml-1">
              ({typeTab === 'OFFICER' ? 'Sĩ quan' : 'Quân nhân'})
            </span>
          )}
        </span>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 font-medium">
                  <TableHead className="w-[50px]">STT</TableHead>
                  <TableHead>Họ và tên</TableHead>
                  <TableHead>Mã CB</TableHead>
                  <TableHead>Loại</TableHead>
                  <TableHead>Quân hàm</TableHead>
                  <TableHead>Chức vụ</TableHead>
                  <TableHead>Đơn vị</TableHead>
                  <TableHead>SĐT</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="w-[80px] text-center">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPersonnel.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-14 text-gray-500">
                      <Users className="h-12 w-12 mx-auto mb-3 text-gray-200" />
                      <p className="font-medium">Không tìm thấy hồ sơ nào</p>
                      <p className="text-xs mt-1">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPersonnel.map((p, idx) => {
                    const pType = getPersonnelType(p.rank);
                    return (
                      <TableRow key={p.id} className="hover:bg-slate-50 transition-colors">
                        <TableCell className="text-gray-400 text-sm font-medium">
                          {(currentPage - 1) * PAGE_SIZE + idx + 1}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-semibold text-gray-900">{p.name}</p>
                            <p className="text-xs text-gray-500">{p.email}</p>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-xs text-gray-600">
                          {p.employeeId || p.militaryId || '-'}
                        </TableCell>
                        <TableCell>
                          {pType === 'OFFICER' ? (
                            <Badge className="bg-purple-100 text-purple-800 border-0 text-xs gap-1">
                              <Star className="h-3 w-3" />Sĩ quan
                            </Badge>
                          ) : pType === 'SOLDIER' ? (
                            <Badge className="bg-green-100 text-green-800 border-0 text-xs gap-1">
                              <Shield className="h-3 w-3" />Quân nhân
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">Dân sự</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {p.rank ? (
                            <Badge className={`${getRankBadgeColor(p.rank)} border-0 text-xs`}>
                              {p.rank}
                            </Badge>
                          ) : (
                            <span className="text-gray-400 text-xs">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm max-w-[150px] truncate">
                          {p.position || '-'}
                        </TableCell>
                        <TableCell className="text-sm max-w-[150px] truncate text-gray-600">
                          {p.unitRelation?.name || '-'}
                        </TableCell>
                        <TableCell className="text-sm">{p.phone || '-'}</TableCell>
                        <TableCell>
                          <Badge className={`${WORK_STATUS_COLORS[p.workStatus] || 'bg-gray-100 text-gray-700'} border-0 text-xs`}>
                            {WORK_STATUS_LABELS[p.workStatus] || p.workStatus}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link href={`/dashboard/personnel/${p.id}`}>
                                  <Eye className="h-4 w-4 mr-2" />Xem chi tiết
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setEditTarget(p)}>
                                <Edit className="h-4 w-4 mr-2" />Chỉnh sửa
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-red-600 focus:text-red-600 focus:bg-red-50"
                                onClick={() => setDeleteTarget(p)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />Vô hiệu hóa
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline" size="sm"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          {[...Array(Math.min(5, totalPages))].map((_, i) => {
            const page = currentPage <= 3 ? i + 1 : currentPage - 2 + i;
            if (page > totalPages) return null;
            return (
              <Button
                key={page}
                variant={currentPage === page ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </Button>
            );
          })}
          <Button
            variant="outline" size="sm"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* ── Modals ── */}
      {createModal && (
        <PersonnelModal
          mode="create"
          units={units}
          ranks={ranks}
          educationLevels={educationLevels}
          positions={positions}
          onClose={() => setCreateModal(false)}
          onSaved={() => { setCreateModal(false); fetchPersonnel(); }}
        />
      )}
      {editTarget && (
        <PersonnelModal
          mode="edit"
          personnel={editTarget}
          units={units}
          ranks={ranks}
          educationLevels={educationLevels}
          positions={positions}
          onClose={() => setEditTarget(null)}
          onSaved={() => { setEditTarget(null); fetchPersonnel(); }}
        />
      )}
      {deleteTarget && (
        <DeleteModal
          personnel={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDeleted={() => { setDeleteTarget(null); fetchPersonnel(); }}
        />
      )}
    </div>
  );
}
