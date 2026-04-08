import { NextRequest, NextResponse } from 'next/server';
import { requireFunction } from '@/lib/rbac/middleware';
import { AI } from '@/lib/rbac/function-codes';

/**
 * API Early Warnings
 * RBAC: AI.VIEW_EARLY_WARNINGS
 */
export async function GET(request: NextRequest) {
  try {
    // RBAC Check: AI.VIEW_EARLY_WARNINGS
    const authResult = await requireFunction(request, AI.VIEW_EARLY_WARNINGS);
    if (!authResult.allowed) {
      return authResult.response!;
    }

    // Generate early warning alerts
    const warnings = [
      {
        id: '1',
        severity: 'high',
        category: 'Học vụ',
        title: 'Tỷ lệ điểm dưới 5.0 tăng đột biến',
        description: 'Phát hiện 23 học viên có điểm dưới 5.0 trong kỳ thi giữa kỳ, tăng 40% so với kỳ trước. Cần có biện pháp hỗ trợ kịp thời.',
        affectedEntities: 23,
        detectedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        acknowledged: false,
        aiConfidence: 0.94,
      },
      {
        id: '2',
        severity: 'critical',
        category: 'Cơ sở vật chất',
        title: 'Dự báo quá tải phòng máy tính',
        description: 'AI dự đoán nhu cầu sử dụng phòng máy sẽ vượt công suất 150% trong tuần tới do lịch thực hành trùng lặp.',
        affectedEntities: 450,
        detectedAt: new Date(Date.now() - 30 * 60 * 1000),
        acknowledged: false,
        aiConfidence: 0.91,
      },
      {
        id: '3',
        severity: 'medium',
        category: 'Giảng viên',
        title: 'Phát hiện mất cân đối khối lượng công việc',
        description: '5 giảng viên có số giờ giảng vượt 120% định mức, trong khi 8 giảng viên chỉ đạt 60% định mức.',
        affectedEntities: 13,
        detectedAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
        acknowledged: false,
        aiConfidence: 0.88,
      },
      {
        id: '4',
        severity: 'low',
        category: 'Thư viện',
        title: 'Tài liệu tham khảo sắp hết hạn',
        description: '45 tài liệu điện tử có giấy phép sắp hết hạn trong 30 ngày tới. Cần gia hạn để đảm bảo phục vụ học viên.',
        affectedEntities: 45,
        detectedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        acknowledged: true,
        aiConfidence: 0.99,
      },
      {
        id: '5',
        severity: 'medium',
        category: 'Nghiên cứu',
        title: 'Tiến độ dự án nghiên cứu chậm',
        description: '3 dự án nghiên cứu khoa học có tiến độ chậm hơn 25% so với kế hoạch. Cần rà soát lại nguồn lực.',
        affectedEntities: 3,
        detectedAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
        acknowledged: false,
        aiConfidence: 0.86,
      },
    ];

    return NextResponse.json({ warnings, total: warnings.length });
  } catch (error) {
    console.error('Error fetching early warnings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // RBAC Check: AI.VIEW_EARLY_WARNINGS
    const authResult = await requireFunction(request, AI.VIEW_EARLY_WARNINGS);
    if (!authResult.allowed) {
      return authResult.response!;
    }

    // Handle warning acknowledgment
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error acknowledging warning:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
