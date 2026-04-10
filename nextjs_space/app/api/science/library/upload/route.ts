/**
 * POST /api/science/library/upload
 * Upload tài liệu số vào thư viện KH.
 *
 * Pipeline: receive multipart → ClamAV scan → MinIO → DB → BullMQ index job
 *
 * Body: multipart/form-data
 *   - file:        File (required, max 200MB)
 *   - title:       string (required)
 *   - sensitivity: NORMAL|CONFIDENTIAL|SECRET (default NORMAL)
 *   - workId:      string cuid (optional, FK → ScientificWork)
 *
 * RBAC: SCIENCE.LIBRARY_UPLOAD
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireFunction } from '@/lib/rbac/middleware'
import { SCIENCE } from '@/lib/rbac/function-codes'
import { libraryService } from '@/lib/services/science/library.service'
import { libraryUploadMetaSchema, ALLOWED_MIME_TYPES, MAX_FILE_SIZE_BYTES } from '@/lib/validations/science-library'

export const runtime = 'nodejs'

// Next.js 14: disable default body parser để đọc multipart
export const config = {
  api: { bodyParser: false },
}

export async function POST(req: NextRequest) {
  const auth = await requireFunction(req, SCIENCE.LIBRARY_UPLOAD)
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

  // Validate mime type sớm
  if (!(ALLOWED_MIME_TYPES as readonly string[]).includes(file.type)) {
    return NextResponse.json(
      { success: false, error: `Loại file không được phép: ${file.type}` },
      { status: 415 }
    )
  }

  // Validate size trước khi đọc buffer
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return NextResponse.json({ success: false, error: 'File vượt quá 200MB' }, { status: 413 })
  }

  const metaParsed = libraryUploadMetaSchema.safeParse({
    title: formData.get('title'),
    sensitivity: formData.get('sensitivity') ?? 'NORMAL',
    workId: formData.get('workId') ?? undefined,
  })

  if (!metaParsed.success) {
    return NextResponse.json(
      { success: false, error: metaParsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const ipAddress = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? undefined

  const result = await libraryService.uploadItem(
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

  return NextResponse.json(
    {
      success: true,
      data: result.data,
      indexJobId: result.indexJobId,
    },
    { status: 201 }
  )
}
