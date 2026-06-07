'use client';

/**
 * Lịch sử thông báo (Notification delivery log)
 * Route: /dashboard/notifications/history
 *
 * Hiển thị nhật ký gửi thông báo hệ thống (Email / Telegram / Hệ thống) lấy từ
 * bảng notification_history (dữ liệu thật qua /api/notifications/history).
 * RBAC: SYSTEM.VIEW_SYSTEM_STATS (kiểm ở API).
 */

import { useState, useEffect, useCallback, Fragment } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { ModuleHero } from '@/components/ui/enhanced-data-card';
import { cn } from '@/lib/utils';
import {
  Bell, BellRing, Mail, Send, CheckCircle2, XCircle, Clock, Search,
  RefreshCw, ChevronDown, ChevronLeft, ChevronRight, AlertTriangle,
  Inbox, X, Activity, Server, RotateCcw, Loader2,
} from 'lucide-react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import { toast } from '@/components/ui/use-toast';

// ─── Types ───────────────────────────────────────────────────────────────────

interface NotificationEntry {
  id: number;
  notification_type: 'email' | 'telegram' | 'system' | string;
  recipient: string;
  subject?: string;
  message: string;
  status: 'sent' | 'failed' | 'pending' | string;
  error_message?: string;
  metadata?: Record<string, unknown>;
  sent_at: string;
  created_at?: string;
}

interface StatRow {
  notification_type: string;
  status: string;
  count: number;
}

type TimeRange = 'today' | 'week' | 'month';

// ─── Color & meta config ─────────────────────────────────────────────────────

const PALETTE = {
  indigo: '#4f46e5',
  blue: '#2563eb',
  sky: '#0ea5e9',
  violet: '#7c3aed',
  green: '#16a34a',
  amber: '#d97706',
  red: '#dc2626',
  slate: '#475569',
};

const TYPE_META: Record<string, { label: string; Icon: typeof Mail; color: string; bg: string }> = {
  email:    { label: 'Email',     Icon: Mail, color: PALETTE.blue,   bg: 'bg-blue-50' },
  telegram: { label: 'Telegram',  Icon: Send, color: PALETTE.sky,    bg: 'bg-sky-50' },
  system:   { label: 'Hệ thống',  Icon: Bell, color: PALETTE.violet, bg: 'bg-violet-50' },
};

function getTypeMeta(type: string) {
  return TYPE_META[type] ?? { label: type, Icon: Server, color: PALETTE.slate, bg: 'bg-slate-50' };
}

const STATUS_META: Record<string, { label: string; color: string; badge: string; Icon: typeof CheckCircle2 }> = {
  sent:    { label: 'Đã gửi',    color: PALETTE.green, badge: 'bg-green-50 text-green-700 border-green-200', Icon: CheckCircle2 },
  failed:  { label: 'Thất bại',  color: PALETTE.red,   badge: 'bg-red-50 text-red-700 border-red-200',       Icon: XCircle },
  pending: { label: 'Đang chờ',  color: PALETTE.amber, badge: 'bg-amber-50 text-amber-700 border-amber-200', Icon: Clock },
};

function getStatusMeta(status: string) {
  return STATUS_META[status] ?? { label: status, color: PALETTE.slate, badge: 'bg-slate-50 text-slate-600 border-slate-200', Icon: Clock };
}

const TIME_RANGE_OPTIONS: { value: TimeRange; label: string }[] = [
  { value: 'today', label: 'Hôm nay' },
  { value: 'week', label: '7 ngày' },
  { value: 'month', label: '30 ngày' },
];

const PAGE_SIZE = 20;

function formatDateTime(dateStr: string): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

