import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireFunction } from '@/lib/rbac/middleware';
import { AI } from '@/lib/rbac/function-codes';

/**
 * API Student Trend Analysis
 * Phân tích xu hướng học tập của sinh viên qua các học kỳ
 * POST: Phân tích xu hướng và dự đoán GPA kỳ tiếp theo
 * 
 * RBAC: AI.ANALYZE_TRENDS
 */

export async function POST(request: NextRequest) {
  try {
    // RBAC Check: AI.ANALYZE_TRENDS
    const authResult = await requireFunction(request, AI.ANALYZE_TRENDS);
    if (!authResult.allowed) {
      return authResult.response!;
    }
    const user = authResult.user!;

    const body = await request.json();
    const { studentId, semesterCount = 4 } = body;

    if (!studentId) {
      return NextResponse.json({ error: 'Student ID required' }, { status: 400 });
    }

    // Lấy thông tin sinh viên
    const student = await prisma.hocVien.findUnique({
      where: { id: studentId },
      include: {
        ketQuaHocTap: {
          orderBy: [
            { namHoc: 'asc' },
            { hocKy: 'asc' },
          ],
        },
      },
    });

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Nhóm kết quả theo học kỳ
    const semesterMap = new Map<string, any[]>();
    student.ketQuaHocTap.forEach((result) => {
      const key = `${result.namHoc || 'Unknown'}-${result.hocKy || 'Unknown'}`;
      if (!semesterMap.has(key)) {
        semesterMap.set(key, []);
      }
      semesterMap.get(key)!.push(result);
    });

    // Tính GPA cho từng học kỳ
    const semesterGPAs: Array<{
      semester: string;
      namHoc: string;
      hocKy: string;
      gpa: number;
      credits: number;
      totalSubjects: number;
      passedSubjects: number;
    }> = [];

    semesterMap.forEach((results, semesterKey) => {
      const validResults = results.filter((r) => r.diemTongKet !== null);
      if (validResults.length === 0) return;

      const totalGradePoints = validResults.reduce(
        (sum, r) => sum + (r.diemTongKet || 0) * (r.soTinChi || 3),
        0
      );
      const totalCredits = validResults.reduce((sum, r) => sum + (r.soTinChi || 3), 0);
      const gpa = totalCredits > 0 ? totalGradePoints / totalCredits : 0;
      const passedSubjects = validResults.filter((r) => (r.diemTongKet || 0) >= 2.0).length;

      const [namHoc, hocKy] = semesterKey.split('-');
      semesterGPAs.push({
        semester: semesterKey,
        namHoc,
        hocKy,
        gpa: parseFloat(gpa.toFixed(2)),
        credits: totalCredits,
        totalSubjects: validResults.length,
        passedSubjects,
      });
    });

    // Sắp xếp theo thời gian
    semesterGPAs.sort((a, b) => {
      const [yearA, semA] = [a.namHoc, a.hocKy];
      const [yearB, semB] = [b.namHoc, b.hocKy];
      if (yearA !== yearB) return yearA.localeCompare(yearB);
      return semA.localeCompare(semB);
    });

    // Lấy N học kỳ gần nhất
    const recentSemesters = semesterGPAs.slice(-semesterCount);

    if (recentSemesters.length < 2) {
      return NextResponse.json({
        success: true,
        studentId,
        gpaHistory: recentSemesters,
        trend: 'insufficient_data',
        prediction: null,
        confidence: 0,
        message: 'Không đủ dữ liệu để phân tích xu hướng',
      });
    }

    // ===== PHÂN TÍCH XU HƯỚNG =====
    const gpas = recentSemesters.map((s) => s.gpa);

    // Tính xu hướng bằng Linear Regression đơn giản
    const n = gpas.length;
    const xValues = Array.from({ length: n }, (_, i) => i + 1); // 1, 2, 3, ...
    const sumX = xValues.reduce((a, b) => a + b, 0);
    const sumY = gpas.reduce((a, b) => a + b, 0);
    const sumXY = xValues.reduce((sum, x, i) => sum + x * gpas[i], 0);
    const sumX2 = xValues.reduce((sum, x) => sum + x * x, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Dự đoán GPA kỳ tiếp theo
    const predictedGPA = slope * (n + 1) + intercept;
    const clampedPrediction = Math.max(0, Math.min(4.0, predictedGPA));

    // Xác định xu hướng
    let trend: 'improving' | 'declining' | 'stable';
    if (slope > 0.1) {
      trend = 'improving';
    } else if (slope < -0.1) {
      trend = 'declining';
    } else {
      trend = 'stable';
    }

    // Tính độ tin cậy (dựa trên R-squared)
    const meanY = sumY / n;
    const ssTotal = gpas.reduce((sum, y) => sum + Math.pow(y - meanY, 2), 0);
    const ssResidual = gpas.reduce(
      (sum, y, i) => sum + Math.pow(y - (slope * (i + 1) + intercept), 2),
      0
    );
    const rSquared = ssTotal > 0 ? 1 - ssResidual / ssTotal : 0;
    const confidence = Math.max(0, Math.min(1, rSquared));

    // Tạo recommendations dựa trên xu hướng
    const recommendations: string[] = [];
    if (trend === 'declining') {
      recommendations.push('Gặp gế giảng viên hướng dẫn để nhận hỗ trợ');
      recommendations.push('Tham gia các buổi học bổ trợ kiến thức');
      recommendations.push('Xây dựng kế hoạch học tập cụ thể hơn');
    } else if (trend === 'stable') {
      recommendations.push('Tiếp tục duy trì cường độ học tập hiện tại');
      recommendations.push('Tìm kiếm các phương pháp học tập hiệu quả hơn');
      recommendations.push('Tham gia thêm các hoạt động nghiên cứu');
    } else {
      recommendations.push('Tiếp tục duy trì xu hướng tốt đẹp này');
      recommendations.push('Chia sẻ kinh nghiệm học tập với bạn bè');
      recommendations.push('Thử thách bản thân với các môn học nâng cao');
    }

    // Lưu insight vào database
    await prisma.aIInsight.create({
      data: {
        type: 'trend_analysis',
        targetType: 'student',
        targetId: studentId,
        data: {
          gpaHistory: recentSemesters,
          trend,
          prediction: parseFloat(clampedPrediction.toFixed(2)),
          slope: parseFloat(slope.toFixed(4)),
          recommendations,
        },
        confidence: parseFloat(confidence.toFixed(2)),
        createdBy: user.id,
        validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Valid for 7 days
      },
    });

    return NextResponse.json({
      success: true,
      studentId,
      gpaHistory: recentSemesters,
      trend,
      prediction: parseFloat(clampedPrediction.toFixed(2)),
      confidence: parseFloat(confidence.toFixed(2)),
      slope: parseFloat(slope.toFixed(4)),
      recommendations,
      analysis: {
        currentGPA: gpas[gpas.length - 1],
        averageGPA: parseFloat((sumY / n).toFixed(2)),
        highestGPA: Math.max(...gpas),
        lowestGPA: Math.min(...gpas),
      },
    });
  } catch (error: any) {
    console.error('Student trend analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze student trends', details: error.message },
      { status: 500 }
    );
  }
}
