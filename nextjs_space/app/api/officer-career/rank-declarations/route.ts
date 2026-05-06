/**
 * GET  /api/officer-career/rank-declarations  — danh sách bản khai
 * POST /api/officer-career/rank-declarations  — tạo bản khai mới
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireFunction } from '@/lib/rbac/middleware'
import { PROMOTION } from '@/lib/rbac/function-codes'
import { createDeclaration, listDeclarations } from '@/lib/services/personnel/rank-declaration.service'
import type { PromotionType } from '@prisma/client'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const authResult = await requireFunction(request, PROMOTION.VIEW_UNIT)
  if (!authResult.allowed) {
    // Fallback: allow self-view
    const selfAuth = await requireFunction(request, PROMOTION.VIEW_OWN)
    if (!selfAuth.allowed) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  const { user } = authResult.allowed ? authResult : await requireFunction(request, PROMOTION.VIEW_OWN)
  const { searchParams } = new URL(request.url)

  const filter: Parameters<typeof listDeclarations>[0] = {
    personnelId:       searchParams.get('personnelId')        || undefined,
    declarationStatus: (searchParams.get('status') as any)   || undefined,
    rankType:          searchParams.get('rankType')           || undefined,
    keyword:           searchParams.get('keyword')            || undefined,
    unitId:            searchParams.get('unitId')             || undefined,
    page:              parseInt(searchParams.get('page')  || '1'),
    limit:             parseInt(searchParams.get('limit') || '20'),
  }

  // Scope: if only VIEW_OWN, restrict to self's personnelId
  const hasOrgView = authResult.allowed
  if (!hasOrgView && user) {
    filter.declaredBy = user.id
  }

  const result = await listDeclarations(filter)
  return NextResponse.json({ success: true, ...result })
}

export async function POST(request: NextRequest) {
  const authResult = await requireFunction(request, PROMOTION.CREATE_SELF)
  if (!authResult.allowed) {
    const onBehalfAuth = await requireFunction(request, PROMOTION.CREATE_ON_BEHALF)
    if (!onBehalfAuth.allowed) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  const { user } = authResult.allowed ? authResult : await requireFunction(request, PROMOTION.CREATE_ON_BEHALF)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const {
    personnelId,
    rankType,
    promotionType,
    previousRank,
    newRank,
    effectiveDate,
    decisionNumber,
    decisionDate,
    previousPosition,
    newPosition,
    reason,
    notes,
    attachments,
    onBehalf,
  } = body

  if (!personnelId || !rankType || !promotionType || !effectiveDate) {
    return NextResponse.json(
      { error: 'personnelId, rankType, promotionType, effectiveDate are required' },
      { status: 400 },
    )
  }

  if (!['OFFICER', 'SOLDIER'].includes(rankType)) {
    return NextResponse.json({ error: 'rankType must be OFFICER or SOLDIER' }, { status: 400 })
  }

  const declaration = await createDeclaration(
    {
      personnelId,
      rankType,
      promotionType: promotionType as PromotionType,
      previousRank:     previousRank     || null,
      newRank:          newRank          || null,
      effectiveDate:    new Date(effectiveDate),
      decisionNumber:   decisionNumber   || null,
      decisionDate:     decisionDate ? new Date(decisionDate) : null,
      previousPosition: previousPosition || null,
      newPosition:      newPosition      || null,
      reason:           reason           || null,
      notes:            notes            || null,
      attachments:      attachments      || null,
      onBehalf:         onBehalf         ?? false,
    },
    user.id,
  )

  return NextResponse.json({ success: true, data: declaration }, { status: 201 })
}
