'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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
  FlaskConical,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Users,
  Milestone,
  BookOpen,
  TrendingUp,
  Filter,
  X,
  LayoutGrid,
  List,
  ArrowRight,
} from 'lucide-react';

// ─── Constants ─────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Nháp',
  SUBMITTED: 'Đã nộp',
  UNDER_REVIEW: 'Thẩm định',
  APPROVED: 'Phê duyệt',
  REJECTED: 'Từ chối',
  IN_PROGRESS: 'Đang thực hiện',
  PAUSED: 'Tạm dừng',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Hủy',
};

const STATUS_STYLE: Record<string, { pill: string; dot: string }> = {
  DRAFT:        { pill: 'bg-gray-100 text-gray-600',           dot: 'bg-gray-400' },
  SUBMITTED:    { pill: 'bg-blue-100 text-blue-700',           dot: 'bg-blue-500' },
  UNDER_REVIEW: { pill: 'bg-amber-100 text-amber-700',         dot: 'bg-amber-500' },
  APPROVED:     { pill: 'bg-teal-100 text-teal-700',           dot: 'bg-teal-500' },
  REJECTED:     { pill: 'bg-red-100 text-red-600',             dot: 'bg-red-500' },
  IN_PROGRESS:  { pill: 'bg-violet-100 text-violet-700',       dot: 'bg-violet-500' },
  PAUSED:       { pill: 'bg-orange-100 text-orange-700',       dot: 'bg-orange-500' },
  COMPLETED:    { pill: 'bg-emerald-100 text-emerald-700',     dot: 'bg-emerald-500' },
  CANCELLED:    { pill: 'bg-red-50 text-red-400',              dot: 'bg-red-300' },
};

const CATEGORY_LABELS: Record<string, string> = {
  CAP_HOC_VIEN:    'Cấp Học viện',
  CAP_TONG_CUC:    'Cấp Tổng cục',
  CAP_BO_QUOC_PHONG: 'Cấp BQP',
  CAP_NHA_NUOC:    'Cấp Nhà nước',
  SANG_KIEN_CO_SO: 'Sáng kiến',
};

const CATEGORY_BADGE: Record<string, string> = {
  CAP_HOC_VIEN:      'bg-sky-50 text-sky-700 border border-sky-200',
  CAP_TONG_CUC:      'bg-indigo-50 text-indigo-700 border border-indigo-200',
  CAP_BO_QUOC_PHONG: 'bg-red-50 text-red-700 border border-red-200',
  CAP_NHA_NUOC:      'bg-yellow-50 text-yellow-700 border border-yellow-200',
  SANG_KIEN_CO_SO:   'bg-gray-50 text-gray-600 border border-gray-200',
};

const FIELD_LABELS: Record<string, string> = {
  HOC_THUAT_QUAN_SU: 'Quân sự',
  HAU_CAN_KY_THUAT:  'Hậu cần',
  KHOA_HOC_XA_HOI:   'KHXH',
  KHOA_HOC_TU_NHIEN: 'KH tự nhiên',
  CNTT:              'CNTT',
  Y_DUOC:            'Y dược',
  KHAC:              'Khác',
};

const PHASE_STEPS = [
  'PROPOSAL', 'CONTRACT', 'EXECUTION', 'MIDTERM_REVIEW', 'FINAL_REVIEW', 'ACCEPTED', 'ARCHIVED',
];
const PHASE_LABELS: Record<string, string> = {
  PROPOSAL:      'Đề xuất',
  CONTRACT:      'Ký HĐ',
  EXECUTION:     'Thực hiện',
  MIDTERM_REVIEW:'Giữa kỳ',
  FINAL_REVIEW:  'Nghiệm thu',
  ACCEPTED:      'Đạt',
  ARCHIVED:      'Lưu trữ',
};

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Project {
  id: string;
  projectCode: string;
  title: string;
  category: string;
  field: string;
  researchType: string;
  status: string;
  phase: string;
  budgetRequested?: number;
  budgetApproved?: number;
  budgetYear?: number;
  startDate?: string;
  endDate?: string;
  principalInvestigator: { id: string; name: string; rank?: string };
  unit?: { id: string; name: string; code: string };
  _count: { members: number; milestones: number; publications: number };
}

