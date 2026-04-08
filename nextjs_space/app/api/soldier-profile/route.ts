/**
 * API: CSDL Quân nhân - Ban Quân lực quản lý
 * @version 8.9 - Migrated to function-based RBAC
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireFunction } from '@/lib/rbac/middleware';
import { PERSONNEL } from '@/lib/rbac/function-codes';
import prisma from '@/lib/db';
import { logAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

/**
 * GET - Lấy danh sách quân nhân
 * RBAC: PERSONNEL.VIEW
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireFunction(request, PERSONNEL.VIEW);
    if (!authResult.allowed) {
      return authResult.response;
    }
    const user = authResult.user!;

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const serviceType = searchParams.get('serviceType') || '';
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
    
    if (category) {
      where.soldierCategory = category;
    }
    
    if (serviceType) {
      where.serviceType = serviceType;
    }
    
    if (unitId) {
      where.personnel = {
        ...where.personnel,
        unitId: unitId
      };
    }

    const [total, soldiers] = await Promise.all([
      prisma.soldierProfile.count({ where }),
      prisma.soldierProfile.findMany({
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
          serviceRecords: {
            orderBy: { eventDate: 'desc' },
            take: 5
          }
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' }
      })
    ]);

    await logAudit({
      userId: user.id,
      functionCode: PERSONNEL.VIEW,
      action: 'VIEW',
      resourceType: 'SOLDIER_PROFILE',
      result: 'SUCCESS'
    });

    return NextResponse.json({
      success: true,
      data: soldiers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching soldier profiles:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST - Tạo mới hồ sơ quân nhân
 * RBAC: PERSONNEL.CREATE
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireFunction(request, PERSONNEL.CREATE);
    if (!authResult.allowed) {
      return authResult.response;
    }
    const user = authResult.user!;

    const body = await request.json();
    const { personnelId, soldierIdNumber, soldierCategory, currentRank, serviceType, enlistmentDate } = body;

    if (!personnelId) {
      return NextResponse.json({ error: 'personnelId is required' }, { status: 400 });
    }

    // Check if already exists
    const existing = await prisma.soldierProfile.findUnique({
      where: { personnelId }
    });

    if (existing) {
      return NextResponse.json({ error: 'Soldier profile already exists for this personnel' }, { status: 400 });
    }

    const soldier = await prisma.soldierProfile.create({
      data: {
        personnelId,
        soldierIdNumber,
        soldierCategory,
        currentRank,
        serviceType,
        enlistmentDate: enlistmentDate ? new Date(enlistmentDate) : null,
        createdBy: user.id
      },
      include: {
        personnel: {
          select: { fullName: true, personnelCode: true }
        }
      }
    });

    await logAudit({
      userId: user.id,
      functionCode: PERSONNEL.CREATE,
      action: 'CREATE',
      resourceType: 'SOLDIER_PROFILE',
      resourceId: soldier.id,
      newValue: JSON.stringify(soldier),
      result: 'SUCCESS'
    });

    return NextResponse.json({ success: true, data: soldier }, { status: 201 });
  } catch (error) {
    console.error('Error creating soldier profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
