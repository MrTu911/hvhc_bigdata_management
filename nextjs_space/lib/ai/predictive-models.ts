
/**
 * Predictive Models for Student Performance
 * Includes at-risk student detection, grade prediction, and dropout prediction
 * 
 * Note: Currently using simulated data. Full integration with Prisma ORM pending.
 */

import { db } from '@/lib/db';

export interface StudentRiskProfile {
  student_id: number;
  student_name: string;
  risk_score: number; // 0-100
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  factors: RiskFactor[];
  recommendations: string[];
  last_updated: Date;
}

export interface RiskFactor {
  factor: string;
  impact: number; // 0-100
  description: string;
}

export interface PredictionMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  last_trained: Date;
}

/**
 * Calculate risk score for a student based on multiple factors
 */
export async function calculateStudentRiskScore(
  studentId: number,
  courseId?: number
): Promise<StudentRiskProfile | null> {
  try {
    // Get student data - using query instead of Prisma
    const studentQuery = await db.query(
      'SELECT id, name, email FROM users WHERE id = $1',
      [studentId]
    );
    
    const student = studentQuery.rows?.[0];
    if (!student) return null;

    // Calculate risk factors
    const factors: RiskFactor[] = [];
    let totalRiskScore = 0;

    // Factor 1: Grade Performance (40% weight)
    const gradeQueryStr = courseId 
      ? 'SELECT AVG(CAST(final_grade AS DECIMAL)) as avg_grade, COUNT(*) as count FROM enrollments WHERE student_id = $1 AND final_grade IS NOT NULL AND course_id = $2'
      : 'SELECT AVG(CAST(final_grade AS DECIMAL)) as avg_grade, COUNT(*) as count FROM enrollments WHERE student_id = $1 AND final_grade IS NOT NULL';
    
    const gradeParams = courseId ? [studentId, courseId] : [studentId];
    const gradeQueryResult = await db.query(gradeQueryStr, gradeParams);
    const gradeData = gradeQueryResult.rows?.[0];

    if (gradeData && parseInt(gradeData.count) > 0) {
      const avgGrade = parseFloat(gradeData.avg_grade);
      let gradeRisk = 0;
      
      if (avgGrade < 5) gradeRisk = 90;
      else if (avgGrade < 6) gradeRisk = 70;
      else if (avgGrade < 7) gradeRisk = 40;
      else if (avgGrade < 8) gradeRisk = 20;
      else gradeRisk = 5;

      factors.push({
        factor: 'Điểm số trung bình',
        impact: gradeRisk,
        description: `Điểm TB: ${avgGrade.toFixed(1)}/10`
      });

      totalRiskScore += gradeRisk * 0.4;
    }

    // Factor 2: Attendance (25% weight)
    // Simulated - would connect to attendance tracking system
    const attendanceRate = 85 + Math.random() * 15; // 85-100%
    let attendanceRisk = 0;
    
    if (attendanceRate < 70) attendanceRisk = 90;
    else if (attendanceRate < 80) attendanceRisk = 60;
    else if (attendanceRate < 90) attendanceRisk = 30;
    else attendanceRisk = 10;

    factors.push({
      factor: 'Tỷ lệ tham gia lớp',
      impact: attendanceRisk,
      description: `Tham gia: ${attendanceRate.toFixed(0)}%`
    });

    totalRiskScore += attendanceRisk * 0.25;

    // Factor 3: Assignment Completion (20% weight)
    // Simulated
    const assignmentRate = 75 + Math.random() * 25; // 75-100%
    let assignmentRisk = 0;
    
    if (assignmentRate < 60) assignmentRisk = 85;
    else if (assignmentRate < 75) assignmentRisk = 55;
    else if (assignmentRate < 90) assignmentRisk = 25;
    else assignmentRisk = 5;

    factors.push({
      factor: 'Hoàn thành bài tập',
      impact: assignmentRisk,
      description: `Hoàn thành: ${assignmentRate.toFixed(0)}%`
    });

    totalRiskScore += assignmentRisk * 0.2;

    // Factor 4: Participation & Engagement (15% weight)
    const participationScore = 60 + Math.random() * 40; // 60-100
    let participationRisk = 0;
    
    if (participationScore < 50) participationRisk = 80;
    else if (participationScore < 70) participationRisk = 50;
    else if (participationScore < 85) participationRisk = 25;
    else participationRisk = 10;

    factors.push({
      factor: 'Tham gia hoạt động',
      impact: participationRisk,
      description: `Điểm tham gia: ${participationScore.toFixed(0)}/100`
    });

    totalRiskScore += participationRisk * 0.15;

    // Determine risk level
    let riskLevel: StudentRiskProfile['risk_level'];
    if (totalRiskScore >= 75) riskLevel = 'critical';
    else if (totalRiskScore >= 50) riskLevel = 'high';
    else if (totalRiskScore >= 25) riskLevel = 'medium';
    else riskLevel = 'low';

    // Generate recommendations
    const recommendations: string[] = [];
    
    if (factors[0]?.impact > 50) {
      recommendations.push('Cần hỗ trợ học tập bổ sung, tổ chức buổi học thêm');
    }
    if (factors[1]?.impact > 50) {
      recommendations.push('Theo dõi và nhắc nhở tham gia lớp đều đặn');
    }
    if (factors[2]?.impact > 50) {
      recommendations.push('Gặp gỡ để hiểu lý do chưa hoàn thành bài tập');
    }
    if (factors[3]?.impact > 50) {
      recommendations.push('Khuyến khích tham gia thảo luận và hoạt động nhóm');
    }
    if (riskLevel === 'critical' || riskLevel === 'high') {
      recommendations.push('⚠️ Ưu tiên can thiệp sớm, liên hệ gia đình nếu cần');
    }

    return {
      student_id: studentId,
      student_name: student.name || student.email,
      risk_score: Math.round(totalRiskScore),
      risk_level: riskLevel,
      factors: factors.sort((a, b) => b.impact - a.impact),
      recommendations,
      last_updated: new Date()
    };
  } catch (error) {
    console.error('Error calculating student risk:', error);
    return null;
  }
}

