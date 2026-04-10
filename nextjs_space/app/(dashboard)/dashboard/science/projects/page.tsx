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
  BookOpen,
  Filter,
  X,
  LayoutGrid,
  List,
  ShieldAlert,
  ShieldCheck,
  Shield,
  ArrowRight,
  Milestone,
} from 'lucide-react';

// ─── Constants ─────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  DRAFT:        'Nháp',
  SUBMITTED:    'Đã nộp',
  UNDER_REVIEW: 'Thẩm định',
  APPROVED:     'Phê duyệt',
  REJECTED:     'Từ chối',
  IN_PROGRESS:  'Đang thực hiện',
  PAUSED:       'Tạm dừng',
  COMPLETED:    'Hoàn thành',
  CANCELLED:    'Hủy',
};

const STATUS_STYLE: Record<string, { pill: string; dot: string }> = {
  DRAFT:        { pill: 'bg-gray-100 text-gray-600',        dot: 'bg-gray-400' },
  SUBMITTED:    { pill: 'bg-blue-100 text-blue-700',        dot: 'bg-blue-500' },
  UNDER_REVIEW: { pill: 'bg-amber-100 text-amber-700',      dot: 'bg-amber-500' },
  APPROVED:     { pill: 'bg-teal-100 text-teal-700',        dot: 'bg-teal-500' },
  REJECTED:     { pill: 'bg-red-100 text-red-600',          dot: 'bg-red-500' },
  IN_PROGRESS:  { pill: 'bg-violet-100 text-violet-700',    dot: 'bg-violet-500' },
  PAUSED:       { pill: 'bg-orange-100 text-orange-700',    dot: 'bg-orange-500' },
  COMPLETED:    { pill: 'bg-emerald-100 text-emerald-700',  dot: 'bg-emerald-500' },
  CANCELLED:    { pill: 'bg-red-50 text-red-400',           dot: 'bg-red-300' },
};

const CATEGORY_LABELS: Record<string, string> = {
  CAP_HOC_VIEN:      'Cấp Học viện',
  CAP_TONG_CUC:      'Cấp Tổng cục',
  CAP_BO_QUOC_PHONG: 'Cấp BQP',
  CAP_NHA_NUOC:      'Cấp Nhà nước',
  SANG_KIEN_CO_SO:   'Sáng kiến',
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
  HAU_CAN_KY_THUAT:  'Hậu cần KT',
  KHOA_HOC_XA_HOI:   'KHXH',
  KHOA_HOC_TU_NHIEN: 'KH tự nhiên',
  CNTT:              'CNTT',
  Y_DUOC:            'Y dược',
  KHAC:              'Khác',
};

const SENSITIVITY_CONFIG: Record<string, { label: string; icon: React.ReactNode; badge: string }> = {
  NORMAL:       { label: 'Thường',    icon: <Shield className="h-3 w-3" />,      badge: 'bg-gray-50 text-gray-500 border-gray-200' },
  CONFIDENTIAL: { label: 'Mật',       icon: <ShieldCheck className="h-3 w-3" />, badge: 'bg-blue-50 text-blue-700 border-blue-200' },
  SECRET:       { label: 'Tuyệt mật', icon: <ShieldAlert className="h-3 w-3" />, badge: 'bg-red-50 text-red-700 border-red-200' },
};

const PHASE_STEPS = ['PROPOSAL', 'CONTRACT', 'EXECUTION', 'MIDTERM_REVIEW', 'FINAL_REVIEW', 'ACCEPTED', 'ARCHIVED'];
const PHASE_LABELS: Record<string, string> = {
  PROPOSAL:       'Đề xuất',
  CONTRACT:       'Ký HĐ',
  EXECUTION:      'Thực hiện',
  MIDTERM_REVIEW: 'Giữa kỳ',
  FINAL_REVIEW:   'Nghiệm thu',
  ACCEPTED:       'Đạt',
  ARCHIVED:       'Lưu trữ',
};