/** Dải số trang có rút gọn bằng dấu "…" khi quá nhiều trang. */
function buildPageWindow(current: number, totalPages: number): (number | 'ellipsis')[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
  const pages: (number | 'ellipsis')[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(totalPages - 1, current + 1);
  if (start > 2) pages.push('ellipsis');
  for (let p = start; p <= end; p++) pages.push(p);
  if (end < totalPages - 1) pages.push('ellipsis');
  pages.push(totalPages);
  return pages;
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatCard({
  icon: Icon, label, value, sub, color, emphasize,
}: {
  icon: typeof Bell; label: string; value: string | number; sub?: string; color: string; emphasize?: boolean;
}) {
  return (
    <Card className="relative overflow-hidden border-0 shadow-md hover:shadow-lg transition-all duration-200">
      <div className="absolute inset-0 opacity-[0.04]" style={{ background: color }} />
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">{label}</p>
            <p className="text-3xl font-bold leading-none" style={{ color: emphasize ? color : '#1e293b' }}>{value}</p>
            {sub && <p className="text-xs text-slate-500 mt-1.5">{sub}</p>}
          </div>
          <div className="rounded-xl p-2.5" style={{ background: `${color}18` }}>
            <Icon className="h-5 w-5" style={{ color }} />
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: color }} />
      </CardContent>
    </Card>
  );
}

