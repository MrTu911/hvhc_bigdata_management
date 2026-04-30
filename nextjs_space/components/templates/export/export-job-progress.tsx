'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, Loader2, Download } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ExportJob {
  jobId: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'PARTIAL';
  progress: number;
  successCount: number;
  failCount: number;
  downloadUrl?: string;
}

interface ExportJobProgressProps {
  jobId: string;
  pollIntervalMs?: number;
  onComplete?: (job: ExportJob) => void;
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Đang xếp hàng',
  PROCESSING: 'Đang xử lý',
  COMPLETED: 'Hoàn thành',
  FAILED: 'Thất bại',
  PARTIAL: 'Một phần',
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'secondary',
  PROCESSING: 'default',
  COMPLETED: 'default',
  FAILED: 'destructive',
  PARTIAL: 'secondary',
};

export function ExportJobProgress({
  jobId,
  pollIntervalMs = 2000,
  onComplete,
}: ExportJobProgressProps) {
  const [job, setJob] = useState<ExportJob | null>(null);

  useEffect(() => {
    if (!jobId) return;

    let stopped = false;

    async function poll() {
      try {
        const res = await fetch(`/api/templates/export/jobs/${jobId}`);
        const json = await res.json();
        if (!res.ok || !json.success) return;
        const data: ExportJob = {
          jobId: json.data.jobId,
          status: json.data.status,
          progress: json.data.progress,
          successCount: json.data.successCount,
          failCount: json.data.failCount,
          downloadUrl: json.data.downloadUrl,
        };
        setJob(data);
        if (data.status === 'COMPLETED' || data.status === 'FAILED') {
          stopped = true;
          onComplete?.(data);
        }
      } catch {
        // polling error — tiếp tục thử
      }
    }

    poll();
    const timer = setInterval(() => {
      if (stopped) {
        clearInterval(timer);
        return;
      }
      poll();
    }, pollIntervalMs);

    return () => {
      stopped = true;
      clearInterval(timer);
    };
  }, [jobId, pollIntervalMs, onComplete]);

  if (!job) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Đang tải trạng thái...
      </div>
    );
  }

  const isDone = job.status === 'COMPLETED' || job.status === 'FAILED';

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {job.status === 'COMPLETED' && <CheckCircle2 className="h-4 w-4 text-green-500" />}
          {job.status === 'FAILED' && <XCircle className="h-4 w-4 text-red-500" />}
          {!isDone && <Loader2 className="h-4 w-4 animate-spin text-blue-500" />}
          <Badge variant={STATUS_COLORS[job.status] as never}>{STATUS_LABELS[job.status]}</Badge>
        </div>
        <span className="text-sm text-muted-foreground">{job.progress}%</span>
      </div>

      <Progress value={job.progress} className="h-2" />

      {isDone && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Thành công: {job.successCount} · Lỗi: {job.failCount}
          </span>
          {job.downloadUrl && job.status === 'COMPLETED' && (
            <Button size="sm" variant="outline" asChild>
              <a href={job.downloadUrl} target="_blank" rel="noopener noreferrer">
                <Download className="h-3 w-3 mr-1" />
                Tải xuống
              </a>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
