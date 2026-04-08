/**
 * A1 – GET  /api/admin/master-data/categories  → list (incl. inactive)
 * A2 – POST /api/admin/master-data/categories  → create new category
 */
import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { masterDataAdminService } from '@/lib/services/master-data/master-data-admin.service'

// A1 – list all categories (admin sees inactive too)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl
    const groupTag = searchParams.get('groupTag') ?? undefined
    const includeInactive = searchParams.get('includeInactive') === 'true'

    const categories = await db.masterCategory.findMany({
      where: {
        ...(groupTag ? { groupTag } : {}),
        ...(includeInactive ? {} : { isActive: true }),
      },
      include: { _count: { select: { items: { where: { isActive: true } } } } },
      orderBy: { sortOrder: 'asc' },
    })
    return NextResponse.json(categories)
  } catch (e) {
    console.error('[GET /api/admin/master-data/categories]', e)
    return NextResponse.json({ error: 'Lỗi hệ thống' }, { status: 500 })
  }
}

// A2 – create category
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Chưa xác thực' }, { status: 401 })

    const body = await req.json()
    const result = await masterDataAdminService.createCategory(body)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: result.status })
    }
    return NextResponse.json(result.data, { status: 201 })
  } catch (e) {
    console.error('[POST /api/admin/master-data/categories]', e)
    return NextResponse.json({ error: 'Lỗi hệ thống' }, { status: 500 })
  }
}
