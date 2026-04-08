/**
 * M10 – UC-58: Quản lý điểm rèn luyện toàn trường
 * GET  /api/education/conduct  – danh sách tất cả bản ghi rèn luyện (có filter/pagination)
 *
 * Filters: academicYear, semesterCode, search (tên / mã học viên)
 * Requires: EDUCATION.VIEW_CONDUCT
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireFunction } from '@/lib/rbac/middleware';
import { EDUCATION } from '@/lib/rbac/function-codes';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const auth = await requireFunction(req, EDUCATION.VIEW_CONDUCT);
    if (!auth.allowed) return auth.response!;

    const { searchParams } = new URL(req.url);
    const page         = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const limit        = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10)));
    const skip         = (page - 1) * limit;
    const academicYear = searchParams.get('academicYear') ?? undefined;
    const semesterCode = searchParams.get('semesterCode') ?? undefined;
    const search       = searchParams.get('search')?.trim() ?? undefined;

    const where: any = {};
    if (academicYear) where.academicYear = academicYear;
    if (semesterCode) where.semesterCode = semesterCode;
    if (search) {
      where.hocVien = {
        OR: [
          { hoTen:     { contains: search, mode: 'insensitive' } },
          { maHocVien: { contains: search, mode: 'insensitive' } },
        ],
        deletedAt: null,
      };
    } else {
      where.hocVien = { deletedAt: null };
    }

    const [records, total] = await Promise.all([
      prisma.studentConductRecord.findMany({
        where,
        include: {
          hocVien: {
            select: {
              id: true, maHocVien: true, hoTen: true, lop: true, khoaHoc: true,
            },
          },
        },
        orderBy: [{ academicYear: 'desc' }, { semesterCode: 'desc' }, { hocVien: { maHocVien: 'asc' } }],
        skip,
        take: limit,
      }),
      prisma.studentConductRecord.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: records,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error: any) {
    console.error('GET /api/education/conduct error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch conduct records' }, { status: 500 });
  }
}
