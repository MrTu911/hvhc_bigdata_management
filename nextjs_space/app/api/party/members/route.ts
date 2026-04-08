import { NextRequest, NextResponse } from 'next/server';
import { requireAnyFunction, getScopeFromAuthResult } from '@/lib/rbac/middleware';
import { PARTY } from '@/lib/rbac/function-codes';
import { logAudit } from '@/lib/audit';
import { createPartyMember, listPartyMembers } from '@/lib/services/party/party-member.service';
import { getAccessibleUnitIds } from '@/lib/rbac/scope';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAnyFunction(request, [PARTY.VIEW_MEMBER, PARTY.VIEW]);
    if (!authResult.allowed) {
      return NextResponse.json({ success: false, error: authResult.authResult?.deniedReason || 'Forbidden' }, { status: 403 });
    }

    const scope = getScopeFromAuthResult(authResult.authResult);
    const unitIds = scope !== 'ACADEMY'
      ? await getAccessibleUnitIds(authResult.user!, scope)
      : undefined;

    const { searchParams } = new URL(request.url);
    const data = await listPartyMembers({
      search: searchParams.get('search') || undefined,
      status: searchParams.get('status') || undefined,
      organizationId: searchParams.get('organizationId') || undefined,
      unitIds,
      page: Number(searchParams.get('page') || 1),
      limit: Number(searchParams.get('limit') || 20),
    });

    await logAudit({
      userId: authResult.user!.id,
      functionCode: PARTY.VIEW_MEMBER,
      action: 'VIEW',
      resourceType: 'PARTY_MEMBER',
      result: 'SUCCESS',
    });

    return NextResponse.json({ success: true, data: data.items, pagination: data.pagination });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAnyFunction(request, [PARTY.CREATE_MEMBER, PARTY.CREATE]);
    if (!authResult.allowed) {
      return NextResponse.json({ success: false, error: authResult.authResult?.deniedReason || 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const created = await createPartyMember(body);

    await logAudit({
      userId: authResult.user!.id,
      functionCode: PARTY.CREATE_MEMBER,
      action: 'CREATE',
      resourceType: 'PARTY_MEMBER',
      resourceId: created.id,
      newValue: body,
      result: 'SUCCESS',
    });

    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Internal server error';
    const status = /bắt buộc|không tìm thấy|đã có/i.test(msg) ? 400 : 500;
    return NextResponse.json({ success: false, error: msg }, { status });
  }
}
