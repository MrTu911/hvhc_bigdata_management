/**
 * GET /api/admin/master-data/[categoryCode]/changelog
 * Audit trail for all items in a category.
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireFunction } from '@/lib/rbac/middleware'
import { MASTER_DATA } from '@/lib/rbac/function-codes'
import { masterDataAdminService } from '@/lib/services/master-data/master-data-admin.service'

export async function GET(
  req: NextRequest,
  { params }: { params: { categoryCode: string } }
) {
  try {
    const authResult = await requireFunction(req, MASTER_DATA.MANAGE)
    if (!authResult.allowed) {
      return authResult.response
    }

    const { searchParams } = req.nextUrl
    const page = parseInt(searchParams.get('page') ?? '1')
    const limit = parseInt(searchParams.get('limit') ?? '50')
    const changeType = searchParams.get('changeType') ?? undefined
    const itemCode = searchParams.get('itemCode') ?? undefined

    const result = await masterDataAdminService.getChangeLog(
      params.categoryCode,
      page,
      limit,
      { changeType, itemCode }
    )
    return NextResponse.json(result)
  } catch (e) {
    console.error('[GET /api/admin/master-data/[categoryCode]/changelog]', e)
    return NextResponse.json({ error: 'Lỗi hệ thống' }, { status: 500 })
  }
}
