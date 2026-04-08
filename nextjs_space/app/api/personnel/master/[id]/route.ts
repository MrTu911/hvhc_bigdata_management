/**
 * Personnel Master Detail API – M02 Phase 2
 * GET    /api/personnel/master/[id] — chi tiết Personnel (prisma.personnel)
 * PUT    /api/personnel/master/[id] — cập nhật Personnel
 * DELETE /api/personnel/master/[id] — xóa mềm Personnel (chỉ ACADEMY scope)
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireScopedFunction } from '@/lib/rbac/middleware'
import { PERSONNEL } from '@/lib/rbac/function-codes'
import { PersonnelProfileService } from '@/lib/services/personnel/personnel-profile.service'
import { logAudit } from '@/lib/audit'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { user, scope, response } = await requireScopedFunction(
      request,
      PERSONNEL.VIEW_DETAIL,
    )
    if (!user) return response!

    const result = await PersonnelProfileService.getDetail(
      { id: user.id, email: user.email!, role: user.role || '', unitId: user.unitId },
      scope || 'SELF',
      params.id,
    )

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: result.status ?? 400 })
    }

    await logAudit({
      userId: user.id,
      functionCode: PERSONNEL.VIEW_DETAIL,
      action: 'VIEW',
      resourceType: 'PERSONNEL_MASTER',
      resourceId: params.id,
      result: 'SUCCESS',
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
    })

    return NextResponse.json({ success: true, data: result.data })
  } catch (error) {
    console.error('[GET /api/personnel/master/[id]]', error)
    return NextResponse.json({ success: false, error: 'Lỗi khi tải hồ sơ cán bộ' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { user, scope, response } = await requireScopedFunction(
      request,
      PERSONNEL.UPDATE,
    )
    if (!user) return response!

    const body = await request.json()

    const result = await PersonnelProfileService.update(
      { id: user.id, email: user.email!, role: user.role || '', unitId: user.unitId },
      scope || 'SELF',
      params.id,
      body,
    )

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: result.status ?? 400 })
    }

    await logAudit({
      userId: user.id,
      functionCode: PERSONNEL.UPDATE,
      action: 'UPDATE',
      resourceType: 'PERSONNEL_MASTER',
      resourceId: params.id,
      result: 'SUCCESS',
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
    })

    return NextResponse.json({ success: true, data: result.data })
  } catch (error) {
    console.error('[PUT /api/personnel/master/[id]]', error)
    return NextResponse.json({ success: false, error: 'Lỗi khi cập nhật hồ sơ cán bộ' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { user, scope, response } = await requireScopedFunction(
      request,
      PERSONNEL.DELETE,
    )
    if (!user) return response!

    const result = await PersonnelProfileService.softDelete(
      { id: user.id, email: user.email!, role: user.role || '', unitId: user.unitId },
      scope || 'SELF',
      params.id,
    )

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: result.status ?? 400 })
    }

    await logAudit({
      userId: user.id,
      functionCode: PERSONNEL.DELETE,
      action: 'DELETE',
      resourceType: 'PERSONNEL_MASTER',
      resourceId: params.id,
      result: 'SUCCESS',
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
    })

    return NextResponse.json({ success: true, data: result.data })
  } catch (error) {
    console.error('[DELETE /api/personnel/master/[id]]', error)
    return NextResponse.json({ success: false, error: 'Lỗi khi xóa hồ sơ cán bộ' }, { status: 500 })
  }
}
