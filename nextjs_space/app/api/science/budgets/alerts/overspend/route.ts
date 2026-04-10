/**
 * GET /api/science/budgets/alerts/overspend
 * Danh sách ngân sách vượt ngưỡng 90% và 100%.
 * Dùng cho dashboard widget + cronjob cảnh báo.
 *
 * RBAC: BUDGET_VIEW_FINANCE
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireFunction } from '@/lib/rbac/middleware'
import { SCIENCE } from '@/lib/rbac/function-codes'
import { budgetService } from '@/lib/services/science/budget.service'

export async function GET(req: NextRequest) {
  const auth = await requireFunction(req, SCIENCE.BUDGET_VIEW_FINANCE)
  if (!auth.allowed) return auth.response!

  const result = await budgetService.getOverspendAlerts()
  return NextResponse.json({ success: true, data: result.data })
}
