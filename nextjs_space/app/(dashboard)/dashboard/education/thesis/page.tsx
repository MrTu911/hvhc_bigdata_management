/**
 * M10 – UC-59: Quản lý khóa luận / luận văn / đồ án
 * /dashboard/education/thesis
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import {
  Plus, Search, MoreHorizontal, FileText, ChevronLeft, ChevronRight,
  BookOpen, GraduationCap, Archive, PlayCircle, CheckCircle2,
  TrendingUp, Star, Users,
} from 'lucide-react';

// ============= CONSTANTS =============

const THESIS_TYPE_LABELS: Record<string, string> = {
  khoa_luan: 'Khóa luận TN',
  luan_van:  'Luận văn ThS',
  luan_an:   'Luận án TS',
  do_an:     'Đồ án',
};

const STATUS_CONFIG: Record<string, {
  label: string;
  className: string;
  cardClass: string;
  icon: React.ReactNode;
}> = {
  DRAFT:       {
    label: 'Nháp',
    className: 'bg-gray-100 text-gray-700',
    cardClass: 'border-gray-200 bg-gray-50',
    icon: <FileText className="h-4 w-4 text-gray-500" />,
  },
  IN_PROGRESS: {
    label: 'Đang thực hiện',
    className: 'bg-blue-100 text-blue-700',
    cardClass: 'border-blue-200 bg-blue-50',
    icon: <PlayCircle className="h-4 w-4 text-blue-500" />,
  },
  DEFENDED:    {
    label: 'Đã bảo vệ',
    className: 'bg-green-100 text-green-700',
    cardClass: 'border-green-200 bg-green-50',
    icon: <CheckCircle2 className="h-4 w-4 text-green-500" />,
  },
  ARCHIVED:    {
    label: 'Lưu trữ',
    className: 'bg-purple-100 text-purple-700',
    cardClass: 'border-purple-200 bg-purple-50',
    icon: <Archive className="h-4 w-4 text-purple-500" />,
  },
};

const STATUS_TRANSITIONS: Record<string, string[]> = {
  DRAFT:       ['IN_PROGRESS'],
  IN_PROGRESS: ['DEFENDED'],
  DEFENDED:    ['ARCHIVED'],
  ARCHIVED:    [],
};

// ============= TYPES =============

interface ThesisItem {
  id: string;
  hocVienId: string;
  thesisType: string;
  title: string;
  titleEn: string | null;
  advisorId: string | null;
  reviewerId: string | null;
  defenseDate: string | null;
  defenseScore: number | null;
  status: string;
  abstractText: string | null;
  keywords: string | null;
  notes: string | null;
  repositoryFileUrl: string | null;
  createdAt: string;
  hocVien: { id: string; maHocVien: string; hoTen: string; lop: string | null };
  advisor:  { id: string; user: { name: string } } | null;
  reviewer: { id: string; user: { name: string } } | null;
}

interface ThesisStats {
  total: number;
  byStatus: Record<string, number>;
  byType: Record<string, number>;
  avgDefenseScore: number | null;
  defendedWithScore: number;
  topAdvisors: { advisorId: string | null; name: string; count: number }[];
}

interface Faculty {
  id: string;
  user: { name: string };
}

interface HocVienOption {
  id: string;
  maHocVien: string;
  hoTen: string;
}

const EMPTY_FORM = {
  hocVienId: '',
  thesisType: 'khoa_luan',
  title: '',
  titleEn: '',
  advisorId: '',
  reviewerId: '',
  defenseDate: '',
  defenseScore: '',
  abstractText: '',
  keywords: '',
  notes: '',
  repositoryFileUrl: '',
};

// ============= PAGE =============

export default function ThesisPage() {
  const [items, setItems]         = useState<ThesisItem[]>([]);
  const [loading, setLoading]     = useState(true);
  const [total, setTotal]         = useState(0);
  const [page, setPage]           = useState(1);
  const limit = 20;

  // Filters
  const [search, setSearch]             = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType]     = useState('');

  // Dialog
  const [dialogOpen, setDialogOpen]   = useState(false);
  const [editingItem, setEditingItem] = useState<ThesisItem | null>(null);
  const [form, setForm]               = useState({ ...EMPTY_FORM });
  const [submitting, setSubmitting]   = useState(false);

  // Supporting data
  const [faculty, setFaculty]   = useState<Faculty[]>([]);
  const [students, setStudents] = useState<HocVienOption[]>([]);
  const [stats, setStats]       = useState<ThesisStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // ── Data fetching ─────────────────────────────────────────────────────────

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (filterStatus) params.set('status', filterStatus);
      if (filterType)   params.set('thesisType', filterType);

      const res = await fetch(`/api/education/thesis?${params}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setItems(data.data);
          setTotal(data.meta.total);
        }
      }
    } catch {
      toast.error('Không thể tải danh sách khóa luận');
    } finally {
      setLoading(false);
    }
  }, [page, filterStatus, filterType]);

  const fetchStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      const res = await fetch('/api/education/thesis/stats');
      if (res.ok) {
        const data = await res.json();
        if (data.success) setStats(data.data);
      }
    } catch { /* non-critical */ }
    finally { setStatsLoading(false); }
  }, []);

  const fetchFaculty = async () => {
    try {
      const res = await fetch('/api/faculty/list?limit=100');
      if (res.ok) {
        const data = await res.json();
        // API returns { success, faculty: [...] }
        setFaculty(data.faculty || []);
      }
    } catch { /* silent */ }
  };

  const fetchStudents = async (q: string) => {
    if (!q || q.length < 2) return;
    try {
      const res = await fetch(`/api/education/students?search=${encodeURIComponent(q)}&limit=20`);
      if (res.ok) {
        const data = await res.json();
        setStudents(data.data || []);
      }
    } catch { /* silent */ }
  };

  useEffect(() => { fetchItems(); }, [fetchItems]);
  useEffect(() => { fetchStats(); }, [fetchStats]);
  useEffect(() => { fetchFaculty(); }, []);

  // ── Form helpers ──────────────────────────────────────────────────────────

  const openCreate = () => {
    setEditingItem(null);
    setForm({ ...EMPTY_FORM });
    setDialogOpen(true);
  };

  const openEdit = (item: ThesisItem) => {
    setEditingItem(item);
    setForm({
      hocVienId:        item.hocVienId,
      thesisType:       item.thesisType,
      title:            item.title,
      titleEn:          item.titleEn ?? '',
      advisorId:        item.advisorId ?? '',
      reviewerId:       item.reviewerId ?? '',
      defenseDate:      item.defenseDate ? item.defenseDate.slice(0, 10) : '',
      defenseScore:     item.defenseScore != null ? String(item.defenseScore) : '',
      abstractText:     item.abstractText ?? '',
      keywords:         item.keywords ?? '',
      notes:            item.notes ?? '',
      repositoryFileUrl: item.repositoryFileUrl ?? '',
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.hocVienId || !form.title) {
      toast.error('Học viên và tiêu đề là bắt buộc');
      return;
    }
    try {
      setSubmitting(true);
      const payload: Record<string, unknown> = {
        hocVienId:        form.hocVienId,
        thesisType:       form.thesisType,
        title:            form.title,
        titleEn:          form.titleEn || null,
        advisorId:        form.advisorId  || null,
        reviewerId:       form.reviewerId || null,
        defenseDate:      form.defenseDate || null,
        defenseScore:     form.defenseScore !== '' ? parseFloat(form.defenseScore) : null,
        abstractText:     form.abstractText || null,
        keywords:         form.keywords || null,
        notes:            form.notes || null,
        repositoryFileUrl: form.repositoryFileUrl || null,
      };

      const url    = editingItem ? `/api/education/thesis/${editingItem.id}` : '/api/education/thesis';
      const method = editingItem ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(editingItem ? 'Cập nhật thành công' : 'Tạo khóa luận thành công');
        setDialogOpen(false);
        fetchItems();
        fetchStats();
      } else {
        toast.error(data.error || 'Lỗi lưu dữ liệu');
      }
    } catch {
      toast.error('Lỗi kết nối');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (id: string, nextStatus: string) => {
    try {
      const res = await fetch(`/api/education/thesis/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`Chuyển sang "${STATUS_CONFIG[nextStatus]?.label}"`);
        fetchItems();
        fetchStats();
      } else {
        toast.error(data.error || 'Lỗi cập nhật trạng thái');
      }
    } catch {
      toast.error('Lỗi kết nối');
    }
  };

  // ── Helpers ───────────────────────────────────────────────────────────────

  const filteredItems = search
    ? items.filter(i =>
        i.title.toLowerCase().includes(search.toLowerCase()) ||
        i.hocVien.hoTen.toLowerCase().includes(search.toLowerCase()) ||
        i.hocVien.maHocVien.toLowerCase().includes(search.toLowerCase())
      )
    : items;

  const totalPages = Math.ceil(total / limit);

  const typeTotal = stats
    ? Object.values(stats.byType).reduce((s, c) => s + c, 0)
    : 0;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Khóa luận / Luận văn / Đồ án</h1>
          <p className="text-muted-foreground">Quản lý vòng đời đề tài và kết quả bảo vệ</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" /> Thêm đề tài
        </Button>
      </div>

      {/* ── KPI Cards ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total */}
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-slate-100">
              <BookOpen className="h-5 w-5 text-slate-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Tổng đề tài</p>
              <p className="text-2xl font-bold">
                {statsLoading ? '—' : (stats?.total ?? 0)}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* In Progress */}
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100">
              <PlayCircle className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Đang thực hiện</p>
              <p className="text-2xl font-bold text-blue-600">
                {statsLoading ? '—' : (stats?.byStatus['IN_PROGRESS'] ?? 0)}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Defended */}
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-100">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Đã bảo vệ</p>
              <p className="text-2xl font-bold text-green-600">
                {statsLoading ? '—' : (stats?.byStatus['DEFENDED'] ?? 0)}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Avg Defense Score */}
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-100">
              <Star className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Điểm BV trung bình</p>
              <p className="text-2xl font-bold text-amber-600">
                {statsLoading ? '—' : (stats?.avgDefenseScore != null ? stats.avgDefenseScore.toFixed(1) : '—')}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Distribution Row ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Status breakdown */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              Theo trạng thái
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
              const count = stats?.byStatus[key] ?? 0;
              const pct   = stats?.total ? Math.round((count / stats.total) * 100) : 0;
              return (
                <div key={key}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <button
                      onClick={() => { setFilterStatus(filterStatus === key ? '' : key); setPage(1); }}
                      className="flex items-center gap-1.5 hover:underline"
                    >
                      {cfg.icon}
                      <span>{cfg.label}</span>
                    </button>
                    <span className="font-medium">{count} <span className="text-muted-foreground font-normal">({pct}%)</span></span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        key === 'IN_PROGRESS' ? 'bg-blue-400' :
                        key === 'DEFENDED'    ? 'bg-green-400' :
                        key === 'ARCHIVED'    ? 'bg-purple-400' : 'bg-gray-400'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Type breakdown + Top advisors */}
        <div className="space-y-4">
          {/* By type */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-muted-foreground" />
                Theo loại đề tài
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(THESIS_TYPE_LABELS).map(([key, label]) => {
                  const count = stats?.byType[key] ?? 0;
                  const pct   = typeTotal ? Math.round((count / typeTotal) * 100) : 0;
                  return (
                    <button
                      key={key}
                      onClick={() => { setFilterType(filterType === key ? '' : key); setPage(1); }}
                      className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm border transition-all hover:bg-accent
                        ${filterType === key ? 'ring-2 ring-primary border-primary' : ''}`}
                    >
                      <span className="truncate text-left">{label}</span>
                      <span className="ml-2 font-semibold shrink-0">
                        {count}
                        <span className="ml-1 text-xs text-muted-foreground font-normal">({pct}%)</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Top advisors */}
          {stats && stats.topAdvisors.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  GVHD nhiều đề tài nhất
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  {stats.topAdvisors.slice(0, 4).map((a, idx) => (
                    <div key={a.advisorId ?? idx} className="flex items-center justify-between text-sm">
                      <span className="truncate text-muted-foreground">
                        <span className="text-foreground font-medium mr-1">{idx + 1}.</span>
                        {a.name}
                      </span>
                      <Badge variant="secondary" className="ml-2 shrink-0">{a.count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* ── Filters ──────────────────────────────────────────────────────── */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-10"
                placeholder="Tìm theo tên học viên, mã HV, tiêu đề..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <Select
              value={filterType || '__ALL__'}
              onValueChange={v => { setFilterType(v === '__ALL__' ? '' : v); setPage(1); }}
            >
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="Loại đề tài" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__ALL__">Tất cả loại</SelectItem>
                {Object.entries(THESIS_TYPE_LABELS).map(([val, lbl]) => (
                  <SelectItem key={val} value={val}>{lbl}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={filterStatus || '__ALL__'}
              onValueChange={v => { setFilterStatus(v === '__ALL__' ? '' : v); setPage(1); }}
            >
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="Trạng thái" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__ALL__">Tất cả trạng thái</SelectItem>
                {Object.entries(STATUS_CONFIG).map(([val, cfg]) => (
                  <SelectItem key={val} value={val}>{cfg.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {(filterStatus || filterType) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setFilterStatus(''); setFilterType(''); setPage(1); }}
                className="text-muted-foreground"
              >
                Xóa bộ lọc
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Table ────────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-0">
          <CardTitle className="flex items-center gap-2 text-base">
            <BookOpen className="h-4 w-4 text-muted-foreground" />
            <span>
              {total} đề tài
              {filterStatus && <span className="ml-1 text-muted-foreground font-normal">· {STATUS_CONFIG[filterStatus]?.label}</span>}
              {filterType   && <span className="ml-1 text-muted-foreground font-normal">· {THESIS_TYPE_LABELS[filterType]}</span>}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 mt-2">
          {loading ? (
            <div className="h-40 flex items-center justify-center text-muted-foreground">Đang tải...</div>
          ) : filteredItems.length === 0 ? (
            <div className="h-40 flex flex-col items-center justify-center gap-2 text-muted-foreground">
              <GraduationCap className="h-8 w-8 opacity-30" />
              <span>Chưa có đề tài nào</span>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Học viên</TableHead>
                  <TableHead>Tiêu đề đề tài</TableHead>
                  <TableHead>Loại</TableHead>
                  <TableHead>GVHD</TableHead>
                  <TableHead>Ngày bảo vệ</TableHead>
                  <TableHead>Điểm</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map(item => {
                  const cfg          = STATUS_CONFIG[item.status];
                  const nextStatuses = STATUS_TRANSITIONS[item.status] ?? [];
                  return (
                    <TableRow key={item.id} className="hover:bg-muted/40">
                      <TableCell>
                        <div className="font-medium text-sm">{item.hocVien.hoTen}</div>
                        <div className="text-xs text-muted-foreground">{item.hocVien.maHocVien}{item.hocVien.lop ? ` · ${item.hocVien.lop}` : ''}</div>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <div className="font-medium text-sm line-clamp-2">{item.title}</div>
                        {item.titleEn && (
                          <div className="text-xs text-muted-foreground italic line-clamp-1">{item.titleEn}</div>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-xs px-2 py-0.5 rounded bg-muted font-medium">
                          {THESIS_TYPE_LABELS[item.thesisType] ?? item.thesisType}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm">
                        {item.advisor?.user.name ?? <span className="text-muted-foreground text-xs">—</span>}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {item.defenseDate
                          ? new Date(item.defenseDate).toLocaleDateString('vi-VN')
                          : '—'}
                      </TableCell>
                      <TableCell>
                        {item.defenseScore != null ? (
                          <span className={`font-semibold text-sm ${item.defenseScore >= 8.5 ? 'text-green-600' : item.defenseScore >= 7 ? 'text-blue-600' : item.defenseScore >= 5 ? 'text-amber-600' : 'text-red-600'}`}>
                            {item.defenseScore.toFixed(1)}
                          </span>
                        ) : <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell>
                        <Badge className={`${cfg?.className} flex items-center gap-1 w-fit text-xs`}>
                          {cfg?.icon} {cfg?.label ?? item.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEdit(item)}>
                              Chỉnh sửa
                            </DropdownMenuItem>
                            {nextStatuses.length > 0 && (
                              <>
                                <DropdownMenuSeparator />
                                {nextStatuses.map(ns => (
                                  <DropdownMenuItem
                                    key={ns}
                                    onClick={() => handleStatusChange(item.id, ns)}
                                    className={
                                      ns === 'DEFENDED' ? 'text-green-600' :
                                      ns === 'ARCHIVED' ? 'text-purple-600' : 'text-blue-600'
                                    }
                                  >
                                    {STATUS_CONFIG[ns]?.icon}
                                    <span className="ml-2">Chuyển: {STATUS_CONFIG[ns]?.label}</span>
                                  </DropdownMenuItem>
                                ))}
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
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
          <span>Trang {page} / {totalPages} ({total} đề tài)</span>
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
      <Dialog open={dialogOpen} onOpenChange={open => { setDialogOpen(open); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Cập nhật đề tài' : 'Thêm đề tài mới'}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Học viên */}
            {!editingItem && (
              <div className="space-y-2">
                <Label>Tìm học viên *</Label>
                <Input
                  placeholder="Nhập tên hoặc mã học viên..."
                  onChange={e => fetchStudents(e.target.value)}
                />
                {students.length > 0 && (
                  <Select value={form.hocVienId} onValueChange={v => setForm({ ...form, hocVienId: v })}>
                    <SelectTrigger><SelectValue placeholder="Chọn học viên" /></SelectTrigger>
                    <SelectContent>
                      {students.map(s => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.maHocVien} – {s.hoTen}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            )}

            {/* Loại + Tiêu đề */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Loại đề tài *</Label>
                <Select value={form.thesisType} onValueChange={v => setForm({ ...form, thesisType: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(THESIS_TYPE_LABELS).map(([val, lbl]) => (
                      <SelectItem key={val} value={val}>{lbl}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Tiêu đề (tiếng Việt) *</Label>
                <Input
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  placeholder="Tên đề tài..."
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Tiêu đề (tiếng Anh)</Label>
              <Input
                value={form.titleEn}
                onChange={e => setForm({ ...form, titleEn: e.target.value })}
                placeholder="English title..."
              />
            </div>

            {/* GVHD + Phản biện */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Giảng viên hướng dẫn</Label>
                <Select
                  value={form.advisorId || '__NONE__'}
                  onValueChange={v => setForm({ ...form, advisorId: v === '__NONE__' ? '' : v })}
                >
                  <SelectTrigger><SelectValue placeholder="Chọn GVHD" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__NONE__">— Chưa phân công —</SelectItem>
                    {faculty.map(f => (
                      <SelectItem key={f.id} value={f.id}>{f.user?.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Phản biện</Label>
                <Select
                  value={form.reviewerId || '__NONE__'}
                  onValueChange={v => setForm({ ...form, reviewerId: v === '__NONE__' ? '' : v })}
                >
                  <SelectTrigger><SelectValue placeholder="Chọn phản biện" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__NONE__">— Chưa phân công —</SelectItem>
                    {faculty.map(f => (
                      <SelectItem key={f.id} value={f.id}>{f.user?.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Ngày bảo vệ + Điểm */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Ngày bảo vệ</Label>
                <Input
                  type="date"
                  value={form.defenseDate}
                  onChange={e => setForm({ ...form, defenseDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Điểm bảo vệ (0–10)</Label>
                <Input
                  type="number" min={0} max={10} step={0.1}
                  value={form.defenseScore}
                  onChange={e => setForm({ ...form, defenseScore: e.target.value })}
                  placeholder="VD: 8.5"
                />
              </div>
            </div>

            {/* Keywords */}
            <div className="space-y-2">
              <Label>Từ khóa</Label>
              <Input
                value={form.keywords}
                onChange={e => setForm({ ...form, keywords: e.target.value })}
                placeholder="từ khóa 1, từ khóa 2..."
              />
            </div>

            {/* Abstract */}
            <div className="space-y-2">
              <Label>Tóm tắt</Label>
              <Textarea
                value={form.abstractText}
                onChange={e => setForm({ ...form, abstractText: e.target.value })}
                rows={3}
                placeholder="Mô tả nội dung đề tài..."
              />
            </div>

            {/* File URL */}
            <div className="space-y-2">
              <Label>URL file lưu trữ (MinIO)</Label>
              <Input
                value={form.repositoryFileUrl}
                onChange={e => setForm({ ...form, repositoryFileUrl: e.target.value })}
                placeholder="https://..."
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label>Ghi chú</Label>
              <Textarea
                value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })}
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Hủy</Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Đang lưu...' : editingItem ? 'Cập nhật' : 'Tạo đề tài'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
