/**
 * MY DASHBOARD PAGE – M11 Phase 1
 *
 * Smart landing: redirect user về đúng dashboard theo role.
 * Nếu không redirect được (admin/custom), hiển thị DashboardBuilder.
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
  // M11: redirect về đúng dashboard role – autoRedirect=true
  const { loading: redirectLoading } = useDashboardRedirect({ autoRedirect: true })

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
