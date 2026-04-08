/**
 * Profile360 API – M02 Phase 3
 * GET /api/personnel/[id]/profile360
 *
 * [id] = Personnel.id  (từ bảng personnel, không phải User.id)
 *
 * RBAC:
 *   - VIEW_PERSONNEL_DETAIL: bắt buộc để xem hồ sơ cơ bản
 *   - VIEW_PERSONNEL_SENSITIVE: tùy chọn — nếu không có, sensitive fields bị omit
 *
 * Scope:
 *   - ACADEMY: xem tất cả
 *   - DEPARTMENT/UNIT: chỉ xem cán bộ cùng đơn vị hoặc đơn vị con
 *   - SELF: chỉ xem hồ sơ của chính mình (kiểm tra personnel.account.id === user.id)
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireScopedFunction } from '@/lib/rbac/middleware'
import { authorize } from '@/lib/rbac/authorize'
import { PERSONNEL } from '@/lib/rbac/function-codes'
import { buildProfile360 } from '@/lib/services/personnel/personnel-profile360.service'
import { logAudit } from '@/lib/audit'
import db from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    // ── 1. Auth: must have VIEW_PERSONNEL_DETAIL ──────────────────────────────
    const { user, scope, response } = await requireScopedFunction(
      request,
      PERSONNEL.VIEW_DETAIL,
    )
    if (!user) return response!

    const personnelId = params.id

    // ── 2. Load Personnel (need unitId for scope check) ───────────────────────
    const personnelSnap = await db.personnel.findUnique({
      where: { id: personnelId, deletedAt: null },
      select: {
        id: true,
        unitId: true,
        account: { select: { id: true } },
      },
    })

    if (!personnelSnap) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy cán bộ' }, { status: 404 })
    }

    // ── 3. Scope check ────────────────────────────────────────────────────────
    // [M01-RBAC-HOOK] checkScopeAccess(user.id, personnelId, 'PERSONNEL.VIEW_DETAIL')
    // When wiring full hierarchy: replace with authorize() + getAccessibleUnitIds()
    const currentScope = scope || 'SELF'
    const isOwn = personnelSnap.account?.id === user.id

    if (currentScope === 'SELF' && !isOwn) {
      return NextResponse.json(
        { success: false, error: 'Không có quyền xem hồ sơ cán bộ này' },
        { status: 403 },
      )
    }

    if ((currentScope === 'UNIT' || currentScope === 'DEPARTMENT') && !isOwn) {
      // [M01-RBAC-HOOK] expand to child units via getAccessibleUnitIds(user, scope)
      if (personnelSnap.unitId && user.unitId && personnelSnap.unitId !== user.unitId) {
        return NextResponse.json(
          { success: false, error: 'Không có quyền xem hồ sơ cán bộ này' },
          { status: 403 },
        )
      }
    }

    // ── 4. Check sensitive permission ─────────────────────────────────────────
    const sensitiveAuth = await authorize(
      { id: user.id, email: user.email!, role: user.role || '', unitId: user.unitId },
      PERSONNEL.VIEW_SENSITIVE,
    )
    const canViewSensitive = sensitiveAuth.allowed

    // ── 5. Aggregate profile360 ───────────────────────────────────────────────
    const profile360 = await buildProfile360(personnelId)

    // ── 6. Strip sensitive fields if no permission ────────────────────────────
    if (!canViewSensitive && profile360.personnel) {
      // Omit permanentAddress, temporaryAddress, bloodType for non-sensitive viewers
      const { permanentAddress, temporaryAddress, bloodType, ...safePerson } = profile360.personnel
      profile360.personnel = safePerson as typeof profile360.personnel
    }

    // ── 7. Audit log ──────────────────────────────────────────────────────────
    await logAudit({
      userId: user.id,
      functionCode: PERSONNEL.VIEW_DETAIL,
      action: 'VIEW_PROFILE360',
      resourceType: 'PERSONNEL_MASTER',
      resourceId: personnelId,
      result: 'SUCCESS',
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
    })

    return NextResponse.json({
      success: true,
      data: profile360,
      meta: {
        canViewSensitive,
        hasUserBridge: profile360._bridge.userId !== null,
        warningCount: profile360.warnings.length,
      },
    })
  } catch (error) {
    console.error('[GET /api/personnel/[id]/profile360]', error)
    return NextResponse.json(
      { success: false, error: 'Lỗi khi tải hồ sơ 360°' },
      { status: 500 },
    )
  }
}
