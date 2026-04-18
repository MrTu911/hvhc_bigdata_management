import { NextRequest, NextResponse } from 'next/server'
import { requireAnyFunction } from '@/lib/rbac/middleware'
import { SCIENCE } from '@/lib/rbac/function-codes'
import { financeService } from '@/lib/services/science/finance.service'
import { NckhGrantStatus } from '@prisma/client'
import { logAudit } from '@/lib/audit'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const auth = await requireAnyFunction(req, [SCIENCE.BUDGET_MANAGE, SCIENCE.BUDGET_VIEW_FINANCE, SCIENCE.BUDGET_APPROVE])
  if (!auth.allowed) return auth.response!

  const { searchParams } = new URL(req.url)
  const result = await financeService.listGrants({
    projectId: searchParams.get('projectId') ?? undefined,
    status: (searchParams.get('status') as NckhGrantStatus) ?? undefined,
    page: Number(searchParams.get('page') ?? 1),
    pageSize: Math.min(Number(searchParams.get('pageSize') ?? 20), 100),
  })

  return NextResponse.json({ success: true, data: result, error: null })
}

export async function POST(req: NextRequest) {
  const auth = await requireAnyFunction(req, [SCIENCE.BUDGET_MANAGE])
  if (!auth.allowed) return auth.response!

  const body = await req.json()
  const { projectId, grantor, grantorType, amount, currency, startDate, endDate, conditions, reportDeadline } = body

  if (!projectId || !grantor || amount == null || !startDate || !endDate) {
    return NextResponse.json(
      { success: false, data: null, error: 'projectId, grantor, amount, startDate, endDate là bắt buộc' },
      { status: 400 }
    )
  }

  const grant = await financeService.createGrant({
    projectId,
    grantor,
    grantorType,
    amount: BigInt(String(amount)),
    currency,
    startDate: new Date(startDate),
    endDate: new Date(endDate),
    conditions,
    reportDeadline: reportDeadline ? new Date(reportDeadline) : undefined,
    createdById: auth.user!.id,
  })

  await logAudit({
    userId: auth.user!.id,
    functionCode: SCIENCE.BUDGET_MANAGE,
    action: 'CREATE',
    resourceType: 'NckhGrant',
    resourceId: grant.id,
    result: 'SUCCESS',
    ipAddress: req.headers.get('x-forwarded-for') ?? undefined,
  })

  return NextResponse.json({ success: true, data: grant, error: null }, { status: 201 })
}
