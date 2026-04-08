import { NextRequest, NextResponse } from 'next/server'
import { requireFunction } from '@/lib/rbac/middleware'
import { RESEARCH } from '@/lib/rbac/function-codes'
import { nckhPublicationService } from '@/lib/services/nckh-publication.service'
import type { FunctionScope } from '@prisma/client'

function scope(auth: Awaited<ReturnType<typeof requireFunction>>): FunctionScope {
  return (auth.authResult?.scope ?? 'SELF') as FunctionScope
}

// GET /api/research/publications/[id]
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireFunction(req, RESEARCH.PUB_VIEW)
  if (!auth.allowed) return auth.response!

  const result = await nckhPublicationService.getPublicationById(
    { user: auth.user!, scope: scope(auth) },
    params.id
  )

  if (!result.success) {
    const status = result.error?.includes('Không tìm thấy') ? 404 : 403
    return NextResponse.json({ success: false, error: result.error }, { status })
  }
  return NextResponse.json({ success: true, data: result.data })
}

// PATCH /api/research/publications/[id]
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireFunction(req, RESEARCH.PUB_UPDATE)
  if (!auth.allowed) return auth.response!

  const body = await req.json()

  const result = await nckhPublicationService.updatePublication(
    { user: auth.user!, scope: scope(auth) },
    params.id,
    body
  )

  if (!result.success) {
    const status = result.error?.includes('Không tìm thấy') ? 404 : 400
    return NextResponse.json({ success: false, error: result.error }, { status })
  }
  return NextResponse.json({ success: true, data: result.data })
}

// DELETE /api/research/publications/[id]
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireFunction(req, RESEARCH.PUB_DELETE)
  if (!auth.allowed) return auth.response!

  const result = await nckhPublicationService.deletePublication(
    { user: auth.user!, scope: scope(auth) },
    params.id
  )

  if (!result.success) {
    const status = result.error?.includes('Không tìm thấy') ? 404 : 403
    return NextResponse.json({ success: false, error: result.error }, { status })
  }
  return NextResponse.json({ success: true, data: null })
}
