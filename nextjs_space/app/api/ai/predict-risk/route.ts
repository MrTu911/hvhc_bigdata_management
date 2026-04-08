import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireFunction } from '@/lib/rbac/middleware';
import { AI } from '@/lib/rbac/function-codes';

/**
 * API Risk Prediction
 * Dự đoán rủi ro học tập của sinh viên
 * POST: Tính toán mức độ rủi ro và các biện pháp can thiệp
 * 
 * RBAC: AI.PREDICT_RISK
 */

export async function POST(request: NextRequest) {
  try {
    // RBAC Check: AI.PREDICT_RISK
    const authResult = await requireFunction(request, AI.PREDICT_RISK);
    if (!authResult.allowed) {
      return authResult.response!;
    }
    const user = authResult.user!;

    const body = await request.json();
    const { studentId } = body;

    if (!studentId) {
      return NextResponse.json({ error: 'Student ID required' }, { status: 400 });
    }

    // Lấy thông tin sinh viên
    const student = await prisma.hocVien.findUnique({
      where: { id: studentId },
      include: {
        ketQuaHocTap: {
          orderBy: [
            { namHoc: 'desc' },
            { hocKy: 'desc' },
          ],
        },
      },
    });

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // ===== TÍNH TOÁN RỦI RO =====

    const factors: Array<{ factor: string; severity: string; description: string }> = [];
    let riskScore = 0; // 0-100, cao hơn = rủi ro cao hơn

    // 1. GPA hiện tại (trọng số: 30 điểm)
    const currentGPA = student.diemTrungBinh || 0;
    if (currentGPA < 2.0) {
      riskScore += 30;
      factors.push({
        factor: 'GPA thấp',
        severity: 'high',
        description: `GPA hiện tại ${currentGPA.toFixed(2)} dưới ngưỡng 2.0`,
      });
    } else if (currentGPA < 2.5) {
      riskScore += 15;
      factors.push({
        factor: 'GPA cần cải thiện',
        severity: 'medium',
        description: `GPA hiện tại ${currentGPA.toFixed(2)} cần nâng cao`,
      });
    }

    // 2. Xu hướng điểm (trọng số: 25 điểm)
    const recentResults = student.ketQuaHocTap.slice(0, 10); // 10 môn gần nhất
    if (recentResults.length >= 3) {
      const recentGrades = recentResults
        .map((r) => r.diemTongKet)
        .filter((g) => g !== null) as number[];

      if (recentGrades.length >= 3) {
        const firstAvg =
          recentGrades.slice(0, Math.floor(recentGrades.length / 2)).reduce((a, b) => a + b, 0) /
          Math.floor(recentGrades.length / 2);
        const secondAvg =
          recentGrades.slice(Math.floor(recentGrades.length / 2)).reduce((a, b) => a + b, 0) /
          Math.ceil(recentGrades.length / 2);

        if (secondAvg < firstAvg - 0.3) {
          riskScore += 25;
          factors.push({
            factor: 'Điểm giảm liên tục',
            severity: 'high',
            description: 'Xu hướng điểm giảm rõ rệt trong thời gian gần đây',
          });
        } else if (secondAvg < firstAvg) {
          riskScore += 12;
          factors.push({
            factor: 'Điểm có xu hướng giảm',
            severity: 'medium',
            description: 'Điểm số có dấu hiệu suy giảm',
          });
        }
      }
    }

    // 3. Tỷ lệ môn trượt (trọng số: 20 điểm)
    const failedSubjects = student.ketQuaHocTap.filter(
      (r) => r.diemTongKet !== null && r.diemTongKet < 2.0
    ).length;
    const totalSubjects = student.ketQuaHocTap.filter((r) => r.diemTongKet !== null).length;
    const failRate = totalSubjects > 0 ? (failedSubjects / totalSubjects) * 100 : 0;

    if (failRate > 30) {
      riskScore += 20;
      factors.push({
        factor: 'Tỷ lệ trượt cao',
        severity: 'high',
        description: `Đã trượt ${failedSubjects}/${totalSubjects} môn (${failRate.toFixed(1)}%)`,
      });
    } else if (failRate > 15) {
      riskScore += 10;
      factors.push({
        factor: 'Có môn trượt',
        severity: 'medium',
        description: `Đã trượt ${failedSubjects}/${totalSubjects} môn (${failRate.toFixed(1)}%)`,
      });
    }

    // 4. Điểm thành phần thấp (trọng số: 15 điểm)
    const lowComponentScores = recentResults.filter(
      (r) =>
        (r.diemChuyenCan !== null && r.diemChuyenCan < 5) ||
        (r.diemGiuaKy !== null && r.diemGiuaKy < 4) ||
        (r.diemBaiTap !== null && r.diemBaiTap < 4)
    ).length;

    if (lowComponentScores > 3) {
      riskScore += 15;
      factors.push({
        factor: 'Điểm thành phần kém',
        severity: 'medium',
        description: `Nhiều môn có điểm chuyên cần/giữa kỳ/bài tập thấp`,
      });
    } else if (lowComponentScores > 1) {
      riskScore += 7;
      factors.push({
        factor: 'Cần chú ý điểm thành phần',
        severity: 'low',
        description: 'Một số điểm thành phần cần cải thiện',
      });
    }

    // 5. Số lượng môn học (trọng số: 10 điểm)
    if (totalSubjects < 5) {
      riskScore += 10;
      factors.push({
        factor: 'Ít dữ liệu học tập',
        severity: 'low',
        description: 'Số môn học ít, khó đánh giá chính xác',
      });
    }

    // Xác định mức rủi ro
    let riskLevel: 'high' | 'medium' | 'low';
    let riskLabelVi: string;
    if (riskScore >= 60) {
      riskLevel = 'high';
      riskLabelVi = 'Rủi ro cao';
    } else if (riskScore >= 30) {
      riskLevel = 'medium';
      riskLabelVi = 'Rủi ro trung bình';
    } else {
      riskLevel = 'low';
      riskLabelVi = 'Rủi ro thấp';
    }

    // Đề xuất biện pháp can thiệp
    const interventions: Array<{ action: string; priority: string }> = [];

    if (riskLevel === 'high') {
      interventions.push(
        {
          action: 'Gặp gế giảng viên hướng dẫn ngay lập tức',
          priority: 'urgent',
        },
        {
          action: 'Tham gia chương trình học bổ trợ kiến thức cơ bản',
          priority: 'high',
        },
        {
          action: 'Xây dựng kế hoạch học tập cá nhân hóa với GVHD',
          priority: 'high',
        },
        {
          action: 'Đánh giá lại phương pháp học tập hiện tại',
          priority: 'medium',
        }
      );
    } else if (riskLevel === 'medium') {
      interventions.push(
        {
          action: 'Tăng cường giao tiếp với giảng viên',
          priority: 'high',
        },
        {
          action: 'Tham gia học nhóm với bạn học giỏi',
          priority: 'medium',
        },
        {
          action: 'Quản lý thời gian học tập hiệu quả hơn',
          priority: 'medium',
        }
      );
    } else {
      interventions.push(
        {
          action: 'Tiếp tục duy trì phương pháp học hiện tại',
          priority: 'low',
        },
        {
          action: 'Tìm kiếm cơ hội thách thức bản thân',
          priority: 'low',
        }
      );
    }

    // Lưu risk prediction vào database
    await prisma.aIInsight.create({
      data: {
        type: 'risk_prediction',
        targetType: 'student',
        targetId: studentId,
        data: {
          riskLevel,
          riskScore,
          factors,
          interventions,
          metrics: {
            currentGPA,
            failRate: parseFloat(failRate.toFixed(2)),
            totalSubjects,
            failedSubjects,
          },
        },
        confidence: factors.length > 0 ? 0.8 : 0.5, // Higher confidence with more factors
        createdBy: user.id,
        validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Valid for 7 days
      },
    });

    return NextResponse.json({
      success: true,
      studentId,
      riskLevel,
      riskLabelVi,
      riskScore,
      factors,
      interventions,
      metrics: {
        currentGPA,
        failRate: parseFloat(failRate.toFixed(2)),
        totalSubjects,
        failedSubjects,
      },
    });
  } catch (error: any) {
    console.error('Risk prediction error:', error);
    return NextResponse.json(
      { error: 'Failed to predict risk', details: error.message },
      { status: 500 }
    );
  }
}
