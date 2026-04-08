import { NextRequest, NextResponse } from 'next/server';
import { requireFunction } from '@/lib/rbac/middleware';
import { PARTY } from '@/lib/rbac/function-codes';
import { logAudit } from '@/lib/audit';
import { getPartyMeetingById } from '@/lib/services/party/party-meeting.service';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const auth = await requireFunction(request, PARTY.VIEW);
    if (!auth.allowed) {
      return NextResponse.json({ success: false, error: auth.authResult?.deniedReason || 'Forbidden' }, { status: 403 });
    }

    const meeting = await getPartyMeetingById(params.id);
    if (!meeting) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy cuộc họp' }, { status: 404 });
    }

    await logAudit({
      userId: auth.user!.id,
      functionCode: PARTY.VIEW,
      action: 'VIEW_MEETING_DETAIL',
      resourceType: 'PARTY_MEETING',
      resourceId: params.id,
      result: 'SUCCESS',
    });

    return NextResponse.json({ success: true, data: meeting });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Internal server error' }, { status: 500 });
  }
}
