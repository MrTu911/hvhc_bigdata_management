/**
 * GET /api/science/projects/alerts
 * Đề tài sắp hết deadline (< 30 ngày).
 * Dùng cho cronjob 06:00 hàng ngày + dashboard widget.
 *
 * RBAC: SCIENCE.PROJECT_APPROVE_DEPT (người quản lý mới được xem alert)
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireFunction } from '@/lib/rbac/middleware'
import { SCIENCE } from '@/lib/rbac/function-codes'
import { projectService } from '@/lib/services/science/project.service'

export async function GET(req: NextRequest) {
  const auth = await requireFunction(req, SCIENCE.PROJECT_APPROVE_DEPT)
  if (!auth.allowed) return auth.response!

  const { searchParams } = new URL(req.url)
  const daysAhead = Math.min(
    parseInt(searchParams.get('daysAhead') ?? '30', 10),
    90 // tối đa 90 ngày
  )

  const result = await projectService.getDeadlineAlerts(daysAhead)

  return NextResponse.json({
    success: true,
    data: result.data,
    meta: {
      daysAhead,
      count: result.data.length,
      generatedAt: new Date().toISOString(),
    },
  })
}