const QUICK_FILTERS = [
  { label: 'Tất cả',         value: '' },
  { label: 'Đang thực hiện', value: 'IN_PROGRESS' },
  { label: 'Chờ thẩm định',  value: 'UNDER_REVIEW' },
  { label: 'Hoàn thành',     value: 'COMPLETED' },
  { label: 'Nháp',           value: 'DRAFT' },
];

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 6 }, (_, i) => CURRENT_YEAR - i);

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
  sensitivity: string;
  budgetRequested?: number;
  budgetApproved?: number;
  budgetYear?: number;
  startDate?: string;
  endDate?: string;
  principalInvestigator: { id: string; name: string; rank?: string };
  unit?: { id: string; name: string; code: string };
  _count?: { members: number; milestones: number; publications: number };
}

interface PageMeta {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
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
          className={`h-1 flex-1 rounded-full ${i <= idx ? 'bg-violet-500' : 'bg-gray-200'}`}
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

function SensitivityBadge({ sensitivity }: { sensitivity: string }) {
  const cfg = SENSITIVITY_CONFIG[sensitivity];
  if (!cfg || sensitivity === 'NORMAL') return null;
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border ${cfg.badge}`}>
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

// ─── Card view ─────────────────────────────────────────────────────────────────

function ProjectCard({ project, onClick }: { project: Project; onClick: () => void }) {
  const budget = vnd(project.budgetApproved ?? project.budgetRequested);
  return (
    <div
      onClick={onClick}
      className="bg-white border border-gray-200 rounded-xl p-4 hover:border-violet-300 hover:shadow-md transition-all cursor-pointer group"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="text-xs font-mono text-violet-600 font-semibold">{project.projectCode}</span>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <SensitivityBadge sensitivity={project.sensitivity} />
          <StatusPill status={project.status} />
        </div>
      </div>
      <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 leading-snug mb-2 group-hover:text-violet-700 transition-colors">
        {project.title}
      </h3>
      <div className="flex items-center gap-1 flex-wrap mb-3">
        <span className={`text-xs px-2 py-0.5 rounded-full border ${CATEGORY_BADGE[project.category] ?? 'bg-gray-100 text-gray-600 border-gray-200'}`}>
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
          {project._count && (
            <>
              <span className="flex items-center gap-1"><Users className="h-3 w-3" />{project._count.members}</span>
              <span className="flex items-center gap-1"><Milestone className="h-3 w-3" />{project._count.milestones}</span>
              <span className="flex items-center gap-1"><BookOpen className="h-3 w-3" />{project._count.publications}</span>
            </>
          )}
        </div>
        {budget && <span className="text-xs font-medium text-gray-700">{budget}</span>}
      </div>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function ScienceProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [meta, setMeta] = useState<PageMeta>({ total: 0, page: 1, pageSize: 20, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');
  const [page, setPage] = useState(1);

  // filters
  const [searchInput, setSearchInput] = useState('');
  const [keyword, setKeyword] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterSensitivity, setFilterSensitivity] = useState('');
  const [filterYear, setFilterYear] = useState('');

  const hasActiveFilter = !!(keyword || filterStatus || filterCategory || filterSensitivity || filterYear);

  // derived stats from current page data
  const stats = {
    total:         meta.total,
    inProgress:    projects.filter((p) => p.status === 'IN_PROGRESS').length,
    completed:     projects.filter((p) => p.status === 'COMPLETED').length,
    pendingReview: projects.filter((p) => p.status === 'UNDER_REVIEW' || p.status === 'SUBMITTED').length,
  };

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: '20' });
      if (keyword)           params.set('keyword', keyword);
      if (filterStatus)      params.set('status', filterStatus);
      if (filterCategory)    params.set('category', filterCategory);
      if (filterSensitivity) params.set('sensitivity', filterSensitivity);
      if (filterYear)        params.set('budgetYear', filterYear);

      const res = await fetch(`/api/science/projects?${params}`);
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();
      setProjects(json.data ?? []);
      setMeta(json.meta ?? { total: 0, page: 1, pageSize: 20, totalPages: 0 });
    } catch {
      toast.error('Không thể tải danh sách đề tài');
    } finally {
      setLoading(false);
    }
  }, [page, keyword, filterStatus, filterCategory, filterSensitivity, filterYear]);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  function applySearch() {
    setKeyword(searchInput);
    setPage(1);
  }

  function clearFilters() {
    setSearchInput(''); setKeyword(''); setFilterStatus('');
    setFilterCategory(''); setFilterSensitivity(''); setFilterYear('');
    setPage(1);
  }

  function handleRowClick(id: string) {
    router.push(`/dashboard/science/projects/${id}`);
  }

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
        <Link href="/dashboard/science/projects/new">
          <Button className="bg-violet-600 hover:bg-violet-700 text-white gap-2 shadow-sm">
            <Plus className="h-4 w-4" />
            Thêm đề tài
          </Button>
        </Link>
      </div>

      {/* ── Stats ──────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Tổng đề tài',     value: meta.total,         icon: <FlaskConical className="h-5 w-5 text-violet-600" />,  bg: 'bg-violet-50',  color: 'text-violet-700' },
          { label: 'Đang thực hiện',  value: stats.inProgress,   icon: <Clock className="h-5 w-5 text-indigo-600" />,         bg: 'bg-indigo-50',  color: 'text-indigo-700' },
          { label: 'Hoàn thành',      value: stats.completed,    icon: <CheckCircle2 className="h-5 w-5 text-emerald-600" />, bg: 'bg-emerald-50', color: 'text-emerald-700' },
          { label: 'Chờ thẩm định',   value: stats.pendingReview, icon: <AlertCircle className="h-5 w-5 text-amber-600" />,   bg: 'bg-amber-50',   color: 'text-amber-700' },
        ].map((s) => (
          <Card key={s.label} className="border-0 shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${s.bg} shrink-0`}>
                {s.icon}
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">{s.label}</p>
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Quick status chips + view toggle ───────────────────────────────── */}
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
        <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
          <button
            onClick={() => setViewMode('table')}
            className={`px-3 py-1.5 flex items-center gap-1 text-xs transition-colors ${viewMode === 'table' ? 'bg-violet-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
          >
            <List className="h-3.5 w-3.5" /> Bảng
          </button>
          <button
            onClick={() => setViewMode('card')}
            className={`px-3 py-1.5 flex items-center gap-1 text-xs transition-colors ${viewMode === 'card' ? 'bg-violet-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
          >
            <LayoutGrid className="h-3.5 w-3.5" /> Thẻ
          </button>
        </div>
      </div>

      {/* ── Filters ────────────────────────────────────────────────────────── */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Tìm theo tên, mã đề tài..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && applySearch()}
                className="pl-9 border-gray-200 focus:border-violet-400"
              />
            </div>
            <Button onClick={applySearch} variant="outline" className="gap-2 border-gray-200">
              <Filter className="h-4 w-4" /> Tìm
            </Button>

            {/* Category */}
            <Select value={filterCategory || 'all'} onValueChange={(v) => { setFilterCategory(v === 'all' ? '' : v); setPage(1); }}>
              <SelectTrigger className="w-[160px] border-gray-200">
                <SelectValue placeholder="Cấp đề tài" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả cấp</SelectItem>
                {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Sensitivity */}
            <Select value={filterSensitivity || 'all'} onValueChange={(v) => { setFilterSensitivity(v === 'all' ? '' : v); setPage(1); }}>
              <SelectTrigger className="w-[140px] border-gray-200">
                <SelectValue placeholder="Độ mật" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                {Object.entries(SENSITIVITY_CONFIG).map(([k, cfg]) => (
                  <SelectItem key={k} value={k}>{cfg.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Year */}
            <Select value={filterYear || 'all'} onValueChange={(v) => { setFilterYear(v === 'all' ? '' : v); setPage(1); }}>
              <SelectTrigger className="w-[120px] border-gray-200">
                <SelectValue placeholder="Năm" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả năm</SelectItem>
                {YEAR_OPTIONS.map((y) => (
                  <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {hasActiveFilter && (
              <Button variant="ghost" onClick={clearFilters} className="gap-1.5 text-gray-500 hover:text-red-600">
                <X className="h-3.5 w-3.5" /> Xóa lọc
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Content ────────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <FlaskConical className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="text-base font-medium">Chưa có đề tài nào</p>
          <p className="text-sm mt-1">
            {hasActiveFilter ? 'Thử thay đổi bộ lọc để xem thêm kết quả' : 'Nhấn "Thêm đề tài" để tạo mới'}
          </p>
        </div>
      ) : viewMode === 'card' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((p) => (
            <ProjectCard key={p.id} project={p} onClick={() => handleRowClick(p.id)} />
          ))}
        </div>
      ) : (
        <Card className="border-0 shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 hover:bg-gray-50">
                <TableHead className="w-[130px] text-xs font-semibold text-gray-600">Mã đề tài</TableHead>
                <TableHead className="text-xs font-semibold text-gray-600">Tên đề tài</TableHead>
                <TableHead className="w-[130px] text-xs font-semibold text-gray-600">Cấp</TableHead>
                <TableHead className="w-[100px] text-xs font-semibold text-gray-600">Lĩnh vực</TableHead>
                <TableHead className="w-[140px] text-xs font-semibold text-gray-600">Trạng thái</TableHead>
                <TableHead className="w-[120px] text-xs font-semibold text-gray-600">Tiến độ</TableHead>
                <TableHead className="w-[140px] text-xs font-semibold text-gray-600">Chủ nhiệm</TableHead>
                <TableHead className="w-[110px] text-xs font-semibold text-gray-600 text-right">Kinh phí</TableHead>
                <TableHead className="w-8" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.map((p) => {
                const budget = vnd(p.budgetApproved ?? p.budgetRequested);
                return (
                  <TableRow
                    key={p.id}
                    onClick={() => handleRowClick(p.id)}
                    className="cursor-pointer hover:bg-violet-50/50 transition-colors group"
                  >
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-mono font-semibold text-violet-600">{p.projectCode}</span>
                        <SensitivityBadge sensitivity={p.sensitivity} />
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm font-medium text-gray-900 line-clamp-2 leading-snug group-hover:text-violet-700 transition-colors">
                        {p.title}
                      </p>
                    </TableCell>
                    <TableCell>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${CATEGORY_BADGE[p.category] ?? 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                        {CATEGORY_LABELS[p.category] ?? p.category}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-gray-600">{FIELD_LABELS[p.field] ?? p.field}</span>
                    </TableCell>
                    <TableCell>
                      <StatusPill status={p.status} />
                    </TableCell>
                    <TableCell>
                      <div className="min-w-[90px]">
                        <span className="text-[10px] text-gray-400">{PHASE_LABELS[p.phase] ?? p.phase}</span>
                        <PhaseBar phase={p.phase} />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs">
                        {p.principalInvestigator.rank && (
                          <span className="text-gray-400 text-[10px] block">{p.principalInvestigator.rank}</span>
                        )}
                        <span className="text-gray-700 font-medium">{p.principalInvestigator.name}</span>
                        {p.unit && (
                          <span className="text-gray-400 text-[10px] block">{p.unit.code}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-xs font-medium text-gray-700">{budget ?? '—'}</span>
                    </TableCell>
                    <TableCell>
                      <ArrowRight className="h-3.5 w-3.5 text-gray-300 group-hover:text-violet-500 transition-colors" />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* ── Pagination ─────────────────────────────────────────────────────── */}
      {meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            {meta.total} đề tài · trang {page}/{meta.totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="gap-1 border-gray-200"
            >
              <ChevronLeft className="h-4 w-4" /> Trước
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= meta.totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="gap-1 border-gray-200"
            >
              Tiếp <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
