/**
 * PUT    /api/personnel/education/[educationId]  — cập nhật bản ghi học vấn
 * DELETE /api/personnel/education/[educationId]  — xóa bản ghi học vấn (chỉ ACADEMY scope)
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireScopedFunction } from '@/lib/rbac/middleware'
import { PERSONNEL } from '@/lib/rbac/function-codes'
import { EducationService } from '@/lib/services/personnel/education.service'
import { logAudit } from '@/lib/audit'
import type { AuthUser } from '@/lib/rbac/types'

// ─── PUT ──────────────────────────────────────────────────────────────────────

export async function PUT(
  request: NextRequest,
  { params }: { params: { educationId: string } },
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

    const result = await EducationService.update(
      authUser,
      scope || 'SELF',
      params.educationId,
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
      resourceType: 'EDUCATION_HISTORY',
      resourceId: params.educationId,
      newValue: { level: result.data.level, institution: result.data.institution },
      result: 'SUCCESS',
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
    })

    return NextResponse.json({ success: true, data: result.data })
  } catch (error) {
    console.error('[PUT /api/personnel/education/[educationId]]', error)
    return NextResponse.json(
      { success: false, error: 'Lỗi khi cập nhật bản ghi học vấn' },
      { status: 500 },
    )
  }
}

// ─── DELETE ───────────────────────────────────────────────────────────────────

export async function DELETE(
  request: NextRequest,
  { params }: { params: { educationId: string } },
) {
  try {
    const { user, scope, response } = await requireScopedFunction(request, PERSONNEL.DELETE)
    if (!user) return response!

    const authUser: AuthUser = {
      id: user.id,
      email: user.email!,
      role: user.role || '',
      unitId: user.unitId,
    }

    const result = await EducationService.delete(authUser, scope || 'SELF', params.educationId)

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
      resourceType: 'EDUCATION_HISTORY',
      resourceId: params.educationId,
      result: 'SUCCESS',
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
    })

    return NextResponse.json({ success: true, data: result.data })
  } catch (error) {
    console.error('[DELETE /api/personnel/education/[educationId]]', error)
    return NextResponse.json(
      { success: false, error: 'Lỗi khi xóa bản ghi học vấn' },
      { status: 500 },
    )
  }
}
