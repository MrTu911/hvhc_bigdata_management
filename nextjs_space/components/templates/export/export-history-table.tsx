'use client';

import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Download, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

interface ExportJobRow {
  id: string;
  template: { name: string; code: string } | null;
  entityType: string;
  outputFormat: string;
  status: string;
  progress: number;
  successCount: number;
  failCount: number;
  signedUrl?: string;
  urlExpiresAt?: string;
  createdAt: string;
  completedAt?: string;
}

interface ExportHistoryTableProps {
  templateId?: string;
}

const STATUS_BADGE: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
  PENDING:    { label: 'Chờ',        variant: 'secondary' },
  PROCESSING: { label: 'Đang chạy', variant: 'default' },
  COMPLETED:  { label: 'Xong',      variant: 'default' },
  FAILED:     { label: 'Lỗi',       variant: 'destructive' },
  PARTIAL:    { label: 'Một phần',  variant: 'secondary' },
};

export function ExportHistoryTable({ templateId }: ExportHistoryTableProps) {
  const [jobs, setJobs] = useState<ExportJobRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (status !== 'all') params.set('status', status);
      if (templateId) params.set('templateId', templateId);
      const res = await fetch(`/api/templates/export/jobs?${params}`);
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Lỗi tải danh sách');
      setJobs(json.data);
      setTotal(json.pagination.total);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Lỗi tải danh sách export jobs');
    } finally {
      setLoading(false);
    }
  }, [page, status, templateId]);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  async function handleRetry(jobId: string) {
    try {
      const res = await fetch(`/api/templates/export/jobs/${jobId}/retry`, { method: 'POST' });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Lỗi retry');
      toast.success('Đã thêm vào hàng chờ lại');
      fetchJobs();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Lỗi retry');
    }
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            {Object.entries(STATUS_BADGE).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button size="sm" variant="ghost" onClick={fetchJobs}>
          <RefreshCw className="h-4 w-4 mr-1" />
          Làm mới
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Template</TableHead>
              <TableHead>Loại / Format</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="text-right">Kết quả</TableHead>
              <TableHead>Thời gian</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : jobs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  Chưa có lịch sử export
                </TableCell>
              </TableRow>
            ) : (
              jobs.map((job) => {
                const badge = STATUS_BADGE[job.status] ?? { label: job.status, variant: 'secondary' as const };
                const urlExpired = job.urlExpiresAt ? new Date(job.urlExpiresAt) < new Date() : true;
                return (
                  <TableRow key={job.id}>
                    <TableCell className="font-medium">
                      {job.template?.name ?? '(đã xóa)'}
                      <span className="block text-xs text-muted-foreground">{job.template?.code}</span>
                    </TableCell>
                    <TableCell>
                      <span className="block text-sm">{job.entityType}</span>
                      <span className="text-xs text-muted-foreground">{job.outputFormat}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={badge.variant}>{badge.label}</Badge>
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      <span className="text-green-600">{job.successCount}</span>
                      {job.failCount > 0 && (
                        <span className="text-red-500 ml-1">/ {job.failCount} lỗi</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(job.createdAt).toLocaleString('vi-VN')}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 justify-end">
                        {job.status === 'COMPLETED' && job.signedUrl && !urlExpired && (
                          <Button size="sm" variant="ghost" asChild>
                            <a href={job.signedUrl} target="_blank" rel="noopener noreferrer">
                              <Download className="h-3 w-3" />
                            </a>
                          </Button>
                        )}
                        {job.status === 'FAILED' && (
                          <Button size="sm" variant="ghost" onClick={() => handleRetry(job.id)}>
                            <RotateCcw className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Tổng: {total}</span>
          <div className="flex gap-1">
            <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
              Trước
            </Button>
            <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
              Sau
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
