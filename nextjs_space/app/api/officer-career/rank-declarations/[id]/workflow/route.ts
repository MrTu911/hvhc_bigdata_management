/**
 * POST /api/officer-career/rank-declarations/[id]/workflow
 * Cơ quan quản lý phê duyệt / từ chối / trả lại bản khai.
 *
 * Body: { action: "APPROVE" | "REJECT" | "RETURN", comment?: string }
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireFunction } from '@/lib/rbac/middleware'
import { PROMOTION } from '@/lib/rbac/function-codes'
import { actOnDeclaration } from '@/lib/services/personnel/rank-declaration.service'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const authResult = await requireFunction(request, PROMOTION.APPROVE)
  if (!authResult.allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const { user } = authResult
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { action, comment } = body

  if (!['APPROVE', 'REJECT', 'RETURN'].includes(action)) {
    return NextResponse.json(
      { error: 'action phải là APPROVE, REJECT hoặc RETURN' },
      { status: 400 },
    )
  }

  try {
    const updated = await actOnDeclaration({
      declarationId: params.id,
      action,
      comment,
      actorId: user.id,
    })
    return NextResponse.json({ success: true, data: updated })
  } catch (e: any) {
    if (e.message === 'NOT_FOUND') return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (e.message === 'INVALID_STATUS_FOR_ACTION')
      return NextResponse.json({ error: 'Trạng thái bản khai không cho phép hành động này' }, { status: 409 })
    if (e.message === 'OFFICER_CAREER_NOT_FOUND')
      return NextResponse.json({ error: 'Không tìm thấy hồ sơ sĩ quan' }, { status: 422 })
    if (e.message === 'SOLDIER_PROFILE_NOT_FOUND')
      return NextResponse.json({ error: 'Không tìm thấy hồ sơ quân nhân' }, { status: 422 })
    throw e
  }
}
