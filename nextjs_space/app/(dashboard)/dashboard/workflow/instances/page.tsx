'use client';

/**
 * M13 – Workflow Instances List (Manager/Monitor view)
 * Route: /dashboard/workflow/instances
 *
 * Dành cho quản lý: xem tất cả workflow instances trong phạm vi đơn vị mình.
 * Filter theo: status, template, entity type, assignee, date range.
 * Bulk action: không (Phase 2 chỉ view + navigate to detail).
 */

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/use-toast';
import { EmptyState } from '@/components/ui/empty-state';
import { cn } from '@/lib/utils';
import {
  RefreshCw,
  Search,
  ExternalLink,
  Clock,
  AlertCircle,
  Layers,
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
  PENDING:     { label: 'Chờ xử lý',  className: 'bg-blue-100 text-blue-700' },
  IN_PROGRESS: { label: 'Đang xử lý', className: 'bg-indigo-100 text-indigo-700' },
  APPROVED:    { label: 'Đã duyệt',   className: 'bg-green-100 text-green-700' },
  REJECTED:    { label: 'Từ chối',    className: 'bg-red-100 text-red-700' },
  RETURNED:    { label: 'Trả lại',    className: 'bg-amber-100 text-amber-700' },
  CANCELLED:   { label: 'Đã hủy',     className: 'bg-gray-100 text-gray-500' },
  EXPIRED:     { label: 'Hết hạn',    className: 'bg-orange-100 text-orange-700' },
  FAILED:      { label: 'Lỗi',        className: 'bg-red-100 text-red-700' },
};

const PRIORITY_LABELS: Record<number, { label: string; className: string }> = {
  3: { label: 'Khẩn cấp', className: 'text-red-600 font-semibold' },
  2: { label: 'Cao',      className: 'text-amber-600' },
  1: { label: 'TB',       className: 'text-blue-600' },
  0: { label: 'BT',       className: 'text-muted-foreground' },
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
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Layers className="h-6 w-6" />
            Danh sách quy trình
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Tất cả workflow instances trong phạm vi quản lý
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Làm mới
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4 pb-3">
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-48 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm theo tiêu đề quy trình..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); fetchInstances(true); }}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleSearch} size="sm">Tìm kiếm</Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            {data ? (
              <span>
                {data.total} quy trình
                {statusFilter !== 'ALL' && (
                  <span className="ml-1 text-muted-foreground font-normal text-sm">
                    — đang lọc: {STATUS_OPTIONS.find(o => o.value === statusFilter)?.label}
                  </span>
                )}
              </span>
            ) : 'Quy trình'}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : !data || data.items.length === 0 ? (
            <EmptyState
              title="Không có quy trình nào"
              description="Thử thay đổi bộ lọc hoặc tìm kiếm khác."
              className="py-10"
            />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[35%]">Tiêu đề</TableHead>
                    <TableHead>Loại đối tượng</TableHead>
                    <TableHead>Bước hiện tại</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Ưu tiên</TableHead>
                    <TableHead>Hạn / Ngày bắt đầu</TableHead>
                    <TableHead className="w-[60px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.items.map((row) => {
                    const statusCfg = STATUS_BADGE[row.status] ?? { label: row.status, className: 'bg-muted' };
                    const prio = PRIORITY_LABELS[row.priority] ?? PRIORITY_LABELS[0];
                    const dueStatus = getDueStatus(row.dueAt, row.completedAt);
                    return (
                      <TableRow
                        key={row.id}
                        className={cn(
                          dueStatus === 'overdue' && 'bg-red-50/40',
                          dueStatus === 'near' && 'bg-amber-50/40',
                        )}
                      >
                        <TableCell>
                          <div className="font-medium text-sm leading-snug line-clamp-2">
                            {row.title}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">{row.entityType}</span>
                        </TableCell>
                        <TableCell>
                          {row.currentStepCode ? (
                            <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                              {row.currentStepCode}
                            </code>
                          ) : '—'}
                        </TableCell>
                        <TableCell>
                          <Badge className={cn('text-xs font-normal', statusCfg.className)}>
                            {statusCfg.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className={cn('text-xs', prio.className)}>{prio.label}</span>
                        </TableCell>
                        <TableCell>
                          <span className={cn(
                            'flex items-center gap-1 text-xs',
                            dueStatus === 'overdue' && 'text-red-600',
                            dueStatus === 'near' && 'text-amber-600',
                            !dueStatus && 'text-muted-foreground',
                          )}>
                            {dueStatus === 'overdue' && <AlertCircle className="h-3 w-3" />}
                            {dueStatus === 'near' && <Clock className="h-3 w-3" />}
                            {row.dueAt ? formatDate(row.dueAt) : formatDate(row.startedAt)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Button asChild size="sm" variant="ghost" className="h-7 w-7 p-0">
                            <Link href={`/dashboard/workflow/instances/${row.id}`}>
                              <ExternalLink className="h-3.5 w-3.5" />
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Trang {page} / {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      Trước
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
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
