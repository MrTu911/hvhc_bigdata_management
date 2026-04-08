/**
 * API: Party Recruitment Pipeline (UC-65)
 * Path: /api/party/recruitment
 *
 * Quản lý pipeline theo dõi ứng viên kết nạp Đảng.
 * Đây là entity riêng (PartyRecruitmentPipeline) – khác với PartyMemberHistory
 * vốn là audit log sau khi sự kiện đã xảy ra.
 */
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAnyFunction } from '@/lib/rbac/middleware';
import { PARTY } from '@/lib/rbac/function-codes';

// ── GET /api/party/recruitment ─────────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAnyFunction(request, [PARTY.VIEW, PARTY.VIEW_MEMBER]);
    if (!authResult.allowed) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const currentStep = searchParams.get('currentStep') || '';
    const search = searchParams.get('search') || '';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50')));
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (currentStep) {
      where.currentStep = currentStep;
    }
    if (search) {
      where.user = {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { militaryId: { contains: search, mode: 'insensitive' } },
        ],
      };
    }

    const [items, total] = await Promise.all([
      prisma.partyRecruitmentPipeline.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              militaryId: true,
              email: true,
              rank: true,
            },
          },
          targetPartyOrg: {
            select: { id: true, name: true, code: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.partyRecruitmentPipeline.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        items,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('[Party Recruitment GET]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ── POST /api/party/recruitment ────────────────────────────────────────────
// Upsert theo userId (userId là unique trong PartyRecruitmentPipeline).
// Nếu ứng viên đã có pipeline thì cập nhật bước hiện tại.
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAnyFunction(request, [PARTY.CREATE, PARTY.CREATE_MEMBER]);
    if (!authResult.allowed) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const {
      userId,
      targetPartyOrgId,
      currentStep,
      dossierStatus,
      assistantMember1,
      assistantMember2,
      note,
    } = body as {
      userId?: string;
      targetPartyOrgId?: string;
      currentStep?: string;
      dossierStatus?: string;
      assistantMember1?: string;
      assistantMember2?: string;
      note?: string;
    };

    if (!userId?.trim()) {
      return NextResponse.json({ error: 'userId là bắt buộc' }, { status: 400 });
    }
    if (!targetPartyOrgId?.trim()) {
      return NextResponse.json({ error: 'targetPartyOrgId là bắt buộc' }, { status: 400 });
    }

    const item = await prisma.partyRecruitmentPipeline.upsert({
      where: { userId },
      create: {
        userId,
        targetPartyOrgId,
        currentStep: (currentStep as any) ?? 'THEO_DOI',
        dossierStatus: dossierStatus ?? null,
        assistantMember1: assistantMember1 ?? null,
        assistantMember2: assistantMember2 ?? null,
        note: note ?? null,
      },
      update: {
        targetPartyOrgId,
        currentStep: (currentStep as any) ?? 'THEO_DOI',
        dossierStatus: dossierStatus ?? null,
        assistantMember1: assistantMember1 ?? null,
        assistantMember2: assistantMember2 ?? null,
        note: note ?? null,
      },
      include: {
        user: { select: { id: true, name: true, militaryId: true } },
        targetPartyOrg: { select: { id: true, name: true, code: true } },
      },
    });

    return NextResponse.json({ success: true, data: item }, { status: 201 });
  } catch (error) {
    console.error('[Party Recruitment POST]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
