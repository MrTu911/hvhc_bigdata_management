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
  const po = await financeService.getPO(id)
  if (!po) return NextResponse.json({ success: false, data: null, error: 'Không tìm thấy PO' }, { status: 404 })
  return NextResponse.json({ success: true, data: po, error: null })
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  const auth = await requireAnyFunction(req, [SCIENCE.BUDGET_MANAGE])
  if (!auth.allowed) return auth.response!

  const { id } = await params
  const body = await req.json()

  const updated = await financeService.approvePO({
    poId: id,
    approverId: auth.user!.id,
    action: body.action,
  })

  return NextResponse.json({ success: true, data: { ...updated, totalAmount: updated.totalAmount.toString() }, error: null })
}
