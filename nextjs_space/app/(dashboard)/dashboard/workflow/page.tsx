'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/components/ui/use-toast';
import {
  Workflow, GitBranch, Clock, CheckCircle2, XCircle, AlertCircle,
  ArrowRight, RefreshCw, BarChart3, BookOpen, Star, ShieldCheck, FileText,
} from 'lucide-react';
import Link from 'next/link';

const WORKFLOW_COLORS: Record<string, string> = {
  blue: 'bg-blue-100 text-blue-800',
  pink: 'bg-pink-100 text-pink-800',
  amber: 'bg-amber-100 text-amber-800',
  yellow: 'bg-yellow-100 text-yellow-800',
  red: 'bg-red-100 text-red-800',
};

const WORKFLOW_ICONS: Record<string, React.ReactNode> = {
  grade: <BookOpen className="h-4 w-4" />,
  research: <Star className="h-4 w-4" />,
  policyRequest: <FileText className="h-4 w-4" />,
  award: <ShieldCheck className="h-4 w-4" />,
  discipline: <AlertCircle className="h-4 w-4" />,
};

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-600',
  SUBMITTED: 'bg-blue-100 text-blue-700',
  UNDER_REVIEW: 'bg-yellow-100 text-yellow-700',
  PROPOSED: 'bg-orange-100 text-orange-700',
  APPROVED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
  CANCELLED: 'bg-gray-100 text-gray-500',
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

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Workflow className="h-6 w-6 text-violet-600" />
            Quy trình nghiệp vụ
          </h1>
          <p className="text-muted-foreground mt-1">Theo dõi và quản lý 4 quy trình phê duyệt chính</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchAll}>
          <RefreshCw className="h-4 w-4 mr-2" /> Làm mới
        </Button>
      </div>

      {/* Summary Cards */}
      {overview && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-orange-50 border-orange-200">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-orange-600">{overview.summary.totalPending}</p>
              <p className="text-sm text-orange-700 mt-1 flex items-center justify-center gap-1">
                <Clock className="h-3 w-3" /> Đang chờ xử lý
              </p>
            </CardContent>
          </Card>
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-green-600">{overview.summary.recentCompleted}</p>
              <p className="text-sm text-green-700 mt-1 flex items-center justify-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> Hoàn thành (30 ngày)
              </p>
            </CardContent>
          </Card>
          {Object.entries(overview.byWorkflow).slice(0, 2).map(([key, wf]) => (
            <Card key={key}>
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  {WORKFLOW_ICONS[key]}
                  <p className="text-2xl font-bold">{wf.pending}</p>
                </div>
                <p className="text-xs text-muted-foreground">{wf.label}</p>
                {wf.pending > 0 && (
                  <Badge className="mt-1 text-xs bg-orange-100 text-orange-700">Cần xử lý</Badge>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Tổng quan</TabsTrigger>
          <TabsTrigger value="definitions">Định nghĩa quy trình</TabsTrigger>
          <TabsTrigger value="instances">Danh sách instances</TabsTrigger>
        </TabsList>

        {/* ===== TAB 1: OVERVIEW ===== */}
        <TabsContent value="overview" className="space-y-4 mt-4">
          {loading ? (
            <div className="py-12 text-center text-muted-foreground">Đang tải...</div>
          ) : overview ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(overview.byWorkflow).map(([key, wf]) => (
                <Card key={key}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      {WORKFLOW_ICONS[key]}
                      <span>{wf.label}</span>
                      <Badge variant="outline" className="ml-auto text-xs">{wf.code}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {wf.pending > 0 && (
                      <div className="flex items-center gap-2 p-2 bg-orange-50 rounded text-sm text-orange-700">
                        <Clock className="h-3 w-3" />
                        <span className="font-medium">{wf.pending} mục cần xử lý</span>
                      </div>
                    )}
                    <div className="space-y-1">
                      {Object.entries(wf.byStatus).filter(([, count]) => count > 0).map(([status, count]) => (
                        <div key={status} className="flex items-center justify-between text-xs">
                          <Badge className={`text-xs ${STATUS_COLORS[status] || 'bg-gray-100 text-gray-600'}`}>
                            {STATUS_LABELS[status] || status}
                          </Badge>
                          <span className="font-mono font-medium">{count}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : null}
        </TabsContent>

        {/* ===== TAB 2: DEFINITIONS ===== */}
        <TabsContent value="definitions" className="space-y-4 mt-4">
          {definitions.map(def => (
            <Card key={def.id}>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <GitBranch className="h-5 w-5 text-violet-600" />
                  {def.name}
                  <Badge variant="outline">{def.code}</Badge>
                  {def.sodEnabled && (
                    <Badge className="text-xs bg-red-100 text-red-700">SoD</Badge>
                  )}
                </CardTitle>
                <p className="text-sm text-muted-foreground">{def.description}</p>
              </CardHeader>
              <CardContent>
                {/* States */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {def.states.map(state => (
                    <div key={state.key} className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 ${state.isFinal ? 'bg-green-100 text-green-700 ring-1 ring-green-300' : STATUS_COLORS[state.key] || 'bg-gray-100 text-gray-600'}`}>
                      {state.isFinal && <CheckCircle2 className="h-3 w-3" />}
                      {state.label}
                    </div>
                  ))}
                </div>
                {/* Transitions summary */}
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  {def.transitions.slice(0, 8).map((t, i) => (
                    <span key={i} className="flex items-center gap-1">
                      <span className={`px-1 rounded ${STATUS_COLORS[t.from] || 'bg-gray-100'}`}>{STATUS_LABELS[t.from] || t.from}</span>
                      <ArrowRight className="h-3 w-3" />
                      <span className={`px-1 rounded ${STATUS_COLORS[t.to] || 'bg-gray-100'}`}>{STATUS_LABELS[t.to] || t.to}</span>
                    </span>
                  ))}
                </div>
                {def.sodNote && (
                  <p className="mt-2 text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {def.sodNote}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* ===== TAB 3: INSTANCES ===== */}
        <TabsContent value="instances" className="space-y-4 mt-4">
          {/* Filters */}
          <div className="flex gap-3 flex-wrap">
            <Select value={filterType || 'ALL'} onValueChange={v => setFilterType(v === 'ALL' ? '' : v)}>
              <SelectTrigger className="w-48">
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
              <SelectTrigger className="w-44">
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
          <Card>
            <CardContent className="p-0">
              {instances.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">Không có dữ liệu</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium">Tiêu đề</th>
                        <th className="px-4 py-3 text-left font-medium">Loại</th>
                        <th className="px-4 py-3 text-left font-medium">Người yêu cầu</th>
                        <th className="px-4 py-3 text-center font-medium">Trạng thái</th>
                        <th className="px-4 py-3 text-left font-medium">Ngày cập nhật</th>
                        <th className="px-4 py-3 text-center font-medium">Hành động</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {instances.map(inst => (
                        <tr key={`${inst.type}-${inst.id}`} className="hover:bg-muted/30">
                          <td className="px-4 py-3">
                            <p className="font-medium line-clamp-1">{inst.title}</p>
                          </td>
                          <td className="px-4 py-3">
                            <Badge className={`text-xs ${WORKFLOW_COLORS[inst.color] || 'bg-gray-100 text-gray-600'}`}>
                              {inst.typeLabel}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-sm">{inst.requester?.name || '—'}</p>
                            {inst.requester?.rank && (
                              <p className="text-xs text-muted-foreground">{inst.requester.rank}</p>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Badge className={`text-xs ${STATUS_COLORS[inst.status] || 'bg-gray-100'}`}>
                              {STATUS_LABELS[inst.status] || inst.status}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">
                            {inst.updatedAt ? new Date(inst.updatedAt).toLocaleDateString('vi-VN') : '—'}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Link href={inst.url}>
                              <Button variant="ghost" size="sm" className="text-xs">
                                Xem <ArrowRight className="h-3 w-3 ml-1" />
                              </Button>
                            </Link>
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
