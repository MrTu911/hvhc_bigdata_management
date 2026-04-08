import { NextRequest, NextResponse } from 'next/server';
import { requireAnyFunction } from '@/lib/rbac/middleware';
import { PARTY } from '@/lib/rbac/function-codes';
import { logAudit, logSensitiveAccess } from '@/lib/audit';
import { buildPartyMemberProfile360 } from '@/lib/services/party/party-profile360.service';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const authResult = await requireAnyFunction(request, [PARTY.VIEW_MEMBER, PARTY.VIEW]);
    if (!authResult.allowed) {
      return NextResponse.json({ success: false, error: authResult.authResult?.deniedReason || 'Forbidden' }, { status: 403 });
    }

    const [profile360, sensitiveAuth] = await Promise.all([
      buildPartyMemberProfile360(params.id),
      requireAnyFunction(request, [PARTY.VIEW_SENSITIVE], undefined, { skipRateLimit: true }),
    ]);
    if (!profile360) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy đảng viên' }, { status: 404 });
    }

    const canViewSensitive = sensitiveAuth.allowed;
    const responseData = canViewSensitive
      ? profile360
      : {
          ...profile360,
          partyMember: {
            ...profile360.partyMember,
            confidentialNote: null,
          },
        };

    if (canViewSensitive) {
      await logSensitiveAccess(authResult.user!.id, 'PARTY_MEMBER_CONFIDENTIAL_NOTE', params.id);
    }

    await logAudit({
      userId: authResult.user!.id,
      functionCode: PARTY.VIEW_MEMBER,
      action: 'VIEW_PROFILE360',
      resourceType: 'PARTY_MEMBER',
      resourceId: params.id,
      result: 'SUCCESS',
    });

    return NextResponse.json({
      success: true,
      data: responseData,
      meta: {
        boundaries: Object.fromEntries(
          Object.entries(responseData.boundaries).map(([key, value]) => [key, value.status]),
        ),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    );
  }
}
