/**
 * GET /api/science/records/overview – M22 Data Hub KPI Overview
 *
 * Trả về số liệu tổng hợp của kho dữ liệu khoa học:
 *   totalProjects, totalScientists, totalWorks, totalPublications,
 *   totalLibraryItems, totalCatalogs, activeProjects, completedProjects
 *
 * RBAC: SCIENCE.SCIENTIST_VIEW
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireFunction } from '@/lib/rbac/middleware'
import { SCIENCE } from '@/lib/rbac/function-codes'
import { unifiedService } from '@/lib/services/science/unified.service'

export async function GET(req: NextRequest) {
  const auth = await requireFunction(req, SCIENCE.SCIENTIST_VIEW)
  if (!auth.allowed) return auth.response!

  try {
    const overview = await unifiedService.getOverview()
    return NextResponse.json({ success: true, data: overview, error: null })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[/api/science/records/overview] Error:', err)
    return NextResponse.json(
      { success: false, data: null, error: message },
      { status: 500 }
    )
  }
}
