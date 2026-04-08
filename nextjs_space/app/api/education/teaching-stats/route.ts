import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireFunction } from '@/lib/rbac/middleware';
import { EDUCATION, FACULTY } from '@/lib/rbac/function-codes';
import { logAudit } from '@/lib/audit';

// GET - Lấy thống kê giảng dạy
export async function GET(req: NextRequest) {
  const authResult = await requireFunction(req, EDUCATION.VIEW_TERM);
  if (!authResult.allowed) {
    return authResult.response!;
  }

  try {
    const { searchParams } = new URL(req.url);
    const facultyId = searchParams.get('facultyId');
    const termId = searchParams.get('termId');
    const academicYearId = searchParams.get('academicYearId');

    // Get teaching statistics
    const where: any = {};
    if (facultyId) where.facultyId = facultyId;
    if (termId) where.termId = termId;
    if (academicYearId) where.academicYearId = academicYearId;

    // Fetch existing statistics or calculate from real data
    const existingStats = await prisma.teachingStatistics.findMany({
      where,
      orderBy: { calculatedAt: 'desc' },
      take: 50
    });

    // Get real-time data from class sections
    const classSectionStats = await prisma.classSection.groupBy({
      by: ['facultyId'],
      where: {
        facultyId: facultyId || undefined,
        termId: termId || undefined,
        isActive: true
      },
      _count: { id: true },
      _sum: { currentStudents: true }
    });

    // Get attendance data
    const attendanceData = await prisma.sessionAttendance.groupBy({
      by: ['attendanceType'],
      _count: { id: true }
    });

    // Get enrollment stats
    const enrollmentStats = await prisma.classEnrollment.groupBy({
      by: ['status'],
      _count: { id: true }
    });

    // Calculate overall metrics
    const sessionWhere: any = {};
    if (termId) sessionWhere.termId = termId;

    const totalSessions = await prisma.trainingSession.count({
      where: sessionWhere
    });

    const completedSessions = await prisma.trainingSession.count({
      where: {
        ...sessionWhere,
        status: 'COMPLETED'
      }
    });

    // Get faculty profiles with their teaching load
    const facultyTeaching = await prisma.facultyProfile.findMany({
      where: facultyId ? { id: facultyId } : {},
      include: {
        user: { select: { name: true, rank: true } },
        classSections: {
          where: termId ? { termId } : {},
          include: {
            term: { select: { name: true } },
            enrollments: { select: { status: true, totalScore: true } }
          }
        },
        trainingSessions: {
          where: termId ? { termId } : {},
          select: { id: true, status: true }
        }
      },
      take: 20
    });

    // Transform faculty data into stats
    const facultyStats = facultyTeaching.map(faculty => {
      const totalStudents = faculty.classSections.reduce((sum, cs) => sum + cs.enrollments.length, 0);
      const passedStudents = faculty.classSections.reduce(
        (sum, cs) => sum + cs.enrollments.filter(e => (e.totalScore || 0) >= 5.0).length,
        0
      );
      const avgScore = faculty.classSections.reduce((sum, cs) => {
        const scores = cs.enrollments.filter(e => e.totalScore).map(e => e.totalScore!);
        return sum + (scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0);
      }, 0) / (faculty.classSections.length || 1);

      return {
        facultyId: faculty.id,
        facultyName: faculty.user.name,
        rank: faculty.user.rank,
        totalCourses: faculty.classSections.length,
        totalStudents,
        totalSessions: faculty.trainingSessions.length,
        completedSessions: faculty.trainingSessions.filter(s => s.status === 'COMPLETED').length,
        avgScore: avgScore.toFixed(2),
        passRate: totalStudents > 0 ? ((passedStudents / totalStudents) * 100).toFixed(1) : '0'
      };
    });

    // Get term information
    let termInfo = null;
    if (termId) {
      termInfo = await prisma.term.findUnique({
        where: { id: termId },
        include: { academicYear: true }
      });
    }

    await logAudit({
      userId: authResult.user!.id,
      functionCode: EDUCATION.VIEW_TERM,
      action: 'VIEW',
      resourceType: 'TEACHING_STATS',
      result: 'SUCCESS'
    });

    return NextResponse.json({
      data: {
        facultyStats,
        termInfo,
        overview: {
          totalFaculty: facultyStats.length,
          totalCourses: classSectionStats.reduce((sum, s) => sum + s._count.id, 0),
          totalStudents: classSectionStats.reduce((sum, s) => sum + (s._sum.currentStudents || 0), 0),
          totalSessions,
          completedSessions,
          sessionCompletionRate: totalSessions > 0 ? ((completedSessions / totalSessions) * 100).toFixed(1) : '0',
          attendanceStats: attendanceData,
          enrollmentStats
        },
        cachedStats: existingStats
      }
    });
  } catch (error) {
    console.error('Error fetching teaching stats:', error);
    return NextResponse.json({ error: 'Lỗi khi tải thống kê giảng dạy' }, { status: 500 });
  }
}

// POST - Lưu/cập nhật thống kê
export async function POST(req: NextRequest) {
  const authResult = await requireFunction(req, EDUCATION.MANAGE_TERM);
  if (!authResult.allowed) {
    return authResult.response!;
  }

  try {
    const body = await req.json();
    const { facultyId, termId, academicYearId, totalCourses, totalSessions, totalStudents, avgAttendanceRate, avgPassRate, avgGrade, totalHours, evaluationScore, evaluationCount, notes } = body;

    if (!facultyId) {
      return NextResponse.json({ error: 'Thiếu ID giảng viên' }, { status: 400 });
    }

    // Upsert statistics
    const stats = await prisma.teachingStatistics.upsert({
      where: {
        facultyId_termId: {
          facultyId,
          termId: termId || 'default'
        }
      },
      create: {
        facultyId,
        termId,
        academicYearId,
        totalCourses: totalCourses || 0,
        totalSessions: totalSessions || 0,
        totalStudents: totalStudents || 0,
        avgAttendanceRate,
        avgPassRate,
        avgGrade,
        totalHours: totalHours || 0,
        evaluationScore,
        evaluationCount: evaluationCount || 0,
        notes,
        calculatedAt: new Date()
      },
      update: {
        totalCourses: totalCourses || 0,
        totalSessions: totalSessions || 0,
        totalStudents: totalStudents || 0,
        avgAttendanceRate,
        avgPassRate,
        avgGrade,
        totalHours: totalHours || 0,
        evaluationScore,
        evaluationCount: evaluationCount || 0,
        notes,
        calculatedAt: new Date()
      }
    });

    await logAudit({
      userId: authResult.user!.id,
      functionCode: EDUCATION.MANAGE_TERM,
      action: 'UPDATE',
      resourceType: 'TEACHING_STATS',
      resourceId: stats.id,
      newValue: stats,
      result: 'SUCCESS'
    });

    return NextResponse.json({ data: stats, message: 'Cập nhật thống kê thành công' });
  } catch (error) {
    console.error('Error saving teaching stats:', error);
    return NextResponse.json({ error: 'Lỗi khi lưu thống kê giảng dạy' }, { status: 500 });
  }
}
