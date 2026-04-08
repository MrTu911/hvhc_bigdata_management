/**
 * DELETE /api/personnel/status-history/[entryId]
 *
 * Removes a single PersonnelStatusHistory entry by its own ID.
 * Requires PERSONNEL.UPDATE permission.
 * Note: deletion is irreversible — consider adding soft-delete when M02 audit is fully wired.
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireScopedFunction } from '@/lib/rbac/middleware'
import { PERSONNEL } from '@/lib/rbac/function-codes'
import { StatusHistoryService } from '@/lib/services/personnel/status-history.service'
import { logAudit } from '@/lib/audit'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { entryId: string } },
) {
  try {
    const { user, response } = await requireScopedFunction(request, PERSONNEL.UPDATE)
    if (!user) return response!

    const result = await StatusHistoryService.delete(params.entryId)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: (result as { status?: number }).status ?? 500 },
      )
    }

    await logAudit({
      userId: user.id,
      functionCode: PERSONNEL.UPDATE,
      action: 'DELETE',
      resourceType: 'STATUS_HISTORY',
      resourceId: params.entryId,
      result: 'SUCCESS',
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[DELETE /api/personnel/status-history/[entryId]]', error)
    return NextResponse.json(
      { success: false, error: 'Lỗi khi xóa mục lịch sử trạng thái' },
      { status: 500 },
    )
  }
}
