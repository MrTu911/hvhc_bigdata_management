/**
 * POST /api/officer-career/rank-declarations/[id]/submit
 * Nộp bản khai lên cơ quan quản lý để duyệt.
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireFunction } from '@/lib/rbac/middleware'
import { PROMOTION } from '@/lib/rbac/function-codes'
import { submitDeclaration } from '@/lib/services/personnel/rank-declaration.service'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const authResult = await requireFunction(request, PROMOTION.SUBMIT)
  if (!authResult.allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const { user } = authResult
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const updated = await submitDeclaration(params.id, user.id)
    return NextResponse.json({ success: true, data: updated })
  } catch (e: any) {
    if (e.message === 'NOT_FOUND') return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (e.message === 'CANNOT_SUBMIT_FROM_CURRENT_STATUS')
      return NextResponse.json({ error: 'Không thể nộp bản khai từ trạng thái hiện tại' }, { status: 409 })
    if (e.message === 'PERSONNEL_NO_MANAGING_ORGAN')
      return NextResponse.json({ error: 'Cán bộ chưa được gán cơ quan quản lý' }, { status: 422 })
    throw e
  }
}
