'use client';

/**
 * Workflow Escalation History
 * /dashboard/workflow/history
 *
 * Xem danh sách WorkflowEscalation: step nào đã quá hạn, đã leo thang chưa.
 * Link sang /workflow/instances/[id] để xem chi tiết instance.
 */

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { ModuleHero } from '@/components/ui/enhanced-data-card';
import { toast } from 'sonner';
import {
  AlertTriangle, Search, ChevronLeft, ChevronRight,
  Clock, History, RefreshCw,
} from 'lucide-react';

interface EscalationItem {
  id: string;
  workflowInstanceId: string;
  stepInstanceId: string;
  escalatedBy: string;
  reason: string;
  createdAt: string;
  workflowInstance?: {
    title: string;
    status: string;
    entityType: string;
    entityId: string;
  };
  stepInstance?: {
    stepCode: string;
    status: string;
    assigneeId?: string;
  };
}

interface Meta { total: number; page: number; totalPages: number }

const INSTANCE_STATUS_LABEL: Record<string, string> = {
  DRAFT: 'Nháp',
  PENDING: 'Chờ xử lý',
  IN_PROGRESS: 'Đang xử lý',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Từ chối',
  CANCELLED: 'Đã hủy',
  COMPLETED: 'Hoàn tất',
};

const INSTANCE_STATUS_BADGE: Record<string, string> = {
  DRAFT: 'bg-slate-50 text-slate-600 border-slate-200',
  PENDING: 'bg-blue-50 text-blue-700 border-blue-200',
  IN_PROGRESS: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  APPROVED: 'bg-green-50 text-green-700 border-green-200',
  REJECTED: 'bg-red-50 text-red-700 border-red-200',
  CANCELLED: 'bg-slate-50 text-slate-500 border-slate-200',
  COMPLETED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

export default function WorkflowHistoryPage() {
  const [escalations, setEscalations] = useState<EscalationItem[]>([]);
  const [meta, setMeta]               = useState<Meta>({ total: 0, page: 1, totalPages: 1 });
  const [loading, setLoading]         = useState(false);
  const [refreshing, setRefreshing]   = useState(false);
  const [keyword, setKeyword]         = useState('');
  const [page, setPage]               = useState(1);

  const fetchEscalations = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (keyword.trim()) params.set('keyword', keyword.trim());

      // Sử dụng workflow-dashboard endpoint để lấy escalation history
      const res = await fetch(`/api/workflow-dashboard/escalations?${params}`);
      if (!res.ok) {
        toast.error('Không thể tải lịch sử leo thang');
        return;
      }
      const data = await res.json();
      if (data.success) {
        setEscalations(data.data ?? []);
        if (data.meta) setMeta(data.meta);
      }
    } catch {
      toast.error('Không thể tải lịch sử leo thang');
    } finally {
      setLoading(false);
    }
  }, [page, keyword]);

  useEffect(() => { fetchEscalations(); }, [fetchEscalations]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchEscalations();
    setRefreshing(false);
  }, [fetchEscalations]);

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }

  return (
    <div className="space-y-6">
      {/* ── Module Hero ──────────────────────────────────────────────────────── */}
      <ModuleHero
        moduleId="workflow"
        title="Lịch sử leo thang quy trình"
        subtitle="Các bước workflow đã quá hạn và được leo thang bởi hệ thống"
        icon={History}
        stats={[{ label: 'Bản ghi leo thang', value: meta.total }]}
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
        <div className="relative flex-1 min-w-48 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            className="pl-9 bg-white"
            placeholder="Tìm theo tên quy trình, bước..."
            value={keyword}
            onChange={e => { setKeyword(e.target.value); setPage(1); }}
          />
        </div>
      </div>

      {/* ── Table ────────────────────────────────────────────────────────────── */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-3 border-b border-slate-100">
          <CardTitle className="text-base text-slate-700 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            Danh sách leo thang ({meta.total} bản ghi)
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-lg" />
              ))}
            </div>
          ) : escalations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-slate-400 gap-2">
              <div className="rounded-full bg-slate-100 p-3 mb-1">
                <AlertTriangle className="h-7 w-7 text-slate-300" />
              </div>
              <p className="text-sm">Không có bản ghi leo thang</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-slate-100">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-slate-200 bg-slate-50/70">
                    <TableHead className="text-xs font-semibold uppercase tracking-wide text-slate-500">Quy trình</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wide text-slate-500">Bước</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wide text-slate-500">Trạng thái QT</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wide text-slate-500">Lý do leo thang</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wide text-slate-500">Thời gian</TableHead>
                    <TableHead className="w-[90px] text-right" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {escalations.map((esc) => (
                    <TableRow key={esc.id} className="border-slate-100 hover:bg-amber-50/40 transition-colors">
                      <TableCell>
                        <div className="flex items-start gap-2.5">
                          <span className="mt-1.5 h-2 w-2 rounded-full bg-amber-500 shrink-0" />
                          <div className="min-w-0">
                            <div className="font-medium text-sm text-slate-800 max-w-48 truncate">
                              {esc.workflowInstance?.title ?? esc.workflowInstanceId}
                            </div>
                            <div className="text-xs text-slate-400 mt-0.5">
                              {esc.workflowInstance?.entityType}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">
                          {esc.stepInstance?.stepCode ?? esc.stepInstanceId}
                        </code>
                      </TableCell>
                      <TableCell>
                        {esc.workflowInstance?.status && (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${INSTANCE_STATUS_BADGE[esc.workflowInstance.status] || 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                            {INSTANCE_STATUS_LABEL[esc.workflowInstance.status] ?? esc.workflowInstance.status}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm max-w-64">
                        <p className="line-clamp-2 text-slate-600">{esc.reason}</p>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                          <Clock className="h-3.5 w-3.5" />
                          {formatDate(esc.createdAt)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button asChild variant="outline" size="sm" className="h-8 gap-1 border-slate-200 hover:bg-slate-50">
                          <Link href={`/dashboard/workflow/instances/${esc.workflowInstanceId}`}>
                            Xem <ChevronRight className="h-3.5 w-3.5" />
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {meta.totalPages > 1 && (
            <div className="flex justify-center items-center gap-3 pt-4">
              <Button variant="outline" size="sm" disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-slate-500">
                Trang {meta.page} / {meta.totalPages}
              </span>
              <Button variant="outline" size="sm" disabled={page >= meta.totalPages}
                onClick={() => setPage(p => p + 1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
