import { NextRequest, NextResponse } from 'next/server'
import { requireFunction } from '@/lib/rbac/middleware'
import { RESEARCH } from '@/lib/rbac/function-codes'
import { scientistProfileService } from '@/lib/services/scientist-profile.service'
import type { FunctionScope } from '@prisma/client'

function scope(auth: Awaited<ReturnType<typeof requireFunction>>): FunctionScope {
  return (auth.authResult?.scope ?? 'SELF') as FunctionScope
}

// GET /api/research/scientists/[id]
// [id] = userId của nhà khoa học
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireFunction(req, RESEARCH.SCIENTIST_VIEW)
  if (!auth.allowed) return auth.response!

  const result = await scientistProfileService.getScientistProfile(
    { user: auth.user!, scope: scope(auth) },
    params.id
  )

  if (!result.success) {
    const status = result.error?.includes('Không tìm thấy') ? 404 : 403
    return NextResponse.json({ success: false, error: result.error }, { status })
  }
  return NextResponse.json({ success: true, data: result.data })
}

// PATCH /api/research/scientists/[id]
// Cập nhật hồ sơ nhà khoa học (self hoặc SCIENTIST_UPDATE scope)
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireFunction(req, RESEARCH.SCIENTIST_UPDATE)
  if (!auth.allowed) return auth.response!

  const body = await req.json()

  const result = await scientistProfileService.updateProfile(
    { user: auth.user!, scope: scope(auth) },
    params.id,
    body
  )

  if (!result.success) {
    const status = result.error?.includes('Không có quyền') ? 403 : 400
    return NextResponse.json({ success: false, error: result.error }, { status })
  }
  return NextResponse.json({ success: true, data: result.data })
}
