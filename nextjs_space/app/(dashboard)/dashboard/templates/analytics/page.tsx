'use client';

/**
 * M18 – Template Analytics Dashboard (UC-T10)
 *
 * Layout:
 *   Row 1: KPI cards (6 cards)
 *   Row 2: Daily trend chart (full width, bar + line)
 *   Row 3: Top templates table (2/3) + Format breakdown (1/3)
 *   Drawer: per-template detail khi click vào row
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  ArrowLeft,
  RefreshCw,
  TrendingUp,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  BarChart2,
  Calendar,
  ExternalLink,
  ChevronDown,
  Activity,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

// ─── Types (mirror service types) ────────────────────────────────────────────

interface AnalyticsSummary {
  totalTemplates: number;
  activeTemplates: number;
  totalJobs: number;
  totalExports: number;
  totalFailed: number;
  successRate: number;
  avgRenderMs: number | null;
  jobsToday: number;
  exportsToday: number;
}

interface DailyTrendPoint {
  date: string;
  jobCount: number;
  successCount: number;
  failCount: number;
}

interface TopTemplate {
  templateId: string;
  name: string;
  code: string;
  category: string | null;
  totalJobs: number;
  totalExports: number;
  failCount: number;
  successRate: number;
  avgRenderMs: number | null;
}

interface TemplateDetail {
  template: { id: string; name: string; code: string; category: string | null; version: number; isActive: boolean };
  summary: { totalJobs: number; totalExports: number; failCount: number; successRate: number; avgRenderMs: number | null };
  dailyTrend: DailyTrendPoint[];
  formatBreakdown: { format: string; count: number }[];
  entityTypeBreakdown: { entityType: string; count: number }[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<string, string> = {
  NHAN_SU: 'Nhân sự', DANG_VIEN: 'Đảng viên', BAO_HIEM: 'Bảo hiểm',
  CHE_DO: 'Chế độ', KHEN_THUONG: 'Khen thưởng', DAO_TAO: 'Đào tạo',
  NCKH: 'NCKH', TONG_HOP: 'Tổng hợp',
};

const FORMAT_COLORS: Record<string, string> = {
  PDF: '#ef4444', DOCX: '#3b82f6', XLSX: '#22c55e', HTML: '#a855f7',
};

const PIE_COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const ENTITY_LABELS: Record<string, string> = {
  personnel: 'Nhân sự', student: 'Học viên',
  party_member: 'Đảng viên', faculty: 'Giảng viên',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatRenderMs(ms: number | null): string {
  if (ms === null) return '–';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function formatDateShort(dateStr: string): string {
  // '2026-04-09' → '09/04'
  const parts = dateStr.split('-');
  return `${parts[2]}/${parts[1]}`;
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

function DailyTooltip({ active, payload, label }: {
  active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm">
      <p className="font-semibold text-gray-700 mb-1">{label}</p>
      {payload.map(p => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-gray-600">{p.name}:</span>
          <span className="font-medium">{p.value.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}

// ─── KPI Card ────────────────────────────────────────────────────────────────

function KpiCard({
  label, value, sub, icon: Icon, color = 'blue',
}: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; color?: 'blue' | 'green' | 'red' | 'amber' | 'purple' | 'gray';
}) {
  const colorMap = {
    blue:   'bg-blue-50   text-blue-600',
    green:  'bg-green-50  text-green-600',
    red:    'bg-red-50    text-red-600',
    amber:  'bg-amber-50  text-amber-600',
    purple: 'bg-purple-50 text-purple-600',
    gray:   'bg-gray-100  text-gray-600',
  };
  return (
    <Card>
      <CardContent className="pt-5 pb-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs text-gray-500">{label}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            {sub && <p className="text-xs text-gray-400">{sub}</p>}
          </div>
          <div className={`p-2 rounded-lg ${colorMap[color]}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function TemplateAnalyticsPage() {
  const router = useRouter();

  const [days, setDays] = useState<'7' | '30' | '90'>('30');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [dailyTrend, setDailyTrend] = useState<DailyTrendPoint[]>([]);
  const [topTemplates, setTopTemplates] = useState<TopTemplate[]>([]);
  const [formatBreakdown, setFormatBreakdown] = useState<{ format: string; count: number }[]>([]);

  // Per-template detail sheet
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detail, setDetail] = useState<TemplateDetail | null>(null);

  // ── Fetch overview ────────────────────────────────────────────────────────

  const fetchOverview = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const res = await fetch(`/api/templates/analytics?days=${days}&top=10`);
      if (!res.ok) throw new Error('Lỗi tải analytics');
      const json = await res.json();
      setSummary(json.data.summary);
      setDailyTrend(json.data.dailyTrend);
      setTopTemplates(json.data.topTemplates);
      setFormatBreakdown(json.data.formatBreakdown ?? []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Lỗi tải dữ liệu');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [days]);

  useEffect(() => { fetchOverview(); }, [fetchOverview]);

  // ── Fetch template detail ──────────────────────────────────────────────────

  async function openDetail(templateId: string) {
    setDetailOpen(true);
    setDetail(null);
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/templates/analytics/${templateId}?days=${days}`);
      if (!res.ok) throw new Error('Lỗi tải chi tiết');
      const json = await res.json();
      setDetail(json.data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Lỗi tải chi tiết');
    } finally {
      setDetailLoading(false);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 space-y-6">

      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/templates')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <BarChart2 className="h-5 w-5 text-blue-600" />
              Thống kê Template (M18)
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Phân tích sử dụng mẫu biểu và lịch sử xuất file
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={days} onValueChange={v => setDays(v as '7' | '30' | '90')}>
            <SelectTrigger className="w-32 h-8 text-sm">
              <Calendar className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 ngày</SelectItem>
              <SelectItem value="30">30 ngày</SelectItem>
              <SelectItem value="90">90 ngày</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fetchOverview(true)}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
      ) : summary && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <KpiCard
            label="Tổng mẫu biểu"
            value={summary.totalTemplates}
            sub={`${summary.activeTemplates} đang active`}
            icon={FileText}
            color="blue"
          />
          <KpiCard
            label="Tổng job xuất"
            value={summary.totalJobs.toLocaleString()}
            sub={`Hôm nay: ${summary.jobsToday}`}
            icon={Activity}
            color="purple"
          />
          <KpiCard
            label="Tổng file xuất thành công"
            value={summary.totalExports.toLocaleString()}
            sub={`Hôm nay: ${summary.exportsToday}`}
            icon={CheckCircle2}
            color="green"
          />
          <KpiCard
            label="File xuất lỗi"
            value={summary.totalFailed.toLocaleString()}
            icon={XCircle}
            color={summary.totalFailed > 0 ? 'red' : 'gray'}
          />
          <KpiCard
            label="Tỉ lệ thành công"
            value={`${summary.successRate}%`}
            icon={TrendingUp}
            color={summary.successRate >= 90 ? 'green' : summary.successRate >= 70 ? 'amber' : 'red'}
          />
          <KpiCard
            label="Avg render time"
            value={formatRenderMs(summary.avgRenderMs)}
            sub="30 ngày gần nhất"
            icon={Clock}
            color="amber"
          />
        </div>
      )}

      {/* ── Daily Trend Chart ── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-blue-500" />
            Lượt xuất file theo ngày ({days} ngày)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-56 w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={dailyTrend} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDateShort}
                  tick={{ fontSize: 11 }}
                  interval={days === '7' ? 0 : days === '30' ? 4 : 9}
                />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip content={<DailyTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }}
                  formatter={v => v === 'successCount' ? 'Thành công' : 'Lỗi'}
                />
                <Bar dataKey="successCount" name="successCount" stackId="a" fill="#22c55e" radius={[0, 0, 0, 0]} />
                <Bar dataKey="failCount" name="failCount" stackId="a" fill="#ef4444" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* ── Bottom row: Top Templates + Format pie ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Top Templates table (2/3) */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Top Template ({days} ngày)</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-4 space-y-3">
                {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8">#</TableHead>
                    <TableHead>Mẫu biểu</TableHead>
                    <TableHead className="text-right w-24">Lượt xuất</TableHead>
                    <TableHead className="w-36 hidden md:table-cell">Tỉ lệ ✓</TableHead>
                    <TableHead className="text-right w-20 hidden lg:table-cell">Avg time</TableHead>
                    <TableHead className="w-8" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topTemplates.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-400 text-sm">
                        Chưa có dữ liệu xuất file trong khoảng thời gian này
                      </TableCell>
                    </TableRow>
                  ) : (
                    topTemplates.map((t, idx) => (
                      <TableRow
                        key={t.templateId}
                        className="cursor-pointer hover:bg-blue-50/40 transition-colors"
                        onClick={() => openDetail(t.templateId)}
                      >
                        <TableCell>
                          <span className={`text-sm font-bold ${idx < 3 ? 'text-blue-600' : 'text-gray-400'}`}>
                            {idx + 1}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm font-medium truncate max-w-[200px]">{t.name}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-xs font-mono text-gray-400">{t.code}</span>
                              {t.category && (
                                <Badge variant="outline" className="text-xs py-0 px-1">
                                  {CATEGORY_LABELS[t.category] ?? t.category}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="font-semibold text-sm">{t.totalExports.toLocaleString()}</span>
                          {t.failCount > 0 && (
                            <span className="text-xs text-red-500 ml-1">({t.failCount} lỗi)</span>
                          )}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="flex items-center gap-2">
                            <Progress
                              value={t.successRate}
                              className="h-1.5 flex-1"
                            />
                            <span className={`text-xs w-10 text-right font-medium ${
                              t.successRate >= 90 ? 'text-green-600'
                              : t.successRate >= 70 ? 'text-amber-600' : 'text-red-600'
                            }`}>
                              {t.successRate}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right hidden lg:table-cell">
                          <span className="text-xs text-gray-500">{formatRenderMs(t.avgRenderMs)}</span>
                        </TableCell>
                        <TableCell>
                          <ChevronDown className="h-3.5 w-3.5 text-gray-400 -rotate-90" />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Format + Job status (1/3) */}
        <div className="space-y-4">
          {/* Format breakdown */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Định dạng xuất ({days} ngày)</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-32 w-full" />
              ) : (() => {
                const pieData = formatBreakdown.length > 0
                  ? formatBreakdown.map(f => ({ name: f.format, value: f.count }))
                  : [{ name: 'Chưa có dữ liệu', value: 1 }];

                return (
                  <>
                    <ResponsiveContainer width="100%" height={140}>
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={60}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {pieData.map((entry, i) => (
                            <Cell
                              key={entry.name}
                              fill={FORMAT_COLORS[entry.name] ?? PIE_COLORS[i % PIE_COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v, n) => [`${v} jobs`, n]} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex flex-wrap gap-2 justify-center mt-1">
                      {pieData.map((entry, i) => (
                        <div key={entry.name} className="flex items-center gap-1 text-xs">
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: FORMAT_COLORS[entry.name] ?? PIE_COLORS[i % PIE_COLORS.length] }}
                          />
                          <span>{entry.name}</span>
                        </div>
                      ))}
                    </div>
                  </>
                );
              })()}
            </CardContent>
          </Card>

          {/* Quick links */}
          <Card>
            <CardContent className="pt-4 space-y-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Liên kết nhanh</p>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-sm"
                onClick={() => router.push('/dashboard/templates/export-jobs')}
              >
                <Activity className="h-4 w-4 mr-2 text-blue-500" />
                Lịch sử Export Jobs
                <ExternalLink className="h-3 w-3 ml-auto text-gray-400" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-sm"
                onClick={() => router.push('/dashboard/templates/schedules')}
              >
                <Clock className="h-4 w-4 mr-2 text-purple-500" />
                Lịch xuất định kỳ
                <ExternalLink className="h-3 w-3 ml-auto text-gray-400" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-sm"
                onClick={() => router.push('/dashboard/templates')}
              >
                <FileText className="h-4 w-4 mr-2 text-green-500" />
                Thư viện Template
                <ExternalLink className="h-3 w-3 ml-auto text-gray-400" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Template Detail Sheet ── */}
      <Sheet open={detailOpen} onOpenChange={setDetailOpen}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader className="mb-4">
            <SheetTitle className="flex items-center gap-2">
              <BarChart2 className="h-4 w-4 text-blue-600" />
              Chi tiết Template
            </SheetTitle>
          </SheetHeader>

          {detailLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-48 w-full" />
            </div>
          ) : detail ? (
            <div className="space-y-5">

              {/* Template info */}
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-gray-900">{detail.template.name}</p>
                  <p className="text-xs font-mono text-gray-500 mt-0.5">{detail.template.code}</p>
                  {detail.template.category && (
                    <Badge variant="outline" className="mt-1 text-xs">
                      {CATEGORY_LABELS[detail.template.category] ?? detail.template.category}
                    </Badge>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/dashboard/templates/${detail.template.id}`)}
                >
                  <ExternalLink className="h-3.5 w-3.5 mr-1" />
                  Chi tiết
                </Button>
              </div>

              {/* Summary KPIs */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Tổng jobs</p>
                  <p className="text-xl font-bold">{detail.summary.totalJobs.toLocaleString()}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">File xuất thành công</p>
                  <p className="text-xl font-bold text-green-600">{detail.summary.totalExports.toLocaleString()}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Tỉ lệ thành công</p>
                  <p className={`text-xl font-bold ${
                    detail.summary.successRate >= 90 ? 'text-green-600'
                    : detail.summary.successRate >= 70 ? 'text-amber-600' : 'text-red-600'
                  }`}>
                    {detail.summary.successRate}%
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Avg render time</p>
                  <p className="text-xl font-bold text-amber-600">
                    {formatRenderMs(detail.summary.avgRenderMs)}
                  </p>
                </div>
              </div>

              {/* Daily trend mini chart */}
              <div>
                <p className="text-sm font-semibold mb-2">Trend {days} ngày</p>
                <ResponsiveContainer width="100%" height={160}>
                  <LineChart
                    data={detail.dailyTrend}
                    margin={{ top: 4, right: 4, left: -24, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={formatDateShort}
                      tick={{ fontSize: 10 }}
                      interval={days === '7' ? 0 : 4}
                    />
                    <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                    <Tooltip content={<DailyTooltip />} />
                    <Line
                      type="monotone"
                      dataKey="successCount"
                      name="successCount"
                      stroke="#22c55e"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="failCount"
                      name="failCount"
                      stroke="#ef4444"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Format breakdown */}
              {detail.formatBreakdown.length > 0 && (
                <div>
                  <p className="text-sm font-semibold mb-2">Định dạng xuất</p>
                  <div className="space-y-1.5">
                    {detail.formatBreakdown.map(f => {
                      const total = detail.formatBreakdown.reduce((s, x) => s + x.count, 0);
                      return (
                        <div key={f.format} className="flex items-center gap-2 text-sm">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: FORMAT_COLORS[f.format] ?? '#94a3b8' }}
                          />
                          <span className="w-12 font-mono text-xs">{f.format}</span>
                          <Progress
                            value={(f.count / total) * 100}
                            className="h-1.5 flex-1"
                          />
                          <span className="text-xs text-gray-500 w-8 text-right">{f.count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Entity type breakdown */}
              {detail.entityTypeBreakdown.length > 0 && (
                <div>
                  <p className="text-sm font-semibold mb-2">Loại entity</p>
                  <div className="space-y-1.5">
                    {detail.entityTypeBreakdown.map((e, i) => {
                      const total = detail.entityTypeBreakdown.reduce((s, x) => s + x.count, 0);
                      return (
                        <div key={e.entityType} className="flex items-center gap-2 text-sm">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                          />
                          <span className="text-xs w-24">
                            {ENTITY_LABELS[e.entityType] ?? e.entityType}
                          </span>
                          <Progress
                            value={(e.count / total) * 100}
                            className="h-1.5 flex-1"
                          />
                          <span className="text-xs text-gray-500 w-8 text-right">{e.count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-8">Không có dữ liệu</p>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
