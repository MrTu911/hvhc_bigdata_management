/**
 * POST /api/personnel/talent-search
 * Talent planning engine: hard filter + soft scoring of candidates.
 *
 * Returns ranked list with score breakdown, matched criteria, and missing criteria.
 * [M01-RBAC-HOOK] Scope strictly enforced — UNIT scope cannot search outside own unit.
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireScopedFunction } from '@/lib/rbac/middleware'
import { PERSONNEL } from '@/lib/rbac/function-codes'
import { PersonnelPlanningService } from '@/lib/services/personnel/personnel-planning.service'
import { logAudit } from '@/lib/audit'
import type { AuthUser } from '@/lib/rbac/types'

export async function POST(request: NextRequest) {
  try {
    const { user, scope, response } = await requireScopedFunction(request, PERSONNEL.VIEW)
    if (!user) return response!

    const authUser: AuthUser = {
      id: user.id,
      email: user.email!,
      role: user.role || '',
      unitId: user.unitId,
    }

    const body = await request.json()

    const result = await PersonnelPlanningService.talentSearch(
      authUser,
      scope || 'SELF',
      body,
    )

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: result.status ?? 400 },
      )
    }

    await logAudit({
      userId: user.id,
      functionCode: PERSONNEL.VIEW,
      action: 'TALENT_SEARCH',
      resourceType: 'PERSONNEL',
      result: 'SUCCESS',
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
    })

    return NextResponse.json({
      success: true,
      data: result.data,
      total: result.total,
      meta: result.meta,
    })
  } catch (error) {
    console.error('[POST /api/personnel/talent-search]', error)
    return NextResponse.json(
      { success: false, error: 'Lỗi khi tìm kiếm quy hoạch' },
      { status: 500 },
    )
  }
}
