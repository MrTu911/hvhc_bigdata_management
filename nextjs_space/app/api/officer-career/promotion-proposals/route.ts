/**
 * GET  /api/officer-career/promotion-proposals
 * POST /api/officer-career/promotion-proposals
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireFunction } from '@/lib/rbac/middleware'
import { PROMOTION } from '@/lib/rbac/function-codes'
import {
  createPromotionProposal,
  listPromotionProposals,
  buildEligibilitySnapshot,
} from '@/lib/services/personnel/promotion-proposal.service'
import type { PromotionProposalStatus } from '@prisma/client'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const authResult = await requireFunction(request, PROMOTION.VIEW_PROPOSALS)
  if (!authResult.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const result = await listPromotionProposals({
    personnelId:     searchParams.get('personnelId')     || undefined,
    proposingUnitId: searchParams.get('proposingUnitId') || undefined,
    status: (searchParams.get('status') as PromotionProposalStatus) || undefined,
    page:  parseInt(searchParams.get('page')  || '1'),
    limit: parseInt(searchParams.get('limit') || '20'),
  })
  return NextResponse.json({ success: true, ...result })
}

export async function POST(request: NextRequest) {
  const authResult = await requireFunction(request, PROMOTION.CREATE_PROPOSAL)
  if (!authResult.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { user } = authResult
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { personnelId, proposingUnitId, proposedRank, justification } = body

  if (!personnelId || !proposingUnitId || !proposedRank || !justification) {
    return NextResponse.json({ error: 'personnelId, proposingUnitId, proposedRank, justification are required' }, { status: 400 })
  }

  const eligibilitySnap = await buildEligibilitySnapshot(personnelId)

  const proposal = await createPromotionProposal(
    { personnelId, proposedById: user.id, proposingUnitId, proposedRank, justification, eligibilitySnap },
    user.id,
  )
  return NextResponse.json({ success: true, data: proposal }, { status: 201 })
}
