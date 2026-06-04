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
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import {
  AlertTriangle, Search, ChevronLeft, ChevronRight,
  ExternalLink, Clock,
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

export default function WorkflowHistoryPage() {
  const [escalations, setEscalations] = useState<EscalationItem[]>([]);
  const [meta, setMeta]               = useState<Meta>({ total: 0, page: 1, totalPages: 1 });
  const [loading, setLoading]         = useState(false);
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
        // Fallback: thử trực tiếp WorkflowEscalation qua workflow API
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

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <AlertTriangle className="h-6 w-6 text-amber-500" />
        <div>
          <h1 className="text-xl font-bold">Lịch sử leo thang quy trình</h1>
          <p className="text-sm text-muted-foreground">
            Các bước workflow đã quá hạn và được leo thang bởi hệ thống
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Tìm theo tên quy trình, bước..."
              value={keyword}
              onChange={e => { setKeyword(e.target.value); setPage(1); }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            Danh sách leo thang ({meta.total} bản ghi)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-16 text-muted-foreground">Đang tải...</div>
          ) : escalations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
              <AlertTriangle className="h-10 w-10 opacity-30" />
              <p>Không có bản ghi leo thang</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Quy trình</TableHead>
                  <TableHead>Bước</TableHead>
                  <TableHead>Trạng thái QT</TableHead>
                  <TableHead>Lý do leo thang</TableHead>
                  <TableHead>Thời gian</TableHead>
                  <TableHead className="text-right">Chi tiết</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {escalations.map((esc) => (
                  <TableRow key={esc.id}>
                    <TableCell>
                      <div className="font-medium max-w-48 truncate">
                        {esc.workflowInstance?.title ?? esc.workflowInstanceId}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {esc.workflowInstance?.entityType}
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-1 py-0.5 rounded">
                        {esc.stepInstance?.stepCode ?? esc.stepInstanceId}
                      </code>
                    </TableCell>
                    <TableCell>
                      {esc.workflowInstance?.status && (
                        <Badge variant="outline">
                          {INSTANCE_STATUS_LABEL[esc.workflowInstance.status] ?? esc.workflowInstance.status}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm max-w-64">
                      <p className="line-clamp-2">{esc.reason}</p>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatDate(esc.createdAt)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/dashboard/workflow/instances/${esc.workflowInstanceId}`}>
                        <Button variant="ghost" size="sm">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {meta.totalPages > 1 && (
        <div className="flex justify-center items-center gap-3">
          <Button variant="outline" size="sm" disabled={page <= 1}
            onClick={() => setPage(p => p - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">
            Trang {meta.page} / {meta.totalPages}
          </span>
          <Button variant="outline" size="sm" disabled={page >= meta.totalPages}
            onClick={() => setPage(p => p + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
