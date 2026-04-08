import { NextRequest, NextResponse } from 'next/server';
import { requireFunction } from '@/lib/rbac/middleware';
import { FUNCTION_CODES } from '@/lib/rbac/function-codes';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  const authResult = await requireFunction(req, FUNCTION_CODES.EDUCATION.VIEW_TERM);
  if (!authResult.allowed) {
    return authResult.response!;
  }

  try {
    // Get faculty statistics
    const [totalFaculty, facultyByDegree, facultyByRank] = await Promise.all([
      prisma.facultyProfile.count({ where: { isActive: true } }),
      prisma.facultyProfile.groupBy({
        by: ['academicDegree'],
        _count: true,
        where: { isActive: true }
      }),
      prisma.facultyProfile.groupBy({
        by: ['academicRank'],
        _count: true,
        where: { isActive: true }
      })
    ]);

    // Get student statistics
    const [totalStudents, studentsByStatus, studentsByClass] = await Promise.all([
      prisma.hocVien.count(),
      prisma.hocVien.groupBy({
        by: ['trangThai'],
        _count: true
      }),
      prisma.hocVien.groupBy({
        by: ['lop'],
        _count: true
      })
    ]);

    // Get teaching stats
    const [totalSubjects, totalResults, avgGrade] = await Promise.all([
      prisma.teachingSubject.count(),
      prisma.ketQuaHocTap.count(),
      prisma.ketQuaHocTap.aggregate({
        _avg: { diemTongKet: true }
      })
    ]);

    // Get research stats
    const [totalResearchProjects, totalPublications] = await Promise.all([
      prisma.researchProject.count(),
      prisma.facultyProfile.aggregate({
        _sum: { publications: true }
      })
    ]);

    // Get recent activities
    const recentFaculty = await prisma.facultyProfile.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { name: true, email: true } } }
    });

    const recentStudents = await prisma.hocVien.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      faculty: {
        total: totalFaculty,
        byDegree: facultyByDegree.map(d => ({
          degree: d.academicDegree || 'Khác',
          count: d._count
        })),
        byRank: facultyByRank.map(r => ({
          rank: r.academicRank || 'Khác',
          count: r._count
        }))
      },
      students: {
        total: totalStudents,
        byStatus: studentsByStatus.map(s => ({
          status: s.trangThai || 'Khác',
          count: s._count
        })),
        byClass: studentsByClass.slice(0, 10).map(c => ({
          class: c.lop || 'Khác',
          count: c._count
        }))
      },
      teaching: {
        totalSubjects,
        totalResults,
        avgGrade: avgGrade._avg.diemTongKet || 0
      },
      research: {
        totalProjects: totalResearchProjects,
        totalPublications: totalPublications._sum.publications || 0
      },
      recentFaculty,
      recentStudents
    });
  } catch (error) {
    console.error('Error fetching faculty-student overview:', error);
    return NextResponse.json(
      { error: 'Lỗi khi tải dữ liệu tổng quan' },
      { status: 500 }
    );
  }
}
