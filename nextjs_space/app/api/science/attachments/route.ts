/**
 * GET  /api/science/attachments?entityType=PROPOSAL&entityId=xxx
 *   → Liệt kê file minh chứng của một entity
 *
 * POST /api/science/attachments  (multipart/form-data)
 *   → Upload file minh chứng mới
 *
 * RBAC: SCIENCE.ATTACHMENT_VIEW (GET), SCIENCE.ATTACHMENT_UPLOAD (POST)
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireFunction } from '@/lib/rbac/middleware'
import { SCIENCE } from '@/lib/rbac/function-codes'
import { attachmentService } from '@/lib/services/science/attachment.service'
import {
  attachmentListQuerySchema,
  attachmentUploadSchema,
  ATTACHMENT_ALLOWED_MIME_TYPES,
  MAX_ATTACHMENT_SIZE_BYTES,
} from '@/lib/validations/science-attachment'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const auth = await requireFunction(req, SCIENCE.ATTACHMENT_VIEW)
  if (!auth.allowed) return auth.response!

  const { searchParams } = new URL(req.url)
  const parsed = attachmentListQuerySchema.safeParse({
    entityType: searchParams.get('entityType'),
    entityId: searchParams.get('entityId'),
  })

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const result = await attachmentService.listAttachments(parsed.data.entityType, parsed.data.entityId)
  return NextResponse.json(result)
}

export async function POST(req: NextRequest) {
  const auth = await requireFunction(req, SCIENCE.ATTACHMENT_UPLOAD)
  if (!auth.allowed) return auth.response!

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
      { success: false, error: `Loại file không được phép: ${file.type}` },
      { status: 415 }
    )
  }

  if (file.size > MAX_ATTACHMENT_SIZE_BYTES) {
    return NextResponse.json({ success: false, error: 'File vượt quá 100MB' }, { status: 413 })
  }

  const metaParsed = attachmentUploadSchema.safeParse({
    entityType: formData.get('entityType'),
    entityId: formData.get('entityId'),
    docCategory: formData.get('docCategory'),
    title: formData.get('title'),
    description: formData.get('description') ?? undefined,
    sensitivity: formData.get('sensitivity') ?? 'NORMAL',
  })

  if (!metaParsed.success) {
    return NextResponse.json(
      { success: false, error: metaParsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const ipAddress = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? undefined

  const result = await attachmentService.uploadAttachment(
    buffer,
    file.name,
    file.type,
    metaParsed.data,
    auth.user!.id,
    ipAddress
  )

  if (!result.success) {
    const status = result.error.includes('ClamAV') ? 422 : 400
    return NextResponse.json({ success: false, error: result.error }, { status })
  }

  return NextResponse.json({ success: true, data: result.data }, { status: 201 })
}
