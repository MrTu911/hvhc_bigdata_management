import { NextRequest, NextResponse } from 'next/server'
import { requireFunction } from '@/lib/rbac/middleware'
import { SCIENCE } from '@/lib/rbac/function-codes'
import { lifecycleService } from '@/lib/services/science/lifecycle.service'
import { logAudit } from '@/lib/audit'

export const dynamic = 'force-dynamic'

interface RouteParams {
  params: Promise<{ id: string }>
}

// POST /api/science/proposals/[id]/resubmit
// PI nộp lại đề xuất sau khi được yêu cầu sửa (REVISION_REQUESTED → SUBMITTED)
export async function POST(req: NextRequest, { params }: RouteParams) {
  const auth = await requireFunction(req, SCIENCE.PROJECT_CREATE)
  if (!auth.allowed) return auth.response!

  const { id } = await params

  try {
    const updated = await lifecycleService.resubmitProposal(id, auth.user!.id)

    await logAudit({
      userId: auth.user!.id,
      functionCode: SCIENCE.PROJECT_CREATE,
      action: 'RESUBMIT',
      resourceType: 'NckhProposal',
      resourceId: id,
      result: 'SUCCESS',
      ipAddress: req.headers.get('x-forwarded-for') ?? undefined,
    })

    return NextResponse.json({
      success: true,
      data: updated,
      error: null,
      message: `Đề xuất đã được nộp lại (lần ${updated.revisionCount})`,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Lỗi không xác định'
    return NextResponse.json({ success: false, data: null, error: message }, { status: 400 })
  }
}
