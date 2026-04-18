/**
 * M10 – Quản lý Học viên Quân sự
 * /dashboard/education/military-students
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter,
} from '@/components/ui/sheet';
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
import { toast } from 'sonner';
import {
  Shield, Search, ChevronLeft, ChevronRight,
  Eye, Loader2, RefreshCw, Users, AlertTriangle,
  Plus, Pencil, Trash2,
} from 'lucide-react';

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  ACTIVE:         'Đang học',
  TEMP_SUSPENDED: 'Tạm ngưng',
  STUDY_DELAY:    'Bảo lưu',
  REPEATING:      'Học lại',
  DROPPED_OUT:    'Thôi học',
  GRADUATED:      'Tốt nghiệp',
  RESERVED:       'Dự bị',
};

const STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  ACTIVE:         'default',
  TEMP_SUSPENDED: 'secondary',
  STUDY_DELAY:    'secondary',
  REPEATING:      'outline',
  DROPPED_OUT:    'destructive',
  GRADUATED:      'secondary',
  RESERVED:       'outline',
};

const WARNING_COLORS: Record<string, string> = {
  CRITICAL: 'bg-red-100 text-red-700',
  HIGH:     'bg-orange-100 text-orange-700',
  MEDIUM:   'bg-yellow-100 text-yellow-700',
  LOW:      'bg-blue-100 text-blue-700',
};

const STUDY_MODE_LABELS: Record<string, string> = {
  CHINH_QUY:       'Chính quy',
  TAI_CHUC:        'Tại chức',
  TU_XA:           'Từ xa',
  VAN_BANG_2:      'Văn bằng 2',
  LIEN_THONG:      'Liên thông',
  NGHIEN_CUU_SINH: 'Nghiên cứu sinh',
  BOI_DUONG:       'Bồi dưỡng',
  SAU_DAI_HOC:     'Sau đại học',
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface Student {
  id: string;
  maHocVien: string;
  hoTen: string;
  lop: string | null;
  khoaHoc: string | null;
  nganh: string | null;
  currentStatus: string;
  studyMode: string | null;
  diemTrungBinh: number | null;
  khoaQuanLy: string | null;
  daiDoi: string | null;
  trungDoi: string | null;
  trainingSystemUnit: { id: string; name: string } | null;
  battalionUnit: { id: string; name: string } | null;
  academicWarnings: { warningLevel: string }[];
}

interface Meta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface AggregateStats {
  byStatus: Record<string, number>;
  lowGpaCount: number;
  warningCount: number;
}

interface TrainingSystem {
  id: string;
  name: string;
  battalions?: { id: string; name: string }[];
}

interface MajorItem {
  code: string;
  nameVi: string;
}

// ─── Form ─────────────────────────────────────────────────────────────────────

const emptyForm = {
  maHocVien:            '',
  hoTen:                '',
  ngaySinh:             '',
  gioiTinh:             'Nam',
  email:                '',
  dienThoai:            '',
  lop:                  '',
  khoaHoc:              '',
  nganh:                '',
  studyMode:            'CHINH_QUY',
  trainingSystemUnitId: '',
  battalionUnitId:      '',
  khoaQuanLy:           '',
  daiDoi:               '',
  trungDoi:             '',
  currentStatus:        'ACTIVE',
};
type FormState = typeof emptyForm;

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MilitaryStudentsPage() {
  const router = useRouter();

  // ── List state ──────────────────────────────────────────────────────────────
  const [students, setStudents]   = useState<Student[]>([]);
  const [loading, setLoading]     = useState(true);
  const [apiError, setApiError]   = useState<string | null>(null);
  const [meta, setMeta]           = useState<Meta>({ total: 0, page: 1, limit: 20, totalPages: 1 });
  const [aggStats, setAggStats]   = useState<AggregateStats>({ byStatus: {}, lowGpaCount: 0, warningCount: 0 });
  const limit = 20;

  // ── Filters ─────────────────────────────────────────────────────────────────
  const [page, setPage]                                   = useState(1);
  const [search, setSearch]                               = useState('');
  const [filterStatus, setFilterStatus]                   = useState('');
  const [filterKhoaHoc, setFilterKhoaHoc]                 = useState('');
  const [filterTrainingSystem, setFilterTrainingSystem]   = useState('');
  const [filterBattalion, setFilterBattalion]             = useState('');

  // ── Reference data ──────────────────────────────────────────────────────────
  const [trainingSystems, setTrainingSystems] = useState<TrainingSystem[]>([]);
  const [majorItems, setMajorItems]           = useState<MajorItem[]>([]);

  // ── Sheet / form ────────────────────────────────────────────────────────────
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editId, setEditId]       = useState<string | null>(null);
  const [form, setForm]           = useState<FormState>(emptyForm);
  const [saving, setSaving]       = useState(false);

  // ── Delete ───────────────────────────────────────────────────────────────────
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting]         = useState(false);

  const isEditing       = !!editId;
  const selectedSystem  = trainingSystems.find((s) => s.id === filterTrainingSystem);
  const formSystem      = trainingSystems.find((s) => s.id === form.trainingSystemUnitId);

  // ── Load reference data once ─────────────────────────────────────────────────
  useEffect(() => {
    fetch('/api/education/training-systems')
      .then((r) => r.json())
      .then((json) => { if (json.success) setTrainingSystems(json.data || []); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch('/api/master-data/MD_MAJOR')
      .then((r) => r.json())
      .then((json) => {
        const items: MajorItem[] = json?.data?.items ?? json?.data ?? [];
        setMajorItems(items);
      })
      .catch(() => {});
  }, []);

  // ── Fetch students ───────────────────────────────────────────────────────────
  const fetchStudents = useCallback(async () => {
    setLoading(true);
    setApiError(null);
    try {
      const qs = new URLSearchParams({ page: String(page), limit: String(limit), studentType: 'military' });
      if (search.trim())                                       qs.set('search', search.trim());
      if (filterStatus && filterStatus !== 'ALL')              qs.set('currentStatus', filterStatus);
      if (filterKhoaHoc.trim())                                qs.set('khoaHoc', filterKhoaHoc.trim());
      if (filterTrainingSystem && filterTrainingSystem !== 'ALL') qs.set('trainingSystemUnitId', filterTrainingSystem);
      if (filterBattalion && filterBattalion !== 'ALL')        qs.set('battalionUnitId', filterBattalion);

      const res  = await fetch(`/api/education/students?${qs}`);
      const json = await res.json();

      if (!res.ok) {
        const msg = json.error || `Lỗi ${res.status}`;
        setApiError(msg);
        toast.error(msg);
        return;
      }
      setStudents(json.data || []);
      setMeta(json.meta || { total: 0, page: 1, limit, totalPages: 1 });
      setAggStats(json.aggregateStats || { byStatus: {}, lowGpaCount: 0, warningCount: 0 });
    } catch (err: any) {
      const msg = err.message || 'Lỗi không xác định';
      setApiError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [page, search, filterStatus, filterKhoaHoc, filterTrainingSystem, filterBattalion]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const handleReset = () => {
    setSearch(''); setFilterStatus(''); setFilterKhoaHoc('');
    setFilterTrainingSystem(''); setFilterBattalion(''); setPage(1);
  };

  const openCreate = () => { setEditId(null); setForm(emptyForm); setSheetOpen(true); };

  const openEdit = async (id: string) => {
    setEditId(id); setSheetOpen(true);
    try {
      const res  = await fetch(`/api/education/students/${id}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Lỗi tải hồ sơ');
      const s = json.data;
      setForm({
        maHocVien:            s.maHocVien ?? '',
        hoTen:                s.hoTen ?? '',
        ngaySinh:             s.ngaySinh ? s.ngaySinh.slice(0, 10) : '',
        gioiTinh:             s.gioiTinh ?? 'Nam',
        email:                s.email ?? '',
        dienThoai:            s.dienThoai ?? '',
        lop:                  s.lop ?? '',
        khoaHoc:              s.khoaHoc ?? '',
        nganh:                s.nganh ?? '',
        studyMode:            s.studyMode ?? 'CHINH_QUY',
        trainingSystemUnitId: s.trainingSystemUnit?.id ?? '',
        battalionUnitId:      s.battalionUnit?.id ?? '',
        khoaQuanLy:           s.khoaQuanLy ?? '',
        daiDoi:               s.daiDoi ?? '',
        trungDoi:             s.trungDoi ?? '',
        currentStatus:        s.currentStatus ?? 'ACTIVE',
      });
    } catch (err: any) {
      toast.error('Không tải được hồ sơ: ' + err.message);
      setSheetOpen(false);
    }
  };

  const handleSave = async () => {
    if (!form.maHocVien.trim()) { toast.error('Mã học viên là bắt buộc'); return; }
    if (!form.hoTen.trim())     { toast.error('Họ tên là bắt buộc'); return; }
    setSaving(true);
    try {
      const payload = {
        ...form,
        ngaySinh:             form.ngaySinh || null,
        trainingSystemUnitId: form.trainingSystemUnitId || null,
        battalionUnitId:      form.battalionUnitId || null,
        khoaQuanLy:           form.khoaQuanLy || null,
        daiDoi:               form.daiDoi || null,
        trungDoi:             form.trungDoi || null,
      };
      const res = isEditing
        ? await fetch(`/api/education/students/${editId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
        : await fetch('/api/education/students', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Lỗi lưu dữ liệu');
      toast.success(isEditing ? `Đã cập nhật ${form.hoTen}` : `Đã tạo học viên ${form.hoTen}`);
      setSheetOpen(false);
      fetchStudents();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res  = await fetch(`/api/education/students/${deleteTarget.id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Lỗi xóa');
      toast.success(`Đã xóa học viên ${deleteTarget.name}`);
      setDeleteTarget(null);
      fetchStudents();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  };

  const setField = (key: keyof FormState, val: string) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  // ── Derived ──────────────────────────────────────────────────────────────────
  const activeCount  = aggStats.byStatus['ACTIVE'] ?? 0;
  const warningCount = aggStats.warningCount;
  const lowGpaCount  = aggStats.lowGpaCount;

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* Hero header */}
      <div className="bg-gradient-to-r from-green-700 via-emerald-700 to-teal-700 text-white p-6 rounded-xl shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <Shield className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Học viên Quân sự</h1>
              <p className="text-sm text-white/80 mt-0.5">
                Quản lý học viên có cơ cấu đơn vị quân sự — Đại đội / Trung đội / Tiểu đoàn
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-white/20 text-white border-white/30 text-sm px-3 py-1.5 font-semibold">
              {meta.total.toLocaleString('vi-VN')} học viên
            </Badge>
            <Button
              variant="ghost" size="sm"
              className="text-white hover:bg-white/20 border border-white/30"
              onClick={fetchStudents}
            >
              <RefreshCw className="h-4 w-4 mr-1.5" /> Làm mới
            </Button>
            <Button
              size="sm"
              className="bg-white text-green-800 hover:bg-white/90 font-semibold"
              onClick={openCreate}
            >
              <Plus className="h-4 w-4 mr-1.5" /> Thêm học viên
            </Button>
          </div>
        </div>
      </div>

      {/* Error banner */}
      {apiError && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-800">Không thể tải dữ liệu</p>
            <p className="text-sm text-red-700 mt-0.5">{apiError}</p>
            {apiError.includes('đăng nhập') && (
              <p className="text-xs text-red-600 mt-1">
                Phiên đăng nhập đã hết hạn — vui lòng{' '}
                <a href="/login" className="underline font-medium">đăng nhập lại</a>.
              </p>
            )}
          </div>
          <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-100" onClick={fetchStudents}>
            Thử lại
          </Button>
        </div>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{meta.total}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Tổng kết quả</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-green-700">{activeCount}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Đang học</p>
          </CardContent>
        </Card>
        <Card className={warningCount > 0 ? 'border-orange-300 bg-orange-50' : ''}>
          <CardContent className="pt-4 text-center">
            <p className={`text-2xl font-bold ${warningCount > 0 ? 'text-orange-600' : 'text-gray-600'}`}>
              {warningCount}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">Có cảnh báo HV</p>
          </CardContent>
        </Card>
        <Card className={lowGpaCount > 0 ? 'border-red-300 bg-red-50' : ''}>
          <CardContent className="pt-4 text-center">
            <p className={`text-2xl font-bold ${lowGpaCount > 0 ? 'text-red-600' : 'text-gray-600'}`}>
              {lowGpaCount}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">GPA dưới 5.0</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <form
            onSubmit={(e) => { e.preventDefault(); setPage(1); fetchStudents(); }}
            className="flex flex-wrap gap-3 items-end"
          >
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Tìm tên, mã học viên, lớp..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <Select
              value={filterStatus || 'ALL'}
              onValueChange={(v) => { setFilterStatus(v === 'ALL' ? '' : v); setPage(1); }}
            >
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
                {Object.entries(STATUS_LABELS).map(([v, l]) => (
                  <SelectItem key={v} value={v}>{l}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filterTrainingSystem || 'ALL'}
              onValueChange={(v) => {
                setFilterTrainingSystem(v === 'ALL' ? '' : v);
                setFilterBattalion('');
                setPage(1);
              }}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Hệ đào tạo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tất cả Hệ</SelectItem>
                {trainingSystems.map((sys) => (
                  <SelectItem key={sys.id} value={sys.id}>{sys.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {(selectedSystem?.battalions?.length ?? 0) > 0 && (
              <Select
                value={filterBattalion || 'ALL'}
                onValueChange={(v) => { setFilterBattalion(v === 'ALL' ? '' : v); setPage(1); }}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Tiểu đoàn" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tất cả Tiểu đoàn</SelectItem>
                  {selectedSystem!.battalions!.map((bat) => (
                    <SelectItem key={bat.id} value={bat.id}>{bat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <Input
              className="w-32"
              placeholder="Khóa (VD: K45)"
              value={filterKhoaHoc}
              onChange={(e) => { setFilterKhoaHoc(e.target.value); setPage(1); }}
            />

            <Button type="submit" variant="outline">
              <Search className="h-4 w-4 mr-2" /> Tìm kiếm
            </Button>

            {(search || filterStatus || filterKhoaHoc || filterTrainingSystem || filterBattalion) && (
              <Button type="button" variant="ghost" size="sm" onClick={handleReset}>
                Xóa lọc
              </Button>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4 text-green-700" />
            Danh sách học viên quân sự
            {!loading && (
              <span className="font-normal text-muted-foreground text-sm ml-1">
                — {meta.total} kết quả
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
              <span className="text-sm">Đang tải danh sách học viên...</span>
            </div>
          ) : students.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
              <Shield className="h-12 w-12 opacity-20" />
              <p className="font-medium">Không tìm thấy học viên quân sự</p>
              <p className="text-sm">Thử thay đổi bộ lọc hoặc thêm học viên mới</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleReset}>Xóa bộ lọc</Button>
                <Button size="sm" onClick={openCreate}>
                  <Plus className="h-4 w-4 mr-1.5" /> Thêm học viên
                </Button>
              </div>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-4">Học viên</TableHead>
                    <TableHead>Lớp / Khóa</TableHead>
                    <TableHead>Hệ / Tiểu đoàn</TableHead>
                    <TableHead>Đơn vị QL</TableHead>
                    <TableHead className="text-right">GPA</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Cảnh báo</TableHead>
                    <TableHead className="w-28 text-right pr-4">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((s) => (
                    <TableRow key={s.id} className="hover:bg-muted/40">
                      <TableCell className="pl-4">
                        <div className="font-medium text-sm">{s.hoTen}</div>
                        <div className="text-xs text-muted-foreground font-mono">{s.maHocVien}</div>
                      </TableCell>

                      <TableCell>
                        <div className="text-sm">{s.lop ?? '—'}</div>
                        {s.khoaHoc && <div className="text-xs text-muted-foreground">{s.khoaHoc}</div>}
                      </TableCell>

                      <TableCell>
                        {s.trainingSystemUnit ? (
                          <div>
                            <div className="text-xs font-medium text-indigo-700">{s.trainingSystemUnit.name}</div>
                            {s.battalionUnit && (
                              <div className="text-xs text-muted-foreground">{s.battalionUnit.name}</div>
                            )}
                          </div>
                        ) : <span className="text-muted-foreground text-xs">—</span>}
                      </TableCell>

                      <TableCell>
                        <div className="text-sm">{s.khoaQuanLy ?? '—'}</div>
                        {(s.daiDoi || s.trungDoi) && (
                          <div className="text-xs text-muted-foreground">
                            {[s.daiDoi, s.trungDoi].filter(Boolean).join(' · ')}
                          </div>
                        )}
                      </TableCell>

                      <TableCell className="text-right">
                        {s.diemTrungBinh != null && s.diemTrungBinh > 0 ? (
                          <span className={`font-bold text-sm ${s.diemTrungBinh < 5 ? 'text-red-600' : 'text-gray-800'}`}>
                            {s.diemTrungBinh.toFixed(2)}
                          </span>
                        ) : <span className="text-muted-foreground text-sm">—</span>}
                      </TableCell>

                      <TableCell>
                        <Badge variant={STATUS_VARIANTS[s.currentStatus] ?? 'outline'} className="text-xs">
                          {STATUS_LABELS[s.currentStatus] ?? s.currentStatus}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        {s.academicWarnings?.[0] && (
                          <span className={`inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full font-medium ${WARNING_COLORS[s.academicWarnings[0].warningLevel] ?? 'bg-gray-100 text-gray-700'}`}>
                            <AlertTriangle className="h-3 w-3" />
                            {s.academicWarnings[0].warningLevel}
                          </span>
                        )}
                      </TableCell>

                      <TableCell className="pr-4">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost" size="sm" className="h-8 w-8 p-0"
                            title="Xem hồ sơ"
                            onClick={() => router.push(`/dashboard/education/students/${s.id}`)}
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost" size="sm" className="h-8 w-8 p-0"
                            title="Chỉnh sửa"
                            onClick={() => openEdit(s.id)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost" size="sm"
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                            title="Xóa"
                            onClick={() => setDeleteTarget({ id: s.id, name: s.hoTen })}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {meta.totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t">
                  <span className="text-sm text-muted-foreground">
                    Trang {page}/{meta.totalPages} · {meta.total} học viên
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline" size="sm"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => p - 1)}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline" size="sm"
                      disabled={page >= meta.totalPages}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Create / Edit Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="sm:max-w-xl overflow-y-auto">
          <SheetHeader className="pb-4">
            <SheetTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-700" />
              {isEditing ? 'Cập nhật hồ sơ học viên' : 'Thêm học viên quân sự mới'}
            </SheetTitle>
          </SheetHeader>

          <div className="space-y-6 pb-6">
            {/* Thông tin cơ bản */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Thông tin cơ bản
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Mã học viên <span className="text-red-500">*</span></Label>
                  <Input
                    value={form.maHocVien}
                    onChange={(e) => setField('maHocVien', e.target.value)}
                    placeholder="VD: HV2024001"
                    disabled={isEditing}
                    className={isEditing ? 'bg-muted text-muted-foreground' : ''}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Họ và tên <span className="text-red-500">*</span></Label>
                  <Input
                    value={form.hoTen}
                    onChange={(e) => setField('hoTen', e.target.value)}
                    placeholder="Nguyễn Văn A"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Ngày sinh</Label>
                  <Input
                    type="date"
                    value={form.ngaySinh}
                    onChange={(e) => setField('ngaySinh', e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Giới tính</Label>
                  <Select value={form.gioiTinh} onValueChange={(v) => setField('gioiTinh', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Nam">Nam</SelectItem>
                      <SelectItem value="Nữ">Nữ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => setField('email', e.target.value)}
                    placeholder="hocvien@hvhc.edu.vn"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Điện thoại</Label>
                  <Input
                    value={form.dienThoai}
                    onChange={(e) => setField('dienThoai', e.target.value)}
                    placeholder="09xxxxxxxx"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Thông tin học tập */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Thông tin học tập
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Hệ đào tạo</Label>
                  <Select
                    value={form.trainingSystemUnitId || 'NONE'}
                    onValueChange={(v) => {
                      setField('trainingSystemUnitId', v === 'NONE' ? '' : v);
                      setField('battalionUnitId', '');
                    }}
                  >
                    <SelectTrigger><SelectValue placeholder="Chọn Hệ" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NONE">— Chưa phân Hệ —</SelectItem>
                      {trainingSystems.map((sys) => (
                        <SelectItem key={sys.id} value={sys.id}>{sys.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label>Tiểu đoàn</Label>
                  <Select
                    value={form.battalionUnitId || 'NONE'}
                    onValueChange={(v) => setField('battalionUnitId', v === 'NONE' ? '' : v)}
                    disabled={!formSystem?.battalions?.length}
                  >
                    <SelectTrigger><SelectValue placeholder="Chọn Tiểu đoàn" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NONE">— Chưa phân TĐ —</SelectItem>
                      {(formSystem?.battalions ?? []).map((bat) => (
                        <SelectItem key={bat.id} value={bat.id}>{bat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label>Lớp</Label>
                  <Input value={form.lop} onChange={(e) => setField('lop', e.target.value)} placeholder="VD: CSTC-K50" />
                </div>
                <div className="space-y-1.5">
                  <Label>Khóa học</Label>
                  <Input value={form.khoaHoc} onChange={(e) => setField('khoaHoc', e.target.value)} placeholder="VD: K50" />
                </div>
                <div className="space-y-1.5 col-span-2">
                  <Label>Ngành</Label>
                  {majorItems.length > 0 ? (
                    <Select
                      value={form.nganh || '__NONE__'}
                      onValueChange={(v) => setField('nganh', v === '__NONE__' ? '' : v)}
                    >
                      <SelectTrigger><SelectValue placeholder="Chọn ngành" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__NONE__">— Chưa xác định —</SelectItem>
                        {majorItems.map((item) => (
                          <SelectItem key={item.code} value={item.code}>{item.nameVi}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      value={form.nganh}
                      onChange={(e) => setField('nganh', e.target.value)}
                      placeholder="VD: Tài chính"
                    />
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label>Hình thức đào tạo</Label>
                  <Select value={form.studyMode} onValueChange={(v) => setField('studyMode', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(STUDY_MODE_LABELS).map(([code, label]) => (
                        <SelectItem key={code} value={code}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Trạng thái học tập</Label>
                  <Select value={form.currentStatus} onValueChange={(v) => setField('currentStatus', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(STATUS_LABELS).map(([v, l]) => (
                        <SelectItem key={v} value={v}>{l}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <Separator />

            {/* Đơn vị quân sự */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Đơn vị quân sự
              </p>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5 col-span-3">
                  <Label>Khoa/Đơn vị quản lý</Label>
                  <Input
                    value={form.khoaQuanLy}
                    onChange={(e) => setField('khoaQuanLy', e.target.value)}
                    placeholder="VD: Khoa Tài chính"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Đại đội</Label>
                  <Input value={form.daiDoi} onChange={(e) => setField('daiDoi', e.target.value)} placeholder="VD: Đại đội 1" />
                </div>
                <div className="space-y-1.5">
                  <Label>Trung đội</Label>
                  <Input value={form.trungDoi} onChange={(e) => setField('trungDoi', e.target.value)} placeholder="VD: Trung đội 2" />
                </div>
              </div>
            </div>
          </div>

          <SheetFooter className="border-t pt-4 flex gap-2">
            <Button
              variant="outline" className="flex-1"
              onClick={() => setSheetOpen(false)}
              disabled={saving}
            >
              Hủy
            </Button>
            <Button
              className="flex-1 bg-green-700 hover:bg-green-800"
              onClick={handleSave}
              disabled={saving}
            >
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isEditing ? 'Lưu thay đổi' : 'Tạo học viên'}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa học viên</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc muốn xóa học viên{' '}
              <span className="font-semibold text-foreground">{deleteTarget?.name}</span>?
              <br />
              Dữ liệu học tập sẽ được giữ lại (xóa mềm), có thể khôi phục sau.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Xóa học viên
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
