/**
 * API: Danh sách sức khỏe sĩ quan
 * GET /api/officer-career/health
 * Trả về danh sách sĩ quan kèm dữ liệu sức khỏe, hỗ trợ filter và phân trang
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
    const page           = parseInt(searchParams.get('page')           || '1');
    const limit          = parseInt(searchParams.get('limit')          || '20');
    const search         = searchParams.get('search')                  || '';
    const healthCategory = searchParams.get('healthCategory')          || 'ALL';
    const rankFilter     = searchParams.get('rank')                    || '';
    const needsCheck     = searchParams.get('needsCheck') === 'true';     // chưa từng kiểm tra

    const where: any = {};

    if (search) {
      where.personnel = {
        OR: [
          { fullName:      { contains: search, mode: 'insensitive' } },
          { personnelCode: { contains: search, mode: 'insensitive' } },
        ],
      };
    }

    if (rankFilter) {
      where.currentRank = rankFilter;
    }

    if (healthCategory !== 'ALL') {
      if (healthCategory === 'NONE') {
        where.healthCategory = null;
      } else {
        where.healthCategory = healthCategory;
      }
    }

    if (needsCheck) {
      where.lastHealthCheckDate = null;
    }

    const [total, officers] = await Promise.all([
      prisma.officerCareer.count({ where }),
      prisma.officerCareer.findMany({
        where,
        select: {
          id:                  true,
          currentRank:         true,
          currentPosition:     true,
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
        orderBy: [
          // Loại 4 (cần theo dõi) lên đầu, rồi đến chưa kiểm tra
          { healthCategory: { sort: 'desc', nulls: 'last' } },
          { lastHealthCheckDate: { sort: 'asc', nulls: 'first' } },
        ],
        skip:  (page - 1) * limit,
        take:  limit,
      }),
    ]);

    // Aggregate summary
    const [summaryRaw] = await Promise.all([
      prisma.officerCareer.groupBy({
        by: ['healthCategory'],
        _count: { id: true },
      }),
    ]);

    const summaryMap: Record<string, number> = {};
    let notChecked = 0;
    for (const row of summaryRaw) {
      if (row.healthCategory === null) {
        notChecked += row._count.id;
      } else {
        summaryMap[row.healthCategory] = (summaryMap[row.healthCategory] || 0) + row._count.id;
      }
    }

    const summary = {
      total,
      byCategory: HEALTH_CATEGORIES.map(cat => ({
        category: cat,
        count:    summaryMap[cat] || 0,
      })),
      notChecked,
    };

    return NextResponse.json({
      success: true,
      data: officers,
      summary,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching officer health list:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
