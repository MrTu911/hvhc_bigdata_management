/**
 * Approve/Reject endpoint – delegates to nckhProjectService.transition.
 * Kept for backward compatibility; prefer /transition for general workflow actions.
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireFunction } from '@/lib/rbac/middleware'
import { RESEARCH } from '@/lib/rbac/function-codes'
import { nckhProjectService } from '@/lib/services/nckh-project.service'
import type { FunctionScope } from '@prisma/client'

function scope(auth: Awaited<ReturnType<typeof requireFunction>>): FunctionScope {
  return (auth.authResult?.scope ?? 'SELF') as FunctionScope
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireFunction(req, RESEARCH.APPROVE)
  if (!auth.allowed) return auth.response!

  const body = await req.json()
  const { action, approverNote, rejectReason } = body

  if (!action || !['approve', 'reject'].includes(action)) {
    return NextResponse.json(
      { success: false, error: 'Hành động không hợp lệ. Dùng approve hoặc reject.' },
      { status: 400 }
    )
  }

  const transitionAction = action === 'approve' ? 'APPROVE' : 'REJECT'
  const meta = action === 'approve' ? { approverNote } : { rejectReason }

  const result = await nckhProjectService.transition(
    { user: auth.user!, scope: scope(auth) },
    params.id,
    transitionAction,
    meta
  )

  if (!result.success) {
    return NextResponse.json({ success: false, error: result.error }, { status: 400 })
  }
  return NextResponse.json({ success: true, data: result.data })
}
