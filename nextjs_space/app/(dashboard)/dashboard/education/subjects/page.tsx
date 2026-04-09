'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Plus, Pencil, Trash2, Search, BookOpen,
  ChevronLeft, ChevronRight, GraduationCap, Layers, Hash,
} from 'lucide-react';
import { toast } from 'sonner';

// ============= CONSTANTS =============

const COURSE_TYPES: { value: string; label: string; badgeClass: string }[] = [
  { value: 'REQUIRED',    label: 'Bắt buộc',    badgeClass: 'bg-red-100 text-red-700' },
  { value: 'ELECTIVE',    label: 'Tự chọn',     badgeClass: 'bg-blue-100 text-blue-700' },
  { value: 'GENERAL',     label: 'Đại cương',   badgeClass: 'bg-gray-100 text-gray-700' },
  { value: 'SPECIALIZED', label: 'Chuyên ngành', badgeClass: 'bg-purple-100 text-purple-700' },
];

const COURSE_TYPE_MAP = Object.fromEntries(COURSE_TYPES.map(t => [t.value, t]));

// ============= TYPES =============

interface Subject {
  id: string;
  code: string;
  name: string;
  credits: number;
  courseType: string;
  unitId: string | null;
  unit?: { id: string; name: string; code: string } | null;
  description?: string | null;
  isActive: boolean;
  createdAt: string;
}

interface Unit {
  id: string;
  name: string;
  code: string;
  type?: string;
}

interface SubjectStats {
  total: number;
  totalCredits: number;
  byType: Record<string, number>;
  byUnit: { unitId: string; name: string; code: string; count: number }[];
}

const EMPTY_FORM = {
  code: '',
  name: '',
  credits: 3,
  courseType: 'REQUIRED',
  unitId: '',
  description: '',
};

// ============= PAGE =============

