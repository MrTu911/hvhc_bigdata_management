import { NextRequest, NextResponse } from 'next/server'
import { requireAnyFunction } from '@/lib/rbac/middleware'
import { SCIENCE } from '@/lib/rbac/function-codes'
import { financeService } from '@/lib/services/science/finance.service'
import { logAudit } from '@/lib/audit'

export const dynamic = 'force-dynamic'

interface RouteParams { params: Promise<{ id: string }> }

// GET /api/science/finance/grants/[id]/disbursements
export async function GET(req: NextRequest, { params }: RouteParams) {
  const auth = await requireAnyFunction(req, [SCIENCE.BUDGET_MANAGE, SCIENCE.BUDGET_VIEW_FINANCE, SCIENCE.BUDGET_APPROVE])
  if (!auth.allowed) return auth.response!

  const { id } = await params
  const disbursements = await financeService.listDisbursements(id)
  return NextResponse.json({ success: true, data: disbursements, error: null })
}

// POST /api/science/finance/grants/[id]/disbursements — ghi nhận giải ngân
export async function POST(req: NextRequest, { params }: RouteParams) {
  const auth = await requireAnyFunction(req, [SCIENCE.BUDGET_MANAGE, SCIENCE.BUDGET_APPROVE])
  if (!auth.allowed) return auth.response!

  const { id } = await params
  const body = await req.json()
  const { disbursementDate, amount, description, receiptUrl } = body

  if (!disbursementDate || amount == null) {
    return NextResponse.json(
      { success: false, data: null, error: 'disbursementDate và amount là bắt buộc' },
      { status: 400 }
    )
  }

  try {
    const d = await financeService.createDisbursement(id, {
      disbursementDate: new Date(disbursementDate),
      amount: BigInt(String(amount)),
      description,
      receiptUrl,
    })

    await logAudit({
      userId: auth.user!.id,
      functionCode: SCIENCE.BUDGET_MANAGE,
      action: 'CREATE',
      resourceType: 'NckhGrantDisbursement',
      resourceId: d.id,
      result: 'SUCCESS',
      ipAddress: req.headers.get('x-forwarded-for') ?? undefined,
    })

    return NextResponse.json({ success: true, data: d, error: null }, { status: 201 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Lỗi không xác định'
    return NextResponse.json({ success: false, data: null, error: message }, { status: 400 })
  }
}
