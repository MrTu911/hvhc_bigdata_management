import { NextRequest, NextResponse } from 'next/server'
import { requireAnyFunction } from '@/lib/rbac/middleware'
import { SCIENCE } from '@/lib/rbac/function-codes'
import { financeService } from '@/lib/services/science/finance.service'
import { logAudit } from '@/lib/audit'

export const dynamic = 'force-dynamic'

interface RouteParams { params: Promise<{ id: string }> }

// POST /api/science/finance/invoices/[id]/pay — thanh toán hóa đơn + cập nhật ResearchBudget
export async function POST(req: NextRequest, { params }: RouteParams) {
  const auth = await requireAnyFunction(req, [SCIENCE.BUDGET_APPROVE, SCIENCE.BUDGET_MANAGE])
  if (!auth.allowed) return auth.response!

  const { id } = await params

  try {
    const updated = await financeService.payInvoice(id, auth.user!.id)

    await logAudit({
      userId: auth.user!.id,
      functionCode: SCIENCE.BUDGET_APPROVE,
      action: 'PAY',
      resourceType: 'NckhInvoice',
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
