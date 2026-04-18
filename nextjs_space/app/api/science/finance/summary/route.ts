import { NextRequest, NextResponse } from 'next/server'
import { requireAnyFunction } from '@/lib/rbac/middleware'
import { SCIENCE } from '@/lib/rbac/function-codes'
import { financeService } from '@/lib/services/science/finance.service'

export const dynamic = 'force-dynamic'

// GET /api/science/finance/summary
// ?projectId=xxx  → chi tiết tài chính một đề tài
// ?year=2025      → tổng hợp toàn học viện theo năm
export async function GET(req: NextRequest) {
  const auth = await requireAnyFunction(req, [
    SCIENCE.BUDGET_MANAGE,
    SCIENCE.BUDGET_VIEW_FINANCE,
    SCIENCE.BUDGET_APPROVE,
    SCIENCE.DASHBOARD_VIEW,
  ])
  if (!auth.allowed) return auth.response!

  const { searchParams } = new URL(req.url)
  const projectId = searchParams.get('projectId')
  const year = searchParams.get('year') ? Number(searchParams.get('year')) : new Date().getFullYear()

  if (projectId) {
    const summary = await financeService.getProjectFinanceSummary(projectId)
    return NextResponse.json({ success: true, data: summary, error: null })
  }

  const summary = await financeService.getAcademyFinanceSummary(year)
  return NextResponse.json({ success: true, data: summary, error: null })
}
