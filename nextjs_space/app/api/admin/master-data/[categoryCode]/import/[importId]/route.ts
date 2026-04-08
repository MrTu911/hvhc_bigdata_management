/**
 * POST /api/admin/master-data/[categoryCode]/import/[importId]
 *
 * Step 2 of the 2-step import flow.
 * Loads the validated session and executes the upserts.
 *
 * Returns: { success, inserted, updated, errors[] }
 * Errors: 410 session expired, 409 already consumed, 400 category mismatch
 */
import { NextRequest, NextResponse } from 'next/server'
import { masterDataImportService } from '@/lib/services/master-data/master-data-import.service'
import { requireFunction } from '@/lib/rbac/middleware'
import { MASTER_DATA } from '@/lib/rbac/function-codes'

type Ctx = { params: { categoryCode: string; importId: string } }

export async function POST(req: NextRequest, { params }: Ctx) {
  try {
    const authResult = await requireFunction(req, MASTER_DATA.MANAGE)
    if (!authResult.allowed) return authResult.response

    const changedBy = authResult.user?.email ?? 'system'
    const result = await masterDataImportService.confirm(
      params.categoryCode,
      params.importId,
      changedBy
    )

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: result.status })
    }

    return NextResponse.json({ success: true, ...result.data })
  } catch (e) {
    console.error('[POST /api/admin/master-data/[categoryCode]/import/[importId]]', e)
    return NextResponse.json({ error: 'Lỗi hệ thống' }, { status: 500 })
  }
}
