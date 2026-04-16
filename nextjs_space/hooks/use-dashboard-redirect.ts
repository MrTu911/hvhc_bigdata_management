/**
 * useDashboardRedirect – M11 Phase 1
 *
 * Gọi /api/dashboard/me để lấy redirectTo theo role,
 * sau đó tự điều hướng nếu người dùng chưa ở đúng trang.
 *
 * Dùng trong:
 *  - my-dashboard/page.tsx (smart landing)
 *  - Bất kỳ page nào cần redirect về đúng dashboard theo role
 */
'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'

export interface DashboardMeData {
  dashboardKey: string
  redirectTo: string
  userId: string
  unitId: string | null
  allowedWidgetKeys: string[]
  template: { layoutJson: unknown; widgetKeys: string[] } | null
  userLayout: { layoutJson: unknown; updatedAt: string } | null
}

interface UseDashboardRedirectOptions {
  /** Nếu true, tự động redirect sang dashboardKey phù hợp. Mặc định: true */
  autoRedirect?: boolean
}

export function useDashboardRedirect(options: UseDashboardRedirectOptions = {}) {
  const { autoRedirect = true } = options
  const router = useRouter()
  const pathname = usePathname()

  const [data, setData] = useState<DashboardMeData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function fetchMe() {
      try {
        const res = await fetch('/api/dashboard/me')
        if (!res.ok) throw new Error(`${res.status}`)
        const json = await res.json()
        if (!json.success) throw new Error(json.error ?? 'Lỗi không xác định')

        if (!cancelled) {
          const meData: DashboardMeData = json.data
          setData(meData)

          if (autoRedirect && meData.redirectTo && pathname !== meData.redirectTo) {
            router.replace(meData.redirectTo)
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Lỗi tải dashboard')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchMe()
    return () => { cancelled = true }
  }, [autoRedirect, pathname, router])

  return { data, loading, error }
}
