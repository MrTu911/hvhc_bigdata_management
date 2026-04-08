/**
 * API: CSDL Cán bộ - Ban Cán bộ quản lý
 * GET /api/officer-career - Danh sách sĩ quan
 * POST /api/officer-career - Tạo mới
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireFunction } from '@/lib/rbac/middleware';
import { PERSONNEL } from '@/lib/rbac/function-codes';
import prisma from '@/lib/db';
import { logAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireFunction(request, PERSONNEL.VIEW);
    if (!authResult.allowed) {
      return NextResponse.json({ error: authResult.authResult?.deniedReason || 'Không có quyền' || 'Forbidden' }, { status: 403 });
    }
    const { user } = authResult;

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const rank = searchParams.get('rank') || '';
    const unitId = searchParams.get('unitId') || '';

    const where: any = {};
    
    if (search) {
      where.personnel = {
        OR: [
          { fullName: { contains: search, mode: 'insensitive' } },
          { personnelCode: { contains: search, mode: 'insensitive' } }
        ]
      };
    }
    
    if (rank) {
      where.currentRank = rank;
    }
    
    if (unitId) {
      where.personnel = {
        ...where.personnel,
        unitId: unitId
      };
    }

    const [total, officers] = await Promise.all([
      prisma.officerCareer.count({ where }),
      prisma.officerCareer.findMany({
        where,
        include: {
          personnel: {
            select: {
              id: true,
              personnelCode: true,
              fullName: true,
              dateOfBirth: true,
              gender: true,
              militaryRank: true,
              position: true,
              category: true,
              status: true,
              unit: {
                select: { id: true, name: true, code: true }
              }
            }
          },
          promotions: {
            orderBy: { effectiveDate: 'desc' },
            take: 5
          }
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' }
      })
    ]);

    // Log audit
    await logAudit({
      userId: user!.id,
      functionCode: PERSONNEL.VIEW,
      action: 'VIEW',
      resourceType: 'OFFICER_CAREER',
      result: 'SUCCESS'
    });

    return NextResponse.json({
      success: true,
      data: officers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching officer careers:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireFunction(request, PERSONNEL.CREATE);
    if (!authResult.allowed) {
      return NextResponse.json({ error: authResult.authResult?.deniedReason || 'Không có quyền' || 'Forbidden' }, { status: 403 });
    }
    const { user } = authResult;

    const body = await request.json();
    const { personnelId, officerIdNumber, currentRank, currentPosition, commissionedDate } = body;

    if (!personnelId) {
      return NextResponse.json({ error: 'personnelId is required' }, { status: 400 });
    }

    // Check if already exists
    const existing = await prisma.officerCareer.findUnique({
      where: { personnelId }
    });

    if (existing) {
      return NextResponse.json({ error: 'Officer career already exists for this personnel' }, { status: 400 });
    }

    const officer = await prisma.officerCareer.create({
      data: {
        personnelId,
        officerIdNumber,
        currentRank,
        currentPosition,
        commissionedDate: commissionedDate ? new Date(commissionedDate) : null,
        createdBy: user!.id
      },
      include: {
        personnel: {
          select: { fullName: true, personnelCode: true }
        }
      }
    });

    await logAudit({
      userId: user!.id,
      functionCode: PERSONNEL.CREATE,
      action: 'CREATE',
      resourceType: 'OFFICER_CAREER',
      resourceId: officer.id,
      newValue: JSON.stringify(officer),
      result: 'SUCCESS'
    });

    return NextResponse.json({ success: true, data: officer }, { status: 201 });
  } catch (error) {
    console.error('Error creating officer career:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
