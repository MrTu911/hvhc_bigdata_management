/**
 * POST /api/admin/master-data/[categoryCode]/items/[code]/deactivate
 * Soft-deactivates an item after checking for active child references.
 */
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { masterDataAdminService } from '@/lib/services/master-data/master-data-admin.service'

type Ctx = { params: { categoryCode: string; code: string } }

export async function POST(req: NextRequest, { params }: Ctx) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Chưa xác thực' }, { status: 401 })

    const body = await req.json().catch(() => ({}))
    const changedBy = session.user?.email ?? 'system'

    // toggleItemStatus deactivates if currently active, rejects with 409 if children exist
    const result = await masterDataAdminService.toggleItemStatus(
      params.categoryCode,
      params.code,
      changedBy,
      body.changeReason
    )

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: result.status })
    }
    return NextResponse.json({ success: true, code: params.code, categoryCode: params.categoryCode })
  } catch (e) {
    console.error('[POST deactivate]', e)
    return NextResponse.json({ error: 'Lỗi hệ thống' }, { status: 500 })
  }
}
