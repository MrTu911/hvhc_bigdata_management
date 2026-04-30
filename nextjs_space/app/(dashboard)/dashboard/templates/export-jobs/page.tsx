'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Download,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Eye,
  RotateCcw,
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';

interface ExportJob {
  id: string;
  templateId: string;
  template?: { name: string; code: string };
  entityType: string;
  outputFormat: string;
  status: string;
  progress: number;
  successCount: number;
  failCount: number;
  errors?: { entityId: string; reason: string }[];
  signedUrl?: string;
  urlExpiresAt?: string;
  requestedBy: string;
  createdAt: string;
  completedAt?: string;
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Chờ xử lý',
  PROCESSING: 'Đang xử lý',
  DONE: 'Hoàn thành',
  FAILED: 'Thất bại',
  PARTIAL: 'Một phần',
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  PROCESSING: 'bg-blue-100 text-blue-700 border-blue-200',
  DONE: 'bg-green-100 text-green-700 border-green-200',
  FAILED: 'bg-red-100 text-red-700 border-red-200',
  PARTIAL: 'bg-orange-100 text-orange-700 border-orange-200',
};

const FORMAT_COLORS: Record<string, string> = {
  PDF: 'bg-red-100 text-red-700',
  DOCX: 'bg-blue-100 text-blue-700',
  XLSX: 'bg-green-100 text-green-700',
};

function ExportJobsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateIdParam = searchParams.get('templateId') || '';

  const [jobs, setJobs] = useState<ExportJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [total, setTotal] = useState(0);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterTemplateId] = useState(templateIdParam);

  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<ExportJob | null>(null);
  const [retrying, setRetrying] = useState(false);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (filterStatus) params.set('status', filterStatus);
      if (filterTemplateId) params.set('templateId', filterTemplateId);

      const res = await fetch(`/api/templates/export/jobs?${params}`);
      if (!res.ok) throw new Error('Lỗi tải lịch sử xuất file');
      const json = await res.json();
      setJobs(json.data || []);
      setTotal(json.pagination?.total || 0);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Lỗi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  }, [page, limit, filterStatus, filterTemplateId]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // Auto-refresh for in-progress jobs
  useEffect(() => {
    const hasActive = jobs.some(j => j.status === 'PENDING' || j.status === 'PROCESSING');
    if (!hasActive) return;
    const timer = setInterval(fetchJobs, 3000);
    return () => clearInterval(timer);
  }, [jobs, fetchJobs]);

  const handleRetry = async (jobId: string) => {
    setRetrying(true);
    try {
      const res = await fetch(`/api/templates/export/jobs/${jobId}/retry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ retryFailedOnly: true }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Lỗi retry');
      toast.success(`Đã tạo job retry mới (ID: ${json.data?.retryJobId})`);
      fetchJobs();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Lỗi retry');
    } finally {
      setRetrying(false);
    }
  };

  const totalPages = Math.ceil(total / limit);

  const formatDuration = (start: string, end?: string) => {
    if (!end) return '–';
    const ms = new Date(end).getTime() - new Date(start).getTime();
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/templates')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">Lịch sử xuất file</h1>
            <p className="text-sm text-gray-500">
              {filterTemplateId ? 'Lọc theo template đã chọn' : 'Tất cả các lần xuất file'}
            </p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={fetchJobs}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {Object.entries(STATUS_LABELS).map(([status, label]) => {
          const count = jobs.filter(j => j.status === status).length;
          return (
            <Card key={status} className="p-3">
              <p className="text-xs text-gray-500">{label}</p>
              <p className={`text-xl font-bold mt-1 ${count > 0 && status === 'FAILED' ? 'text-red-600' : ''}`}>
                {count}
              </p>
            </Card>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <Select value={filterStatus} onValueChange={v => { setFilterStatus(v === 'ALL' ? '' : v); setPage(1); }}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
            {Object.entries(STATUS_LABELS).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mẫu biểu</TableHead>
                  <TableHead>Loại / Định dạng</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Tiến độ</TableHead>
                  <TableHead>Kết quả</TableHead>
                  <TableHead>Thời gian</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10 text-gray-400">
                      Chưa có lịch sử xuất file
                    </TableCell>
                  </TableRow>
                ) : (
                  jobs.map(job => (
                    <TableRow key={job.id}>
                      <TableCell>
                        <div>
                          <p className="text-sm font-medium">{job.template?.name || '–'}</p>
                          <p className="text-xs text-gray-400 font-mono">{job.template?.code || job.templateId.slice(0, 8)}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="text-xs capitalize">{job.entityType}</p>
                          <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${FORMAT_COLORS[job.outputFormat] || 'bg-gray-100 text-gray-700'}`}>
                            {job.outputFormat}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${STATUS_COLORS[job.status] || ''} border`}>
                          {STATUS_LABELS[job.status] || job.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {(job.status === 'PROCESSING' || job.status === 'PENDING') ? (
                          <div className="w-24">
                            <Progress value={job.progress} className="h-2" />
                            <p className="text-xs text-gray-400 mt-1">{job.progress}%</p>
                          </div>
                        ) : job.status === 'DONE' ? (
                          <span className="text-xs text-green-600">100%</span>
                        ) : (
                          <span className="text-xs text-gray-400">–</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-xs">
                          {job.successCount > 0 && (
                            <span className="text-green-600">{job.successCount} ✓</span>
                          )}
                          {job.failCount > 0 && (
                            <span className="text-red-600 ml-1">{job.failCount} ✗</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs text-gray-500">
                          <p>{new Date(job.createdAt).toLocaleString('vi-VN')}</p>
                          {job.completedAt && (
                            <p className="text-gray-400">
                              ({formatDuration(job.createdAt, job.completedAt)})
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => { setSelectedJob(job); setDetailOpen(true); }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {job.signedUrl && job.urlExpiresAt && new Date(job.urlExpiresAt) > new Date() ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={() => window.open(job.signedUrl!, '_blank')}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          ) : null}
                          {(job.status === 'FAILED' || job.status === 'PARTIAL') && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-orange-600"
                              onClick={() => handleRetry(job.id)}
                              disabled={retrying}
                            >
                              <RotateCcw className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {total > limit && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Hiển thị {(page - 1) * limit + 1}–{Math.min(page * limit, total)} / {total} jobs
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm px-3 py-1 border rounded">{page} / {totalPages}</span>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Job Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Chi tiết Export Job</DialogTitle>
          </DialogHeader>
          {selectedJob && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-gray-500">Mẫu biểu</p>
                  <p className="font-medium">{selectedJob.template?.name || selectedJob.templateId}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Trạng thái</p>
                  <Badge className={`${STATUS_COLORS[selectedJob.status] || ''} border mt-1`}>
                    {STATUS_LABELS[selectedJob.status] || selectedJob.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Loại entity</p>
                  <p className="capitalize">{selectedJob.entityType}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Định dạng</p>
                  <p>{selectedJob.outputFormat}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Thành công</p>
                  <p className="text-green-600 font-medium">{selectedJob.successCount}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Thất bại</p>
                  <p className="text-red-600 font-medium">{selectedJob.failCount}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Bắt đầu</p>
                  <p>{new Date(selectedJob.createdAt).toLocaleString('vi-VN')}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Hoàn thành</p>
                  <p>{selectedJob.completedAt ? new Date(selectedJob.completedAt).toLocaleString('vi-VN') : '–'}</p>
                </div>
              </div>

              {selectedJob.errors && selectedJob.errors.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Lỗi chi tiết</p>
                  <div className="max-h-40 overflow-y-auto border rounded p-2 space-y-1">
                    {selectedJob.errors.map((e, i) => (
                      <div key={i} className="text-xs">
                        <span className="font-mono text-gray-600">{e.entityId}</span>
                        <span className="text-red-600 ml-2">{e.reason}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedJob.signedUrl && selectedJob.urlExpiresAt && new Date(selectedJob.urlExpiresAt) > new Date() ? (
                <Button className="w-full" onClick={() => window.open(selectedJob.signedUrl!, '_blank')}>
                  <Download className="h-4 w-4 mr-2" />Download file
                </Button>
              ) : selectedJob.status === 'DONE' ? (
                <p className="text-xs text-center text-gray-400">Link tải đã hết hạn (TTL 24h)</p>
              ) : null}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function ExportJobsPage() {
  return (
    <Suspense fallback={<div className="p-6"><Skeleton className="h-64 w-full" /></div>}>
      <ExportJobsContent />
    </Suspense>
  );
}
