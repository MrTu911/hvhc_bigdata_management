/**
 * GET /api/science/dashboard
 *
 * Role-aware dashboard aggregation. Returns different data depending on the
 * caller's highest RBAC function code:
 *   ACADEMY   — full academy KPI, top researchers, project distribution
 *   UNIT      — unit-scoped KPI, projects, budget, works
 *   REVIEWER  — council memberships + pending reviews (no cache)
 *   RESEARCHER — own projects, publications, profile metrics
 *
 * Query params:
 *   year — academic year (default: current year)
 *
 * RBAC: SCIENCE.DASHBOARD_VIEW ('VIEW_SCIENCE_DASHBOARD')
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireFunction } from '@/lib/rbac/middleware'
import { SCIENCE } from '@/lib/rbac/function-codes'
import { dashboardService } from '@/lib/services/science/dashboard.service'

const querySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100).default(new Date().getFullYear()),
})

export async function GET(req: NextRequest) {
  const auth = await requireFunction(req, SCIENCE.DASHBOARD_VIEW)
  if (!auth.allowed) return auth.response!

  const { searchParams } = new URL(req.url)
  const parsed = querySchema.safeParse({ year: searchParams.get('year') ?? undefined })

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, data: null, error: parsed.error.flatten() },
      { status: 422 },
    )
  }

  const { year } = parsed.data
  const user = auth.user!

  const data = await dashboardService.getDashboard(
    { id: user.id, unitId: (user as { unitId?: string | null }).unitId },
    year,
  )

  return NextResponse.json({ success: true, data, error: null })
}
