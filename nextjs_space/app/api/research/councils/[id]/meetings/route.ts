import { NextRequest, NextResponse } from 'next/server'
import { requireFunction } from '@/lib/rbac/middleware'
import { RESEARCH } from '@/lib/rbac/function-codes'
import db from '@/lib/db'

// GET /api/research/councils/[id]/meetings — danh sách biên bản họp
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireFunction(req, RESEARCH.VIEW)
  if (!auth.allowed) return auth.response!

  try {
    const meetings = await db.nckhCouncilMeeting.findMany({
      where: { councilId: params.id },
      orderBy: { meetingDate: 'asc' },
      include: {
        createdBy: { select: { id: true, name: true } },
        votes: true,
      },
    })

    return NextResponse.json({ success: true, data: meetings })
  } catch (err) {
    console.error('[research/councils/[id]/meetings GET]', err)
    return NextResponse.json({ success: false, error: 'Lỗi khi tải biên bản họp' }, { status: 500 })
  }
}

// POST /api/research/councils/[id]/meetings — tạo biên bản họp mới
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireFunction(req, RESEARCH.APPROVE)
  if (!auth.allowed) return auth.response!

  try {
    const session = auth.session!
    const body = await req.json()
    const { meetingDate, location, agenda, minutesContent, minutesUrl, attendanceCount } = body

    if (!meetingDate) {
      return NextResponse.json({ success: false, error: 'Ngày họp là bắt buộc' }, { status: 400 })
    }

    // Kiểm tra hội đồng tồn tại
    const council = await db.scientificCouncil.findUnique({
      where: { id: params.id },
      select: { id: true },
    })
    if (!council) return NextResponse.json({ success: false, error: 'Hội đồng không tồn tại' }, { status: 404 })

    const meeting = await db.nckhCouncilMeeting.create({
      data: {
        councilId: params.id,
        meetingDate: new Date(meetingDate),
        location: location ?? null,
        agenda: agenda ?? null,
        minutesContent: minutesContent ?? null,
        minutesUrl: minutesUrl ?? null,
        attendanceCount: attendanceCount ?? 0,
        createdById: session.userId,
      },
      include: { createdBy: { select: { id: true, name: true } } },
    })

    return NextResponse.json({ success: true, data: meeting, message: 'Tạo biên bản họp thành công' }, { status: 201 })
  } catch (err) {
    console.error('[research/councils/[id]/meetings POST]', err)
    return NextResponse.json({ success: false, error: 'Lỗi khi tạo biên bản họp' }, { status: 500 })
  }
}
