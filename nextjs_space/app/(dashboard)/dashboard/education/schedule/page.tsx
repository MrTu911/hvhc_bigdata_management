/**
 * TRANG QUẢN LÝ LỊCH HUẤN LUYỆN
 * M10 – UC-54/55: Lớp học phần & Buổi học
 *
 * Navigation: Năm học → Học kỳ → Lớp học phần → Buổi học
 * Supports browsing any past academic year.
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  Plus, Search, Edit, Trash2, Users, Calendar, Clock, Building2,
  RefreshCw, CalendarPlus, AlertTriangle, CheckCircle2, BookOpen,
  PlayCircle, ChevronLeft, ChevronRight, GraduationCap, X,
} from 'lucide-react';

// ── ProgressBar ───────────────────────────────────────────────────────────────
// Sets width via DOM ref — avoids JSX style={} attribute flagged by linter.
function ProgressBar({ pct, colorClass }: { pct: number; colorClass: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.style.width = `${Math.min(100, Math.max(0, pct))}%`;
  }, [pct]);
  return <div ref={ref} className={`h-full rounded-full transition-all duration-500 ${colorClass}`} />;
}

// ============= CONSTANTS =============

const DAYS_OF_WEEK = [
  { value: '1', label: 'Thứ 2' },
  { value: '2', label: 'Thứ 3' },
  { value: '3', label: 'Thứ 4' },
  { value: '4', label: 'Thứ 5' },
  { value: '5', label: 'Thứ 6' },
  { value: '6', label: 'Thứ 7' },
  { value: '0', label: 'Chủ nhật' },
];

const SECTION_STATUS_CONFIG: Record<string, { label: string; badgeClass: string; barClass: string }> = {
  OPEN:        { label: 'Mở đăng ký',   badgeClass: 'bg-green-100 text-green-700',   barClass: 'bg-green-400' },
  CLOSED:      { label: 'Đóng ĐK',      badgeClass: 'bg-gray-100 text-gray-600',     barClass: 'bg-gray-400' },
  IN_PROGRESS: { label: 'Đang học',     badgeClass: 'bg-blue-100 text-blue-700',     barClass: 'bg-blue-400' },
  COMPLETED:   { label: 'Hoàn thành',   badgeClass: 'bg-purple-100 text-purple-700', barClass: 'bg-purple-400' },
  CANCELLED:   { label: 'Đã hủy',       badgeClass: 'bg-red-100 text-red-700',       barClass: 'bg-red-400' },
};

const SESSION_TYPE_LABELS: Record<string, string> = {
  THEORY:   'Lý thuyết',
  PRACTICE: 'Thực hành',
  EXAM:     'Kiểm tra',
  MAKEUP:   'Học bù',
};

const SESSION_STATUS_CONFIG: Record<string, { label: string; badgeClass: string }> = {
  SCHEDULED: { label: 'Đã lên lịch', badgeClass: 'bg-blue-100 text-blue-700' },
  COMPLETED: { label: 'Hoàn thành',  badgeClass: 'bg-green-100 text-green-700' },
  CANCELLED: { label: 'Đã hủy',      badgeClass: 'bg-red-100 text-red-700' },
};

// ============= TYPES =============

interface AcademicYear {
  id: string;
  code: string;
  name: string;
  isCurrent: boolean;
  terms?: Term[];
}

interface Term {
  id: string;
  code: string;
  name: string;
  termNumber: number;
  isCurrent: boolean;
  academicYearId: string;
  startDate: string;
  endDate: string;
}

interface ScheduleStats {
  totalSections: number;
  activeSections: number;
  totalSessions: number;
  completedSessions: number;
  scheduledSessions: number;
  byStatus: Record<string, number>;
  bySessionStatus: Record<string, number>;
  roomUtilization: { total: number; inUse: number; utilizationRate: number };
}

// ============= PAGE =============

export default function SchedulePage() {
  // ── Navigation state ─────────────────────────────────────────────────────
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [selectedYear, setSelectedYear]   = useState('');
  const [termsForYear, setTermsForYear]   = useState<Term[]>([]);
  const [selectedTerm, setSelectedTerm]   = useState('');

  // ── Data state ────────────────────────────────────────────────────────────
  const [classSections, setClassSections] = useState<any[]>([]);
  const [sessions, setSessions]           = useState<any[]>([]);
  const [rooms, setRooms]                 = useState<any[]>([]);
  const [faculty, setFaculty]             = useState<any[]>([]);
  const [subjects, setSubjects]           = useState<any[]>([]);
  const [stats, setStats]                 = useState<ScheduleStats | null>(null);
  const [statsLoading, setStatsLoading]   = useState(true);

  const [loading, setLoading]   = useState(false);
  const [total, setTotal]       = useState(0);
  const [page, setPage]         = useState(1);
  const limit = 20;

  // ── Filters ───────────────────────────────────────────────────────────────
  const [search, setSearch]             = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterFaculty, setFilterFaculty] = useState('');

  // ── Dialog / edit state ───────────────────────────────────────────────────
  const [classDialogOpen, setClassDialogOpen]       = useState(false);
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const [editingClass, setEditingClass]             = useState<any>(null);
  const [selectedClass, setSelectedClass]           = useState<any>(null);

  const [classForm, setClassForm] = useState({
    code: '', name: '', curriculumCourseId: '', termId: '', facultyId: '', roomId: '',
    maxStudents: 50, schedule: '', dayOfWeek: '', startPeriod: '', endPeriod: '',
  });

  const [generateForm, setGenerateForm] = useState({
    numberOfSessions: 15, startDate: '', dayOfWeek: '1',
    startTime: '07:00', endTime: '09:30', sessionType: 'THEORY',
    roomId: '', facultyId: '',
  });

  // ── Conflict check ────────────────────────────────────────────────────────
  const [conflictResult, setConflictResult] = useState<{
    hasConflict: boolean;
    conflicts: Array<{ type: string; severity: string; message: string }>;
  } | null>(null);
  const [conflictChecking, setConflictChecking] = useState(false);
  const conflictTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Fetchers ──────────────────────────────────────────────────────────────

  const fetchStats = useCallback(async (termId: string) => {
    if (!termId) return;
    try {
      setStatsLoading(true);
      const res = await fetch(`/api/education/schedule/stats?termId=${termId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) setStats(data.data);
      }
    } catch { /* non-critical */ }
    finally { setStatsLoading(false); }
  }, []);

  const fetchClassSections = useCallback(async () => {
    if (!selectedTerm) return;
    try {
      setLoading(true);
      const params = new URLSearchParams({
        termId: selectedTerm,
        page: String(page),
        limit: String(limit),
      });
      if (search)        params.set('search', search);
      if (filterStatus)  params.set('status', filterStatus);
      if (filterFaculty) params.set('facultyId', filterFaculty);

      const res = await fetch(`/api/education/class-sections?${params}`);
      if (res.ok) {
        const data = await res.json();
        setClassSections(data.data || []);
        setTotal(data.pagination?.total ?? 0);
      }
    } catch {
      toast.error('Không thể tải danh sách lớp học phần');
    } finally {
      setLoading(false);
    }
  }, [selectedTerm, search, filterStatus, filterFaculty, page]);

  const fetchSessions = useCallback(async (classSectionId: string) => {
    try {
      const res = await fetch(`/api/education/sessions?classSectionId=${classSectionId}`);
      if (res.ok) setSessions(await res.json());
      else setSessions([]);
    } catch { setSessions([]); }
  }, []);

  // Initial load: academic years + supporting data in parallel
  useEffect(() => {
    const init = async () => {
      const [yearsRes, roomsRes, facultyRes, subjectsRes] = await Promise.allSettled([
        fetch('/api/education/academic-years?includeTerms=true'),
        fetch('/api/training/rooms'),
        fetch('/api/faculty/list?limit=100'),
        fetch('/api/education/subjects?limit=200'),
      ]);

      // Academic years (with terms)
      if (yearsRes.status === 'fulfilled' && yearsRes.value.ok) {
        const years: AcademicYear[] = await yearsRes.value.json();
        // Sort newest first (already ordered by startDate desc from API)
        setAcademicYears(Array.isArray(years) ? years : []);

        const currentYear = years.find(y => y.isCurrent) ?? years[0];
        if (currentYear) {
          setSelectedYear(currentYear.id);
          const yearTerms = currentYear.terms ?? [];
          setTermsForYear(yearTerms);
          const currentTerm = yearTerms.find(t => t.isCurrent) ?? yearTerms[0];
          if (currentTerm) {
            setSelectedTerm(currentTerm.id);
            fetchStats(currentTerm.id);
          }
        }
      }

      if (roomsRes.status === 'fulfilled' && roomsRes.value.ok) {
        const data = await roomsRes.value.json();
        setRooms(Array.isArray(data) ? data : []);
      }

      if (facultyRes.status === 'fulfilled' && facultyRes.value.ok) {
        const data = await facultyRes.value.json();
        setFaculty(data.faculty || []);
      }

      if (subjectsRes.status === 'fulfilled' && subjectsRes.value.ok) {
        const data = await subjectsRes.value.json();
        setSubjects(data.data || []);
      }
    };

    init();
  }, [fetchStats]);

  useEffect(() => { fetchClassSections(); }, [fetchClassSections]);

  useEffect(() => {
    if (selectedClass) fetchSessions(selectedClass.id);
  }, [selectedClass, fetchSessions]);

  // ── Navigation handlers ───────────────────────────────────────────────────

  const handleYearChange = (yearId: string) => {
    setSelectedYear(yearId);
    setSelectedTerm('');
    setClassSections([]);
    setSelectedClass(null);
    setStats(null);
    setPage(1);

    const year = academicYears.find(y => y.id === yearId);
    const terms = year?.terms ?? [];
    setTermsForYear(terms);

    // Auto-select: current term of this year, else first
    const autoTerm = terms.find(t => t.isCurrent) ?? terms[0];
    if (autoTerm) {
      setSelectedTerm(autoTerm.id);
      fetchStats(autoTerm.id);
    }
  };

  const handleTermChange = (termId: string) => {
    setSelectedTerm(termId);
    setSelectedClass(null);
    setPage(1);
    fetchStats(termId);
  };

  const clearFilters = () => {
    setSearch('');
    setFilterStatus('');
    setFilterFaculty('');
    setPage(1);
  };

  // ── Conflict check ────────────────────────────────────────────────────────

  const runConflictCheck = useCallback(async (form: typeof classForm) => {
    const termId      = form.termId || selectedTerm;
    const dayOfWeek   = parseInt(form.dayOfWeek);
    const startPeriod = parseInt(form.startPeriod);
    const endPeriod   = parseInt(form.endPeriod);

    if (!termId || !form.dayOfWeek || !form.startPeriod || !form.endPeriod
        || isNaN(dayOfWeek) || isNaN(startPeriod) || isNaN(endPeriod)) {
      setConflictResult(null);
      return;
    }
    try {
      setConflictChecking(true);
      const res = await fetch('/api/education/class-sections/conflict-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          termId, dayOfWeek, startPeriod, endPeriod,
          facultyId: form.facultyId || null,
          roomId:    form.roomId    || null,
          excludeSectionId: editingClass?.id,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) setConflictResult(data.data);
      }
    } catch { /* best-effort */ }
    finally { setConflictChecking(false); }
  }, [selectedTerm, editingClass]);

  const scheduleConflictCheck = useCallback((form: typeof classForm) => {
    if (conflictTimer.current) clearTimeout(conflictTimer.current);
    conflictTimer.current = setTimeout(() => runConflictCheck(form), 600);
  }, [runConflictCheck]);

  // ── CRUD handlers ─────────────────────────────────────────────────────────

  const handleSubmitClass = async () => {
    if (!classForm.code || !classForm.name) {
      toast.error('Mã lớp và tên lớp là bắt buộc');
      return;
    }
    if (conflictResult?.hasConflict) {
      const ok = confirm(`Phát hiện ${conflictResult.conflicts.length} xung đột lịch.\nVẫn muốn tiếp tục?`);
      if (!ok) return;
    }
    try {
      const method = editingClass ? 'PUT' : 'POST';
      const body   = editingClass
        ? { id: editingClass.id, ...classForm }
        : { ...classForm, termId: classForm.termId || selectedTerm };

      const res  = await fetch('/api/education/class-sections', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (res.ok) {
        toast.success(editingClass ? 'Cập nhật thành công' : 'Tạo lớp thành công');
        setClassDialogOpen(false);
        resetClassForm();
        fetchClassSections();
        fetchStats(selectedTerm);
      } else {
        toast.error(data.error || 'Có lỗi xảy ra');
      }
    } catch { toast.error('Lỗi kết nối'); }
  };

  const handleGenerateSessions = async () => {
    if (!selectedClass) return;
    try {
      const res = await fetch('/api/education/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate',
          classSectionId: selectedClass.id,
          termId: selectedClass.termId,
          ...generateForm,
          dayOfWeek: parseInt(generateForm.dayOfWeek),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Đã tạo ${data.created} buổi học`);
        setGenerateDialogOpen(false);
        fetchSessions(selectedClass.id);
        fetchStats(selectedTerm);
      } else {
        toast.error(data.error || 'Lỗi tạo lịch');
      }
    } catch { toast.error('Lỗi kết nối'); }
  };

  const handleDeleteClass = async (id: string) => {
    if (!confirm('Xác nhận xóa lớp học phần này?')) return;
    try {
      const res = await fetch(`/api/education/class-sections?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Xóa thành công');
        if (selectedClass?.id === id) setSelectedClass(null);
        fetchClassSections();
        fetchStats(selectedTerm);
      } else {
        const data = await res.json();
        toast.error(data.error || 'Lỗi xóa');
      }
    } catch { toast.error('Lỗi kết nối'); }
  };

  const resetClassForm = () => {
    setClassForm({
      code: '', name: '', curriculumCourseId: '', termId: selectedTerm,
      facultyId: '', roomId: '', maxStudents: 50, schedule: '',
      dayOfWeek: '', startPeriod: '', endPeriod: '',
    });
    setEditingClass(null);
    setConflictResult(null);
  };

  const openEditClass = (cls: any) => {
    setEditingClass(cls);
    setConflictResult(null);
    const form = {
      code: cls.code, name: cls.name,
      curriculumCourseId: cls.curriculumCourseId || '',
      termId: cls.termId,
      facultyId:   cls.facultyId   || '',
      roomId:      cls.roomId      || '',
      maxStudents: cls.maxStudents,
      schedule:    cls.schedule    || '',
      dayOfWeek:   cls.dayOfWeek?.toString()   || '',
      startPeriod: cls.startPeriod?.toString() || '',
      endPeriod:   cls.endPeriod?.toString()   || '',
    };
    setClassForm(form);
    setClassDialogOpen(true);
    scheduleConflictCheck(form);
  };

  const openGenerateDialog = (cls: any) => {
    setSelectedClass(cls);
    setGenerateForm({
      numberOfSessions: 15,
      startDate: new Date().toISOString().split('T')[0],
      dayOfWeek: cls.dayOfWeek?.toString() || '1',
      startTime: '07:00', endTime: '09:30', sessionType: 'THEORY',
      roomId:    cls.roomId    || '',
      facultyId: cls.facultyId || '',
    });
    setGenerateDialogOpen(true);
  };

  // ── Derived ───────────────────────────────────────────────────────────────

  const totalPages    = Math.ceil(total / limit);
  const hasFilters    = !!(search || filterStatus || filterFaculty);
  const activeTerm    = termsForYear.find(t => t.id === selectedTerm);
  const activeYear    = academicYears.find(y => y.id === selectedYear);
  const isPastYear    = activeYear && !activeYear.isCurrent;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            Lịch huấn luyện
            {isPastYear && (
              <Badge variant="outline" className="text-xs font-normal ml-1 border-amber-300 text-amber-600 bg-amber-50">
                Năm học cũ
              </Badge>
            )}
          </h1>
          <p className="text-muted-foreground">Quản lý lớp học phần và lịch buổi học theo năm học</p>
        </div>
        <Button
          onClick={() => { resetClassForm(); setClassDialogOpen(true); }}
          disabled={!selectedTerm}
        >
          <Plus className="h-4 w-4 mr-2" /> Thêm lớp
        </Button>
      </div>

      {/* ── Year / Term Navigation ───────────────────────────────────────── */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="flex items-center gap-2 shrink-0">
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">Năm học</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {academicYears.map(year => (
                <button
                  key={year.id}
                  type="button"
                  onClick={() => handleYearChange(year.id)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all
                    ${selectedYear === year.id
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background border-border hover:bg-muted'
                    }`}
                >
                  {year.name}
                  {year.isCurrent && (
                    <span className="ml-1.5 text-xs opacity-75">(hiện tại)</span>
                  )}
                </button>
              ))}
              {academicYears.length === 0 && (
                <span className="text-sm text-muted-foreground italic">Chưa có năm học</span>
              )}
            </div>

            {termsForYear.length > 0 && (
              <>
                <Separator orientation="vertical" className="hidden sm:block h-6" />
                <div className="flex items-center gap-2 shrink-0">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">Học kỳ</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {termsForYear.map(term => (
                    <button
                      key={term.id}
                      type="button"
                      onClick={() => handleTermChange(term.id)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all
                        ${selectedTerm === term.id
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-background border-border hover:bg-muted'
                        }`}
                    >
                      {term.name}
                      {term.isCurrent && (
                        <span className="ml-1.5 text-xs opacity-75">●</span>
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Active context breadcrumb */}
          {activeTerm && (
            <div className="mt-3 pt-3 border-t flex items-center gap-2 text-xs text-muted-foreground">
              <span>Đang xem:</span>
              <span className="font-medium text-foreground">{activeYear?.name}</span>
              <span>›</span>
              <span className="font-medium text-foreground">{activeTerm.name}</span>
              <span className="ml-2">
                ({new Date(activeTerm.startDate).toLocaleDateString('vi-VN')}
                {' – '}
                {new Date(activeTerm.endDate).toLocaleDateString('vi-VN')})
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── KPI Cards ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-slate-100">
              <BookOpen className="h-5 w-5 text-slate-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Tổng lớp HP</p>
              <p className="text-2xl font-bold">{statsLoading ? '—' : (stats?.totalSections ?? 0)}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-100">
              <PlayCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Đang hoạt động</p>
              <p className="text-2xl font-bold text-green-600">
                {statsLoading ? '—' : (stats?.activeSections ?? 0)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100">
              <Calendar className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Buổi đã lên lịch</p>
              <p className="text-2xl font-bold text-blue-600">
                {statsLoading ? '—' : (stats?.scheduledSessions ?? 0)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-100">
              <CheckCircle2 className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Buổi hoàn thành</p>
              <p className="text-2xl font-bold text-purple-600">
                {statsLoading ? '—' : (stats?.completedSessions ?? 0)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Distribution Row ─────────────────────────────────────────────── */}
      {stats && !statsLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Class status breakdown */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                Lớp học phần theo trạng thái
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {Object.entries(SECTION_STATUS_CONFIG).map(([key, cfg]) => {
                const count = stats.byStatus[key] ?? 0;
                const pct   = stats.totalSections > 0 ? Math.round((count / stats.totalSections) * 100) : 0;
                return (
                  <div key={key}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <button
                        type="button"
                        className={`text-xs px-2 py-0.5 rounded-full font-medium cursor-pointer hover:opacity-80 transition-opacity ${cfg.badgeClass}
                          ${filterStatus === key ? 'ring-2 ring-offset-1 ring-current' : ''}`}
                        onClick={() => { setFilterStatus(filterStatus === key ? '' : key); setPage(1); }}
                      >
                        {cfg.label}
                      </button>
                      <span className="font-medium">
                        {count}
                        <span className="ml-1 text-xs text-muted-foreground font-normal">({pct}%)</span>
                      </span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <ProgressBar pct={pct} colorClass={cfg.barClass} />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Session status + Room utilization */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  Buổi học theo trạng thái
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3 text-center">
                  {Object.entries(SESSION_STATUS_CONFIG).map(([key, cfg]) => (
                    <div key={key} className="rounded-lg border p-3">
                      <p className="text-2xl font-bold">{stats.bySessionStatus[key] ?? 0}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{cfg.label}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  Sử dụng phòng học
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-2 text-sm">
                  <span className="text-muted-foreground">
                    {stats.roomUtilization.inUse} / {stats.roomUtilization.total} phòng đang dùng
                  </span>
                  <span className="font-semibold">{stats.roomUtilization.utilizationRate}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <ProgressBar pct={stats.roomUtilization.utilizationRate} colorClass="bg-amber-400" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ── Filter bar ───────────────────────────────────────────────────── */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-10"
                placeholder="Tìm theo mã, tên lớp..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
            <Select
              value={filterStatus || '__ALL__'}
              onValueChange={v => { setFilterStatus(v === '__ALL__' ? '' : v); setPage(1); }}
            >
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Trạng thái" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__ALL__">Tất cả TT</SelectItem>
                {Object.entries(SECTION_STATUS_CONFIG).map(([val, cfg]) => (
                  <SelectItem key={val} value={val}>{cfg.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={filterFaculty || '__ALL__'}
              onValueChange={v => { setFilterFaculty(v === '__ALL__' ? '' : v); setPage(1); }}
            >
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="Giảng viên" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__ALL__">Tất cả GV</SelectItem>
                {faculty.map(f => (
                  <SelectItem key={f.id} value={f.id}>{f.user?.name || f.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground gap-1">
                <X className="h-3.5 w-3.5" /> Xóa bộ lọc
              </Button>
            )}
            <Button variant="outline" size="icon" onClick={fetchClassSections} title="Làm mới">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── Class Sections Table ─────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-0">
          <CardTitle className="text-base flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-muted-foreground" />
            <span>
              {total} lớp học phần
              {activeTerm && (
                <span className="ml-1.5 text-sm font-normal text-muted-foreground">
                  — {activeTerm.name}
                </span>
              )}
              {filterStatus && (
                <span className="ml-1.5 text-sm font-normal text-muted-foreground">
                  · {SECTION_STATUS_CONFIG[filterStatus]?.label}
                </span>
              )}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 mt-2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mã lớp</TableHead>
                <TableHead>Tên lớp</TableHead>
                <TableHead>Môn học</TableHead>
                <TableHead>Giảng viên</TableHead>
                <TableHead>Phòng</TableHead>
                <TableHead>Lịch học</TableHead>
                <TableHead className="text-center">Sỹ số</TableHead>
                <TableHead className="text-center">Buổi</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-12 text-muted-foreground">
                    Đang tải...
                  </TableCell>
                </TableRow>
              ) : !selectedTerm ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-12 text-muted-foreground">
                    Chọn năm học và học kỳ để xem lịch
                  </TableCell>
                </TableRow>
              ) : classSections.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-12 text-muted-foreground">
                    {hasFilters ? 'Không tìm thấy lớp phù hợp bộ lọc' : 'Chưa có lớp học phần nào trong học kỳ này'}
                  </TableCell>
                </TableRow>
              ) : (
                classSections.map(cls => {
                  const cfg = SECTION_STATUS_CONFIG[cls.status] ?? { label: cls.status, badgeClass: 'bg-gray-100 text-gray-700', barClass: '' };
                  const dayLabel = DAYS_OF_WEEK.find(d => d.value === cls.dayOfWeek?.toString())?.label ?? '';
                  const scheduleText = cls.schedule || (dayLabel ? `${dayLabel}, tiết ${cls.startPeriod ?? '?'}-${cls.endPeriod ?? '?'}` : '—');
                  const enrolledCount = cls._count?.enrollments ?? 0;
                  const isSelected = selectedClass?.id === cls.id;

                  return (
                    <TableRow
                      key={cls.id}
                      className={`hover:bg-muted/40 transition-colors ${isSelected ? 'bg-blue-50 hover:bg-blue-50' : ''}`}
                    >
                      <TableCell>
                        <span className="font-mono font-medium text-sm">{cls.code}</span>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-sm">{cls.name}</div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {cls.curriculumCourse
                          ? <span title={cls.curriculumCourse.subjectName} className="font-mono text-xs">{cls.curriculumCourse.subjectCode}</span>
                          : <span className="text-muted-foreground/50">—</span>}
                      </TableCell>
                      <TableCell className="text-sm">
                        {cls.faculty?.user?.name ?? <span className="text-muted-foreground/50">—</span>}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {cls.room?.code ?? <span className="text-muted-foreground/50">—</span>}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {scheduleText}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="text-xs gap-1">
                          <Users className="h-3 w-3" />
                          {enrolledCount}/{cls.maxStudents}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="text-xs gap-1">
                          <Calendar className="h-3 w-3" />
                          {cls._count?.sessions ?? 0}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.badgeClass}`}>
                          {cfg.label}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            size="icon" variant="ghost"
                            onClick={() => setSelectedClass(isSelected ? null : cls)}
                            title={isSelected ? 'Đóng buổi học' : 'Xem buổi học'}
                            className={isSelected ? 'text-blue-600' : ''}
                          >
                            <Clock className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon" variant="ghost"
                            onClick={() => openGenerateDialog(cls)}
                            title="Tạo lịch tự động"
                          >
                            <CalendarPlus className="h-4 w-4 text-blue-500" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => openEditClass(cls)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => handleDeleteClass(cls.id)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ── Pagination ───────────────────────────────────────────────────── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Trang {page} / {totalPages} ({total} lớp)</span>
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

      {/* ── Sessions panel ────────────────────────────────────────────────── */}
      {selectedClass && (
        <Card className="border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-base">
              <span className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-500" />
                <span>
                  Buổi học —
                  <span className="font-mono ml-1.5 mr-1">{selectedClass.code}</span>
                  <span className="font-normal text-muted-foreground">{selectedClass.name}</span>
                </span>
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => openGenerateDialog(selectedClass)}>
                  <CalendarPlus className="h-4 w-4 mr-2" /> Tạo lịch
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setSelectedClass(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {sessions.length === 0 ? (
              <div className="h-32 flex flex-col items-center justify-center gap-2 text-muted-foreground">
                <Calendar className="h-7 w-7 opacity-30" />
                <span className="text-sm">Chưa có buổi học nào. Nhấn "Tạo lịch" để tạo tự động.</span>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Buổi</TableHead>
                    <TableHead>Ngày</TableHead>
                    <TableHead>Thời gian</TableHead>
                    <TableHead>Loại</TableHead>
                    <TableHead>Phòng</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="text-center">Điểm danh</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessions.map(session => {
                    const ssc = SESSION_STATUS_CONFIG[session.status] ?? { label: session.status, badgeClass: 'bg-gray-100 text-gray-700' };
                    return (
                      <TableRow key={session.id} className="hover:bg-muted/40">
                        <TableCell className="font-medium text-sm text-center">#{session.sessionNumber}</TableCell>
                        <TableCell className="text-sm">
                          {new Date(session.sessionDate).toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' })}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                          {session.startTime} – {session.endTime}
                        </TableCell>
                        <TableCell>
                          <span className="text-xs px-2 py-0.5 rounded bg-muted font-medium">
                            {SESSION_TYPE_LABELS[session.sessionType] ?? session.sessionType}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {session.room?.code ?? '—'}
                        </TableCell>
                        <TableCell>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ssc.badgeClass}`}>
                            {ssc.label}
                          </span>
                        </TableCell>
                        <TableCell className="text-center text-sm">
                          {session._count?.attendances ?? 0}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Create / Edit Class Dialog ────────────────────────────────────── */}
      <Dialog open={classDialogOpen} onOpenChange={open => { setClassDialogOpen(open); if (!open) resetClassForm(); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingClass ? 'Cập nhật lớp học phần' : 'Thêm lớp học phần mới'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Mã lớp *</Label>
                <Input
                  value={classForm.code}
                  onChange={e => setClassForm({ ...classForm, code: e.target.value })}
                  placeholder="QS101-01"
                  disabled={!!editingClass}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Sỹ số tối đa</Label>
                <Input
                  type="number" min={1}
                  value={classForm.maxStudents}
                  onChange={e => setClassForm({ ...classForm, maxStudents: parseInt(e.target.value) || 50 })}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Tên lớp *</Label>
              <Input
                value={classForm.name}
                onChange={e => setClassForm({ ...classForm, name: e.target.value })}
                placeholder="Nhập môn Quân sự - Nhóm 01"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Môn học (CTĐT)</Label>
              <Select
                value={classForm.curriculumCourseId || '__NONE__'}
                onValueChange={v => setClassForm({ ...classForm, curriculumCourseId: v === '__NONE__' ? '' : v })}
              >
                <SelectTrigger><SelectValue placeholder="Chọn môn học" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__NONE__">— Không liên kết —</SelectItem>
                  {subjects.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.code} – {s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Giảng viên</Label>
                <Select
                  value={classForm.facultyId || '__NONE__'}
                  onValueChange={v => {
                    const next = { ...classForm, facultyId: v === '__NONE__' ? '' : v };
                    setClassForm(next);
                    scheduleConflictCheck(next);
                  }}
                >
                  <SelectTrigger><SelectValue placeholder="Chọn GV" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__NONE__">— Chưa phân công —</SelectItem>
                    {faculty.map(f => (
                      <SelectItem key={f.id} value={f.id}>{f.user?.name || f.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Phòng học</Label>
                <Select
                  value={classForm.roomId || '__NONE__'}
                  onValueChange={v => {
                    const next = { ...classForm, roomId: v === '__NONE__' ? '' : v };
                    setClassForm(next);
                    scheduleConflictCheck(next);
                  }}
                >
                  <SelectTrigger><SelectValue placeholder="Chọn phòng" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__NONE__">— Chưa phân công —</SelectItem>
                    {rooms.map(r => (
                      <SelectItem key={r.id} value={r.id}>{r.code} – {r.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label>Thứ</Label>
                <Select
                  value={classForm.dayOfWeek || '__NONE__'}
                  onValueChange={v => {
                    const next = { ...classForm, dayOfWeek: v === '__NONE__' ? '' : v };
                    setClassForm(next);
                    scheduleConflictCheck(next);
                  }}
                >
                  <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__NONE__">—</SelectItem>
                    {DAYS_OF_WEEK.map(d => (
                      <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Tiết bắt đầu</Label>
                <Input
                  type="number" min={1} max={15}
                  value={classForm.startPeriod}
                  onChange={e => {
                    const next = { ...classForm, startPeriod: e.target.value };
                    setClassForm(next);
                    scheduleConflictCheck(next);
                  }}
                  placeholder="1"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Tiết kết thúc</Label>
                <Input
                  type="number" min={1} max={15}
                  value={classForm.endPeriod}
                  onChange={e => {
                    const next = { ...classForm, endPeriod: e.target.value };
                    setClassForm(next);
                    scheduleConflictCheck(next);
                  }}
                  placeholder="3"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Lịch học (mô tả tự do)</Label>
              <Input
                value={classForm.schedule}
                onChange={e => setClassForm({ ...classForm, schedule: e.target.value })}
                placeholder="Thứ 2, tiết 1-3, phòng A101"
              />
            </div>
          </div>

          {conflictChecking && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <RefreshCw className="h-3 w-3 animate-spin" /> Đang kiểm tra xung đột...
            </div>
          )}
          {!conflictChecking && conflictResult && (
            <div className={`rounded-md border p-3 text-sm ${
              conflictResult.hasConflict
                ? 'border-red-200 bg-red-50 text-red-800'
                : 'border-green-200 bg-green-50 text-green-800'
            }`}>
              {conflictResult.hasConflict ? (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 font-medium">
                    <AlertTriangle className="h-4 w-4" />
                    Phát hiện {conflictResult.conflicts.length} xung đột lịch
                  </div>
                  <ul className="space-y-1 text-xs">
                    {conflictResult.conflicts.map((c, i) => (
                      <li key={i} className="flex items-start gap-1">
                        <span className="mt-0.5 text-red-500">•</span>
                        <span>{c.message}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4" /> Không phát hiện xung đột lịch
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setClassDialogOpen(false)}>Hủy</Button>
            <Button onClick={handleSubmitClass}>
              {editingClass ? 'Cập nhật' : 'Tạo lớp'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Generate Sessions Dialog ──────────────────────────────────────── */}
      <Dialog open={generateDialogOpen} onOpenChange={setGenerateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tạo lịch buổi học tự động</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <p className="text-sm text-muted-foreground">
              Lớp: <span className="font-medium text-foreground">{selectedClass?.code}</span>
              <span className="mx-1">—</span>
              {selectedClass?.name}
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Số buổi</Label>
                <Input
                  type="number" min={1}
                  value={generateForm.numberOfSessions}
                  onChange={e => setGenerateForm({ ...generateForm, numberOfSessions: parseInt(e.target.value) || 15 })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Ngày bắt đầu</Label>
                <Input
                  type="date"
                  value={generateForm.startDate}
                  onChange={e => setGenerateForm({ ...generateForm, startDate: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label>Thứ</Label>
                <Select
                  value={generateForm.dayOfWeek}
                  onValueChange={v => setGenerateForm({ ...generateForm, dayOfWeek: v })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DAYS_OF_WEEK.map(d => (
                      <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Giờ bắt đầu</Label>
                <Input
                  type="time"
                  value={generateForm.startTime}
                  onChange={e => setGenerateForm({ ...generateForm, startTime: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Giờ kết thúc</Label>
                <Input
                  type="time"
                  value={generateForm.endTime}
                  onChange={e => setGenerateForm({ ...generateForm, endTime: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Loại buổi học</Label>
                <Select
                  value={generateForm.sessionType}
                  onValueChange={v => setGenerateForm({ ...generateForm, sessionType: v })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(SESSION_TYPE_LABELS).map(([val, lbl]) => (
                      <SelectItem key={val} value={val}>{lbl}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Phòng học</Label>
                <Select
                  value={generateForm.roomId || '__NONE__'}
                  onValueChange={v => setGenerateForm({ ...generateForm, roomId: v === '__NONE__' ? '' : v })}
                >
                  <SelectTrigger><SelectValue placeholder="Giữ nguyên" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__NONE__">— Giữ nguyên —</SelectItem>
                    {rooms.map(r => (
                      <SelectItem key={r.id} value={r.id}>{r.code} – {r.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGenerateDialogOpen(false)}>Hủy</Button>
            <Button onClick={handleGenerateSessions}>
              <CalendarPlus className="h-4 w-4 mr-2" /> Tạo lịch
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