export default function SubjectManagementPage() {
  const [subjects, setSubjects]   = useState<Subject[]>([]);
  const [units, setUnits]         = useState<Unit[]>([]);
  const [loading, setLoading]     = useState(true);
  const [total, setTotal]         = useState(0);
  const [page, setPage]           = useState(1);
  const limit = 20;

  // Filters
  const [search, setSearch]           = useState('');
  const [filterUnit, setFilterUnit]   = useState('');
  const [filterType, setFilterType]   = useState('');

  // Stats
  const [stats, setStats]             = useState<SubjectStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Dialog
  const [dialogOpen, setDialogOpen]       = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [form, setForm]                   = useState({ ...EMPTY_FORM });
  const [submitting, setSubmitting]       = useState(false);

  // ── Fetchers ──────────────────────────────────────────────────────────────

  const fetchSubjects = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (search)     params.set('search', search);
      if (filterUnit) params.set('unitId', filterUnit);
      if (filterType) params.set('courseType', filterType);

      const res = await fetch(`/api/education/subjects?${params}`);
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      setSubjects(data.data ?? []);
      setTotal(data.pagination?.total ?? 0);
    } catch {
      toast.error('Lỗi khi tải danh sách môn học');
    } finally {
      setLoading(false);
    }
  }, [page, search, filterUnit, filterType]);

  const fetchStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      const res = await fetch('/api/education/subjects/stats');
      if (res.ok) {
        const data = await res.json();
        if (data.success) setStats(data.data);
      }
    } catch { /* non-critical */ }
    finally { setStatsLoading(false); }
  }, []);

  const fetchUnits = async () => {
    try {
      const res = await fetch('/api/units?limit=100');
      if (!res.ok) return;
      const data = await res.json();
      // API returns { success, units: [...] }
      setUnits(data.units ?? []);
    } catch { /* silent */ }
  };

  useEffect(() => { fetchSubjects(); }, [fetchSubjects]);
  useEffect(() => { fetchStats(); fetchUnits(); }, [fetchStats]);

  // ── Form helpers ──────────────────────────────────────────────────────────

  const openCreate = () => {
    setEditingSubject(null);
    setForm({ ...EMPTY_FORM });
    setDialogOpen(true);
  };

  const openEdit = (subject: Subject) => {
    setEditingSubject(subject);
    setForm({
      code:        subject.code,
      name:        subject.name,
      credits:     subject.credits,
      courseType:  subject.courseType,
      unitId:      subject.unitId ?? '',
      description: subject.description ?? '',
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.code || !form.name || !form.unitId) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc (mã môn, tên môn, đơn vị)');
      return;
    }
    try {
      setSubmitting(true);
      const url    = '/api/education/subjects';
      const method = editingSubject ? 'PUT' : 'POST';
      const body   = editingSubject ? { id: editingSubject.id, ...form } : form;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (res.ok) {
        toast.success(editingSubject ? 'Cập nhật thành công' : 'Thêm mới thành công');
        setDialogOpen(false);
        fetchSubjects();
        fetchStats();
      } else {
        toast.error(data.error || 'Có lỗi xảy ra');
      }
    } catch {
      toast.error('Lỗi kết nối');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa môn học này?')) return;
    try {
      const res = await fetch(`/api/education/subjects?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        toast.success('Xóa thành công');
        fetchSubjects();
        fetchStats();
      } else {
        toast.error(data.error || 'Không thể xóa');
      }
    } catch {
      toast.error('Lỗi kết nối');
    }
  };

  const clearFilters = () => {
    setSearch('');
    setFilterUnit('');
    setFilterType('');
    setPage(1);
  };

  // ── Derived ───────────────────────────────────────────────────────────────

  const totalPages  = Math.ceil(total / limit);
  const hasFilters  = !!(search || filterUnit || filterType);
  const statsTotal  = stats?.total ?? 0;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Quản lý môn học</h1>
          <p className="text-muted-foreground">Danh mục môn học theo khung chương trình đào tạo</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" /> Thêm môn học
        </Button>
      </div>

      {/* ── KPI Cards ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100">
              <BookOpen className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Tổng môn học</p>
              <p className="text-2xl font-bold">{statsLoading ? '—' : statsTotal}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-100">
              <Layers className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Bắt buộc</p>
              <p className="text-2xl font-bold text-red-600">
                {statsLoading ? '—' : (stats?.byType['REQUIRED'] ?? 0)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-100">
              <GraduationCap className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Chuyên ngành</p>
              <p className="text-2xl font-bold text-purple-600">
                {statsLoading ? '—' : (stats?.byType['SPECIALIZED'] ?? 0)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-100">
              <Hash className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Tổng tín chỉ</p>
              <p className="text-2xl font-bold text-amber-600">
                {statsLoading ? '—' : (stats?.totalCredits ?? 0)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Distribution Row ─────────────────────────────────────────────── */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* By course type */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Layers className="h-4 w-4 text-muted-foreground" />
                Theo loại môn học
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {COURSE_TYPES.map(({ value, label }) => {
                const count = stats.byType[value] ?? 0;
                const pct   = statsTotal > 0 ? Math.round((count / statsTotal) * 100) : 0;
                return (
                  <div key={value}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <button
                        type="button"
                        className="hover:underline text-left"
                        onClick={() => { setFilterType(filterType === value ? '' : value); setPage(1); }}
                      >
                        {label}
                      </button>
                      <span className="font-medium">
                        {count}
                        <span className="ml-1 text-xs text-muted-foreground font-normal">({pct}%)</span>
                      </span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      {/* eslint-disable-next-line react/forbid-dom-props -- dynamic bar width requires inline style */}
                      <div
                        className={`h-full rounded-full transition-all ${
                          value === 'REQUIRED'    ? 'bg-red-400' :
                          value === 'SPECIALIZED' ? 'bg-purple-400' :
                          value === 'ELECTIVE'    ? 'bg-blue-400' : 'bg-gray-400'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* By unit */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                Theo khoa / đơn vị
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats.byUnit.length === 0 ? (
                <p className="text-sm text-muted-foreground">Chưa có dữ liệu</p>
              ) : (
                <div className="space-y-2">
                  {stats.byUnit.map(u => {
                    const pct = statsTotal > 0 ? Math.round((u.count / statsTotal) * 100) : 0;
                    return (
                      <div key={u.unitId}>
                        <div className="flex items-center justify-between text-sm mb-0.5">
                          <button
                            type="button"
                            className="truncate hover:underline text-left max-w-[200px]"
                            onClick={() => { setFilterUnit(filterUnit === u.unitId ? '' : u.unitId); setPage(1); }}
                            title={u.name}
                          >
                            <span className="font-mono text-xs text-muted-foreground mr-1">{u.code}</span>
                            {u.name}
                          </button>
                          <span className="ml-2 font-medium shrink-0">
                            {u.count}
                            <span className="ml-1 text-xs text-muted-foreground font-normal">({pct}%)</span>
                          </span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          {/* eslint-disable-next-line react/forbid-dom-props -- dynamic bar width requires inline style */}
                          <div
                            className="h-full bg-blue-300 rounded-full transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Filters ──────────────────────────────────────────────────────── */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-10"
                placeholder="Tìm theo mã hoặc tên môn học..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
            <Select
              value={filterUnit || '__ALL__'}
              onValueChange={v => { setFilterUnit(v === '__ALL__' ? '' : v); setPage(1); }}
            >
              <SelectTrigger className="w-[200px]"><SelectValue placeholder="Khoa / đơn vị" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__ALL__">Tất cả đơn vị</SelectItem>
                {units.map(u => (
                  <SelectItem key={u.id} value={u.id}>{u.name} ({u.code})</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={filterType || '__ALL__'}
              onValueChange={v => { setFilterType(v === '__ALL__' ? '' : v); setPage(1); }}
            >
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Loại môn" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__ALL__">Tất cả loại</SelectItem>
                {COURSE_TYPES.map(t => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">
                Xóa bộ lọc
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Table ────────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-0">
          <CardTitle className="text-base flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-muted-foreground" />
            <span>
              {total} môn học
              {filterType && <span className="ml-1 text-muted-foreground font-normal">· {COURSE_TYPE_MAP[filterType]?.label}</span>}
              {filterUnit && units.find(u => u.id === filterUnit) && (
                <span className="ml-1 text-muted-foreground font-normal">
                  · {units.find(u => u.id === filterUnit)?.code}
                </span>
              )}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 mt-2">
          {loading ? (
            <div className="h-40 flex items-center justify-center text-muted-foreground">Đang tải...</div>
          ) : subjects.length === 0 ? (
            <div className="h-40 flex flex-col items-center justify-center gap-2 text-muted-foreground">
              <BookOpen className="h-8 w-8 opacity-30" />
              <span>Chưa có môn học nào</span>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã môn</TableHead>
                  <TableHead>Tên môn học</TableHead>
                  <TableHead>Khoa / đơn vị</TableHead>
                  <TableHead className="text-center w-20">Tín chỉ</TableHead>
                  <TableHead>Loại</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {subjects.map(subject => {
                  const typeConfig = COURSE_TYPE_MAP[subject.courseType];
                  return (
                    <TableRow key={subject.id} className="hover:bg-muted/40">
                      <TableCell>
                        <span className="font-mono font-medium text-sm">{subject.code}</span>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-sm">{subject.name}</div>
                        {subject.description && (
                          <div className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{subject.description}</div>
                        )}
                      </TableCell>
                      <TableCell>
                        {subject.unit ? (
                          <span className="text-sm">
                            <span className="font-mono text-xs text-muted-foreground mr-1">{subject.unit.code}</span>
                            {subject.unit.name}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-amber-100 text-amber-700 text-xs font-semibold">
                          {subject.credits}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeConfig?.badgeClass ?? 'bg-gray-100 text-gray-700'}`}>
                          {typeConfig?.label ?? subject.courseType}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(subject)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(subject.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* ── Pagination ───────────────────────────────────────────────────── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Trang {page} / {totalPages} ({total} môn học)</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* ── Create / Edit Dialog ─────────────────────────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={open => { setDialogOpen(open); if (!open) setEditingSubject(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingSubject ? 'Cập nhật môn học' : 'Thêm môn học mới'}</DialogTitle>
            <DialogDescription>
              {editingSubject
                ? 'Chỉnh sửa thông tin môn học'
                : 'Môn học sẽ được thêm vào khung CTĐT của đơn vị đã chọn'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Mã môn học *</Label>
                <Input
                  value={form.code}
                  onChange={e => setForm({ ...form, code: e.target.value })}
                  placeholder="VD: CNTT101"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Số tín chỉ *</Label>
                <Input
                  type="number" min={1} max={10}
                  value={form.credits}
                  onChange={e => setForm({ ...form, credits: parseInt(e.target.value) || 3 })}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Tên môn học *</Label>
              <Input
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="VD: Lập trình cơ bản"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Khoa / đơn vị *</Label>
                <Select
                  value={form.unitId || '__NONE__'}
                  onValueChange={v => setForm({ ...form, unitId: v === '__NONE__' ? '' : v })}
                >
                  <SelectTrigger><SelectValue placeholder="Chọn đơn vị" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__NONE__">— Chọn đơn vị —</SelectItem>
                    {units.map(u => (
                      <SelectItem key={u.id} value={u.id}>{u.name} ({u.code})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Loại môn</Label>
                <Select
                  value={form.courseType}
                  onValueChange={v => setForm({ ...form, courseType: v })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {COURSE_TYPES.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Mô tả</Label>
              <Input
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                placeholder="Mô tả ngắn về môn học..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Hủy</Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Đang lưu...' : editingSubject ? 'Cập nhật' : 'Thêm mới'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
