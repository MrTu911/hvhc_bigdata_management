// app/api/ai/insights/student/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import {
  makeStudentInsightPrompt,
  generateInsight,
} from '@/lib/utils/abacus';
import { requireFunction } from '@/lib/rbac/middleware';
import { AI } from '@/lib/rbac/function-codes';

/**
 * POST /api/ai/insights/student - Tạo AI Insight cho học viên
 * RBAC: AI.VIEW_STUDENT_INSIGHTS
 */
export async function POST(req: NextRequest) {
  try {
    // RBAC Check: AI.VIEW_STUDENT_INSIGHTS
    const authResult = await requireFunction(req, AI.VIEW_STUDENT_INSIGHTS);
    if (!authResult.allowed) {
      return authResult.response!;
    }
    const user = authResult.user!;

    const body = await req.json();
    const { studentId } = body;

    if (!studentId) {
      return NextResponse.json(
        { success: false, error: 'Missing studentId' },
        { status: 400 }
      );
    }

    // Lấy thông tin học viên và performance
    const performanceResponse = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/student/performance-analysis`
    );
    const performanceData = await performanceResponse.json();

    const studentPerf = performanceData.performance?.find(
      (p: any) => p.id === studentId
    );

    if (!studentPerf) {
      return NextResponse.json(
        { success: false, error: 'Student not found' },
        { status: 404 }
      );
    }

    // Tạo prompt
    const prompt = makeStudentInsightPrompt({
      hoTen: studentPerf.hoTen,
      lop: studentPerf.lop || 'N/A',
      avgGPA: studentPerf.avgGPA,
      trend: studentPerf.trend,
      riskLevel: studentPerf.riskLevel,
    });

    // Gọi Abacus AI
    const insight = await generateInsight(prompt);

    return NextResponse.json({
      success: true,
      studentId,
      name: studentPerf.hoTen,
      class: studentPerf.lop,
      avgGPA: studentPerf.avgGPA,
      trend: studentPerf.trend,
      riskLevel: studentPerf.riskLevel,
      insight,
    });
  } catch (error) {
    console.error('Student Insights error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
