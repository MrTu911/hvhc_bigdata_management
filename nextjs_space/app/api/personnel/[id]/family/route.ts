/**
 * GET  /api/personnel/[id]/family  — danh sách thành viên gia đình
 * POST /api/personnel/[id]/family  — thêm thành viên gia đình
 *
 * [id] = Personnel.id
 *
 * Encryption: citizenId và phoneNumber được mã hóa AES-256-GCM trước khi lưu,
 * giải mã khi trả về (kế thừa từ /api/personnel/family/route.ts).
 * Sensitive fields (citizenId, phoneNumber, address) chỉ trả về khi caller
 * có PERSONNEL.VIEW_SENSITIVE (scope ACADEMY).
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
    try { out.citizenId = decrypt(out.citizenId) } catch { /* keep original if decrypt fails */ }
  }
  if (out.phoneNumber && typeof out.phoneNumber === 'string') {
    try { out.phoneNumber = decrypt(out.phoneNumber) } catch { /* keep original */ }
  }
  return out
}

// ─── GET ──────────────────────────────────────────────────────────────────────

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { user, scope, response } = await requireScopedFunction(request, PERSONNEL.VIEW_DETAIL)
    if (!user) return response!

    const authUser: AuthUser = {
      id: user.id,
      email: user.email!,
      role: user.role || '',
      unitId: user.unitId,
    }

    const result = await FamilyService.list(authUser, scope || 'SELF', params.id)

    // Decrypt sensitive fields only when they were included in the response
    const data = result.meta.includeSensitive
      ? result.data.map(decryptSensitive)
      : result.data

    await logAudit({
      userId: user.id,
      functionCode: PERSONNEL.VIEW_DETAIL,
      action: 'LIST',
      resourceType: 'FAMILY_RELATION',
      resourceId: params.id,
      result: 'SUCCESS',
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
    })

    return NextResponse.json({
      success: true,
      data,
      meta: { includeSensitive: result.meta.includeSensitive },
    })
  } catch (error) {
    console.error('[GET /api/personnel/[id]/family]', error)
    return NextResponse.json(
      { success: false, error: 'Lỗi khi tải thông tin gia đình' },
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
    const { user, scope, response } = await requireScopedFunction(request, PERSONNEL.UPDATE)
    if (!user) return response!

    const body = await request.json()

    // Encrypt sensitive fields before service call so they are stored encrypted
    const encryptedBody = encryptSensitive(body)

    const authUser: AuthUser = {
      id: user.id,
      email: user.email!,
      role: user.role || '',
      unitId: user.unitId,
    }

    const result = await FamilyService.create(
      authUser,
      scope || 'SELF',
      params.id,
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
      action: 'CREATE',
      resourceType: 'FAMILY_RELATION',
      resourceId: result.data.id,
      newValue: { personnelId: params.id, relation: result.data.relation, fullName: result.data.fullName },
      result: 'SUCCESS',
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
    })

    // Return decrypted response
    return NextResponse.json(
      { success: true, data: decryptSensitive(result.data as Record<string, unknown>) },
      { status: 201 },
    )
  } catch (error) {
    console.error('[POST /api/personnel/[id]/family]', error)
    return NextResponse.json(
      { success: false, error: 'Lỗi khi thêm thành viên gia đình' },
      { status: 500 },
    )
  }
}
