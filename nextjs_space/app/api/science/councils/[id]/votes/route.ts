/**
 * GET /api/science/councils/:id/votes
 * Tổng hợp phiếu bầu của hội đồng. Gợi ý kết quả theo quy tắc 2/3.
 *
 * RBAC: SCIENCE.COUNCIL_FINALIZE (chairman / admin only)
 * Security: vote field của từng thành viên là dữ liệu nhạy cảm – không public.
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireFunction } from '@/lib/rbac/middleware'
import { SCIENCE } from '@/lib/rbac/function-codes'
import { councilService } from '@/lib/services/science/council.service'
import { logAudit } from '@/lib/audit'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  const auth = await requireFunction(req, SCIENCE.COUNCIL_FINALIZE)
  if (!auth.allowed) return auth.response!

  const { id } = await params
  const ipAddress = req.headers.get('x-forwarded-for') ?? undefined

  const result = await councilService.getVoteSummary(id)
  if (!result.success) {
    return NextResponse.json({ success: false, error: result.error }, { status: 404 })
  }

  await logAudit({
    userId: auth.user!.id,
    functionCode: 'FINALIZE_ACCEPTANCE',
    action: 'READ',
    resourceType: 'COUNCIL_VOTE_SUMMARY',
    resourceId: id,
    result: 'SUCCESS',
    ipAddress,
    metadata: { total: result.data.total, voted: result.data.voted },
  })

  return NextResponse.json({ success: true, data: result.data, error: null })
}
