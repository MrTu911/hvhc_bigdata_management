'use client';

/**
 * M13 – Task Inbox Table
 * Danh sách việc đang chờ người dùng xử lý.
 * Hiển thị: tiêu đề quy trình, bước hiện tại, hạn xử lý, mức ưu tiên, link.
 */

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { cn } from '@/lib/utils';
import { Clock, AlertCircle, AlertTriangle, ChevronRight, Inbox } from 'lucide-react';
import Link from 'next/link';

export interface PendingTask {
  workflowInstanceId: string;
  instanceTitle: string;
  entityType: string;
  stepCode: string;
  assignedAt: string | null;
  dueAt: string | null;
  priority: number;
}

interface WorkflowTaskInboxProps {
  tasks: PendingTask[];
  loading: boolean;
}

const PRIORITY_META: Record<number, { label: string; dot: string; badge: string }> = {
  3: { label: 'Khẩn cấp', dot: 'bg-red-500', badge: 'bg-red-50 text-red-700 border-red-200' },
  2: { label: 'Cao', dot: 'bg-amber-500', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
  1: { label: 'Trung bình', dot: 'bg-blue-500', badge: 'bg-blue-50 text-blue-700 border-blue-200' },
  0: { label: 'Bình thường', dot: 'bg-slate-400', badge: 'bg-slate-50 text-slate-600 border-slate-200' },
};

function getDueStatus(dueAt: string | null): 'overdue' | 'near' | 'normal' | null {
  if (!dueAt) return null;
  const now = Date.now();
  const due = new Date(dueAt).getTime();
  if (due < now) return 'overdue';
  if (due - now < 24 * 60 * 60 * 1000) return 'near';
  return 'normal';
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function DueBadge({ dueAt }: { dueAt: string | null }) {
  const status = getDueStatus(dueAt);
  if (!dueAt) return <span className="text-slate-400 text-sm">—</span>;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 text-sm font-medium',
        status === 'overdue' && 'text-red-600',
        status === 'near' && 'text-amber-600',
        status === 'normal' && 'text-slate-500',
      )}
    >
      {status === 'overdue' && <AlertCircle className="h-3.5 w-3.5" />}
      {status === 'near' && <AlertTriangle className="h-3.5 w-3.5" />}
      {status === 'normal' && <Clock className="h-3.5 w-3.5" />}
      {formatDate(dueAt)}
    </span>
  );
}

export function WorkflowTaskInbox({ tasks, loading }: WorkflowTaskInboxProps) {
  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <EmptyState
        icon={<Inbox className="h-8 w-8 text-muted-foreground" />}
        title="Không có việc cần xử lý"
        description="Tuyệt vời! Hiện tại bạn không có bước nào đang chờ xử lý."
        className="py-10"
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-100">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent border-slate-200 bg-slate-50/70">
            <TableHead className="w-[42%] text-xs font-semibold uppercase tracking-wide text-slate-500">Quy trình</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wide text-slate-500">Bước hiện tại</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wide text-slate-500">Hạn xử lý</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wide text-slate-500">Ưu tiên</TableHead>
            <TableHead className="w-[110px]" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map((task) => {
            const priority = PRIORITY_META[task.priority] ?? PRIORITY_META[0];
            const dueStatus = getDueStatus(task.dueAt);
            return (
              <TableRow
                key={`${task.workflowInstanceId}-${task.stepCode}`}
                className={cn(
                  'border-slate-100 transition-colors',
                  dueStatus === 'overdue' && 'bg-red-50/40 hover:bg-red-50/70',
                  dueStatus === 'near' && 'bg-amber-50/40 hover:bg-amber-50/70',
                )}
              >
                <TableCell>
                  <div className="flex items-start gap-2.5">
                    <span
                      className={cn('mt-1.5 h-2 w-2 rounded-full shrink-0', priority.dot)}
                      title={priority.label}
                    />
                    <div className="min-w-0">
                      <div className="font-medium text-sm leading-snug text-slate-800">{task.instanceTitle}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{task.entityType}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <code className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">
                    {task.stepCode}
                  </code>
                </TableCell>
                <TableCell>
                  <DueBadge dueAt={task.dueAt} />
                </TableCell>
                <TableCell>
                  <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border', priority.badge)}>
                    {priority.label}
                  </span>
                </TableCell>
                <TableCell>
                  <Button asChild size="sm" variant="outline" className="h-8 gap-1 border-slate-200 hover:bg-slate-50">
                    <Link href={`/dashboard/workflow/instances/${task.workflowInstanceId}`}>
                      Xử lý <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
