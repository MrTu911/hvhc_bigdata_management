'use client';

import Link from 'next/link';
import { useEffect, useState, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'react-hot-toast';
import {
  FlaskConical, LayoutDashboard, Users, DollarSign, BookOpen,
  FileText, BarChart3, AlertTriangle, Clock, CheckCircle2, TrendingUp,
  Search, Plus, RefreshCw, ChevronLeft, ChevronRight, Edit2, Trash2,
  Calendar, Building2, Award, ExternalLink, Gavel, Star,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

type MainTab = 'overview' | 'projects' | 'councils' | 'finance' | 'publications' | 'scientists' | 'reports';

interface ManagementStats {
  kpi: {
    totalProjects: number;
    inProgressCount: number;
    completedCount: number;
    draftCount: number;
    underReviewCount: number;
    totalPublications: number;
    isiScopusCount: number;
    domesticPubCount: number;
    scientistCount: number;
    totalBudgetApproved: number;
    totalBudgetUsed: number;
    totalCitations: number;
    overdueMilestoneCount: number;
    councilCount: number;
  };
  projectsByCategory: { category: string; label: string; count: number }[];
  yearTrend: { year: number; count: number }[];
  alerts: {
    overdueProjects: { id: string; projectCode: string; title: string; endDate: string; status: string; statusLabel: string; daysOverdue: number }[];
    endingSoonProjects: { id: string; projectCode: string; title: string; endDate: string; status: string; statusLabel: string; daysLeft: number }[];
  };
  upcomingCouncils: { id: string; type: string; typeLabel: string; meetingDate: string; projectId: string; projectCode: string; projectTitle: string; chairmanName: string }[];
  pendingActions: { id: string; projectCode: string; title: string; status: string; statusLabel: string; category: string; categoryLabel: string; piName: string | null; createdAt: string }[];
}

interface NckhProject {
  id: string;
  projectCode: string;
  title: string;
  status: string;
  phase: string;
  category: string;
  field: string;
  budgetYear: number;
  budgetApproved: number | null;
  startDate: string | null;
  endDate: string | null;
  piName?: string | null;
  unitName?: string | null;
  memberCount?: number;
}

interface Council {
  id: string;
  type: string;
  typeLabel: string;
  result: string | null;
  resultLabel: string | null;
  overallScore: number | null;
  meetingDate: string | null;
  project: { id: string; projectCode: string; title: string; category: string; budgetYear: number };
  chairman: { id: string; name: string };
  secretary: { id: string; name: string };
  memberCount: number;
  meetingCount: number;
}

// ─── Status / label maps ──────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-600',
  SUBMITTED: 'bg-blue-100 text-blue-700',
  UNDER_REVIEW: 'bg-amber-100 text-amber-700',
  APPROVED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
  IN_PROGRESS: 'bg-indigo-100 text-indigo-700',
  PAUSED: 'bg-orange-100 text-orange-700',
  COMPLETED: 'bg-emerald-100 text-emerald-700',
  CANCELLED: 'bg-gray-100 text-gray-500',
};

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Bản thảo', SUBMITTED: 'Chờ xét duyệt', UNDER_REVIEW: 'Đang thẩm định',
  APPROVED: 'Được duyệt', REJECTED: 'Từ chối', IN_PROGRESS: 'Đang thực hiện',
  PAUSED: 'Tạm dừng', COMPLETED: 'Hoàn thành', CANCELLED: 'Hủy bỏ',
};

const PHASE_LABELS: Record<string, string> = {
  PROPOSAL: 'Đề xuất', CONTRACT: 'Ký hợp đồng', EXECUTION: 'Triển khai',
  MIDTERM_REVIEW: 'Đánh giá giữa kỳ', FINAL_REVIEW: 'Đánh giá cuối kỳ',
  ACCEPTED: 'Nghiệm thu', ARCHIVED: 'Lưu trữ',
};

const CATEGORY_LABELS: Record<string, string> = {
  CAP_HOC_VIEN: 'Cấp Học viện', CAP_TONG_CUC: 'Cấp Tổng cục',
  CAP_BO_QUOC_PHONG: 'Cấp Bộ QP', CAP_NHA_NUOC: 'Cấp Nhà nước', SANG_KIEN_CO_SO: 'Sáng kiến',
};

const COUNCIL_RESULT_COLORS: Record<string, string> = {
  PASS: 'bg-green-100 text-green-700',
  FAIL: 'bg-red-100 text-red-700',
  REVISE: 'bg-amber-100 text-amber-700',
};

const PAGE_SIZE = 20;

