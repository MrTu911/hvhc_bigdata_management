'use client';

/**
 * M13 – Workflow Instance Detail Page
 * Route: /dashboard/workflow/instances/[id]
 *
 * Layout:
 *  - Header: tiêu đề, badge trạng thái, meta info (entity, initiator, ngày)
 *  - Trái (2/3):
 *    - Step Timeline (các bước đã/đang xử lý)
 *    - Action History (lịch sử hành động)
 *  - Phải (1/3):
 *    - Action Panel (phê duyệt / từ chối / trả lại / hủy)
 */

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/components/ui/use-toast';
import {
  ArrowLeft,
  RefreshCw,
  ClipboardList,
  GitBranch,
  History,
} from 'lucide-react';
import Link from 'next/link';

import {
  WorkflowStepTimeline,
  type StepInstance,
} from '@/components/workflow/WorkflowStepTimeline';
import {
  WorkflowActionHistory,
  type ActionRecord,
} from '@/components/workflow/WorkflowActionHistory';
import { WorkflowActionPanel } from '@/components/workflow/WorkflowActionPanel';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface WorkflowInstanceDetail {
  id: string;
  title: string;
  summary: string | null;
  entityType: string;
  entityId: string;
  status: string;
  currentStepCode: string | null;
  initiatorId: string;
  currentAssigneeId: string | null;
  priority: number;
  startedAt: string;
  dueAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  steps: StepInstance[];
}

// ---------------------------------------------------------------------------
// Status display config
// ---------------------------------------------------------------------------

const INSTANCE_STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  PENDING:     { label: 'Chờ xử lý',  variant: 'secondary' },
  IN_PROGRESS: { label: 'Đang xử lý', variant: 'default' },
  APPROVED:    { label: 'Đã duyệt',   variant: 'default' },
  REJECTED:    { label: 'Từ chối',    variant: 'destructive' },
  RETURNED:    { label: 'Trả lại',    variant: 'outline' },
  CANCELLED:   { label: 'Đã hủy',     variant: 'outline' },
  EXPIRED:     { label: 'Hết hạn',    variant: 'destructive' },
  FAILED:      { label: 'Lỗi',        variant: 'destructive' },
};

const PRIORITY_LABELS: Record<number, string> = {
  3: 'Khẩn cấp',
  2: 'Cao',
  1: 'Trung bình',
  0: 'Bình thường',
};

const TERMINAL_STATUSES = new Set(['APPROVED', 'REJECTED', 'CANCELLED', 'EXPIRED', 'FAILED']);

