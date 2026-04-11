/**
 * GET /api/science/ai/trends
 *
 * Phân tích xu hướng nghiên cứu khoa học từ dữ liệu APPROVED/COMPLETED.
 *
 * Trả về:
 *   byField      — số đề tài theo lĩnh vực (top 10)
 *   byYear       — số đề tài theo năm (5 năm gần nhất)
 *   byFieldYear  — matrix field × year (cho heatmap)
 *   topKeywords  — từ khóa xuất hiện nhiều nhất từ keywords[]
 *   publicationsByYear — công bố khoa học theo năm
 *
 * RBAC: SCIENCE.AI_USE ('USE_AI_SCIENCE')
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireFunction } from '@/lib/rbac/middleware'
import { SCIENCE } from '@/lib/rbac/function-codes'
import { kpiService } from '@/lib/services/science/kpi.service'
import { logAudit } from '@/lib/audit'

export async function GET(req: NextRequest) {
  const auth = await requireFunction(req, SCIENCE.AI_USE)
  if (!auth.allowed) return auth.response!

  const ipAddress = req.headers.get('x-forwarded-for') ?? undefined

  try {
    const result = await kpiService.getTrends(5)

    await logAudit({
      userId: auth.user!.id,
      functionCode: 'USE_AI_SCIENCE',
      action: 'READ',
      resourceType: 'SCIENCE_TREND_ANALYSIS',
      resourceId: 'TRENDS',
      result: 'SUCCESS',
      ipAddress,
      metadata: { fromCache: result.fromCache },
    })

    return NextResponse.json({
      success: true,
      data: result.data,
      error: null,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[/api/science/ai/trends] Error:', err)
    return NextResponse.json(
      { success: false, data: null, error: message },
      { status: 500 }
    )
  }
}
