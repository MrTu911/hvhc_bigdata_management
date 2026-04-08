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

const EVENT_ICON: Record<string, React.ReactNode> = {
  NEW_TASK:    <Clock className="h-4 w-4 text-blue-500" />,
  APPROVED:    <CheckCircle2 className="h-4 w-4 text-green-500" />,
  REJECTED:    <XCircle className="h-4 w-4 text-red-500" />,
  RETURNED:    <RotateCcw className="h-4 w-4 text-amber-500" />,
  CANCELLED:   <XCircle className="h-4 w-4 text-gray-400" />,
  NEAR_DUE:    <AlertCircle className="h-4 w-4 text-amber-500" />,
  OVERDUE:     <AlertCircle className="h-4 w-4 text-red-500" />,
  ESCALATED:   <ArrowUpRight className="h-4 w-4 text-orange-500" />,
  SIGN_SUCCESS: <CheckCircle2 className="h-4 w-4 text-teal-500" />,
  SIGN_FAILED:  <XCircle className="h-4 w-4 text-red-400" />,
};

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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {unreadCount > 0
            ? <BellRing className="h-4 w-4 text-primary" />
            : <Bell className="h-4 w-4 text-muted-foreground" />
          }
          <span className="text-sm font-medium">Thông báo</span>
          {unreadCount > 0 && (
            <Badge className="h-5 px-1.5 text-xs bg-primary text-primary-foreground">
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </div>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={handleMarkAllRead}
            disabled={markingAll}
          >
            <CheckCheck className="h-3.5 w-3.5 mr-1" />
            Đánh dấu tất cả đã đọc
          </Button>
        )}
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-3.5 w-3/4" />
                <Skeleton className="h-3 w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-6 text-sm text-muted-foreground">
          <Bell className="h-8 w-8 mx-auto mb-2 opacity-30" />
          Không có thông báo mới
        </div>
      ) : (
        <ul className="space-y-1">
          {notifications.map((notif) => (
            <li
              key={notif.id}
              className={cn(
                'flex gap-3 rounded-lg px-3 py-2.5 transition-colors',
                !notif.readAt ? 'bg-primary/5 hover:bg-primary/10' : 'hover:bg-muted/50',
              )}
            >
              {/* Icon */}
              <div className="flex-shrink-0 mt-0.5">
                {EVENT_ICON[notif.eventType] ?? <Bell className="h-4 w-4 text-muted-foreground" />}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-1">
                  <p className={cn(
                    'text-sm leading-snug',
                    !notif.readAt ? 'font-medium' : 'text-muted-foreground'
                  )}>
                    {notif.title}
                  </p>
                  {!notif.readAt && (
                    <button
                      onClick={() => onMarkRead(notif.id)}
                      className="flex-shrink-0 text-muted-foreground hover:text-primary transition-colors"
                      title="Đánh dấu đã đọc"
                    >
                      <CheckCheck className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                  {notif.message}
                </p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  {timeAgo(notif.createdAt)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
