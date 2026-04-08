/**
 * GET /api/admin/master-data/analytics
 * Overview statistics + cache stats for MDM dashboard.
 * Requires authentication (read-only stats accessible to any admin user).
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/rbac/middleware'
import * as analyticsService from '@/lib/services/master-data/master-data-analytics.service'

export async function GET(req: NextRequest) {
  const authResult = await requireAuth(req)
  if (!authResult.allowed) return authResult.response!

  const result = await analyticsService.getAnalyticsOverview()
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: result.status })
  }
  return NextResponse.json(result.data)
}
