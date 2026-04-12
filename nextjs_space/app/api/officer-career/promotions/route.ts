/**
 * API: Quản lý quyết định thăng cấp / bổ nhiệm sĩ quan
 * GET  /api/officer-career/promotions  — danh sách có phân trang
 * POST /api/officer-career/promotions  — ghi nhận quyết định mới
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireFunction } from '@/lib/rbac/middleware';
import { PERSONNEL } from '@/lib/rbac/function-codes';
import prisma from '@/lib/db';
import { logAudit } from '@/lib/audit';
import { PromotionType } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireFunction(request, PERSONNEL.VIEW);
    if (!authResult.allowed) {
      return NextResponse.json(
        { error: authResult.authResult?.deniedReason || 'Forbidden' },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(request.url);
    const page          = parseInt(searchParams.get('page')     || '1');
    const limit         = parseInt(searchParams.get('limit')    || '20');
    const search        = searchParams.get('search')            || '';
    const promotionType = searchParams.get('promotionType')     || '';
    const officerCareerId = searchParams.get('officerCareerId') || '';

    const where: any = {};

    if (officerCareerId) {
      where.officerCareerId = officerCareerId;
    }

    if (promotionType && promotionType !== 'ALL') {
      where.promotionType = promotionType as PromotionType;
    }

    if (search) {
      where.officerCareer = {
        personnel: {
          OR: [
            { fullName:      { contains: search, mode: 'insensitive' } },
            { personnelCode: { contains: search, mode: 'insensitive' } },
          ],
        },
      };
    }

    const [total, promotions] = await Promise.all([
      prisma.officerPromotion.count({ where }),
      prisma.officerPromotion.findMany({
        where,
        include: {
          officerCareer: {
            include: {
              personnel: {
                select: {
                  id: true,
                  fullName: true,
                  personnelCode: true,
                  unit: { select: { id: true, name: true } },
                },
              },
            },
          },
        },
        orderBy: { effectiveDate: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: promotions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching promotions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireFunction(request, PERSONNEL.UPDATE);
    if (!authResult.allowed) {
      return NextResponse.json(
        { error: authResult.authResult?.deniedReason || 'Forbidden' },
        { status: 403 },
      );
    }
    const { user } = authResult;

    const body = await request.json();
    const {
      officerCareerId,
      promotionType,
      effectiveDate,
      decisionNumber,
      decisionDate,
      previousRank,
      newRank,
      previousPosition,
      newPosition,
      reason,
      notes,
    } = body;

    if (!officerCareerId) {
      return NextResponse.json({ error: 'officerCareerId is required' }, { status: 400 });
    }
    if (!promotionType) {
      return NextResponse.json({ error: 'promotionType is required' }, { status: 400 });
    }
    if (!effectiveDate) {
      return NextResponse.json({ error: 'effectiveDate is required' }, { status: 400 });
    }

    // Verify officer career exists
    const officerCareer = await prisma.officerCareer.findUnique({
      where: { id: officerCareerId },
    });
    if (!officerCareer) {
      return NextResponse.json({ error: 'Officer career not found' }, { status: 404 });
    }

    // Create promotion record
    const promotion = await prisma.officerPromotion.create({
      data: {
        officerCareerId,
        promotionType: promotionType as PromotionType,
        effectiveDate:  new Date(effectiveDate),
        decisionNumber: decisionNumber  || null,
        decisionDate:   decisionDate ? new Date(decisionDate) : null,
        previousRank:   previousRank || null,
        newRank:        newRank      || null,
        previousPosition: previousPosition || null,
        newPosition:      newPosition      || null,
        reason: reason || null,
        notes:  notes  || null,
        createdBy: user!.id,
      },
      include: {
        officerCareer: {
          include: { personnel: { select: { fullName: true, personnelCode: true } } },
        },
      },
    });

    // Update officer career's currentRank / currentPosition when relevant
    if (
      ['THANG_CAP', 'BO_NHIEM', 'DIEU_DONG', 'LUAN_CHUYEN'].includes(promotionType)
    ) {
      const rankUpdate   = newRank     ? { currentRank: newRank }         : {};
      const posUpdate    = newPosition ? { currentPosition: newPosition } : {};
      const updateFields = { ...rankUpdate, ...posUpdate };

      if (Object.keys(updateFields).length > 0) {
        await prisma.officerCareer.update({
          where: { id: officerCareerId },
          data: { ...updateFields, updatedBy: user!.id },
        });
      }
    }

    await logAudit({
      userId:       user!.id,
      functionCode: PERSONNEL.UPDATE,
      action:       'CREATE',
      resourceType: 'OFFICER_PROMOTION',
      resourceId:   promotion.id,
      newValue:     JSON.stringify({ promotionType, officerCareerId, effectiveDate }),
      result:       'SUCCESS',
    });

    return NextResponse.json({ success: true, data: promotion }, { status: 201 });
  } catch (error) {
    console.error('Error creating promotion:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
