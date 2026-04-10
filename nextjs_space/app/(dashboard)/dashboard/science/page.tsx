'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  FlaskConical, Users, BookOpen, TrendingUp, Award,
  Clock, CheckCircle2, AlertCircle, RefreshCw,
  FileText, BarChart2, Layers, Bot, Calendar,
  ChevronRight, ArrowUpRight, Microscope,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import Link from 'next/link';

// ─── Types ─────────────────────────────────────────────────────────────────────

type DashboardLayer = 'ACADEMY' | 'UNIT' | 'REVIEWER' | 'RESEARCHER';

interface AcademyData {
  layer: 'ACADEMY';
  year: number;
  kpi: {
    totalProjects: number; approvedProjects: number; completedProjects: number;
    totalPublications: number; isiPublications: number; scopusPublications: number;
    totalScientificWorks: number; impactScore: number;
    totalBudgetApproved: string; totalBudgetUsed: string; budgetUtilizationPct: number;
  };
  distribution: {
    byStatus: Array<{ status: string; _count: { id: number } }>;
    byField: Array<{ field: string; _count: { id: number } }>;
  };
  topResearchers: Array<{
    id: string; hIndex: number; totalCitations: number; totalPublications: number;
    academicRank: string | null; primaryField: string | null;
    user: { id: string; fullName: string; unitRelation: { name: string } | null };
  }>;
  recentActivity: Array<{
    id: string; fromStatus: string; toStatus: string; actedAt: string;
    project: { id: string; title: string; projectCode: string };
    actionBy: { id: string; fullName: string };
  }>;
}

interface UnitData {
  layer: 'UNIT';
  unitId: string; year: number;
  kpi: AcademyData['kpi'];
  projectSummary: {
    byStatus: Array<{ status: string; _count: { id: number } }>;
    recentProjects: Array<{
      id: string; projectCode: string; title: string; status: string;
      phase: string; endDate: string | null;
      principalInvestigator: { id: string; fullName: string };
    }>;
  };
  budget: { totalApproved: string; totalSpent: string; projectCount: number };
  workCount: number;
}

interface ResearcherData {
  layer: 'RESEARCHER';
  userId: string;
  profile: {
    hIndex: number; i10Index: number; totalCitations: number;
    totalPublications: number; primaryField: string | null;
    researchKeywords: string[]; academicRank: string | null;
    projectLeadCount: number; projectMemberCount: number;
  } | null;
  ownProjects: Array<{
    id: string; projectCode: string; title: string;
    status: string; phase: string; field: string; startDate: string | null; endDate: string | null;
  }>;
  publications: {
    total: number; isi: number; scopus: number;
    recentPubs: Array<{ id: string; title: string; journalName: string | null; publishedYear: number; isISI: boolean; isScopus: boolean }>;
  };
  workCount: number;
}

interface ReviewerData {
  layer: 'REVIEWER';
  userId: string;
  councils: Array<{
    id: string; role: string;
    council: { id: string; type: string; result: string | null; meetingDate: string | null; project: { id: string; title: string; projectCode: string } };
  }>;
  pendingReviews: Array<{
    id: string; role: string;
    council: { id: string; type: string; meetingDate: string | null; project: { id: string; title: string } };
  }>;
  pendingCount: number;
}

type DashData = AcademyData | UnitData | ResearcherData | ReviewerData;

// ─── Constants ─────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Nháp', SUBMITTED: 'Đã nộp', UNDER_REVIEW: 'Thẩm định',
  APPROVED: 'Phê duyệt', REJECTED: 'Từ chối', IN_PROGRESS: 'Đang thực hiện',
  PAUSED: 'Tạm dừng', COMPLETED: 'Hoàn thành', CANCELLED: 'Hủy',
};

const STATUS_COLOR: Record<string, string> = {
  DRAFT: '#94a3b8', SUBMITTED: '#3b82f6', UNDER_REVIEW: '#f59e0b',
  APPROVED: '#14b8a6', REJECTED: '#ef4444', IN_PROGRESS: '#8b5cf6',
  PAUSED: '#f97316', COMPLETED: '#22c55e', CANCELLED: '#f87171',
};

const FIELD_LABELS: Record<string, string> = {
  HOC_THUAT_QUAN_SU: 'Quân sự', HAU_CAN_KY_THUAT: 'Hậu cần',
  KHOA_HOC_XA_HOI: 'KHXH', KHOA_HOC_TU_NHIEN: 'KH tự nhiên',
  CNTT: 'CNTT', Y_DUOC: 'Y dược', KHAC: 'Khác',
};

