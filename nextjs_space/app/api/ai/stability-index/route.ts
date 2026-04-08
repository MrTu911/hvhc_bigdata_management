import { NextRequest, NextResponse } from 'next/server';
import { StabilityAnalyzer } from '@/server/services/ai/StabilityAnalyzer';
import { requireFunction } from '@/lib/rbac/middleware';
import { AI } from '@/lib/rbac/function-codes';

/**
 * API Stability Index
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
    const unitId = searchParams.get('unitId') || undefined;

    const result = await StabilityAnalyzer.identifyRiskFactors(unitId);

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Stability index error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // RBAC Check: AI.VIEW_PERSONNEL_INSIGHTS
    const authResult = await requireFunction(request, AI.VIEW_PERSONNEL_INSIGHTS);
    if (!authResult.allowed) {
      return authResult.response!;
    }

    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ success: false, error: 'userId is required' }, { status: 400 });
    }

    const result = await StabilityAnalyzer.calculateStabilityIndex(userId);

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Stability calculation error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
