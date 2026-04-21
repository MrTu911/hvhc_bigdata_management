'use client';

/**
 * /dashboard/personal/my-research
 * Tổng quan đề tài NCKH cá nhân — thiết kế lại UI/UX đầy đủ.
 */

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FlaskConical, Target, TrendingUp, Clock, BookOpen,
  Search, ChevronRight, Calendar, Users, DollarSign,
  AlertCircle, Loader2, ListChecks, Layers,
  BarChart3, Star, Plus, FilePen,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatCard } from '@/components/ui/stat-card';
import { PageHeader } from '@/components/ui/page-header';

// ─── Label maps ───────────────────────────────────────────────────────────────

const STATUS_CFG: Record<string, { label: string; pill: string; border: string; dot: string }> = {
  DRAFT:        { label: 'Bản nháp',          pill: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',             border: 'border-l-gray-300 dark:border-l-gray-600',    dot: 'bg-gray-400' },
  SUBMITTED:    { label: 'Đã nộp',             pill: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',  border: 'border-l-yellow-400',                          dot: 'bg-yellow-400' },
  UNDER_REVIEW: { label: 'Đang xét duyệt',     pill: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',         border: 'border-l-blue-400',                            dot: 'bg-blue-400' },
  APPROVED:     { label: 'Đã duyệt',           pill: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300', border: 'border-l-emerald-500',                      dot: 'bg-emerald-500' },
  REJECTED:     { label: 'Bị từ chối',         pill: 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300',             border: 'border-l-red-400',                             dot: 'bg-red-400' },
  IN_PROGRESS:  { label: 'Đang thực hiện',     pill: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',         border: 'border-l-blue-500',                            dot: 'bg-blue-500' },
  PAUSED:       { label: 'Tạm dừng',           pill: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300', border: 'border-l-orange-400',                          dot: 'bg-orange-400' },
  COMPLETED:    { label: 'Hoàn thành',         pill: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',     border: 'border-l-green-500',                           dot: 'bg-green-500' },
  CANCELLED:    { label: 'Đã huỷ',             pill: 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300',             border: 'border-l-red-300',                             dot: 'bg-red-300' },
};

const PHASE_LABEL: Record<string, string> = {
  PROPOSAL:      'Đề xuất',
  CONTRACT:      'Ký hợp đồng',
  EXECUTION:     'Đang thực hiện',
  MIDTERM_REVIEW:'Kiểm tra giữa kỳ',
  FINAL_REVIEW:  'Nghiệm thu cuối',
  ACCEPTED:      'Nghiệm thu đạt',
  ARCHIVED:      'Lưu trữ',
};

const CATEGORY_LABEL: Record<string, string> = {
  CAP_HOC_VIEN:      'Cấp Học viện',
  CAP_TONG_CUC:      'Cấp Tổng cục',
  CAP_BO_QUOC_PHONG: 'Cấp Bộ Quốc phòng',
  CAP_NHA_NUOC:      'Cấp Nhà nước',
  SANG_KIEN_CO_SO:   'Sáng kiến cơ sở',
};

const TYPE_LABEL: Record<string, string> = {
  CO_BAN:                 'Cơ bản',
  UNG_DUNG:               'Ứng dụng',
  TRIEN_KHAI:             'Triển khai',
  SANG_KIEN_KINH_NGHIEM:  'Sáng kiến',
};

const MEMBER_ROLE_LABEL: Record<string, string> = {
  CHU_NHIEM:         'Chủ nhiệm',
  THU_KY_KHOA_HOC:   'Thư ký KH',
  THANH_VIEN_CHINH:  'Thành viên chính',
  CONG_TAC_VIEN:     'Cộng tác viên',
};

const FIELD_LABEL: Record<string, string> = {
  HOC_THUAT_QUAN_SU: 'Học thuật QS',
  HAU_CAN_KY_THUAT:  'Hậu cần KT',
  KHOA_HOC_XA_HOI:   'KHXH',
  KHOA_HOC_TU_NHIEN: 'KHTN',
  CNTT:              'CNTT',
  Y_DUOC:            'Y dược',
  KHAC:              'Khác',
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface MilestoneStats { total: number; completed: number; overdue: number; inProgress: number }

interface ProjectBase {
  id: string;
  title: string;
  projectCode: string | null;
  status: string;
  phase: string;
  category: string;
  field: string;
  researchType: string;
  startDate: string | null;
  endDate: string | null;
  actualEndDate: string | null;
  budgetApproved: number | null;
  budgetUsed: number | null;
  completionScore: number | null;
  completionGrade: string | null;
  createdAt: string;
  submittedAt: string | null;
  _count: { members: number; milestones: number; publications: number } | null;
  milestoneStats: MilestoneStats;
}

interface PIProject extends ProjectBase {}
interface MemberProject extends ProjectBase {
  memberRole: string;
  memberId: string;
  joinDate: string;
  contribution: number | null;
}

interface Summary {
  totalProjects: number;
  totalAsPI: number;
  totalAsMember: number;
  inProgress: number;
  completed: number;
  totalBudgetApproved: number;
  totalPublications: number;
}

interface ResearchData {
  summary: Summary;
  asPI: PIProject[];
  asMember: MemberProject[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function cfg(status: string) {
  return STATUS_CFG[status] ?? { label: status, pill: 'bg-gray-100 text-gray-500', border: 'border-l-gray-200', dot: 'bg-gray-400' };
}

function fmtDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function fmtBudget(n: number | null) {
  if (!n) return null;
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)} tỷ`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(0)} tr`;
  return `${n.toLocaleString('vi-VN')} đ`;
}

function progressPct(p: ProjectBase): number {
  if (p.status === 'COMPLETED') return 100;
  if (p.completionScore != null) return Math.round(p.completionScore);
  if (p.milestoneStats.total > 0)
    return Math.round((p.milestoneStats.completed / p.milestoneStats.total) * 100);
  if (p.status === 'IN_PROGRESS' && p.startDate && p.endDate) {
    const now = Date.now();
    const s = new Date(p.startDate).getTime();
    const e = new Date(p.endDate).getTime();
    if (e > s) return Math.min(95, Math.round(((now - s) / (e - s)) * 100));
  }
  return 0;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap border ${
        active
          ? 'bg-primary text-primary-foreground border-primary shadow-sm'
          : 'bg-background text-muted-foreground border-border hover:bg-muted'
      }`}
    >
      {children}
    </button>
  );
}

function MilestoneProgress({ stats }: { stats: MilestoneStats }) {
  if (stats.total === 0) return null;
  const pct = Math.round((stats.completed / stats.total) * 100);
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <ListChecks className="w-3 h-3" />
          Mốc tiến độ
        </span>
        <span className="text-xs font-semibold">
          {stats.completed}/{stats.total}
          {stats.overdue > 0 && (
            <span className="text-red-500 ml-1">· {stats.overdue} trễ</span>
          )}
        </span>
      </div>
      <Progress value={pct} className="h-1.5" />
    </div>
  );
}

function ProjectCard({ project, role }: { project: ProjectBase; role: 'pi' | 'member'; memberRole?: string }) {
  const c = cfg(project.status);
  const pct = progressPct(project);
  const budget = fmtBudget(project.budgetApproved);
  const budgetUsed = project.budgetApproved && project.budgetUsed
    ? Math.round((project.budgetUsed / project.budgetApproved) * 100)
    : null;
  const isDraft = project.status === 'DRAFT';
  const isRejected = project.status === 'REJECTED';
  const hasInlineAction = role === 'pi' && (isDraft || isRejected);

  return (
    <div className={`bg-card rounded-xl border-l-4 ${c.border} border border-border/60 shadow-sm hover:shadow-md transition-shadow group`}>
      <div className="p-4 space-y-3">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-start gap-2">
              <span className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${c.dot}`} />
              <div>
                <p className="font-semibold text-foreground leading-snug line-clamp-2">{project.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{project.projectCode ?? '—'}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {hasInlineAction && (
              <Link href={`/dashboard/science/projects/${project.id}/edit`}>
                <Button size="sm" variant={isDraft ? 'default' : 'outline'} className="h-7 text-xs gap-1 px-2.5">
                  <FilePen className="w-3 h-3" />
                  {isDraft ? 'Tiếp tục soạn' : 'Chỉnh sửa lại'}
                </Button>
              </Link>
            )}
            <Link href={`/dashboard/science/projects/${project.id}`}>
              <ChevronRight className="w-5 h-5 text-muted-foreground/40 group-hover:text-primary transition-colors mt-1" />
            </Link>
          </div>
        </div>

        {/* Badge row */}
        <div className="flex flex-wrap items-center gap-1.5 pl-4">
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${c.pill}`}>{c.label}</span>
          <span className="px-2.5 py-0.5 rounded-full text-xs bg-muted text-muted-foreground">
            {PHASE_LABEL[project.phase] ?? project.phase}
          </span>
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
            role === 'pi'
              ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300'
              : 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300'
          }`}>
            {role === 'pi' ? 'Chủ nhiệm' : MEMBER_ROLE_LABEL[(project as MemberProject).memberRole] ?? (project as MemberProject).memberRole}
          </span>
          {project.category && (
            <span className="px-2.5 py-0.5 rounded-full text-xs bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
              {CATEGORY_LABEL[project.category] ?? project.category}
            </span>
          )}
          {project.field && (
            <span className="px-2 py-0.5 rounded-full text-xs text-muted-foreground border border-border">
              {FIELD_LABEL[project.field] ?? project.field}
            </span>
          )}
        </div>

        {/* Progress */}
        {(project.status === 'IN_PROGRESS' || project.status === 'COMPLETED') && (
          <div className="pl-4 space-y-2">
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Tiến độ tổng thể</span>
                <span className="text-xs font-bold text-foreground">{pct}%</span>
              </div>
              <Progress value={pct} className="h-2" />
            </div>
            <MilestoneProgress stats={project.milestoneStats} />
          </div>
        )}

        {/* Footer meta */}
        <Separator className="my-0" />
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 pl-4 text-xs text-muted-foreground">
          {project.startDate && (
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {fmtDate(project.startDate)}
              {project.endDate && <> – {fmtDate(project.endDate)}</>}
            </span>
          )}
          {project._count != null && (
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {project._count.members} thành viên
            </span>
          )}
          {budget && (
            <span className="flex items-center gap-1">
              <DollarSign className="w-3 h-3" />
              {budget}
              {budgetUsed != null && ` (đã dùng ${budgetUsed}%)`}
            </span>
          )}
          {project._count?.publications != null && project._count.publications > 0 && (
            <span className="flex items-center gap-1">
              <BookOpen className="w-3 h-3" />
              {project._count.publications} công bố
            </span>
          )}
          {project.completionGrade && (
            <span className="flex items-center gap-1 text-green-600 font-medium">
              <Star className="w-3 h-3" />
              Xếp loại: {project.completionGrade}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyState({ text, sub }: { text: string; sub?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-2 text-muted-foreground">
      <FlaskConical className="w-12 h-12 opacity-20" />
      <p className="text-sm font-medium">{text}</p>
      {sub && <p className="text-xs opacity-70">{sub}</p>}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function MyResearchPage() {
  const router = useRouter();
  const [data, setData] = useState<ResearchData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'pi' | 'member' | 'active' | 'completed' | 'pending'>('all');

  useEffect(() => {
    fetch('/api/personal/my-research')
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setData(res.data);
        else setError(res.error ?? 'Không thể tải dữ liệu');
      })
      .catch(() => setError('Lỗi kết nối server'))
      .finally(() => setLoading(false));
  }, []);

  // ── Derived ──────────────────────────────────────────────────────────────

  const allProjects = useMemo<(ProjectBase & { _role: 'pi' | 'member' })[]>(() => {
    if (!data) return [];
    return [
      ...data.asPI.map((p) => ({ ...p, _role: 'pi' as const })),
      ...data.asMember.map((p) => ({ ...p, _role: 'member' as const })),
    ];
  }, [data]);

  const filtered = useMemo(() => {
    let list = allProjects;
    if (filter === 'pi')       list = list.filter((p) => p._role === 'pi');
    if (filter === 'member')   list = list.filter((p) => p._role === 'member');
    if (filter === 'active')   list = list.filter((p) => p.status === 'IN_PROGRESS');
    if (filter === 'completed')list = list.filter((p) => p.status === 'COMPLETED');
    if (filter === 'pending')  list = list.filter((p) => ['SUBMITTED', 'UNDER_REVIEW', 'APPROVED'].includes(p.status));
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) => p.title.toLowerCase().includes(q) || (p.projectCode ?? '').toLowerCase().includes(q),
      );
    }
    return list;
  }, [allProjects, filter, search]);

  // ── States ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Đang tải dữ liệu nghiên cứu…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-destructive mx-auto" />
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  const { summary, asPI, asMember } = data!;
  const activePI = asPI.filter((p) => p.status === 'IN_PROGRESS');
  const pendingCount = allProjects.filter((p) =>
    ['SUBMITTED', 'UNDER_REVIEW', 'APPROVED'].includes(p.status),
  ).length;

  return (
    <div className="space-y-6 p-6">

      {/* ── Page header ── */}
      <PageHeader
        title="Đề tài NCKH của tôi"
        description="Tổng hợp đề tài bạn chủ nhiệm và tham gia"
        icon={<FlaskConical className="w-5 h-5" />}
        breadcrumbItems={[
          { label: 'Trang cá nhân', href: '/dashboard/personal' },
          { label: 'Đề tài NCKH của tôi' },
        ]}
        actions={
          <Button
            size="sm"
            className="gap-1.5"
            onClick={() => router.push('/dashboard/science/projects/new')}
          >
            <Plus className="w-4 h-4" />
            Đề xuất đề tài mới
          </Button>
        }
      />

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Tổng đề tài"
          value={summary.totalProjects}
          description={`${summary.totalAsPI} chủ nhiệm · ${summary.totalAsMember} tham gia`}
          icon={<Target className="w-5 h-5 text-primary" />}
        />
        <StatCard
          title="Đang thực hiện"
          value={summary.inProgress}
          description={`${summary.completed} đã hoàn thành`}
          icon={<TrendingUp className="w-5 h-5 text-blue-500" />}
          iconClassName="bg-blue-500/10"
        />
        <StatCard
          title="Chờ duyệt"
          value={pendingCount}
          description="Đã nộp / đang xét duyệt"
          icon={<Clock className="w-5 h-5 text-yellow-500" />}
          iconClassName="bg-yellow-500/10"
        />
        <StatCard
          title="Công bố liên kết"
          value={summary.totalPublications}
          description="Từ đề tài chủ nhiệm"
          icon={<BookOpen className="w-5 h-5 text-purple-500" />}
          iconClassName="bg-purple-500/10"
        />
      </div>

      {/* ── Tabs ── */}
      <Tabs defaultValue="projects" className="space-y-5">
        <TabsList className="grid w-full grid-cols-2 max-w-sm">
          <TabsTrigger value="projects">
            Đề tài
            {summary.totalProjects > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-xs bg-primary/10 text-primary font-medium">
                {summary.totalProjects}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="overview">Tổng quan</TabsTrigger>
        </TabsList>

        {/* ══ TAB: ĐỀ TÀI ══════════════════════════════════════════════ */}
        <TabsContent value="projects" className="space-y-4">

          {/* Search + filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tên hoặc mã đề tài…"
                className="pl-9 text-sm"
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {[
                { key: 'all',       label: `Tất cả (${allProjects.length})` },
                { key: 'pi',        label: `Chủ nhiệm (${summary.totalAsPI})` },
                { key: 'member',    label: `Tham gia (${summary.totalAsMember})` },
                { key: 'active',    label: 'Đang TH' },
                { key: 'completed', label: 'Hoàn thành' },
                { key: 'pending',   label: 'Chờ duyệt' },
              ].map((f) => (
                <FilterChip key={f.key} active={filter === f.key} onClick={() => setFilter(f.key as typeof filter)}>
                  {f.label}
                </FilterChip>
              ))}
            </div>
          </div>

          {/* Result count */}
          {filtered.length > 0 && search && (
            <p className="text-xs text-muted-foreground">
              {filtered.length} kết quả cho &quot;{search}&quot;
            </p>
          )}

          {/* List */}
          {filtered.length === 0 ? (
            <Card>
              <CardContent className="p-0">
                <EmptyState
                  text="Không có đề tài nào"
                  sub={search ? `Không tìm thấy "${search}"` : 'Thử thay đổi bộ lọc'}
                />
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filtered.map((p) => (
                <ProjectCard key={`${p._role}-${p.id}`} project={p} role={p._role} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* ══ TAB: TỔNG QUAN ════════════════════════════════════════════ */}
        <TabsContent value="overview" className="space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

            {/* Đề tài đang thực hiện */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-500" />
                  Tiến độ đề tài đang thực hiện
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {activePI.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">Chưa có đề tài đang thực hiện</p>
                ) : (
                  activePI.map((p) => {
                    const pct = progressPct(p);
                    return (
                      <div key={p.id} className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{p.title}</p>
                            <p className="text-xs text-muted-foreground">{p.projectCode}</p>
                          </div>
                          <span className="text-sm font-bold text-foreground flex-shrink-0">{pct}%</span>
                        </div>
                        <Progress value={pct} className="h-2" />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{fmtDate(p.startDate)}</span>
                          <span>{fmtDate(p.endDate)}</span>
                        </div>
                        {p !== activePI[activePI.length - 1] && <Separator />}
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>

            {/* Thống kê phân bổ */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-purple-500" />
                  Phân bổ đề tài
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Status distribution */}
                {[
                  { label: 'Đang thực hiện', count: summary.inProgress,  color: 'bg-blue-500' },
                  { label: 'Hoàn thành',     count: summary.completed,    color: 'bg-green-500' },
                  { label: 'Chờ duyệt',      count: allProjects.filter(p => ['SUBMITTED','UNDER_REVIEW'].includes(p.status)).length, color: 'bg-yellow-400' },
                  { label: 'Bản nháp',       count: allProjects.filter(p => p.status === 'DRAFT').length, color: 'bg-gray-400' },
                ].filter(r => r.count > 0).map((row) => (
                  <div key={row.label} className="flex items-center gap-3">
                    <div className="flex-1 space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">{row.label}</span>
                        <span className="font-medium text-foreground">{row.count}</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${row.color}`}
                          style={{ width: `${summary.totalProjects > 0 ? Math.round((row.count / summary.totalProjects) * 100) : 0}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <Separator className="my-2" />

                {/* Role distribution */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl">
                    <p className="text-2xl font-bold text-indigo-700 dark:text-indigo-300">{summary.totalAsPI}</p>
                    <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-0.5">Chủ nhiệm</p>
                  </div>
                  <div className="text-center p-3 bg-teal-50 dark:bg-teal-900/20 rounded-xl">
                    <p className="text-2xl font-bold text-teal-700 dark:text-teal-300">{summary.totalAsMember}</p>
                    <p className="text-xs text-teal-600 dark:text-teal-400 mt-0.5">Thành viên</p>
                  </div>
                </div>

                {/* Budget summary */}
                {summary.totalBudgetApproved > 0 && (
                  <>
                    <Separator className="my-2" />
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <DollarSign className="w-3.5 h-3.5" />
                        Tổng kinh phí duyệt
                      </span>
                      <span className="font-semibold text-foreground">
                        {fmtBudget(summary.totalBudgetApproved)}
                      </span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Đề tài tham gia */}
            {asMember.length > 0 && (
              <Card className="lg:col-span-2">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Users className="w-4 h-4 text-teal-500" />
                    Đề tài tham gia ({asMember.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="divide-y divide-border">
                    {asMember.map((p) => {
                      const c = cfg(p.status);
                      return (
                        <div key={p.id} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${c.dot}`} />
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">{p.title}</p>
                              <p className="text-xs text-muted-foreground">{p.projectCode}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${c.pill}`}>{c.label}</span>
                            <span className="text-xs text-muted-foreground hidden sm:block">
                              {MEMBER_ROLE_LABEL[p.memberRole] ?? p.memberRole}
                            </span>
                            <Link href={`/dashboard/science/projects/${p.id}`}>
                              <ChevronRight className="w-4 h-4 text-muted-foreground/50 hover:text-primary" />
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
