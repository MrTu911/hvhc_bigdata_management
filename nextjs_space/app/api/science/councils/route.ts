/**
 * POST /api/science/councils – Tạo hội đồng KH + chỉ định thành viên
 *
 * RBAC: SCIENCE.COUNCIL_MANAGE
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireFunction } from '@/lib/rbac/middleware'
import { SCIENCE } from '@/lib/rbac/function-codes'
import { councilService } from '@/lib/services/science/council.service'
import { councilCreateSchema } from '@/lib/validations/science-council'

export async function POST(req: NextRequest) {
  const auth = await requireFunction(req, SCIENCE.COUNCIL_MANAGE)
  if (!auth.allowed) return auth.response!

  const body = await req.json()
  const parsed = councilCreateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const ipAddress = req.headers.get('x-forwarded-for') ?? undefined
  const result = await councilService.createCouncil(parsed.data, auth.user!.id, ipAddress)

  if (!result.success) {
    return NextResponse.json({ success: false, error: result.error }, { status: 400 })
  }
  return NextResponse.json({ success: true, data: result.data }, { status: 201 })
}
