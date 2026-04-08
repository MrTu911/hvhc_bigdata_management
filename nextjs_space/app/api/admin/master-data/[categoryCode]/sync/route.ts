/**
 * GET  /api/admin/master-data/[categoryCode]/sync  → sync history
 * POST /api/admin/master-data/[categoryCode]/sync  → trigger manual sync
 *
 * POST requires MANAGE_GOVERNANCE and sourceType ∈ {BQP, NATIONAL}.
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireFunction } from '@/lib/rbac/middleware'
import { MASTER_DATA } from '@/lib/rbac/function-codes'
import * as syncService from '@/lib/services/master-data/master-data-sync.service'

type Ctx = { params: { categoryCode: string } }

export async function GET(req: NextRequest, { params }: Ctx) {
  const authResult = await requireFunction(req, MASTER_DATA.MANAGE)
  if (!authResult.allowed) return authResult.response!

  const limit = Math.min(
    parseInt(req.nextUrl.searchParams.get('limit') ?? '20'),
    100
  )

  const result = await syncService.getCategorySyncHistory(params.categoryCode, limit)
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: result.status })
  }
  return NextResponse.json(result.data)
}

export async function POST(req: NextRequest, { params }: Ctx) {
  const authResult = await requireFunction(req, MASTER_DATA.MANAGE)
  if (!authResult.allowed) return authResult.response!

  let dryRun = false
  try {
    const body = await req.json()
    dryRun = body?.dryRun === true
  } catch {
    // body is optional
  }

  const result = await syncService.triggerSync({
    categoryCode: params.categoryCode,
    triggeredBy: authResult.user?.email ?? 'system',
    dryRun,
  })

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: result.status })
  }
  return NextResponse.json({ success: true, ...result.data })
}
