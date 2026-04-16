/**
 * GET /api/education/training-systems/[id]
 * Chi tiết 1 Hệ đào tạo: stats, Tiểu đoàn, top học viên cảnh báo, danh sách students.
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
    const auth = await requireFunction(req, EDUCATION.VIEW_TRAINING_SYSTEM);
    if (!auth.allowed) return auth.response!;

    const { id } = params;
    const { searchParams } = new URL(req.url);
    const page  = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, parseInt(searchParams.get('limit') || '20'));
    const tab   = searchParams.get('tab') || 'overview'; // overview | students | grades | battalions

    // 1. Lấy thông tin Hệ
    const system = await prisma.unit.findUnique({
      where: { id },
      select: {
        id: true,
        code: true,
        name: true,
        description: true,
        commander: { select: { id: true, name: true, rank: true, position: true } },
        children: {
          where: { type: 'TIEUDOAN', active: true },
          select: { id: true, code: true, name: true },
          orderBy: { code: 'asc' },
        },
      },
    });

    if (!system) {
      return NextResponse.json({ success: false, error: 'Hệ đào tạo không tồn tại' }, { status: 404 });
    }

    // 2. Stats tổng
    const [totalStudents, activeStudents, warningCount, graduatedCount] = await Promise.all([
      prisma.hocVien.count({ where: { trainingSystemUnitId: id, deletedAt: null } }),
      prisma.hocVien.count({ where: { trainingSystemUnitId: id, deletedAt: null, currentStatus: 'ACTIVE' } }),
      prisma.academicWarning.count({
        where: { student: { trainingSystemUnitId: id, deletedAt: null } },
      }),
      prisma.hocVien.count({ where: { trainingSystemUnitId: id, deletedAt: null, currentStatus: 'GRADUATED' } }),
    ]);

    // 3. Tiểu đoàn với số học viên
    const batIds = system.children.map((b) => b.id);
    const batStudentCounts = batIds.length
      ? await prisma.hocVien.groupBy({
          by: ['battalionUnitId'],
          _count: { id: true },
          where: { battalionUnitId: { in: batIds }, deletedAt: null },
        })
      : [];

    const battalions = system.children.map((bat) => ({
      ...bat,
      studentCount:
        batStudentCounts.find((b) => b.battalionUnitId === bat.id)?._count?.id ?? 0,
    }));

    // 4. Danh sách học viên (chỉ trả khi tab=students)
    let students: any[] = [];
    let studentMeta = { total: totalStudents, page, limit, totalPages: Math.ceil(totalStudents / limit) };

    if (tab === 'students') {
      students = await prisma.hocVien.findMany({
        where: { trainingSystemUnitId: id, deletedAt: null },
        select: {
          id: true,
          maHocVien: true,
          hoTen: true,
          lop: true,
          nganh: true,
          currentStatus: true,
          diemTrungBinh: true,
          xepLoaiHocLuc: true,
          battalionUnit: { select: { id: true, name: true } },
          academicWarnings: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: { warningLevel: true },
          },
        },
        orderBy: { maHocVien: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      });
    }

    // 5. Top cảnh báo học vụ (overview)
    const topWarnings = await prisma.academicWarning.findMany({
      where: {
        student: { trainingSystemUnitId: id, deletedAt: null },
        warningLevel: { in: ['HIGH', 'CRITICAL'] },
      },
      select: {
        warningLevel: true,
        student: { select: { id: true, maHocVien: true, hoTen: true, lop: true } },
      },
      take: 10,
      orderBy: { createdAt: 'desc' },
    });

    // 6. Phân bổ ngành
    const majorDistribution = await prisma.hocVien.groupBy({
      by: ['nganh'],
      _count: { id: true },
      where: { trainingSystemUnitId: id, deletedAt: null },
      orderBy: { _count: { id: 'desc' } },
    });

    return NextResponse.json({
      success: true,
      data: {
        system: {
          ...system,
          battalions,
        },
        stats: {
          totalStudents,
          activeStudents,
          warningCount,
          graduatedCount,
          inactiveStudents: totalStudents - activeStudents - graduatedCount,
        },
        topWarnings,
        majorDistribution: majorDistribution.map((m) => ({
          nganh: m.nganh ?? 'Chưa phân ngành',
          count: m._count.id,
        })),
        students,
        studentMeta,
      },
    });
  } catch (error: any) {
    console.error('GET /api/education/training-systems/[id] error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch training system detail' },
      { status: 500 }
    );
  }
}
