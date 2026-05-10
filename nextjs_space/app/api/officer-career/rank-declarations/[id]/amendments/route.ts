/**
 * GET  /api/officer-career/rank-declarations/[id]/amendments  — danh sách đề nghị chỉnh sửa
 * POST /api/officer-career/rank-declarations/[id]/amendments  — tạo đề nghị chỉnh sửa mới
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireFunction } from '@/lib/rbac/middleware'
import { PROMOTION } from '@/lib/rbac/function-codes'
import {
  requestAmendment,
} from '@/lib/services/personnel/rank-declaration.service'
import { listAmendmentsByDeclaration } from '@/lib/repositories/personnel/rank-declaration.repo'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const authResult = await requireFunction(request, PROMOTION.VIEW_OWN)
  if (!authResult.allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const amendments = await listAmendmentsByDeclaration(params.id)
  return NextResponse.json({ success: true, data: amendments })
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const authResult = await requireFunction(request, PROMOTION.REQUEST_AMENDMENT)
  if (!authResult.allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const { user } = authResult
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { requestedChanges, reason } = body

  if (!requestedChanges || !reason) {
    return NextResponse.json({ error: 'requestedChanges và reason là bắt buộc' }, { status: 400 })
  }

  try {
    const amendment = await requestAmendment({
      declarationId: params.id,
      requestedChanges,
      reason,
      requestedBy: user.id,
    })
    return NextResponse.json({ success: true, data: amendment }, { status: 201 })
  } catch (e: any) {
    if (e.message === 'NOT_FOUND') return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (e.message === 'DECLARATION_NOT_APPROVED_OR_NOT_LOCKED')
      return NextResponse.json({ error: 'Chỉ có thể đề nghị chỉnh sửa bản khai đã được phê duyệt' }, { status: 409 })
    throw e
  }
}
