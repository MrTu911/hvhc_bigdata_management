/**
 * POST /api/science/councils/:id/review
 * Thành viên hội đồng nộp điểm chấm + phiếu bầu kín.
 *
 * RBAC: SCIENCE.COUNCIL_SUBMIT_REVIEW
 * Guard: caller phải là thành viên của hội đồng này (enforced tại service).
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireFunction } from '@/lib/rbac/middleware'
import { SCIENCE } from '@/lib/rbac/function-codes'
import { councilService } from '@/lib/services/science/council.service'
import { councilReviewSubmitSchema } from '@/lib/validations/science-council'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  const auth = await requireFunction(req, SCIENCE.COUNCIL_SUBMIT_REVIEW)
  if (!auth.allowed) return auth.response!

  const { id } = await params
  const body = await req.json()

  const parsed = councilReviewSubmitSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const ipAddress = req.headers.get('x-forwarded-for') ?? undefined
  const result = await councilService.submitMemberReview(
    id,
    auth.user!.id,
    parsed.data,
    ipAddress
  )

  if (!result.success) {
    return NextResponse.json({ success: false, error: result.error }, { status: 403 })
  }
  return NextResponse.json({ success: true })
}
