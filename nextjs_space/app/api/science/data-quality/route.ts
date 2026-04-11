/**
 * GET /api/science/data-quality
 *
 * Data quality monitoring report for science entities.
 * Scores: PROJECT | PUBLICATION | SCIENTIST
 * Dimensions: completeness (40%) + accuracy (40%) + timeliness (20%)
 *
 * Query params:
 *   unit — unitId (optional; omit for academy-wide)
 *
 * Cache: 30 min Redis (data quality is expensive to compute).
 *
 * RBAC: SCIENCE.DATA_QUALITY_VIEW ('VIEW_SCIENCE_DATA_QUALITY')
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireFunction } from '@/lib/rbac/middleware'
import { authorize } from '@/lib/rbac/authorize'
import { SCIENCE } from '@/lib/rbac/function-codes'
import { dataQualityService } from '@/lib/services/science/data-quality.service'

const querySchema = z.object({
  unit: z.string().cuid().optional(),
})

export async function GET(req: NextRequest) {
  const auth = await requireFunction(req, SCIENCE.DATA_QUALITY_VIEW)
  if (!auth.allowed) return auth.response!

  const user = auth.user!

  const { searchParams } = new URL(req.url)
  const parsed = querySchema.safeParse({ unit: searchParams.get('unit') ?? undefined })

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, data: null, error: parsed.error.flatten() },
      { status: 422 },
    )
  }

  const { unit } = parsed.data

  // Unit-scoped requests: verify the caller has at least UNIT-level approval rights
  if (unit) {
    const canViewUnit = await authorize(user as never, SCIENCE.PROJECT_APPROVE_DEPT)
    if (!canViewUnit.allowed) {
      return NextResponse.json(
        { success: false, data: null, error: 'Không có quyền xem chất lượng dữ liệu theo đơn vị' },
        { status: 403 },
      )
    }
  }

  const report = await dataQualityService.getReport(unit)

  return NextResponse.json({
    success: true,
    data:    report,
    meta: {
      fromCache:   report.fromCache,
      sampleSize:  200,
      thresholds: { timelinessDays: { PROJECT: 90, PUBLICATION: 180, SCIENTIST: 365 } },
    },
    error: null,
  })
}
