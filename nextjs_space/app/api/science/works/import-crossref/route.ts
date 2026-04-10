/**
 * POST /api/science/works/import-crossref
 * DOI → CrossRef Public API v1 → auto-fill metadata → lưu vào ScientificWork.
 *
 * RBAC: SCIENCE.WORK_IMPORT_DOI
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireFunction } from '@/lib/rbac/middleware'
import { SCIENCE } from '@/lib/rbac/function-codes'
import { workService } from '@/lib/services/science/work.service'
import { crossrefImportSchema } from '@/lib/validations/science-work'

export async function POST(req: NextRequest) {
  const auth = await requireFunction(req, SCIENCE.WORK_IMPORT_DOI)
  if (!auth.allowed) return auth.response!

  const body = await req.json()
  const parsed = crossrefImportSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const ipAddress = req.headers.get('x-forwarded-for') ?? undefined
  const result = await workService.importFromCrossref(parsed.data, auth.user!.id, ipAddress)

  if (!result.success) {
    const status = result.data ? 409 : 422
    return NextResponse.json({ success: false, error: result.error, data: result.data ?? null }, { status })
  }

  return NextResponse.json({ success: true, data: result.data }, { status: 201 })
}
