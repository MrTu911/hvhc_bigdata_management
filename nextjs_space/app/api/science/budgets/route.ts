/**
 * GET  /api/science/budgets  – Danh sách ngân sách
 * POST /api/science/budgets  – Tạo ngân sách mới (1-1 với project)
 *
 * RBAC: BUDGET_MANAGE (POST), BUDGET_VIEW_FINANCE hoặc BUDGET_MANAGE (GET)
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireFunction } from '@/lib/rbac/middleware'
import { SCIENCE } from '@/lib/rbac/function-codes'
import { budgetService } from '@/lib/services/science/budget.service'
import { budgetCreateSchema } from '@/lib/validations/science-budget'
import { z } from 'zod'

const listFilterSchema = z.object({
  year: z.coerce.number().int().optional(),
  status: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
})

export async function GET(req: NextRequest) {
  const auth = await requireFunction(req, SCIENCE.BUDGET_VIEW_FINANCE)
  if (!auth.allowed) return auth.response!

  const { searchParams } = new URL(req.url)
  const parsed = listFilterSchema.safeParse({
    year: searchParams.get('year') ?? undefined,
    status: searchParams.get('status') ?? undefined,
    page: searchParams.get('page') ?? undefined,
    pageSize: searchParams.get('pageSize') ?? undefined,
  })
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: parsed.error.flatten().fieldErrors }, { status: 400 })
  }

  const result = await budgetService.listBudgets(parsed.data)
  return NextResponse.json({
    success: true,
    data: result.data.items,
    meta: {
      total: result.data.total,
      page: parsed.data.page,
      pageSize: parsed.data.pageSize,
      totalPages: Math.ceil(result.data.total / parsed.data.pageSize),
    },
  })
}

export async function POST(req: NextRequest) {
  const auth = await requireFunction(req, SCIENCE.BUDGET_MANAGE)
  if (!auth.allowed) return auth.response!

  const body = await req.json()
  const parsed = budgetCreateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: parsed.error.flatten().fieldErrors }, { status: 400 })
  }

  const ipAddress = req.headers.get('x-forwarded-for') ?? undefined
  const result = await budgetService.createBudget(parsed.data, auth.user!.id, ipAddress)

  if (!result.success) {
    return NextResponse.json({ success: false, error: result.error }, { status: 409 })
  }
  return NextResponse.json({ success: true, data: result.data }, { status: 201 })
}
