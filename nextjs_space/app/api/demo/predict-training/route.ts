
/**
 * Demo API - Training Prediction
 * Dự báo kết quả học viên cho mục đích demo
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * POST /api/demo/predict-training - Predict student performance
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { studentId, courseId, features } = body;

    // Simulate AI prediction with realistic data
    const baseScore = Math.random() * 30 + 60; // 60-90
    const attendance = features?.attendance || Math.random() * 20 + 80;
    const previousScore = features?.previousScore || baseScore;
    
    // Calculate predicted score with some logic
    const predictedScore = Math.min(100, 
      baseScore * 0.4 + 
      attendance * 0.3 + 
      previousScore * 0.3 +
      (Math.random() * 10 - 5)
    );

    // Risk assessment
    let riskLevel: 'low' | 'medium' | 'high';
    let riskColor: string;
    
    if (predictedScore >= 80) {
      riskLevel = 'low';
      riskColor = 'green';
    } else if (predictedScore >= 65) {
      riskLevel = 'medium';
      riskColor = 'yellow';
    } else {
      riskLevel = 'high';
      riskColor = 'red';
    }

    // Recommendations
    const recommendations: string[] = [];
    if (attendance < 85) {
      recommendations.push('Tăng cường tham gia lớp học');
    }
    if (predictedScore < 70) {
      recommendations.push('Cần hỗ trợ học tập bổ sung');
      recommendations.push('Tham gia nhóm học tập');
    }
    if (predictedScore >= 85) {
      recommendations.push('Duy trì kết quả tốt');
      recommendations.push('Có thể tham gia nghiên cứu nâng cao');
    }

    return NextResponse.json({
      success: true,
      prediction: {
        studentId,
        courseId,
        predictedScore: Math.round(predictedScore * 10) / 10,
        confidence: Math.round((85 + Math.random() * 10) * 10) / 10,
        riskLevel,
        riskColor,
        factors: {
          attendance: Math.round(attendance * 10) / 10,
          previousPerformance: Math.round(previousScore * 10) / 10,
          engagement: Math.round((Math.random() * 30 + 70) * 10) / 10,
        },
        recommendations,
        modelInfo: {
          modelName: 'Student Performance Predictor v1.2',
          algorithm: 'Random Forest',
          accuracy: 0.874,
          lastTrained: new Date().toISOString(),
        }
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error in demo prediction:', error);
    return NextResponse.json(
      { error: 'Prediction failed', message: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/demo/predict-training - Get demo training predictions
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Generate sample predictions for dashboard
    const predictions = Array.from({ length: 10 }, (_, i) => {
      const score = Math.random() * 40 + 60;
      return {
        id: `student-${i + 1}`,
        name: `Học viên ${i + 1}`,
        currentScore: Math.round((score - 5 + Math.random() * 10) * 10) / 10,
        predictedScore: Math.round(score * 10) / 10,
        riskLevel: score >= 80 ? 'low' : score >= 65 ? 'medium' : 'high',
        confidence: Math.round((80 + Math.random() * 15) * 10) / 10,
      };
    });

    return NextResponse.json({
      success: true,
      data: predictions,
      summary: {
        total: predictions.length,
        highRisk: predictions.filter(p => p.riskLevel === 'high').length,
        mediumRisk: predictions.filter(p => p.riskLevel === 'medium').length,
        lowRisk: predictions.filter(p => p.riskLevel === 'low').length,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error fetching demo predictions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch predictions', message: error.message },
      { status: 500 }
    );
  }
}
