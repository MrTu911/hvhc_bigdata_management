import { NextRequest, NextResponse } from 'next/server'
import { requireAnyFunction } from '@/lib/rbac/middleware'
import { SCIENCE } from '@/lib/rbac/function-codes'
import { lifecycleService } from '@/lib/services/science/lifecycle.service'
import { logAudit } from '@/lib/audit'

export const dynamic = 'force-dynamic'

interface RouteParams {
  params: Promise<{ id: string }>
}

// POST /api/science/proposals/[id]/review — nộp phản biện đề xuất
export async function POST(req: NextRequest, { params }: RouteParams) {
  const auth = await requireAnyFunction(req, [
    SCIENCE.COUNCIL_SUBMIT_REVIEW,
    SCIENCE.PROJECT_APPROVE_DEPT,
    SCIENCE.PROJECT_APPROVE_ACADEMY,
  ])
  if (!auth.allowed) return auth.response!

  const { id } = await params
  const body = await req.json()
  const { score, comment, recommendation } = body

  if (!recommendation || !['APPROVE', 'REJECT', 'REVISE'].includes(recommendation)) {
    return NextResponse.json(
      { success: false, data: null, error: 'recommendation phải là APPROVE | REJECT | REVISE' },
      { status: 400 }
    )
  }

  try {
    const review = await lifecycleService.reviewProposal({
      proposalId: id,
      reviewerId: auth.user!.id,
      score: score != null ? Number(score) : undefined,
      comment,
      recommendation,
    })

    await logAudit({
      userId: auth.user!.id,
      functionCode: SCIENCE.COUNCIL_SUBMIT_REVIEW,
      action: 'REVIEW',
      resourceType: 'NckhProposal',
      resourceId: id,
      result: 'SUCCESS',
      ipAddress: req.headers.get('x-forwarded-for') ?? undefined,
    })

    return NextResponse.json({ success: true, data: review, error: null })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Lỗi không xác định'
    return NextResponse.json({ success: false, data: null, error: message }, { status: 400 })
  }
}
