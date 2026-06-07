'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ModuleHero } from '@/components/ui/enhanced-data-card';
import { WorkflowStatCard, SectionTitle, WF_PALETTE } from '@/components/workflow/workflow-ui';
import { toast } from '@/components/ui/use-toast';
import {
  Workflow, GitBranch, Clock, CheckCircle2, AlertCircle,
  ArrowRight, RefreshCw, BookOpen, Star, ShieldCheck, FileText,
  Loader2, Layers, ChevronRight, LayoutGrid,
} from 'lucide-react';
import Link from 'next/link';

const COLOR_HEX: Record<string, string> = {
  blue: WF_PALETTE.blue,
  pink: WF_PALETTE.pink,
  amber: WF_PALETTE.amber,
  yellow: WF_PALETTE.yellow,
  red: WF_PALETTE.red,
};

const WORKFLOW_ICONS: Record<string, React.ReactNode> = {
  grade: <BookOpen className="h-4 w-4" />,
  research: <Star className="h-4 w-4" />,
  policyRequest: <FileText className="h-4 w-4" />,
  award: <ShieldCheck className="h-4 w-4" />,
  discipline: <AlertCircle className="h-4 w-4" />,
};

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-slate-100 text-slate-600',
  SUBMITTED: 'bg-blue-100 text-blue-700',
  UNDER_REVIEW: 'bg-yellow-100 text-yellow-700',
  PROPOSED: 'bg-orange-100 text-orange-700',
  APPROVED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
  CANCELLED: 'bg-slate-100 text-slate-500',
  IN_PROGRESS: 'bg-cyan-100 text-cyan-700',
  PENDING_REVIEW: 'bg-purple-100 text-purple-700',
  COMPLETED: 'bg-emerald-100 text-emerald-700',
};

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Nháp', SUBMITTED: 'Đã nộp', UNDER_REVIEW: 'Đang xét',
  PROPOSED: 'Đề xuất', APPROVED: 'Đã duyệt', REJECTED: 'Từ chối',
  CANCELLED: 'Đã hủy', IN_PROGRESS: 'Đang thực hiện',
  PENDING_REVIEW: 'Chờ nghiệm thu', COMPLETED: 'Hoàn thành',
};

const WORKFLOW_BADGE: Record<string, string> = {
  blue: 'bg-blue-100 text-blue-800',
  pink: 'bg-pink-100 text-pink-800',
  amber: 'bg-amber-100 text-amber-800',
  yellow: 'bg-yellow-100 text-yellow-800',
  red: 'bg-red-100 text-red-800',
};

interface OverviewData {
  summary: { totalPending: number; recentCompleted: number };
  byWorkflow: Record<string, {
    label: string; code: string; pending: number;
    byStatus: Record<string, number>; color: string;
  }>;
}

interface Definition {
  id: string; name: string; code: string; description: string;
  states: { key: string; label: string; isFinal: boolean }[];
  transitions: { from: string; to: string }[];
  sodEnabled?: boolean; sodNote?: string; color: string;
}

interface Instance {
  id: string; type: string; typeLabel: string; code: string;
  title: string; status: string; requester?: { name: string; rank?: string };
  submittedAt?: string; updatedAt?: string; url: string; color: string;
}

