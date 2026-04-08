/**
 * GET /api/admin/master-data/sync/status
 * Returns global sync status: last sync per category + aggregate totals.
 * Requires MANAGE_GOVERNANCE.
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireFunction } from '@/lib/rbac/middleware'
import { MASTER_DATA } from '@/lib/rbac/function-codes'
import * as syncService from '@/lib/services/master-data/master-data-sync.service'

export async function GET(req: NextRequest) {
  const authResult = await requireFunction(req, MASTER_DATA.MANAGE)
  if (!authResult.allowed) return authResult.response!

  const result = await syncService.getSyncStatus()
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: result.status })
  }
  return NextResponse.json(result.data)
}
