/**
 * GET /api/officer-career/rank-declarations/[id]/history
 * Lịch sử workflow của bản khai (audit trail).
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireFunction } from '@/lib/rbac/middleware'
import { PROMOTION } from '@/lib/rbac/function-codes'
import db from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const authResult = await requireFunction(request, PROMOTION.VIEW_OWN)
  if (!authResult.allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const declaration = await db.rankDeclaration.findUnique({
    where: { id: params.id },
    select: { id: true, workflowInstanceId: true },
  })

  if (!declaration) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const auditLogs = await db.auditLog.findMany({
    where: {
      resourceType: 'RANK_DECLARATION',
      resourceId: params.id,
    },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      action: true,
      actorUserId: true,
      success: true,
      createdAt: true,
      afterData: true,
    },
  })

  return NextResponse.json({ success: true, data: auditLogs })
}
