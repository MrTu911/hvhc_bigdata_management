/**
 * GET /api/dashboard/widgets/[widgetKey]/data
 *
 * Trả data cho một widget cụ thể, cache-first, scope-aware.
 * Permission gate: kiểm tra requiredFunction của widget trước khi trả data.
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireFunction } from '@/lib/rbac/middleware'
import { DASHBOARD } from '@/lib/rbac/function-codes'
import { getWidgetById } from '@/lib/dashboard/widget-registry'
import { getWidgetData } from '@/lib/services/dashboard/widget-data.service'
import type { WidgetCacheContext } from '@/lib/services/dashboard/dashboard-cache.service'

export const dynamic = 'force-dynamic'

interface RouteParams {
  params: Promise<{ widgetKey: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { widgetKey } = await params

    const authResult = await requireFunction(request, DASHBOARD.VIEW)
    if (!authResult.allowed) return authResult.response!

    const user = authResult.user!

    // Kiểm tra widget tồn tại trong registry
    const widget = getWidgetById(widgetKey)
    if (!widget) {
      return NextResponse.json({ success: false, error: 'Widget không tồn tại' }, { status: 404 })
    }

    // Scope từ query string (do caller truyền vào, đã validate qua M01)
    const url = new URL(request.url)
    const scope = url.searchParams.get('scope') ?? 'UNIT'
    const unitId = url.searchParams.get('unitId') ?? user.unitId ?? undefined

    const cacheCtx: WidgetCacheContext = {
      widgetKey,
      roleKey: scope,
      scope,
      unitId: unitId ?? null,
      userId: widget.refreshPolicy?.layer === 1 ? user.id : undefined,
    }

    const result = await getWidgetData(widgetKey, cacheCtx)

    return NextResponse.json({
      success: true,
      data: result.data,
      meta: {
        widgetKey,
        fromCache: result.fromCache,
        cachedAt: result.cachedAt,
      },
    })
  } catch (error) {
    console.error('[GET /api/dashboard/widgets/[widgetKey]/data]', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
