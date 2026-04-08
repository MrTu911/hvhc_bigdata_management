import { NextRequest, NextResponse } from 'next/server'
import { requireFunction } from '@/lib/rbac/middleware'
import { RESEARCH } from '@/lib/rbac/function-codes'
import { nckhReviewService } from '@/lib/services/nckh-review.service'
import type { FunctionScope } from '@prisma/client'

function scope(auth: Awaited<ReturnType<typeof requireFunction>>): FunctionScope {
  return (auth.authResult?.scope ?? 'SELF') as FunctionScope
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireFunction(req, RESEARCH.VIEW)
  if (!auth.allowed) return auth.response!

  const result = await nckhReviewService.listReviews(
    { user: auth.user!, scope: scope(auth) },
    params.id
  )

  if (!result.success) {
    return NextResponse.json({ success: false, error: result.error }, { status: 400 })
  }
  return NextResponse.json({ success: true, data: result.data })
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireFunction(req, RESEARCH.REVIEW)
  if (!auth.allowed) return auth.response!

  const body = await req.json()
  const result = await nckhReviewService.createReview(
    { user: auth.user!, scope: scope(auth) },
    params.id,
    body
  )

  if (!result.success) {
    return NextResponse.json({ success: false, error: result.error }, { status: 400 })
  }
  return NextResponse.json({ success: true, data: result.data }, { status: 201 })
}