interface Stats {
  totalProjects: number;
  inProgressCount: number;
  completedCount: number;
  pendingReviewCount: number;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

const vnd = (n?: number | null) =>
  n != null ? new Intl.NumberFormat('vi-VN').format(n) + ' tr.đ' : null;

function PhaseBar({ phase }: { phase: string }) {
  const idx = PHASE_STEPS.indexOf(phase);
  return (
    <div className="flex items-center gap-0.5 mt-1">
      {PHASE_STEPS.map((s, i) => (
        <div
          key={s}
          className={`h-1 flex-1 rounded-full ${
            i <= idx ? 'bg-violet-500' : 'bg-gray-200'
          }`}
          title={PHASE_LABELS[s]}
        />
      ))}
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const s = STATUS_STYLE[status] ?? { pill: 'bg-gray-100 text-gray-600', dot: 'bg-gray-400' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${s.pill}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

// ─── Quick filter chip ─────────────────────────────────────────────────────────

const QUICK_FILTERS = [
  { label: 'Tất cả',          value: '' },
  { label: 'Đang thực hiện',  value: 'IN_PROGRESS' },
  { label: 'Chờ thẩm định',   value: 'UNDER_REVIEW' },
  { label: 'Hoàn thành',      value: 'COMPLETED' },
  { label: 'Nháp',            value: 'DRAFT' },
];

// ─── Card view item ────────────────────────────────────────────────────────────

function ProjectCard({ project, onClick }: { project: Project; onClick: () => void }) {
  const budget = vnd(project.budgetApproved ?? project.budgetRequested);
  return (
    <div
      onClick={onClick}
      className="bg-white border border-gray-200 rounded-xl p-4 hover:border-violet-300 hover:shadow-md transition-all cursor-pointer group"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="text-xs font-mono text-violet-600 font-semibold">{project.projectCode}</span>
        <StatusPill status={project.status} />
      </div>
      <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 leading-snug mb-2 group-hover:text-violet-700 transition-colors">
        {project.title}
      </h3>
      <div className="flex items-center gap-1 flex-wrap mb-3">
        <span className={`text-xs px-2 py-0.5 rounded-full ${CATEGORY_BADGE[project.category] ?? 'bg-gray-100 text-gray-600'}`}>
          {CATEGORY_LABELS[project.category] ?? project.category}
        </span>
        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
          {FIELD_LABELS[project.field] ?? project.field}
        </span>
      </div>
      <div className="text-xs text-gray-500 mb-1 truncate">
        {project.principalInvestigator.rank && (
          <span className="text-gray-400">{project.principalInvestigator.rank} · </span>
        )}
        {project.principalInvestigator.name}
      </div>
      <PhaseBar phase={project.phase} />
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
        <div className="flex items-center gap-3 text-xs text-gray-400">
          <span className="flex items-center gap-1"><Users className="h-3 w-3" />{project._count.members}</span>
          <span className="flex items-center gap-1"><Milestone className="h-3 w-3" />{project._count.milestones}</span>
          <span className="flex items-center gap-1"><BookOpen className="h-3 w-3" />{project._count.publications}</span>
        </div>
        {budget && <span className="text-xs font-medium text-gray-700">{budget}</span>}
      </div>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function NckhProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [stats, setStats] = useState<Stats>({ totalProjects: 0, inProgressCount: 0, completedCount: 0, pendingReviewCount: 0 });
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');
  const limit = 20;

  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterField, setFilterField] = useState('');
  const [filterYear, setFilterYear] = useState('');

  const hasActiveFilter = !!(search || filterStatus || filterCategory || filterField || filterYear);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (search)         params.set('search', search);
      if (filterStatus)   params.set('status', filterStatus);
      if (filterCategory) params.set('category', filterCategory);
      if (filterField)    params.set('field', filterField);
      if (filterYear)     params.set('year', filterYear);
      const res = await fetch(`/api/research/projects?${params}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setProjects(data.data ?? []);
      setTotal(data.meta?.total ?? 0);
    } catch {
      toast.error('Không thể tải danh sách đề tài');
    } finally {
      setLoading(false);
    }
  }, [page, search, filterStatus, filterCategory, filterField, filterYear]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/research/dashboard-stats');
      if (!res.ok) return;
      const data = await res.json();
      const byStatus = data.data?.byStatus ?? {};
      const total = Object.values(byStatus).reduce((a: number, b) => a + (b as number), 0);
      setStats({
        totalProjects: total,
        inProgressCount: byStatus.IN_PROGRESS ?? 0,
        completedCount: byStatus.COMPLETED ?? 0,
        pendingReviewCount: (byStatus.SUBMITTED ?? 0) + (byStatus.UNDER_REVIEW ?? 0),
      });
    } catch { /* silent */ }
  }, []);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);
  useEffect(() => { fetchStats(); }, [fetchStats]);

  function applySearch() {
    setSearch(searchInput);
    setPage(1);
  }

  function clearFilters() {
    setSearch(''); setSearchInput(''); setFilterStatus('');
    setFilterCategory(''); setFilterField(''); setFilterYear('');
    setPage(1);
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2.5">
            <span className="inline-flex items-center justify-center h-9 w-9 rounded-xl bg-violet-600 text-white">
              <FlaskConical className="h-5 w-5" />
            </span>
            Đề tài Nghiên cứu Khoa học
          </h1>
          <p className="text-sm text-gray-500 mt-1 ml-11">
            Quản lý vòng đời đề tài · theo dõi tiến độ · kinh phí
          </p>
        </div>
        <Link href="/dashboard/research/projects/new">
          <Button className="bg-violet-600 hover:bg-violet-700 text-white gap-2 shadow-sm">
            <Plus className="h-4 w-4" />
            Thêm đề tài
          </Button>
        </Link>
      </div>

      {/* ── Stats ──────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Tổng đề tài',
            value: stats.totalProjects,
            icon: <FlaskConical className="h-5 w-5 text-violet-600" />,
            bg: 'bg-violet-50',
            valueColor: 'text-violet-700',
          },
          {
            label: 'Đang thực hiện',
            value: stats.inProgressCount,
            icon: <Clock className="h-5 w-5 text-indigo-600" />,
            bg: 'bg-indigo-50',
            valueColor: 'text-indigo-700',
          },
          {
            label: 'Hoàn thành',
            value: stats.completedCount,
            icon: <CheckCircle2 className="h-5 w-5 text-emerald-600" />,
            bg: 'bg-emerald-50',
            valueColor: 'text-emerald-700',
          },
          {
            label: 'Chờ thẩm định',
            value: stats.pendingReviewCount,
            icon: <AlertCircle className="h-5 w-5 text-amber-600" />,
            bg: 'bg-amber-50',
            valueColor: 'text-amber-700',
          },
        ].map((s) => (
          <Card key={s.label} className="border-0 shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${s.bg} shrink-0`}>
                {s.icon}
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">{s.label}</p>
                <p className={`text-2xl font-bold ${s.valueColor}`}>{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Quick status chips ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 flex-wrap">
        {QUICK_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => { setFilterStatus(f.value); setPage(1); }}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
              filterStatus === f.value
                ? 'bg-violet-600 text-white border-violet-600 shadow-sm'
                : 'bg-white text-gray-600 border-gray-200 hover:border-violet-300 hover:text-violet-700'
            }`}
          >
            {f.label}
          </button>
        ))}
        <div className="flex-1" />
        {/* view toggle */}
        <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
          <button
            onClick={() => setViewMode('table')}
            className={`px-3 py-1.5 flex items-center gap-1 text-xs transition-colors ${viewMode === 'table' ? 'bg-violet-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
          >
            <List className="h-3.5 w-3.5" />
            Bảng
          </button>
          <button
            onClick={() => setViewMode('card')}
            className={`px-3 py-1.5 flex items-center gap-1 text-xs transition-colors ${viewMode === 'card' ? 'bg-violet-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            Thẻ
          </button>
        </div>
      </div>

      {/* ── Filters ────────────────────────────────────────────────────────── */}
      <Card className="border border-gray-100 shadow-sm">
        <CardContent className="p-3">
          <div className="flex flex-wrap items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400 shrink-0" />
            <div className="flex items-center gap-1 flex-1 min-w-[200px]">
              <Input
                placeholder="Tìm mã, tên đề tài..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && applySearch()}
                className="h-8 text-sm"
              />
              <Button variant="outline" size="icon" className="h-8 w-8 shrink-0" onClick={applySearch}>
                <Search className="h-3.5 w-3.5" />
              </Button>
            </div>
            <Select value={filterCategory || 'all'} onValueChange={(v) => { setFilterCategory(v === 'all' ? '' : v); setPage(1); }}>
              <SelectTrigger className="h-8 w-36 text-xs">
                <SelectValue placeholder="Cấp đề tài" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả cấp</SelectItem>
                {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterField || 'all'} onValueChange={(v) => { setFilterField(v === 'all' ? '' : v); setPage(1); }}>
              <SelectTrigger className="h-8 w-36 text-xs">
                <SelectValue placeholder="Lĩnh vực" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả lĩnh vực</SelectItem>
                {Object.entries(FIELD_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="Năm"
              value={filterYear}
              onChange={(e) => { setFilterYear(e.target.value); setPage(1); }}
              className="h-8 w-20 text-sm"
              type="number"
            />
            {hasActiveFilter && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition-colors ml-1"
              >
                <X className="h-3.5 w-3.5" /> Xóa lọc
              </button>
            )}
            <span className="ml-auto text-xs text-gray-400 shrink-0">
              {total} đề tài
            </span>
          </div>
        </CardContent>
      </Card>

      {/* ── Content ────────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <div className="h-8 w-8 rounded-full border-2 border-violet-300 border-t-violet-600 animate-spin mb-3" />
          <span className="text-sm">Đang tải dữ liệu...</span>
        </div>
      ) : projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <FlaskConical className="h-12 w-12 mb-3 text-gray-200" />
          <p className="text-sm font-medium text-gray-500">Không tìm thấy đề tài nào</p>
          {hasActiveFilter && (
            <button onClick={clearFilters} className="mt-2 text-xs text-violet-600 hover:underline">
              Xóa bộ lọc
            </button>
          )}
        </div>
      ) : viewMode === 'card' ? (
        /* ── Card grid ── */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {projects.map((p) => (
            <ProjectCard key={p.id} project={p} onClick={() => router.push(`/dashboard/research/projects/${p.id}`)} />
          ))}
        </div>
      ) : (
        /* ── Table ── */
        <Card className="border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 hover:bg-gray-50">
                  <TableHead className="w-[130px] text-xs font-semibold text-gray-600">Mã đề tài</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-600">Tên đề tài</TableHead>
                  <TableHead className="w-[140px] text-xs font-semibold text-gray-600">Chủ nhiệm</TableHead>
                  <TableHead className="w-[110px] text-xs font-semibold text-gray-600">Cấp / Lĩnh vực</TableHead>
                  <TableHead className="w-[120px] text-xs font-semibold text-gray-600">Trạng thái</TableHead>
                  <TableHead className="w-[120px] text-xs font-semibold text-gray-600">Giai đoạn</TableHead>
                  <TableHead className="w-[100px] text-xs font-semibold text-gray-600 text-right">Kinh phí</TableHead>
                  <TableHead className="w-[80px] text-xs font-semibold text-gray-600 text-center">Thành viên</TableHead>
                  <TableHead className="w-[32px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.map((p) => {
                  const budget = vnd(p.budgetApproved ?? p.budgetRequested);
                  return (
                    <TableRow
                      key={p.id}
                      className="cursor-pointer hover:bg-violet-50/40 transition-colors group"
                      onClick={() => router.push(`/dashboard/research/projects/${p.id}`)}
                    >
                      {/* Code */}
                      <TableCell>
                        <div className="font-mono text-xs font-semibold text-violet-700">{p.projectCode}</div>
                        {p.budgetYear && (
                          <div className="text-xs text-gray-400 mt-0.5">Năm {p.budgetYear}</div>
                        )}
                      </TableCell>

                      {/* Title */}
                      <TableCell>
                        <div className="font-medium text-sm text-gray-900 line-clamp-1 group-hover:text-violet-700 transition-colors">
                          {p.title}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-xs px-1.5 py-0.5 rounded ${CATEGORY_BADGE[p.category] ?? 'bg-gray-100 text-gray-500'}`}>
                            {CATEGORY_LABELS[p.category] ?? p.category}
                          </span>
                          <span className="text-xs text-gray-400">{FIELD_LABELS[p.field] ?? p.field}</span>
                        </div>
                      </TableCell>

                      {/* PI */}
                      <TableCell>
                        <div className="text-sm font-medium text-gray-800 truncate">{p.principalInvestigator.name}</div>
                        {p.principalInvestigator.rank && (
                          <div className="text-xs text-gray-400">{p.principalInvestigator.rank}</div>
                        )}
                      </TableCell>

                      {/* Category + Field (hidden — merged into title row) */}
                      <TableCell>
                        {p.unit ? (
                          <div className="text-xs text-gray-500 truncate" title={p.unit.name}>{p.unit.name}</div>
                        ) : (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        <StatusPill status={p.status} />
                      </TableCell>

                      {/* Phase */}
                      <TableCell>
                        <div className="text-xs text-gray-600">{PHASE_LABELS[p.phase] ?? p.phase}</div>
                        <PhaseBar phase={p.phase} />
                      </TableCell>

                      {/* Budget */}
                      <TableCell className="text-right">
                        {budget ? (
                          <div className={`text-xs font-medium ${p.budgetApproved != null ? 'text-gray-800' : 'text-gray-400'}`}>
                            {budget}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </TableCell>

                      {/* Counts */}
                      <TableCell>
                        <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                          <span className="flex items-center gap-0.5" title="Thành viên">
                            <Users className="h-3 w-3" /> {p._count.members}
                          </span>
                          <span className="flex items-center gap-0.5" title="Công bố">
                            <BookOpen className="h-3 w-3" /> {p._count.publications}
                          </span>
                        </div>
                      </TableCell>

                      {/* Arrow */}
                      <TableCell>
                        <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-violet-500 transition-colors" />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50">
              <p className="text-xs text-gray-500">
                {(page - 1) * limit + 1}–{Math.min(page * limit, total)} / <span className="font-medium">{total}</span> đề tài
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="h-7 w-7 flex items-center justify-center rounded border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const n = Math.max(1, Math.min(totalPages - 4, page - 2)) + i;
                  return (
                    <button
                      key={n}
                      onClick={() => setPage(n)}
                      className={`h-7 w-7 flex items-center justify-center rounded text-xs font-medium border transition-colors ${
                        page === n
                          ? 'bg-violet-600 text-white border-violet-600'
                          : 'border-gray-200 text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {n}
                    </button>
                  );
                })}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="h-7 w-7 flex items-center justify-center rounded border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* ── Footer insight ─────────────────────────────────────────────────── */}
      {!loading && stats.totalProjects > 0 && (
        <div className="flex items-center gap-2 text-xs text-gray-400 pb-2">
          <TrendingUp className="h-3.5 w-3.5" />
          <span>
            Tỉ lệ hoàn thành:{' '}
            <span className="font-medium text-gray-600">
              {stats.totalProjects > 0
                ? Math.round((stats.completedCount / stats.totalProjects) * 100)
                : 0}%
            </span>
            {' '}· Đang triển khai:{' '}
            <span className="font-medium text-violet-600">{stats.inProgressCount}</span>
            {' '}đề tài
          </span>
        </div>
      )}
    </div>
  );
}
