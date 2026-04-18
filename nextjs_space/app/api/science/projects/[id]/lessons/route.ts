import { NextRequest, NextResponse } from 'next/server'
import { requireAnyFunction } from '@/lib/rbac/middleware'
import { SCIENCE } from '@/lib/rbac/function-codes'
import { lifecycleService } from '@/lib/services/science/lifecycle.service'
import { logAudit } from '@/lib/audit'

export const dynamic = 'force-dynamic'

const VALID_CATEGORIES = ['MANAGEMENT', 'TECHNICAL', 'FINANCIAL', 'COLLABORATION', 'OTHER']
const VALID_IMPACTS = ['HIGH', 'MEDIUM', 'LOW']

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/science/projects/[id]/lessons — danh sách bài học kinh nghiệm
export async function GET(req: NextRequest, { params }: RouteParams) {
  const auth = await requireAnyFunction(req, [
    SCIENCE.PROJECT_CREATE,
    SCIENCE.PROJECT_APPROVE_DEPT,
    SCIENCE.PROJECT_APPROVE_ACADEMY,
    SCIENCE.SCIENTIST_VIEW,
  ])
  if (!auth.allowed) return auth.response!

  const { id } = await params
  const lessons = await lifecycleService.listLessons(id)
  return NextResponse.json({ success: true, data: lessons, error: null })
}

// POST /api/science/projects/[id]/lessons — thêm bài học kinh nghiệm
export async function POST(req: NextRequest, { params }: RouteParams) {
  const auth = await requireAnyFunction(req, [
    SCIENCE.PROJECT_CREATE,
    SCIENCE.PROJECT_APPROVE_DEPT,
    SCIENCE.PROJECT_APPROVE_ACADEMY,
  ])
  if (!auth.allowed) return auth.response!

  const { id } = await params
  const body = await req.json()
  const { category, title, description, impact, recommendation } = body

  if (!category || !title || !description || !impact) {
    return NextResponse.json(
      { success: false, data: null, error: 'category, title, description, impact là bắt buộc' },
      { status: 400 }
    )
  }
  if (!VALID_CATEGORIES.includes(category)) {
    return NextResponse.json(
      { success: false, data: null, error: `category phải là ${VALID_CATEGORIES.join(' | ')}` },
      { status: 400 }
    )
  }
  if (!VALID_IMPACTS.includes(impact)) {
    return NextResponse.json(
      { success: false, data: null, error: `impact phải là ${VALID_IMPACTS.join(' | ')}` },
      { status: 400 }
    )
  }

  const lesson = await lifecycleService.createLesson({
    projectId: id,
    category,
    title,
    description,
    impact,
    recommendation,
    addedById: auth.user!.id,
  })

  await logAudit({
    userId: auth.user!.id,
    functionCode: SCIENCE.PROJECT_CREATE,
    action: 'CREATE',
    resourceType: 'NckhLessonLearned',
    resourceId: lesson.id,
    result: 'SUCCESS',
    ipAddress: req.headers.get('x-forwarded-for') ?? undefined,
  })

  return NextResponse.json({ success: true, data: lesson, error: null }, { status: 201 })
}
