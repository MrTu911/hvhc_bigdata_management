import { NextRequest, NextResponse } from 'next/server';
import { requireFunction } from '@/lib/rbac/middleware';
import { PARTY } from '@/lib/rbac/function-codes';
import { logAudit } from '@/lib/audit';
import { updateMeetingMinutes } from '@/lib/services/party/party-meeting.service';

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
    const updated = await updateMeetingMinutes(params.id, body);
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy cuộc họp' }, { status: 404 });
    }

    await logAudit({
      userId: auth.user!.id,
      functionCode: PARTY.MANAGE_MEETING,
      action: 'UPDATE_MEETING_MINUTES',
      resourceType: 'PARTY_MEETING',
      resourceId: params.id,
      newValue: body,
      result: 'SUCCESS',
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Internal server error' }, { status: 500 });
  }
}
