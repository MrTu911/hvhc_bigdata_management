/**
 * General workflow transition endpoint for NckhProject.
 * POST body: { action: WorkflowAction, approverNote?, rejectReason?, ... }
 * WorkflowAction: SUBMIT | APPROVE | REJECT | START_EXECUTION | PAUSE | RESUME |
 *                 COMPLETE | CANCEL | REQUEST_REVIEW | SUBMIT_FINAL | ARCHIVE | REOPEN
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireFunction } from '@/lib/rbac/middleware'
import { RESEARCH } from '@/lib/rbac/function-codes'
import { nckhProjectService } from '@/lib/services/nckh-project.service'
import type { FunctionScope } from '@prisma/client'

// Map action → required function code
const ACTION_PERMISSIONS: Record<string, string> = {
  SUBMIT: RESEARCH.SUBMIT,
  APPROVE: RESEARCH.APPROVE,
  REJECT: RESEARCH.APPROVE,
  START_EXECUTION: RESEARCH.UPDATE,
  PAUSE: RESEARCH.UPDATE,
  RESUME: RESEARCH.UPDATE,
  COMPLETE: RESEARCH.UPDATE,
  CANCEL: RESEARCH.UPDATE,
  REQUEST_REVIEW: RESEARCH.UPDATE,
  SUBMIT_FINAL: RESEARCH.SUBMIT,
  ARCHIVE: RESEARCH.APPROVE,
  REOPEN: RESEARCH.APPROVE,
}

function scope(auth: Awaited<ReturnType<typeof requireFunction>>): FunctionScope {
  return (auth.authResult?.scope ?? 'SELF') as FunctionScope
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json()
  const { action, ...meta } = body

  if (!action || !(action in ACTION_PERMISSIONS)) {
    return NextResponse.json(
      {
        success: false,
        error: `Hành động không hợp lệ. Các hành động hợp lệ: ${Object.keys(ACTION_PERMISSIONS).join(', ')}`,
      },
      { status: 400 }
    )
  }

  const auth = await requireFunction(req, ACTION_PERMISSIONS[action])
  if (!auth.allowed) return auth.response!

  const result = await nckhProjectService.transition(
    { user: auth.user!, scope: scope(auth) },
    params.id,
    action,
    meta
  )

  if (!result.success) {
    return NextResponse.json({ success: false, error: result.error }, { status: 400 })
  }
  return NextResponse.json({ success: true, data: result.data })
}
