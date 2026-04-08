/**
 * A8 – PUT /api/admin/master-data/[categoryCode]/sort
 * Reorder items by updating sortOrder values.
 * Body: { order: string[] }  — array of item codes in desired order (index = sortOrder)
 */
import { NextRequest, NextResponse } from 'next/server'
import { masterDataAdminService } from '@/lib/services/master-data/master-data-admin.service'
import { requireFunction } from '@/lib/rbac/middleware'
import { MASTER_DATA } from '@/lib/rbac/function-codes'

type Ctx = { params: { categoryCode: string } }

export async function PUT(req: NextRequest, { params }: Ctx) {
  try {
    const authResult = await requireFunction(req, MASTER_DATA.MANAGE)
    if (!authResult.allowed) return authResult.response

    const body = await req.json()
    const order: string[] = body?.order ?? []
    const changedBy = authResult.user?.email ?? 'system'

    const result = await masterDataAdminService.sortItems(params.categoryCode, order, changedBy)
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: result.status })
    }

    return NextResponse.json({ success: true, categoryCode: params.categoryCode, reordered: order.length })
  } catch (e) {
    console.error('[PUT sort]', e)
    return NextResponse.json({ error: 'Lỗi hệ thống' }, { status: 500 })
  }
}
