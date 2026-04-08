/**
 * M10 – UC-61: Kho tra cứu học vụ & hồ sơ đào tạo
 * GET /api/education/repository/search
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireFunction } from '@/lib/rbac/middleware';
import { EDUCATION } from '@/lib/rbac/function-codes';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const auth = await requireFunction(req, EDUCATION.VIEW_REPOSITORY);
    if (!auth.allowed) return auth.response!;

    const { searchParams } = new URL(req.url);
    const keyword  = searchParams.get('keyword')?.trim() || '';
    const itemType = searchParams.get('itemType') || '';
    const hocVienId = searchParams.get('hocVienId') || '';
    const isPublic  = searchParams.get('isPublic');
    const page  = Math.max(1, parseInt(searchParams.get('page')  || '1'));
    const limit = Math.min(50,  parseInt(searchParams.get('limit') || '20'));
    const skip  = (page - 1) * limit;

    const where: any = {};
    if (keyword)    where.OR = [
      { title: { contains: keyword, mode: 'insensitive' } },
    ];
    if (itemType)   where.itemType   = itemType;
    if (hocVienId)  where.hocVienId  = hocVienId;
    if (isPublic !== null && isPublic !== '') where.isPublic = isPublic === 'true';

    const [items, total] = await Promise.all([
      prisma.academicRepositoryItem.findMany({
        where,
        include: {
          hocVien: {
            select: { id: true, maHocVien: true, hoTen: true, lop: true },
          },
        },
        orderBy: { indexedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.academicRepositoryItem.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: items,
      meta: { total, page, totalPages: Math.ceil(total / limit) },
    });
  } catch (error: any) {
    console.error('GET /api/education/repository/search error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
