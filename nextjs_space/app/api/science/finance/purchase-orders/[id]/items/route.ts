import { NextRequest, NextResponse } from 'next/server'
import { requireAnyFunction } from '@/lib/rbac/middleware'
import { SCIENCE } from '@/lib/rbac/function-codes'
import { financeService } from '@/lib/services/science/finance.service'
import { NckhExpenseCategory } from '@prisma/client'

export const dynamic = 'force-dynamic'

interface RouteParams { params: Promise<{ id: string }> }

// POST /api/science/finance/purchase-orders/[id]/items — thêm item vào PO
export async function POST(req: NextRequest, { params }: RouteParams) {
  const auth = await requireAnyFunction(req, [SCIENCE.BUDGET_MANAGE])
  if (!auth.allowed) return auth.response!

  const { id } = await params
  const body = await req.json()
  const { itemName, quantity, unitPrice, amount, category, unit, notes } = body

  if (!itemName || quantity == null || unitPrice == null || amount == null || !category) {
    return NextResponse.json(
      { success: false, data: null, error: 'itemName, quantity, unitPrice, amount, category là bắt buộc' },
      { status: 400 }
    )
  }

  const validCategories = ['PERSONNEL', 'EQUIPMENT', 'TRAVEL', 'OVERHEAD', 'PRINTING', 'OTHER']
  if (!validCategories.includes(category)) {
    return NextResponse.json(
      { success: false, data: null, error: `category phải là ${validCategories.join(' | ')}` },
      { status: 400 }
    )
  }

  try {
    const item = await financeService.addPOItem(id, {
      itemName,
      quantity: Number(quantity),
      unitPrice: BigInt(String(unitPrice)),
      amount: BigInt(String(amount)),
      category: category as NckhExpenseCategory,
      unit,
      notes,
    })

    return NextResponse.json({
      success: true,
      data: { ...item, unitPrice: item.unitPrice.toString(), amount: item.amount.toString() },
      error: null,
    }, { status: 201 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Lỗi không xác định'
    return NextResponse.json({ success: false, data: null, error: message }, { status: 400 })
  }
}
