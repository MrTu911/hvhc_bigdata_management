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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { cn } from '@/lib/utils';
import { ExternalLink, Clock, AlertCircle, AlertTriangle } from 'lucide-react';
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

const PRIORITY_LABELS: Record<number, { label: string; className: string }> = {
  3: { label: 'Khẩn cấp', className: 'bg-red-100 text-red-700' },
  2: { label: 'Cao', className: 'bg-amber-100 text-amber-700' },
  1: { label: 'Trung bình', className: 'bg-blue-100 text-blue-700' },
  0: { label: 'Bình thường', className: 'bg-gray-100 text-gray-600' },
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
  if (!dueAt) return <span className="text-muted-foreground text-sm">—</span>;

  return (
    <span
      className={cn(
        'flex items-center gap-1 text-sm font-medium',
        status === 'overdue' && 'text-red-600',
        status === 'near' && 'text-amber-600',
        status === 'normal' && 'text-muted-foreground',
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
          <Skeleton key={i} className="h-12 w-full rounded" />
        ))}
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <EmptyState
        title="Không có việc cần xử lý"
        description="Hiện tại bạn không có bước nào đang chờ xử lý."
        className="py-8"
      />
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[40%]">Quy trình</TableHead>
          <TableHead>Bước hiện tại</TableHead>
          <TableHead>Hạn xử lý</TableHead>
          <TableHead>Mức ưu tiên</TableHead>
          <TableHead className="w-[80px]" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {tasks.map((task) => {
          const priority = PRIORITY_LABELS[task.priority] ?? PRIORITY_LABELS[0];
          return (
            <TableRow
              key={`${task.workflowInstanceId}-${task.stepCode}`}
              className={cn(
                getDueStatus(task.dueAt) === 'overdue' && 'bg-red-50/50',
                getDueStatus(task.dueAt) === 'near' && 'bg-amber-50/50',
              )}
            >
              <TableCell>
                <div className="font-medium text-sm leading-snug">{task.instanceTitle}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{task.entityType}</div>
              </TableCell>
              <TableCell>
                <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                  {task.stepCode}
                </code>
              </TableCell>
              <TableCell>
                <DueBadge dueAt={task.dueAt} />
              </TableCell>
              <TableCell>
                <Badge className={cn('text-xs font-normal', priority.className)}>
                  {priority.label}
                </Badge>
              </TableCell>
              <TableCell>
                <Button asChild size="sm" variant="ghost" className="h-7 px-2">
                  <Link href={`/dashboard/workflow/instances/${task.workflowInstanceId}`}>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
