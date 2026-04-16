/**
 * GET /api/dashboard/me
 *
 * Trả về dashboard info của user hiện tại:
 *  - roleKey: loại dashboard phù hợp với role
 *  - template: layout mặc định của role
 *  - userLayout: layout cá nhân nếu đã tùy chỉnh
 *  - allowedWidgetKeys: danh sách widget user được dùng
 *
 * Scope check bắt buộc qua M01.
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireFunction } from '@/lib/rbac/middleware'
import { DASHBOARD } from '@/lib/rbac/function-codes'
import { getRoleTemplate, getUserLayout, logDashboardAccess } from '@/lib/repositories/dashboard/dashboard-layout.repo'
import { getWidgetsByRole } from '@/lib/dashboard/widget-registry'
import type { DashboardRoleKey } from '@prisma/client'

export const dynamic = 'force-dynamic'

/** Map UserRole → DashboardRoleKey */
function resolveDashboardRoleKey(userRole: string): DashboardRoleKey {
  switch (userRole) {
    case 'CHI_HUY_HOC_VIEN':
    case 'ADMIN':
    case 'QUAN_TRI_HE_THONG':
      return 'EXECUTIVE'
    case 'CHI_HUY_KHOA_PHONG':
    case 'CHI_HUY_HE':
    case 'CHI_HUY_TIEU_DOAN':
    case 'CHI_HUY_BAN':
    case 'CHU_NHIEM_BO_MON':
      return 'DEPARTMENT'
    case 'GIANG_VIEN':
    case 'NGHIEN_CUU_VIEN':
      return 'FACULTY'
    case 'HOC_VIEN':
    case 'HOC_VIEN_SINH_VIEN':
      return 'STUDENT'
    default:
      return 'DEPARTMENT'
  }
}

/** Map DashboardRoleKey → frontend route */
const DASHBOARD_ROUTE: Record<DashboardRoleKey, string> = {
  EXECUTIVE:  '/dashboard/command',
  DEPARTMENT: '/dashboard/department',
  EDUCATION:  '/dashboard/education',
  PARTY:      '/dashboard/party',
  FACULTY:    '/dashboard/faculty',
  STUDENT:    '/dashboard/student',
}

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireFunction(request, DASHBOARD.VIEW)
    if (!authResult.allowed) return authResult.response!

    const user = authResult.user!
    const dashboardKey = resolveDashboardRoleKey(user.role)

    // Layout ưu tiên: user layout → role template → generated default
    const [template, userLayout] = await Promise.all([
      getRoleTemplate(dashboardKey),
      getUserLayout(user.id, dashboardKey),
    ])

    // Widget keys user được phép: dùng template nếu có, fallback registry
    const allowedWidgetKeys: string[] =
      template?.widgetKeys ??
      getWidgetsByRole(dashboardKey).map(w => w.id)

    // Ghi log VIEW (fire-and-forget, không block response)
    logDashboardAccess(user.id, dashboardKey, 'VIEW').catch(() => null)

    return NextResponse.json({
      success: true,
      data: {
        dashboardKey,
        redirectTo: DASHBOARD_ROUTE[dashboardKey],
        userId: user.id,
        unitId: user.unitId ?? null,
        template: template
          ? { layoutJson: template.layoutJson, widgetKeys: template.widgetKeys }
          : null,
        userLayout: userLayout
          ? { layoutJson: userLayout.layoutJson, updatedAt: userLayout.updatedAt }
          : null,
        allowedWidgetKeys,
      },
    })
  } catch (error) {
    console.error('[GET /api/dashboard/me]', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
