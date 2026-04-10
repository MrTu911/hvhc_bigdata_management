/**
 * GET /api/science/library/:id/download
 * Trả presigned MinIO URL (15 phút) + ghi LibraryAccessLog.
 *
 * Security:
 *   - CONFIDENTIAL: cần LIBRARY_DOWNLOAD_NORMAL
 *   - SECRET: cần LIBRARY_DOWNLOAD_SECRET + IP whitelist nội bộ
 *
 * RBAC: SCIENCE.LIBRARY_DOWNLOAD_NORMAL (SECRET check thêm trong service)
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireFunction } from '@/lib/rbac/middleware'
import { authorize } from '@/lib/rbac/authorize'
import { SCIENCE } from '@/lib/rbac/function-codes'
import { libraryService } from '@/lib/services/science/library.service'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  const auth = await requireFunction(req, SCIENCE.LIBRARY_DOWNLOAD_NORMAL)
  if (!auth.allowed) return auth.response!

  const { id } = await params

  const secretCheck = await authorize(auth.user!, SCIENCE.LIBRARY_DOWNLOAD_SECRET)
  const canViewSecret = secretCheck.allowed
  // CONFIDENTIAL: bất kỳ user có DOWNLOAD_NORMAL đều xem được
  const canViewConfidential = true

  // Lấy IP thật từ header (có thể qua proxy)
  const clientIp =
    req.headers.get('x-real-ip') ??
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    undefined

  const ipAddress = req.headers.get('x-forwarded-for') ?? undefined

  const result = await libraryService.getDownloadUrl(
    id,
    canViewConfidential,
    canViewSecret,
    auth.user!.id,
    clientIp,
    ipAddress
  )

  if (!result.success) {
    const status = result.error.includes('whitelist') || result.error.includes('MẬT') ? 403 : 404
    return NextResponse.json({ success: false, error: result.error }, { status })
  }

  return NextResponse.json({ success: true, data: result.data })
}
