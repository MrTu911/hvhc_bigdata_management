import { NextRequest, NextResponse } from 'next/server';
import { requireFunction } from '@/lib/rbac/middleware';
import { PARTY } from '@/lib/rbac/function-codes';
import { logAudit } from '@/lib/audit';
import { createPartyMeeting, listPartyMeetings } from '@/lib/services/party/party-meeting.service';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireFunction(request, PARTY.VIEW);
    if (!auth.allowed) {
      return NextResponse.json({ success: false, error: auth.authResult?.deniedReason || 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const result = await listPartyMeetings({
      search: searchParams.get('search') || undefined,
      partyOrgId: searchParams.get('partyOrgId') || undefined,
      meetingType: searchParams.get('meetingType') || undefined,
      status: searchParams.get('status') || undefined,
      fromDate: searchParams.get('fromDate') || undefined,
      toDate: searchParams.get('toDate') || undefined,
      page: Number(searchParams.get('page') || 1),
      limit: Number(searchParams.get('limit') || 20),
    });

    await logAudit({
      userId: auth.user!.id,
      functionCode: PARTY.VIEW,
      action: 'VIEW_MEETING_LIST',
      resourceType: 'PARTY_MEETING',
      result: 'SUCCESS',
    });

    return NextResponse.json({ success: true, data: result.items, pagination: result.pagination });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireFunction(request, PARTY.CREATE);
    if (!auth.allowed) {
      return NextResponse.json({ success: false, error: auth.authResult?.deniedReason || 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const created = await createPartyMeeting(body, auth.user?.id);

    await logAudit({
      userId: auth.user!.id,
      functionCode: PARTY.CREATE,
      action: 'CREATE_MEETING',
      resourceType: 'PARTY_MEETING',
      resourceId: created.id,
      newValue: body,
      result: 'SUCCESS',
    });

    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    const status = /bắt buộc|không tồn tại|hợp lệ/i.test(message) ? 400 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
