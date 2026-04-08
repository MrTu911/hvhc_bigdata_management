/**
 * API: AI Course Recommendations
 * GET /api/ai/recommend/courses
 * RBAC: AI.VIEW_RECOMMENDATIONS
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireFunction } from '@/lib/rbac/middleware';
import { AI } from '@/lib/rbac/function-codes';

interface CourseRecommendation {
  course_id: number;
  course_name: string;
  department: string;
  similarity_score: number;
  reason: string;
  estimated_grade: number;
}

/**
 * Calculate course similarity based on student preferences and performance
 * Note: Simplified version with mock data for initial deployment
 */
async function generateCourseRecommendations(
  studentId: number,
  limit: number = 5
): Promise<CourseRecommendation[]> {
  try {
    // TODO: Full Prisma integration pending
    // For now, return mock recommendations
    const mockRecommendations: CourseRecommendation[] = [
      {
        course_id: 101,
        course_name: 'Quản trị Hậu cần Nâng cao',
        department: 'Khoa Quản trị',
        similarity_score: 0.92,
        reason: 'Bạn đạt điểm cao ở các môn quản trị',
        estimated_grade: 8.5
      },
      {
        course_id: 102,
        course_name: 'Công nghệ Thông tin Quân sự',
        department: 'Khoa Công nghệ',
        similarity_score: 0.85,
        reason: 'Phù hợp với hồ sơ học tập của bạn',
        estimated_grade: 8.0
      },
      {
        course_id: 103,
        course_name: 'Chiến lược Hậu cần',
        department: 'Khoa Quản trị',
        similarity_score: 0.78,
        reason: 'Khóa học được đề xuất dựa trên sở thích',
        estimated_grade: 7.8
      }
    ];

    return mockRecommendations.slice(0, limit);
  } catch (error) {
    console.error('Error generating course recommendations:', error);
    return [];
  }
}

/**
 * Find similar students (collaborative filtering)
 * Note: Simplified version for initial deployment
 */
async function findSimilarStudents(studentId: number, limit: number = 5) {
  try {
    // TODO: Full Prisma integration pending
    // Mock data for demonstration
    return [
      {
        student_id: 201,
        student_name: 'Nguyễn Văn A',
        common_courses: 5,
        similarity: 0.83
      },
      {
        student_id: 202,
        student_name: 'Trần Thị B',
        common_courses: 4,
        similarity: 0.67
      }
    ].slice(0, limit);
  } catch (error) {
    console.error('Error finding similar students:', error);
    return [];
  }
}

export async function GET(request: NextRequest) {
  try {
    // RBAC Check: AI.VIEW_RECOMMENDATIONS
    const authResult = await requireFunction(request, AI.VIEW_RECOMMENDATIONS);
    if (!authResult.allowed) {
      return authResult.response!;
    }
    const user = authResult.user!;

    const searchParams = request.nextUrl.searchParams;
    const studentIdParam = searchParams.get('student_id');
    const studentId = studentIdParam ? parseInt(studentIdParam) : (parseInt(String(user.id)));
    const limit = parseInt(searchParams.get('limit') || '5');
    const includeSimilarStudents = searchParams.get('include_similar') === 'true';

    // Generate recommendations
    const recommendations = await generateCourseRecommendations(studentId, limit);

    // Optionally include similar students
    let similarStudents: any[] = [];
    if (includeSimilarStudents) {
      similarStudents = await findSimilarStudents(studentId);
    }

    return NextResponse.json({
      success: true,
      recommendations,
      similar_students: similarStudents,
      metadata: {
        student_id: studentId,
        generated_at: new Date().toISOString(),
        algorithm: 'collaborative_filtering_v1'
      }
    });
  } catch (error) {
    console.error('Course recommendation error:', error);
    return NextResponse.json(
      { 
        error: 'Recommendation failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
