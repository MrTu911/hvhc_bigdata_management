
/**
 * NLP Feedback Sentiment Analysis API
 * Analyzes student feedback and returns sentiment distribution
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { cached, CACHE_TTL } from '@/lib/cache';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const classId = searchParams.get('classId');
    const courseId = searchParams.get('courseId');
    const instructorId = session.user.id;

    // Generate cache key
    const cacheKey = `nlp:sentiment:${instructorId}:${classId || 'all'}:${courseId || 'all'}`;

    // Use cached wrapper
    const sentimentData = await cached(cacheKey, CACHE_TTL.AI_PREDICTIONS, async () => {
      // In production, this would call ML Engine NLP service
      // For now, generate realistic demo data
      
      const totalFeedback = 156;
      const sentimentDistribution = {
        positive: 89, // 57%
        neutral: 45,  // 29%
        negative: 22  // 14%
      };

      // Sample feedback with sentiment
      const recentFeedback = [
        {
          id: '1',
          student: 'Học viên Nguyễn Văn A',
          class: 'K67',
          date: new Date().toISOString(),
          text: 'Giảng viên giảng dạy rất tốt, dễ hiểu và nhiệt tình',
          sentiment: 'positive',
          confidence: 0.92,
          keywords: ['tốt', 'dễ hiểu', 'nhiệt tình']
        },
        {
          id: '2',
          student: 'Học viên Trần Văn B',
          class: 'K67',
          date: new Date(Date.now() - 86400000).toISOString(),
          text: 'Bài giảng hay nhưng tốc độ hơi nhanh',
          sentiment: 'neutral',
          confidence: 0.78,
          keywords: ['hay', 'nhanh']
        },
        {
          id: '3',
          student: 'Học viên Lê Thị C',
          class: 'K66',
          date: new Date(Date.now() - 172800000).toISOString(),
          text: 'Cần thêm ví dụ thực tế và bài tập thực hành',
          sentiment: 'neutral',
          confidence: 0.85,
          keywords: ['ví dụ', 'thực tế', 'thực hành']
        },
        {
          id: '4',
          student: 'Học viên Phạm Văn D',
          class: 'K67',
          date: new Date(Date.now() - 259200000).toISOString(),
          text: 'Tài liệu học tập chưa đầy đủ, khó theo dõi',
          sentiment: 'negative',
          confidence: 0.88,
          keywords: ['chưa đầy đủ', 'khó']
        },
        {
          id: '5',
          student: 'Học viên Hoàng Văn E',
          class: 'K66',
          date: new Date(Date.now() - 345600000).toISOString(),
          text: 'Rất hài lòng với phương pháp giảng dạy của thầy',
          sentiment: 'positive',
          confidence: 0.95,
          keywords: ['hài lòng', 'phương pháp']
        },
        {
          id: '6',
          student: 'Học viên Vũ Thị F',
          class: 'K67',
          date: new Date(Date.now() - 432000000).toISOString(),
          text: 'Giáo trình cần cập nhật thêm kiến thức mới',
          sentiment: 'neutral',
          confidence: 0.81,
          keywords: ['cập nhật', 'kiến thức mới']
        }
      ];

      // Sentiment trend over time (last 6 months)
      const sentimentTrend = [
        { month: 'T4/2025', positive: 55, neutral: 30, negative: 15 },
        { month: 'T5/2025', positive: 58, neutral: 28, negative: 14 },
        { month: 'T6/2025', positive: 60, neutral: 27, negative: 13 },
        { month: 'T7/2025', positive: 62, neutral: 25, negative: 13 },
        { month: 'T8/2025', positive: 59, neutral: 28, negative: 13 },
        { month: 'T9/2025', positive: 57, neutral: 29, negative: 14 }
      ];

      // Top keywords by sentiment
      const topKeywords = {
        positive: [
          { word: 'tốt', count: 45 },
          { word: 'hay', count: 38 },
          { word: 'dễ hiểu', count: 32 },
          { word: 'nhiệt tình', count: 28 },
          { word: 'hài lòng', count: 25 }
        ],
        negative: [
          { word: 'khó', count: 12 },
          { word: 'chưa đầy đủ', count: 8 },
          { word: 'nhanh', count: 7 },
          { word: 'thiếu', count: 6 },
          { word: 'phức tạp', count: 5 }
        ],
        neutral: [
          { word: 'cần', count: 18 },
          { word: 'thêm', count: 15 },
          { word: 'cập nhật', count: 12 },
          { word: 'thực hành', count: 10 },
          { word: 'ví dụ', count: 9 }
        ]
      };

      // Improvement suggestions from AI
      const aiSuggestions = [
        {
          priority: 'high',
          category: 'Tài liệu',
          suggestion: 'Bổ sung thêm ví dụ thực tế và cập nhật tài liệu giảng dạy',
          impact: 'Có thể cải thiện đánh giá tích cực lên 15%'
        },
        {
          priority: 'medium',
          category: 'Phương pháp',
          suggestion: 'Điều chỉnh tốc độ giảng dạy, tăng thời gian thực hành',
          impact: 'Giảm phản hồi tiêu cực xuống 8%'
        },
        {
          priority: 'low',
          category: 'Tương tác',
          suggestion: 'Tăng cường Q&A và thảo luận nhóm',
          impact: 'Cải thiện mức độ hài lòng chung'
        }
      ];

      return {
        summary: {
          total: totalFeedback,
          distribution: sentimentDistribution,
          positiveRate: ((sentimentDistribution.positive / totalFeedback) * 100).toFixed(1),
          lastUpdated: new Date().toISOString()
        },
        recentFeedback,
        sentimentTrend,
        topKeywords,
        aiSuggestions
      };
    });

    return NextResponse.json(sentimentData);
  } catch (error) {
    console.error('Error in NLP sentiment analysis:', error);
    return NextResponse.json(
      { error: 'Failed to analyze sentiment' },
      { status: 500 }
    );
  }
}
