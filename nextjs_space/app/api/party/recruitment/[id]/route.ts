/**
 * PATCH /api/party/recruitment/[id]
 * Advance or update a recruitment pipeline record (step, dossierStatus, note, dates).
 */
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAnyFunction } from '@/lib/rbac/middleware';
import { PARTY } from '@/lib/rbac/function-codes';

const STEP_ORDER = [
  'THEO_DOI',
  'HOC_CAM_TINH',
  'DOI_TUONG',
  'CHI_BO_XET',
  'CAP_TREN_DUYET',
  'DA_KET_NAP',
] as const;

type RecruitmentStep = typeof STEP_ORDER[number];

function stepDateField(step: RecruitmentStep): string | null {
  const map: Record<RecruitmentStep, string | null> = {
    THEO_DOI: null,
    HOC_CAM_TINH: 'camTinhDate',
    DOI_TUONG: 'doiTuongDate',
    CHI_BO_XET: 'chiBoProposalDate',
    CAP_TREN_DUYET: 'capTrenApprovalDate',
    DA_KET_NAP: 'joinedDate',
  };
  return map[step];
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const auth = await requireAnyFunction(request, [PARTY.UPDATE, PARTY.UPDATE_MEMBER]);
    if (!auth.allowed) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { currentStep, dossierStatus, note, assistantMember1, assistantMember2 } = body as {
      currentStep?: string;
      dossierStatus?: string;
      note?: string;
      assistantMember1?: string;
      assistantMember2?: string;
    };

    const pipeline = await prisma.partyRecruitmentPipeline.findUnique({
      where: { id: params.id },
    });
    if (!pipeline) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy hồ sơ' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    if (dossierStatus !== undefined) updateData.dossierStatus = dossierStatus;
    if (note !== undefined) updateData.note = note;
    if (assistantMember1 !== undefined) updateData.assistantMember1 = assistantMember1;
    if (assistantMember2 !== undefined) updateData.assistantMember2 = assistantMember2;

    if (currentStep && STEP_ORDER.includes(currentStep as RecruitmentStep)) {
      updateData.currentStep = currentStep as RecruitmentStep;
      const dateField = stepDateField(currentStep as RecruitmentStep);
      if (dateField && !(pipeline as any)[dateField]) {
        updateData[dateField] = new Date();
      }
    }

    const updated = await prisma.partyRecruitmentPipeline.update({
      where: { id: params.id },
      data: updateData as any,
      include: {
        user: { select: { id: true, name: true, militaryId: true, email: true } },
        targetPartyOrg: { select: { id: true, name: true, code: true } },
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    );
  }
}
