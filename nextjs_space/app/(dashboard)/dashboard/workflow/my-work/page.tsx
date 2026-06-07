'use client';

/**
 * M13 – My Work Dashboard Page
 * Route: /dashboard/workflow/my-work
 *
 * Layout:
 *  - ModuleHero (M13 · Quy trình) + nút refresh
 *  - Cảnh báo quá hạn (nếu có)
 *  - KPI Cards (5 cards)
 *  - Nội dung chính chia 2 cột:
 *    - Trái (2/3): Task Inbox
 *    - Phải (1/3): Notification Panel
 *  - Truy cập nhanh các phân hệ workflow
 */

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ModuleHero } from '@/components/ui/enhanced-data-card';
import { toast } from '@/components/ui/use-toast';
import {
  RefreshCw, Inbox, ListChecks, AlertCircle, ChevronRight,
  Layers, History, LayoutDashboard,
} from 'lucide-react';

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
// Quick-access links to other workflow sub-pages
// ---------------------------------------------------------------------------

const QUICK_LINKS = [
  { icon: LayoutDashboard, label: 'Tổng quan quy trình', sub: 'Dashboard điều hành M13', href: '/dashboard/workflow', color: '#0891b2' },
  { icon: Layers, label: 'Tất cả phiên xử lý', sub: 'Danh sách workflow instances', href: '/dashboard/workflow/instances', color: '#2563eb' },
  { icon: History, label: 'Lịch sử xử lý', sub: 'Các quy trình đã hoàn tất', href: '/dashboard/workflow/history', color: '#7c3aed' },
];

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

  const stats = myWork?.stats;
  const pendingCount = stats?.pendingCount ?? 0;
  const overdueCount = stats?.overdueCount ?? 0;
  const unreadCount = myWork?.unreadNotifCount ?? notifs?.unreadCount ?? 0;

  return (
    <div className="space-y-6">
      {/* ── Module Hero ──────────────────────────────────────────────────────── */}
      <ModuleHero
        moduleId="workflow"
        title="Công việc của tôi"
        subtitle="Tổng quan quy trình phê duyệt và việc cần xử lý"
        icon={ListChecks}
        stats={
          stats
            ? [
                { label: 'Chờ xử lý', value: pendingCount },
                { label: 'Quá hạn', value: overdueCount },
                { label: 'Hoàn thành 7 ngày', value: stats.completedRecentCount },
              ]
            : undefined
        }
        controls={
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="bg-white/10 border-white/30 text-white hover:bg-white/20 gap-1.5"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Làm mới
          </Button>
        }
      />

      {/* ── Cảnh báo quá hạn ─────────────────────────────────────────────────── */}
      {overdueCount > 0 && (
        <div className="flex items-center justify-between gap-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl px-5 py-3.5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center shrink-0">
              <AlertCircle className="h-5 w-5 text-red-600 animate-pulse" />
            </div>
            <div>
              <p className="font-semibold text-red-800 text-sm">
                {overdueCount} công việc đã QUÁ HẠN xử lý
              </p>
              <p className="text-xs text-red-600">
                Vui lòng ưu tiên xử lý các bước quá hạn để không làm tắc nghẽn quy trình.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── KPI Cards ────────────────────────────────────────────────────────── */}
      <WorkflowKpiCards stats={myWork?.stats ?? null} loading={loadingWork} />

      {/* ── Main content: Task Inbox + Notification Panel ────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Task Inbox (2/3) */}
        <div className="lg:col-span-2">
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-base flex items-center gap-2 text-slate-700">
                <span className="rounded-lg bg-blue-50 p-1.5">
                  <Inbox className="h-4 w-4 text-blue-600" />
                </span>
                Việc cần xử lý
                {!loadingWork && pendingCount > 0 && (
                  <span className="ml-1 inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full bg-blue-500 text-white text-xs font-bold">
                    {pendingCount > 99 ? '99+' : pendingCount}
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <WorkflowTaskInbox tasks={myWork?.tasks ?? []} loading={loadingWork} />
            </CardContent>
          </Card>
        </div>

        {/* Notification Panel (1/3) */}
        <div className="lg:col-span-1">
          <Card className="h-full border-0 shadow-md">
            <CardContent className="pt-5">
              <WorkflowNotificationPanel
                notifications={notifs?.items ?? []}
                unreadCount={unreadCount}
                loading={loadingNotif}
                onMarkRead={handleMarkRead}
                onMarkAllRead={handleMarkAllRead}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Truy cập nhanh ───────────────────────────────────────────────────── */}
      <div>
        <h2 className="text-base font-semibold text-slate-700 flex items-center gap-2 mb-4">
          <span className="w-1 h-5 rounded-full bg-cyan-500 inline-block" />
          Truy cập nhanh
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {QUICK_LINKS.map((item) => (
            <Link key={item.href} href={item.href}>
              <Card className="cursor-pointer border hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 group">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="rounded-xl p-2.5 shrink-0" style={{ background: `${item.color}15` }}>
                    <item.icon className="h-5 w-5" style={{ color: item.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-800 text-sm leading-tight">{item.label}</p>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">{item.sub}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-500 shrink-0 transition-colors" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
