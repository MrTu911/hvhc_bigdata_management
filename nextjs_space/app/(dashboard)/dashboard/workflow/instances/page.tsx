'use client';

/**
 * M13 – Workflow Instances List (Manager/Monitor view)
 * Route: /dashboard/workflow/instances
 *
 * Dành cho quản lý: xem tất cả workflow instances trong phạm vi đơn vị mình.
 * Filter theo: status, keyword. Pagination. View-only + navigate to detail.
 */

import { useState, useEffect, useCallback } from 'react';
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
import { toast } from '@/components/ui/use-toast';
import { EmptyState } from '@/components/ui/empty-state';
import { ModuleHero } from '@/components/ui/enhanced-data-card';
import { cn } from '@/lib/utils';
import {
  RefreshCw, Search, ChevronRight, Clock, AlertCircle, AlertTriangle, Layers,
} from 'lucide-react';
import Link from 'next/link';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface WorkflowInstanceRow {
  id: string;
  title: string;
  entityType: string;
  status: string;
  currentStepCode: string | null;
  priority: number;
  initiatorId: string;
  currentAssigneeId: string | null;
  startedAt: string;
  dueAt: string | null;
  completedAt: string | null;
}

interface InstancesResponse {
  items: WorkflowInstanceRow[];
  total: number;
  page: number;
  pageSize: number;
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const STATUS_OPTIONS = [
  { value: 'ALL',         label: 'Tất cả trạng thái' },
  { value: 'PENDING',     label: 'Chờ xử lý' },
  { value: 'IN_PROGRESS', label: 'Đang xử lý' },
  { value: 'APPROVED',    label: 'Đã duyệt' },
  { value: 'REJECTED',    label: 'Từ chối' },
  { value: 'RETURNED',    label: 'Trả lại' },
  { value: 'CANCELLED',   label: 'Đã hủy' },
  { value: 'EXPIRED',     label: 'Hết hạn' },
];

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  PENDING:     { label: 'Chờ xử lý',  className: 'bg-blue-50 text-blue-700 border-blue-200' },
  IN_PROGRESS: { label: 'Đang xử lý', className: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  APPROVED:    { label: 'Đã duyệt',   className: 'bg-green-50 text-green-700 border-green-200' },
  REJECTED:    { label: 'Từ chối',    className: 'bg-red-50 text-red-700 border-red-200' },
  RETURNED:    { label: 'Trả lại',    className: 'bg-amber-50 text-amber-700 border-amber-200' },
  CANCELLED:   { label: 'Đã hủy',     className: 'bg-slate-50 text-slate-500 border-slate-200' },
  EXPIRED:     { label: 'Hết hạn',    className: 'bg-orange-50 text-orange-700 border-orange-200' },
  FAILED:      { label: 'Lỗi',        className: 'bg-red-50 text-red-700 border-red-200' },
};

const PRIORITY_META: Record<number, { label: string; dot: string; text: string }> = {
  3: { label: 'Khẩn cấp', dot: 'bg-red-500',   text: 'text-red-600 font-semibold' },
  2: { label: 'Cao',      dot: 'bg-amber-500', text: 'text-amber-600' },
  1: { label: 'TB',       dot: 'bg-blue-500',  text: 'text-blue-600' },
  0: { label: 'BT',       dot: 'bg-slate-400', text: 'text-slate-500' },
};

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
}

