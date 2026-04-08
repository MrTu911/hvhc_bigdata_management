import { NextRequest, NextResponse } from 'next/server'
import { requireFunction } from '@/lib/rbac/middleware'
import { RESEARCH } from '@/lib/rbac/function-codes'
import { nckhPublicationService } from '@/lib/services/nckh-publication.service'
import type { FunctionScope } from '@prisma/client'

function scope(auth: Awaited<ReturnType<typeof requireFunction>>): FunctionScope {
  return (auth.authResult?.scope ?? 'SELF') as FunctionScope
}

// GET /api/research/publications
// Filter: keyword, pubType, year, unitId, projectId, ranking, isISI, isScopus, page, limit
export async function GET(req: NextRequest) {
  const auth = await requireFunction(req, RESEARCH.PUB_VIEW)
  if (!auth.allowed) return auth.response!

  const { searchParams } = req.nextUrl
  const params = {
    keyword: searchParams.get('keyword') ?? undefined,
    pubType: searchParams.get('pubType') ?? undefined,
    year: searchParams.get('year') ? Number(searchParams.get('year')) : undefined,
    unitId: searchParams.get('unitId') ?? undefined,
    projectId: searchParams.get('projectId') ?? undefined,
    ranking: searchParams.get('ranking') ?? undefined,
    isISI: searchParams.get('isISI') === 'true' ? true : searchParams.get('isISI') === 'false' ? false : undefined,
    isScopus: searchParams.get('isScopus') === 'true' ? true : searchParams.get('isScopus') === 'false' ? false : undefined,
    page: searchParams.get('page') ? Number(searchParams.get('page')) : 1,
    limit: searchParams.get('limit') ? Math.min(Number(searchParams.get('limit')), 100) : 20,
  }

  const result = await nckhPublicationService.listPublications(
    { user: auth.user!, scope: scope(auth) },
    params
  )

  if (!result.success) {
    return NextResponse.json({ success: false, error: result.error }, { status: 500 })
  }
  return NextResponse.json({ success: true, data: result.data, meta: result.meta })
}

// POST /api/research/publications
export async function POST(req: NextRequest) {
  const auth = await requireFunction(req, RESEARCH.PUB_CREATE)
  if (!auth.allowed) return auth.response!

  const body = await req.json()

  const result = await nckhPublicationService.createPublication(
    { user: auth.user!, scope: scope(auth) },
    body
  )

  if (!result.success) {
    return NextResponse.json({ success: false, error: result.error }, { status: 400 })
  }
  return NextResponse.json({ success: true, data: result.data }, { status: 201 })
}
