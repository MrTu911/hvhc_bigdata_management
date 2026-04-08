/**
 * API: Analyze feedback using NLP
 * POST /api/ai/nlp/analyze-feedback
 * RBAC: AI.ANALYZE_FEEDBACK
 */

import { NextRequest, NextResponse } from 'next/server';
import { analyzeFeedback, analyzeFeedbackBatch } from '@/lib/ai/nlp-engine';
import { db } from '@/lib/db';
import { requireFunction } from '@/lib/rbac/middleware';
import { AI } from '@/lib/rbac/function-codes';

export async function POST(request: NextRequest) {
  try {
    // RBAC Check: AI.ANALYZE_FEEDBACK
    const authResult = await requireFunction(request, AI.ANALYZE_FEEDBACK);
    if (!authResult.allowed) {
      return authResult.response!;
    }

    const body = await request.json();
    const { text, texts, feedback_id, course_id } = body;

    // Single text analysis
    if (text) {
      const result = await analyzeFeedback(text);

      // Optionally save to database if feedback_id provided
      if (feedback_id) {
        try {
          const keywordsJson = JSON.stringify(result.keywords);
          const entitiesJson = JSON.stringify(result.entities);
          
          await db.query(`
            INSERT INTO feedback_analysis (feedback_id, sentiment, confidence, keywords, entities, analyzed_at)
            VALUES ($1, $2, $3, $4::text[], $5::jsonb, NOW())
            ON CONFLICT (feedback_id) 
            DO UPDATE SET
              sentiment = EXCLUDED.sentiment,
              confidence = EXCLUDED.confidence,
              keywords = EXCLUDED.keywords,
              entities = EXCLUDED.entities,
              analyzed_at = NOW()
          `, [feedback_id, result.sentiment, result.confidence, keywordsJson, entitiesJson]);
        } catch (dbError) {
          console.error('Failed to save NLP result to database:', dbError);
          // Continue even if DB save fails
        }
      }

      return NextResponse.json({
        success: true,
        result
      });
    }

    // Batch analysis
    if (texts && Array.isArray(texts)) {
      const results = await analyzeFeedbackBatch(texts);

      return NextResponse.json({
        success: true,
        results,
        stats: {
          total: results.length,
          positive: results.filter(r => r.sentiment === 'positive').length,
          negative: results.filter(r => r.sentiment === 'negative').length,
          neutral: results.filter(r => r.sentiment === 'neutral').length,
          constructive: results.filter(r => r.sentiment === 'constructive').length
        }
      });
    }

    return NextResponse.json(
      { error: 'Missing text or texts parameter' },
      { status: 400 }
    );
  } catch (error) {
    console.error('NLP analysis error:', error);
    return NextResponse.json(
      { error: 'Analysis failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * GET: Get sentiment analysis for a course
 * RBAC: AI.ANALYZE_FEEDBACK
 */
export async function GET(request: NextRequest) {
  try {
    // RBAC Check: AI.ANALYZE_FEEDBACK
    const authResult = await requireFunction(request, AI.ANALYZE_FEEDBACK);
    if (!authResult.allowed) {
      return authResult.response!;
    }

    const searchParams = request.nextUrl.searchParams;
    const courseId = searchParams.get('course_id');

    if (!courseId) {
      return NextResponse.json({ error: 'Missing course_id' }, { status: 400 });
    }

    // Get feedback analysis for course
    const queryResult = await db.query(`
      SELECT 
        fa.sentiment,
        fa.confidence,
        fa.keywords,
        fa.entities,
        fa.analyzed_at,
        cf.feedback_text
      FROM feedback_analysis fa
      JOIN course_feedback cf ON cf.id = fa.feedback_id
      WHERE cf.course_id = $1
      ORDER BY fa.analyzed_at DESC
      LIMIT 100
    `, [parseInt(courseId)]);

    const results = queryResult.rows || [];

    // Calculate statistics
    const stats = {
      total: results.length,
      positive: results.filter((r: any) => r.sentiment === 'positive').length,
      negative: results.filter((r: any) => r.sentiment === 'negative').length,
      neutral: results.filter((r: any) => r.sentiment === 'neutral').length,
      constructive: results.filter((r: any) => r.sentiment === 'constructive').length,
      average_confidence: results.length > 0
        ? results.reduce((sum: number, r: any) => sum + parseFloat(r.confidence), 0) / results.length
        : 0
    };

    // Extract top keywords
    const keywordFreq: Record<string, number> = {};
    results.forEach((r: any) => {
      const keywords = Array.isArray(r.keywords) ? r.keywords : [];
      keywords.forEach((keyword: string) => {
        keywordFreq[keyword] = (keywordFreq[keyword] || 0) + 1;
      });
    });

    const topKeywords = Object.entries(keywordFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([keyword, count]) => ({ keyword, count }));

    return NextResponse.json({
      success: true,
      stats,
      topKeywords,
      recentAnalyses: results.slice(0, 10)
    });
  } catch (error) {
    console.error('Error fetching NLP results:', error);
    return NextResponse.json(
      { error: 'Failed to fetch results' },
      { status: 500 }
    );
  }
}
