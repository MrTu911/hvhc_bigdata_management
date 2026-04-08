import { NextRequest, NextResponse } from 'next/server'
import { requireFunction } from '@/lib/rbac/middleware'
import { RESEARCH } from '@/lib/rbac/function-codes'
import { nckhProjectService } from '@/lib/services/nckh-project.service'
import type { FunctionScope } from '@prisma/client'

function scope(auth: Awaited<ReturnType<typeof requireFunction>>): FunctionScope {
  return (auth.authResult?.scope ?? 'SELF') as FunctionScope
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireFunction(req, RESEARCH.VIEW)
  if (!auth.allowed) return auth.response!

  const result = await nckhProjectService.getProjectById(
    { user: auth.user!, scope: scope(auth) },
    params.id
  )

  if (!result.success) {
    const status = result.error?.includes('Không tìm thấy') ? 404 : 403
    return NextResponse.json({ success: false, error: result.error }, { status })
  }
  return NextResponse.json({ success: true, data: result.data })
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireFunction(req, RESEARCH.UPDATE)
  if (!auth.allowed) return auth.response!

  const body = await req.json()
  const result = await nckhProjectService.updateProject(
    { user: auth.user!, scope: scope(auth) },
    params.id,
    body
  )

  if (!result.success) {
    return NextResponse.json({ success: false, error: result.error }, { status: 400 })
  }
  return NextResponse.json({ success: true, data: result.data })
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireFunction(req, RESEARCH.DELETE)
  if (!auth.allowed) return auth.response!

  const result = await nckhProjectService.deleteProject(
    { user: auth.user!, scope: scope(auth) },
    params.id
  )

  if (!result.success) {
    return NextResponse.json({ success: false, error: result.error }, { status: 400 })
  }
  return NextResponse.json({ success: true, data: null })
}
