/**
 * API: Predict at-risk students
 * GET /api/ai/predict/at-risk-students
 * RBAC: AI.PREDICT_RISK
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  getAtRiskStudents, 
  getCourseRiskStatistics,
  calculateStudentRiskScore 
} from '@/lib/ai/predictive-models';
import { requireFunction } from '@/lib/rbac/middleware';
import { AI } from '@/lib/rbac/function-codes';

export async function GET(request: NextRequest) {
  try {
    // RBAC Check: AI.PREDICT_RISK
    const authResult = await requireFunction(request, AI.PREDICT_RISK);
    if (!authResult.allowed) {
      return authResult.response!;
    }

    const searchParams = request.nextUrl.searchParams;
    const courseId = searchParams.get('course_id');
    const studentId = searchParams.get('student_id');
    const minRiskScore = parseInt(searchParams.get('min_risk_score') || '50');

    // Single student risk profile
    if (studentId) {
      const profile = await calculateStudentRiskScore(
        parseInt(studentId),
        courseId ? parseInt(courseId) : undefined
      );

      if (!profile) {
        return NextResponse.json(
          { error: 'Student not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        profile
      });
    }

    // Course-level risk analysis
    if (courseId) {
      const [atRiskStudents, statistics] = await Promise.all([
        getAtRiskStudents(parseInt(courseId), minRiskScore),
        getCourseRiskStatistics(parseInt(courseId))
      ]);

      return NextResponse.json({
        success: true,
        students: atRiskStudents,
        statistics,
        filters: {
          min_risk_score: minRiskScore,
          course_id: parseInt(courseId)
        }
      });
    }

    return NextResponse.json(
      { error: 'Missing course_id or student_id parameter' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Risk prediction error:', error);
    return NextResponse.json(
      { 
        error: 'Prediction failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

/**
 * POST: Batch risk calculation
 * RBAC: AI.PREDICT_RISK
 */
export async function POST(request: NextRequest) {
  try {
    // RBAC Check: AI.PREDICT_RISK
    const authResult = await requireFunction(request, AI.PREDICT_RISK);
    if (!authResult.allowed) {
      return authResult.response!;
    }

    const body = await request.json();
    const { student_ids, course_id } = body;

    if (!student_ids || !Array.isArray(student_ids)) {
      return NextResponse.json(
        { error: 'Missing or invalid student_ids array' },
        { status: 400 }
      );
    }

    const profiles = [];
    
    for (const studentId of student_ids) {
      const profile = await calculateStudentRiskScore(
        studentId,
        course_id ? parseInt(course_id) : undefined
      );
      
      if (profile) {
        profiles.push(profile);
      }
    }

    // Calculate aggregate statistics
    const stats = {
      total: profiles.length,
      critical: profiles.filter(p => p.risk_level === 'critical').length,
      high: profiles.filter(p => p.risk_level === 'high').length,
      medium: profiles.filter(p => p.risk_level === 'medium').length,
      low: profiles.filter(p => p.risk_level === 'low').length,
      average_risk: profiles.length > 0
        ? Math.round(profiles.reduce((sum, p) => sum + p.risk_score, 0) / profiles.length)
        : 0
    };

    return NextResponse.json({
      success: true,
      profiles: profiles.sort((a, b) => b.risk_score - a.risk_score),
      stats
    });
  } catch (error) {
    console.error('Batch risk prediction error:', error);
    return NextResponse.json(
      { error: 'Batch prediction failed' },
      { status: 500 }
    );
  }
}
