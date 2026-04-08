/**
 * EDUCATION STATS API - Thống kê tổng quan đào tạo
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireFunction } from '@/lib/rbac/middleware';
import { EDUCATION, DASHBOARD } from '@/lib/rbac/function-codes';

export async function GET(req: NextRequest) {
  try {
    const auth = await requireFunction(req, EDUCATION.VIEW_PROGRAM);
    if (!auth.allowed) return auth.response!;

    const { searchParams } = new URL(req.url);
    const termId = searchParams.get('termId');
    const academicYearId = searchParams.get('academicYearId');

    // Get current term if not specified
    let currentTerm = null;
    if (termId) {
      currentTerm = await prisma.term.findUnique({ where: { id: termId } });
    } else {
      currentTerm = await prisma.term.findFirst({ where: { isCurrent: true } });
    }

    // Get current academic year
    let currentYear = null;
    if (academicYearId) {
      currentYear = await prisma.academicYear.findUnique({ where: { id: academicYearId } });
    } else {
      currentYear = await prisma.academicYear.findFirst({ where: { isCurrent: true } });
    }

    // Overview counts
    const [programCount, curriculumCount, courseCount, classSectionCount, studentCount, facultyCount] = await Promise.all([
      prisma.program.count({ where: { isActive: true } }),
      prisma.curriculumPlan.count({ where: { isActive: true } }),
      prisma.curriculumCourse.count({ where: { isActive: true } }),
      prisma.classSection.count({ where: { isActive: true, ...(currentTerm?.id && { termId: currentTerm.id }) } }),
      prisma.hocVien.count({ where: { trangThai: 'Đang học' } }),
      prisma.facultyProfile.count({ where: { isActive: true } }),
    ]);

    // Programs by type
    const programsByType = await prisma.program.groupBy({
      by: ['programType'],
      where: { isActive: true },
      _count: { id: true },
    });

    // Programs by status
    const programsByStatus = await prisma.program.groupBy({
      by: ['status'],
      where: { isActive: true },
      _count: { id: true },
    });

    // Class sections by status (current term)
    const classSectionsByStatus = currentTerm?.id ? await prisma.classSection.groupBy({
      by: ['status'],
      where: { isActive: true, termId: currentTerm.id },
      _count: { id: true },
    }) : [];

    // Enrollment stats
    const enrollmentStats = currentTerm?.id ? await prisma.classEnrollment.groupBy({
      by: ['status'],
      where: { classSection: { termId: currentTerm.id } },
      _count: { id: true },
    }) : [];

    // Session stats (current term)
    const sessionStats = currentTerm?.id ? await prisma.trainingSession.groupBy({
      by: ['status'],
      where: { termId: currentTerm.id },
      _count: { id: true },
    }) : [];

    // Room utilization
    const roomCount = await prisma.room.count({ where: { isActive: true } });
    const roomsInUse = currentTerm?.id ? await prisma.classSection.findMany({
      where: { isActive: true, termId: currentTerm.id, roomId: { not: null } },
      select: { roomId: true },
      distinct: ['roomId'],
    }) : [];

    // Courses by semester distribution
    const coursesBySemester = await prisma.curriculumCourse.groupBy({
      by: ['semester'],
      where: { isActive: true },
      _count: { id: true },
      orderBy: { semester: 'asc' },
    });

    // Courses by type
    const coursesByType = await prisma.curriculumCourse.groupBy({
      by: ['courseType'],
      where: { isActive: true },
      _count: { id: true },
    });

    // Total credits
    const creditsAgg = await prisma.curriculumCourse.aggregate({
      where: { isActive: true },
      _sum: { credits: true },
    });

    // Recent activities (last 7 days)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const recentEnrollments = await prisma.classEnrollment.count({
      where: { enrolledAt: { gte: weekAgo } },
    });

    const completedSessions = currentTerm?.id ? await prisma.trainingSession.count({
      where: { termId: currentTerm.id, status: 'COMPLETED' },
    }) : 0;

    const upcomingSessions = currentTerm?.id ? await prisma.trainingSession.count({
      where: { termId: currentTerm.id, status: 'SCHEDULED', sessionDate: { gte: new Date() } },
    }) : 0;

    return NextResponse.json({
      currentTerm,
      currentYear,
      overview: {
        programs: programCount,
        curriculumPlans: curriculumCount,
        courses: courseCount,
        classSections: classSectionCount,
        students: studentCount,
        faculty: facultyCount,
        totalCredits: creditsAgg._sum.credits || 0,
      },
      charts: {
        programsByType: programsByType.map(p => ({ type: p.programType, count: p._count.id })),
        programsByStatus: programsByStatus.map(p => ({ status: p.status, count: p._count.id })),
        classSectionsByStatus: classSectionsByStatus.map(c => ({ status: c.status, count: c._count.id })),
        enrollmentStats: enrollmentStats.map(e => ({ status: e.status, count: e._count.id })),
        sessionStats: sessionStats.map(s => ({ status: s.status, count: s._count.id })),
        coursesBySemester: coursesBySemester.map(c => ({ semester: `HK${c.semester}`, count: c._count.id })),
        coursesByType: coursesByType.map(c => ({ type: c.courseType, count: c._count.id })),
      },
      roomUtilization: {
        total: roomCount,
        inUse: roomsInUse.length,
        available: roomCount - roomsInUse.length,
        utilizationRate: roomCount > 0 ? Math.round((roomsInUse.length / roomCount) * 100) : 0,
      },
      activities: {
        recentEnrollments,
        completedSessions,
        upcomingSessions,
      },
    });
  } catch (error: any) {
    console.error('GET /api/education/stats error:', error);
    return NextResponse.json({ error: 'Failed to fetch education stats', details: error.message }, { status: 500 });
  }
}
