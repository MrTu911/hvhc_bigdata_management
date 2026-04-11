/**
 * GET /api/science/councils/:id
 * Chi tiết hội đồng. Vote field ẩn trừ CHAIRMAN + COUNCIL_FINALIZE.
 *
 * RBAC: SCIENCE.SCIENTIST_VIEW
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireFunction } from '@/lib/rbac/middleware'
import { authorize } from '@/lib/rbac/authorize'
import { SCIENCE } from '@/lib/rbac/function-codes'
import { councilService } from '@/lib/services/science/council.service'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  const auth = await requireFunction(req, SCIENCE.SCIENTIST_VIEW)
  if (!auth.allowed) return auth.response!

  const { id } = await params

  // Votes visible: COUNCIL_FINALIZE permission (chairman / admin)
  const finalizeCheck = await authorize(auth.user!, SCIENCE.COUNCIL_FINALIZE)
  const canSeeVotes = finalizeCheck.allowed

  const result = await councilService.getCouncilById(id, {
    canSeeVotes,
    callerUserId: auth.user!.id,
  })
  if (!result.success) {
    return NextResponse.json({ success: false, error: result.error }, { status: 404 })
  }
  return NextResponse.json({ success: true, data: result.data })
}