/**
 * Get at-risk students for a course
 */
export async function getAtRiskStudents(
  courseId: number,
  minRiskScore: number = 50
): Promise<StudentRiskProfile[]> {
  try {
    // Get all enrolled students
    const enrollmentsQuery = await db.query(
      'SELECT e.student_id, u.name, u.email FROM enrollments e JOIN users u ON u.id = e.student_id WHERE e.course_id = $1',
      [courseId]
    );

    const enrollments = enrollmentsQuery.rows || [];
    const riskProfiles: StudentRiskProfile[] = [];

    for (const enrollment of enrollments) {
      const profile = await calculateStudentRiskScore(enrollment.student_id, courseId);
      
      if (profile && profile.risk_score >= minRiskScore) {
        riskProfiles.push(profile);
      }
    }

    // Sort by risk score descending
    return riskProfiles.sort((a, b) => b.risk_score - a.risk_score);
  } catch (error) {
    console.error('Error getting at-risk students:', error);
    return [];
  }
}

/**
 * Get risk statistics for a course
 */
export async function getCourseRiskStatistics(courseId: number) {
  try {
    const enrollmentsQuery = await db.query(
      'SELECT e.student_id, u.name FROM enrollments e JOIN users u ON u.id = e.student_id WHERE e.course_id = $1',
      [courseId]
    );

    const enrollments = enrollmentsQuery.rows || [];

    const stats = {
      total_students: enrollments.length,
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      average_risk_score: 0,
      at_risk_percentage: 0
    };

    let totalRisk = 0;

    for (const enrollment of enrollments) {
      const profile = await calculateStudentRiskScore(enrollment.student_id, courseId);
      
      if (profile) {
        stats[profile.risk_level]++;
        totalRisk += profile.risk_score;
      }
    }

    stats.average_risk_score = enrollments.length > 0 
      ? Math.round(totalRisk / enrollments.length) 
      : 0;
    
    stats.at_risk_percentage = enrollments.length > 0
      ? Math.round(((stats.critical + stats.high) / enrollments.length) * 100)
      : 0;

    return stats;
  } catch (error) {
    console.error('Error getting course risk statistics:', error);
    return null;
  }
}

/**
 * Predict final grade for a student
 */
export async function predictFinalGrade(
  studentId: number,
  courseId: number
): Promise<{ predicted_grade: number; confidence: number } | null> {
  try {
    // Get current enrollment
    const enrollmentQuery = await db.query(
      'SELECT final_grade FROM enrollments WHERE student_id = $1 AND course_id = $2 LIMIT 1',
      [studentId, courseId]
    );

    const enrollment = enrollmentQuery.rows?.[0];
    if (!enrollment) return null;

    // Simple linear prediction based on mid-term and current average
    // In production, this would use a trained ML model
    const currentGrade = enrollment.final_grade || 0;
    const riskProfile = await calculateStudentRiskScore(studentId, courseId);
    
    if (!riskProfile) return null;

    // Adjust prediction based on risk factors
    let predictedGrade = currentGrade;
    
    if (riskProfile.risk_score > 70) {
      predictedGrade = Math.max(0, currentGrade - 1.5);
    } else if (riskProfile.risk_score > 50) {
      predictedGrade = Math.max(0, currentGrade - 0.5);
    } else if (riskProfile.risk_score < 25) {
      predictedGrade = Math.min(10, currentGrade + 0.5);
    }

    const confidence = 1 - (riskProfile.risk_score / 100) * 0.3;

    return {
      predicted_grade: Math.round(predictedGrade * 10) / 10,
      confidence: Math.round(confidence * 100) / 100
    };
  } catch (error) {
    console.error('Error predicting final grade:', error);
    return null;
  }
}

/**
 * Get model performance metrics (simulated)
 */
export function getModelMetrics(): PredictionMetrics {
  return {
    accuracy: 0.87,
    precision: 0.84,
    recall: 0.81,
    f1_score: 0.82,
    last_trained: new Date('2025-10-01')
  };
}
