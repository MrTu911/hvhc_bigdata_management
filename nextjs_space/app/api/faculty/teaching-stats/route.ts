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
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get('mode') || 'academy';

    // Get basic stats
    const [totalFaculty, totalSubjects, allResults, allUnits] = await Promise.all([
      prisma.facultyProfile.count({ where: { isActive: true } }),
      prisma.teachingSubject.count(),
      prisma.ketQuaHocTap.findMany({
        select: { diemTongKet: true, monHoc: true, hocKy: true }
      }),
      prisma.unit.findMany({
        where: { level: { gte: 2 } },
        select: { id: true, name: true, code: true }
      })
    ]);

    // Calculate averages
    const validResults = allResults.filter(r => r.diemTongKet !== null);
    const avgGrade = validResults.length > 0
      ? validResults.reduce((sum, r) => sum + (r.diemTongKet || 0), 0) / validResults.length
      : 0;

    // Get faculty with their teaching data
    const facultyWithStats = await prisma.facultyProfile.findMany({
      where: { isActive: true },
      include: {
        user: { select: { name: true } },
        unit: { select: { name: true } },
        teachingSubjectsList: true,
        hocVienHuongDan: true
      }
    });

    // Calculate hours (estimating 45 hours per subject)
    const totalHours = totalSubjects * 45;

    // Generate mock data for charts (in production, this would come from actual tracking)
    const hoursByMonth = [
      { month: 'T1', hours: 320 },
      { month: 'T2', hours: 280 },
      { month: 'T3', hours: 350 },
      { month: 'T4', hours: 300 },
      { month: 'T5', hours: 290 },
      { month: 'T6', hours: 200 },
      { month: 'T7', hours: 150 },
      { month: 'T8', hours: 180 },
      { month: 'T9', hours: 380 },
      { month: 'T10', hours: 350 },
      { month: 'T11', hours: 320 },
      { month: 'T12', hours: 250 }
    ];

    // Grade distribution
    const gradeRanges = [
      { range: 'Xuất sắc (8.5-10)', min: 8.5, max: 10 },
      { range: 'Giỏi (7.0-8.4)', min: 7.0, max: 8.4 },
      { range: 'Khá (5.5-6.9)', min: 5.5, max: 6.9 },
      { range: 'TB (4.0-5.4)', min: 4.0, max: 5.4 },
      { range: 'Yếu (<4.0)', min: 0, max: 3.9 }
    ];

    const gradeDistribution = gradeRanges.map(range => ({
      range: range.range,
      count: validResults.filter(r => 
        (r.diemTongKet || 0) >= range.min && (r.diemTongKet || 0) <= range.max
      ).length
    }));

    // Stats by unit
    const byUnit = allUnits.slice(0, 10).map(unit => {
      const unitFaculty = facultyWithStats.filter(f => f.unitId === unit.id);
      return {
        unitName: unit.name,
        facultyCount: unitFaculty.length,
        subjectCount: unitFaculty.reduce((sum, f) => sum + f.teachingSubjectsList.length, 0),
        hours: unitFaculty.reduce((sum, f) => sum + f.teachingSubjectsList.length * 45, 0)
      };
    });

    // Stats by subject
    const subjects = await prisma.teachingSubject.findMany({
      include: {
        faculty: {
          include: { user: { select: { name: true } } }
        }
      }
    });

    const bySubject = subjects.map(s => ({
      name: s.subjectName,
      code: s.subjectCode || '',
      facultyCount: 1,
      hours: 45,
      avgGrade: avgGrade
    }));

    // Top faculty
    const topFaculty = facultyWithStats
      .map(f => ({
        name: f.user.name,
        academicDegree: f.academicDegree || 'N/A',
        unit: f.unit?.name || 'N/A',
        totalHours: f.teachingSubjectsList.length * 45,
        avgGrade: avgGrade,
        studentCount: f.hocVienHuongDan.length
      }))
      .sort((a, b) => b.totalHours - a.totalHours)
      .slice(0, 10);

    return NextResponse.json({
      totalFaculty,
      totalSubjects,
      totalHours,
      avgGrade,
      hoursByMonth,
      gradeDistribution,
      byUnit,
      bySubject,
      topFaculty
    });
  } catch (error) {
    console.error('Error fetching teaching stats:', error);
    return NextResponse.json(
      { error: 'Lỗi khi tải dữ liệu thống kê' },
      { status: 500 }
    );
  }
}
