import { NextRequest, NextResponse } from 'next/server'
import { requireAnyFunction } from '@/lib/rbac/middleware'
import { SCIENCE } from '@/lib/rbac/function-codes'
import { lifecycleService } from '@/lib/services/science/lifecycle.service'

export const dynamic = 'force-dynamic'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/science/proposals/[id]
export async function GET(req: NextRequest, { params }: RouteParams) {
  const auth = await requireAnyFunction(req, [
    SCIENCE.PROJECT_CREATE,
    SCIENCE.PROJECT_APPROVE_DEPT,
    SCIENCE.PROJECT_APPROVE_ACADEMY,
  ])
  if (!auth.allowed) return auth.response!

  const { id } = await params
  const proposal = await lifecycleService.getProposal(id)
  if (!proposal) {
    return NextResponse.json({ success: false, data: null, error: 'Không tìm thấy đề xuất' }, { status: 404 })
  }

  return NextResponse.json({ success: true, data: proposal, error: null })
}

// PUT /api/science/proposals/[id] — cập nhật đề xuất (chỉ DRAFT)
export async function PUT(req: NextRequest, { params }: RouteParams) {
  const auth = await requireAnyFunction(req, [SCIENCE.PROJECT_CREATE])
  if (!auth.allowed) return auth.response!

  const { id } = await params
  const proposal = await lifecycleService.getProposal(id)
  if (!proposal) {
    return NextResponse.json({ success: false, data: null, error: 'Không tìm thấy đề xuất' }, { status: 404 })
  }
  if (proposal.status !== 'DRAFT') {
    return NextResponse.json(
      { success: false, data: null, error: 'Chỉ có thể cập nhật đề xuất ở trạng thái DRAFT' },
      { status: 400 }
    )
  }

  const body = await req.json()
  const updated = await lifecycleService.updateProposal(id, {
    title: body.title,
    titleEn: body.titleEn,
    abstract: body.abstract,
    keywords: body.keywords,
    budgetRequested: body.budgetRequested != null ? Number(body.budgetRequested) : undefined,
    durationMonths: body.durationMonths != null ? Number(body.durationMonths) : undefined,
    reviewDeadline: body.reviewDeadline ? new Date(body.reviewDeadline) : undefined,
  })

  return NextResponse.json({ success: true, data: updated, error: null })
}
