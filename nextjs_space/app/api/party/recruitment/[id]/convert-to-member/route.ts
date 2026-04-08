/**
 * M03 – UC-65: Chuyển ứng viên DA_KET_NAP → PartyMember DU_BI
 * POST /api/party/recruitment/[id]/convert-to-member
 *
 * Khi ban chấp hành chi bộ đã xét duyệt và cấp trên phê duyệt, ứng viên chính
 * thức trở thành đảng viên dự bị. Endpoint này:
 *   1. Kiểm tra pipeline đã ở bước đủ điều kiện (CHI_BO_XET hoặc DA_KET_NAP)
 *   2. Tạo PartyMember với status = DU_BI
 *   3. Ghi lifecycle trail (QUAN_CHUNG → DU_BI)
 *   4. Cập nhật pipeline currentStep = DA_KET_NAP + joinedDate
 *   5. Trả về PartyMember vừa tạo
 *
 * Guard: Sẽ reject nếu đã có PartyMember cho userId này (tránh double-convert).
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAnyFunction } from '@/lib/rbac/middleware';
import { PARTY } from '@/lib/rbac/function-codes';
import db from '@/lib/db';
import { createLifecycleTransitionTrail } from '@/lib/services/party/party-lifecycle.service';
import { logAudit } from '@/lib/audit';

const ELIGIBLE_STEPS = ['CHI_BO_XET', 'CAP_TREN_DUYET', 'DA_KET_NAP'] as const;

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const authResult = await requireAnyFunction(request, [PARTY.APPROVE_ADMISSION, PARTY.APPROVE]);
    if (!authResult.allowed) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }
    const user = authResult.user!;

    const body = await request.json().catch(() => ({}));
    const {
      organizationId,
      joinDate,
      partyCardNumber,
      recommender1,
      recommender2,
      partyRole,
    } = body as {
      organizationId?: string;
      joinDate?: string;
      partyCardNumber?: string;
      recommender1?: string;
      recommender2?: string;
      partyRole?: string;
    };

    if (!organizationId?.trim()) {
      return NextResponse.json({ success: false, error: 'organizationId (chi bộ kết nạp) là bắt buộc' }, { status: 400 });
    }

    const pipeline = await db.partyRecruitmentPipeline.findUnique({
      where: { id: params.id },
      include: { user: { select: { id: true, name: true, militaryId: true } } },
    });

    if (!pipeline) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy hồ sơ ứng viên' }, { status: 404 });
    }

    if (!ELIGIBLE_STEPS.includes(pipeline.currentStep as typeof ELIGIBLE_STEPS[number])) {
      return NextResponse.json(
        {
          success: false,
          error: `Ứng viên chưa đủ điều kiện kết nạp. Bước hiện tại: ${pipeline.currentStep}. Yêu cầu: ${ELIGIBLE_STEPS.join(' | ')}`,
        },
        { status: 422 },
      );
    }

    // Guard: prevent double-convert
    const existing = await db.partyMember.findFirst({
      where: { userId: pipeline.userId, deletedAt: null },
      select: { id: true },
    });
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Đảng viên đã tồn tại trong hệ thống (đã kết nạp trước đó)' },
        { status: 409 },
      );
    }

    const effectiveJoinDate = joinDate ? new Date(joinDate) : new Date();

    const newMember = await db.$transaction(async (tx) => {
      const member = await tx.partyMember.create({
        data: {
          userId: pipeline.userId,
          organizationId,
          status: 'DU_BI',
          joinDate: effectiveJoinDate,
          partyCardNumber: partyCardNumber ?? null,
          recommender1: recommender1 ?? null,
          recommender2: recommender2 ?? null,
          partyRole: (partyRole as any) ?? null,
          statusChangeDate: effectiveJoinDate,
          statusChangeReason: 'Kết nạp từ pipeline ứng viên',
        },
      });

      // Lifecycle trail: QUAN_CHUNG → DU_BI
      await createLifecycleTransitionTrail(tx, {
        partyMemberId: member.id,
        fromStatus: 'QUAN_CHUNG',
        toStatus: 'DU_BI',
        actorId: user.id,
        reason: 'Kết nạp đảng viên dự bị từ pipeline ứng viên',
        joinDate: effectiveJoinDate,
      });

      // Mark pipeline as DA_KET_NAP
      await tx.partyRecruitmentPipeline.update({
        where: { id: pipeline.id },
        data: {
          currentStep: 'DA_KET_NAP',
          joinedDate: effectiveJoinDate,
        },
      });

      return member;
    });

    await logAudit({
      userId: user.id,
      functionCode: PARTY.APPROVE_ADMISSION,
      action: 'CREATE',
      resourceType: 'PARTY_MEMBER',
      resourceId: newMember.id,
      newValue: {
        userId: pipeline.userId,
        organizationId,
        status: 'DU_BI',
        joinDate: effectiveJoinDate,
        convertedFromPipeline: pipeline.id,
      },
      result: 'SUCCESS',
    });

    return NextResponse.json({ success: true, data: newMember }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    );
  }
}
