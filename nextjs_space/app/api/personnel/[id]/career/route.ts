/**
 * GET  /api/personnel/[id]/career  — danh sách lịch sử công tác
 * POST /api/personnel/[id]/career  — thêm sự kiện công tác mới
 *
 * [id] = Personnel.id (không phải userId)
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireScopedFunction } from '@/lib/rbac/middleware'
import { PERSONNEL } from '@/lib/rbac/function-codes'
import { CareerService } from '@/lib/services/personnel/career.service'
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

    const result = await CareerService.list(params.id)

    await logAudit({
      userId: user.id,
      functionCode: PERSONNEL.VIEW_DETAIL,
      action: 'LIST',
      resourceType: 'CAREER_HISTORY',
      resourceId: params.id,
      result: 'SUCCESS',
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
    })

    return NextResponse.json({ success: true, data: result.data })
  } catch (error) {
    console.error('[GET /api/personnel/[id]/career]', error)
    return NextResponse.json(
      { success: false, error: 'Lỗi khi tải lịch sử công tác' },
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

    const result = await CareerService.create(authUser, scope || 'SELF', params.id, body)

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
      resourceType: 'CAREER_HISTORY',
      resourceId: result.data.id,
      newValue: { personnelId: params.id, eventType: result.data.eventType },
      result: 'SUCCESS',
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
    })

    return NextResponse.json(
      {
        success: true,
        data: result.data,
        ...(result.warnings?.length ? { warnings: result.warnings } : {}),
      },
      { status: 201 },
    )
  } catch (error) {
    console.error('[POST /api/personnel/[id]/career]', error)
    return NextResponse.json(
      { success: false, error: 'Lỗi khi tạo bản ghi công tác' },
      { status: 500 },
    )
  }
}
