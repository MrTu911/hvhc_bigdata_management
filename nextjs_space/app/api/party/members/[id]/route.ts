import { NextRequest, NextResponse } from 'next/server';
import { requireAnyFunction } from '@/lib/rbac/middleware';
import { PARTY } from '@/lib/rbac/function-codes';
import { logAudit, logSensitiveAccess } from '@/lib/audit';
import { getPartyMemberById, softDeletePartyMember, updatePartyMember } from '@/lib/services/party/party-member.service';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const authResult = await requireAnyFunction(request, [PARTY.VIEW_MEMBER, PARTY.VIEW]);
    if (!authResult.allowed) {
      return NextResponse.json({ success: false, error: authResult.authResult?.deniedReason || 'Forbidden' }, { status: 403 });
    }

    const [member, sensitiveAuth] = await Promise.all([
      getPartyMemberById(params.id),
      requireAnyFunction(request, [PARTY.VIEW_SENSITIVE], undefined, { skipRateLimit: true }),
    ]);
    if (!member) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy đảng viên' }, { status: 404 });
    }

    const canViewSensitive = sensitiveAuth.allowed;
    const responseData = canViewSensitive
      ? member
      : {
          ...member,
          confidentialNote: null,
        };

    if (canViewSensitive) {
      await logSensitiveAccess(authResult.user!.id, 'PARTY_MEMBER_CONFIDENTIAL_NOTE', params.id);
    }

    return NextResponse.json({ success: true, data: responseData });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const authResult = await requireAnyFunction(request, [PARTY.UPDATE_MEMBER, PARTY.UPDATE]);
    if (!authResult.allowed) {
      return NextResponse.json({ success: false, error: authResult.authResult?.deniedReason || 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    if (Object.prototype.hasOwnProperty.call(body, 'confidentialNote')) {
      const sensitiveAuth = await requireAnyFunction(request, [PARTY.UPDATE_SENSITIVE], undefined, { skipRateLimit: true });
      if (!sensitiveAuth.allowed) {
        return NextResponse.json({ success: false, error: 'Không có quyền cập nhật trường nhạy cảm confidentialNote' }, { status: 403 });
      }
    }

    const updated = await updatePartyMember(params.id, { ...body, updatedBy: authResult.user!.id });
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy đảng viên' }, { status: 404 });
    }

    await logAudit({
      userId: authResult.user!.id,
      functionCode: PARTY.UPDATE_MEMBER,
      action: 'UPDATE',
      resourceType: 'PARTY_MEMBER',
      resourceId: params.id,
      newValue: body,
      result: 'SUCCESS',
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const authResult = await requireAnyFunction(request, [PARTY.DELETE_MEMBER, PARTY.DELETE]);
    if (!authResult.allowed) {
      return NextResponse.json({ success: false, error: authResult.authResult?.deniedReason || 'Forbidden' }, { status: 403 });
    }

    const deleted = await softDeletePartyMember(params.id, authResult.user!.id);
    if (!deleted) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy đảng viên' }, { status: 404 });
    }

    await logAudit({
      userId: authResult.user!.id,
      functionCode: PARTY.DELETE_MEMBER,
      action: 'DELETE',
      resourceType: 'PARTY_MEMBER',
      resourceId: params.id,
      result: 'SUCCESS',
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Internal server error' }, { status: 500 });
  }
}
