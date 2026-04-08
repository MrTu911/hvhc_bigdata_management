import { NextRequest, NextResponse } from 'next/server'
import { requireFunction } from '@/lib/rbac/middleware'
import { RESEARCH } from '@/lib/rbac/function-codes'
import { scientistProfileService } from '@/lib/services/scientist-profile.service'
import type { FunctionScope } from '@prisma/client'

function scope(auth: Awaited<ReturnType<typeof requireFunction>>): FunctionScope {
  return (auth.authResult?.scope ?? 'SELF') as FunctionScope
}

// GET /api/research/scientists
// Filter: keyword, unitId, specialization, researchField, degree, academicRank, page, limit
export async function GET(req: NextRequest) {
  const auth = await requireFunction(req, RESEARCH.SCIENTIST_VIEW)
  if (!auth.allowed) return auth.response!

  const { searchParams } = req.nextUrl
  const params = {
    keyword:        searchParams.get('keyword') ?? undefined,
    unitId:         searchParams.get('unitId') ?? undefined,
    specialization: searchParams.get('specialization') ?? undefined,
    researchField:  searchParams.get('researchField') ?? undefined,
    degree:         searchParams.get('degree') ?? undefined,
    academicRank:   searchParams.get('academicRank') ?? undefined,
    page:           searchParams.get('page')  ? Number(searchParams.get('page'))  : 1,
    limit:          searchParams.get('limit') ? Math.min(Number(searchParams.get('limit')), 100) : 20,
  }

  const result = await scientistProfileService.listScientists(
    { user: auth.user!, scope: scope(auth) },
    params
  )

  if (!result.success) {
    return NextResponse.json({ success: false, error: result.error }, { status: 500 })
  }
  return NextResponse.json({ success: true, data: result.data, meta: result.meta })
}
