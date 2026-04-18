/**
 * DELETE /api/science/attachments/[id]
 *   → Soft delete file minh chứng (isDeleted=true)
 *
 * RBAC: SCIENCE.ATTACHMENT_DELETE
 *   Người upload của chính file đó có thể xóa.
 *   Admin (ATTACHMENT_DELETE) có thể xóa bất kỳ file.
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireFunction } from '@/lib/rbac/middleware'
import { SCIENCE } from '@/lib/rbac/function-codes'
import { attachmentService } from '@/lib/services/science/attachment.service'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireFunction(req, SCIENCE.ATTACHMENT_VIEW)
  if (!auth.allowed) return auth.response!

  const { id } = params
  const userId = auth.user!.id

  // Kiểm tra ownership: người upload có thể tự xóa file của mình
  const item = await prisma.scienceAttachment.findFirst({
    where: { id, isDeleted: false },
    select: { uploadedById: true },
  })

  if (!item) {
    return NextResponse.json({ success: false, error: 'Không tìm thấy tài liệu' }, { status: 404 })
  }

  // Chỉ người upload hoặc có quyền ATTACHMENT_DELETE mới được xóa
  const isOwner = item.uploadedById === userId
  const hasDeleteRight = await hasAttachmentDeletePermission(req)

  if (!isOwner && !hasDeleteRight) {
    return NextResponse.json(
      { success: false, error: 'Không có quyền xóa tài liệu này' },
      { status: 403 }
    )
  }

  const ipAddress = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? undefined
  const result = await attachmentService.deleteAttachment(id, userId, ipAddress)

  if (!result.success) {
    return NextResponse.json({ success: false, error: result.error }, { status: 404 })
  }

  return NextResponse.json({ success: true })
}

async function hasAttachmentDeletePermission(req: NextRequest): Promise<boolean> {
  const check = await requireFunction(req, SCIENCE.ATTACHMENT_DELETE)
  return check.allowed
}
