// app/api/ai/insights/faculty/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import {
  makeFacultyInsightPrompt,
  generateInsight,
} from '@/lib/utils/abacus';
import { requireFunction } from '@/lib/rbac/middleware';
import { AI } from '@/lib/rbac/function-codes';

/**
 * POST /api/ai/insights/faculty - Tạo AI Insight cho giảng viên
 * RBAC: AI.VIEW_FACULTY_INSIGHTS
 */
export async function POST(req: NextRequest) {
  try {
    // RBAC Check: AI.VIEW_FACULTY_INSIGHTS
    const authResult = await requireFunction(req, AI.VIEW_FACULTY_INSIGHTS);
    if (!authResult.allowed) {
      return authResult.response!;
    }
    const user = authResult.user!;

    const body = await req.json();
    const { facultyId } = body;

    if (!facultyId) {
      return NextResponse.json(
        { success: false, error: 'Missing facultyId' },
        { status: 400 }
      );
    }

    // Lấy thông tin giảng viên
    const faculty = await prisma.facultyProfile.findUnique({
      where: { id: facultyId },
      include: {
        user: {
          select: {
            name: true,
          },
        },
        unit: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!faculty) {
      return NextResponse.json(
        { success: false, error: 'Faculty not found' },
        { status: 404 }
      );
    }

    // Lấy điểm EIS từ API
    let eisScore = 0;
    try {
      const eisResponse = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/faculty/eis`
      );
      const eisData = await eisResponse.json();
      const facultyEIS = eisData.facultyEIS?.find((f: any) => f.id === facultyId);
      eisScore = facultyEIS?.EIS_Score || 0;
    } catch (error) {
      console.error('Error fetching EIS:', error);
    }

    // Tạo prompt
    const prompt = makeFacultyInsightPrompt({
      name: faculty.user?.name || 'N/A',
      department: faculty.unit?.name || 'N/A',
      researchProjects: faculty.researchProjects || 0,
      publications: faculty.publications || 0,
      citations: faculty.citations || 0,
      teachingYears: faculty.teachingExperience || 0,
      EIS_Score: eisScore,
    });

    // Gọi Abacus AI
    const insight = await generateInsight(prompt);

    return NextResponse.json({
      success: true,
      facultyId,
      name: faculty.user?.name,
      department: faculty.unit?.name,
      EIS_Score: eisScore,
      insight,
    });
  } catch (error) {
    console.error('Faculty Insights error:', error);
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
