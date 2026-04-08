/**
 * M10 – UC-54: Quản lý lớp học phần
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import {
  BookMarked, CalendarSearch, Edit, Layers, Loader2,
  Plus, Search, Trash2, Users,
} from 'lucide-react';
import { SectionSchedulerDialog } from '@/components/education/section/section-scheduler';

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  OPEN: 'Mở đăng ký',
  CLOSED: 'Đóng đăng ký',
  IN_PROGRESS: 'Đang học',
  COMPLETED: 'Đã hoàn thành',
  CANCELLED: 'Đã hủy',
};

const STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  OPEN: 'default',
  CLOSED: 'secondary',
  IN_PROGRESS: 'default',
  COMPLETED: 'secondary',
  CANCELLED: 'destructive',
};

const DAY_LABELS: Record<number, string> = {
  0: 'CN', 1: 'T2', 2: 'T3', 3: 'T4', 4: 'T5', 5: 'T6', 6: 'T7',
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CourseSectionsPage() {
  const [sections, setSections] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // Meta for filters + form
  const [terms, setTerms] = useState<any[]>([]);
  const [faculties, setFaculties] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);

  // Filters
  const [search, setSearch] = useState('');
  const [filterTermId, setFilterTermId] = useState('');
  const [filterFacultyId, setFilterFacultyId] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Dialog state
  const [schedulerOpen, setSchedulerOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<any>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const LIMIT = 20;

  // ─── Fetch meta ──────────────────────────────────────────────────────────

  const fetchMeta = useCallback(async () => {
    try {
      const [termsRes, facultyRes, roomsRes] = await Promise.all([
        fetch('/api/education/terms'),
        fetch('/api/faculty/list?limit=200'),
        fetch('/api/training/rooms?limit=200'),
      ]);

      if (termsRes.ok) {
        const tj = await termsRes.json();
        setTerms(Array.isArray(tj) ? tj : tj.data || []);
      }
      if (facultyRes.ok) {
        const fj = await facultyRes.json();
        // faculty/list returns {success, data: {faculties, pagination}}
        setFaculties(fj.data?.faculties || fj.data || []);
      }
      if (roomsRes.ok) {
        const rj = await roomsRes.json();
        setRooms(Array.isArray(rj) ? rj : rj.data || []);
      }
    } catch {
      // non-critical
    }
  }, []);

  // ─── Fetch sections ───────────────────────────────────────────────────────

  const fetchSections = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', String(LIMIT));
      if (search.trim()) params.set('search', search.trim());
      if (filterTermId && filterTermId !== 'ALL') params.set('termId', filterTermId);
      if (filterFacultyId && filterFacultyId !== 'ALL') params.set('facultyId', filterFacultyId);
      if (filterStatus && filterStatus !== 'ALL') params.set('status', filterStatus);

      const res = await fetch(`/api/education/class-sections?${params}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Lỗi tải dữ liệu');
      setSections(json.data || []);
      setTotal(json.pagination?.total ?? 0);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, search, filterTermId, filterFacultyId, filterStatus]);

  useEffect(() => { fetchMeta(); }, [fetchMeta]);
  useEffect(() => { fetchSections(); }, [fetchSections]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchSections();
  };

  const openCreate = () => { setEditTarget(null); setSchedulerOpen(true); };
  const openEdit = (s: any) => { setEditTarget(s); setSchedulerOpen(true); };

  const handleDelete = async (id: string, code: string) => {
    if (!confirm(`Xóa lớp học phần "${code}"?`)) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/education/class-sections?id=${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Lỗi xóa lớp học phần');
      toast.success(`Đã xóa lớp "${code}"`);
      fetchSections();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  const totalPages = Math.ceil(total / LIMIT);

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CalendarSearch className="h-6 w-6 text-primary" />
            Lớp học phần
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            UC-54 – Quản lý lịch lớp học phần & kiểm tra xung đột
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">{total} lớp</span>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" /> Tạo lớp học phần
          </Button>
        </div>
      </div>

      {/* Filter bar */}
      <Card>
        <CardContent className="pt-4">
          <form onSubmit={handleSearch} className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder="Tìm mã hoặc tên lớp..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            <Select value={filterTermId} onValueChange={v => { setFilterTermId(v); setPage(1); }}>
              <SelectTrigger className="w-52">
                <SelectValue placeholder="Học kỳ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tất cả học kỳ</SelectItem>
                {terms.map((t: any) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}{t.isCurrent ? ' ★' : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterFacultyId} onValueChange={v => { setFilterFacultyId(v); setPage(1); }}>
              <SelectTrigger className="w-52">
                <SelectValue placeholder="Giảng viên" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tất cả giảng viên</SelectItem>
                {faculties.map((f: any) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.user?.name || f.name || f.id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={v => { setFilterStatus(v); setPage(1); }}>
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

            <Button type="submit" variant="outline">
              <Search className="h-4 w-4 mr-2" /> Tìm kiếm
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BookMarked className="h-5 w-5" />
            Danh sách lớp học phần
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
              <p>Đang tải...</p>
            </div>
          ) : sections.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <CalendarSearch className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">Chưa có lớp học phần</p>
              <p className="text-sm mt-1">Tạo lớp học phần đầu tiên cho học kỳ này</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mã lớp</TableHead>
                    <TableHead>Tên lớp học phần</TableHead>
                    <TableHead>Học phần</TableHead>
                    <TableHead>Học kỳ</TableHead>
                    <TableHead>Giảng viên</TableHead>
                    <TableHead>Phòng</TableHead>
                    <TableHead className="text-center">Lịch học</TableHead>
                    <TableHead className="text-center">Sĩ số</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sections.map((s: any) => (
                    <TableRow key={s.id}>
                      <TableCell>
                        <span className="font-mono text-sm font-semibold">{s.code}</span>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium max-w-[180px] truncate">{s.name}</div>
                      </TableCell>
                      <TableCell>
                        {s.curriculumCourse ? (
                          <div className="text-sm">
                            <span className="font-mono text-xs bg-muted px-1 py-0.5 rounded">
                              {s.curriculumCourse.subjectCode}
                            </span>
                            <div className="text-xs text-muted-foreground mt-0.5 max-w-[140px] truncate">
                              {s.curriculumCourse.subjectName}
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{s.term?.name || '—'}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{s.faculty?.user?.name || '—'}</span>
                      </TableCell>
                      <TableCell>
                        {s.room ? (
                          <div className="text-sm">
                            <span className="font-mono text-xs">{s.room.code}</span>
                            {s.room.building && (
                              <span className="text-xs text-muted-foreground ml-1">({s.room.building})</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {s.dayOfWeek != null && s.startPeriod != null ? (
                          <span className="text-xs font-medium text-foreground whitespace-nowrap">
                            {DAY_LABELS[s.dayOfWeek] ?? `T${s.dayOfWeek}`}&nbsp;
                            T{s.startPeriod}–{s.endPeriod}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1 text-sm">
                          <Users className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className={s._count?.enrollments >= s.maxStudents ? 'text-destructive font-medium' : ''}>
                            {s._count?.enrollments ?? 0}
                          </span>
                          <span className="text-muted-foreground">/ {s.maxStudents}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={STATUS_VARIANTS[s.status] || 'outline'}>
                          {STATUS_LABELS[s.status] || s.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEdit(s)}
                            title="Chỉnh sửa"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleDelete(s.id, s.code)}
                            disabled={deletingId === s.id}
                            title="Xóa"
                          >
                            {deletingId === s.id
                              ? <Loader2 className="h-4 w-4 animate-spin" />
                              : <Trash2 className="h-4 w-4" />}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
                  <span>Trang {page} / {totalPages} ({total} lớp)</span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      Trước
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                    >
                      Sau
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <SectionSchedulerDialog
        open={schedulerOpen}
        onClose={() => { setSchedulerOpen(false); setEditTarget(null); }}
        onSaved={fetchSections}
        section={editTarget}
        terms={terms}
        faculties={faculties}
        rooms={rooms}
      />
    </div>
  );
}
