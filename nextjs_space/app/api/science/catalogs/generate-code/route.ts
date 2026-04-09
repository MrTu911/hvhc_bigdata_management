/**
 * POST /api/science/catalogs/generate-code
 * Sinh mã định danh theo format HVHC-{YEAR}-{PREFIX}-{SEQ:03d}
 * VD: { type: "FIELD", year: 2026 } → { code: "HVHC-2026-FLD-001" }
 *
 * RBAC: SCIENCE.CATALOG_MANAGE (chỉ người tạo danh mục mới cần sinh mã)
 *
 * Lưu ý: Gọi endpoint này CHỈ để preview code. Mã thật được sinh và ghi
 * atomically trong createCatalog(). Gọi endpoint này sẽ tăng sequence counter.
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireFunction } from '@/lib/rbac/middleware'
import { SCIENCE } from '@/lib/rbac/function-codes'
import { scienceCatalogService } from '@/lib/services/science/catalog.service'
import { scienceCatalogGenerateCodeSchema } from '@/lib/validations/science-catalog'

export async function POST(req: NextRequest) {
  const auth = await requireFunction(req, SCIENCE.CATALOG_MANAGE)
  if (!auth.allowed) return auth.response!

  const body = await req.json()
  const parsed = scienceCatalogGenerateCodeSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const code = await scienceCatalogService.generateCode(parsed.data.type, parsed.data.year)

  return NextResponse.json({ success: true, data: { code } })
}
