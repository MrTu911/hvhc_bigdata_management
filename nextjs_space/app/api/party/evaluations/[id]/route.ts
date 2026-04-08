/**
 * API: Party Evaluations [id] - Chi tiết/Cập nhật/Xóa đánh giá
 * Path: /api/party/evaluations/[id]
 * Uses PartyAnnualReview model
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireFunction } from '@/lib/rbac/middleware';
import { PARTY } from '@/lib/rbac/function-codes';
import prisma from '@/lib/db';
import { logAudit } from '@/lib/audit';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authResult = await requireFunction(request, PARTY.VIEW);
    if (!authResult.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const evaluation = await prisma.partyAnnualReview.findUnique({
      where: { id: params.id },
      include: {
        partyMember: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                militaryId: true,
                rank: true,
                position: true,
                unitRelation: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
    });

    if (!evaluation) return NextResponse.json({ error: 'Không tìm thấy đánh giá' }, { status: 404 });
    return NextResponse.json(evaluation);
  } catch (error) {
    console.error('[Party Evaluations GET/:id]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authResult = await requireFunction(request, PARTY.UPDATE);
    if (!authResult.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const user = authResult.user!;
    const body = await request.json();

    const existing = await prisma.partyAnnualReview.findUnique({ where: { id: params.id } });
    if (!existing) return NextResponse.json({ error: 'Không tìm thấy đánh giá' }, { status: 404 });

    // Prevent editing after submitted (unless political dept approving)
    const action = body.action as string | undefined;
    let updateData: any = {};

    if (action === 'SUBMIT') {
      // Unit commander submits to political dept
      if (existing.submissionStatus !== 'DRAFT') {
        return NextResponse.json({ error: 'Chỉ có thể nộp bản đánh giá đang ở trạng thái Nháp' }, { status: 409 });
      }
      updateData = { submissionStatus: 'SUBMITTED', submittedAt: new Date(), submittedBy: user.id };
    } else if (action === 'APPROVE') {
      // Political dept approves
      if (existing.submissionStatus !== 'SUBMITTED') {
        return NextResponse.json({ error: 'Chỉ có thể duyệt bản đã nộp' }, { status: 409 });
      }
      updateData = {
        submissionStatus: 'APPROVED',
        approvedBy: user.id,
        approvedAt: new Date(),
        reviewNote: body.reviewNote ?? existing.reviewNote,
      };
    } else if (action === 'REJECT') {
      // Political dept returns for revision
      if (existing.submissionStatus !== 'SUBMITTED') {
        return NextResponse.json({ error: 'Chỉ có thể trả lại bản đã nộp' }, { status: 409 });
      }
      updateData = {
        submissionStatus: 'REJECTED',
        reviewNote: body.reviewNote ?? null,
        approvedBy: null,
        approvedAt: null,
      };
    } else {
      // Regular field update — only allowed while DRAFT
      if (existing.submissionStatus !== 'DRAFT') {
        return NextResponse.json({ error: 'Không thể chỉnh sửa sau khi đã nộp. Yêu cầu ban chính trị trả lại trước.' }, { status: 409 });
      }
      updateData = {
        grade: body.grade ?? existing.grade,
        comments: body.comments !== undefined ? body.comments : existing.comments,
        reviewYear: body.reviewYear ? parseInt(String(body.reviewYear)) : existing.reviewYear,
        evidenceUrl: body.evidenceUrl !== undefined ? body.evidenceUrl : existing.evidenceUrl,
      };
    }

    const updated = await prisma.partyAnnualReview.update({
      where: { id: params.id },
      data: updateData,
      include: {
        partyMember: {
          include: {
            user: { select: { name: true, militaryId: true } },
          },
        },
      },
    });

    await logAudit({
      userId: user.id,
      functionCode: PARTY.UPDATE,
      action: action ?? 'UPDATE',
      resourceType: 'PARTY_EVALUATION',
      resourceId: params.id,
      result: 'SUCCESS',
      metadata: { action },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return NextResponse.json({ error: 'Đảng viên đã có đánh giá năm này' }, { status: 409 });
    }
    console.error('[Party Evaluations PUT/:id]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authResult = await requireFunction(request, PARTY.DELETE);
    if (!authResult.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const user = authResult.user!;

    const existing = await prisma.partyAnnualReview.findUnique({ where: { id: params.id } });
    if (!existing) return NextResponse.json({ error: 'Không tìm thấy đánh giá' }, { status: 404 });

    await prisma.partyAnnualReview.delete({ where: { id: params.id } });

    await logAudit({
      userId: user.id,
      functionCode: PARTY.DELETE,
      action: 'DELETE',
      resourceType: 'PARTY_EVALUATION',
      resourceId: params.id,
      result: 'SUCCESS',
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Party Evaluations DELETE/:id]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
