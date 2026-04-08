'use client';

/**
 * M13 – My Work Dashboard Page
 * Route: /dashboard/workflow/my-work
 *
 * Layout:
 *  - Header: tiêu đề + nút refresh
 *  - KPI Cards (5 cards)
 *  - Nội dung chính chia 2 cột:
 *    - Trái (2/3): Task Inbox table
 *    - Phải (1/3): Notification Panel
 */

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { RefreshCw, Inbox } from 'lucide-react';

import {
  WorkflowKpiCards,
  type WorkflowMyWorkStats,
} from '@/components/workflow/WorkflowKpiCards';
import {
  WorkflowTaskInbox,
  type PendingTask,
} from '@/components/workflow/WorkflowTaskInbox';
import {
  WorkflowNotificationPanel,
  type WorkflowNotification,
} from '@/components/workflow/WorkflowNotificationPanel';

// ---------------------------------------------------------------------------
// Types matching API response
// ---------------------------------------------------------------------------

interface MyWorkResponse {
  stats: WorkflowMyWorkStats;
  tasks: PendingTask[];
  unreadNotifCount: number;
}

interface NotifResponse {
  items: WorkflowNotification[];
  unreadCount: number;
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function WorkflowMyWorkPage() {
  const [myWork, setMyWork] = useState<MyWorkResponse | null>(null);
  const [notifs, setNotifs] = useState<NotifResponse | null>(null);
  const [loadingWork, setLoadingWork] = useState(true);
  const [loadingNotif, setLoadingNotif] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMyWork = useCallback(async () => {
    try {
      const res = await fetch('/api/workflow-dashboard/my-work?limit=20');
      if (!res.ok) throw new Error();
      const json = await res.json();
      if (json.success) setMyWork(json.data);
    } catch {
      toast({ title: 'Không thể tải dữ liệu My Work', variant: 'destructive' });
    } finally {
      setLoadingWork(false);
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications/my?unreadOnly=false&limit=15');
      if (!res.ok) throw new Error();
      const json = await res.json();
      if (json.success) setNotifs(json.data);
    } catch {
      // Thông báo không tải được không block UX chính
    } finally {
      setLoadingNotif(false);
    }
  }, []);

  useEffect(() => {
    fetchMyWork();
    fetchNotifications();
  }, [fetchMyWork, fetchNotifications]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchMyWork(), fetchNotifications()]);
    setRefreshing(false);
    toast({ title: 'Đã làm mới dữ liệu' });
  }, [fetchMyWork, fetchNotifications]);

  const handleMarkRead = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/notifications/${id}/read`, { method: 'POST' });
      if (!res.ok) return;
      setNotifs((prev) =>
        prev
          ? {
              ...prev,
              items: prev.items.map((n) =>
                n.id === id ? { ...n, readAt: new Date().toISOString() } : n
              ),
              unreadCount: Math.max(0, prev.unreadCount - 1),
            }
          : prev
      );
    } catch {
      // fail-safe: không toast để tránh spam
    }
  }, []);

  const handleMarkAllRead = useCallback(async () => {
    const res = await fetch('/api/notifications/my', { method: 'PATCH' });
    if (!res.ok) throw new Error();
    setNotifs((prev) =>
      prev
        ? {
            ...prev,
            items: prev.items.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })),
            unreadCount: 0,
          }
        : prev
    );
  }, []);

  return (
    <div className="space-y-6 p-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Công việc của tôi</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Tổng quan quy trình phê duyệt và việc cần xử lý
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Làm mới
        </Button>
      </div>

      {/* KPI Cards */}
      <WorkflowKpiCards
        stats={myWork?.stats ?? null}
        loading={loadingWork}
      />

      {/* Main content: Task Inbox + Notification Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Task Inbox (2/3) */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Inbox className="h-4 w-4" />
                  Việc cần xử lý
                  {!loadingWork && myWork && myWork.stats.pendingCount > 0 && (
                    <span className="ml-1 inline-flex items-center justify-center h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                      {myWork.stats.pendingCount > 99 ? '99+' : myWork.stats.pendingCount}
                    </span>
                  )}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <WorkflowTaskInbox
                tasks={myWork?.tasks ?? []}
                loading={loadingWork}
              />
            </CardContent>
          </Card>
        </div>

        {/* Notification Panel (1/3) */}
        <div className="lg:col-span-1">
          <Card className="h-full">
            <CardContent className="pt-4">
              <WorkflowNotificationPanel
                notifications={notifs?.items ?? []}
                unreadCount={myWork?.unreadNotifCount ?? notifs?.unreadCount ?? 0}
                loading={loadingNotif}
                onMarkRead={handleMarkRead}
                onMarkAllRead={handleMarkAllRead}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
