/**
 * M10 – UC-53: Kế hoạch đào tạo (Phòng Đào tạo)
 *
 * Tabs:
 *  1. Kế hoạch đào tạo   – lập kế hoạch học kỳ (SemesterPlanBoard hiện tại)
 *  2. Thời khóa biểu     – lớp học phần theo học kỳ + Hệ đào tạo
 *  3. Kế hoạch thi       – danh sách kỳ thi theo học kỳ
 *  4. Phân bổ chương trình – CTĐT gắn với từng Hệ đào tạo
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { toast } from 'sonner';
import {
  CalendarDays,
  BookOpen,
  ClipboardList,
  Building2,
  RefreshCw,
  Search,
  Loader2,
  ChevronRight,
  GraduationCap,
} from 'lucide-react';
import Link from 'next/link';
import {
  SemesterPlanBoard,
  PLAN_STATUS_LABELS,
} from '@/components/education/planning/semester-plan-board';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Term {
  id: string;
  code: string;
  name: string;
  isCurrent: boolean;
  academicYear: { id: string; name: string };
}

interface TrainingSystem {
  id: string;
  code: string;
  name: string;
  totalStudents: number;
  battalions: { id: string; name: string; studentCount: number }[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const EXAM_TYPE_LABELS: Record<string, string> = {
  MIDTERM: 'Giữa kỳ',
  FINAL: 'Cuối kỳ',
  SUPPLEMENTARY: 'Thi lại',
  MAKEUP: 'Thi bổ sung',
};

const EXAM_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Dự thảo',
  PUBLISHED: 'Đã công bố',
  IN_PROGRESS: 'Đang thi',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Hủy',
};

const SECTION_STATUS_LABELS: Record<string, string> = {
  PLANNED: 'Dự kiến',
  ACTIVE: 'Đang dạy',
  COMPLETED: 'Kết thúc',
  CANCELLED: 'Hủy',
};

// ─── Sub-tabs ─────────────────────────────────────────────────────────────────

/** Tab 2: Thời khóa biểu – danh sách lớp học phần */
function TimetableTab({ terms }: { terms: Term[] }) {
  const [sections, setSections] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [termId, setTermId] = useState('');
  const [search, setSearch] = useState('');
  const [meta, setMeta] = useState({ total: 0, totalPages: 1 });
  const [page, setPage] = useState(1);

  const fetchSections = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '15' });
      if (termId && termId !== 'ALL') params.set('termId', termId);
      if (search.trim()) params.set('search', search.trim());

      const res = await fetch(`/api/education/class-sections?${params}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Lỗi tải dữ liệu');
      setSections(json.data || []);
      setMeta({ total: json.pagination?.total ?? 0, totalPages: json.pagination?.totalPages ?? 1 });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [termId, search, page]);

  useEffect(() => { fetchSections(); }, [fetchSections]);

  // Auto-select current term
  useEffect(() => {
    const current = terms.find((t) => t.isCurrent);
    if (current) setTermId(current.id);
  }, [terms]);

  return (
    <div className="space-y-4">
      {/* Filter */}
      <Card>
        <CardContent className="pt-4">
          <form
            onSubmit={(e) => { e.preventDefault(); setPage(1); fetchSections(); }}
            className="flex flex-wrap gap-3 items-end"
          >
            <Select value={termId} onValueChange={(v) => { setTermId(v); setPage(1); }}>
              <SelectTrigger className="w-52">
                <SelectValue placeholder="Chọn học kỳ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tất cả học kỳ</SelectItem>
                {terms.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name} {t.isCurrent && '(Hiện tại)'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder="Tìm mã lớp hoặc tên học phần..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button type="submit" variant="outline">
              <Search className="h-4 w-4 mr-2" /> Tìm
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Lớp học phần — {meta.total} lớp
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
          ) : sections.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Không có lớp học phần nào</p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mã lớp</TableHead>
                    <TableHead>Học phần</TableHead>
                    <TableHead>Giảng viên</TableHead>
                    <TableHead>Phòng</TableHead>
                    <TableHead>Học kỳ</TableHead>
                    <TableHead>HV ghi danh</TableHead>
                    <TableHead>Trạng thái</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sections.map((s: any) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-mono text-xs">{s.code}</TableCell>
                      <TableCell>
                        <div className="font-medium text-sm">{s.curriculumCourse?.subjectName ?? s.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {s.curriculumCourse?.credits} TC
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {s.faculty?.user?.name ?? '—'}
                      </TableCell>
                      <TableCell className="text-xs">
                        {s.room ? (
                          <span>{s.room.code} <span className="text-muted-foreground">({s.room.building})</span></span>
                        ) : '—'}
                      </TableCell>
                      <TableCell className="text-xs">{s.term?.name ?? '—'}</TableCell>
                      <TableCell>
                        <span className="font-semibold text-indigo-700">
                          {s._count?.enrollments ?? 0}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {SECTION_STATUS_LABELS[s.status] ?? s.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {meta.totalPages > 1 && (
                <div className="flex justify-between items-center mt-4 pt-4 border-t">
                  <span className="text-sm text-muted-foreground">
                    Trang {page}/{meta.totalPages}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline" size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >Trước</Button>
                    <Button
                      variant="outline" size="sm"
                      onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                      disabled={page === meta.totalPages}
                    >Sau</Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/** Tab 3: Kế hoạch thi */
function ExamPlanTab({ terms }: { terms: Term[] }) {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [termId, setTermId] = useState('');
  const [examType, setExamType] = useState('');
  const [meta, setMeta] = useState({ total: 0, totalPages: 1 });
  const [page, setPage] = useState(1);

  const fetchPlans = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '15' });
      if (termId && termId !== 'ALL') params.set('termId', termId);
      if (examType && examType !== 'ALL') params.set('examType', examType);

      const res = await fetch(`/api/education/exam-plan?${params}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Lỗi tải dữ liệu');
      const dataArr = Array.isArray(json) ? json : (json.data || []);
      setPlans(dataArr);
      setMeta({
        total: json.pagination?.total ?? dataArr.length,
        totalPages: json.pagination?.totalPages ?? 1,
      });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [termId, examType, page]);

  useEffect(() => { fetchPlans(); }, [fetchPlans]);

  useEffect(() => {
    const current = terms.find((t) => t.isCurrent);
    if (current) setTermId(current.id);
  }, [terms]);

  return (
    <div className="space-y-4">
      {/* Filter */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-3 items-center">
            <Select value={termId} onValueChange={(v) => { setTermId(v); setPage(1); }}>
              <SelectTrigger className="w-52">
                <SelectValue placeholder="Chọn học kỳ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tất cả học kỳ</SelectItem>
                {terms.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name} {t.isCurrent && '(Hiện tại)'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={examType} onValueChange={(v) => { setExamType(v); setPage(1); }}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Loại thi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tất cả loại</SelectItem>
                {Object.entries(EXAM_TYPE_LABELS).map(([v, l]) => (
                  <SelectItem key={v} value={v}>{l}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={() => { setPage(1); fetchPlans(); }}>
              <RefreshCw className="h-4 w-4 mr-1" /> Làm mới
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Kế hoạch thi — {meta.total} kỳ thi</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
          ) : plans.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Không có kế hoạch thi nào</p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tên kế hoạch thi</TableHead>
                    <TableHead>Loại thi</TableHead>
                    <TableHead>Học kỳ</TableHead>
                    <TableHead>Thời gian</TableHead>
                    <TableHead>Phiên thi</TableHead>
                    <TableHead>Trạng thái</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {plans.map((p: any) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.name ?? p.title ?? '—'}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {EXAM_TYPE_LABELS[p.examType] ?? p.examType}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">
                        <div>{p.term?.name ?? '—'}</div>
                        <div className="text-muted-foreground">{p.term?.academicYear?.name}</div>
                      </TableCell>
                      <TableCell className="text-xs">
                        {p.startDate
                          ? new Date(p.startDate).toLocaleDateString('vi-VN')
                          : '—'}
                        {p.endDate && (
                          <span> → {new Date(p.endDate).toLocaleDateString('vi-VN')}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-semibold text-indigo-700">
                          {p.examSessions?.length ?? 0}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={p.status === 'COMPLETED' ? 'secondary' : p.status === 'IN_PROGRESS' ? 'default' : 'outline'}
                          className="text-xs"
                        >
                          {EXAM_STATUS_LABELS[p.status] ?? p.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {meta.totalPages > 1 && (
                <div className="flex justify-between items-center mt-4 pt-4 border-t">
                  <span className="text-sm text-muted-foreground">
                    Trang {page}/{meta.totalPages}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline" size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >Trước</Button>
                    <Button
                      variant="outline" size="sm"
                      onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                      disabled={page === meta.totalPages}
                    >Sau</Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/** Tab 4: Phân bổ chương trình đào tạo theo Hệ */
function ProgramAllocationTab() {
  const [systems, setSystems] = useState<TrainingSystem[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/education/training-systems').then((r) => r.json()),
      fetch('/api/education/programs?status=ACTIVE').then((r) => r.json()),
    ])
      .then(([sysJson, progJson]) => {
        setSystems(sysJson.data || []);
        setPrograms(Array.isArray(progJson) ? progJson : progJson.data || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  // Group programs by heDaoTao string (legacy) until trainingSystemUnitId is fully backfilled
  const systemCodeMap: Record<string, string> = {
    'HE-SDH': 'Sau đại học',
    'HE-CHTS': 'Chỉ huy Tham mưu',
    'HE-CN': 'Chuyên ngành',
    'HE-QT': 'Quốc tế',
  };

  const SYSTEM_COLORS: Record<string, string> = {
    'HE-SDH': 'border-purple-400 bg-purple-50',
    'HE-CHTS': 'border-blue-400 bg-blue-50',
    'HE-CN': 'border-green-400 bg-green-50',
    'HE-QT': 'border-orange-400 bg-orange-50',
  };

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {systems.map((sys) => (
          <Card key={sys.id} className={`border-l-4 ${SYSTEM_COLORS[sys.code] ?? 'border-gray-300 bg-gray-50'}`}>
            <CardContent className="pt-3 pb-3">
              <p className="text-xs font-semibold text-muted-foreground">{sys.code}</p>
              <p className="font-bold text-gray-800 text-sm mt-0.5">{sys.name}</p>
              <p className="text-2xl font-bold text-indigo-700 mt-1">{sys.totalStudents}</p>
              <p className="text-xs text-muted-foreground">học viên</p>
              {sys.battalions.length > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  {sys.battalions.length} tiểu đoàn
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Programs table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-indigo-600" />
            Chương trình đào tạo ({programs.length} CTĐT)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {programs.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Không có chương trình đào tạo</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã CTĐT</TableHead>
                  <TableHead>Tên chương trình</TableHead>
                  <TableHead>Hệ đào tạo</TableHead>
                  <TableHead>Bậc</TableHead>
                  <TableHead>Hình thức</TableHead>
                  <TableHead>Số tín chỉ</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {programs.map((prog: any) => (
                  <TableRow key={prog.id}>
                    <TableCell className="font-mono text-xs">{prog.code}</TableCell>
                    <TableCell className="font-medium text-sm">{prog.name}</TableCell>
                    <TableCell className="text-xs">
                      {prog.heDaoTao
                        ? <Badge variant="outline">{prog.heDaoTao}</Badge>
                        : <span className="text-muted-foreground">—</span>
                      }
                    </TableCell>
                    <TableCell className="text-xs">{prog.bac ?? prog.level ?? '—'}</TableCell>
                    <TableCell className="text-xs">{prog.hinhThuc ?? prog.studyMode ?? '—'}</TableCell>
                    <TableCell className="text-sm font-semibold text-indigo-700">
                      {prog.totalCredits ?? prog.soTinChi ?? '—'}
                    </TableCell>
                    <TableCell>
                      <Link href={`/dashboard/education/programs/${prog.id}`}>
                        <Button variant="ghost" size="sm" className="text-xs">
                          Chi tiết <ChevronRight className="h-3 w-3 ml-1" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Battalions breakdown */}
      {systems.some((s) => s.battalions.length > 0) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-4 w-4 text-blue-600" />
              Phân bổ Tiểu đoàn theo Hệ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {systems.filter((s) => s.battalions.length > 0).map((sys) => (
                <div key={sys.id}>
                  <p className="text-sm font-semibold text-gray-700 mb-2">{sys.name}</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    {sys.battalions.map((bat) => (
                      <div
                        key={bat.id}
                        className="flex items-center justify-between bg-gray-50 border rounded px-3 py-2 text-sm"
                      >
                        <span className="font-medium truncate">{bat.name}</span>
                        <Link href={`/dashboard/education/battalions/${bat.id}`}>
                          <span className="ml-2 text-indigo-600 font-bold shrink-0 hover:underline">
                            {bat.studentCount} HV
                          </span>
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PlanningPage() {
  const [activeTab, setActiveTab] = useState('curriculum');

  // Shared data for curriculum tab (existing)
  const [plans, setPlans] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [loadingCurriculum, setLoadingCurriculum] = useState(true);

  // Curriculum filters
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterAcademicYear, setFilterAcademicYear] = useState('');
  const [filterProgram, setFilterProgram] = useState('');

  const fetchMeta = useCallback(async () => {
    try {
      const [progRes, yearRes, termRes] = await Promise.all([
        fetch('/api/education/programs?status=ACTIVE'),
        fetch('/api/education/academic-years'),
        fetch('/api/education/terms'),
      ]);
      if (progRes.ok) {
        const pj = await progRes.json();
        setPrograms(Array.isArray(pj) ? pj : pj.data || []);
      }
      if (yearRes.ok) {
        const yj = await yearRes.json();
        setAcademicYears(Array.isArray(yj) ? yj : yj.data || []);
      }
      if (termRes.ok) {
        const tj = await termRes.json();
        setTerms(Array.isArray(tj) ? tj : tj.data || []);
      }
    } catch {
      // non-critical
    }
  }, []);

  const fetchPlans = useCallback(async () => {
    setLoadingCurriculum(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());
      if (filterStatus && filterStatus !== 'ALL') params.set('status', filterStatus);
      if (filterAcademicYear && filterAcademicYear !== 'ALL') params.set('academicYearId', filterAcademicYear);
      if (filterProgram && filterProgram !== 'ALL') params.set('programId', filterProgram);

      const res = await fetch(`/api/education/curriculum?${params}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Lỗi tải dữ liệu');
      setPlans(Array.isArray(json) ? json : json.data || []);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoadingCurriculum(false);
    }
  }, [search, filterStatus, filterAcademicYear, filterProgram]);

  useEffect(() => { fetchMeta(); }, [fetchMeta]);
  useEffect(() => { fetchPlans(); }, [fetchPlans]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CalendarDays className="h-6 w-6 text-primary" />
            Kế hoạch Đào tạo
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Phòng Đào tạo — lập kế hoạch học kỳ, thời khóa biểu, kỳ thi và phân bổ chương trình
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="curriculum" className="flex items-center gap-1">
            <ClipboardList className="h-4 w-4" /> Kế hoạch đào tạo
          </TabsTrigger>
          <TabsTrigger value="timetable" className="flex items-center gap-1">
            <BookOpen className="h-4 w-4" /> Thời khóa biểu
          </TabsTrigger>
          <TabsTrigger value="exams" className="flex items-center gap-1">
            <CalendarDays className="h-4 w-4" /> Kế hoạch thi
          </TabsTrigger>
          <TabsTrigger value="allocation" className="flex items-center gap-1">
            <Building2 className="h-4 w-4" /> Phân bổ chương trình
          </TabsTrigger>
        </TabsList>

        {/* ── Tab 1: Kế hoạch đào tạo (existing SemesterPlanBoard) ───────── */}
        <TabsContent value="curriculum" className="space-y-4 mt-4">
          <Card>
            <CardContent className="pt-4">
              <form
                onSubmit={(e) => { e.preventDefault(); fetchPlans(); }}
                className="flex flex-wrap gap-3 items-end"
              >
                <div className="flex-1 min-w-[200px]">
                  <Input
                    placeholder="Tìm mã hoặc tên kế hoạch..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <Select value={filterAcademicYear} onValueChange={setFilterAcademicYear}>
                  <SelectTrigger className="w-44">
                    <SelectValue placeholder="Năm học" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Tất cả năm học</SelectItem>
                    {academicYears.map((y: any) => (
                      <SelectItem key={y.id} value={y.id}>{y.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filterProgram} onValueChange={setFilterProgram}>
                  <SelectTrigger className="w-52">
                    <SelectValue placeholder="Chương trình ĐT" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Tất cả CTĐT</SelectItem>
                    {programs.map((p: any) => (
                      <SelectItem key={p.id} value={p.id}>{p.code} – {p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-44">
                    <SelectValue placeholder="Trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
                    {Object.entries(PLAN_STATUS_LABELS).map(([v, l]) => (
                      <SelectItem key={v} value={v}>{l as string}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button type="submit" variant="outline">
                  <Search className="h-4 w-4 mr-2" /> Tìm kiếm
                </Button>
              </form>
            </CardContent>
          </Card>

          <SemesterPlanBoard
            plans={plans}
            programs={programs}
            academicYears={academicYears}
            loading={loadingCurriculum}
            onRefresh={fetchPlans}
          />
        </TabsContent>

        {/* ── Tab 2: Thời khóa biểu ──────────────────────────────────────── */}
        <TabsContent value="timetable" className="mt-4">
          <TimetableTab terms={terms} />
        </TabsContent>

        {/* ── Tab 3: Kế hoạch thi ────────────────────────────────────────── */}
        <TabsContent value="exams" className="mt-4">
          <ExamPlanTab terms={terms} />
        </TabsContent>

        {/* ── Tab 4: Phân bổ chương trình ────────────────────────────────── */}
        <TabsContent value="allocation" className="mt-4">
          <ProgramAllocationTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
