import { NextRequest, NextResponse } from 'next/server'
import { requireAnyFunction } from '@/lib/rbac/middleware'
import { SCIENCE } from '@/lib/rbac/function-codes'
import { lifecycleService } from '@/lib/services/science/lifecycle.service'
import { logAudit } from '@/lib/audit'

export const dynamic = 'force-dynamic'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/science/projects/[id]/midterm — xem đánh giá giữa kỳ
export async function GET(req: NextRequest, { params }: RouteParams) {
  const auth = await requireAnyFunction(req, [
    SCIENCE.PROJECT_CREATE,
    SCIENCE.PROJECT_APPROVE_DEPT,
    SCIENCE.PROJECT_APPROVE_ACADEMY,
    SCIENCE.COUNCIL_MANAGE,
  ])
  if (!auth.allowed) return auth.response!

  const { id } = await params
  const review = await lifecycleService.getMidtermReview(id)
  return NextResponse.json({ success: true, data: review ?? null, error: null })
}

// POST /api/science/projects/[id]/midterm — tạo đánh giá giữa kỳ
export async function POST(req: NextRequest, { params }: RouteParams) {
  const auth = await requireAnyFunction(req, [
    SCIENCE.PROJECT_APPROVE_DEPT,
    SCIENCE.PROJECT_APPROVE_ACADEMY,
    SCIENCE.COUNCIL_FINALIZE,
  ])
  if (!auth.allowed) return auth.response!

  const { id } = await params
  const body = await req.json()
  const {
    councilId,
    reviewDate,
    overallScore,
    scientificScore,
    progressScore,
    budgetScore,
    recommendation,
    adjustmentRequired,
    adjustmentNote,
    conclusionText,
  } = body

  if (!reviewDate || !recommendation) {
    return NextResponse.json(
      { success: false, data: null, error: 'reviewDate và recommendation là bắt buộc' },
      { status: 400 }
    )
  }
  if (!['CONTINUE', 'ADJUST', 'TERMINATE'].includes(recommendation)) {
    return NextResponse.json(
      { success: false, data: null, error: 'recommendation phải là CONTINUE | ADJUST | TERMINATE' },
      { status: 400 }
    )
  }

  try {
    const review = await lifecycleService.createMidtermReview({
      projectId: id,
      councilId,
      reviewDate: new Date(reviewDate),
      overallScore: overallScore != null ? Number(overallScore) : undefined,
      scientificScore: scientificScore != null ? Number(scientificScore) : undefined,
      progressScore: progressScore != null ? Number(progressScore) : undefined,
      budgetScore: budgetScore != null ? Number(budgetScore) : undefined,
      recommendation,
      adjustmentRequired: Boolean(adjustmentRequired),
      adjustmentNote,
      conclusionText,
      approvedById: auth.user!.id,
    })

    await logAudit({
      userId: auth.user!.id,
      functionCode: SCIENCE.COUNCIL_FINALIZE,
      action: 'CREATE',
      resourceType: 'NckhMidtermReview',
      resourceId: review.id,
      result: 'SUCCESS',
      ipAddress: req.headers.get('x-forwarded-for') ?? undefined,
    })

    return NextResponse.json({ success: true, data: review, error: null }, { status: 201 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Lỗi không xác định'
    return NextResponse.json({ success: false, data: null, error: message }, { status: 400 })
  }
}