function getDueStatus(dueAt: string | null, completedAt: string | null): 'overdue' | 'near' | null {
  if (!dueAt || completedAt) return null;
  const now = Date.now();
  const due = new Date(dueAt).getTime();
  if (due < now) return 'overdue';
  if (due - now < 24 * 60 * 60 * 1000) return 'near';
  return null;
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function WorkflowInstancesPage() {
  const [data, setData] = useState<InstancesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  const fetchInstances = useCallback(async (resetPage = false) => {
    const currentPage = resetPage ? 1 : page;
    if (resetPage) setPage(1);

    const params = new URLSearchParams({
      page: String(currentPage),
      pageSize: String(PAGE_SIZE),
    });
    if (keyword.trim()) params.set('keyword', keyword.trim());
    if (statusFilter !== 'ALL') params.set('status', statusFilter);

    try {
      const res = await fetch(`/api/workflow-dashboard/instances?${params}`);
      if (!res.ok) throw new Error();
      const json = await res.json();
      if (json.success) setData(json.data);
    } catch {
      toast({ title: 'Không thể tải danh sách quy trình', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [page, keyword, statusFilter]);

  useEffect(() => {
    fetchInstances();
  }, [fetchInstances]);

  const handleSearch = useCallback(() => {
    fetchInstances(true);
  }, [fetchInstances]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchInstances(true);
    setRefreshing(false);
  }, [fetchInstances]);

  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 1;

  return (
    <div className="space-y-6">
      {/* ── Module Hero ──────────────────────────────────────────────────────── */}
      <ModuleHero
        moduleId="workflow"
        title="Danh sách quy trình"
        subtitle="Tất cả workflow instances trong phạm vi quản lý của bạn"
        icon={Layers}
        stats={data ? [{ label: 'Tổng quy trình', value: data.total }] : undefined}
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

      {/* ── Filters ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
        <div className="flex-1 min-w-48 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Tìm theo tiêu đề quy trình..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="pl-9 bg-white"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); fetchInstances(true); }}>
          <SelectTrigger className="w-48 bg-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={handleSearch} size="sm" className="bg-amber-600 hover:bg-amber-700 gap-1.5">
          <Search className="h-4 w-4" /> Tìm kiếm
        </Button>
      </div>

      {/* ── Table ────────────────────────────────────────────────────────────── */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-3 border-b border-slate-100">
          <CardTitle className="text-base text-slate-700">
            {data ? (
              <span className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-amber-500" />
                {data.total} quy trình
                {statusFilter !== 'ALL' && (
                  <span className="ml-1 text-slate-400 font-normal text-sm">
                    — đang lọc: {STATUS_OPTIONS.find(o => o.value === statusFilter)?.label}
                  </span>
                )}
              </span>
            ) : 'Quy trình'}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-lg" />
              ))}
            </div>
          ) : !data || data.items.length === 0 ? (
            <EmptyState
              icon={<Layers className="h-8 w-8 text-muted-foreground" />}
              title="Không có quy trình nào"
              description="Thử thay đổi bộ lọc hoặc tìm kiếm khác."
              className="py-10"
            />
          ) : (
            <>
              <div className="overflow-hidden rounded-lg border border-slate-100">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-slate-200 bg-slate-50/70">
                      <TableHead className="w-[34%] text-xs font-semibold uppercase tracking-wide text-slate-500">Tiêu đề</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wide text-slate-500">Loại đối tượng</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wide text-slate-500">Bước</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wide text-slate-500">Trạng thái</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wide text-slate-500">Ưu tiên</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wide text-slate-500">Hạn / Bắt đầu</TableHead>
                      <TableHead className="w-[90px]" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.items.map((row) => {
                      const statusCfg = STATUS_BADGE[row.status] ?? { label: row.status, className: 'bg-slate-50 text-slate-600 border-slate-200' };
                      const prio = PRIORITY_META[row.priority] ?? PRIORITY_META[0];
                      const dueStatus = getDueStatus(row.dueAt, row.completedAt);
                      return (
                        <TableRow
                          key={row.id}
                          className={cn(
                            'border-slate-100 transition-colors',
                            dueStatus === 'overdue' && 'bg-red-50/40 hover:bg-red-50/70',
                            dueStatus === 'near' && 'bg-amber-50/40 hover:bg-amber-50/70',
                          )}
                        >
                          <TableCell>
                            <div className="flex items-start gap-2.5">
                              <span className={cn('mt-1.5 h-2 w-2 rounded-full shrink-0', prio.dot)} title={prio.label} />
                              <div className="font-medium text-sm leading-snug text-slate-800 line-clamp-2">{row.title}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-slate-500">{row.entityType}</span>
                          </TableCell>
                          <TableCell>
                            {row.currentStepCode ? (
                              <code className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">
                                {row.currentStepCode}
                              </code>
                            ) : <span className="text-slate-300">—</span>}
                          </TableCell>
                          <TableCell>
                            <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border', statusCfg.className)}>
                              {statusCfg.label}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className={cn('text-xs', prio.text)}>{prio.label}</span>
                          </TableCell>
                          <TableCell>
                            <span className={cn(
                              'flex items-center gap-1 text-xs',
                              dueStatus === 'overdue' && 'text-red-600 font-medium',
                              dueStatus === 'near' && 'text-amber-600 font-medium',
                              !dueStatus && 'text-slate-500',
                            )}>
                              {dueStatus === 'overdue' && <AlertCircle className="h-3 w-3" />}
                              {dueStatus === 'near' && <AlertTriangle className="h-3 w-3" />}
                              {!dueStatus && <Clock className="h-3 w-3" />}
                              {row.dueAt ? formatDate(row.dueAt) : formatDate(row.startedAt)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Button asChild size="sm" variant="outline" className="h-8 gap-1 border-slate-200 hover:bg-slate-50">
                              <Link href={`/dashboard/workflow/instances/${row.id}`}>
                                Xem <ChevronRight className="h-3.5 w-3.5" />
                              </Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4">
                  <p className="text-sm text-slate-500">
                    Trang {page} / {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline" size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      Trước
                    </Button>
                    <Button
                      variant="outline" size="sm"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                    >
                      Sau
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
