/**
 * POST /api/dashboard/layout/save
 *
 * Lưu layout cá nhân của user cho một dashboard key.
 * Validate: widgetIds phải nằm trong allowedWidgetKeys của role template.
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireFunction } from '@/lib/rbac/middleware'
import { DASHBOARD } from '@/lib/rbac/function-codes'
import { getRoleTemplate, saveUserLayout, logDashboardAccess } from '@/lib/repositories/dashboard/dashboard-layout.repo'
import { getWidgetsByRole } from '@/lib/dashboard/widget-registry'
import type { DashboardRoleKey } from '@prisma/client'

const VALID_DASHBOARD_KEYS = new Set<string>([
  'EXECUTIVE', 'DEPARTMENT', 'EDUCATION', 'PARTY', 'FACULTY', 'STUDENT',
])

interface LayoutItem {
  widgetId: string
  x: number
  y: number
  w: number
  h: number
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireFunction(request, DASHBOARD.VIEW)
    if (!authResult.allowed) return authResult.response!

    const user = authResult.user!

    let body: { dashboardKey: string; layoutJson: LayoutItem[] }
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ success: false, error: 'Body không hợp lệ' }, { status: 400 })
    }

    const { dashboardKey, layoutJson } = body

    if (!VALID_DASHBOARD_KEYS.has(dashboardKey)) {
      return NextResponse.json({ success: false, error: 'dashboardKey không hợp lệ' }, { status: 400 })
    }

    if (!Array.isArray(layoutJson)) {
      return NextResponse.json({ success: false, error: 'layoutJson phải là array' }, { status: 400 })
    }

    // Validate: widgetIds phải trong allowed list
    const template = await getRoleTemplate(dashboardKey as DashboardRoleKey)
    const allowedKeys = new Set<string>(
      template?.widgetKeys ?? getWidgetsByRole(dashboardKey).map(w => w.id),
    )

    const invalidWidgets = layoutJson.filter(item => !allowedKeys.has(item.widgetId))
    if (invalidWidgets.length > 0) {
      return NextResponse.json(
        { success: false, error: `Widget không được phép: ${invalidWidgets.map(i => i.widgetId).join(', ')}` },
        { status: 403 },
      )
    }

    const saved = await saveUserLayout(
      user.id,
      dashboardKey as DashboardRoleKey,
      layoutJson,
      template?.id ?? null,
    )

    logDashboardAccess(user.id, dashboardKey, 'LAYOUT_SAVE').catch(() => null)

    return NextResponse.json({ success: true, data: { id: saved.id, updatedAt: saved.updatedAt } })
  } catch (error) {
    console.error('[POST /api/dashboard/layout/save]', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
