import { NextRequest, NextResponse } from 'next/server'
import { requireAnyFunction } from '@/lib/rbac/middleware'
import { SCIENCE } from '@/lib/rbac/function-codes'
import { financeService } from '@/lib/services/science/finance.service'
import { logAudit } from '@/lib/audit'

export const dynamic = 'force-dynamic'

interface RouteParams { params: Promise<{ id: string }> }

// POST /api/science/finance/purchase-orders/[id]/approve
// Body: { action: 'APPROVE' | 'RECEIVE' | 'CANCEL' }
export async function POST(req: NextRequest, { params }: RouteParams) {
  const auth = await requireAnyFunction(req, [SCIENCE.BUDGET_APPROVE, SCIENCE.BUDGET_MANAGE])
  if (!auth.allowed) return auth.response!

  const { id } = await params
  const body = await req.json()
  const { action } = body

  if (!action || !['APPROVE', 'RECEIVE', 'CANCEL'].includes(action)) {
    return NextResponse.json(
      { success: false, data: null, error: 'action phải là APPROVE | RECEIVE | CANCEL' },
      { status: 400 }
    )
  }

  try {
    const updated = await financeService.approvePO({ poId: id, approverId: auth.user!.id, action })

    await logAudit({
      userId: auth.user!.id,
      functionCode: SCIENCE.BUDGET_APPROVE,
      action: action as string,
      resourceType: 'NckhPurchaseOrder',
      resourceId: id,
      result: 'SUCCESS',
      ipAddress: req.headers.get('x-forwarded-for') ?? undefined,
    })

    return NextResponse.json({ success: true, data: { ...updated, totalAmount: updated.totalAmount.toString() }, error: null })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Lỗi không xác định'
    return NextResponse.json({ success: false, data: null, error: message }, { status: 400 })
  }
}
