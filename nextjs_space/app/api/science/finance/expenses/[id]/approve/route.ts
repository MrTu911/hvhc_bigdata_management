import { NextRequest, NextResponse } from 'next/server'
import { requireAnyFunction } from '@/lib/rbac/middleware'
import { SCIENCE } from '@/lib/rbac/function-codes'
import { financeService } from '@/lib/services/science/finance.service'
import { logAudit } from '@/lib/audit'

export const dynamic = 'force-dynamic'

interface RouteParams { params: Promise<{ id: string }> }

// POST /api/science/finance/expenses/[id]/approve
// Body: { action: 'APPROVE' | 'REJECT', rejectReason?: string }
export async function POST(req: NextRequest, { params }: RouteParams) {
  const auth = await requireAnyFunction(req, [SCIENCE.BUDGET_APPROVE, SCIENCE.BUDGET_MANAGE])
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

  try {
    const result = await financeService.resolveExpense({
      expenseId: id,
      approverId: auth.user!.id,
      action,
      rejectReason,
    })

    await logAudit({
      userId: auth.user!.id,
      functionCode: SCIENCE.BUDGET_APPROVE,
      action: action as string,
      resourceType: 'NckhExpense',
      resourceId: id,
      result: 'SUCCESS',
      ipAddress: req.headers.get('x-forwarded-for') ?? undefined,
    })

    return NextResponse.json({ success: true, data: result, error: null })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Lỗi không xác định'
    return NextResponse.json({ success: false, data: null, error: message }, { status: 400 })
  }
}
