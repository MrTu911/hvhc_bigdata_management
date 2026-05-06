/**
 * POST /api/officer-career/promotion-proposals/[id]/respond
 * Body: { action: "ACKNOWLEDGE" | "APPROVE" | "REJECT", responseNote?: string }
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireFunction } from '@/lib/rbac/middleware'
import { PROMOTION } from '@/lib/rbac/function-codes'
import { respondToProposal } from '@/lib/services/personnel/promotion-proposal.service'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const authResult = await requireFunction(request, PROMOTION.APPROVE_PROPOSAL)
  if (!authResult.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { user } = authResult
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { action, responseNote } = body

  if (!['ACKNOWLEDGE', 'APPROVE', 'REJECT'].includes(action)) {
    return NextResponse.json({ error: 'action phải là ACKNOWLEDGE, APPROVE hoặc REJECT' }, { status: 400 })
  }

  try {
    const updated = await respondToProposal(params.id, action, responseNote, user.id)
    return NextResponse.json({ success: true, data: updated })
  } catch (e: any) {
    if (e.message === 'NOT_FOUND') return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (e.message === 'INVALID_STATUS') return NextResponse.json({ error: 'Đề nghị chưa ở trạng thái SUBMITTED' }, { status: 409 })
    throw e
  }
}
