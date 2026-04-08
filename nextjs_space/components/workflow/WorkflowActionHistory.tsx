'use client';

/**
 * M13 – Action History List
 * Danh sách các actions đã thực hiện trên workflow instance.
 */

import { cn } from '@/lib/utils';
import {
  CheckCircle2,
  XCircle,
  RotateCcw,
  Send,
  MessageSquare,
  PenLine,
  UserCheck,
  ArrowUpRight,
  Clock,
  Ban,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export interface ActionRecord {
  id: string;
  actionCode: string;
  actionBy: string;
  comment: string | null;
  actionAt: string;
}

interface WorkflowActionHistoryProps {
  actions: ActionRecord[];
  loading: boolean;
}

const ACTION_CONFIG: Record<
  string,
  { label: string; icon: React.ReactNode; bgClass: string }
> = {
  SUBMIT:        { label: 'Nộp hồ sơ',   icon: <Send className="h-3.5 w-3.5" />,       bgClass: 'bg-blue-100 text-blue-600' },
  APPROVE:       { label: 'Phê duyệt',   icon: <CheckCircle2 className="h-3.5 w-3.5" />, bgClass: 'bg-green-100 text-green-600' },
  REJECT:        { label: 'Từ chối',     icon: <XCircle className="h-3.5 w-3.5" />,      bgClass: 'bg-red-100 text-red-600' },
  RETURN:        { label: 'Trả lại',     icon: <RotateCcw className="h-3.5 w-3.5" />,    bgClass: 'bg-amber-100 text-amber-600' },
  CANCEL:        { label: 'Hủy',         icon: <Ban className="h-3.5 w-3.5" />,          bgClass: 'bg-gray-100 text-gray-500' },
  COMMENT:       { label: 'Bình luận',   icon: <MessageSquare className="h-3.5 w-3.5" />, bgClass: 'bg-purple-100 text-purple-600' },
  SIGN:          { label: 'Ký số',       icon: <PenLine className="h-3.5 w-3.5" />,      bgClass: 'bg-teal-100 text-teal-600' },
  REASSIGN:      { label: 'Phân công lại', icon: <UserCheck className="h-3.5 w-3.5" />, bgClass: 'bg-indigo-100 text-indigo-600' },
  ESCALATE:      { label: 'Thúc đẩy',   icon: <ArrowUpRight className="h-3.5 w-3.5" />, bgClass: 'bg-orange-100 text-orange-600' },
  SYSTEM_TIMEOUT:{ label: 'Hết hạn (hệ thống)', icon: <Clock className="h-3.5 w-3.5" />, bgClass: 'bg-orange-100 text-orange-600' },
};

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function WorkflowActionHistory({ actions, loading }: WorkflowActionHistoryProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="h-7 w-7 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-1/3" />
              <Skeleton className="h-3 w-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (actions.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4 text-center">
        Chưa có hành động nào.
      </p>
    );
  }

  return (
    <ol className="space-y-3">
      {actions.map((action) => {
        const cfg = ACTION_CONFIG[action.actionCode] ?? {
          label: action.actionCode,
          icon: <CheckCircle2 className="h-3.5 w-3.5" />,
          bgClass: 'bg-muted text-muted-foreground',
        };
        return (
          <li key={action.id} className="flex gap-3">
            {/* Icon */}
            <div
              className={cn(
                'flex-shrink-0 mt-0.5 h-7 w-7 rounded-full flex items-center justify-center',
                cfg.bgClass
              )}
            >
              {cfg.icon}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline justify-between gap-2 flex-wrap">
                <span className="text-sm font-medium">{cfg.label}</span>
                <span className="text-xs text-muted-foreground flex-shrink-0">
                  {formatDateTime(action.actionAt)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Người thực hiện: <span className="font-mono">{action.actionBy.slice(0, 8)}…</span>
              </p>
              {action.comment && (
                <p className="text-sm mt-1 bg-muted/50 rounded px-2 py-1 text-muted-foreground italic">
                  "{action.comment}"
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
