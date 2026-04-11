/**
 * GET /api/science/catalogs/field-options
 *
 * Trả về danh sách NckhField enum với Vietnamese labels từ M22 catalog.
 * Frontend dùng để render dropdown "Lĩnh vực nghiên cứu" thay vì hardcode.
 *
 * Kết quả được cache 1h.
 *
 * RBAC: SCIENCE.CATALOG_VIEW
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireFunction } from '@/lib/rbac/middleware'
import { SCIENCE } from '@/lib/rbac/function-codes'
import { fieldCatalogBridge } from '@/lib/services/science/field-catalog-bridge'

export async function GET(req: NextRequest) {
  const auth = await requireFunction(req, SCIENCE.CATALOG_VIEW)
  if (!auth.allowed) return auth.response!

  const fields = await fieldCatalogBridge.listFields()

  return NextResponse.json({
    success: true,
    data: fields,
    meta: {
      total: fields.length,
      note: 'Labels from M22 ScienceCatalog type=FIELD. Falls back to static label if catalog entry not seeded.',
    },
    error: null,
  })
}
