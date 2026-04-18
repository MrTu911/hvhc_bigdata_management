'use client';

import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
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
  Plus,
  Search,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  X,
  Activity,
  FlaskConical,
  BarChart2,
} from 'lucide-react';

// ─── Constants ─────────────────────────────────────────────────────────────────

const ROLE_LABELS: Record<string, string> = {
  CHU_NHIEM: 'Chủ nhiệm',
  THAM_GIA:  'Tham gia',
  THANH_VIEN:'Thành viên',
};

const ROLE_STYLE: Record<string, string> = {
  CHU_NHIEM: 'bg-blue-100 text-blue-700 border-blue-200',
  THAM_GIA:  'bg-emerald-100 text-emerald-700 border-emerald-200',
  THANH_VIEN:'bg-gray-100 text-gray-600 border-gray-200',
};

const LEVEL_OPTIONS = [
  'Cấp Nhà nước',
  'Cấp Bộ',
  'Cấp Học viện',
  'Cấp Cơ sở',
  'Cấp Khoa',
];

const TYPE_OPTIONS = [
  'Đề tài NCKH',
  'Dự án NCKH',
  'Nhiệm vụ NCKH',
  'Đề án',
  'Chương trình KH&CN',
];

const ALL_SENTINEL = '__ALL__';
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 10 }, (_, i) => CURRENT_YEAR - i);

// ─── Types ─────────────────────────────────────────────────────────────────────

interface ResearchActivity {
  id: string;
  title: string;
  year: number;
  role: string;
  level: string;
  type: string;
  institution: string | null;
  result: string | null;
  notes: string | null;
  user: { id: string; name: string; email: string; rank: string | null };
}

interface FormState {
  title: string;
  year: string;
  role: string;
  level: string;
  type: string;
  institution: string;
  result: string;
  notes: string;
}

