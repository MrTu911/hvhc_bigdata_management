/**
 * GET   /api/science/catalogs/:id  – Chi tiết danh mục + danh sách con
 * PATCH /api/science/catalogs/:id  – Cập nhật tên/mô tả/trạng thái
 * DELETE /api/science/catalogs/:id – Soft delete (isActive = false)
 *
 * RBAC:
 *   GET    → SCIENCE.CATALOG_VIEW
 *   PATCH  → SCIENCE.CATALOG_MANAGE
 *   DELETE → SCIENCE.CATALOG_MANAGE
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireFunction } from '@/lib/rbac/middleware'
import { SCIENCE } from '@/lib/rbac/function-codes'
import { scienceCatalogService } from '@/lib/services/science/catalog.service'
import { scienceCatalogUpdateSchema } from '@/lib/validations/science-catalog'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  const auth = await requireFunction(req, SCIENCE.CATALOG_VIEW)
  if (!auth.allowed) return auth.response!

  const { id } = await params
  const result = await scienceCatalogService.getCatalogById(id)

  if (!result.success) {
    return NextResponse.json({ success: false, error: result.error }, { status: 404 })
  }

  return NextResponse.json({ success: true, data: result.data })
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const auth = await requireFunction(req, SCIENCE.CATALOG_MANAGE)
  if (!auth.allowed) return auth.response!

  const { id } = await params
  const body = await req.json()
  const parsed = scienceCatalogUpdateSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const ipAddress = req.headers.get('x-forwarded-for') ?? undefined
  const result = await scienceCatalogService.updateCatalog(id, parsed.data, auth.user!.id, ipAddress)

  if (!result.success) {
    return NextResponse.json({ success: false, error: result.error }, { status: 400 })
  }

  return NextResponse.json({ success: true, data: result.data })
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const auth = await requireFunction(req, SCIENCE.CATALOG_MANAGE)
  if (!auth.allowed) return auth.response!

  const { id } = await params
  const ipAddress = req.headers.get('x-forwarded-for') ?? undefined
  const result = await scienceCatalogService.deleteCatalog(id, auth.user!.id, ipAddress)

  if (!result.success) {
    return NextResponse.json({ success: false, error: result.error }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
