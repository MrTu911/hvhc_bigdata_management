/**
 * POST /api/dashboard/layout/reset
 *
 * Reset layout cá nhân về template mặc định của role.
 * Xóa DashboardUserLayout → lần sau load sẽ dùng template.
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireFunction } from '@/lib/rbac/middleware'
import { DASHBOARD } from '@/lib/rbac/function-codes'
import { deleteUserLayout, getRoleTemplate, logDashboardAccess } from '@/lib/repositories/dashboard/dashboard-layout.repo'
import type { DashboardRoleKey } from '@prisma/client'

const VALID_DASHBOARD_KEYS = new Set<string>([
  'EXECUTIVE', 'DEPARTMENT', 'EDUCATION', 'PARTY', 'FACULTY', 'STUDENT',
])

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireFunction(request, DASHBOARD.VIEW)
    if (!authResult.allowed) return authResult.response!

    const user = authResult.user!

    let body: { dashboardKey: string }
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ success: false, error: 'Body không hợp lệ' }, { status: 400 })
    }

    const { dashboardKey } = body

    if (!VALID_DASHBOARD_KEYS.has(dashboardKey)) {
      return NextResponse.json({ success: false, error: 'dashboardKey không hợp lệ' }, { status: 400 })
    }

    await deleteUserLayout(user.id, dashboardKey as DashboardRoleKey)

    // Trả về template mặc định để UI render ngay
    const template = await getRoleTemplate(dashboardKey as DashboardRoleKey)

    logDashboardAccess(user.id, dashboardKey, 'LAYOUT_RESET').catch(() => null)

    return NextResponse.json({
      success: true,
      data: {
        dashboardKey,
        template: template
          ? { layoutJson: template.layoutJson, widgetKeys: template.widgetKeys }
          : null,
      },
    })
  } catch (error) {
    console.error('[POST /api/dashboard/layout/reset]', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