export default function WorkflowPage() {
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [definitions, setDefinitions] = useState<Definition[]>([]);
  const [instances, setInstances] = useState<Instance[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [ovRes, defRes] = await Promise.all([
        fetch('/api/workflow/overview'),
        fetch('/api/workflow/definitions'),
      ]);
      if (ovRes.ok) setOverview(await ovRes.json());
      if (defRes.ok) setDefinitions((await defRes.json()).definitions || []);
    } catch {
      toast({ title: 'Lỗi', description: 'Không thể tải dữ liệu', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const fetchInstances = async () => {
    try {
      const params = new URLSearchParams({
        ...(filterType && { type: filterType }),
        ...(filterStatus && { status: filterStatus }),
      });
      const res = await fetch(`/api/workflow/instances?${params}`);
      if (res.ok) setInstances((await res.json()).instances || []);
    } catch { /* silent */ }
  };

  useEffect(() => { fetchAll(); }, []);
  useEffect(() => { if (activeTab === 'instances') fetchInstances(); }, [activeTab, filterType, filterStatus]);

  const wfEntries = overview ? Object.entries(overview.byWorkflow) : [];
  const typeCount = wfEntries.length;
  const withPending = wfEntries.filter(([, wf]) => wf.pending > 0).length;

  return (
    <div className="space-y-6">
      {/* ── Module Hero ──────────────────────────────────────────────────────── */}
      <ModuleHero
        moduleId="workflow"
        title="Quy trình nghiệp vụ"
        subtitle="Theo dõi và quản lý các quy trình phê duyệt chính của hệ thống"
        icon={Workflow}
        stats={
          overview
            ? [
                { label: 'Đang chờ', value: overview.summary.totalPending },
                { label: 'Hoàn thành 30 ngày', value: overview.summary.recentCompleted },
                { label: 'Loại quy trình', value: typeCount },
              ]
            : undefined
        }
        controls={
          <Button
            variant="outline" size="sm" onClick={fetchAll}
            className="bg-white/10 border-white/30 text-white hover:bg-white/20 gap-1.5"
          >
            <RefreshCw className="h-4 w-4" /> Làm mới
          </Button>
        }
      />

      {/* ── KPI Cards ────────────────────────────────────────────────────────── */}
      {overview && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <WorkflowStatCard
            icon={Clock} label="Đang chờ xử lý" value={overview.summary.totalPending}
            sub="trên toàn bộ quy trình" color={WF_PALETTE.orange}
            emphasize={overview.summary.totalPending > 0}
          />
          <WorkflowStatCard
            icon={CheckCircle2} label="Hoàn thành" value={overview.summary.recentCompleted}
            sub="trong 30 ngày qua" color={WF_PALETTE.green}
            emphasize={overview.summary.recentCompleted > 0}
          />
          <WorkflowStatCard
            icon={GitBranch} label="Loại quy trình" value={typeCount}
            sub="đang vận hành" color={WF_PALETTE.violet}
          />
          <WorkflowStatCard
            icon={AlertCircle} label="QT có việc tồn" value={withPending}
            sub={`/ ${typeCount} loại quy trình`} color={WF_PALETTE.amber}
            emphasize={withPending > 0}
          />
        </div>
      )}

      {/* ── Tabs ─────────────────────────────────────────────────────────────── */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-slate-100/80 p-1 rounded-xl h-auto flex-wrap">
          <TabsTrigger value="overview" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm gap-1.5">
            <LayoutGrid className="h-4 w-4" /> Tổng quan
          </TabsTrigger>
          <TabsTrigger value="definitions" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm gap-1.5">
            <GitBranch className="h-4 w-4" /> Định nghĩa quy trình
          </TabsTrigger>
          <TabsTrigger value="instances" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm gap-1.5">
            <Layers className="h-4 w-4" /> Danh sách instances
          </TabsTrigger>
        </TabsList>

        {/* ===== TAB 1: OVERVIEW ===== */}
        <TabsContent value="overview" className="space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
              <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
              <p className="text-sm">Đang tải dữ liệu quy trình...</p>
            </div>
          ) : overview ? (
            <>
              <SectionTitle>Phân bố theo loại quy trình</SectionTitle>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {wfEntries.map(([key, wf]) => {
                  const hex = COLOR_HEX[wf.color] ?? WF_PALETTE.slate;
                  return (
                    <Card key={key} className="border-0 shadow-md hover:shadow-lg transition-all overflow-hidden">
                      <div className="h-1" style={{ background: hex }} />
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2 text-slate-700">
                          <span className="rounded-lg p-1.5" style={{ background: `${hex}15`, color: hex }}>
                            {WORKFLOW_ICONS[key]}
                          </span>
                          <span className="flex-1">{wf.label}</span>
                          <Badge variant="outline" className="text-xs font-mono">{wf.code}</Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2.5">
                        {wf.pending > 0 ? (
                          <div className="flex items-center gap-2 px-3 py-2 bg-orange-50 rounded-lg text-sm text-orange-700 font-medium">
                            <Clock className="h-3.5 w-3.5" />
                            {wf.pending} mục cần xử lý
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 px-3 py-2 bg-green-50 rounded-lg text-sm text-green-700">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Không có việc tồn đọng
                          </div>
                        )}
                        <div className="space-y-1.5 pt-1">
                          {Object.entries(wf.byStatus).filter(([, count]) => count > 0).map(([status, count]) => (
                            <div key={status} className="flex items-center justify-between text-xs">
                              <span className={`px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[status] || 'bg-slate-100 text-slate-600'}`}>
                                {STATUS_LABELS[status] || status}
                              </span>
                              <span className="font-mono font-semibold text-slate-700">{count}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </>
          ) : (
            <Card className="border-0 shadow-md">
              <CardContent className="py-14 text-center text-slate-400 text-sm">Không có dữ liệu tổng quan</CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ===== TAB 2: DEFINITIONS ===== */}
        <TabsContent value="definitions" className="space-y-4">
          <SectionTitle>Định nghĩa các quy trình</SectionTitle>
          {definitions.map(def => {
            const hex = COLOR_HEX[def.color] ?? WF_PALETTE.violet;
            return (
              <Card key={def.id} className="border-0 shadow-md overflow-hidden">
                <div className="h-1" style={{ background: hex }} />
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2 text-slate-800">
                    <span className="rounded-lg p-1.5" style={{ background: `${hex}15`, color: hex }}>
                      <GitBranch className="h-4 w-4" />
                    </span>
                    {def.name}
                    <Badge variant="outline" className="font-mono text-xs">{def.code}</Badge>
                    {def.sodEnabled && (
                      <Badge className="text-xs bg-red-100 text-red-700 border-0">SoD</Badge>
                    )}
                  </CardTitle>
                  <p className="text-sm text-slate-500">{def.description}</p>
                </CardHeader>
                <CardContent>
                  {/* States */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {def.states.map(state => (
                      <div
                        key={state.key}
                        className={`px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${state.isFinal ? 'bg-green-100 text-green-700 ring-1 ring-green-300' : STATUS_COLORS[state.key] || 'bg-slate-100 text-slate-600'}`}
                      >
                        {state.isFinal && <CheckCircle2 className="h-3 w-3" />}
                        {state.label}
                      </div>
                    ))}
                  </div>
                  {/* Transitions summary */}
                  <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                    {def.transitions.slice(0, 8).map((t, i) => (
                      <span key={i} className="flex items-center gap-1">
                        <span className={`px-1.5 py-0.5 rounded ${STATUS_COLORS[t.from] || 'bg-slate-100'}`}>{STATUS_LABELS[t.from] || t.from}</span>
                        <ArrowRight className="h-3 w-3" />
                        <span className={`px-1.5 py-0.5 rounded ${STATUS_COLORS[t.to] || 'bg-slate-100'}`}>{STATUS_LABELS[t.to] || t.to}</span>
                      </span>
                    ))}
                  </div>
                  {def.sodNote && (
                    <p className="mt-3 text-xs text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> {def.sodNote}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        {/* ===== TAB 3: INSTANCES ===== */}
        <TabsContent value="instances" className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <Select value={filterType || 'ALL'} onValueChange={v => setFilterType(v === 'ALL' ? '' : v)}>
              <SelectTrigger className="w-52 bg-white">
                <SelectValue placeholder="Loại quy trình" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tất cả loại</SelectItem>
                <SelectItem value="policyRequest">Hồ sơ chính sách (A3.3)</SelectItem>
                <SelectItem value="award">Khen thưởng (A3.4)</SelectItem>
                <SelectItem value="discipline">Kỷ luật (A3.4)</SelectItem>
                <SelectItem value="research">NCKH (A3.2)</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus || 'ALL'} onValueChange={v => setFilterStatus(v === 'ALL' ? '' : v)}>
              <SelectTrigger className="w-44 bg-white">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tất cả</SelectItem>
                {Object.entries(STATUS_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <Card className="border-0 shadow-md">
            <CardContent className="p-0">
              {instances.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-14 text-slate-400 gap-2">
                  <Layers className="h-10 w-10 text-slate-300" />
                  <p className="text-sm">Không có quy trình phù hợp</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50/70 border-b border-slate-200">
                      <tr className="text-xs uppercase tracking-wide text-slate-500">
                        <th className="px-4 py-3 text-left font-semibold">Tiêu đề</th>
                        <th className="px-4 py-3 text-left font-semibold">Loại</th>
                        <th className="px-4 py-3 text-left font-semibold">Người yêu cầu</th>
                        <th className="px-4 py-3 text-center font-semibold">Trạng thái</th>
                        <th className="px-4 py-3 text-left font-semibold">Cập nhật</th>
                        <th className="px-4 py-3 text-center font-semibold" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {instances.map(inst => (
                        <tr key={`${inst.type}-${inst.id}`} className="hover:bg-slate-50/70 transition-colors">
                          <td className="px-4 py-3">
                            <p className="font-medium text-slate-800 line-clamp-1">{inst.title}</p>
                          </td>
                          <td className="px-4 py-3">
                            <Badge className={`text-xs border-0 ${WORKFLOW_BADGE[inst.color] || 'bg-slate-100 text-slate-600'}`}>
                              {inst.typeLabel}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-sm text-slate-700">{inst.requester?.name || '—'}</p>
                            {inst.requester?.rank && (
                              <p className="text-xs text-slate-400">{inst.requester.rank}</p>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[inst.status] || 'bg-slate-100 text-slate-600'}`}>
                              {STATUS_LABELS[inst.status] || inst.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-500">
                            {inst.updatedAt ? new Date(inst.updatedAt).toLocaleDateString('vi-VN') : '—'}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Button asChild variant="outline" size="sm" className="h-8 gap-1 border-slate-200 hover:bg-slate-50">
                              <Link href={inst.url}>Xem <ChevronRight className="h-3.5 w-3.5" /></Link>
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
