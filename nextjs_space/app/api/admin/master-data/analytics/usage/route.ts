/**
 * GET /api/admin/master-data/analytics/usage
 *
 * Usage analytics via proxy signals (ChangeLog activity + updatedAt + validTo).
 * No schema migration required.
 *
 * Query params:
 *   categoryCode    — scope to one category; enables unusedCandidates listing
 *   staleAfterDays  — threshold for "stale" (default: 90)
 *   limit           — max rows for unusedCandidates and recentlyModified (default: 50, max: 100)
 *   startDate       — ISO date string, filters ChangeLog activity from this date
 *   endDate         — ISO date string, filters ChangeLog activity up to this date
 *
 * Requires MANAGE_GOVERNANCE.
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireFunction } from '@/lib/rbac/middleware'
import { MASTER_DATA } from '@/lib/rbac/function-codes'
import { getUsageAnalytics } from '@/lib/services/master-data/master-data-analytics.service'

export async function GET(req: NextRequest) {
  const authResult = await requireFunction(req, MASTER_DATA.MANAGE)
  if (!authResult.allowed) return authResult.response!

  const { searchParams } = req.nextUrl
  const categoryCode = searchParams.get('categoryCode') ?? undefined
  const staleAfterDays = Math.max(
    1,
    Math.min(parseInt(searchParams.get('staleAfterDays') ?? '90'), 365)
  )
  const limit = Math.max(1, Math.min(parseInt(searchParams.get('limit') ?? '50'), 100))

  const startDateRaw = searchParams.get('startDate')
  const endDateRaw = searchParams.get('endDate')
  const startDate = startDateRaw ? new Date(startDateRaw) : undefined
  const endDate = endDateRaw ? new Date(endDateRaw) : undefined

  const result = await getUsageAnalytics(categoryCode, staleAfterDays, limit, startDate, endDate)
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: result.status })
  }
  return NextResponse.json(result.data)
}
