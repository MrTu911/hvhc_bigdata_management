/**
 * POST /api/science/works/check-duplicate
 * Kiểm tra trùng lặp công trình KH.
 *
 * Phase 3: BM25 candidate retrieval + Levenshtein similarity (threshold 0.80).
 * Phase 5: Thay bằng pgvector cosine similarity + embedding pipeline.
 *
 * RBAC: SCIENCE.WORK_CREATE (người có quyền tạo mới mới cần check dup)
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireFunction } from '@/lib/rbac/middleware'
import { SCIENCE } from '@/lib/rbac/function-codes'
import { workService } from '@/lib/services/science/work.service'
import { duplicateCheckSchema } from '@/lib/validations/science-work'

export async function POST(req: NextRequest) {
  const auth = await requireFunction(req, SCIENCE.WORK_CREATE)
  if (!auth.allowed) return auth.response!

  const body = await req.json()
  const parsed = duplicateCheckSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const result = await workService.checkDuplicate(parsed.data)

  return NextResponse.json({ success: true, data: result.data })
}
