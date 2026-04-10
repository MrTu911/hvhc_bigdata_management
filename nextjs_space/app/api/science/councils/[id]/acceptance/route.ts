/**
 * POST /api/science/councils/:id/acceptance
 * Chairman/admin finalize kết quả hội đồng: PASS | FAIL | REVISE.
 * Tính điểm trung bình từ ScientificCouncilReview nếu overallScore không được cung cấp.
 *
 * RBAC: SCIENCE.COUNCIL_FINALIZE
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireFunction } from '@/lib/rbac/middleware'
import { SCIENCE } from '@/lib/rbac/function-codes'
import { councilService } from '@/lib/services/science/council.service'
import { councilAcceptanceSchema } from '@/lib/validations/science-council'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  const auth = await requireFunction(req, SCIENCE.COUNCIL_FINALIZE)
  if (!auth.allowed) return auth.response!

  const { id } = await params
  const body = await req.json()

  const parsed = councilAcceptanceSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const ipAddress = req.headers.get('x-forwarded-for') ?? undefined
  const result = await councilService.finalizeAcceptance(id, parsed.data, auth.user!.id, ipAddress)

  if (!result.success) {
    return NextResponse.json({ success: false, error: result.error }, { status: 400 })
  }
  return NextResponse.json({ success: true, data: result.data })
}
