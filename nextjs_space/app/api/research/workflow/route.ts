/**
 * Bulk workflow endpoint – dùng cho các thao tác batch trên nhiều đề tài.
 * Single-project workflow: dùng /api/research/projects/[id]/transition thay thế.
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireFunction } from '@/lib/rbac/middleware'
import { RESEARCH } from '@/lib/rbac/function-codes'
import { nckhProjectService } from '@/lib/services/nckh-project.service'
import type { FunctionScope } from '@prisma/client'

const ACTION_PERMISSIONS: Record<string, string> = {
  SUBMIT: RESEARCH.SUBMIT,
  APPROVE: RESEARCH.APPROVE,
  REJECT: RESEARCH.APPROVE,
  START_EXECUTION: RESEARCH.UPDATE,
  CANCEL: RESEARCH.APPROVE,
}

function scope(auth: Awaited<ReturnType<typeof requireFunction>>): FunctionScope {
  return (auth.authResult?.scope ?? 'SELF') as FunctionScope
}

// POST: Bulk workflow action trên nhiều đề tài
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { action, projectIds, ...meta } = body

  if (!action || !(action in ACTION_PERMISSIONS)) {
    return NextResponse.json(
      {
        success: false,
        error: `Hành động không hợp lệ. Các hành động hợp lệ: ${Object.keys(ACTION_PERMISSIONS).join(', ')}`,
      },
      { status: 400 }
    )
  }

  if (!projectIds || !Array.isArray(projectIds) || projectIds.length === 0) {
    return NextResponse.json(
      { success: false, error: 'projectIds là bắt buộc và phải là mảng không rỗng' },
      { status: 400 }
    )
  }

  const auth = await requireFunction(req, ACTION_PERMISSIONS[action])
  if (!auth.allowed) return auth.response!

  const options = { user: auth.user!, scope: scope(auth) }
  const results: Array<{ id: string; success: boolean; error?: string }> = []

  for (const id of projectIds as string[]) {
    const result = await nckhProjectService.transition(options, id, action, meta)
    results.push({ id, success: result.success, error: result.error })
  }

  const successCount = results.filter((r) => r.success).length
  const failCount = results.length - successCount

  return NextResponse.json({
    success: true,
    data: {
      successCount,
      failCount,
      results,
    },
  })
}

// GET: Thống kê workflow
export async function GET(req: NextRequest) {
  const auth = await requireFunction(req, RESEARCH.VIEW)
  if (!auth.allowed) return auth.response!

  const result = await nckhProjectService.getDashboardStats({ user: auth.user!, scope: scope(auth) })
  if (!result.success) {
    return NextResponse.json({ success: false, error: result.error }, { status: 500 })
  }
  return NextResponse.json({ success: true, data: result.data })
}
