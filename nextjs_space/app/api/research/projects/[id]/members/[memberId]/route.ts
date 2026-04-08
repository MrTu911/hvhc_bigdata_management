import { NextRequest, NextResponse } from 'next/server'
import { requireFunction } from '@/lib/rbac/middleware'
import { RESEARCH } from '@/lib/rbac/function-codes'
import { nckhProjectService } from '@/lib/services/nckh-project.service'
import type { FunctionScope } from '@prisma/client'

function scope(auth: Awaited<ReturnType<typeof requireFunction>>): FunctionScope {
  return (auth.authResult?.scope ?? 'SELF') as FunctionScope
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; memberId: string } }
) {
  const auth = await requireFunction(req, RESEARCH.UPDATE)
  if (!auth.allowed) return auth.response!

  const result = await nckhProjectService.removeMember(
    { user: auth.user!, scope: scope(auth) },
    params.id,
    params.memberId
  )

  if (!result.success) {
    return NextResponse.json({ success: false, error: result.error }, { status: 400 })
  }
  return NextResponse.json({ success: true, data: null })
}
