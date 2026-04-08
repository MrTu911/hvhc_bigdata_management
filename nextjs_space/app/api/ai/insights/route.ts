import { NextRequest, NextResponse } from 'next/server';
import { generateTrainingInsights } from '@/lib/ai-service';
import { requireFunction } from '@/lib/rbac/middleware';
import { AI } from '@/lib/rbac/function-codes';

/**
 * POST /api/ai/insights
 * Tạo AI insights từ dữ liệu đào tạo
 * 
 * Body:
 * - data: any - Dữ liệu đào tạo cần phân tích
 * - type?: string - Loại phân tích (training, research, student)
 * 
 * RBAC: AI.VIEW_INSIGHTS
 */
export async function POST(req: NextRequest) {
  try {
    // RBAC Check: AI.VIEW_INSIGHTS
    const authResult = await requireFunction(req, AI.VIEW_INSIGHTS);
    if (!authResult.allowed) {
      return authResult.response!;
    }

    const body = await req.json();
    const { data, type = 'training' } = body;

    if (!data) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'Thiếu dữ liệu cần phân tích' },
        { status: 400 }
      );
    }

    const insights = await generateTrainingInsights(data);
    const user = authResult.user!;

    return NextResponse.json({
      success: true,
      insights,
      metadata: {
        type,
        generatedAt: new Date().toISOString(),
        user: user.email,
      }
    });

  } catch (error: any) {
    console.error('Insights API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal Server Error', 
        message: 'Lỗi tạo insights',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
