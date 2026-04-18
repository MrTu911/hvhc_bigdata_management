import { NextRequest, NextResponse } from 'next/server'
import { requireAnyFunction } from '@/lib/rbac/middleware'
import { SCIENCE } from '@/lib/rbac/function-codes'
import { financeService } from '@/lib/services/science/finance.service'
import prisma from '@/lib/db'

export const dynamic = 'force-dynamic'

interface RouteParams { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, { params }: RouteParams) {
  const auth = await requireAnyFunction(req, [SCIENCE.BUDGET_MANAGE, SCIENCE.BUDGET_VIEW_FINANCE, SCIENCE.BUDGET_APPROVE])
  if (!auth.allowed) return auth.response!

  const { id } = await params
  const grant = await financeService.getGrant(id)
  if (!grant) return NextResponse.json({ success: false, data: null, error: 'Không tìm thấy grant' }, { status: 404 })
  return NextResponse.json({ success: true, data: grant, error: null })
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const auth = await requireAnyFunction(req, [SCIENCE.BUDGET_MANAGE])
  if (!auth.allowed) return auth.response!

  const { id } = await params
  const body = await req.json()
  const { status, conditions, reportDeadline, endDate } = body

  const validStatuses = ['PENDING', 'ACTIVE', 'COMPLETED', 'TERMINATED']
  if (status && !validStatuses.includes(status)) {
    return NextResponse.json(
      { success: false, data: null, error: `status không hợp lệ` },
      { status: 400 }
    )
  }

  const updated = await prisma.nckhGrant.update({
    where: { id },
    data: {
      status: status ? (status as never) : undefined,
      conditions,
      reportDeadline: reportDeadline ? new Date(reportDeadline) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    },
  })

  return NextResponse.json({ success: true, data: { ...updated, amount: updated.amount.toString() }, error: null })
}
