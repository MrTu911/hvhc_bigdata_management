import { NextRequest, NextResponse } from 'next/server'
import { requireAnyFunction } from '@/lib/rbac/middleware'
import { SCIENCE } from '@/lib/rbac/function-codes'
import { lifecycleService } from '@/lib/services/science/lifecycle.service'
import { logAudit } from '@/lib/audit'

export const dynamic = 'force-dynamic'

interface RouteParams {
  params: Promise<{ id: string }>
}

// POST /api/science/proposals/[id]/submit — nộp đề xuất (DRAFT → SUBMITTED)
export async function POST(req: NextRequest, { params }: RouteParams) {
  const auth = await requireAnyFunction(req, [SCIENCE.PROJECT_CREATE])
  if (!auth.allowed) return auth.response!

  const { id } = await params

  try {
    const updated = await lifecycleService.submitProposal(id)

    await logAudit({
      userId: auth.user!.id,
      functionCode: SCIENCE.PROJECT_CREATE,
      action: 'SUBMIT',
      resourceType: 'NckhProposal',
      resourceId: id,
      result: 'SUCCESS',
      ipAddress: req.headers.get('x-forwarded-for') ?? undefined,
    })

    return NextResponse.json({ success: true, data: updated, error: null })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Lỗi không xác định'
    return NextResponse.json({ success: false, data: null, error: message }, { status: 400 })
  }
}