const LAYER_CONFIG: Record<DashboardLayer, { title: string; color: string; icon: typeof FlaskConical }> = {
  ACADEMY:    { title: 'Tổng hợp Học viện', color: 'from-violet-600 to-purple-700', icon: Layers },
  UNIT:       { title: 'Thống kê Đơn vị',   color: 'from-blue-600 to-indigo-700',   icon: BarChart2 },
  RESEARCHER: { title: 'Hồ sơ Nghiên cứu',  color: 'from-amber-600 to-orange-700',  icon: Microscope },
  REVIEWER:   { title: 'Hội đồng Phản biện', color: 'from-teal-600 to-cyan-700',     icon: Award },
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, icon: Icon, color }: {
  label: string; value: string | number; sub?: string; icon: typeof FlaskConical; color: string;
}) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">{label}</p>
            <p className="text-3xl font-bold text-foreground">{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
          </div>
          <div className={`p-2.5 rounded-xl bg-gradient-to-br ${color} shadow`}>
            <Icon className="h-5 w-5 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Layer renderers ───────────────────────────────────────────────────────────

function AcademyDashboard({ d }: { d: AcademyData }) {
  const statusData = d.distribution.byStatus.map((s) => ({
    name: STATUS_LABELS[s.status] ?? s.status,
    value: s._count.id,
    fill: STATUS_COLOR[s.status] ?? '#94a3b8',
  }));
  const fieldData = d.distribution.byField.map((f) => ({
    name: FIELD_LABELS[f.field] ?? f.field,
    value: f._count.id,
  }));

  return (
    <div className="space-y-6">
      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Tổng đề tài" value={d.kpi.totalProjects} sub={`${d.kpi.completedProjects} hoàn thành`} icon={FlaskConical} color="from-violet-500 to-purple-600" />
        <KpiCard label="Công bố KH" value={d.kpi.totalPublications} sub={`ISI: ${d.kpi.isiPublications} | Scopus: ${d.kpi.scopusPublications}`} icon={BookOpen} color="from-blue-500 to-indigo-600" />
        <KpiCard label="Công trình" value={d.kpi.totalScientificWorks} sub="Sách, giáo trình" icon={FileText} color="from-teal-500 to-cyan-600" />
        <KpiCard label="Impact Score" value={d.kpi.impactScore} sub={`Kinh phí: ${d.kpi.budgetUtilizationPct.toFixed(1)}%`} icon={TrendingUp} color="from-amber-500 to-orange-600" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Phân bố trạng thái đề tài ({d.year})</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                  {statusData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Đề tài theo lĩnh vực</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={fieldData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" width={70} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top researchers + recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold">Top nhà khoa học</CardTitle>
            <Link href="/dashboard/science/scientists">
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">Xem tất cả <ChevronRight className="h-3 w-3" /></Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {d.topResearchers.slice(0, 5).map((r, i) => (
              <div key={r.id} className="flex items-center gap-3">
                <span className="w-5 text-xs font-bold text-muted-foreground">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{r.user.fullName}</p>
                  <p className="text-xs text-muted-foreground">{r.user.unitRelation?.name ?? '—'} · h={r.hIndex}</p>
                </div>
                <Badge variant="outline" className="text-xs">{r.totalPublications} CB</Badge>
              </div>
            ))}
            {d.topResearchers.length === 0 && <p className="text-xs text-muted-foreground py-4 text-center">Chưa có dữ liệu</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Hoạt động gần đây</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {d.recentActivity.slice(0, 6).map((a) => (
              <div key={a.id} className="flex items-start gap-2.5">
                <div className="mt-0.5 h-2 w-2 rounded-full bg-violet-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-medium truncate">{a.project.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {STATUS_LABELS[a.fromStatus]} → <span className="text-violet-600 font-medium">{STATUS_LABELS[a.toStatus]}</span> · {a.actionBy.fullName}
                  </p>
                </div>
              </div>
            ))}
            {d.recentActivity.length === 0 && <p className="text-xs text-muted-foreground py-4 text-center">Chưa có hoạt động</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function UnitDashboard({ d }: { d: UnitData }) {
  const pct = d.kpi.budgetUtilizationPct;
  const totalApproved = BigInt(d.budget.totalApproved || '0');
  const totalSpent = BigInt(d.budget.totalSpent || '0');
  const fmtBudget = (n: bigint) => (Number(n) / 1_000_000).toFixed(1) + ' triệu';

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Tổng đề tài" value={d.kpi.totalProjects} sub={`${d.kpi.completedProjects} hoàn thành`} icon={FlaskConical} color="from-blue-500 to-indigo-600" />
        <KpiCard label="Công bố KH" value={d.kpi.totalPublications} sub={`ISI: ${d.kpi.isiPublications}`} icon={BookOpen} color="from-violet-500 to-purple-600" />
        <KpiCard label="Công trình" value={d.workCount} sub="Sách, giáo trình" icon={FileText} color="from-teal-500 to-cyan-600" />
        <KpiCard label="Kinh phí" value={`${pct.toFixed(0)}%`} sub={`${fmtBudget(totalSpent)} / ${fmtBudget(totalApproved)}`} icon={TrendingUp} color="from-amber-500 to-orange-600" />
      </div>

      {/* Status distribution */}
      <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
        {d.projectSummary.byStatus.map((s) => (
          <Card key={s.status} className="text-center p-3">
            <p className="text-2xl font-bold">{s._count.id}</p>
            <p className="text-xs text-muted-foreground mt-1">{STATUS_LABELS[s.status] ?? s.status}</p>
          </Card>
        ))}
      </div>

      {/* Recent projects */}
      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-semibold">Đề tài gần đây</CardTitle>
          <Link href="/dashboard/science/projects">
            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">Xem tất cả <ChevronRight className="h-3 w-3" /></Button>
          </Link>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {d.projectSummary.recentProjects.map((p) => (
              <div key={p.id} className="flex items-center gap-3 py-1.5 border-b last:border-0">
                <div className={`h-2 w-2 rounded-full shrink-0`} style={{ background: STATUS_COLOR[p.status] ?? '#94a3b8' }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{p.title}</p>
                  <p className="text-xs text-muted-foreground">{p.projectCode} · {p.principalInvestigator.fullName}</p>
                </div>
                <Badge variant="outline" className="text-xs shrink-0">{STATUS_LABELS[p.status] ?? p.status}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ResearcherDashboard({ d }: { d: ResearcherData }) {
  return (
    <div className="space-y-6">
      {/* Profile metrics */}
      {d.profile && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard label="h-Index" value={d.profile.hIndex} sub="Google Scholar / Scopus" icon={TrendingUp} color="from-amber-500 to-orange-600" />
          <KpiCard label="Tổng trích dẫn" value={d.profile.totalCitations} sub={`i10: ${d.profile.i10Index}`} icon={BookOpen} color="from-blue-500 to-indigo-600" />
          <KpiCard label="Đề tài chủ trì" value={d.profile.projectLeadCount} sub={`Tham gia: ${d.profile.projectMemberCount}`} icon={FlaskConical} color="from-violet-500 to-purple-600" />
          <KpiCard label="Công trình KH" value={d.workCount} sub="Sách, giáo trình" icon={FileText} color="from-teal-500 to-cyan-600" />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Own projects */}
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold">Đề tài của tôi</CardTitle>
            <Link href="/dashboard/science/projects">
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">Xem tất cả <ChevronRight className="h-3 w-3" /></Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {d.ownProjects.slice(0, 5).map((p) => (
              <div key={p.id} className="flex items-start gap-2.5 py-1.5 border-b last:border-0">
                <div className="h-2 w-2 rounded-full mt-1.5 shrink-0" style={{ background: STATUS_COLOR[p.status] ?? '#94a3b8' }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{p.title}</p>
                  <p className="text-xs text-muted-foreground">{FIELD_LABELS[p.field] ?? p.field} · {STATUS_LABELS[p.status]}</p>
                </div>
              </div>
            ))}
            {d.ownProjects.length === 0 && <p className="text-xs text-muted-foreground text-center py-6">Chưa có đề tài</p>}
          </CardContent>
        </Card>

        {/* Publications */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Công bố khoa học</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 mb-4">
              {[
                { label: 'Tổng', value: d.publications.total, color: 'text-foreground' },
                { label: 'ISI', value: d.publications.isi, color: 'text-blue-600' },
                { label: 'Scopus', value: d.publications.scopus, color: 'text-violet-600' },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              {d.publications.recentPubs.slice(0, 4).map((pub) => (
                <div key={pub.id} className="flex items-start gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-violet-400 mt-1.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-medium truncate">{pub.title}</p>
                    <p className="text-xs text-muted-foreground">{pub.journalName ?? '—'} · {pub.publishedYear}</p>
                  </div>
                  {pub.isISI && <Badge className="text-xs bg-blue-100 text-blue-700 shrink-0">ISI</Badge>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ReviewerDashboard({ d }: { d: ReviewerData }) {
  return (
    <div className="space-y-6">
      {/* Pending alert */}
      {d.pendingCount > 0 && (
        <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
          <p className="text-sm text-amber-800 font-medium">
            Bạn có <span className="font-bold">{d.pendingCount}</span> hội đồng chờ phản biện
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending reviews */}
        <Card className="border-amber-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-500" /> Chờ phản biện ({d.pendingCount})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {d.pendingReviews.map((r) => (
              <div key={r.id} className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg">
                <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{r.council.project.title}</p>
                  <p className="text-xs text-muted-foreground">HĐ {r.council.type} · Vai trò: {r.role}</p>
                  {r.council.meetingDate && (
                    <p className="text-xs text-amber-700 mt-0.5">
                      Họp: {new Date(r.council.meetingDate).toLocaleDateString('vi-VN')}
                    </p>
                  )}
                </div>
              </div>
            ))}
            {d.pendingReviews.length === 0 && (
              <div className="flex flex-col items-center py-6 text-center">
                <CheckCircle2 className="h-8 w-8 text-emerald-400 mb-2" />
                <p className="text-xs text-muted-foreground">Không có phản biện chờ xử lý</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* All councils */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Tất cả hội đồng ({d.councils.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {d.councils.map((c) => (
              <div key={c.id} className="flex items-center gap-3 py-1.5 border-b last:border-0">
                <div className={`h-2 w-2 rounded-full shrink-0 ${c.council.result ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{c.council.project.title}</p>
                  <p className="text-xs text-muted-foreground">HĐ {c.council.type} · {c.role}</p>
                </div>
                <Badge variant={c.council.result ? 'default' : 'outline'} className="text-xs shrink-0">
                  {c.council.result ?? 'Đang xét'}
                </Badge>
              </div>
            ))}
            {d.councils.length === 0 && <p className="text-xs text-muted-foreground text-center py-6">Chưa có hội đồng</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export default function ScienceDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [data, setData] = useState<DashData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/science/dashboard?year=${year}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json.data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [year]);

  useEffect(() => {
    if (status === 'unauthenticated') { router.push('/login'); return; }
    if (status === 'authenticated') fetchDashboard();
  }, [status, fetchDashboard, router]);

  if (status === 'loading' || loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="grid grid-cols-4 gap-4">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-28 bg-muted animate-pulse rounded-xl" />)}</div>
        <div className="h-64 bg-muted animate-pulse rounded-xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 flex flex-col items-center gap-4 text-center">
        <AlertCircle className="h-10 w-10 text-destructive" />
        <p className="text-sm text-destructive">{error}</p>
        <Button size="sm" onClick={fetchDashboard}>Thử lại</Button>
      </div>
    );
  }

  const layer = data?.layer as DashboardLayer | undefined;
  const cfg = layer ? LAYER_CONFIG[layer] : null;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            {cfg && <div className={`p-1.5 rounded-lg bg-gradient-to-br ${cfg.color}`}><cfg.icon className="h-4 w-4 text-white" /></div>}
            <h1 className="text-xl font-bold">CSDL Khoa học Quản lý</h1>
            {layer && <Badge variant="outline" className="text-xs">{cfg?.title}</Badge>}
          </div>
          <p className="text-sm text-muted-foreground">Thống kê nghiên cứu khoa học năm {year}</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={year}
            onChange={(e) => setYear(+e.target.value)}
            className="text-sm border rounded-lg px-3 py-1.5 bg-background"
          >
            {[currentYear - 1, currentYear, currentYear + 1].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <Button variant="outline" size="sm" onClick={fetchDashboard} className="gap-1">
            <RefreshCw className="h-3.5 w-3.5" /> Làm mới
          </Button>
          <Link href="/dashboard/science/search">
            <Button size="sm" className="gap-1 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white">
              <Bot className="h-3.5 w-3.5" /> Tìm kiếm AI
            </Button>
          </Link>
        </div>
      </div>

      {/* Quick nav */}
      <div className="flex gap-2 flex-wrap">
        {[
          { label: 'Đề tài', href: '/dashboard/science/projects', icon: FlaskConical },
          { label: 'Nhà khoa học', href: '/dashboard/science/scientists', icon: Users },
          { label: 'Tìm kiếm', href: '/dashboard/science/search', icon: Calendar },
          { label: 'Chất lượng dữ liệu', href: '/dashboard/science/data-quality', icon: CheckCircle2 },
        ].map((item) => (
          <Link key={item.href} href={item.href}>
            <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
              <item.icon className="h-3.5 w-3.5" /> {item.label}
              <ArrowUpRight className="h-3 w-3 opacity-50" />
            </Button>
          </Link>
        ))}
      </div>

      {/* Layer-specific content */}
      {data && layer === 'ACADEMY'    && <AcademyDashboard d={data as AcademyData} />}
      {data && layer === 'UNIT'       && <UnitDashboard d={data as UnitData} />}
      {data && layer === 'RESEARCHER' && <ResearcherDashboard d={data as ResearcherData} />}
      {data && layer === 'REVIEWER'   && <ReviewerDashboard d={data as ReviewerData} />}
      {!data && !loading && <p className="text-sm text-muted-foreground text-center py-12">Không có dữ liệu</p>}
    </div>
  );
}
