import { NextRequest, NextResponse } from 'next/server'
import { requireFunction } from '@/lib/rbac/middleware'
import { RESEARCH } from '@/lib/rbac/function-codes'
import { scientistProfileService } from '@/lib/services/scientist-profile.service'
import type { FunctionScope } from '@prisma/client'

function scope(auth: Awaited<ReturnType<typeof requireFunction>>): FunctionScope {
  return (auth.authResult?.scope ?? 'SELF') as FunctionScope
}

// GET /api/research/scientists/capacity-map
// Trả dữ liệu bản đồ năng lực nghiên cứu cho toàn Học viện / đơn vị
//
// Filter: unitId, researchField, academicRank
//
// Response shape:
// {
//   byUnit:   [{ unitId, unitName, count, avgHIndex }]
//   byField:  [{ field, count, totalPublications }]
//   byRank:   [{ rank, count }]
//   byDegree: [{ degree, count, avgHIndex }]
//   entries:  [{ unitId, unitName, researchField, scientistCount, avgHIndex, totalPublications }]
// }
//
// SELF scope behavior:
//   Scope SELF không có ngữ nghĩa "bản đồ" vì bản đồ là tổng hợp nhiều người.
//   Khi scope = SELF, service tự động thu hẹp filter về unitId của chính user
//   (user.unitId) thay vì toàn Học viện. Kết quả trả về vẫn là tổng hợp của
//   toàn đơn vị đó — không chỉ riêng 1 người — để bảng biểu vẫn có ý nghĩa.
//   Nếu muốn ngăn SELF xem capacity-map hoàn toàn, đổi RBAC code sang
//   SCIENTIST_EXPORT hoặc thêm guard riêng trong route này.
export async function GET(req: NextRequest) {
  const auth = await requireFunction(req, RESEARCH.SCIENTIST_VIEW)
  if (!auth.allowed) return auth.response!

  const { searchParams } = req.nextUrl
  const filter = {
    unitId:       searchParams.get('unitId') ?? undefined,
    researchField: searchParams.get('researchField') ?? undefined,
    academicRank: searchParams.get('academicRank') ?? undefined,
  }

  const result = await scientistProfileService.getCapacityMap(
    { user: auth.user!, scope: scope(auth) },
    filter
  )

  if (!result.success) {
    return NextResponse.json({ success: false, error: result.error }, { status: 500 })
  }
  return NextResponse.json({ success: true, data: result.data })
}
