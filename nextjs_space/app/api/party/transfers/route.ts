/**
 * API: Party Transfers - Chuyển sinh hoạt Đảng
 * Path: /api/party/transfers
 * Uses PartyMemberHistory with historyType = TRANSFER_IN / TRANSFER_OUT
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireAnyFunction } from '@/lib/rbac/middleware';
import { PARTY } from '@/lib/rbac/function-codes';
import prisma from '@/lib/db';
import { logAudit } from '@/lib/audit';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAnyFunction(request, [PARTY.VIEW_TRANSFER, PARTY.VIEW]);
    if (!authResult.allowed) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const user = authResult.user!;

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const direction = searchParams.get('direction') || ''; // 'in' | 'out'
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const historyTypes = direction === 'in'
      ? ['TRANSFER_IN']
      : direction === 'out'
      ? ['TRANSFER_OUT']
      : ['TRANSFER_IN', 'TRANSFER_OUT'];

    const where: any = { historyType: { in: historyTypes } };

    const [transfers, total] = await Promise.all([
      prisma.partyMemberHistory.findMany({
        where,
        include: {
          partyMember: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  militaryId: true,
                  rank: true,
                  unitRelation: { select: { id: true, name: true, code: true } },
                },
              },
            },
          },
          organization: { select: { id: true, name: true, code: true } },
        },
        orderBy: { effectiveDate: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.partyMemberHistory.count({ where }),
    ]);

    const filtered = search
      ? transfers.filter(t =>
          t.partyMember.user.name?.toLowerCase().includes(search.toLowerCase()) ||
          t.partyMember.user.militaryId?.toLowerCase().includes(search.toLowerCase()) ||
          t.fromOrganization?.toLowerCase().includes(search.toLowerCase()) ||
          t.toOrganization?.toLowerCase().includes(search.toLowerCase())
        )
      : transfers;

    await logAudit({
      userId: user.id,
      functionCode: PARTY.VIEW_TRANSFER,
      action: 'VIEW',
      resourceType: 'PARTY_TRANSFER',
      result: 'SUCCESS',
    });

    return NextResponse.json({
      transfers: filtered,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('[Party Transfers GET]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAnyFunction(request, [PARTY.APPROVE_TRANSFER, PARTY.APPROVE]);
    if (!authResult.allowed) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const user = authResult.user!;
    const body = await request.json();

    const {
      partyMemberId,
      organizationId,
      historyType, // TRANSFER_IN | TRANSFER_OUT
      decisionNumber,
      decisionDate,
      effectiveDate,
      fromOrganization,
      toOrganization,
      reason,
      notes,
    } = body;

    if (!partyMemberId || !historyType || !['TRANSFER_IN', 'TRANSFER_OUT'].includes(historyType)) {
      return NextResponse.json({ error: 'partyMemberId và historyType (TRANSFER_IN|TRANSFER_OUT) là bắt buộc' }, { status: 400 });
    }

    const member = await prisma.partyMember.findUnique({ where: { id: partyMemberId } });
    if (!member) {
      return NextResponse.json({ error: 'Không tìm thấy đảng viên' }, { status: 404 });
    }

    const transfer = await prisma.partyMemberHistory.create({
      data: {
        partyMemberId,
        organizationId: organizationId || null,
        historyType,
        decisionNumber: decisionNumber || null,
        decisionDate: decisionDate ? new Date(decisionDate) : null,
        effectiveDate: effectiveDate ? new Date(effectiveDate) : null,
        fromOrganization: fromOrganization || null,
        toOrganization: toOrganization || null,
        reason: reason || null,
        notes: notes || null,
      },
      include: {
        partyMember: { include: { user: { select: { name: true, militaryId: true } } } },
        organization: { select: { id: true, name: true } },
      },
    });

    // Cập nhật tổ chức Đảng hiện tại nếu có TRANSFER_IN
    if (historyType === 'TRANSFER_IN' && organizationId) {
      await prisma.partyMember.update({
        where: { id: partyMemberId },
        data: { organizationId, statusChangeDate: effectiveDate ? new Date(effectiveDate) : new Date() },
      });
    }

    if (historyType === 'TRANSFER_OUT') {
      await prisma.partyMember.update({
        where: { id: partyMemberId },
        data: { status: 'CHUYEN_DI', statusChangeDate: effectiveDate ? new Date(effectiveDate) : new Date(), statusChangeReason: reason || 'Chuyển sinh hoạt' },
      });
    }

    await logAudit({
      userId: user.id,
      functionCode: PARTY.APPROVE_TRANSFER,
      action: 'CREATE',
      resourceType: 'PARTY_TRANSFER',
      resourceId: transfer.id,
      newValue: { partyMemberId, historyType, decisionNumber },
      result: 'SUCCESS',
    });

    return NextResponse.json(transfer, { status: 201 });
  } catch (error) {
    console.error('[Party Transfers POST]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
