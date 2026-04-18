import { NextRequest, NextResponse } from 'next/server'
import { requireAnyFunction } from '@/lib/rbac/middleware'
import { SCIENCE } from '@/lib/rbac/function-codes'
import { lifecycleService } from '@/lib/services/science/lifecycle.service'
import { logAudit } from '@/lib/audit'

export const dynamic = 'force-dynamic'

interface RouteParams {
  params: Promise<{ id: string; meetId: string }>
}

// GET /api/science/councils/[id]/meetings/[meetId]/votes — tổng hợp kết quả bỏ phiếu
// Chỉ CHAIRMAN + ADMIN được xem kết quả tổng hợp
export async function GET(req: NextRequest, { params }: RouteParams) {
  const auth = await requireAnyFunction(req, [
    SCIENCE.COUNCIL_FINALIZE,
    SCIENCE.PROJECT_APPROVE_ACADEMY,
  ])
  if (!auth.allowed) return auth.response!

  const { meetId } = await params
  const summary = await lifecycleService.getVoteSummary(meetId)
  return NextResponse.json({ success: true, data: summary, error: null })
}

// POST /api/science/councils/[id]/meetings/[meetId]/votes — thành viên bỏ phiếu
export async function POST(req: NextRequest, { params }: RouteParams) {
  const auth = await requireAnyFunction(req, [
    SCIENCE.COUNCIL_SUBMIT_REVIEW,
    SCIENCE.COUNCIL_MANAGE,
    SCIENCE.COUNCIL_FINALIZE,
  ])
  if (!auth.allowed) return auth.response!

  const { meetId } = await params
  const body = await req.json()
  const { memberId, voteType, vote, score, comment } = body

  if (!memberId || !voteType || !vote) {
    return NextResponse.json(
      { success: false, data: null, error: 'memberId, voteType, vote là bắt buộc' },
      { status: 400 }
    )
  }
  if (!['APPROVE', 'REJECT', 'ABSTAIN'].includes(vote)) {
    return NextResponse.json(
      { success: false, data: null, error: 'vote phải là APPROVE | REJECT | ABSTAIN' },
      { status: 400 }
    )
  }

  const result = await lifecycleService.castVote({
    meetingId: meetId,
    memberId,
    voteType,
    vote,
    score: score != null ? Number(score) : undefined,
    comment,
  })

  await logAudit({
    userId: auth.user!.id,
    functionCode: SCIENCE.COUNCIL_SUBMIT_REVIEW,
    action: 'VOTE',
    resourceType: 'NckhMeetingVote',
    resourceId: result.id,
    result: 'SUCCESS',
    ipAddress: req.headers.get('x-forwarded-for') ?? undefined,
  })

  return NextResponse.json({ success: true, data: { id: result.id, votedAt: result.votedAt }, error: null })
}
