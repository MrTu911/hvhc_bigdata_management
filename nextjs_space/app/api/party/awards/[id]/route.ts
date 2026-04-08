import { NextRequest, NextResponse } from 'next/server';
import { requireAnyFunction } from '@/lib/rbac/middleware';
import { PARTY } from '@/lib/rbac/function-codes';
import { logAudit } from '@/lib/audit';
import { PartyAwardDisciplineService } from '@/lib/services/party/party-award-discipline.service';
import { partyAwardUpdateSchema } from '@/lib/validators/party/party-award.schema';
import { PartyAwardRepo } from '@/lib/repositories/party/party-award.repo';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const authResult = await requireAnyFunction(request, [PARTY.MANAGE_REVIEW, PARTY.UPDATE_MEMBER]);
    if (!authResult.allowed) {
      return NextResponse.json({ success: false, error: authResult.authResult?.deniedReason || 'Forbidden' }, { status: 403 });
    }

    const { id } = params;
    const body = await request.json();
    const parsed = partyAwardUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.issues.map(i => i.message).join('; ') }, { status: 400 });
    }

    const existing = await PartyAwardRepo.findById(id);
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy bản ghi khen thưởng' }, { status: 404 });
    }

    const updated = await PartyAwardDisciplineService.updateAward(id, parsed.data);

    await logAudit({
      userId: authResult.user!.id,
      functionCode: PARTY.UPDATE_MEMBER,
      action: 'UPDATE',
      resourceType: 'PARTY_AWARD',
      resourceId: id,
      oldValue: existing,
      newValue: parsed.data,
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
    const authResult = await requireAnyFunction(request, [PARTY.MANAGE_REVIEW, PARTY.UPDATE_MEMBER]);
    if (!authResult.allowed) {
      return NextResponse.json({ success: false, error: authResult.authResult?.deniedReason || 'Forbidden' }, { status: 403 });
    }

    const { id } = params;

    const existing = await PartyAwardRepo.findById(id);
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy bản ghi khen thưởng' }, { status: 404 });
    }

    await PartyAwardDisciplineService.deleteAward(id);

    await logAudit({
      userId: authResult.user!.id,
      functionCode: PARTY.UPDATE_MEMBER,
      action: 'DELETE',
      resourceType: 'PARTY_AWARD',
      resourceId: id,
      oldValue: existing,
      result: 'SUCCESS',
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Internal server error' }, { status: 500 });
  }
}
