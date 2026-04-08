/**
 * PUT    /api/personnel/family/[familyId]  — cập nhật thành viên gia đình
 * DELETE /api/personnel/family/[familyId]  — xóa mềm thành viên gia đình
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireScopedFunction } from '@/lib/rbac/middleware'
import { PERSONNEL } from '@/lib/rbac/function-codes'
import { FamilyService } from '@/lib/services/personnel/family.service'
import { logAudit } from '@/lib/audit'
import { encrypt, decrypt } from '@/lib/encryption'
import type { AuthUser } from '@/lib/rbac/types'

// ─── Encryption helpers ───────────────────────────────────────────────────────

function encryptSensitive(data: Record<string, unknown>) {
  const out = { ...data }
  if (out.citizenId && typeof out.citizenId === 'string') out.citizenId = encrypt(out.citizenId)
  if (out.phoneNumber && typeof out.phoneNumber === 'string') out.phoneNumber = encrypt(out.phoneNumber)
  return out
}

function decryptSensitive(data: Record<string, unknown>) {
  if (!data) return data
  const out = { ...data }
  if (out.citizenId && typeof out.citizenId === 'string') {
    try { out.citizenId = decrypt(out.citizenId) } catch { /* keep original */ }
  }
  if (out.phoneNumber && typeof out.phoneNumber === 'string') {
    try { out.phoneNumber = decrypt(out.phoneNumber) } catch { /* keep original */ }
  }
  return out
}

// ─── PUT ──────────────────────────────────────────────────────────────────────

export async function PUT(
  request: NextRequest,
  { params }: { params: { familyId: string } },
) {
  try {
    const { user, scope, response } = await requireScopedFunction(request, PERSONNEL.UPDATE)
    if (!user) return response!

    const body = await request.json()
    const encryptedBody = encryptSensitive(body)

    const authUser: AuthUser = {
      id: user.id,
      email: user.email!,
      role: user.role || '',
      unitId: user.unitId,
    }

    const result = await FamilyService.update(
      authUser,
      scope || 'SELF',
      params.familyId,
      encryptedBody,
    )

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: result.status ?? 400 },
      )
    }

    await logAudit({
      userId: user.id,
      functionCode: PERSONNEL.UPDATE,
      action: 'UPDATE',
      resourceType: 'FAMILY_RELATION',
      resourceId: params.familyId,
      newValue: { relation: result.data.relation, fullName: result.data.fullName },
      result: 'SUCCESS',
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
    })

    return NextResponse.json({
      success: true,
      data: decryptSensitive(result.data as Record<string, unknown>),
    })
  } catch (error) {
    console.error('[PUT /api/personnel/family/[familyId]]', error)
    return NextResponse.json(
      { success: false, error: 'Lỗi khi cập nhật thành viên gia đình' },
      { status: 500 },
    )
  }
}

// ─── DELETE ───────────────────────────────────────────────────────────────────

export async function DELETE(
  request: NextRequest,
  { params }: { params: { familyId: string } },
) {
  try {
    const { user, scope, response } = await requireScopedFunction(request, PERSONNEL.DELETE)
    if (!user) return response!

    const authUser: AuthUser = {
      id: user.id,
      email: user.email!,
      role: user.role || '',
      unitId: user.unitId,
    }

    const result = await FamilyService.softDelete(authUser, scope || 'SELF', params.familyId)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: result.status ?? 400 },
      )
    }

    await logAudit({
      userId: user.id,
      functionCode: PERSONNEL.DELETE,
      action: 'DELETE',
      resourceType: 'FAMILY_RELATION',
      resourceId: params.familyId,
      result: 'SUCCESS',
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
    })

    return NextResponse.json({ success: true, data: result.data })
  } catch (error) {
    console.error('[DELETE /api/personnel/family/[familyId]]', error)
    return NextResponse.json(
      { success: false, error: 'Lỗi khi xóa thành viên gia đình' },
      { status: 500 },
    )
  }
}
