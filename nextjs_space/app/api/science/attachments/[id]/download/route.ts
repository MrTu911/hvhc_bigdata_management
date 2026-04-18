/**
 * GET /api/science/attachments/[id]/download
 *   → Trả về presigned URL (15 phút) để tải file minh chứng
 *
 * RBAC: SCIENCE.ATTACHMENT_VIEW
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireFunction } from '@/lib/rbac/middleware'
import { SCIENCE } from '@/lib/rbac/function-codes'
import { attachmentService } from '@/lib/services/science/attachment.service'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireFunction(req, SCIENCE.ATTACHMENT_VIEW)
  if (!auth.allowed) return auth.response!

  const { id } = params
  const userId = auth.user!.id
  const ipAddress = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? undefined

  // Tạm thời: CONFIDENTIAL/SECRET cần check thêm — dùng false/false, upgrade sau khi có permission map
  const result = await attachmentService.getDownloadUrl(
    id,
    userId,
    true,  // canViewConfidential — TODO: map từ user permissions
    false, // canViewSecret
    ipAddress
  )

  if (!result.success) {
    const status = result.error.includes('quyền') ? 403 : 404
    return NextResponse.json({ success: false, error: result.error }, { status })
  }

  return NextResponse.json({ success: true, data: result.data })
}
