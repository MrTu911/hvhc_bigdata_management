/**
 * POST /api/science/projects/:id/archive
 * Lưu trữ đề tài đã hoàn thành — ghi completionScore, completionGrade, chuyển phase ARCHIVED.
 *
 * RBAC: PROJECT_APPROVE_ACADEMY (archive là thao tác cấp học viện)
 *
 * Business rule:
 *   - Chỉ đề tài COMPLETED mới được archive.
 *   - Sau archive: project.phase = ARCHIVED, status giữ nguyên COMPLETED.
 *   - Lock: PATCH /projects/:id trả 409 sau khi phase = ARCHIVED.
 *
 * Hook điểm Sprint-07:
 *   - TODO: Trigger M24 budget.finalize() nếu ResearchBudget tồn tại
 *   - TODO: Trigger M23 council.lock() nếu ScientificCouncil tồn tại
 *   - TODO: Trigger M25 library.indexProject() để index ấn phẩm vào thư viện
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireFunction } from '@/lib/rbac/middleware'
import { SCIENCE } from '@/lib/rbac/function-codes'
import { projectService } from '@/lib/services/science/project.service'
import { z } from 'zod'

interface RouteParams {
  params: Promise<{ id: string }>
}

const archiveBodySchema = z.object({
  completionScore: z.number().min(0).max(10).optional(),
  completionGrade: z.string().max(50).optional(),
  comment: z.string().max(2000).optional(),
})

export async function POST(req: NextRequest, { params }: RouteParams) {
  const auth = await requireFunction(req, SCIENCE.PROJECT_APPROVE_ACADEMY)
  if (!auth.allowed) return auth.response!

  const { id } = await params
  const body = await req.json()

  const parsed = archiveBodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const ipAddress = req.headers.get('x-forwarded-for') ?? undefined
  const result = await projectService.archiveProject(id, parsed.data, auth.user!.id, ipAddress)

  if (!result.success) {
    return NextResponse.json({ success: false, error: result.error }, { status: 400 })
  }

  return NextResponse.json({ success: true, data: result.data, error: null })
}
