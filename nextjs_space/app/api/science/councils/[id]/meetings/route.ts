import { NextRequest, NextResponse } from 'next/server'
import { requireAnyFunction } from '@/lib/rbac/middleware'
import { SCIENCE } from '@/lib/rbac/function-codes'
import { lifecycleService } from '@/lib/services/science/lifecycle.service'
import { logAudit } from '@/lib/audit'

export const dynamic = 'force-dynamic'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/science/councils/[id]/meetings — danh sách phiên họp
export async function GET(req: NextRequest, { params }: RouteParams) {
  const auth = await requireAnyFunction(req, [
    SCIENCE.COUNCIL_MANAGE,
    SCIENCE.COUNCIL_SUBMIT_REVIEW,
    SCIENCE.COUNCIL_FINALIZE,
    SCIENCE.PROJECT_APPROVE_ACADEMY,
  ])
  if (!auth.allowed) return auth.response!

  const { id } = await params
  const meetings = await lifecycleService.listMeetings(id)
  return NextResponse.json({ success: true, data: meetings, error: null })
}

// POST /api/science/councils/[id]/meetings — tạo phiên họp mới
export async function POST(req: NextRequest, { params }: RouteParams) {
  const auth = await requireAnyFunction(req, [
    SCIENCE.COUNCIL_MANAGE,
    SCIENCE.PROJECT_APPROVE_ACADEMY,
  ])
  if (!auth.allowed) return auth.response!

  const { id } = await params
  const body = await req.json()
  const { meetingDate, location, agenda, minutesContent, minutesUrl, attendanceCount } = body

  if (!meetingDate) {
    return NextResponse.json(
      { success: false, data: null, error: 'meetingDate là bắt buộc' },
      { status: 400 }
    )
  }

  const meeting = await lifecycleService.createMeeting({
    councilId: id,
    meetingDate: new Date(meetingDate),
    location,
    agenda,
    minutesContent,
    minutesUrl,
    attendanceCount: attendanceCount != null ? Number(attendanceCount) : 0,
    createdById: auth.user!.id,
  })

  await logAudit({
    userId: auth.user!.id,
    functionCode: SCIENCE.COUNCIL_MANAGE,
    action: 'CREATE',
    resourceType: 'NckhCouncilMeeting',
    resourceId: meeting.id,
    result: 'SUCCESS',
    ipAddress: req.headers.get('x-forwarded-for') ?? undefined,
  })

  return NextResponse.json({ success: true, data: meeting, error: null }, { status: 201 })
}
