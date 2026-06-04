/**
 * MY DASHBOARD PAGE – M11 Phase 1
 *
 * Dashboard cá nhân: người dùng tự tùy chỉnh widget (DashboardBuilder).
 * Đây là đích đến của menu "Dashboard Cá nhân", KHÔNG phải smart-landing.
 *
 * Lưu ý: việc điều hướng theo role (smart landing) được xử lý ở route
 * `/dashboard` (sau khi đăng nhập). Không auto-redirect ở đây, nếu không
 * mọi user (kể cả admin) sẽ bị đá khỏi trang cá nhân ngay khi vừa mở
 * — admin có positionCode EXECUTIVE sẽ bị đẩy sang /dashboard/command.
 */

'use client'

import { useEffect } from 'react'
import { DashboardBuilder } from '@/components/dashboard/dashboard-builder'
import { usePermissions } from '@/hooks/use-permissions'
import { useDashboardStore } from '@/lib/dashboard/dashboard-store'
import { useDashboardRedirect } from '@/hooks/use-dashboard-redirect'
import { WIDGET_REGISTRY } from '@/lib/dashboard/widget-registry'
import { Skeleton } from '@/components/ui/skeleton'

export default function MyDashboardPage() {
  // M11: chỉ tải layout/widget của user — KHÔNG auto-redirect theo role.
  // Trang cá nhân phải hiển thị được cho mọi user (gồm admin), không bị đá đi.
  const { loading: redirectLoading } = useDashboardRedirect({ autoRedirect: false })

  const { permissions, isAdmin, isLoading: permLoading } = usePermissions()
  const { initializeLayout, currentLayout } = useDashboardStore()

  const isLoading = redirectLoading || permLoading

  // Khởi tạo layout widget builder nếu redirect không xảy ra (custom/admin)
  useEffect(() => {
    if (!permLoading) {
      const functions = isAdmin
        ? WIDGET_REGISTRY.map(w => w.requiredFunction)
        : (permissions?.functionCodes || [])
      if (!currentLayout && functions.length > 0) {
        initializeLayout(functions)
      }
    }
  }, [permLoading, isAdmin, permissions, currentLayout, initializeLayout])

  if (isLoading) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-[600px]" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard Cá nhân</h1>
        <p className="text-muted-foreground mt-1">
          Tùy chỉnh dashboard theo ý thích của bạn
        </p>
      </div>
      <DashboardBuilder />
    </div>
  )
}
