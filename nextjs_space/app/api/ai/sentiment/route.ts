import { NextRequest, NextResponse } from 'next/server';
import { analyzeSentiment, analyzeSentimentBatch } from '@/lib/ai-service';
import { requireFunction } from '@/lib/rbac/middleware';
import { AI } from '@/lib/rbac/function-codes';

/**
 * POST /api/ai/sentiment
 * Phân tích sentiment của văn bản
 * 
 * Body:
 * - text: string (single text) hoặc
 * - texts: string[] (batch processing)
 * 
 * RBAC: AI.ANALYZE_SENTIMENT
 */
export async function POST(req: NextRequest) {
  try {
    // RBAC Check: AI.ANALYZE_SENTIMENT
    const authResult = await requireFunction(req, AI.ANALYZE_SENTIMENT);
    if (!authResult.allowed) {
      return authResult.response!;
    }
    const user = authResult.user!;

    const body = await req.json();
    const { text, texts } = body;

    // Validate input
    if (!text && !texts) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'Thiếu tham số text hoặc texts' },
        { status: 400 }
      );
    }

    // Single text analysis
    if (text) {
      if (typeof text !== 'string' || text.trim().length === 0) {
        return NextResponse.json(
          { error: 'Bad Request', message: 'Văn bản không hợp lệ' },
          { status: 400 }
        );
      }

      const result = await analyzeSentiment(text);
      return NextResponse.json({
        success: true,
        data: result,
        metadata: {
          textLength: text.length,
          analyzedAt: new Date().toISOString(),
          user: user.email,
        }
      });
    }

    // Batch analysis
    if (texts) {
      if (!Array.isArray(texts) || texts.length === 0) {
        return NextResponse.json(
          { error: 'Bad Request', message: 'texts phải là mảng không rỗng' },
          { status: 400 }
        );
      }

      if (texts.length > 100) {
        return NextResponse.json(
          { error: 'Bad Request', message: 'Tối đa 100 văn bản mỗi request' },
          { status: 400 }
        );
      }

      const results = await analyzeSentimentBatch(texts);
      return NextResponse.json({
        success: true,
        data: results,
        metadata: {
          count: texts.length,
          analyzedAt: new Date().toISOString(),
          user: user.email,
        }
      });
    }

  } catch (error: any) {
    console.error('Sentiment API error:', error);
    
    // Handle rate limit errors
    if (error.message?.includes('rate limit')) {
      return NextResponse.json(
        { 
          error: 'Rate Limit', 
          message: 'Đã vượt quá giới hạn sử dụng. Vui lòng thử lại sau.' 
        },
        { status: 429 }
      );
    }

    // Handle API key errors
    if (error.message?.includes('API key')) {
      return NextResponse.json(
        { 
          error: 'Configuration Error', 
          message: 'Lỗi cấu hình API. Liên hệ quản trị viên.' 
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Internal Server Error', 
        message: 'Lỗi phân tích sentiment',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/ai/sentiment
 * Lấy thông tin cấu hình và trạng thái
 * RBAC: AI.ANALYZE_SENTIMENT
 */
export async function GET(req: NextRequest) {
  try {
    // RBAC Check: AI.ANALYZE_SENTIMENT
    const authResult = await requireFunction(req, AI.ANALYZE_SENTIMENT);
    if (!authResult.allowed) {
      return authResult.response!;
    }

    const { checkAIServiceHealth, getAIConfig } = await import('@/lib/ai-service');
    
    const isHealthy = await checkAIServiceHealth();
    const config = getAIConfig();

    return NextResponse.json({
      success: true,
      health: isHealthy ? 'healthy' : 'unhealthy',
      config: {
        provider: config.provider,
        model: config.model,
        configured: config.configured,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to check service status', details: error.message },
      { status: 500 }
    );
  }
}
