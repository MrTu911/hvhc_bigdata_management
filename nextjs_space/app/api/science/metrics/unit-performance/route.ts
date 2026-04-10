/**
 * GET /api/science/metrics/unit-performance
 * Aggregate KPI cho một đơn vị hoặc toàn học viện theo năm.
 * Cache Redis 10 phút.
 *
 * Query params:
 *   unitId  – string cuid (bắt buộc trừ khi caller có ACADEMY-scope)
 *   year    – number (default: năm hiện tại)
 *
 * RBAC: SCIENCE.DASHBOARD_VIEW
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireFunction } from '@/lib/rbac/middleware'
import { authorize } from '@/lib/rbac/authorize'
import { SCIENCE } from '@/lib/rbac/function-codes'
import { kpiService } from '@/lib/services/science/kpi.service'
import { z } from 'zod'

const querySchema = z.object({
  unitId: z.string().cuid().optional(),
  year: z.coerce.number().int().min(2000).max(2100).default(new Date().getFullYear()),
})

export async function GET(req: NextRequest) {
  const auth = await requireFunction(req, SCIENCE.DASHBOARD_VIEW)
  if (!auth.allowed) return auth.response!

  const { searchParams } = new URL(req.url)
  const parsed = querySchema.safeParse({
    unitId: searchParams.get('unitId') ?? undefined,
    year: searchParams.get('year') ?? undefined,
  })

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const { unitId, year } = parsed.data

  // Academy-wide view cần PROJECT_APPROVE_ACADEMY scope
  if (!unitId) {
    const academyCheck = await authorize(auth.user!, SCIENCE.PROJECT_APPROVE_ACADEMY)
    if (!academyCheck.allowed) {
      return NextResponse.json(
        { success: false, error: 'Xem KPI toàn học viện yêu cầu quyền cấp học viện. Cung cấp unitId để xem theo đơn vị.' },
        { status: 403 }
      )
    }
    const result = await kpiService.getAcademyPerformance(year)
    return NextResponse.json({
      success: true,
      data: result.data,
      meta: { fromCache: result.fromCache },
    })
  }

  const result = await kpiService.getUnitPerformance(unitId, year)
  return NextResponse.json({
    success: true,
    data: result.data,
    meta: { fromCache: result.fromCache },
  })
}
