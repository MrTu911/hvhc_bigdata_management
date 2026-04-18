import { NextRequest, NextResponse } from 'next/server'
import { requireAnyFunction } from '@/lib/rbac/middleware'
import { SCIENCE } from '@/lib/rbac/function-codes'
import { lifecycleService } from '@/lib/services/science/lifecycle.service'
import { logAudit } from '@/lib/audit'

export const dynamic = 'force-dynamic'

interface RouteParams {
  params: Promise<{ id: string; meetId: string }>
}

// GET /api/science/councils/[id]/meetings/[meetId] — chi tiết phiên họp
export async function GET(req: NextRequest, { params }: RouteParams) {
  const auth = await requireAnyFunction(req, [
    SCIENCE.COUNCIL_MANAGE,
    SCIENCE.COUNCIL_SUBMIT_REVIEW,
    SCIENCE.COUNCIL_FINALIZE,
    SCIENCE.PROJECT_APPROVE_ACADEMY,
  ])
  if (!auth.allowed) return auth.response!

  const { meetId } = await params
  const meeting = await lifecycleService.getMeeting(meetId)
  if (!meeting) {
    return NextResponse.json({ success: false, data: null, error: 'Không tìm thấy phiên họp' }, { status: 404 })
  }

  return NextResponse.json({ success: true, data: meeting, error: null })
}

// PATCH /api/science/councils/[id]/meetings/[meetId] — cập nhật phiên họp (biên bản...)
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const auth = await requireAnyFunction(req, [
    SCIENCE.COUNCIL_MANAGE,
    SCIENCE.PROJECT_APPROVE_ACADEMY,
  ])
  if (!auth.allowed) return auth.response!

  const { meetId } = await params
  const body = await req.json()
  const { meetingDate, location, agenda, minutesContent, minutesUrl, attendanceCount } = body

  const updateData: Parameters<typeof lifecycleService.updateMeeting>[1] = {}
  if (meetingDate !== undefined) updateData.meetingDate = new Date(meetingDate)
  if (location !== undefined) updateData.location = location
  if (agenda !== undefined) updateData.agenda = agenda
  if (minutesContent !== undefined) updateData.minutesContent = minutesContent
  if (minutesUrl !== undefined) updateData.minutesUrl = minutesUrl
  if (attendanceCount != null) updateData.attendanceCount = Number(attendanceCount)

  const updated = await lifecycleService.updateMeeting(meetId, updateData)

  await logAudit({
    userId: auth.user!.id,
    functionCode: SCIENCE.COUNCIL_MANAGE,
    action: 'UPDATE',
    resourceType: 'NckhCouncilMeeting',
    resourceId: meetId,
    result: 'SUCCESS',
    ipAddress: req.headers.get('x-forwarded-for') ?? undefined,
  })

  return NextResponse.json({ success: true, data: updated, error: null })
}
