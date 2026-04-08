/**
 * A8b – POST /api/admin/master-data/[categoryCode]/items/[code]/toggle
 * Toggle active status (reactivate deactivated item).
 */
import { NextRequest, NextResponse } from 'next/server'
import { masterDataAdminService } from '@/lib/services/master-data/master-data-admin.service'
import { requireFunction } from '@/lib/rbac/middleware'
import { MASTER_DATA } from '@/lib/rbac/function-codes'

type Ctx = { params: { categoryCode: string; code: string } }

export async function POST(req: NextRequest, { params }: Ctx) {
  try {
    const authResult = await requireFunction(req, MASTER_DATA.MANAGE)
    if (!authResult.allowed) return authResult.response

    const body = await req.json().catch(() => ({}))
    const changedBy = authResult.user?.email ?? 'system'
    const result = await masterDataAdminService.toggleItemStatus(
      params.categoryCode,
      params.code,
      changedBy,
      body.changeReason
    )

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: result.status })
    }
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('[POST /api/admin/master-data/[categoryCode]/items/[code]/toggle]', e)
    return NextResponse.json({ error: 'Lỗi hệ thống' }, { status: 500 })
  }
}
