import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { analyzeSentimentBatch } from '@/lib/ai-service';
import { requireFunction } from '@/lib/rbac/middleware';
import { AI } from '@/lib/rbac/function-codes';

/**
 * API Sentiment Analysis Batch
 * Phân tích cảm xúc của nhiều văn bản cùng lúc
 * POST: Phân tích sentiment cho danh sách feedback
 * GET: Lấy kết quả sentiment đã phân tích
 * 
 * RBAC: AI.ANALYZE_SENTIMENT
 */

export async function GET(request: NextRequest) {
  try {
    // RBAC Check: AI.ANALYZE_SENTIMENT
    const authResult = await requireFunction(request, AI.ANALYZE_SENTIMENT);
    if (!authResult.allowed) {
      return authResult.response!;
    }

    const { searchParams } = new URL(request.url);
    const feedbackIds = searchParams.get('feedbackIds')?.split(',') || [];
    const sentiment = searchParams.get('sentiment'); // 'positive' | 'negative' | 'neutral'
    const limit = parseInt(searchParams.get('limit') || '50');

    const where: any = {};
    if (feedbackIds.length > 0) {
      where.feedbackId = { in: feedbackIds };
    }
    if (sentiment) {
      where.sentiment = sentiment;
    }

    const sentimentAnalyses = await prisma.sentimentAnalysis.findMany({
      where,
      orderBy: {
        analyzedAt: 'desc',
      },
      take: limit,
    });

    // Tính thống kê
    const total = sentimentAnalyses.length;
    const positive = sentimentAnalyses.filter((s) => s.sentiment === 'positive').length;
    const negative = sentimentAnalyses.filter((s) => s.sentiment === 'negative').length;
    const neutral = sentimentAnalyses.filter((s) => s.sentiment === 'neutral').length;

    return NextResponse.json({
      success: true,
      results: sentimentAnalyses,
      summary: {
        total,
        positive,
        negative,
        neutral,
        positiveRate: total > 0 ? ((positive / total) * 100).toFixed(2) : '0',
        negativeRate: total > 0 ? ((negative / total) * 100).toFixed(2) : '0',
        neutralRate: total > 0 ? ((neutral / total) * 100).toFixed(2) : '0',
      },
    });
  } catch (error: any) {
    console.error('GET sentiment analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sentiment analyses', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // RBAC Check: AI.ANALYZE_SENTIMENT
    const authResult = await requireFunction(request, AI.ANALYZE_SENTIMENT);
    if (!authResult.allowed) {
      return authResult.response!;
    }
    const user = authResult.user!;

    const body = await request.json();
    const { feedbacks } = body;

    if (!feedbacks || !Array.isArray(feedbacks)) {
      return NextResponse.json({ error: 'Invalid feedbacks array' }, { status: 400 });
    }

    // Giới hạn số lượng feedback mỗi lần
    if (feedbacks.length > 100) {
      return NextResponse.json(
        { error: 'Maximum 100 feedbacks per batch' },
        { status: 400 }
      );
    }

    // Trích xuất văn bản từ feedbacks
    const texts = feedbacks.map((f: any) => f.text || '');

    // Gọi AI service để phân tích
    const sentimentResults = await analyzeSentimentBatch(texts);

    // Lưu kết quả vào database
    const savedResults = await Promise.all(
      feedbacks.map(async (feedback: any, index: number) => {
        const sentiment = sentimentResults[index];

        return prisma.sentimentAnalysis.create({
          data: {
            feedbackId: feedback.id || null,
            text: feedback.text,
            sentiment: sentiment.sentiment,
            confidence: sentiment.confidence,
            keywords: sentiment.keywords || [],
            summary: sentiment.summary || null,
          },
        });
      })
    );

    // Tính thống kê
    const total = savedResults.length;
    const positive = savedResults.filter((s) => s.sentiment === 'positive').length;
    const negative = savedResults.filter((s) => s.sentiment === 'negative').length;
    const neutral = savedResults.filter((s) => s.sentiment === 'neutral').length;

    return NextResponse.json({
      success: true,
      results: savedResults.map((result, index) => ({
        feedbackId: result.feedbackId,
        sentiment: result.sentiment,
        confidence: result.confidence,
        keywords: result.keywords,
        summary: result.summary,
      })),
      summary: {
        total,
        positive,
        negative,
        neutral,
        positiveRate: ((positive / total) * 100).toFixed(2) + '%',
        negativeRate: ((negative / total) * 100).toFixed(2) + '%',
        neutralRate: ((neutral / total) * 100).toFixed(2) + '%',
      },
    });
  } catch (error: any) {
    console.error('POST sentiment analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze sentiments', details: error.message },
      { status: 500 }
    );
  }
}
