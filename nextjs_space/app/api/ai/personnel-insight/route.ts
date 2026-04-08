import { NextRequest, NextResponse } from 'next/server';
import { StabilityAnalyzer } from '@/server/services/ai/StabilityAnalyzer';
import { PromotionPredictor } from '@/server/services/ai/PromotionPredictor';
import { requireFunction } from '@/lib/rbac/middleware';
import { AI } from '@/lib/rbac/function-codes';

/**
 * API Personnel Insight
 * RBAC: AI.VIEW_PERSONNEL_INSIGHTS
 */
export async function GET(request: NextRequest) {
  try {
    // RBAC Check: AI.VIEW_PERSONNEL_INSIGHTS
    const authResult = await requireFunction(request, AI.VIEW_PERSONNEL_INSIGHTS);
    if (!authResult.allowed) {
      return authResult.response!;
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const type = searchParams.get('type') || 'overview';

    if (!userId) {
      return NextResponse.json({ success: false, error: 'userId is required' }, { status: 400 });
    }

    let result;

    switch (type) {
      case 'stability':
        result = await StabilityAnalyzer.calculateStabilityIndex(userId);
        break;
      case 'promotion':
        result = await PromotionPredictor.predictPromotionPotential(userId);
        break;
      case 'career':
        result = await PromotionPredictor.generateCareerPath(userId);
        break;
      case 'overview':
      default:
        const [stability, promotion] = await Promise.all([
          StabilityAnalyzer.calculateStabilityIndex(userId),
          PromotionPredictor.predictPromotionPotential(userId),
        ]);
        result = { stability, promotion };
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Personnel insight error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
