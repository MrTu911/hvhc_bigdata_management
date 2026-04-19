import { NextRequest, NextResponse } from 'next/server'
import { requireFunction } from '@/lib/rbac/middleware'
import { RESEARCH } from '@/lib/rbac/function-codes'
import db from '@/lib/db'

const COUNCIL_TYPE_LABELS: Record<string, string> = {
  REVIEW: 'Hội đồng thẩm định',
  ACCEPTANCE: 'Hội đồng nghiệm thu',
  FINAL: 'Hội đồng kết luận',
}
const RESULT_LABELS: Record<string, string> = {
  PASS: 'Thông qua',
  FAIL: 'Không thông qua',
  REVISE: 'Yêu cầu sửa đổi',
}

// GET /api/research/councils — danh sách hội đồng
export async function GET(req: NextRequest) {
  const auth = await requireFunction(req, RESEARCH.VIEW)
  if (!auth.allowed) return auth.response!

  try {
    const { searchParams } = new URL(req.url)
    const page = Math.max(1, Number(searchParams.get('page') ?? '1'))
    const limit = Math.min(50, Number(searchParams.get('limit') ?? '20'))
    const skip = (page - 1) * limit
    const type = searchParams.get('type') ?? ''
    const result = searchParams.get('result') ?? ''
    const projectId = searchParams.get('projectId') ?? ''
    const keyword = searchParams.get('keyword') ?? ''

    const where: Record<string, unknown> = {}
    if (type) where.type = type
    if (result) where.result = result
    if (projectId) where.projectId = projectId
    if (keyword) {
      where.OR = [
        { project: { title: { contains: keyword, mode: 'insensitive' } } },
        { project: { projectCode: { contains: keyword, mode: 'insensitive' } } },
      ]
    }

    const [total, councils] = await Promise.all([
      db.scientificCouncil.count({ where }),
      db.scientificCouncil.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ meetingDate: 'desc' }, { createdAt: 'desc' }],
        select: {
          id: true,
          type: true,
          result: true,
          overallScore: true,
          meetingDate: true,
          conclusionText: true,
          createdAt: true,
          project: {
            select: {
              id: true, projectCode: true, title: true, status: true,
              category: true, budgetYear: true,
            },
          },
          chairman: { select: { id: true, name: true } },
          secretary: { select: { id: true, name: true } },
          _count: { select: { members: true, meetings: true } },
        },
      }),
    ])

    return NextResponse.json({
      success: true,
      data: councils.map((c) => ({
        id: c.id,
        type: c.type,
        typeLabel: COUNCIL_TYPE_LABELS[c.type] ?? c.type,
        result: c.result,
        resultLabel: c.result ? RESULT_LABELS[c.result] ?? c.result : null,
        overallScore: c.overallScore,
        meetingDate: c.meetingDate,
        conclusionText: c.conclusionText,
        createdAt: c.createdAt,
        project: c.project,
        chairman: c.chairman,
        secretary: c.secretary,
        memberCount: c._count.members,
        meetingCount: c._count.meetings,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    })
  } catch (err) {
    console.error('[research/councils GET]', err)
    return NextResponse.json({ success: false, error: 'Lỗi khi tải danh sách hội đồng' }, { status: 500 })
  }
}

// POST /api/research/councils — tạo hội đồng mới
export async function POST(req: NextRequest) {
  const auth = await requireFunction(req, RESEARCH.APPROVE)
  if (!auth.allowed) return auth.response!

  try {
    const body = await req.json()
    const { projectId, type, chairmanId, secretaryId, meetingDate, memberIds } = body

    if (!projectId || !type || !chairmanId || !secretaryId) {
      return NextResponse.json(
        { success: false, error: 'Thiếu thông tin bắt buộc: dự án, loại hội đồng, chủ tịch, thư ký' },
        { status: 400 },
      )
    }
    if (!['REVIEW', 'ACCEPTANCE', 'FINAL'].includes(type)) {
      return NextResponse.json({ success: false, error: 'Loại hội đồng không hợp lệ' }, { status: 400 })
    }

    const project = await db.nckhProject.findUnique({ where: { id: projectId }, select: { id: true } })
    if (!project) return NextResponse.json({ success: false, error: 'Đề tài không tồn tại' }, { status: 404 })

    const council = await db.scientificCouncil.create({
      data: {
        projectId,
        type,
        chairmanId,
        secretaryId,
        meetingDate: meetingDate ? new Date(meetingDate) : null,
        members: {
          create: [
            { userId: chairmanId, role: 'CHAIRMAN' },
            { userId: secretaryId, role: 'SECRETARY' },
            ...(memberIds ?? [])
              .filter((id: string) => id !== chairmanId && id !== secretaryId)
              .map((userId: string) => ({ userId, role: 'REVIEWER' })),
          ],
        },
      },
      include: {
        project: { select: { id: true, projectCode: true, title: true } },
        chairman: { select: { id: true, name: true } },
        secretary: { select: { id: true, name: true } },
        members: { include: { user: { select: { id: true, name: true } } } },
      },
    })

    return NextResponse.json({ success: true, data: council, message: 'Tạo hội đồng thành công' }, { status: 201 })
  } catch (err) {
    console.error('[research/councils POST]', err)
    return NextResponse.json({ success: false, error: 'Lỗi khi tạo hội đồng' }, { status: 500 })
  }
}
