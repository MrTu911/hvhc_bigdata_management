/**
 * M10 – UC-62: Dashboard KPI đào tạo (tập trung M10 graduation/warning/thesis)
 * GET /api/education/dashboard/stats
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireFunction } from '@/lib/rbac/middleware';
import { EDUCATION } from '@/lib/rbac/function-codes';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const auth = await requireFunction(req, EDUCATION.VIEW_PROGRAM);
    if (!auth.allowed) return auth.response!;

    const now = new Date();
    const currentYear = await prisma.academicYear.findFirst({ where: { isCurrent: true } });
    const currentTerm = await prisma.term.findFirst({ where: { isCurrent: true } });

    const [
      // Học viên
      totalStudents,
      activeStudents,
      // Cảnh báo
      warningCritical,
      warningHigh,
      warningMedium,
      warningLow,
      // Khóa luận
      thesisDraft,
      thesisInProgress,
      thesisDefended,
      thesisArchived,
      // Tốt nghiệp
      gradEligible,
      gradIneligible,
      gradApproved,
      gradPending,
      // Văn bằng đã cấp
      diplomaCount,
      // Lớp học phần hiện tại
      totalSections,
      totalEnrollments,
    ] = await Promise.all([
      prisma.hocVien.count(),
      prisma.hocVien.count({ where: { trangThai: 'Đang học' } }),

      prisma.academicWarning.count({ where: { warningLevel: 'CRITICAL', isResolved: false } }),
      prisma.academicWarning.count({ where: { warningLevel: 'HIGH',     isResolved: false } }),
      prisma.academicWarning.count({ where: { warningLevel: 'MEDIUM',   isResolved: false } }),
      prisma.academicWarning.count({ where: { warningLevel: 'LOW',      isResolved: false } }),

      prisma.thesisProject.count({ where: { status: 'DRAFT' } }),
      prisma.thesisProject.count({ where: { status: 'IN_PROGRESS' } }),
      prisma.thesisProject.count({ where: { status: 'DEFENDED' } }),
      prisma.thesisProject.count({ where: { status: 'ARCHIVED' } }),

      prisma.graduationAudit.count({ where: { graduationEligible: true,  status: { notIn: ['APPROVED'] } } }),
      prisma.graduationAudit.count({ where: { graduationEligible: false, status: 'INELIGIBLE' } }),
      prisma.graduationAudit.count({ where: { status: 'APPROVED' } }),
      prisma.graduationAudit.count({ where: { status: 'PENDING' } }),

      prisma.diplomaRecord.count(),

      currentTerm?.id ? prisma.classSection.count({ where: { termId: currentTerm.id, isActive: true } }) : Promise.resolve(0),
      currentTerm?.id ? prisma.classEnrollment.count({ where: { classSection: { termId: currentTerm.id } } }) : Promise.resolve(0),
    ]);

    // Breakdown theo Hệ đào tạo
    const trainingSystems = await prisma.unit.findMany({
      where: { type: 'HE', active: true },
      select: { id: true, code: true, name: true },
      orderBy: { code: 'asc' },
    });

    const systemStudentCounts = await prisma.hocVien.groupBy({
      by: ['trainingSystemUnitId'],
      _count: { id: true },
      where: { deletedAt: null, trainingSystemUnitId: { not: null } },
    });

    const systemActiveStudentCounts = await prisma.hocVien.groupBy({
      by: ['trainingSystemUnitId'],
      _count: { id: true },
      where: { deletedAt: null, currentStatus: 'ACTIVE', trainingSystemUnitId: { not: null } },
    });

    const byTrainingSystem = trainingSystems.map((sys) => ({
      systemId:       sys.id,
      systemCode:     sys.code,
      systemName:     sys.name,
      totalStudents:  systemStudentCounts.find((s) => s.trainingSystemUnitId === sys.id)?._count?.id ?? 0,
      activeStudents: systemActiveStudentCounts.find((s) => s.trainingSystemUnitId === sys.id)?._count?.id ?? 0,
    }));

    const totalWarnings = warningCritical + warningHigh + warningMedium + warningLow;
    const warningRate   = activeStudents > 0 ? Math.round((totalWarnings / activeStudents) * 100) : 0;

    return NextResponse.json({
      success: true,
      data: {
        currentTerm:      currentTerm  ?? null,
        currentYear:      currentYear  ?? null,
        students: {
          total:  totalStudents,
          active: activeStudents,
        },
        warnings: {
          total:    totalWarnings,
          critical: warningCritical,
          high:     warningHigh,
          medium:   warningMedium,
          low:      warningLow,
          warningRate,
        },
        thesis: {
          draft:      thesisDraft,
          inProgress: thesisInProgress,
          defended:   thesisDefended,
          archived:   thesisArchived,
          total:      thesisDraft + thesisInProgress + thesisDefended + thesisArchived,
        },
        graduation: {
          pending:    gradPending,
          eligible:   gradEligible,
          ineligible: gradIneligible,
          approved:   gradApproved,
        },
        diplomas:    diplomaCount,
        termSections:   totalSections,
        termEnrollments: totalEnrollments,
        byTrainingSystem,
      },
    });
  } catch (error: any) {
    console.error('GET /api/education/dashboard/stats error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
