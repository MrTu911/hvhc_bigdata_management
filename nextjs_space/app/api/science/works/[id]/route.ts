/**
 * GET    /api/science/works/[id] – Chi tiết công trình KH
 * PATCH  /api/science/works/[id] – Cập nhật công trình
 * DELETE /api/science/works/[id] – Xóa mềm công trình
 *
 * RBAC: SCIENTIST_VIEW cho GET; WORK_CREATE cho PATCH/DELETE
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireFunction } from '@/lib/rbac/middleware'
import { SCIENCE } from '@/lib/rbac/function-codes'
import { workService } from '@/lib/services/science/work.service'
import { workUpdateSchema } from '@/lib/validations/science-work'

type Params = { params: { id: string } }

export async function GET(req: NextRequest, { params }: Params) {
  const auth = await requireFunction(req, SCIENCE.SCIENTIST_VIEW)
  if (!auth.allowed) return auth.response!

  const result = await workService.getWorkById(params.id)
  if (!result.success) {
    return NextResponse.json({ success: false, error: result.error }, { status: 404 })
  }

  return NextResponse.json({ success: true, data: result.data })
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const auth = await requireFunction(req, SCIENCE.WORK_CREATE)
  if (!auth.allowed) return auth.response!

  const body = await req.json()
  const parsed = workUpdateSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const ipAddress = req.headers.get('x-forwarded-for') ?? undefined
  const result = await workService.updateWork(params.id, parsed.data, auth.user!.id, ipAddress)

  if (!result.success) {
    return NextResponse.json({ success: false, error: result.error }, { status: 409 })
  }

  return NextResponse.json({ success: true, data: result.data })
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const auth = await requireFunction(req, SCIENCE.WORK_CREATE)
  if (!auth.allowed) return auth.response!

  const ipAddress = req.headers.get('x-forwarded-for') ?? undefined
  const result = await workService.deleteWork(params.id, auth.user!.id, ipAddress)

  if (!result.success) {
    return NextResponse.json({ success: false, error: result.error }, { status: 404 })
  }

  return NextResponse.json({ success: true })
}
