/**
 * GET /api/education/training-systems
 * Trả danh sách 4 Hệ đào tạo kèm stats học viên, cảnh báo, Tiểu đoàn trực thuộc.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireFunction } from '@/lib/rbac/middleware';
import { EDUCATION } from '@/lib/rbac/function-codes';

export async function GET(req: NextRequest) {
  try {
    const auth = await requireFunction(req, EDUCATION.VIEW_TRAINING_SYSTEM);
    if (!auth.allowed) return auth.response!;

    // 1. Lấy tất cả đơn vị Hệ
    const systems = await prisma.unit.findMany({
      where: { type: 'HE', active: true },
      orderBy: { code: 'asc' },
      select: {
        id: true,
        code: true,
        name: true,
        description: true,
        commander: { select: { id: true, name: true, rank: true } },
        children: {
          where: { type: 'TIEUDOAN', active: true },
          select: {
            id: true,
            code: true,
            name: true,
            commander: { select: { id: true, name: true } },
          },
          orderBy: { code: 'asc' },
        },
      },
    });

    // 2. Đếm học viên theo Hệ
    const studentCounts = await prisma.hocVien.groupBy({
      by: ['trainingSystemUnitId'],
      _count: { id: true },
      where: { deletedAt: null, trainingSystemUnitId: { not: null } },
    });

    const activeStudentCounts = await prisma.hocVien.groupBy({
      by: ['trainingSystemUnitId'],
      _count: { id: true },
      where: { deletedAt: null, currentStatus: 'ACTIVE', trainingSystemUnitId: { not: null } },
    });

    // 3. Đếm cảnh báo học vụ theo Hệ (join qua HocVien.trainingSystemUnitId)
    const warningRaw = await prisma.academicWarning.groupBy({
      by: ['studentId'],
      _max: { warningLevel: true },
      where: {
        student: { deletedAt: null, trainingSystemUnitId: { not: null } },
      },
    });

    // Lấy trainingSystemUnitId cho mỗi studentId có cảnh báo
    const warnStudentIds = warningRaw.map((w) => w.studentId);
    const warnStudents = warnStudentIds.length
      ? await prisma.hocVien.findMany({
          where: { id: { in: warnStudentIds } },
          select: { id: true, trainingSystemUnitId: true },
        })
      : [];

    const warnBySystem: Record<string, number> = {};
    for (const ws of warnStudents) {
      if (!ws.trainingSystemUnitId) continue;
      warnBySystem[ws.trainingSystemUnitId] = (warnBySystem[ws.trainingSystemUnitId] ?? 0) + 1;
    }

    // 4. Đếm học viên theo Tiểu đoàn
    const batCounts = await prisma.hocVien.groupBy({
      by: ['battalionUnitId'],
      _count: { id: true },
      where: { deletedAt: null, battalionUnitId: { not: null } },
    });

    // 5. Assemble kết quả
    const result = systems.map((sys) => {
      const totalStudents =
        studentCounts.find((s) => s.trainingSystemUnitId === sys.id)?._count?.id ?? 0;
      const activeStudents =
        activeStudentCounts.find((s) => s.trainingSystemUnitId === sys.id)?._count?.id ?? 0;
      const warningCount = warnBySystem[sys.id] ?? 0;

      const battalionsWithStats = sys.children.map((bat) => ({
        ...bat,
        studentCount: batCounts.find((b) => b.battalionUnitId === bat.id)?._count?.id ?? 0,
      }));

      return {
        id: sys.id,
        code: sys.code,
        name: sys.name,
        description: sys.description,
        commander: sys.commander,
        totalStudents,
        activeStudents,
        inactiveStudents: totalStudents - activeStudents,
        warningCount,
        battalions: battalionsWithStats,
      };
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error('GET /api/education/training-systems error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch training systems' },
      { status: 500 }
    );
  }
}
