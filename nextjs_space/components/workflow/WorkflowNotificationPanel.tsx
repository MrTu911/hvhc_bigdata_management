'use client';

/**
 * M13 – Notification Panel (in-app)
 * Hiển thị danh sách thông báo workflow chưa đọc.
 * Badge count + danh sách collapsible.
 */

import { useState, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
  Bell,
  BellRing,
  CheckCheck,
  CheckCircle2,
  XCircle,
  RotateCcw,
  AlertCircle,
  Clock,
  ArrowUpRight,
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

export interface WorkflowNotification {
  id: string;
  eventType: string;
  title: string;
  message: string;
  readAt: string | null;
  createdAt: string;
  workflowInstanceId: string;
}

interface WorkflowNotificationPanelProps {
  notifications: WorkflowNotification[];
  unreadCount: number;
  loading: boolean;
  onMarkRead: (id: string) => Promise<void>;
  onMarkAllRead: () => Promise<void>;
}

/** Icon + nền tròn theo loại sự kiện workflow */
const EVENT_META: Record<string, { icon: React.ReactNode; bg: string }> = {
  NEW_TASK:     { icon: <Clock className="h-4 w-4 text-blue-600" />, bg: 'bg-blue-50' },
  APPROVED:     { icon: <CheckCircle2 className="h-4 w-4 text-green-600" />, bg: 'bg-green-50' },
  REJECTED:     { icon: <XCircle className="h-4 w-4 text-red-600" />, bg: 'bg-red-50' },
  RETURNED:     { icon: <RotateCcw className="h-4 w-4 text-amber-600" />, bg: 'bg-amber-50' },
  CANCELLED:    { icon: <XCircle className="h-4 w-4 text-slate-400" />, bg: 'bg-slate-100' },
  NEAR_DUE:     { icon: <AlertCircle className="h-4 w-4 text-amber-600" />, bg: 'bg-amber-50' },
  OVERDUE:      { icon: <AlertCircle className="h-4 w-4 text-red-600" />, bg: 'bg-red-50' },
  ESCALATED:    { icon: <ArrowUpRight className="h-4 w-4 text-orange-600" />, bg: 'bg-orange-50' },
  SIGN_SUCCESS: { icon: <CheckCircle2 className="h-4 w-4 text-teal-600" />, bg: 'bg-teal-50' },
  SIGN_FAILED:  { icon: <XCircle className="h-4 w-4 text-red-500" />, bg: 'bg-red-50' },
};

function getEventMeta(eventType: string) {
  return EVENT_META[eventType] ?? { icon: <Bell className="h-4 w-4 text-slate-400" />, bg: 'bg-slate-100' };
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'vừa xong';
  if (m < 60) return `${m} phút trước`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} giờ trước`;
  return new Date(dateStr).toLocaleDateString('vi-VN');
}

export function WorkflowNotificationPanel({
  notifications,
  unreadCount,
  loading,
  onMarkRead,
  onMarkAllRead,
}: WorkflowNotificationPanelProps) {
  const [markingAll, setMarkingAll] = useState(false);

  const handleMarkAllRead = useCallback(async () => {
    setMarkingAll(true);
    try {
      await onMarkAllRead();
      toast({ title: 'Đã đánh dấu tất cả đã đọc' });
    } catch {
      toast({ title: 'Có lỗi xảy ra', variant: 'destructive' });
    } finally {
      setMarkingAll(false);
    }
  }, [onMarkAllRead]);

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className={cn('rounded-lg p-2', unreadCount > 0 ? 'bg-amber-50' : 'bg-slate-100')}>
            {unreadCount > 0
              ? <BellRing className="h-4 w-4 text-amber-600" />
              : <Bell className="h-4 w-4 text-slate-400" />}
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-700 leading-none">Thông báo</p>
            <p className="text-xs text-slate-400 mt-0.5">
              {unreadCount > 0 ? `${unreadCount} thông báo chưa đọc` : 'Đã đọc tất cả'}
            </p>
          </div>
          {unreadCount > 0 && (
            <Badge className="h-5 px-1.5 text-xs bg-amber-500 hover:bg-amber-500 text-white border-0">
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </div>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-amber-700 hover:bg-amber-50 shrink-0"
            onClick={handleMarkAllRead}
            disabled={markingAll}
          >
            <CheckCheck className="h-3.5 w-3.5 mr-1" />
            Đọc tất cả
          </Button>
        )}
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="h-9 w-9 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-3.5 w-3/4" />
                <Skeleton className="h-3 w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-sm text-slate-400">
          <div className="rounded-full bg-slate-100 p-3 mb-3">
            <Bell className="h-6 w-6 text-slate-300" />
          </div>
          Không có thông báo mới
        </div>
      ) : (
        <ul className="space-y-1 max-h-[560px] overflow-y-auto -mr-2 pr-2">
          {notifications.map((notif) => {
            const meta = getEventMeta(notif.eventType);
            const isUnread = !notif.readAt;
            return (
              <li
                key={notif.id}
                className={cn(
                  'flex gap-3 rounded-lg px-3 py-2.5 transition-colors',
                  isUnread
                    ? 'bg-amber-50/60 hover:bg-amber-50 border-l-2 border-amber-400'
                    : 'hover:bg-slate-50',
                )}
              >
                {/* Icon trong nền tròn */}
                <div className={cn('flex-shrink-0 rounded-full p-1.5 h-fit', meta.bg)}>
                  {meta.icon}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-1">
                    <p className={cn('text-sm leading-snug', isUnread ? 'font-semibold text-slate-800' : 'text-slate-500')}>
                      {notif.title}
                    </p>
                    {isUnread && (
                      <button
                        onClick={() => onMarkRead(notif.id)}
                        className="flex-shrink-0 text-slate-400 hover:text-amber-600 transition-colors"
                        title="Đánh dấu đã đọc"
                      >
                        <CheckCheck className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">
                    {notif.message}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {timeAgo(notif.createdAt)}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
