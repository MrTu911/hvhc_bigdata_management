/**
 * Personnel Master API – M02 Phase 2
 * GET  /api/personnel/master — danh sách Personnel (prisma.personnel)
 * POST /api/personnel/master — tạo mới Personnel
 *
 * Tách biệt hoàn toàn với /api/personnel (User-based legacy routes).
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireScopedFunction } from '@/lib/rbac/middleware'
import { PERSONNEL } from '@/lib/rbac/function-codes'
import { PersonnelProfileService } from '@/lib/services/personnel/personnel-profile.service'
import { logAudit } from '@/lib/audit'
import type { PersonnelCategory, PersonnelStatus, ManagingOrgan } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const { user, scope, scopedOptions, response } = await requireScopedFunction(
      request,
      PERSONNEL.VIEW,
    )
    if (!user) return response!

    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')))

    const result = await PersonnelProfileService.list(
      { id: user.id, email: user.email!, role: user.role || '', unitId: user.unitId },
      scope || 'SELF',
      {
        search: searchParams.get('search') || undefined,
        unitId: searchParams.get('unitId') || undefined,
        category: (searchParams.get('category') as PersonnelCategory) || undefined,
        status: (searchParams.get('status') as PersonnelStatus) || undefined,
        managingOrgan: (searchParams.get('managingOrgan') as ManagingOrgan) || undefined,
        page,
        limit,
      },
    )

    await logAudit({
      userId: user.id,
      functionCode: PERSONNEL.VIEW,
      action: 'LIST',
      resourceType: 'PERSONNEL_MASTER',
      result: 'SUCCESS',
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
    })

    return NextResponse.json({
      success: true,
      data: result.data,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    })
  } catch (error) {
    console.error('[GET /api/personnel/master]', error)
    return NextResponse.json({ success: false, error: 'Lỗi khi tải danh sách cán bộ' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, response } = await requireScopedFunction(request, PERSONNEL.CREATE)
    if (!user) return response!

    const body = await request.json()

    const result = await PersonnelProfileService.create(
      { id: user.id, email: user.email!, role: user.role || '', unitId: user.unitId },
      body,
    )

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: result.status ?? 400 })
    }

    await logAudit({
      userId: user.id,
      functionCode: PERSONNEL.CREATE,
      action: 'CREATE',
      resourceType: 'PERSONNEL_MASTER',
      resourceId: result.data.id,
      result: 'SUCCESS',
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
    })

    return NextResponse.json({ success: true, data: result.data }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/personnel/master]', error)
    return NextResponse.json({ success: false, error: 'Lỗi khi tạo hồ sơ cán bộ' }, { status: 500 })
  }
}
