import { NextRequest, NextResponse } from 'next/server';
import { summarizeResearch } from '@/lib/ai-service';
import { requireFunction } from '@/lib/rbac/middleware';
import { AI } from '@/lib/rbac/function-codes';

/**
 * POST /api/ai/summary
 * Tóm tắt nội dung nghiên cứu
 * 
 * Body:
 * - text: string - Nội dung cần tóm tắt
 * - maxLength?: number - Độ dài tối đa (số từ)
 * 
 * RBAC: AI.SUMMARIZE
 */
export async function POST(req: NextRequest) {
  try {
    // RBAC Check: AI.SUMMARIZE
    const authResult = await requireFunction(req, AI.SUMMARIZE);
    if (!authResult.allowed) {
      return authResult.response!;
    }
    const user = authResult.user!;

    const body = await req.json();
    const { text, maxLength = 500 } = body;

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'Văn bản không hợp lệ' },
        { status: 400 }
      );
    }

    const summary = await summarizeResearch(text, maxLength);

    return NextResponse.json({
      success: true,
      summary,
      metadata: {
        originalLength: text.length,
        summaryLength: summary.length,
        maxLength,
        generatedAt: new Date().toISOString(),
        user: user.email,
      }
    });

  } catch (error: any) {
    console.error('Summary API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal Server Error', 
        message: 'Lỗi tóm tắt nội dung',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
