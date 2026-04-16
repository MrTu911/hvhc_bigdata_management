/**
 * API: Danh sách sức khỏe quân nhân (chiến sĩ/HSQ/QNCN)
 * GET /api/soldier-profile/health
 * Hỗ trợ filter theo healthCategory, search theo tên/mã, phân trang
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireFunction } from '@/lib/rbac/middleware';
import { PERSONNEL } from '@/lib/rbac/function-codes';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

const HEALTH_CATEGORIES = ['Loại 1', 'Loại 2', 'Loại 3', 'Loại 4'];

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
    const page           = parseInt(searchParams.get('page')  || '1');
    const limit          = parseInt(searchParams.get('limit') || '20');
    const search         = searchParams.get('search')         || '';
    const healthCategory = searchParams.get('healthCategory') || 'ALL';
    const needsCheck     = searchParams.get('needsCheck') === 'true';

    const where: Record<string, unknown> = {};

    if (search) {
      where.personnel = {
        OR: [
          { fullName:      { contains: search, mode: 'insensitive' } },
          { personnelCode: { contains: search, mode: 'insensitive' } },
        ],
      };
    }

    if (healthCategory !== 'ALL') {
      where.healthCategory = healthCategory === 'NONE' ? null : healthCategory;
    }

    if (needsCheck) {
      where.lastHealthCheckDate = null;
    }

    const [total, soldiers] = await Promise.all([
      prisma.soldierProfile.count({ where }),
      prisma.soldierProfile.findMany({
        where,
        select: {
          id:                  true,
          currentRank:         true,
          soldierCategory:     true,
          healthCategory:      true,
          healthNotes:         true,
          lastHealthCheckDate: true,
          personnel: {
            select: {
              id:            true,
              fullName:      true,
              personnelCode: true,
              dateOfBirth:   true,
              gender:        true,
              unit: { select: { id: true, name: true } },
            },
          },
        },
        skip:    (page - 1) * limit,
        take:    limit,
        orderBy: { updatedAt: 'desc' },
      }),
    ]);

    // Summary counts
    const allHealthData = await prisma.soldierProfile.findMany({
      select: { healthCategory: true, lastHealthCheckDate: true },
    });

    const summaryMap: Record<string, number> = {};
    let notChecked = 0;
    for (const s of allHealthData) {
      const hc = s.healthCategory || 'Chưa kiểm tra';
      summaryMap[hc] = (summaryMap[hc] || 0) + 1;
      if (!s.lastHealthCheckDate) notChecked++;
    }

    const summary = {
      total: allHealthData.length,
      byCategory: [
        ...HEALTH_CATEGORIES.map(cat => ({ category: cat, count: summaryMap[cat] || 0 })),
        { category: 'Chưa kiểm tra', count: summaryMap['Chưa kiểm tra'] || 0 },
      ],
      notChecked,
    };

    return NextResponse.json({
      success: true,
      data: soldiers,
      summary,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching soldier health records:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
