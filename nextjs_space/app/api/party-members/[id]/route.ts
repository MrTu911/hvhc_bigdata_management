import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireFunction } from '@/lib/rbac/middleware';
import { PARTY } from '@/lib/rbac/function-codes';
import { prisma } from '@/lib/db';

// GET - Chi tiết đảng viên
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireFunction(request, PARTY.VIEW);
    if (!authResult.allowed) {
      return NextResponse.json({ error: authResult.authResult?.deniedReason || 'Không có quyền' || 'Forbidden' }, { status: 403 });
    }

    const member = await prisma.partyMember.findUnique({
      where: { id: params.id, deletedAt: null },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            militaryId: true,
            rank: true,
            position: true,
            phone: true,
            dateOfBirth: true,
            unitRelation: { select: { name: true, code: true } },
          },
        },
        activities: {
          where: { deletedAt: null },
          orderBy: { activityDate: 'desc' },
        },
      },
    });

    if (!member) {
      return NextResponse.json({ error: 'Không tìm thấy đảng viên' }, { status: 404 });
    }

    return NextResponse.json(member);
  } catch (error) {
    console.error('[Party Member GET]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Cập nhật đảng viên
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireFunction(request, PARTY.UPDATE);
    if (!authResult.allowed) {
      return NextResponse.json({ error: authResult.authResult?.deniedReason || 'Không có quyền' || 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { partyCardNumber, joinDate, officialDate, partyCell, partyCommittee, recommender1, recommender2, status, statusChangeReason } = body;

    const member = await prisma.partyMember.update({
      where: { id: params.id },
      data: {
        partyCardNumber,
        joinDate: joinDate ? new Date(joinDate) : undefined,
        officialDate: officialDate ? new Date(officialDate) : undefined,
        partyCell,
        partyCommittee,
        recommender1,
        recommender2,
        status,
        statusChangeDate: status ? new Date() : undefined,
        statusChangeReason,
      },
      include: {
        user: { select: { name: true, email: true } },
      },
    });

    return NextResponse.json(member);
  } catch (error) {
    console.error('[Party Member PUT]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Xóa đảng viên (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireFunction(request, PARTY.DELETE);
    if (!authResult.allowed) {
      return NextResponse.json({ error: authResult.authResult?.deniedReason || 'Không có quyền' || 'Forbidden' }, { status: 403 });
    }
    const { user } = authResult;

    await prisma.partyMember.update({
      where: { id: params.id },
      data: {
        deletedAt: new Date(),
        deletedBy: user!.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Party Member DELETE]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
