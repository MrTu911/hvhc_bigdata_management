import { NextRequest, NextResponse } from 'next/server'
import { requireFunction } from '@/lib/rbac/middleware'
import { RESEARCH } from '@/lib/rbac/function-codes'
import { nckhProjectService } from '@/lib/services/nckh-project.service'
import type { FunctionScope } from '@prisma/client'

function scope(auth: Awaited<ReturnType<typeof requireFunction>>): FunctionScope {
  return (auth.authResult?.scope ?? 'SELF') as FunctionScope
}

export async function GET(req: NextRequest) {
  const auth = await requireFunction(req, RESEARCH.VIEW)
  if (!auth.allowed) return auth.response!

  const { searchParams } = new URL(req.url)

  const result = await nckhProjectService.listProjects(
    { user: auth.user!, scope: scope(auth) },
    {
      search: searchParams.get('search') ?? undefined,
      status: (searchParams.get('status') as any) ?? undefined,
      phase: (searchParams.get('phase') as any) ?? undefined,
      category: (searchParams.get('category') as any) ?? undefined,
      field: (searchParams.get('field') as any) ?? undefined,
      budgetYear: searchParams.get('year') ? parseInt(searchParams.get('year')!) : undefined,
      unitId: searchParams.get('unitId') ?? undefined,
      principalInvestigatorId: searchParams.get('piId') ?? undefined,
    },
    {
      page: parseInt(searchParams.get('page') ?? '1'),
      limit: parseInt(searchParams.get('limit') ?? '20'),
    }
  )

  if (!result.success) {
    return NextResponse.json({ success: false, error: result.error }, { status: 500 })
  }
  return NextResponse.json({ success: true, data: result.data, meta: result.meta })
}

export async function POST(req: NextRequest) {
  const auth = await requireFunction(req, RESEARCH.CREATE)
  if (!auth.allowed) return auth.response!

  const body = await req.json()
  const result = await nckhProjectService.createProject(
    { user: auth.user!, scope: scope(auth) },
    body
  )

  if (!result.success) {
    return NextResponse.json({ success: false, error: result.error }, { status: 400 })
  }
  return NextResponse.json({ success: true, data: result.data }, { status: 201 })
}