function formatVND(amount: number) {
  if (amount >= 1_000_000_000) return `${(amount / 1_000_000_000).toFixed(1)} tỷ`;
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(0)} tr`;
  return amount.toLocaleString('vi-VN');
}

function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, color, icon: Icon }: {
  label: string; value: string | number; sub?: string; color: string; icon: React.ElementType;
}) {
  return (
    <div className={`rounded-xl border bg-white p-4 flex items-start gap-3 shadow-sm`}>
      <div className={`rounded-lg p-2.5 ${color}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div className="min-w-0">
        <div className="text-2xl font-bold text-gray-900 leading-tight">{value}</div>
        <div className="text-xs text-gray-500 mt-0.5">{label}</div>
        {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ResearchManagementPage() {
  const [activeTab, setActiveTab] = useState<MainTab>('overview');

  // ── Overview state ─────────────────────────────────────────────────────────
  const [stats, setStats] = useState<ManagementStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // ── Projects tab state ─────────────────────────────────────────────────────
  const [projects, setProjects] = useState<NckhProject[]>([]);
  const [projectTotal, setProjectTotal] = useState(0);
  const [projectPage, setProjectPage] = useState(1);
  const [projectSearch, setProjectSearch] = useState('');
  const [projectStatus, setProjectStatus] = useState('');
  const [projectCategory, setProjectCategory] = useState('');
  const [projectLoading, setProjectLoading] = useState(false);

  // ── Councils tab state ─────────────────────────────────────────────────────
  const [councils, setCouncils] = useState<Council[]>([]);
  const [councilTotal, setCouncilTotal] = useState(0);
  const [councilPage, setCouncilPage] = useState(1);
  const [councilSearch, setCouncilSearch] = useState('');
  const [councilType, setCouncilType] = useState('');
  const [councilResult, setCouncilResult] = useState('');
  const [councilLoading, setCouncilLoading] = useState(false);
  const [showCouncilDialog, setShowCouncilDialog] = useState(false);
  const [councilForm, setCouncilForm] = useState({ projectId: '', type: 'REVIEW', chairmanId: '', secretaryId: '', meetingDate: '' });
  const [councilSaving, setCouncilSaving] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<{ id: string; name: string; rank: string | null }[]>([]);
  const [availableProjects, setAvailableProjects] = useState<{ id: string; projectCode: string; title: string }[]>([]);

  // ─── Fetch overview stats ─────────────────────────────────────────────────
  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const r = await fetch('/api/research/management/stats');
      const d = await r.json();
      if (d.success) setStats(d.data);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // ─── Fetch projects ───────────────────────────────────────────────────────
  const fetchProjects = useCallback(async (page: number) => {
    setProjectLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page), limit: String(PAGE_SIZE),
        ...(projectSearch && { keyword: projectSearch }),
        ...(projectStatus && { status: projectStatus }),
        ...(projectCategory && { category: projectCategory }),
      });
      const r = await fetch(`/api/research/projects?${params}`);
      const d = await r.json();
      if (d.success) {
        setProjects(d.data?.projects ?? d.data ?? []);
        setProjectTotal(d.total ?? 0);
      }
    } finally {
      setProjectLoading(false);
    }
  }, [projectSearch, projectStatus, projectCategory]);

  // ─── Fetch councils ────────────────────────────────────────────────────────
  const fetchCouncils = useCallback(async (page: number) => {
    setCouncilLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page), limit: String(PAGE_SIZE),
        ...(councilSearch && { keyword: councilSearch }),
        ...(councilType && { type: councilType }),
        ...(councilResult && { result: councilResult }),
      });
      const r = await fetch(`/api/research/councils?${params}`);
      const d = await r.json();
      if (d.success) {
        setCouncils(d.data ?? []);
        setCouncilTotal(d.total ?? 0);
      }
    } finally {
      setCouncilLoading(false);
    }
  }, [councilSearch, councilType, councilResult]);

  // ─── Load users + projects for council dialog ─────────────────────────────
  const loadDialogData = useCallback(async () => {
    const [ur, pr] = await Promise.all([
      fetch('/api/admin/rbac/users?limit=300&status=ACTIVE').then(r => r.json()),
      fetch('/api/research/projects?limit=200&status=IN_PROGRESS').then(r => r.json()),
    ]);
    if (ur.users) setAvailableUsers(ur.users);
    if (pr.success) {
      const list = pr.data?.projects ?? pr.data ?? [];
      setAvailableProjects(list.map((p: NckhProject) => ({ id: p.id, projectCode: p.projectCode, title: p.title })));
    }
  }, []);

  // ─── Tab switch effects ────────────────────────────────────────────────────
  useEffect(() => {
    if (activeTab === 'overview') fetchStats();
  }, [activeTab, fetchStats]);

  useEffect(() => {
    if (activeTab === 'projects') { setProjectPage(1); fetchProjects(1); }
  }, [activeTab, projectSearch, projectStatus, projectCategory]);

  useEffect(() => {
    if (activeTab === 'projects') fetchProjects(projectPage);
  }, [projectPage]);

  useEffect(() => {
    if (activeTab === 'councils') { setCouncilPage(1); fetchCouncils(1); }
  }, [activeTab, councilSearch, councilType, councilResult]);

  useEffect(() => {
    if (activeTab === 'councils') fetchCouncils(councilPage);
  }, [councilPage]);

  // ─── Council CRUD ──────────────────────────────────────────────────────────
  async function openCreateCouncil() {
    setCouncilForm({ projectId: '', type: 'REVIEW', chairmanId: '', secretaryId: '', meetingDate: '' });
    await loadDialogData();
    setShowCouncilDialog(true);
  }

  async function saveCouncil() {
    if (!councilForm.projectId || !councilForm.chairmanId || !councilForm.secretaryId) {
      toast.error('Vui lòng chọn đề tài, chủ tịch và thư ký hội đồng');
      return;
    }
    setCouncilSaving(true);
    try {
      const r = await fetch('/api/research/councils', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(councilForm),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Lỗi tạo hội đồng');
      toast.success('Tạo hội đồng thành công');
      setShowCouncilDialog(false);
      fetchCouncils(councilPage);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Lỗi không xác định');
    } finally {
      setCouncilSaving(false);
    }
  }

  // ─── Tab nav ───────────────────────────────────────────────────────────────
  const TABS: { key: MainTab; label: string; icon: React.ElementType }[] = [
    { key: 'overview',      label: 'Tổng quan',       icon: LayoutDashboard },
    { key: 'projects',      label: 'Đề tài',           icon: FlaskConical },
    { key: 'councils',      label: 'Hội đồng KH',      icon: Gavel },
    { key: 'finance',       label: 'Kinh phí',         icon: DollarSign },
    { key: 'publications',  label: 'Công bố KH',       icon: BookOpen },
    { key: 'scientists',    label: 'Nhà khoa học',     icon: Users },
    { key: 'reports',       label: 'Báo cáo & Xuất',  icon: BarChart3 },
  ];

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50">

      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 text-white px-6 py-5">
        <div className="flex items-center gap-3 mb-1">
          <FlaskConical className="w-7 h-7" />
          <div>
            <h1 className="text-2xl font-bold leading-tight">Trung tâm Quản lý CSDL Nghiên cứu</h1>
            <p className="text-indigo-200 text-xs mt-0.5">Phòng Khoa học — Học viện Hậu cần</p>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="bg-white border-b shadow-sm sticky top-0 z-20">
        <div className="flex overflow-x-auto px-4">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = activeTab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  active
                    ? 'border-indigo-600 text-indigo-700'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab content */}
      <div className="p-6">

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* TAB: TỔNG QUAN (Command Center)                                   */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {statsLoading ? (
              <div className="flex items-center justify-center py-20 text-gray-400">
                <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Đang tải dữ liệu...
              </div>
            ) : stats ? (
              <>
                {/* KPI Grid */}
                <div>
                  <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Chỉ số tổng hợp</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <KpiCard label="Tổng đề tài" value={stats.kpi.totalProjects} sub={`${stats.kpi.inProgressCount} đang thực hiện`} color="bg-indigo-500" icon={FlaskConical} />
                    <KpiCard label="Đề tài hoàn thành" value={stats.kpi.completedCount} color="bg-emerald-500" icon={CheckCircle2} />
                    <KpiCard label="Công bố khoa học" value={stats.kpi.totalPublications} sub={`${stats.kpi.isiScopusCount} ISI/Scopus`} color="bg-blue-500" icon={BookOpen} />
                    <KpiCard label="Nhà khoa học" value={stats.kpi.scientistCount} sub={`${stats.kpi.totalCitations} lượt trích dẫn`} color="bg-violet-500" icon={Award} />
                    <KpiCard label="Ngân sách được duyệt" value={formatVND(stats.kpi.totalBudgetApproved)} sub={`Đã chi: ${formatVND(stats.kpi.totalBudgetUsed)}`} color="bg-amber-500" icon={DollarSign} />
                    <KpiCard label="Hội đồng KH" value={stats.kpi.councilCount} color="bg-rose-500" icon={Gavel} />
                    <KpiCard label="Đang chờ xét duyệt" value={stats.kpi.underReviewCount} color="bg-orange-400" icon={Clock} />
                    <KpiCard label="Milestone quá hạn" value={stats.kpi.overdueMilestoneCount} color="bg-red-500" icon={AlertTriangle} />
                  </div>
                </div>

                {/* Phân bổ theo cấp */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-white rounded-xl border shadow-sm p-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-indigo-500" /> Phân bổ đề tài theo cấp
                    </h3>
                    <div className="space-y-2">
                      {stats.projectsByCategory.map((c) => (
                        <div key={c.category} className="flex items-center gap-3">
                          <span className="text-xs text-gray-600 w-36 shrink-0">{c.label}</span>
                          <div className="flex-1 bg-gray-100 rounded-full h-2">
                            <div
                              className="bg-indigo-500 h-2 rounded-full"
                              style={{ width: `${Math.min(100, (c.count / (stats.kpi.totalProjects || 1)) * 100)}%` }}
                            />
                          </div>
                          <span className="text-xs font-semibold text-gray-700 w-8 text-right">{c.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Xu hướng đề tài theo năm */}
                  <div className="bg-white rounded-xl border shadow-sm p-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-blue-500" /> Xu hướng đề tài theo năm
                    </h3>
                    <div className="flex items-end gap-2 h-24">
                      {stats.yearTrend.map((y) => {
                        const maxVal = Math.max(...stats.yearTrend.map((t) => t.count), 1);
                        return (
                          <div key={y.year} className="flex flex-col items-center flex-1 gap-1">
                            <span className="text-xs font-semibold text-indigo-700">{y.count}</span>
                            <div
                              className="w-full bg-indigo-400 rounded-t"
                              style={{ height: `${Math.max(4, (y.count / maxVal) * 64)}px` }}
                            />
                            <span className="text-xs text-gray-500">{y.year}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Cảnh báo & Việc cần làm */}
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Đề tài quá hạn */}
                  {stats.alerts.overdueProjects.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                      <h3 className="text-sm font-semibold text-red-700 mb-2 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        Đề tài quá hạn ({stats.alerts.overdueProjects.length})
                      </h3>
                      <div className="space-y-2">
                        {stats.alerts.overdueProjects.slice(0, 5).map((p) => (
                          <Link key={p.id} href={`/dashboard/research/projects/${p.id}`} className="block hover:bg-red-100 rounded-lg p-2 transition-colors">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <span className="text-xs font-mono text-red-600">{p.projectCode}</span>
                                <p className="text-sm text-red-800 font-medium line-clamp-1">{p.title}</p>
                              </div>
                              <Badge className="shrink-0 bg-red-100 text-red-700 text-xs">
                                Quá {p.daysOverdue} ngày
                              </Badge>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Sắp hết hạn */}
                  {stats.alerts.endingSoonProjects.length > 0 && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                      <h3 className="text-sm font-semibold text-amber-700 mb-2 flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Sắp hết hạn trong 30 ngày ({stats.alerts.endingSoonProjects.length})
                      </h3>
                      <div className="space-y-2">
                        {stats.alerts.endingSoonProjects.slice(0, 5).map((p) => (
                          <Link key={p.id} href={`/dashboard/research/projects/${p.id}`} className="block hover:bg-amber-100 rounded-lg p-2 transition-colors">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <span className="text-xs font-mono text-amber-600">{p.projectCode}</span>
                                <p className="text-sm text-amber-800 font-medium line-clamp-1">{p.title}</p>
                              </div>
                              <Badge className="shrink-0 bg-amber-100 text-amber-700 text-xs">
                                Còn {p.daysLeft} ngày
                              </Badge>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Hội đồng sắp họp + Đề tài chờ xét duyệt */}
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Hội đồng sắp họp */}
                  <div className="bg-white border rounded-xl shadow-sm p-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-violet-500" /> Hội đồng sắp họp (30 ngày tới)
                    </h3>
                    {stats.upcomingCouncils.length === 0 ? (
                      <p className="text-sm text-gray-400 text-center py-4">Không có hội đồng nào sắp họp</p>
                    ) : (
                      <div className="space-y-2">
                        {stats.upcomingCouncils.map((c) => (
                          <div key={c.id} className="rounded-lg border border-violet-100 bg-violet-50 p-2.5">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <Badge className="text-xs bg-violet-100 text-violet-700 mb-1">{c.typeLabel}</Badge>
                                <p className="text-sm font-medium text-gray-800 line-clamp-1">{c.projectTitle}</p>
                                <p className="text-xs text-gray-500 mt-0.5">Chủ tịch: {c.chairmanName}</p>
                              </div>
                              <div className="text-right shrink-0">
                                <p className="text-xs font-semibold text-violet-700">{formatDate(c.meetingDate)}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Đề tài chờ xét duyệt */}
                  <div className="bg-white border rounded-xl shadow-sm p-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-orange-500" /> Đề tài chờ xử lý ({stats.pendingActions.length})
                    </h3>
                    {stats.pendingActions.length === 0 ? (
                      <p className="text-sm text-gray-400 text-center py-4">Không có đề tài nào chờ xử lý</p>
                    ) : (
                      <div className="space-y-2">
                        {stats.pendingActions.map((p) => (
                          <Link key={p.id} href={`/dashboard/research/projects/${p.id}`} className="block">
                            <div className="rounded-lg border border-orange-100 bg-orange-50 hover:bg-orange-100 p-2.5 transition-colors">
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <span className="text-xs font-mono text-orange-600">{p.projectCode}</span>
                                  <p className="text-sm font-medium text-gray-800 line-clamp-1">{p.title}</p>
                                  {p.piName && <p className="text-xs text-gray-500">PI: {p.piName}</p>}
                                </div>
                                <Badge className={`shrink-0 text-xs ${STATUS_COLORS[p.status] ?? 'bg-gray-100 text-gray-600'}`}>
                                  {p.statusLabel}
                                </Badge>
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick links */}
                <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-indigo-700 mb-3">Truy cập nhanh</h3>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { href: '/dashboard/research/projects', label: 'Quản lý đề tài M09', icon: FlaskConical },
                      { href: '/dashboard/research/publications', label: 'Kho công bố KH', icon: BookOpen },
                      { href: '/dashboard/research/scientists', label: 'Hồ sơ nhà khoa học', icon: Users },
                      { href: '/dashboard/research/overview', label: 'Dashboard phân tích', icon: BarChart3 },
                      { href: '/dashboard/research/ai-trends', label: 'Xu hướng AI', icon: TrendingUp },
                    ].map((l) => {
                      const Icon = l.icon;
                      return (
                        <Link key={l.href} href={l.href}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-white border border-indigo-200 hover:bg-indigo-100 px-3 py-1.5 text-sm text-indigo-700 font-medium transition-colors">
                          <Icon className="w-4 h-4" /> {l.label}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-20 text-gray-400">Không tải được dữ liệu</div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* TAB: ĐỀ TÀI (Lifecycle Pipeline)                                  */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'projects' && (
          <div className="space-y-4">
            {/* Filter bar */}
            <div className="flex flex-wrap items-center gap-3 bg-white rounded-xl border p-3 shadow-sm">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input placeholder="Tìm đề tài, mã số..." value={projectSearch}
                  onChange={(e) => setProjectSearch(e.target.value)} className="pl-9" />
              </div>
              <Select value={projectStatus || 'all'} onValueChange={(v) => setProjectStatus(v === 'all' ? '' : v)}>
                <SelectTrigger className="w-44"><SelectValue placeholder="Trạng thái" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả trạng thái</SelectItem>
                  {Object.entries(STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={projectCategory || 'all'} onValueChange={(v) => setProjectCategory(v === 'all' ? '' : v)}>
                <SelectTrigger className="w-40"><SelectValue placeholder="Cấp đề tài" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả cấp</SelectItem>
                  {Object.entries(CATEGORY_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm"
                onClick={() => { setProjectSearch(''); setProjectStatus(''); setProjectCategory(''); }}>
                <RefreshCw className="w-4 h-4 mr-1" /> Đặt lại
              </Button>
              <Link href="/dashboard/research/projects/new">
                <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white">
                  <Plus className="w-4 h-4 mr-1" /> Thêm đề tài
                </Button>
              </Link>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
              <div className="px-4 py-2.5 border-b bg-slate-50 flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-700">
                  Danh sách đề tài NCKH
                  <Badge variant="secondary" className="ml-2">{projectTotal}</Badge>
                </span>
                <Link href="/dashboard/research/projects" className="text-xs text-indigo-600 hover:underline flex items-center gap-1">
                  Mở trang M09 <ExternalLink className="w-3 h-3" />
                </Link>
              </div>

              {projectLoading ? (
                <div className="flex items-center justify-center py-16 text-gray-400">
                  <RefreshCw className="w-4 h-4 animate-spin mr-2" /> Đang tải...
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50 text-xs">
                      <TableHead className="w-8">#</TableHead>
                      <TableHead>Mã số / Tên đề tài</TableHead>
                      <TableHead className="w-32">PI</TableHead>
                      <TableHead className="w-28">Cấp</TableHead>
                      <TableHead className="w-32">Trạng thái</TableHead>
                      <TableHead className="w-28">Giai đoạn</TableHead>
                      <TableHead className="w-24">Năm</TableHead>
                      <TableHead className="w-28">Kinh phí</TableHead>
                      <TableHead className="w-24">Hạn nộp</TableHead>
                      <TableHead className="w-16 text-right">Xem</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {projects.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={10} className="text-center py-12 text-gray-400">
                          Không có đề tài nào
                        </TableCell>
                      </TableRow>
                    ) : projects.map((p, i) => (
                      <TableRow key={p.id} className="hover:bg-indigo-50/30 text-sm">
                        <TableCell className="text-gray-400">{(projectPage - 1) * PAGE_SIZE + i + 1}</TableCell>
                        <TableCell>
                          <div className="font-mono text-xs text-indigo-600">{p.projectCode}</div>
                          <div className="font-medium text-gray-900 line-clamp-2 mt-0.5">{p.title}</div>
                          {p.unitName && <div className="text-xs text-gray-500 mt-0.5">{p.unitName}</div>}
                        </TableCell>
                        <TableCell className="text-xs text-gray-700">{p.piName ?? '—'}</TableCell>
                        <TableCell>
                          <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded">
                            {CATEGORY_LABELS[p.category] ?? p.category}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[p.status] ?? 'bg-gray-100 text-gray-600'}`}>
                            {STATUS_LABELS[p.status] ?? p.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs text-gray-600">
                          {PHASE_LABELS[p.phase] ?? p.phase}
                        </TableCell>
                        <TableCell className="text-center font-mono text-gray-700">{p.budgetYear}</TableCell>
                        <TableCell className="text-xs text-gray-700">
                          {p.budgetApproved ? formatVND(p.budgetApproved) : '—'}
                        </TableCell>
                        <TableCell className="text-xs text-gray-600">{formatDate(p.endDate)}</TableCell>
                        <TableCell className="text-right">
                          <Link href={`/dashboard/research/projects/${p.id}`}>
                            <Button size="icon" variant="ghost" className="h-7 w-7">
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}

              {/* Pagination */}
              {projectTotal > PAGE_SIZE && (
                <div className="px-4 py-3 border-t flex items-center justify-between text-sm text-gray-500">
                  <span>Hiển thị {(projectPage - 1) * PAGE_SIZE + 1}–{Math.min(projectPage * PAGE_SIZE, projectTotal)} / {projectTotal}</span>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={projectPage <= 1} onClick={() => setProjectPage((p) => p - 1)}>
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" disabled={projectPage * PAGE_SIZE >= projectTotal} onClick={() => setProjectPage((p) => p + 1)}>
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* TAB: HỘI ĐỒNG KH                                                  */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'councils' && (
          <div className="space-y-4">
            {/* Filter bar */}
            <div className="flex flex-wrap items-center gap-3 bg-white rounded-xl border p-3 shadow-sm">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input placeholder="Tìm đề tài, mã số..." value={councilSearch}
                  onChange={(e) => setCouncilSearch(e.target.value)} className="pl-9" />
              </div>
              <Select value={councilType || 'all'} onValueChange={(v) => setCouncilType(v === 'all' ? '' : v)}>
                <SelectTrigger className="w-44"><SelectValue placeholder="Loại hội đồng" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả loại</SelectItem>
                  <SelectItem value="REVIEW">Hội đồng thẩm định</SelectItem>
                  <SelectItem value="ACCEPTANCE">Hội đồng nghiệm thu</SelectItem>
                  <SelectItem value="FINAL">Hội đồng kết luận</SelectItem>
                </SelectContent>
              </Select>
              <Select value={councilResult || 'all'} onValueChange={(v) => setCouncilResult(v === 'all' ? '' : v)}>
                <SelectTrigger className="w-40"><SelectValue placeholder="Kết quả" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả kết quả</SelectItem>
                  <SelectItem value="PASS">Thông qua</SelectItem>
                  <SelectItem value="FAIL">Không thông qua</SelectItem>
                  <SelectItem value="REVISE">Yêu cầu sửa đổi</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm"
                onClick={() => { setCouncilSearch(''); setCouncilType(''); setCouncilResult(''); }}>
                <RefreshCw className="w-4 h-4 mr-1" /> Đặt lại
              </Button>
              <Button size="sm" className="bg-violet-600 hover:bg-violet-700 text-white" onClick={openCreateCouncil}>
                <Plus className="w-4 h-4 mr-1" /> Tạo hội đồng
              </Button>
            </div>

            {/* Council table */}
            <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
              <div className="px-4 py-2.5 border-b bg-slate-50">
                <span className="text-sm font-semibold text-gray-700">
                  Danh sách Hội đồng Khoa học
                  <Badge variant="secondary" className="ml-2">{councilTotal}</Badge>
                </span>
              </div>

              {councilLoading ? (
                <div className="flex items-center justify-center py-16 text-gray-400">
                  <RefreshCw className="w-4 h-4 animate-spin mr-2" /> Đang tải...
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50 text-xs">
                      <TableHead className="w-8">#</TableHead>
                      <TableHead>Đề tài</TableHead>
                      <TableHead className="w-36">Loại hội đồng</TableHead>
                      <TableHead className="w-32">Chủ tịch</TableHead>
                      <TableHead className="w-32">Ngày họp</TableHead>
                      <TableHead className="w-20">Điểm TB</TableHead>
                      <TableHead className="w-32">Kết quả</TableHead>
                      <TableHead className="w-24">Thành viên</TableHead>
                      <TableHead className="w-16 text-right">Chi tiết</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {councils.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-12 text-gray-400">
                          Chưa có hội đồng nào. Tạo hội đồng đầu tiên!
                        </TableCell>
                      </TableRow>
                    ) : councils.map((c, i) => (
                      <TableRow key={c.id} className="hover:bg-violet-50/30 text-sm">
                        <TableCell className="text-gray-400">{(councilPage - 1) * PAGE_SIZE + i + 1}</TableCell>
                        <TableCell>
                          <div className="font-mono text-xs text-indigo-600">{c.project.projectCode}</div>
                          <div className="font-medium text-gray-900 line-clamp-2 mt-0.5">{c.project.title}</div>
                          <div className="text-xs text-gray-500">{CATEGORY_LABELS[c.project.category] ?? c.project.category} · {c.project.budgetYear}</div>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full">
                            {c.typeLabel}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-gray-700">{c.chairman.name}</TableCell>
                        <TableCell className="text-xs text-gray-600">{formatDate(c.meetingDate)}</TableCell>
                        <TableCell className="text-center">
                          {c.overallScore != null ? (
                            <span className="font-semibold text-indigo-700">{c.overallScore.toFixed(1)}</span>
                          ) : '—'}
                        </TableCell>
                        <TableCell>
                          {c.result ? (
                            <span className={`text-xs px-2 py-0.5 rounded-full ${COUNCIL_RESULT_COLORS[c.result] ?? 'bg-gray-100 text-gray-600'}`}>
                              {c.resultLabel}
                            </span>
                          ) : <span className="text-xs text-gray-400">Chưa có</span>}
                        </TableCell>
                        <TableCell className="text-center text-xs text-gray-600">
                          {c.memberCount} thành viên
                        </TableCell>
                        <TableCell className="text-right">
                          <Button size="icon" variant="ghost" className="h-7 w-7">
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}

              {councilTotal > PAGE_SIZE && (
                <div className="px-4 py-3 border-t flex items-center justify-between text-sm text-gray-500">
                  <span>Hiển thị {(councilPage - 1) * PAGE_SIZE + 1}–{Math.min(councilPage * PAGE_SIZE, councilTotal)} / {councilTotal}</span>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={councilPage <= 1} onClick={() => setCouncilPage((p) => p - 1)}>
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" disabled={councilPage * PAGE_SIZE >= councilTotal} onClick={() => setCouncilPage((p) => p + 1)}>
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* TAB: KINH PHÍ                                                      */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'finance' && (
          <div className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
              <DollarSign className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-800">Module Kinh phí đang phát triển</p>
                <p className="text-xs text-amber-700 mt-1">
                  Hệ thống đã có đầy đủ schema dữ liệu cho Dự toán, Đơn đặt hàng (PO), Hóa đơn, Chi phí thực tế, và Tài trợ bên ngoài. UI đang được triển khai theo Phase B.
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  <Link href="/dashboard/science/finance">
                    <Button size="sm" variant="outline" className="border-amber-400 text-amber-700 hover:bg-amber-100">
                      <ExternalLink className="w-3.5 h-3.5 mr-1" /> Trang Tài chính Khoa học (Science module)
                    </Button>
                  </Link>
                </div>
              </div>
            </div>

            {/* Summary cards từ stats */}
            {stats && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl border p-4 shadow-sm">
                  <div className="text-xs text-gray-500 mb-1">Tổng ngân sách được duyệt</div>
                  <div className="text-2xl font-bold text-amber-700">{formatVND(stats.kpi.totalBudgetApproved)}</div>
                  <div className="text-xs text-gray-400 mt-1">toàn bộ đề tài M09</div>
                </div>
                <div className="bg-white rounded-xl border p-4 shadow-sm">
                  <div className="text-xs text-gray-500 mb-1">Đã chi tiêu</div>
                  <div className="text-2xl font-bold text-red-600">{formatVND(stats.kpi.totalBudgetUsed)}</div>
                  <div className="text-xs text-gray-400 mt-1">
                    {stats.kpi.totalBudgetApproved > 0
                      ? `${((stats.kpi.totalBudgetUsed / stats.kpi.totalBudgetApproved) * 100).toFixed(1)}% ngân sách`
                      : '—'}
                  </div>
                </div>
                <div className="bg-white rounded-xl border p-4 shadow-sm">
                  <div className="text-xs text-gray-500 mb-1">Còn lại</div>
                  <div className="text-2xl font-bold text-emerald-700">
                    {formatVND(Math.max(0, stats.kpi.totalBudgetApproved - stats.kpi.totalBudgetUsed))}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">chưa sử dụng</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* TAB: CÔNG BỐ KH                                                   */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'publications' && (
          <div className="space-y-4">
            {/* Quick stats */}
            {stats && (
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white rounded-xl border p-4 shadow-sm">
                  <div className="text-2xl font-bold text-blue-700">{stats.kpi.totalPublications}</div>
                  <div className="text-xs text-gray-500">Tổng công bố đã xuất bản</div>
                </div>
                <div className="bg-white rounded-xl border p-4 shadow-sm">
                  <div className="text-2xl font-bold text-indigo-700">{stats.kpi.isiScopusCount}</div>
                  <div className="text-xs text-gray-500">ISI / Scopus indexed</div>
                </div>
                <div className="bg-white rounded-xl border p-4 shadow-sm">
                  <div className="text-2xl font-bold text-violet-700">{stats.kpi.totalCitations}</div>
                  <div className="text-xs text-gray-500">Tổng lượt trích dẫn</div>
                </div>
              </div>
            )}

            {/* Link to full publication management */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-blue-800 mb-2 flex items-center gap-2">
                <BookOpen className="w-4 h-4" /> Quản lý công bố khoa học (M09)
              </h3>
              <p className="text-xs text-blue-700 mb-3">
                Hệ thống M09 đã có đầy đủ chức năng quản lý công bố: nhập liệu, import từ Excel, kiểm tra trùng lặp AI, thống kê ISI/Scopus, phân loại theo loại bài, export báo cáo.
              </p>
              <div className="flex flex-wrap gap-2">
                <Link href="/dashboard/research/publications">
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                    <BookOpen className="w-4 h-4 mr-1" /> Kho công bố KH
                  </Button>
                </Link>
                <Link href="/dashboard/research/publications/new">
                  <Button size="sm" variant="outline" className="border-blue-400 text-blue-700 hover:bg-blue-100">
                    <Plus className="w-4 h-4 mr-1" /> Thêm công bố mới
                  </Button>
                </Link>
                <Link href="/dashboard/research/ai-trends">
                  <Button size="sm" variant="outline" className="border-blue-400 text-blue-700 hover:bg-blue-100">
                    <Star className="w-4 h-4 mr-1" /> Phân tích xu hướng AI
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* TAB: NHÀ KHOA HỌC                                                 */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'scientists' && (
          <div className="space-y-4">
            {stats && (
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-xl border p-4 shadow-sm">
                  <div className="text-2xl font-bold text-violet-700">{stats.kpi.scientistCount}</div>
                  <div className="text-xs text-gray-500">Nhà khoa học có hồ sơ</div>
                </div>
                <div className="bg-white rounded-xl border p-4 shadow-sm">
                  <div className="text-2xl font-bold text-indigo-700">{stats.kpi.totalCitations}</div>
                  <div className="text-xs text-gray-500">Tổng lượt trích dẫn</div>
                </div>
              </div>
            )}

            <div className="bg-violet-50 border border-violet-200 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-violet-800 mb-2 flex items-center gap-2">
                <Users className="w-4 h-4" /> Hồ sơ & Năng lực nhà khoa học (M09)
              </h3>
              <p className="text-xs text-violet-700 mb-3">
                Hệ thống M09 đã có: hồ sơ học vấn, lịch sử công tác, giải thưởng, chỉ số h-index/i10, bản đồ năng lực nghiên cứu, tích hợp ORCID/Scopus, gợi ý thành viên hội đồng qua AI.
              </p>
              <div className="flex flex-wrap gap-2">
                <Link href="/dashboard/research/scientists">
                  <Button size="sm" className="bg-violet-600 hover:bg-violet-700 text-white">
                    <Users className="w-4 h-4 mr-1" /> Danh sách nhà khoa học
                  </Button>
                </Link>
                <Link href="/dashboard/research/scientists/capacity-map">
                  <Button size="sm" variant="outline" className="border-violet-400 text-violet-700 hover:bg-violet-100">
                    <Building2 className="w-4 h-4 mr-1" /> Bản đồ năng lực
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* TAB: BÁO CÁO & XUẤT DỮ LIỆU                                       */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'reports' && (
          <div className="space-y-4">
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3">
              <BarChart3 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-emerald-800">Module Báo cáo & Xuất dữ liệu đang phát triển</p>
                <p className="text-xs text-emerald-700 mt-1">
                  Phase B sẽ bổ sung: Báo cáo tháng/quý/năm tự động, xuất Excel/PDF theo mẫu BQP, biểu đồ tổng kết cho họp Ban giám đốc.
                </p>
              </div>
            </div>

            {/* Export options available now */}
            <div className="bg-white rounded-xl border shadow-sm p-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Xuất dữ liệu hiện có</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { label: 'Xuất danh sách đề tài NCKH', href: '/api/research/export', desc: 'Excel, toàn bộ trường dữ liệu M09' },
                  { label: 'Xuất danh sách công bố KH', href: '/api/research/publications/export', desc: 'Excel, bao gồm ISI/Scopus, trích dẫn' },
                  { label: 'Xuất hồ sơ nhà khoa học', href: '/api/research/scientists/export', desc: 'Excel, kèm h-index, lĩnh vực chuyên môn' },
                ].map((item) => (
                  <a key={item.href} href={item.href} target="_blank" rel="noreferrer"
                    className="flex items-start gap-3 rounded-lg border hover:bg-gray-50 p-3 transition-colors">
                    <FileText className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-800">{item.label}</p>
                      <p className="text-xs text-gray-500">{item.desc}</p>
                    </div>
                  </a>
                ))}
              </div>
            </div>

            {/* Dashboard links */}
            <div className="bg-white rounded-xl border shadow-sm p-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Dashboard phân tích</h3>
              <div className="flex flex-wrap gap-2">
                <Link href="/dashboard/research/overview">
                  <Button size="sm" variant="outline">
                    <BarChart3 className="w-4 h-4 mr-1" /> Tổng quan nghiên cứu
                  </Button>
                </Link>
                <Link href="/dashboard/research/ai-trends">
                  <Button size="sm" variant="outline">
                    <TrendingUp className="w-4 h-4 mr-1" /> Xu hướng nghiên cứu AI
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Dialog: Tạo Hội đồng ───────────────────────────────────────────── */}
      <Dialog open={showCouncilDialog} onOpenChange={setShowCouncilDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gavel className="w-5 h-5 text-violet-600" />
              Tạo Hội đồng Khoa học mới
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div>
              <Label>Đề tài <span className="text-red-500">*</span></Label>
              <Select value={councilForm.projectId} onValueChange={(v) => setCouncilForm((f) => ({ ...f, projectId: v }))}>
                <SelectTrigger><SelectValue placeholder="Chọn đề tài đang thực hiện..." /></SelectTrigger>
                <SelectContent>
                  {availableProjects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.projectCode} — {p.title.slice(0, 60)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Loại hội đồng <span className="text-red-500">*</span></Label>
              <Select value={councilForm.type} onValueChange={(v) => setCouncilForm((f) => ({ ...f, type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="REVIEW">Hội đồng thẩm định</SelectItem>
                  <SelectItem value="ACCEPTANCE">Hội đồng nghiệm thu</SelectItem>
                  <SelectItem value="FINAL">Hội đồng kết luận</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Chủ tịch hội đồng <span className="text-red-500">*</span></Label>
                <Select value={councilForm.chairmanId} onValueChange={(v) => setCouncilForm((f) => ({ ...f, chairmanId: v }))}>
                  <SelectTrigger><SelectValue placeholder="Chọn..." /></SelectTrigger>
                  <SelectContent>
                    {availableUsers.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.name}{u.rank ? ` · ${u.rank}` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Thư ký hội đồng <span className="text-red-500">*</span></Label>
                <Select value={councilForm.secretaryId} onValueChange={(v) => setCouncilForm((f) => ({ ...f, secretaryId: v }))}>
                  <SelectTrigger><SelectValue placeholder="Chọn..." /></SelectTrigger>
                  <SelectContent>
                    {availableUsers.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.name}{u.rank ? ` · ${u.rank}` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Ngày họp dự kiến</Label>
              <Input type="date" value={councilForm.meetingDate}
                onChange={(e) => setCouncilForm((f) => ({ ...f, meetingDate: e.target.value }))} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCouncilDialog(false)}>Hủy</Button>
            <Button className="bg-violet-600 hover:bg-violet-700 text-white" onClick={saveCouncil} disabled={councilSaving}>
              {councilSaving ? <RefreshCw className="w-4 h-4 animate-spin mr-1" /> : null}
              Tạo hội đồng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
