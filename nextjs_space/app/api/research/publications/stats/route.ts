import { NextRequest, NextResponse } from 'next/server'
import { requireFunction } from '@/lib/rbac/middleware'
import { RESEARCH } from '@/lib/rbac/function-codes'
import { nckhPublicationService } from '@/lib/services/nckh-publication.service'
import type { FunctionScope } from '@prisma/client'

function scope(auth: Awaited<ReturnType<typeof requireFunction>>): FunctionScope {
  return (auth.authResult?.scope ?? 'SELF') as FunctionScope
}

// GET /api/research/publications/stats
export async function GET(req: NextRequest) {
  const auth = await requireFunction(req, RESEARCH.PUB_VIEW)
  if (!auth.allowed) return auth.response!

  const result = await nckhPublicationService.getStats({ user: auth.user!, scope: scope(auth) })
  if (!result.success) {
    return NextResponse.json({ success: false, error: result.error }, { status: 500 })
  }
  return NextResponse.json({ success: true, data: result.data })
}
