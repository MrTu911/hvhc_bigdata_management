import { NextRequest, NextResponse } from 'next/server'
import { requireFunction } from '@/lib/rbac/middleware'
import { RESEARCH } from '@/lib/rbac/function-codes'
import { scientistProfileService } from '@/lib/services/scientist-profile.service'

// POST /api/research/scientists/[id]/compute-stats
// Trigger thủ công refresh chỉ số cho 1 nhà khoa học
// Yêu cầu: SCIENTIST_UPDATE (admin hoặc bản thân qua SELF scope)
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireFunction(req, RESEARCH.SCIENTIST_UPDATE)
  if (!auth.allowed) return auth.response!

  // SELF scope: chỉ được refresh của chính mình
  if (auth.authResult?.scope === 'SELF' && auth.user!.id !== params.id) {
    return NextResponse.json(
      { success: false, error: 'Không có quyền refresh chỉ số nhà khoa học khác' },
      { status: 403 }
    )
  }

  const result = await scientistProfileService.computeStats(params.id)

  if (!result.success) {
    return NextResponse.json({ success: false, error: result.error }, { status: 500 })
  }
  return NextResponse.json({ success: true, data: result.data })
}
