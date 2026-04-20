/**
 * DELETE /api/personal/my-publications/[id]/attachments/[attachmentId]
 *   → Soft-delete file minh chứng (chỉ chủ sở hữu, DRAFT | REJECTED)
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/rbac/middleware'
import { attachmentService } from '@/lib/services/science/attachment.service'
import prisma from '@/lib/db'

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; attachmentId: string } }
) {
  const authResult = await requireAuth(req)
  if (!authResult.allowed) return authResult.response!
  const user = authResult.user!

  const pub = await prisma.nckhPublication.findUnique({
    where: { id: params.id },
    select: { authorId: true, status: true },
  })
  if (!pub) return NextResponse.json({ success: false, error: 'Không tìm thấy công bố' }, { status: 404 })
  if (pub.authorId !== user.id) return NextResponse.json({ success: false, error: 'Không có quyền' }, { status: 403 })

  const ipAddress = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? undefined
  const result = await attachmentService.deleteAttachment(params.attachmentId, user.id, ipAddress)

  if (!result.success) {
    return NextResponse.json({ success: false, error: result.error }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
