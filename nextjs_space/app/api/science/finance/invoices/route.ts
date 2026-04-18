import { NextRequest, NextResponse } from 'next/server'
import { requireAnyFunction } from '@/lib/rbac/middleware'
import { SCIENCE } from '@/lib/rbac/function-codes'
import { financeService } from '@/lib/services/science/finance.service'
import { NckhInvoiceStatus, NckhExpenseCategory } from '@prisma/client'
import { logAudit } from '@/lib/audit'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const auth = await requireAnyFunction(req, [SCIENCE.BUDGET_MANAGE, SCIENCE.BUDGET_VIEW_FINANCE, SCIENCE.BUDGET_APPROVE])
  if (!auth.allowed) return auth.response!

  const { searchParams } = new URL(req.url)
  const result = await financeService.listInvoices({
    projectId: searchParams.get('projectId') ?? undefined,
    status: (searchParams.get('status') as NckhInvoiceStatus) ?? undefined,
    year: searchParams.get('year') ? Number(searchParams.get('year')) : undefined,
    page: Number(searchParams.get('page') ?? 1),
    pageSize: Math.min(Number(searchParams.get('pageSize') ?? 20), 100),
  })

  return NextResponse.json({ success: true, data: result, error: null })
}

export async function POST(req: NextRequest) {
  const auth = await requireAnyFunction(req, [SCIENCE.BUDGET_MANAGE])
  if (!auth.allowed) return auth.response!

  const body = await req.json()
  const { projectId, poId, vendor, invoiceDate, dueDate, totalAmount, currency, notes, items } = body

  if (!projectId || !vendor || !invoiceDate || totalAmount == null) {
    return NextResponse.json(
      { success: false, data: null, error: 'projectId, vendor, invoiceDate, totalAmount là bắt buộc' },
      { status: 400 }
    )
  }

  const parsedItems = items?.map((i: Record<string, unknown>) => ({
    description: i.description as string,
    quantity: Number(i.quantity),
    unitPrice: BigInt(String(i.unitPrice)),
    amount: BigInt(String(i.amount)),
    category: i.category as NckhExpenseCategory,
  }))

  const inv = await financeService.createInvoice({
    projectId,
    poId,
    vendor,
    invoiceDate: new Date(invoiceDate),
    dueDate: dueDate ? new Date(dueDate) : undefined,
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
    resourceType: 'NckhInvoice',
    resourceId: inv.id,
    result: 'SUCCESS',
    ipAddress: req.headers.get('x-forwarded-for') ?? undefined,
  })

  return NextResponse.json({ success: true, data: inv, error: null }, { status: 201 })
}
