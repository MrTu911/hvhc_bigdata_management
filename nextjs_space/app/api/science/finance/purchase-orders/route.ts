import { NextRequest, NextResponse } from 'next/server'
import { requireAnyFunction } from '@/lib/rbac/middleware'
import { SCIENCE } from '@/lib/rbac/function-codes'
import { financeService } from '@/lib/services/science/finance.service'
import { NckhPoStatus, NckhExpenseCategory } from '@prisma/client'
import { logAudit } from '@/lib/audit'

export const dynamic = 'force-dynamic'

// GET /api/science/finance/purchase-orders
export async function GET(req: NextRequest) {
  const auth = await requireAnyFunction(req, [
    SCIENCE.BUDGET_MANAGE,
    SCIENCE.BUDGET_VIEW_FINANCE,
    SCIENCE.BUDGET_APPROVE,
  ])
  if (!auth.allowed) return auth.response!

  const { searchParams } = new URL(req.url)
  const result = await financeService.listPOs({
    projectId: searchParams.get('projectId') ?? undefined,
    status: (searchParams.get('status') as NckhPoStatus) ?? undefined,
    year: searchParams.get('year') ? Number(searchParams.get('year')) : undefined,
    page: Number(searchParams.get('page') ?? 1),
    pageSize: Math.min(Number(searchParams.get('pageSize') ?? 20), 100),
  })

  return NextResponse.json({ success: true, data: result, error: null })
}

// POST /api/science/finance/purchase-orders
export async function POST(req: NextRequest) {
  const auth = await requireAnyFunction(req, [SCIENCE.BUDGET_MANAGE])
  if (!auth.allowed) return auth.response!

  const body = await req.json()
  const { projectId, vendor, totalAmount, currency, notes, items } = body

  if (!projectId || !vendor || totalAmount == null) {
    return NextResponse.json(
      { success: false, data: null, error: 'projectId, vendor, totalAmount là bắt buộc' },
      { status: 400 }
    )
  }

  const parsedItems = items?.map((i: Record<string, unknown>) => ({
    itemName: i.itemName as string,
    quantity: Number(i.quantity),
    unitPrice: BigInt(String(i.unitPrice)),
    amount: BigInt(String(i.amount)),
    category: i.category as NckhExpenseCategory,
    unit: i.unit as string | undefined,
    notes: i.notes as string | undefined,
  }))

  const po = await financeService.createPO({
    projectId,
    vendor,
    totalAmount: BigInt(String(totalAmount)),
    currency,
    notes,
    createdById: auth.user!.id,
    items: parsedItems,
  })

  await logAudit({
    userId: auth.user!.id,
    functionCode: SCIENCE.BUDGET_MANAGE,
    action: 'CREATE',
    resourceType: 'NckhPurchaseOrder',
    resourceId: po.id,
    result: 'SUCCESS',
    ipAddress: req.headers.get('x-forwarded-for') ?? undefined,
  })

  return NextResponse.json({ success: true, data: po, error: null }, { status: 201 })
}
