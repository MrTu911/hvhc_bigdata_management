import { NextRequest, NextResponse } from 'next/server'
import { requireAnyFunction } from '@/lib/rbac/middleware'
import { SCIENCE } from '@/lib/rbac/function-codes'
import { lifecycleService } from '@/lib/services/science/lifecycle.service'
import { logAudit } from '@/lib/audit'

export const dynamic = 'force-dynamic'

interface RouteParams {
  params: Promise<{ id: string }>
}

// POST /api/science/proposals/[id]/approve — phê duyệt hoặc từ chối đề xuất
// Body: { action: 'APPROVE' | 'REJECT', rejectReason?: string }
export async function POST(req: NextRequest, { params }: RouteParams) {
  const auth = await requireAnyFunction(req, [
    SCIENCE.PROJECT_APPROVE_DEPT,
    SCIENCE.PROJECT_APPROVE_ACADEMY,
  ])
  if (!auth.allowed) return auth.response!

  const { id } = await params
  const body = await req.json()
  const { action, rejectReason } = body

  if (!action || !['APPROVE', 'REJECT'].includes(action)) {
    return NextResponse.json(
      { success: false, data: null, error: 'action phải là APPROVE | REJECT' },
      { status: 400 }
    )
  }
  if (action === 'REJECT' && !rejectReason) {
    return NextResponse.json(
      { success: false, data: null, error: 'rejectReason là bắt buộc khi từ chối' },
      { status: 400 }
    )
  }

  // Xác định approverLevel từ function codes của user
  const userFunctions = auth.userFunctions as string[] ?? []
  const hasAcademy = userFunctions.includes(SCIENCE.PROJECT_APPROVE_ACADEMY)
  const approverLevel: 'DEPT' | 'ACADEMY' = hasAcademy ? 'ACADEMY' : 'DEPT'

  try {
    const result = await lifecycleService.approveProposal({
      proposalId: id,
      approverId: auth.user!.id,
      approverLevel,
      action,
      rejectReason,
    })

    const auditFunctionCode = hasAcademy ? SCIENCE.PROJECT_APPROVE_ACADEMY : SCIENCE.PROJECT_APPROVE_DEPT
    const auditAction = action === 'APPROVE' ? 'APPROVE' : 'REJECT'
    await logAudit({
      userId: auth.user!.id,
      functionCode: auditFunctionCode,
      action: auditAction,
      resourceType: 'NckhProposal',
      resourceId: id,
      result: 'SUCCESS',
      metadata: { approverLevel },
      ipAddress: req.headers.get('x-forwarded-for') ?? undefined,
    })

    const messages: Record<string, string> = {
      APPROVE_DEPT:    'Đề xuất đã được duyệt, chờ cấp tiếp theo',
      APPROVE_ACADEMY: 'Đề xuất đã được phê duyệt chính thức và đề tài được tạo tự động',
      REJECT:          'Đề xuất đã bị từ chối',
    }
    const msgKey = action === 'REJECT' ? 'REJECT' : `APPROVE_${approverLevel}`
    return NextResponse.json({
      success: true,
      data: result,
      error: null,
      message: messages[msgKey],
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Lỗi không xác định'
    return NextResponse.json({ success: false, data: null, error: message }, { status: 400 })
  }
}
