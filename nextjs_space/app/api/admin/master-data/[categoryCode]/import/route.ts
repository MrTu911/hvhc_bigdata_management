/**
 * POST /api/admin/master-data/[categoryCode]/import
 *
 * Step 1 of the 2-step import flow.
 * Validates items server-side, stores a session, and returns importId + preview.
 *
 * Body: { items: ImportSessionItem[] }
 * Response: { importId, preview, stats, expiresInSeconds }
 */
import { NextRequest, NextResponse } from 'next/server'
import { masterDataImportService } from '@/lib/services/master-data/master-data-import.service'
import { requireFunction } from '@/lib/rbac/middleware'
import { MASTER_DATA } from '@/lib/rbac/function-codes'

type Ctx = { params: { categoryCode: string } }

export async function POST(req: NextRequest, { params }: Ctx) {
  try {
    const authResult = await requireFunction(req, MASTER_DATA.MANAGE)
    if (!authResult.allowed) return authResult.response

    const body = await req.json()
    const items = body?.items ?? []
    const changedBy = authResult.user?.email ?? 'system'

    const result = await masterDataImportService.validate(params.categoryCode, items, changedBy)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: result.status })
    }

    return NextResponse.json({ success: true, ...result.data })
  } catch (e) {
    console.error('[POST /api/admin/master-data/[categoryCode]/import]', e)
    return NextResponse.json({ error: 'Lỗi hệ thống' }, { status: 500 })
  }
}
