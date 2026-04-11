/**
 * GET  /api/science/catalogs  – Danh sách danh mục KH (cached Redis 1h)
 * POST /api/science/catalogs  – Tạo danh mục mới
 *
 * RBAC:
 *   GET  → SCIENCE.CATALOG_VIEW  (mọi user có quyền xem)
 *   POST → SCIENCE.CATALOG_MANAGE (chỉ ADMIN / DEPT_HEAD)
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireFunction } from '@/lib/rbac/middleware'
import { SCIENCE } from '@/lib/rbac/function-codes'
import { scienceCatalogService } from '@/lib/services/science/catalog.service'
import {
  scienceCatalogCreateSchema,
  scienceCatalogListSchema,
} from '@/lib/validations/science-catalog'

export async function GET(req: NextRequest) {
  const auth = await requireFunction(req, SCIENCE.CATALOG_VIEW)
  if (!auth.allowed) return auth.response!

  const { searchParams } = new URL(req.url)

  const parsed = scienceCatalogListSchema.safeParse({
    type: searchParams.get('type') ?? undefined,
    parentId: searchParams.has('parentId') ? searchParams.get('parentId') : undefined,
    keyword: searchParams.get('keyword') ?? undefined,
    isActive: searchParams.get('isActive') ?? undefined,
    page: searchParams.get('page') ?? undefined,
    pageSize: searchParams.get('pageSize') ?? undefined,
  })

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const result = await scienceCatalogService.listCatalogs(parsed.data)
  // listCatalogs always returns success:true; guard kept for future failure cases
  if (!result.success) {
    return NextResponse.json({ success: false, error: 'Lỗi tải danh mục' }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    data: result.data.items,
    meta: {
      total: result.data.total,
      page: parsed.data.page,
      pageSize: parsed.data.pageSize,
      totalPages: Math.ceil(result.data.total / parsed.data.pageSize),
    },
  })
}

export async function POST(req: NextRequest) {
  const auth = await requireFunction(req, SCIENCE.CATALOG_MANAGE)
  if (!auth.allowed) return auth.response!

  const body = await req.json()
  const parsed = scienceCatalogCreateSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const ipAddress = req.headers.get('x-forwarded-for') ?? undefined

  const result = await scienceCatalogService.createCatalog(
    parsed.data,
    auth.user!.id,
    ipAddress
  )

  if (!result.success) {
    return NextResponse.json({ success: false, error: result.error }, { status: 400 })
  }

  return NextResponse.json({ success: true, data: result.data }, { status: 201 })
}
