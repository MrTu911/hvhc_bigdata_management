import { NextRequest, NextResponse } from 'next/server'
import { requireFunction } from '@/lib/rbac/middleware'
import { RESEARCH } from '@/lib/rbac/function-codes'
import db from '@/lib/db'

// GET /api/research/councils/[id] — chi tiết hội đồng
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireFunction(req, RESEARCH.VIEW)
  if (!auth.allowed) return auth.response!

  try {
    const council = await db.scientificCouncil.findUnique({
      where: { id: params.id },
      include: {
        project: {
          select: {
            id: true, projectCode: true, title: true, status: true,
            category: true, field: true, budgetYear: true, budgetApproved: true,
            startDate: true, endDate: true,
          },
        },
        chairman: { select: { id: true, name: true } },
        secretary: { select: { id: true, name: true } },
        members: {
          include: {
            user: { select: { id: true, name: true } },
            scientist: { select: { id: true, primaryField: true, hIndex: true, degree: true } },
          },
        },
        reviews: true,
        meetings: {
          orderBy: { meetingDate: 'asc' },
          include: { createdBy: { select: { id: true, name: true } } },
        },
      },
    })

    if (!council) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy hội đồng' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: council })
  } catch (err) {
    console.error('[research/councils/[id] GET]', err)
    return NextResponse.json({ success: false, error: 'Lỗi khi tải thông tin hội đồng' }, { status: 500 })
  }
}

// PATCH /api/research/councils/[id] — cập nhật kết quả/ngày họp
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireFunction(req, RESEARCH.APPROVE)
  if (!auth.allowed) return auth.response!

  try {
    const body = await req.json()
    const { meetingDate, result, overallScore, conclusionText } = body

    const updateData: Record<string, unknown> = {}
    if (meetingDate !== undefined) updateData.meetingDate = meetingDate ? new Date(meetingDate) : null
    if (result !== undefined) updateData.result = result
    if (overallScore !== undefined) updateData.overallScore = overallScore
    if (conclusionText !== undefined) updateData.conclusionText = conclusionText

    const council = await db.scientificCouncil.update({
      where: { id: params.id },
      data: updateData,
      include: {
        project: { select: { id: true, projectCode: true, title: true } },
        chairman: { select: { id: true, name: true } },
      },
    })

    return NextResponse.json({ success: true, data: council, message: 'Cập nhật hội đồng thành công' })
  } catch (err) {
    console.error('[research/councils/[id] PATCH]', err)
    return NextResponse.json({ success: false, error: 'Lỗi khi cập nhật hội đồng' }, { status: 500 })
  }
}
