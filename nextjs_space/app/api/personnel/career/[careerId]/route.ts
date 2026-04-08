/**
 * PUT    /api/personnel/career/[careerId]  — cập nhật sự kiện công tác
 * DELETE /api/personnel/career/[careerId]  — xóa mềm sự kiện công tác
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireScopedFunction } from '@/lib/rbac/middleware'
import { PERSONNEL } from '@/lib/rbac/function-codes'
import { CareerService } from '@/lib/services/personnel/career.service'
import { logAudit } from '@/lib/audit'
import type { AuthUser } from '@/lib/rbac/types'

// ─── PUT ──────────────────────────────────────────────────────────────────────

export async function PUT(
  request: NextRequest,
  { params }: { params: { careerId: string } },
) {
  try {
    const { user, scope, response } = await requireScopedFunction(request, PERSONNEL.UPDATE)
    if (!user) return response!

    const body = await request.json()

    const authUser: AuthUser = {
      id: user.id,
      email: user.email!,
      role: user.role || '',
      unitId: user.unitId,
    }

    const result = await CareerService.update(
      authUser,
      scope || 'SELF',
      params.careerId,
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
      functionCode: PERSONNEL.UPDATE,
      action: 'UPDATE',
      resourceType: 'CAREER_HISTORY',
      resourceId: params.careerId,
      newValue: { eventType: result.data.eventType, effectiveDate: result.data.effectiveDate },
      result: 'SUCCESS',
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
    })

    return NextResponse.json({
      success: true,
      data: result.data,
      ...(result.warnings?.length ? { warnings: result.warnings } : {}),
    })
  } catch (error) {
    console.error('[PUT /api/personnel/career/[careerId]]', error)
    return NextResponse.json(
      { success: false, error: 'Lỗi khi cập nhật bản ghi công tác' },
      { status: 500 },
    )
  }
}

// ─── DELETE ───────────────────────────────────────────────────────────────────

export async function DELETE(
  request: NextRequest,
  { params }: { params: { careerId: string } },
) {
  try {
    const { user, scope, response } = await requireScopedFunction(request, PERSONNEL.DELETE)
    if (!user) return response!

    const { searchParams } = new URL(request.url)
    const deletionReason = searchParams.get('reason') || undefined

    const authUser: AuthUser = {
      id: user.id,
      email: user.email!,
      role: user.role || '',
      unitId: user.unitId,
    }

    const result = await CareerService.softDelete(
      authUser,
      scope || 'SELF',
      params.careerId,
      { deletionReason },
    )

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: result.status ?? 400 },
      )
    }

    await logAudit({
      userId: user.id,
      functionCode: PERSONNEL.DELETE,
      action: 'DELETE',
      resourceType: 'CAREER_HISTORY',
      resourceId: params.careerId,
      result: 'SUCCESS',
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
    })

    return NextResponse.json({ success: true, data: result.data })
  } catch (error) {
    console.error('[DELETE /api/personnel/career/[careerId]]', error)
    return NextResponse.json(
      { success: false, error: 'Lỗi khi xóa bản ghi công tác' },
      { status: 500 },
    )
  }
}
