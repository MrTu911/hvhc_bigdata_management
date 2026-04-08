/**
 * GET  /api/personnel/[id]/education  — danh sách học vấn
 * POST /api/personnel/[id]/education  — thêm bằng cấp / khóa đào tạo
 *
 * [id] = Personnel.id
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireScopedFunction } from '@/lib/rbac/middleware'
import { PERSONNEL } from '@/lib/rbac/function-codes'
import { EducationService } from '@/lib/services/personnel/education.service'
import { logAudit } from '@/lib/audit'
import type { AuthUser } from '@/lib/rbac/types'

// ─── GET ──────────────────────────────────────────────────────────────────────

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { user, response } = await requireScopedFunction(request, PERSONNEL.VIEW_DETAIL)
    if (!user) return response!

    const result = await EducationService.list(params.id)

    await logAudit({
      userId: user.id,
      functionCode: PERSONNEL.VIEW_DETAIL,
      action: 'LIST',
      resourceType: 'EDUCATION_HISTORY',
      resourceId: params.id,
      result: 'SUCCESS',
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
    })

    return NextResponse.json({ success: true, data: result.data })
  } catch (error) {
    console.error('[GET /api/personnel/[id]/education]', error)
    return NextResponse.json(
      { success: false, error: 'Lỗi khi tải lịch sử học vấn' },
      { status: 500 },
    )
  }
}

// ─── POST ─────────────────────────────────────────────────────────────────────

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
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

    const result = await EducationService.create(authUser, scope || 'SELF', params.id, body)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: result.status ?? 400 },
      )
    }

    await logAudit({
      userId: user.id,
      functionCode: PERSONNEL.UPDATE,
      action: 'CREATE',
      resourceType: 'EDUCATION_HISTORY',
      resourceId: result.data.id,
      newValue: { personnelId: params.id, level: result.data.level, institution: result.data.institution },
      result: 'SUCCESS',
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
    })

    return NextResponse.json({ success: true, data: result.data }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/personnel/[id]/education]', error)
    return NextResponse.json(
      { success: false, error: 'Lỗi khi thêm bằng cấp' },
      { status: 500 },
    )
  }
}
