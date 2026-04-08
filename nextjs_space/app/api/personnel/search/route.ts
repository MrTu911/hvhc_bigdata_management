/**
 * GET /api/personnel/search
 * Scope-aware personnel search targeting prisma.personnel.
 *
 * This is distinct from the legacy POST /api/personnel/advanced-search
 * which queries prisma.user and is not scope-aware.
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireScopedFunction } from '@/lib/rbac/middleware'
import { PERSONNEL } from '@/lib/rbac/function-codes'
import { PersonnelSearchService } from '@/lib/services/personnel/personnel-search.service'
import { logAudit } from '@/lib/audit'
import type { AuthUser } from '@/lib/rbac/types'

export async function GET(request: NextRequest) {
  try {
    const { user, scope, response } = await requireScopedFunction(request, PERSONNEL.VIEW)
    if (!user) return response!

    const authUser: AuthUser = {
      id: user.id,
      email: user.email!,
      role: user.role || '',
      unitId: user.unitId,
    }

    // Convert URLSearchParams to plain object for Zod
    const rawParams: Record<string, string> = {}
    request.nextUrl.searchParams.forEach((value, key) => {
      rawParams[key] = value
    })

    const result = await PersonnelSearchService.search(
      authUser,
      scope || 'SELF',
      rawParams,
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
      action: 'SEARCH',
      resourceType: 'PERSONNEL',
      result: 'SUCCESS',
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
    })

    return NextResponse.json({
      success: true,
      data: result.data,
      pagination: {
        total: result.total,
        page: result.page,
        pageSize: result.pageSize,
        totalPages: result.totalPages,
      },
    })
  } catch (error) {
    console.error('[GET /api/personnel/search]', error)
    return NextResponse.json(
      { success: false, error: 'Lỗi khi tìm kiếm cán bộ' },
      { status: 500 },
    )
  }
}
