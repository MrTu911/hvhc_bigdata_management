/**
 * GET /api/science/units/capacity
 * Tổng hợp năng lực khoa học theo đơn vị từ NckhScientistProfile.
 * Dùng cho M21 dashboard và M23 expert suggestion.
 *
 * RBAC: SCIENCE.SCIENTIST_VIEW
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireFunction } from '@/lib/rbac/middleware'
import { SCIENCE } from '@/lib/rbac/function-codes'
import { unitCapacityRepo } from '@/lib/repositories/science/scientist.repo'

export async function GET(req: NextRequest) {
  const auth = await requireFunction(req, SCIENCE.SCIENTIST_VIEW)
  if (!auth.allowed) return auth.response!

  try {
    const items = await unitCapacityRepo.getAll()
    return NextResponse.json({ success: true, data: items, error: null })
  } catch (err) {
    console.error('[units/capacity] GET error:', err)
    return NextResponse.json(
      { success: false, data: null, error: 'Lỗi tổng hợp năng lực đơn vị' },
      { status: 500 }
    )
  }
}
