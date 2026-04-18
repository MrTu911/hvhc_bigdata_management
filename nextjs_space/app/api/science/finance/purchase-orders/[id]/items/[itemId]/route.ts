import { NextRequest, NextResponse } from 'next/server'
import { requireAnyFunction } from '@/lib/rbac/middleware'
import { SCIENCE } from '@/lib/rbac/function-codes'
import { financeService } from '@/lib/services/science/finance.service'

export const dynamic = 'force-dynamic'

interface RouteParams { params: Promise<{ id: string; itemId: string }> }

// DELETE /api/science/finance/purchase-orders/[id]/items/[itemId]
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const auth = await requireAnyFunction(req, [SCIENCE.BUDGET_MANAGE])
  if (!auth.allowed) return auth.response!

  const { itemId } = await params

  try {
    await financeService.deletePOItem(itemId)
    return NextResponse.json({ success: true, data: null, error: null })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Lỗi không xác định'
    return NextResponse.json({ success: false, data: null, error: message }, { status: 400 })
  }
}
