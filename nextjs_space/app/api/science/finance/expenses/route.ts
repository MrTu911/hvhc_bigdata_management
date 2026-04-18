import { NextRequest, NextResponse } from 'next/server'
import { requireAnyFunction } from '@/lib/rbac/middleware'
import { SCIENCE } from '@/lib/rbac/function-codes'
import { financeService } from '@/lib/services/science/finance.service'
import { NckhExpenseStatus, NckhExpenseCategory } from '@prisma/client'
import { logAudit } from '@/lib/audit'

export const dynamic = 'force-dynamic'

const VALID_CATEGORIES = ['PERSONNEL', 'EQUIPMENT', 'TRAVEL', 'OVERHEAD', 'PRINTING', 'OTHER']

export async function GET(req: NextRequest) {
  const auth = await requireAnyFunction(req, [SCIENCE.BUDGET_MANAGE, SCIENCE.BUDGET_VIEW_FINANCE, SCIENCE.BUDGET_APPROVE, SCIENCE.PROJECT_CREATE])
  if (!auth.allowed) return auth.response!

  const { searchParams } = new URL(req.url)
  const result = await financeService.listExpenses({
    projectId: searchParams.get('projectId') ?? undefined,
    status: (searchParams.get('status') as NckhExpenseStatus) ?? undefined,
    category: (searchParams.get('category') as NckhExpenseCategory) ?? undefined,
    year: searchParams.get('year') ? Number(searchParams.get('year')) : undefined,
    page: Number(searchParams.get('page') ?? 1),
    pageSize: Math.min(Number(searchParams.get('pageSize') ?? 20), 100),
  })

  return NextResponse.json({ success: true, data: result, error: null })
}

export async function POST(req: NextRequest) {
  const auth = await requireAnyFunction(req, [SCIENCE.BUDGET_MANAGE, SCIENCE.PROJECT_CREATE])
  if (!auth.allowed) return auth.response!

  const body = await req.json()
  const { projectId, expenseDate, category, amount, description, receiptUrl } = body

  if (!projectId || !expenseDate || !category || amount == null || !description) {
    return NextResponse.json(
      { success: false, data: null, error: 'projectId, expenseDate, category, amount, description là bắt buộc' },
      { status: 400 }
    )
  }
  if (!VALID_CATEGORIES.includes(category)) {
    return NextResponse.json(
      { success: false, data: null, error: `category không hợp lệ` },
      { status: 400 }
    )
  }

  const expense = await financeService.createExpense({
    projectId,
    expenseDate: new Date(expenseDate),
    category: category as NckhExpenseCategory,
    amount: BigInt(String(amount)),
    description,
    receiptUrl,
    submittedById: auth.user!.id,
  })

  await logAudit({
    userId: auth.user!.id,
    functionCode: SCIENCE.BUDGET_MANAGE,
    action: 'CREATE',
    resourceType: 'NckhExpense',
    resourceId: expense.id,
    result: 'SUCCESS',
    ipAddress: req.headers.get('x-forwarded-for') ?? undefined,
  })

  return NextResponse.json({ success: true, data: expense, error: null }, { status: 201 })
}
