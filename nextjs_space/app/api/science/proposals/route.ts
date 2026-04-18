import { NextRequest, NextResponse } from 'next/server'
import { requireAnyFunction } from '@/lib/rbac/middleware'
import { SCIENCE } from '@/lib/rbac/function-codes'
import { lifecycleService } from '@/lib/services/science/lifecycle.service'
import { logAudit } from '@/lib/audit'
import prisma from '@/lib/db'

export const dynamic = 'force-dynamic'

// GET /api/science/proposals — danh sách đề xuất NCKH
export async function GET(req: NextRequest) {
  const auth = await requireAnyFunction(req, [
    SCIENCE.PROJECT_CREATE,
    SCIENCE.PROJECT_APPROVE_DEPT,
    SCIENCE.PROJECT_APPROVE_ACADEMY,
  ])
  if (!auth.allowed) return auth.response!

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') ?? undefined
  const unitId = searchParams.get('unitId') ?? undefined
  const piId = searchParams.get('piId') ?? undefined
  const year = searchParams.get('year') ? Number(searchParams.get('year')) : undefined
  const page = Number(searchParams.get('page') ?? 1)
  const pageSize = Math.min(Number(searchParams.get('pageSize') ?? 20), 100)

  const [result, pendingCount] = await Promise.all([
    lifecycleService.listProposals({ status: status as never, unitId, piId, year, page, pageSize }),
    prisma.nckhProposal.count({ where: { status: 'SUBMITTED' } }),
  ])

  return NextResponse.json({ success: true, data: { ...result, meta: { pendingCount } }, error: null })
}

// POST /api/science/proposals — tạo đề xuất mới
export async function POST(req: NextRequest) {
  const auth = await requireAnyFunction(req, [SCIENCE.PROJECT_CREATE])
  if (!auth.allowed) return auth.response!

  const body = await req.json()
  const { title, titleEn, abstract, keywords, researchType, category, field, budgetRequested, durationMonths, unitId, reviewDeadline } = body

  if (!title || !researchType || !category || !field || !budgetRequested || !durationMonths) {
    return NextResponse.json(
      { success: false, data: null, error: 'Thiếu thông tin bắt buộc: title, researchType, category, field, budgetRequested, durationMonths' },
      { status: 400 }
    )
  }

  const proposal = await lifecycleService.createProposal({
    title,
    titleEn,
    abstract,
    keywords,
    researchType,
    category,
    field,
    budgetRequested: Number(budgetRequested),
    durationMonths: Number(durationMonths),
    piId: auth.user!.id,
    unitId,
    reviewDeadline: reviewDeadline ? new Date(reviewDeadline) : undefined,
  })

  await logAudit({
    userId: auth.user!.id,
    functionCode: SCIENCE.PROJECT_CREATE,
    action: 'CREATE',
    resourceType: 'NckhProposal',
    resourceId: proposal.id,
    result: 'SUCCESS',
    ipAddress: req.headers.get('x-forwarded-for') ?? undefined,
  })

  return NextResponse.json({ success: true, data: proposal, error: null }, { status: 201 })
}
