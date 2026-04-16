/**
 * GET /api/education/battalions/[id]
 * Chi tiết 1 Tiểu đoàn: thông tin đơn vị, stats học viên, danh sách học viên, đảng viên.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireFunction } from '@/lib/rbac/middleware';
import { EDUCATION } from '@/lib/rbac/function-codes';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireFunction(req, EDUCATION.VIEW_BATTALION);
    if (!auth.allowed) return auth.response!;

    const { id } = params;
    const { searchParams } = new URL(req.url);
    const page  = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, parseInt(searchParams.get('limit') || '20'));
    const tab   = searchParams.get('tab') || 'overview';

    // 1. Lấy thông tin Tiểu đoàn
    const battalion = await prisma.unit.findUnique({
      where: { id },
      select: {
        id: true,
        code: true,
        name: true,
        description: true,
        commander: { select: { id: true, name: true, rank: true, position: true } },
        parent: { select: { id: true, code: true, name: true } },
      },
    });

    if (!battalion || battalion.parent?.id === undefined) {
      // also accept if parent doesn't exist (flexible)
    }

    if (!battalion) {
      return NextResponse.json({ success: false, error: 'Tiểu đoàn không tồn tại' }, { status: 404 });
    }

    // 2. Stats
    const [totalStudents, activeStudents, warningCount] = await Promise.all([
      prisma.hocVien.count({ where: { battalionUnitId: id, deletedAt: null } }),
      prisma.hocVien.count({ where: { battalionUnitId: id, deletedAt: null, currentStatus: 'ACTIVE' } }),
      prisma.academicWarning.count({
        where: { student: { battalionUnitId: id, deletedAt: null } },
      }),
    ]);

    // 3. GPA trung bình
    const gpaAgg = await prisma.hocVien.aggregate({
      _avg: { diemTrungBinh: true },
      where: { battalionUnitId: id, deletedAt: null, diemTrungBinh: { gt: 0 } },
    });
    const avgGPA = gpaAgg._avg.diemTrungBinh ?? 0;

    // 4. Danh sách học viên (khi tab=students)
    let students: any[] = [];
    let studentMeta = { total: totalStudents, page, limit, totalPages: Math.ceil(totalStudents / limit) };

    if (tab === 'students' || tab === 'overview') {
      students = await prisma.hocVien.findMany({
        where: { battalionUnitId: id, deletedAt: null },
        select: {
          id: true,
          maHocVien: true,
          hoTen: true,
          lop: true,
          nganh: true,
          currentStatus: true,
          diemTrungBinh: true,
          xepLoaiHocLuc: true,
          academicWarnings: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: { warningLevel: true },
          },
        },
        orderBy: { maHocVien: 'asc' },
        skip: tab === 'students' ? (page - 1) * limit : 0,
        take: tab === 'students' ? limit : 10,
      });
    }

    // 5. Đảng viên trong Tiểu đoàn (nếu có partyMember relation)
    // Sử dụng hocVien.userId → user.personnelId → party member check
    // Placeholder: đếm HV có userId
    const partyMemberCount = await prisma.hocVien.count({
      where: { battalionUnitId: id, deletedAt: null, userId: { not: null } },
    });

    // 6. Xếp loại học lực
    const academicRating = await prisma.hocVien.groupBy({
      by: ['xepLoaiHocLuc'],
      _count: { id: true },
      where: { battalionUnitId: id, deletedAt: null },
    });

    return NextResponse.json({
      success: true,
      data: {
        battalion,
        stats: {
          totalStudents,
          activeStudents,
          warningCount,
          avgGPA: Math.round(avgGPA * 100) / 100,
          partyMemberCount,
        },
        academicRating: academicRating.map((r) => ({
          rating: r.xepLoaiHocLuc ?? 'Chưa xếp loại',
          count: r._count.id,
        })),
        students,
        studentMeta,
      },
    });
  } catch (error: any) {
    console.error('GET /api/education/battalions/[id] error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch battalion detail' },
      { status: 500 }
    );
  }
}
