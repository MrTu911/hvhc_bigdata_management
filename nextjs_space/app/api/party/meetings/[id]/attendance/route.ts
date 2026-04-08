import { NextRequest, NextResponse } from 'next/server';
import { requireFunction } from '@/lib/rbac/middleware';
import { PARTY } from '@/lib/rbac/function-codes';
import { logAudit } from '@/lib/audit';
import { upsertMeetingAttendance } from '@/lib/services/party/party-meeting.service';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const auth = await requireFunction(request, PARTY.MANAGE_MEETING);
    if (!auth.allowed) {
      return NextResponse.json({ success: false, error: auth.authResult?.deniedReason || 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const updated = await upsertMeetingAttendance(params.id, body);

    await logAudit({
      userId: auth.user!.id,
      functionCode: PARTY.MANAGE_MEETING,
      action: 'UPSERT_MEETING_ATTENDANCE',
      resourceType: 'PARTY_MEETING',
      resourceId: params.id,
      newValue: body,
      result: 'SUCCESS',
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    const status = /rỗng|bắt buộc|không tìm thấy|present\/absent/i.test(message) ? 400 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
