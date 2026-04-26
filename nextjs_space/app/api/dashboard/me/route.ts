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

const EXECUTIVE_POSITIONS = new Set([
  'PHO_GIAM_DOC', 'GIAM_DOC', 'CHINH_UY', 'PHO_CHINH_UY', 'SYSTEM_ADMIN',
  // legacy role strings (backward compat)
  'CHI_HUY_HOC_VIEN', 'ADMIN', 'QUAN_TRI_HE_THONG',
])

const DEPARTMENT_POSITIONS = new Set([
  'TRUONG_KHOA', 'PHO_TRUONG_KHOA', 'CHI_HUY_HE', 'CHI_HUY_TIEU_DOAN',
  'CHI_HUY_BAN', 'CHU_NHIEM_BO_MON',
  // legacy role strings
  'CHI_HUY_KHOA_PHONG',
])

const FACULTY_POSITIONS = new Set([
  'GIANG_VIEN', 'NGHIEN_CUU_VIEN', 'NHAN_VIEN',
])

const STUDENT_POSITIONS = new Set([
  'HOC_VIEN_QUAN_SU', 'SINH_VIEN_DAN_SU',
  // legacy role strings
  'HOC_VIEN', 'HOC_VIEN_SINH_VIEN',
])

/** Map primaryPositionCode → DashboardRoleKey (ưu tiên positionCode, fallback về legacy role) */
function resolveDashboardRoleKey(primaryPositionCode: string | null | undefined, legacyRole?: string): DashboardRoleKey {
  const code = primaryPositionCode ?? legacyRole ?? ''

  if (EXECUTIVE_POSITIONS.has(code)) return 'EXECUTIVE'
  if (DEPARTMENT_POSITIONS.has(code)) return 'DEPARTMENT'
  if (FACULTY_POSITIONS.has(code)) return 'FACULTY'
  if (STUDENT_POSITIONS.has(code)) return 'STUDENT'

  // Fallback nếu không map được: thử legacyRole
  if (primaryPositionCode && legacyRole) {
    if (EXECUTIVE_POSITIONS.has(legacyRole)) return 'EXECUTIVE'
    if (FACULTY_POSITIONS.has(legacyRole)) return 'FACULTY'
    if (STUDENT_POSITIONS.has(legacyRole)) return 'STUDENT'
  }

  return 'DEPARTMENT'
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
    const dashboardKey = resolveDashboardRoleKey(user.primaryPositionCode, user.role)

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