function SectionTitle({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-base font-semibold text-slate-700 flex items-center gap-2">
        <span className="w-1 h-5 rounded-full bg-indigo-500 inline-block" />
        {children}
      </h2>
      {action}
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function NotificationHistoryPage() {
  const [notifications, setNotifications] = useState<NotificationEntry[]>([]);
  const [stats, setStats] = useState<StatRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [retryingId, setRetryingId] = useState<number | null>(null);

  // Filters
  const [keyword, setKeyword] = useState('');
  const [submittedKeyword, setSubmittedKeyword] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [timeRange, setTimeRange] = useState<TimeRange>('week');
  const [page, setPage] = useState(1);

  const fetchList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (typeFilter !== 'all') params.set('type', typeFilter);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (submittedKeyword.trim()) params.set('recipient', submittedKeyword.trim());
      if (startDate) params.set('startDate', `${startDate}T00:00:00`);
      if (endDate) params.set('endDate', `${endDate}T23:59:59`);
      params.set('limit', String(PAGE_SIZE));
      params.set('offset', String((page - 1) * PAGE_SIZE));

      const res = await fetch(`/api/notifications/history?${params.toString()}`);
      if (res.status === 403) {
        setError('Bạn không có quyền xem lịch sử thông báo hệ thống.');
        setNotifications([]);
        setTotal(0);
        return;
      }
      const data = await res.json();
      if (data.success) {
        setNotifications(data.data || []);
        setTotal(typeof data.total === 'number' ? data.total : 0);
      } else {
        setError('Không thể tải lịch sử thông báo.');
      }
    } catch (err) {
      console.error('[notifications/history] list error:', err);
      setError('Không thể tải lịch sử thông báo.');
    } finally {
      setLoading(false);
    }
  }, [typeFilter, statusFilter, submittedKeyword, startDate, endDate, page]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`/api/notifications/history?action=stats&timeRange=${timeRange}`);
      const data = await res.json();
      setStats(Array.isArray(data.stats) ? data.stats : []);
    } catch (err) {
      console.error('[notifications/history] stats error:', err);
      setStats([]);
    }
  }, [timeRange]);

  useEffect(() => { fetchList(); }, [fetchList]);
  useEffect(() => { fetchStats(); }, [fetchStats]);

  const handleSearch = () => { setSubmittedKeyword(keyword); setPage(1); };
  const handleResetFilters = () => {
    setKeyword(''); setSubmittedKeyword(''); setTypeFilter('all'); setStatusFilter('all');
    setStartDate(''); setEndDate(''); setPage(1);
  };
  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchList(), fetchStats()]);
    setRefreshing(false);
  };

  const handleRetry = async (id: number) => {
    setRetryingId(id);
    try {
      const res = await fetch(`/api/notifications/history/${id}/retry`, { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.success) {
        toast({ title: 'Đã gửi lại thành công' });
        await Promise.all([fetchList(), fetchStats()]);
      } else {
        toast({
          title: 'Gửi lại thất bại',
          description: data.error || 'Vui lòng thử lại sau.',
          variant: 'destructive',
        });
        await fetchList();
      }
    } catch {
      toast({ title: 'Gửi lại thất bại', description: 'Lỗi kết nối máy chủ.', variant: 'destructive' });
    } finally {
      setRetryingId(null);
    }
  };

  // ── Derived stats ─────────────────────────────────────────────────────────
  const num = (v: unknown) => Number(v) || 0;
  const totalByStatus = (s: string) => stats.filter((r) => r.status === s).reduce((a, r) => a + num(r.count), 0);
  const totalByType = (t: string) => stats.filter((r) => r.notification_type === t).reduce((a, r) => a + num(r.count), 0);
  const grandTotal = stats.reduce((a, r) => a + num(r.count), 0);
  const sentCount = totalByStatus('sent');
  const failedCount = totalByStatus('failed');
  const pendingCount = totalByStatus('pending');
  const successRate = grandTotal > 0 ? Math.round((sentCount / grandTotal) * 100) : 0;

  const statusPie = [
    { name: 'Đã gửi', value: sentCount, color: PALETTE.green },
    { name: 'Thất bại', value: failedCount, color: PALETTE.red },
    { name: 'Đang chờ', value: pendingCount, color: PALETTE.amber },
  ].filter((d) => d.value > 0);

  const CHANNELS = ['email', 'telegram', 'system'];
  const channelBar = CHANNELS.map((t) => ({ name: getTypeMeta(t).label, value: totalByType(t), color: getTypeMeta(t).color }));

  const hasActiveFilters =
    typeFilter !== 'all' || statusFilter !== 'all' || submittedKeyword.trim() !== '' ||
    startDate !== '' || endDate !== '';

  // Phân trang dựa trên tổng số bản ghi thật từ API.
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const rangeStart = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * PAGE_SIZE, total);
  const pageWindow = buildPageWindow(page, totalPages);
  const goToPage = (p: number) => { setPage(Math.min(totalPages, Math.max(1, p))); setExpandedId(null); };

  return (
    <div className="space-y-6">
      {/* ── Module Hero ──────────────────────────────────────────────────────── */}
      <ModuleHero
        moduleId="notifications"
        title="Lịch sử thông báo"
        subtitle="Nhật ký gửi thông báo Email · Telegram · Hệ thống"
        supra="HỆ THỐNG · Trung tâm thông báo"
        icon={BellRing}
        stats={[
          { label: 'Tổng', value: grandTotal },
          { label: 'Thành công', value: `${successRate}%` },
          { label: 'Thất bại', value: failedCount },
        ]}
        controls={
          <Button
            variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}
            className="bg-white/10 border-white/30 text-white hover:bg-white/20 gap-1.5"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Làm mới
          </Button>
        }
      />

      {/* ── Thống kê ─────────────────────────────────────────────────────────── */}
      <div>
        <SectionTitle
          action={
            <div className="inline-flex rounded-lg bg-slate-100 p-0.5">
              {TIME_RANGE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setTimeRange(opt.value)}
                  className={cn(
                    'px-3 py-1 text-xs font-medium rounded-md transition-colors',
                    timeRange === opt.value ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700',
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          }
        >
          Thống kê gửi
        </SectionTitle>

        {/* KPI cards theo trạng thái */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Activity} label="Tổng thông báo" value={grandTotal} sub={`trong ${TIME_RANGE_OPTIONS.find(o => o.value === timeRange)?.label.toLowerCase()}`} color={PALETTE.indigo} />
          <StatCard icon={CheckCircle2} label="Đã gửi thành công" value={sentCount} sub={`tỷ lệ ${successRate}%`} color={PALETTE.green} emphasize={sentCount > 0} />
          <StatCard icon={XCircle} label="Thất bại" value={failedCount} sub="cần kiểm tra lại" color={PALETTE.red} emphasize={failedCount > 0} />
          <StatCard icon={Clock} label="Đang chờ" value={pendingCount} sub="chưa gửi xong" color={PALETTE.amber} emphasize={pendingCount > 0} />
        </div>

        {/* Charts + channel breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
          {/* Status donut */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Tỷ lệ theo trạng thái</CardTitle>
            </CardHeader>
            <CardContent>
              {statusPie.length > 0 ? (
                <div className="flex items-center gap-4">
                  <ResponsiveContainer width="55%" height={150}>
                    <PieChart>
                      <Pie data={statusPie} cx="50%" cy="50%" innerRadius={42} outerRadius={62} paddingAngle={3} dataKey="value">
                        {statusPie.map((e) => <Cell key={e.name} fill={e.color} />)}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex-1 space-y-2">
                    {statusPie.map((e) => (
                      <div key={e.name} className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2 text-slate-600">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ background: e.color }} />
                          {e.name}
                        </span>
                        <span className="font-semibold text-slate-700">{e.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-36 text-slate-400 text-sm">Chưa có dữ liệu</div>
              )}
            </CardContent>
          </Card>

          {/* Channel bar */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Số lượng theo kênh</CardTitle>
            </CardHeader>
            <CardContent>
              {grandTotal > 0 ? (
                <ResponsiveContainer width="100%" height={150}>
                  <BarChart data={channelBar} margin={{ top: 5, right: 12, left: -18, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} allowDecimals={false} />
                    <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
                    <Bar dataKey="value" name="Số lượng" radius={[4, 4, 0, 0]}>
                      {channelBar.map((c) => <Cell key={c.name} fill={c.color} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-36 text-slate-400 text-sm">Chưa có dữ liệu</div>
              )}
            </CardContent>
          </Card>

          {/* Channel list with sent/failed */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Chi tiết theo kênh</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {CHANNELS.map((t) => {
                const meta = getTypeMeta(t);
                const total = totalByType(t);
                const sent = stats.filter((r) => r.notification_type === t && r.status === 'sent').reduce((a, r) => a + num(r.count), 0);
                const pct = total > 0 ? Math.round((sent / total) * 100) : 0;
                return (
                  <div key={t}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="flex items-center gap-2 text-sm text-slate-600">
                        <span className={cn('rounded-md p-1', meta.bg)}>
                          <meta.Icon className="h-3.5 w-3.5" style={{ color: meta.color }} />
                        </span>
                        {meta.label}
                      </span>
                      <span className="text-sm font-semibold text-slate-700">{total}</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: meta.color }} />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Bộ lọc ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
        <div className="flex-1 min-w-48 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Tìm theo người nhận..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="pl-9 bg-white"
          />
        </div>
        <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(1); }}>
          <SelectTrigger className="w-40 bg-white"><SelectValue placeholder="Kênh" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả kênh</SelectItem>
            <SelectItem value="email">Email</SelectItem>
            <SelectItem value="telegram">Telegram</SelectItem>
            <SelectItem value="system">Hệ thống</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-40 bg-white"><SelectValue placeholder="Trạng thái" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả trạng thái</SelectItem>
            <SelectItem value="sent">Đã gửi</SelectItem>
            <SelectItem value="failed">Thất bại</SelectItem>
            <SelectItem value="pending">Đang chờ</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-slate-500 whitespace-nowrap">Từ</span>
          <Input
            type="date" value={startDate}
            max={endDate || undefined}
            onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
            className="w-[150px] bg-white"
          />
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-slate-500 whitespace-nowrap">Đến</span>
          <Input
            type="date" value={endDate}
            min={startDate || undefined}
            onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
            className="w-[150px] bg-white"
          />
        </div>
        <Button onClick={handleSearch} size="sm" className="bg-indigo-600 hover:bg-indigo-700 gap-1.5">
          <Search className="h-4 w-4" /> Tìm
        </Button>
        {hasActiveFilters && (
          <Button onClick={handleResetFilters} size="sm" variant="ghost" className="text-slate-500 gap-1.5">
            <X className="h-4 w-4" /> Xóa lọc
          </Button>
        )}
      </div>

      {/* ── Bảng lịch sử ─────────────────────────────────────────────────────── */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-3 border-b border-slate-100">
          <CardTitle className="text-base text-slate-700 flex items-center gap-2">
            <Inbox className="h-4 w-4 text-indigo-500" />
            Bản ghi gửi thông báo
            <span className="text-sm font-normal text-slate-400">({total.toLocaleString('vi-VN')} bản ghi)</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          {error ? (
            <div className="flex flex-col items-center justify-center py-14 text-slate-400 gap-2">
              <div className="rounded-full bg-red-50 p-3 mb-1">
                <AlertTriangle className="h-7 w-7 text-red-400" />
              </div>
              <p className="text-sm text-slate-600 font-medium">{error}</p>
              <Button onClick={fetchList} size="sm" variant="outline" className="mt-2">Thử lại</Button>
            </div>
          ) : loading ? (
            <div className="space-y-2">
              {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-slate-400 gap-2">
              <div className="rounded-full bg-slate-100 p-3 mb-1">
                <Inbox className="h-7 w-7 text-slate-300" />
              </div>
              <p className="text-sm">Không có thông báo nào khớp bộ lọc</p>
            </div>
          ) : (
            <>
              <div className="overflow-hidden rounded-lg border border-slate-100">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-slate-200 bg-slate-50/70">
                      <TableHead className="w-[36px]" />
                      <TableHead className="text-xs font-semibold uppercase tracking-wide text-slate-500">Kênh</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wide text-slate-500">Người nhận</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wide text-slate-500">Tiêu đề / Nội dung</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wide text-slate-500">Trạng thái</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wide text-slate-500">Thời gian gửi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {notifications.map((notif) => {
                      const typeMeta = getTypeMeta(notif.notification_type);
                      const statusMeta = getStatusMeta(notif.status);
                      const isExpanded = expandedId === notif.id;
                      const hasDetail = !!(notif.message || notif.error_message || (notif.metadata && Object.keys(notif.metadata).length > 0));
                      return (
                        <Fragment key={notif.id}>
                          <TableRow
                            className={cn(
                              'border-slate-100 transition-colors cursor-pointer',
                              notif.status === 'failed' && 'bg-red-50/30 hover:bg-red-50/60',
                              notif.status !== 'failed' && 'hover:bg-slate-50/70',
                            )}
                            onClick={() => setExpandedId(isExpanded ? null : notif.id)}
                          >
                            <TableCell className="text-slate-300">
                              <ChevronDown className={cn('h-4 w-4 transition-transform', isExpanded && 'rotate-180 text-slate-500')} />
                            </TableCell>
                            <TableCell>
                              <span className="flex items-center gap-2">
                                <span className={cn('rounded-lg p-1.5', typeMeta.bg)}>
                                  <typeMeta.Icon className="h-3.5 w-3.5" style={{ color: typeMeta.color }} />
                                </span>
                                <span className="text-sm text-slate-700">{typeMeta.label}</span>
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm text-slate-700 font-medium">{notif.recipient}</span>
                            </TableCell>
                            <TableCell className="max-w-sm">
                              {notif.subject && <p className="text-sm text-slate-700 font-medium truncate">{notif.subject}</p>}
                              <p className="text-xs text-slate-500 truncate">{notif.message}</p>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border', statusMeta.badge)}>
                                  <statusMeta.Icon className="h-3 w-3" />
                                  {statusMeta.label}
                                </span>
                                {(notif.status === 'failed' || notif.status === 'pending') && (
                                  <Button
                                    size="sm" variant="ghost"
                                    className="h-7 px-2 text-indigo-600 hover:bg-indigo-50"
                                    disabled={retryingId === notif.id}
                                    onClick={(e) => { e.stopPropagation(); handleRetry(notif.id); }}
                                  >
                                    {retryingId === notif.id
                                      ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                      : <RotateCcw className="h-3.5 w-3.5" />}
                                    <span className="ml-1 text-xs">Gửi lại</span>
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="text-xs text-slate-500 whitespace-nowrap">{formatDateTime(notif.sent_at)}</span>
                            </TableCell>
                          </TableRow>

                          {isExpanded && (
                            <TableRow className="bg-slate-50/60 hover:bg-slate-50/60 border-slate-100">
                              <TableCell colSpan={6} className="py-4">
                                <div className="space-y-3 px-2">
                                  <div>
                                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1">Nội dung đầy đủ</p>
                                    <p className="text-sm text-slate-700 whitespace-pre-wrap">{notif.message || '—'}</p>
                                  </div>
                                  {notif.error_message && (
                                    <div className="rounded-lg bg-red-50 border border-red-100 p-3">
                                      <div className="flex items-center justify-between gap-2 mb-1">
                                        <p className="text-xs font-semibold uppercase tracking-wide text-red-500 flex items-center gap-1">
                                          <AlertTriangle className="h-3.5 w-3.5" /> Lỗi gửi
                                        </p>
                                        {(notif.status === 'failed' || notif.status === 'pending') && (
                                          <Button
                                            size="sm" variant="outline"
                                            className="h-7 px-2 border-red-200 text-red-700 hover:bg-red-100"
                                            disabled={retryingId === notif.id}
                                            onClick={(e) => { e.stopPropagation(); handleRetry(notif.id); }}
                                          >
                                            {retryingId === notif.id
                                              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                              : <RotateCcw className="h-3.5 w-3.5" />}
                                            <span className="ml-1 text-xs">Gửi lại</span>
                                          </Button>
                                        )}
                                      </div>
                                      <p className="text-sm text-red-700 whitespace-pre-wrap">{notif.error_message}</p>
                                    </div>
                                  )}
                                  {notif.metadata && Object.keys(notif.metadata).length > 0 && (
                                    <div>
                                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1">Metadata</p>
                                      <pre className="text-xs text-slate-600 bg-white border border-slate-200 rounded-lg p-3 overflow-x-auto">
                                        {JSON.stringify(notif.metadata, null, 2)}
                                      </pre>
                                    </div>
                                  )}
                                  {!hasDetail && <p className="text-sm text-slate-400">Không có thông tin chi tiết.</p>}
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </Fragment>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Phân trang theo tổng số bản ghi thật: trang X/Y + nhảy trang */}
              {totalPages > 1 && (
                <div className="flex flex-wrap items-center justify-between gap-3 pt-4">
                  <p className="text-sm text-slate-500">
                    {rangeStart}–{rangeEnd} / {total.toLocaleString('vi-VN')} · Trang {page}/{totalPages}
                  </p>
                  <div className="flex items-center gap-1">
                    <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled={page === 1} onClick={() => goToPage(page - 1)}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    {pageWindow.map((p, i) =>
                      p === 'ellipsis' ? (
                        <span key={`e-${i}`} className="px-2 text-slate-400 select-none">…</span>
                      ) : (
                        <Button
                          key={p}
                          variant={p === page ? 'default' : 'outline'}
                          size="sm"
                          className={cn('h-8 min-w-8 px-2', p === page && 'bg-indigo-600 hover:bg-indigo-700')}
                          onClick={() => goToPage(p)}
                        >
                          {p}
                        </Button>
                      )
                    )}
                    <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled={page === totalPages} onClick={() => goToPage(page + 1)}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
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
