import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { generateStudentRecommendations } from '@/lib/ai-service';
import { requireFunction } from '@/lib/rbac/middleware';
import { AI } from '@/lib/rbac/function-codes';

/**
 * API Recommendations
 * Tạo gợi ý cải thiện cho giảng viên và sinh viên
 * POST: Tạo recommendations dựa trên AI
 * GET: Lấy recommendations đã lưu
 * 
 * RBAC: AI.VIEW_RECOMMENDATIONS
 */

export async function GET(request: NextRequest) {
  try {
    // RBAC Check: AI.VIEW_RECOMMENDATIONS
    const authResult = await requireFunction(request, AI.VIEW_RECOMMENDATIONS);
    if (!authResult.allowed) {
      return authResult.response!;
    }

    const { searchParams } = new URL(request.url);
    const targetType = searchParams.get('targetType'); // 'faculty' | 'student'
    const targetId = searchParams.get('targetId');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!targetType || !targetId) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Lấy recommendations còn hiệu lực
    const now = new Date();
    const recommendations = await prisma.aIInsight.findMany({
      where: {
        type: 'recommendation',
        targetType,
        targetId,
        OR: [
          { validUntil: { gte: now } },
          { validUntil: null },
        ],
      },
      orderBy: {
        generatedAt: 'desc',
      },
      take: limit,
    });

    return NextResponse.json({
      success: true,
      recommendations: recommendations.map((rec) => ({
        id: rec.id,
        data: rec.data,
        confidence: rec.confidence,
        generatedAt: rec.generatedAt,
        validUntil: rec.validUntil,
      })),
    });
  } catch (error: any) {
    console.error('GET recommendations error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recommendations', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // RBAC Check: AI.VIEW_RECOMMENDATIONS
    const authResult = await requireFunction(request, AI.VIEW_RECOMMENDATIONS);
    if (!authResult.allowed) {
      return authResult.response!;
    }
    const user = authResult.user!;

    const body = await request.json();
    const { targetType, targetId, context } = body;

    if (!targetType || !targetId) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    let recommendations: any[] = [];
    let aiResponse = '';

    if (targetType === 'student') {
      // Lấy thông tin sinh viên
      const student = await prisma.hocVien.findUnique({
        where: { id: targetId },
        include: {
          ketQuaHocTap: {
            orderBy: [
              { namHoc: 'desc' },
              { hocKy: 'desc' },
            ],
            take: 10,
          },
        },
      });

      if (!student) {
        return NextResponse.json({ error: 'Student not found' }, { status: 404 });
      }

      // Chuẩn bị dữ liệu cho AI
      const studentData = {
        hoTen: student.hoTen,
        gpa: student.diemTrungBinh,
        trangThai: student.trangThai,
        recentGrades: student.ketQuaHocTap.slice(0, 5).map((r) => ({
          monHoc: r.monHoc,
          diemTongKet: r.diemTongKet,
          hocKy: r.hocKy,
          namHoc: r.namHoc,
        })),
        totalSubjects: student.ketQuaHocTap.length,
        ...context,
      };

      // Gọi AI để tạo recommendations
      aiResponse = await generateStudentRecommendations(studentData);

      // Parse AI response để tạo structured recommendations
      recommendations = [
        {
          id: 'rec_1',
          title: 'Cải thiện kết quả học tập',
          description: aiResponse.split('\n')[0] || 'Tăng cường ôn tập và luyện tập',
          priority: student.diemTrungBinh < 2.5 ? 'high' : 'medium',
          category: 'academic',
          aiConfidence: 0.85,
        },
      ];

      // Thêm recommendations dựa trên GPA
      if (student.diemTrungBinh < 2.0) {
        recommendations.push({
          id: 'rec_2',
          title: 'Gặp gế giảng viên hướng dẫn',
          description: 'Người hướng dẫn có thể giúp xác định vàn đề và đưa ra giải pháp phù hợp',
          priority: 'urgent',
          category: 'mentorship',
          aiConfidence: 0.9,
        });
      }

      // Thêm recommendations dựa trên xu hướng
      const recentGrades = student.ketQuaHocTap
        .slice(0, 5)
        .map((r) => r.diemTongKet)
        .filter((g) => g !== null) as number[];
      if (recentGrades.length >= 3) {
        const avg1 = recentGrades.slice(0, 2).reduce((a, b) => a + b, 0) / 2;
        const avg2 = recentGrades.slice(2).reduce((a, b) => a + b, 0) / (recentGrades.length - 2);
        if (avg2 < avg1 - 0.3) {
          recommendations.push({
            id: 'rec_3',
            title: 'Đảo ngược xu hướng giảm điểm',
            description: 'Điểm số đang giảm, cần điều chỉnh phương pháp học tập ngay',
            priority: 'high',
            category: 'study_method',
            aiConfidence: 0.8,
          });
        }
      }
    } else if (targetType === 'faculty') {
      // Lấy thông tin giảng viên
      const faculty = await prisma.facultyProfile.findUnique({
        where: { id: targetId },
        include: {
          hocVienHuongDan: { include: { ketQuaHocTap: true } },
          researchProjectsList: true,
          teachingSubjectsList: true,
        },
      });

      if (!faculty) {
        return NextResponse.json({ error: 'Faculty not found' }, { status: 404 });
      }

      // Tạo recommendations cho giảng viên
      recommendations = [
        {
          id: 'rec_1',
          title: 'Tăng cường hướng dẫn học viên',
          description: 'Duy trì giao tiếp đều đặn với học viên, theo dõi tiến độ học tập',
          priority: 'medium',
          category: 'mentorship',
          aiConfidence: 0.85,
        },
      ];

      if (faculty.researchProjectsList.length < 3) {
        recommendations.push({
          id: 'rec_2',
          title: 'Phát triển nghiên cứu khoa học',
          description: 'Tăng cường hoạt động nghiên cứu và công bố khoa học',
          priority: 'high',
          category: 'research',
          aiConfidence: 0.75,
        });
      }

      if (faculty.teachingSubjectsList.length > 5) {
        recommendations.push({
          id: 'rec_3',
          title: 'Đổi mới phương pháp giảng dạy',
          description: 'Ứng dụng công nghệ và phương pháp giảng dạy hiện đại',
          priority: 'medium',
          category: 'teaching_method',
          aiConfidence: 0.7,
        });
      }
    }

    // Lưu recommendations vào database
    const insight = await prisma.aIInsight.create({
      data: {
        type: 'recommendation',
        targetType,
        targetId,
        data: {
          recommendations,
          aiResponse,
        },
        confidence: 0.8,
        createdBy: user.id,
        validUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // Valid for 14 days
      },
    });

    return NextResponse.json({
      success: true,
      recommendations,
      insightId: insight.id,
    });
  } catch (error: any) {
    console.error('POST recommendations error:', error);
    return NextResponse.json(
      { error: 'Failed to generate recommendations', details: error.message },
      { status: 500 }
    );
  }
}