function formatDateTime(dateStr: string | null): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function WorkflowInstanceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const instanceId = params.id as string;

  const [instance, setInstance] = useState<WorkflowInstanceDetail | null>(null);
  const [history, setHistory] = useState<ActionRecord[]>([]);
  const [loadingInstance, setLoadingInstance] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const fetchInstance = useCallback(async () => {
    try {
      const res = await fetch(`/api/workflows/${instanceId}`);
      if (res.status === 404) {
        setNotFound(true);
        return;
      }
      if (!res.ok) throw new Error();
      const json = await res.json();
      if (json.success) setInstance(json.data);
    } catch {
      toast({ title: 'Không thể tải thông tin quy trình', variant: 'destructive' });
    } finally {
      setLoadingInstance(false);
    }
  }, [instanceId]);

  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch(`/api/workflows/${instanceId}/history`);
      if (!res.ok) return;
      const json = await res.json();
      if (json.success) setHistory(json.data);
    } catch {
      // history không block giao diện chính
    } finally {
      setLoadingHistory(false);
    }
  }, [instanceId]);

  useEffect(() => {
    fetchInstance();
    fetchHistory();
  }, [fetchInstance, fetchHistory]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchInstance(), fetchHistory()]);
    setRefreshing(false);
  }, [fetchInstance, fetchHistory]);

  const handleActionSuccess = useCallback(async () => {
    toast({ title: 'Hành động đã được ghi nhận' });
    await Promise.all([fetchInstance(), fetchHistory()]);
  }, [fetchInstance, fetchHistory]);

  // ---------------------------------------------------------------------------
  // Render states
  // ---------------------------------------------------------------------------

  if (notFound) {
    return (
      <div className="p-6 text-center space-y-3">
        <p className="text-muted-foreground">Không tìm thấy quy trình này.</p>
        <Button variant="outline" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Quay lại
        </Button>
      </div>
    );
  }

  const currentUserId = (session?.user as { id?: string } | undefined)?.id ?? null;
  const isAssignee = !!currentUserId && instance?.currentAssigneeId === currentUserId;
  const isInitiator = !!currentUserId && instance?.initiatorId === currentUserId;
  const isTerminal = instance ? TERMINAL_STATUSES.has(instance.status) : false;
  const statusCfg = instance ? (INSTANCE_STATUS_CONFIG[instance.status] ?? { label: instance.status, variant: 'secondary' as const }) : null;

  return (
    <div className="space-y-6 p-6">
      {/* Page Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="mt-0.5 h-8 w-8 p-0"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            {loadingInstance ? (
              <Skeleton className="h-7 w-64" />
            ) : (
              <h1 className="text-xl font-bold tracking-tight leading-snug">
                {instance?.title ?? 'Chi tiết quy trình'}
              </h1>
            )}
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {loadingInstance ? (
                <Skeleton className="h-5 w-24" />
              ) : statusCfg ? (
                <Badge variant={statusCfg.variant} className="text-xs">
                  {statusCfg.label}
                </Badge>
              ) : null}
              {instance && (
                <span className="text-xs text-muted-foreground">
                  {PRIORITY_LABELS[instance.priority] ?? 'Bình thường'}
                </span>
              )}
            </div>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
          className="gap-1.5 flex-shrink-0"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Làm mới
        </Button>
      </div>

      {/* Meta info strip */}
      {!loadingInstance && instance && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 rounded-lg border bg-muted/30 px-4 py-3 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Loại đối tượng</p>
            <p className="font-medium">{instance.entityType}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Bước hiện tại</p>
            <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
              {instance.currentStepCode ?? '—'}
            </code>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Ngày bắt đầu</p>
            <p>{formatDateTime(instance.startedAt)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">
              {instance.completedAt ? 'Ngày kết thúc' : instance.dueAt ? 'Hạn hoàn thành' : 'Trạng thái'}
            </p>
            <p>{formatDateTime(instance.completedAt ?? instance.dueAt)}</p>
          </div>
        </div>
      )}
      {loadingInstance && <Skeleton className="h-16 rounded-lg" />}

      {/* Summary */}
      {instance?.summary && (
        <p className="text-sm text-muted-foreground bg-muted/30 rounded-lg px-4 py-2.5 border">
          {instance.summary}
        </p>
      )}

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left: Timeline + History */}
        <div className="lg:col-span-2 space-y-6">

          {/* Step Timeline */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <GitBranch className="h-4 w-4" />
                Các bước xử lý
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {loadingInstance ? (
                <div className="space-y-4 ml-6">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-14 w-full" />
                  ))}
                </div>
              ) : (
                <WorkflowStepTimeline
                  steps={instance?.steps ?? []}
                  currentStepCode={instance?.currentStepCode ?? null}
                />
              )}
            </CardContent>
          </Card>

          {/* Action History */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <History className="h-4 w-4" />
                Lịch sử hành động
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <WorkflowActionHistory actions={history} loading={loadingHistory} />
            </CardContent>
          </Card>
        </div>

        {/* Right: Action Panel */}
        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <ClipboardList className="h-4 w-4" />
                Xử lý quy trình
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {loadingInstance ? (
                <div className="space-y-3">
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-9 w-full" />
                </div>
              ) : (
                <WorkflowActionPanel
                  workflowInstanceId={instanceId}
                  isAssignee={isAssignee}
                  isInitiator={isInitiator}
                  isTerminal={isTerminal}
                  onActionSuccess={handleActionSuccess}
                />
              )}

              {instance && (
                <>
                  <Separator className="my-4" />
                  <div className="space-y-1.5 text-xs text-muted-foreground">
                    <p>
                      <span className="font-medium">Entity ID:</span>{' '}
                      <code className="bg-muted px-1 rounded">{instance.entityId}</code>
                    </p>
                    <p>
                      <span className="font-medium">Instance ID:</span>{' '}
                      <code className="bg-muted px-1 rounded">{instance.id.slice(0, 12)}…</code>
                    </p>
                    <p>
                      <span className="font-medium">Người khởi tạo:</span>{' '}
                      <code className="bg-muted px-1 rounded">{instance.initiatorId.slice(0, 8)}…</code>
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
