import { NextRequest, NextResponse } from 'next/server';
import { requireFunction } from '@/lib/rbac/middleware';
import { PARTY } from '@/lib/rbac/function-codes';
import { logAudit } from '@/lib/audit';
import { updatePartyOrg } from '@/lib/services/party/party-org.service';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const auth = await requireFunction(request, PARTY.UPDATE);
    if (!auth.allowed) {
      return NextResponse.json({ success: false, error: auth.authResult?.deniedReason || 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const updated = await updatePartyOrg(params.id, body);
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy tổ chức Đảng' }, { status: 404 });
    }

    await logAudit({
      userId: auth.user!.id,
      functionCode: PARTY.UPDATE,
      action: 'UPDATE_ORG',
      resourceType: 'PARTY_ORG',
      resourceId: params.id,
      newValue: body,
      result: 'SUCCESS',
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    const status = /bắt buộc|không tồn tại|đã tồn tại|hợp lệ/i.test(message) ? 400 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
