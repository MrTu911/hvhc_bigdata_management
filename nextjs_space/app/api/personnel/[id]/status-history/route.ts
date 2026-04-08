/**
 * GET  /api/personnel/[id]/status-history  — list status change log
 * POST /api/personnel/[id]/status-history  — record a new status change
 *
 * [id] = Personnel.id
 *
 * POST body: { toStatus, effectiveDate, decisionNumber?, reason?, notes? }
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireScopedFunction } from '@/lib/rbac/middleware'
import { PERSONNEL } from '@/lib/rbac/function-codes'
import { StatusHistoryService } from '@/lib/services/personnel/status-history.service'
import { logAudit } from '@/lib/audit'

// ─── GET ──────────────────────────────────────────────────────────────────────

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { user, response } = await requireScopedFunction(request, PERSONNEL.VIEW_DETAIL)
    if (!user) return response!

    const result = await StatusHistoryService.list(params.id)

    return NextResponse.json({ success: true, data: result.data })
  } catch (error) {
    console.error('[GET /api/personnel/[id]/status-history]', error)
    return NextResponse.json(
      { success: false, error: 'Lỗi khi tải lịch sử trạng thái' },
      { status: 500 },
    )
  }
}

// ─── POST ─────────────────────────────────────────────────────────────────────

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { user, response } = await requireScopedFunction(request, PERSONNEL.UPDATE)
    if (!user) return response!

    const body = await request.json()
    const { toStatus, effectiveDate, decisionNumber, reason, notes } = body

    if (!toStatus || !effectiveDate) {
      return NextResponse.json(
        { success: false, error: 'toStatus và effectiveDate là bắt buộc' },
        { status: 400 },
      )
    }

    const result = await StatusHistoryService.create({
      personnelId: params.id,
      toStatus,
      effectiveDate,
      decisionNumber,
      reason,
      notes,
      recordedById: user.id,
    })

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: (result as { status?: number }).status ?? 400 },
      )
    }

    await logAudit({
      userId: user.id,
      functionCode: PERSONNEL.UPDATE,
      action: 'CREATE',
      resourceType: 'STATUS_HISTORY',
      resourceId: params.id,
      result: 'SUCCESS',
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
    })

    return NextResponse.json({ success: true, data: result.data }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/personnel/[id]/status-history]', error)
    return NextResponse.json(
      { success: false, error: 'Lỗi khi ghi nhận thay đổi trạng thái' },
      { status: 500 },
    )
  }
}
