/**
 * GET  /api/personal/my-publications/[id]/attachments
 *   → Danh sách file minh chứng của công bố (chỉ chủ sở hữu)
 *
 * POST /api/personal/my-publications/[id]/attachments  (multipart/form-data)
 *   → Upload file minh chứng mới (chỉ chủ sở hữu, status DRAFT | REJECTED)
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/rbac/middleware'
import { attachmentService } from '@/lib/services/science/attachment.service'
import {
  ATTACHMENT_ALLOWED_MIME_TYPES,
  MAX_ATTACHMENT_SIZE_BYTES,
} from '@/lib/validations/science-attachment'
import prisma from '@/lib/db'

export const runtime = 'nodejs'

async function getPubAndCheckOwner(pubId: string, userId: string) {
  const pub = await prisma.nckhPublication.findUnique({
    where: { id: pubId },
    select: { id: true, authorId: true, status: true },
  })
  if (!pub) return { pub: null, error: 'Không tìm thấy công bố', status: 404 }
  if (pub.authorId !== userId) return { pub: null, error: 'Không có quyền', status: 403 }
  return { pub, error: null, status: 200 }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await requireAuth(req)
  if (!authResult.allowed) return authResult.response!
  const user = authResult.user!

  const { pub, error, status } = await getPubAndCheckOwner(params.id, user.id)
  if (!pub) return NextResponse.json({ success: false, error }, { status })

  const result = await attachmentService.listAttachments('PUBLICATION', params.id)
  return NextResponse.json(result)
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await requireAuth(req)
  if (!authResult.allowed) return authResult.response!
  const user = authResult.user!

  const { pub, error, status } = await getPubAndCheckOwner(params.id, user.id)
  if (!pub) return NextResponse.json({ success: false, error }, { status })

  if (!['DRAFT', 'REJECTED'].includes(pub.status)) {
    return NextResponse.json(
      { success: false, error: 'Chỉ có thể upload file khi công bố ở trạng thái Nháp hoặc Bị từ chối' },
      { status: 400 }
    )
  }

  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ success: false, error: 'Request phải là multipart/form-data' }, { status: 400 })
  }

  const fileEntry = formData.get('file')
  if (!fileEntry || typeof fileEntry === 'string') {
    return NextResponse.json({ success: false, error: 'Thiếu file upload' }, { status: 400 })
  }
  const file = fileEntry as File

  if (!(ATTACHMENT_ALLOWED_MIME_TYPES as readonly string[]).includes(file.type)) {
    return NextResponse.json(
      { success: false, error: `Loại file không hỗ trợ: ${file.type}` },
      { status: 415 }
    )
  }

  if (file.size > MAX_ATTACHMENT_SIZE_BYTES) {
    return NextResponse.json({ success: false, error: 'File vượt quá 100MB' }, { status: 413 })
  }

  const title = (formData.get('title') as string | null) ?? file.name
  const ipAddress = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? undefined
  const buffer = Buffer.from(await file.arrayBuffer())

  const result = await attachmentService.uploadAttachment(
    buffer,
    file.name,
    file.type,
    {
      entityType: 'PUBLICATION',
      entityId: params.id,
      docCategory: 'TAI_LIEU_KHAC',
      title,
      sensitivity: 'NORMAL',
    },
    user.id,
    ipAddress
  )

  if (!result.success) {
    return NextResponse.json({ success: false, error: result.error }, { status: 422 })
  }

  return NextResponse.json({ success: true, data: result.data }, { status: 201 })
}
