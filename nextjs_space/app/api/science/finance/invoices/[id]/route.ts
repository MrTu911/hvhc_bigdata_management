import { NextRequest, NextResponse } from 'next/server'
import { requireAnyFunction } from '@/lib/rbac/middleware'
import { SCIENCE } from '@/lib/rbac/function-codes'
import { financeService } from '@/lib/services/science/finance.service'

export const dynamic = 'force-dynamic'

interface RouteParams { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, { params }: RouteParams) {
  const auth = await requireAnyFunction(req, [SCIENCE.BUDGET_MANAGE, SCIENCE.BUDGET_VIEW_FINANCE, SCIENCE.BUDGET_APPROVE])
  if (!auth.allowed) return auth.response!

  const { id } = await params
  const inv = await financeService.getInvoice(id)
  if (!inv) return NextResponse.json({ success: false, data: null, error: 'Không tìm thấy hóa đơn' }, { status: 404 })
  return NextResponse.json({ success: true, data: inv, error: null })
}
