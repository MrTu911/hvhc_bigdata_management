/**
 * GET   /api/science/budgets/:id  – Chi tiết ngân sách
 * PATCH /api/science/budgets/:id  – Cập nhật / ghi nhận chi tiêu / phê duyệt
 *
 * Dùng query param ?action= để phân biệt:
 *   (không có) → cập nhật fields / line items
 *   ?action=spend   → ghi nhận chi tiêu cho 1 line item
 *   ?action=approve → chuyển status APPROVED/FINALIZED
 *
 * RBAC: BUDGET_MANAGE (PATCH), BUDGET_APPROVE (approve action)
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireFunction } from '@/lib/rbac/middleware'
import { SCIENCE } from '@/lib/rbac/function-codes'
import { budgetService } from '@/lib/services/science/budget.service'
import {
  budgetUpdateSchema,
  lineItemSpendSchema,
  budgetStatusUpdateSchema,
} from '@/lib/validations/science-budget'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  const auth = await requireFunction(req, SCIENCE.BUDGET_VIEW_FINANCE)
  if (!auth.allowed) return auth.response!

  const { id } = await params
  const budget = await import('@/lib/repositories/science/budget.repo').then(
    ({ budgetRepo }) => budgetRepo.findById(id)
  )
  if (!budget) return NextResponse.json({ success: false, error: 'Không tìm thấy ngân sách' }, { status: 404 })
  return NextResponse.json({ success: true, data: budget })
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const { id } = await params
  const { searchParams } = new URL(req.url)
  const action = searchParams.get('action')
  const ipAddress = req.headers.get('x-forwarded-for') ?? undefined
  const body = await req.json()

  if (action === 'approve') {
    const auth = await requireFunction(req, SCIENCE.BUDGET_APPROVE)
    if (!auth.allowed) return auth.response!

    const parsed = budgetStatusUpdateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.flatten().fieldErrors }, { status: 400 })
    }

    const result = await budgetService.approveBudget(id, parsed.data, auth.user!.id, ipAddress)
    if (!result.success) return NextResponse.json({ success: false, error: result.error }, { status: 400 })
    return NextResponse.json({ success: true, data: result.data })
  }

  // Default: requires BUDGET_MANAGE
  const auth = await requireFunction(req, SCIENCE.BUDGET_MANAGE)
  if (!auth.allowed) return auth.response!

  if (action === 'spend') {
    const parsed = lineItemSpendSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.flatten().fieldErrors }, { status: 400 })
    }
    const result = await budgetService.recordSpend(parsed.data, auth.user!.id, ipAddress)
    if (!result.success) return NextResponse.json({ success: false, error: result.error }, { status: 400 })
    return NextResponse.json({ success: true, data: result.data })
  }

  const parsed = budgetUpdateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: parsed.error.flatten().fieldErrors }, { status: 400 })
  }
  const result = await budgetService.updateBudget(id, parsed.data, auth.user!.id, ipAddress)
  if (!result.success) return NextResponse.json({ success: false, error: result.error }, { status: 400 })
  return NextResponse.json({ success: true, data: result.data })
}