const EMPTY_FORM: FormState = {
  title: '',
  year: String(CURRENT_YEAR),
  role: 'CHU_NHIEM',
  level: 'Cấp Học viện',
  type: 'Đề tài NCKH',
  institution: '',
  result: '',
  notes: '',
};

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function ResearchActivitiesPage() {
  const [activities, setActivities]   = useState<ResearchActivity[]>([]);
  const [loading, setLoading]         = useState(true);
  const [total, setTotal]             = useState(0);
  const [page, setPage]               = useState(1);
  const limit = 20;

  // ── Filters ─────────────────────────────────────────────────────────────────
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch]           = useState('');
  const [filterYear, setFilterYear]   = useState('');
  const [filterLevel, setFilterLevel] = useState('');

  // ── Stats ───────────────────────────────────────────────────────────────────
  const [statsByLevel, setStatsByLevel] = useState<{ level: string; _count: { id: number } }[]>([]);
  const [availableYears, setAvailableYears] = useState<number[]>([]);

  // ── Dialog state ────────────────────────────────────────────────────────────
  const [dialogOpen, setDialogOpen]   = useState(false);
  const [editTarget, setEditTarget]   = useState<ResearchActivity | null>(null);
  const [form, setForm]               = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving]           = useState(false);
  const [deleteId, setDeleteId]       = useState<string | null>(null);
  const [deleting, setDeleting]       = useState(false);

  const totalPages = Math.ceil(total / limit);
  const hasFilter  = !!(search || filterYear || filterLevel);

  // ── Fetch ────────────────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (search)      params.set('search', search);
      if (filterYear)  params.set('year', filterYear);
      if (filterLevel) params.set('level', filterLevel);

      const res = await fetch(`/api/research/activities?${params}`);
      if (!res.ok) throw new Error();
      const data = await res.json();

      setActivities(data.activities ?? []);
      setTotal(data.total ?? 0);
      setStatsByLevel(data.stats ?? []);
      setAvailableYears(data.years ?? []);
    } catch {
      toast.error('Lỗi khi tải dữ liệu hoạt động nghiên cứu');
    } finally {
      setLoading(false);
    }
  }, [page, search, filterYear, filterLevel]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { setPage(1); }, [search, filterYear, filterLevel]);

  // ── Filter helpers ───────────────────────────────────────────────────────────
  function applySearch() { setSearch(searchInput); }
  function clearFilters() {
    setSearch(''); setSearchInput('');
    setFilterYear(''); setFilterLevel('');
  }

  // ── Dialog helpers ────────────────────────────────────────────────────────────
  function openCreate() {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  }

  function openEdit(a: ResearchActivity) {
    setEditTarget(a);
    setForm({
      title:       a.title,
      year:        String(a.year),
      role:        a.role,
      level:       a.level,
      type:        a.type,
      institution: a.institution ?? '',
      result:      a.result ?? '',
      notes:       a.notes ?? '',
    });
    setDialogOpen(true);
  }

  function setField(key: keyof FormState, value: string) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  // ── Save ─────────────────────────────────────────────────────────────────────
  async function handleSave() {
    if (!form.title.trim()) { toast.error('Vui lòng nhập tiêu đề đề tài'); return; }
    if (!form.year)          { toast.error('Vui lòng chọn năm'); return; }

    setSaving(true);
    try {
      const body = {
        title:       form.title.trim(),
        year:        parseInt(form.year),
        role:        form.role,
        level:       form.level,
        type:        form.type,
        institution: form.institution.trim() || null,
        result:      form.result.trim() || null,
        notes:       form.notes.trim() || null,
        ...(editTarget ? { id: editTarget.id } : {}),
      };

      const res = await fetch('/api/research/activities', {
        method: editTarget ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? 'Lỗi khi lưu');
      }

      toast.success(editTarget ? 'Cập nhật thành công' : 'Thêm hoạt động thành công');
      setDialogOpen(false);
      fetchData();
    } catch (e: any) {
      toast.error(e.message ?? 'Lỗi không xác định');
    } finally {
      setSaving(false);
    }
  }

  // ── Delete ────────────────────────────────────────────────────────────────────
  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/research/activities?id=${deleteId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast.success('Đã xóa hoạt động');
      setDeleteId(null);
      fetchData();
    } catch {
      toast.error('Lỗi khi xóa');
    } finally {
      setDeleting(false);
    }
  }

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-6 p-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Activity className="w-6 h-6 text-blue-600" />
            Hoạt động Nghiên cứu Khoa học
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Quản lý toàn bộ hoạt động NCKH của cán bộ trong đơn vị
          </p>
        </div>
        <Button onClick={openCreate} className="flex items-center gap-2 shrink-0">
          <Plus className="w-4 h-4" />
          Thêm hoạt động
        </Button>
      </div>

      {/* Stats */}
      {statsByLevel.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          <Card className="border-0 shadow-sm bg-blue-50 dark:bg-blue-900/20">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                <BarChart2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-xl font-bold text-blue-700 dark:text-blue-300">{total}</p>
                <p className="text-xs text-blue-600/70 dark:text-blue-400/70">Tổng hoạt động</p>
              </div>
            </CardContent>
          </Card>
          {statsByLevel.slice(0, 3).map(s => (
            <Card key={s.level} className="border-0 shadow-sm bg-white dark:bg-gray-800/50">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                  <FlaskConical className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                </div>
                <div>
                  <p className="text-xl font-bold text-gray-800 dark:text-gray-200">{s._count.id}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[100px]">{s.level}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Tìm tiêu đề, đơn vị, tác giả..."
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && applySearch()}
            className="pl-9"
          />
        </div>
        <Button variant="outline" size="sm" onClick={applySearch}>
          <Search className="w-4 h-4" />
        </Button>

        <Select
          value={filterYear || ALL_SENTINEL}
          onValueChange={v => setFilterYear(v === ALL_SENTINEL ? '' : v)}
        >
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="Năm" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_SENTINEL}>Tất cả năm</SelectItem>
            {(availableYears.length > 0 ? availableYears : YEARS).map(y => (
              <SelectItem key={y} value={String(y)}>{y}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filterLevel || ALL_SENTINEL}
          onValueChange={v => setFilterLevel(v === ALL_SENTINEL ? '' : v)}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Cấp độ" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_SENTINEL}>Tất cả cấp</SelectItem>
            {LEVEL_OPTIONS.map(l => (
              <SelectItem key={l} value={l}>{l}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasFilter && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="text-gray-500 gap-1">
            <X className="w-3.5 h-3.5" />
            Xóa bộ lọc
          </Button>
        )}
      </div>

      {/* Table */}
      <Card className="shadow-sm">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            </div>
          ) : activities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-gray-500">
              <FlaskConical className="w-10 h-10 mb-3 opacity-40" />
              <p className="text-sm font-medium">Chưa có hoạt động nghiên cứu</p>
              {hasFilter && (
                <p className="text-xs mt-1">Thử xóa bộ lọc để xem tất cả</p>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/80 dark:bg-gray-800/50">
                  <TableHead className="pl-5 w-[36%]">Tên đề tài / Hoạt động</TableHead>
                  <TableHead className="w-[12%]">Năm</TableHead>
                  <TableHead className="w-[15%]">Vai trò</TableHead>
                  <TableHead className="w-[13%]">Cấp độ</TableHead>
                  <TableHead className="w-[15%]">Tác giả</TableHead>
                  <TableHead className="w-[9%] text-right pr-5">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activities.map(a => (
                  <TableRow key={a.id} className="hover:bg-gray-50/60 dark:hover:bg-gray-800/30 transition-colors">
                    <TableCell className="pl-5 py-3">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100 line-clamp-2 text-sm">
                          {a.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[11px] text-gray-400">{a.type}</span>
                          {a.institution && (
                            <>
                              <span className="text-gray-300">·</span>
                              <span className="text-[11px] text-gray-400 truncate max-w-[160px]">{a.institution}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-700 dark:text-gray-300">{a.year}</TableCell>
                    <TableCell>
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium border whitespace-nowrap ${ROLE_STYLE[a.role] ?? 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                        {ROLE_LABELS[a.role] ?? a.role}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600 dark:text-gray-400">{a.level}</TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm text-gray-700 dark:text-gray-300">{a.user.name}</p>
                        {a.user.rank && (
                          <p className="text-[11px] text-gray-400">{a.user.rank}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right pr-5">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEdit(a)}
                          className="h-7 w-7 p-0 text-gray-400 hover:text-blue-600"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteId(a.id)}
                          className="h-7 w-7 p-0 text-gray-400 hover:text-red-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
          <span>Hiển thị {(page - 1) * limit + 1}–{Math.min(page * limit, total)} / {total} hoạt động</span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="px-2 tabular-nums">{page} / {totalPages}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editTarget ? <Pencil className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {editTarget ? 'Chỉnh sửa hoạt động' : 'Thêm hoạt động nghiên cứu'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Tên đề tài */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Tên đề tài / Hoạt động <span className="text-red-500">*</span>
              </label>
              <Textarea
                value={form.title}
                onChange={e => setField('title', e.target.value)}
                placeholder="Nhập tên đề tài hoặc hoạt động nghiên cứu..."
                rows={2}
              />
            </div>

            {/* Năm + Vai trò */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Năm <span className="text-red-500">*</span>
                </label>
                <Select value={form.year} onValueChange={v => setField('year', v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {YEARS.map(y => (
                      <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Vai trò <span className="text-red-500">*</span>
                </label>
                <Select value={form.role} onValueChange={v => setField('role', v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ROLE_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Cấp độ + Loại hình */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Cấp độ <span className="text-red-500">*</span>
                </label>
                <Select value={form.level} onValueChange={v => setField('level', v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LEVEL_OPTIONS.map(l => (
                      <SelectItem key={l} value={l}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Loại hình <span className="text-red-500">*</span>
                </label>
                <Select value={form.type} onValueChange={v => setField('type', v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TYPE_OPTIONS.map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Đơn vị */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Đơn vị thực hiện
              </label>
              <Input
                value={form.institution}
                onChange={e => setField('institution', e.target.value)}
                placeholder="Tên đơn vị chủ trì..."
              />
            </div>

            {/* Kết quả */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Kết quả / Xếp loại
              </label>
              <Input
                value={form.result}
                onChange={e => setField('result', e.target.value)}
                placeholder="VD: Xuất sắc, Tốt, Đạt..."
              />
            </div>

            {/* Ghi chú */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Ghi chú
              </label>
              <Textarea
                value={form.notes}
                onChange={e => setField('notes', e.target.value)}
                placeholder="Ghi chú thêm nếu cần..."
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              Hủy
            </Button>
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {editTarget ? 'Lưu thay đổi' : 'Thêm hoạt động'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={!!deleteId} onOpenChange={open => !open && setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
              <Trash2 className="w-4 h-4" />
              Xác nhận xóa
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600 dark:text-gray-400 py-2">
            Hoạt động nghiên cứu này sẽ bị xóa vĩnh viễn và không thể khôi phục.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)} disabled={deleting}>
              Hủy
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting} className="gap-2">
              {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
              Xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
