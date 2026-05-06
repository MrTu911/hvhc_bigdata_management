/**
 * POST /api/officer-career/promotion-proposals/[id]/submit
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireFunction } from '@/lib/rbac/middleware'
import { PROMOTION } from '@/lib/rbac/function-codes'
import { submitProposal } from '@/lib/services/personnel/promotion-proposal.service'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const authResult = await requireFunction(request, PROMOTION.CREATE_PROPOSAL)
  if (!authResult.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { user } = authResult
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const updated = await submitProposal(params.id, user.id)
    return NextResponse.json({ success: true, data: updated })
  } catch (e: any) {
    if (e.message === 'NOT_FOUND') return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (e.message === 'NOT_DRAFT') return NextResponse.json({ error: 'Đề nghị không ở trạng thái DRAFT' }, { status: 409 })
    throw e
  }
}
