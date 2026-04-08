/**
 * API: Faculty EIS History
 * RBAC v8.8: Migrated to function-based RBAC
 * Lấy lịch sử điểm EIS (Educational Impact Score) của giảng viên
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAbacusClient } from '@/lib/abacus-client';
import { requireFunction } from '@/lib/rbac/middleware';
import { FACULTY } from '@/lib/rbac/function-codes';
import { logAudit } from '@/lib/audit';

// GET: Lấy lịch sử EIS
export async function GET(request: NextRequest) {
  try {
    // RBAC: Yêu cầu quyền xem chi tiết giảng viên
    const authResult = await requireFunction(request, FACULTY.VIEW_DETAIL);
    if (!authResult.allowed) {
      return authResult.response!;
    }
    const user = authResult.user!;

    const { searchParams } = new URL(request.url);
    const facultyId = searchParams.get('facultyId');
    const months = parseInt(searchParams.get('months') || '6');

    if (!facultyId) {
      return NextResponse.json({ error: 'Faculty ID required' }, { status: 400 });
    }

    // Lấy EIS history từ AIInsight
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - months);

    const eisHistory = await prisma.aIInsight.findMany({
      where: {
        type: 'eis_history',
        targetType: 'faculty',
        targetId: facultyId,
        generatedAt: {
          gte: sixMonthsAgo,
        },
      },
      orderBy: {
        generatedAt: 'asc',
      },
    });

    // Format dữ liệu trả về
    const formattedHistory = eisHistory.map((record) => ({
      id: record.id,
      date: record.generatedAt,
      score: (record.data as any).eisScore || 0,
      details: record.data,
      confidence: record.confidence,
    }));

    // Tính toán thống kê
    const scores = formattedHistory.map((h) => h.score);
    const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    const maxScore = scores.length > 0 ? Math.max(...scores) : 0;
    const minScore = scores.length > 0 ? Math.min(...scores) : 0;
    const trend =
      scores.length >= 2
        ? scores[scores.length - 1] > scores[0]
          ? 'improving'
          : scores[scores.length - 1] < scores[0]
          ? 'declining'
          : 'stable'
        : 'stable';

    // Audit log
    await logAudit({
      userId: user!.id,
      functionCode: FACULTY.VIEW_DETAIL,
      action: 'VIEW',
      resourceType: 'EIS_HISTORY',
      resourceId: facultyId,
      result: 'SUCCESS',
    });

    return NextResponse.json({
      success: true,
      history: formattedHistory,
      statistics: {
        avgScore: parseFloat(avgScore.toFixed(2)),
        maxScore,
        minScore,
        trend,
        totalRecords: formattedHistory.length,
      },
    });
  } catch (error: any) {
    console.error('GET EIS History error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch EIS history', details: error.message },
      { status: 500 }
    );
  }
}

// POST: Tính toán EIS mới
export async function POST(request: NextRequest) {
  try {
    // RBAC: Yêu cầu quyền cập nhật giảng viên
    const authResult = await requireFunction(request, FACULTY.UPDATE);
    if (!authResult.allowed) {
      return authResult.response!;
    }
    const user = authResult.user!;

    const body = await request.json();
    const { facultyId } = body;

    if (!facultyId) {
      return NextResponse.json({ error: 'Faculty ID required' }, { status: 400 });
    }

    // Lấy thông tin giảng viên
    const faculty = await prisma.facultyProfile.findUnique({
      where: { id: facultyId },
      include: {
        user: true,
        teachingSubjectsList: true,
        researchProjectsList: true,
        hocVienHuongDan: {
          include: {
            ketQuaHocTap: true,
          },
        },
      },
    });

    if (!faculty) {
      return NextResponse.json({ error: 'Faculty not found' }, { status: 404 });
    }

    // ===== TÍNH TOÁN EIS SCORE BẰNG ABACUS CLIENT =====
    
    const abacusClient = getAbacusClient();
    
    // Sử dụng Abacus Client để tính EIS (với offline fallback)
    const eisResult = await abacusClient.calculateEIS(facultyId, false);
    
    const eisScore = eisResult.totalScore;
    const confidence = eisResult.confidence;
    
    // Extract breakdown từ result
    const breakdown = {
      teachingQuality: eisResult.components.teachingQuality,
      researchOutput: eisResult.components.researchOutput,
      studentMentorship: eisResult.components.studentMentorship,
      innovation: eisResult.components.innovation,
      leadership: eisResult.components.leadership,
      collaboration: eisResult.components.collaboration,
    };
    
    // Calculate metrics for reporting
    const totalStudents = faculty.hocVienHuongDan?.length || 0;
    const passedStudents = faculty.hocVienHuongDan?.filter((student: any) => {
      const avgGPA = student.diemTrungBinh || 0;
      return avgGPA >= 2.0;
    }).length || 0;
    const passRate = totalStudents > 0 ? (passedStudents / totalStudents) * 100 : 0;
    const totalResearch = faculty.researchProjectsList?.length || 0;
    const publishedResearch = faculty.researchProjectsList?.filter(
      (project: any) => project.trangThai === 'Hoàn thành'
    ).length || 0;
    const teachingSubjectsCount = faculty.teachingSubjectsList?.length || 0;
    const avgStudentGPA =
      totalStudents > 0
        ? (faculty.hocVienHuongDan?.reduce((sum: number, s: any) => sum + (s.diemTrungBinh || 0), 0) || 0) / totalStudents
        : 0;

    // Lưu vào AIInsight
    const eisInsight = await prisma.aIInsight.create({
      data: {
        type: 'eis_history',
        targetType: 'faculty',
        targetId: facultyId,
        data: {
          eisScore,
          breakdown,
          metrics: {
            totalStudents,
            passedStudents,
            passRate: parseFloat(passRate.toFixed(2)),
            avgStudentGPA: parseFloat(avgStudentGPA.toFixed(2)),
            totalResearch,
            publishedResearch,
            teachingSubjectsCount,
          },
          method: eisResult.method || 'rule-based',
        },
        confidence: parseFloat(confidence.toFixed(2)),
        createdBy: user!.id,
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Valid for 30 days
      },
    });
    
    // Lưu prediction vào Model Registry
    await abacusClient.savePrediction({
      modelType: 'eis',
      modelVersion: '1.0.0',
      inputData: {
        facultyId,
        totalStudents,
        totalResearch,
        teachingSubjectsCount,
      },
      predictionData: {
        eisScore,
        breakdown,
      },
      confidence,
      targetId: facultyId,
      targetType: 'faculty',
    });

    // Audit log
    await logAudit({
      userId: user!.id,
      functionCode: FACULTY.UPDATE,
      action: 'CREATE',
      resourceType: 'EIS_CALCULATION',
      resourceId: eisInsight.id,
      newValue: { eisScore, breakdown },
      result: 'SUCCESS',
    });

    return NextResponse.json({
      success: true,
      eisScore,
      breakdown,
      metrics: (eisInsight.data as any).metrics,
      confidence,
      insightId: eisInsight.id,
      method: eisResult.method || 'rule-based',
    });
  } catch (error: any) {
    console.error('POST EIS Calculation error:', error);
    return NextResponse.json(
      { error: 'Failed to calculate EIS', details: error.message },
      { status: 500 }
    );
  }
}
