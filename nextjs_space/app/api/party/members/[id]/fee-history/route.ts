import { NextRequest, NextResponse } from 'next/server';
import { requireFunction } from '@/lib/rbac/middleware';
import { PARTY } from '@/lib/rbac/function-codes';
import { logAudit } from '@/lib/audit';
import { getPartyMemberFeeHistory } from '@/lib/services/party/party-fee.service';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const auth = await requireFunction(request, PARTY.VIEW);
    if (!auth.allowed) {
      return NextResponse.json({ success: false, error: auth.authResult?.deniedReason || 'Forbidden' }, { status: 403 });
    }

    const data = await getPartyMemberFeeHistory(params.id);
    if (!data) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy đảng viên' }, { status: 404 });
    }

    await logAudit({
      userId: auth.user!.id,
      functionCode: PARTY.VIEW,
      action: 'VIEW_FEE_HISTORY',
      resourceType: 'PARTY_MEMBER',
      resourceId: params.id,
      result: 'SUCCESS',
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Internal server error' }, { status: 500 });
  }
}
