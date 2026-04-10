/**
 * POST /api/science/library/semantic-search
 * Tìm kiếm ngữ nghĩa trong thư viện số.
 *
 * Pipeline: query text → text-embedding-3-small → pgvector cosine (<=>)
 * Chỉ tìm trong items đã isIndexed=true và trong phạm vi sensitivity của user.
 *
 * Graceful fallback: nếu pgvector chưa migrate (Phase 5 chưa xong),
 * trả empty array với note giải thích.
 *
 * RBAC: SCIENCE.SEARCH_USE
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireFunction } from '@/lib/rbac/middleware'
import { authorize } from '@/lib/rbac/authorize'
import { SCIENCE } from '@/lib/rbac/function-codes'
import { libraryService } from '@/lib/services/science/library.service'
import { semanticSearchSchema } from '@/lib/validations/science-library'

export async function POST(req: NextRequest) {
  const auth = await requireFunction(req, SCIENCE.SEARCH_USE)
  if (!auth.allowed) return auth.response!

  const body = await req.json()
  const parsed = semanticSearchSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const [confCheck, secretCheck] = await Promise.all([
    authorize(auth.user!, SCIENCE.LIBRARY_DOWNLOAD_NORMAL),
    authorize(auth.user!, SCIENCE.LIBRARY_DOWNLOAD_SECRET),
  ])

  const result = await libraryService.semanticSearch(
    parsed.data,
    confCheck.allowed,
    secretCheck.allowed
  )

  if (!result.success) {
    return NextResponse.json({ success: false, error: result.error }, { status: 503 })
  }

  return NextResponse.json({ success: true, data: result.data })
}
