'use client';

/**
 * M13 – Step Timeline
 * Hiển thị danh sách WorkflowStepInstance dưới dạng timeline dọc.
 */

import { cn } from '@/lib/utils';
import {
  CheckCircle2,
  XCircle,
  RotateCcw,
  Clock,
  AlertCircle,
  Loader2,
} from 'lucide-react';

export interface StepInstance {
  id: string;
  stepCode: string;
  status: string;
  assigneeId: string | null;
  assignedAt: string | null;
  dueAt: string | null;
  actedAt: string | null;
  completedAt: string | null;
}

interface WorkflowStepTimelineProps {
  steps: StepInstance[];
  currentStepCode: string | null;
}

const STEP_STATUS_CONFIG: Record<
  string,
  { label: string; icon: React.ReactNode; dotClass: string; textClass: string }
> = {
  READY: {
    label: 'Chờ xử lý',
    icon: <Clock className="h-4 w-4" />,
    dotClass: 'bg-blue-100 border-blue-400 text-blue-600',
    textClass: 'text-blue-700',
  },
  IN_PROGRESS: {
    label: 'Đang xử lý',
    icon: <Loader2 className="h-4 w-4 animate-spin" />,
    dotClass: 'bg-blue-500 border-blue-600 text-white',
    textClass: 'text-blue-700 font-medium',
  },
  APPROVED: {
    label: 'Đã duyệt',
    icon: <CheckCircle2 className="h-4 w-4" />,
    dotClass: 'bg-green-500 border-green-600 text-white',
    textClass: 'text-green-700',
  },
  REJECTED: {
    label: 'Từ chối',
    icon: <XCircle className="h-4 w-4" />,
    dotClass: 'bg-red-500 border-red-600 text-white',
    textClass: 'text-red-700',
  },
  RETURNED: {
    label: 'Trả lại',
    icon: <RotateCcw className="h-4 w-4" />,
    dotClass: 'bg-amber-400 border-amber-500 text-white',
    textClass: 'text-amber-700',
  },
  CANCELLED: {
    label: 'Đã hủy',
    icon: <XCircle className="h-4 w-4" />,
    dotClass: 'bg-gray-400 border-gray-500 text-white',
    textClass: 'text-gray-500',
  },
  EXPIRED: {
    label: 'Hết hạn',
    icon: <AlertCircle className="h-4 w-4" />,
    dotClass: 'bg-orange-400 border-orange-500 text-white',
    textClass: 'text-orange-700',
  },
};

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

export function WorkflowStepTimeline({ steps, currentStepCode }: WorkflowStepTimelineProps) {
  if (steps.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4 text-center">
        Chưa có bước nào được tạo.
      </p>
    );
  }

  return (
    <ol className="relative border-l border-muted ml-4 space-y-0">
      {steps.map((step, idx) => {
        const cfg = STEP_STATUS_CONFIG[step.status] ?? STEP_STATUS_CONFIG['READY'];
        const isCurrent = step.stepCode === currentStepCode && (step.status === 'READY' || step.status === 'IN_PROGRESS');
        return (
          <li key={step.id} className={cn('ml-6 pb-6', idx === steps.length - 1 && 'pb-0')}>
            {/* Dot */}
            <span
              className={cn(
                'absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full border-2',
                cfg.dotClass,
                isCurrent && 'ring-2 ring-blue-300 ring-offset-1'
              )}
            >
              {cfg.icon}
            </span>

            {/* Content */}
            <div className="pt-0.5">
              <div className="flex items-center gap-2 flex-wrap">
                <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">
                  {step.stepCode}
                </code>
                <span className={cn('text-xs font-medium', cfg.textClass)}>
                  {cfg.label}
                </span>
                {isCurrent && (
                  <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
                    Bước hiện tại
                  </span>
                )}
              </div>

              <div className="mt-1 text-xs text-muted-foreground space-y-0.5">
                {step.assigneeId && (
                  <p>Người xử lý: <span className="font-mono">{step.assigneeId.slice(0, 8)}…</span></p>
                )}
                {step.assignedAt && (
                  <p>Nhận việc: {formatDateTime(step.assignedAt)}</p>
                )}
                {step.actedAt && (
                  <p>Xử lý lúc: {formatDateTime(step.actedAt)}</p>
                )}
                {step.dueAt && (
                  <p className={cn(
                    new Date(step.dueAt) < new Date() && step.status !== 'APPROVED'
                      ? 'text-red-500' : ''
                  )}>
                    Hạn: {formatDateTime(step.dueAt)}
                  </p>
                )}
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
