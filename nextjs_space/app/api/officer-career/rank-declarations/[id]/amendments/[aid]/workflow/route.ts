/**
 * POST /api/officer-career/rank-declarations/[id]/amendments/[aid]/workflow
 * Cơ quan phê duyệt / từ chối đề nghị chỉnh sửa.
 *
 * Body: { action: "APPROVE" | "REJECT", reviewNote?: string }
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireFunction } from '@/lib/rbac/middleware'
import { PROMOTION } from '@/lib/rbac/function-codes'
import { actOnAmendment, submitAmendment } from '@/lib/services/personnel/rank-declaration.service'

export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; aid: string } },
) {
  const body = await request.json()
  const { action, reviewNote } = body

  if (!['APPROVE', 'REJECT', 'SUBMIT'].includes(action)) {
    return NextResponse.json(
      { error: 'action phải là APPROVE, REJECT hoặc SUBMIT' },
      { status: 400 },
    )
  }

  if (action === 'SUBMIT') {
    const authResult = await requireFunction(request, PROMOTION.REQUEST_AMENDMENT)
    if (!authResult.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    const { user } = authResult
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    try {
      const updated = await submitAmendment(params.aid, user.id)
      return NextResponse.json({ success: true, data: updated })
    } catch (e: any) {
      if (e.message === 'NOT_FOUND') return NextResponse.json({ error: 'Not found' }, { status: 404 })
      if (e.message === 'AMENDMENT_NOT_DRAFT')
        return NextResponse.json({ error: 'Đề nghị chưa ở trạng thái DRAFT' }, { status: 409 })
      throw e
    }
  }

  // APPROVE / REJECT — requires organ permission
  const authResult = await requireFunction(request, PROMOTION.APPROVE_AMENDMENT)
  if (!authResult.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { user } = authResult
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const updated = await actOnAmendment({
      amendmentId: params.aid,
      action,
      reviewNote,
      actorId: user.id,
    })
    return NextResponse.json({ success: true, data: updated })
  } catch (e: any) {
    if (e.message === 'NOT_FOUND') return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (e.message === 'INVALID_AMENDMENT_STATUS')
      return NextResponse.json({ error: 'Trạng thái đề nghị không hợp lệ' }, { status: 409 })
    throw e
  }
}
