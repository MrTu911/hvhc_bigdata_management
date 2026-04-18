import { NextRequest, NextResponse } from 'next/server'
import { requireAnyFunction } from '@/lib/rbac/middleware'
import { SCIENCE } from '@/lib/rbac/function-codes'
import { financeService } from '@/lib/services/science/finance.service'

export const dynamic = 'force-dynamic'

interface RouteParams { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, { params }: RouteParams) {
  const auth = await requireAnyFunction(req, [SCIENCE.BUDGET_MANAGE, SCIENCE.BUDGET_VIEW_FINANCE, SCIENCE.BUDGET_APPROVE, SCIENCE.PROJECT_CREATE])
  if (!auth.allowed) return auth.response!

  const { id } = await params
  const expense = await financeService.getExpense(id)
  if (!expense) return NextResponse.json({ success: false, data: null, error: 'Không tìm thấy chi phí' }, { status: 404 })
  return NextResponse.json({ success: true, data: expense, error: null })
}
