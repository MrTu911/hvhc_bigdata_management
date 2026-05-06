/**
 * GET    /api/officer-career/rank-declarations/[id]  — chi tiết bản khai
 * PATCH  /api/officer-career/rank-declarations/[id]  — cập nhật (chỉ DRAFT/RETURNED)
 * DELETE /api/officer-career/rank-declarations/[id]  — hủy (chỉ DRAFT)
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireFunction } from '@/lib/rbac/middleware'
import { PROMOTION } from '@/lib/rbac/function-codes'
import {
  getDeclaration,
  updateDeclarationDraft,
  cancelDeclaration,
} from '@/lib/services/personnel/rank-declaration.service'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const authResult = await requireFunction(request, PROMOTION.VIEW_OWN)
  if (!authResult.allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const declaration = await getDeclaration(params.id)
    return NextResponse.json({ success: true, data: declaration })
  } catch (e: any) {
    if (e.message === 'NOT_FOUND') return NextResponse.json({ error: 'Not found' }, { status: 404 })
    throw e
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const authResult = await requireFunction(request, PROMOTION.CREATE_SELF)
  if (!authResult.allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const { user } = authResult
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()

  try {
    const updated = await updateDeclarationDraft(params.id, body, user.id)
    return NextResponse.json({ success: true, data: updated })
  } catch (e: any) {
    if (e.message === 'NOT_FOUND') return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (e.message === 'CANNOT_EDIT_NON_DRAFT')
      return NextResponse.json({ error: 'Chỉ có thể sửa bản khai ở trạng thái DRAFT hoặc RETURNED' }, { status: 409 })
    if (e.message === 'DECLARATION_LOCKED')
      return NextResponse.json({ error: 'Bản khai đã được khóa sau khi duyệt' }, { status: 409 })
    throw e
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const authResult = await requireFunction(request, PROMOTION.SUBMIT)
  if (!authResult.allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const { user } = authResult
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const updated = await cancelDeclaration(params.id, user.id)
    return NextResponse.json({ success: true, data: updated })
  } catch (e: any) {
    if (e.message === 'NOT_FOUND') return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (e.message === 'CANNOT_CANCEL_NON_DRAFT')
      return NextResponse.json({ error: 'Chỉ có thể hủy bản khai ở trạng thái DRAFT' }, { status: 409 })
    throw e
  }
}
