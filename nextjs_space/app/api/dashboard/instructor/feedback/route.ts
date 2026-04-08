import { NextRequest, NextResponse } from 'next/server';
import { requireFunction } from '@/lib/rbac/middleware';
import { DASHBOARD } from '@/lib/rbac/function-codes';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Check authorization using Function-based RBAC
    const authResult = await requireFunction(request, DASHBOARD.VIEW_FACULTY);
    if (!authResult.allowed) {
      return authResult.response!;
    }

    // Mock feedback data with NLP sentiment analysis
    const feedbacks = [
      {
        id: 'fb-1',
        studentName: 'Nguyễn Văn An',
        classSession: 'Advanced Data Structures - Session 5',
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        comment: 'The lecture was very clear and well-structured. However, I would appreciate more practical examples.',
        sentiment: {
          score: 0.75,
          label: 'positive',
          breakdown: {
            positive: 0.75,
            neutral: 0.20,
            negative: 0.05
          }
        },
        topics: ['clarity', 'structure', 'examples'],
        actionable: true,
        suggestion: 'Add 2-3 practical examples in next session'
      },
      {
        id: 'fb-2',
        studentName: 'Trần Thị Bình',
        classSession: 'Machine Learning Basics - Session 8',
        date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        comment: 'The pace is too fast. I struggle to keep up with the concepts.',
        sentiment: {
          score: -0.45,
          label: 'negative',
          breakdown: {
            positive: 0.10,
            neutral: 0.25,
            negative: 0.65
          }
        },
        topics: ['pace', 'difficulty', 'concepts'],
        actionable: true,
        suggestion: 'Consider slower pace or additional review sessions'
      },
      {
        id: 'fb-3',
        studentName: 'Lê Văn Cường',
        classSession: 'Database Design - Session 3',
        date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        comment: 'Excellent explanation of normalization. The real-world examples really helped.',
        sentiment: {
          score: 0.90,
          label: 'positive',
          breakdown: {
            positive: 0.90,
            neutral: 0.08,
            negative: 0.02
          }
        },
        topics: ['explanation', 'examples', 'normalization'],
        actionable: false,
        suggestion: 'Continue using real-world examples'
      },
      {
        id: 'fb-4',
        studentName: 'Phạm Thị Dung',
        classSession: 'Algorithm Analysis - Session 12',
        date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        comment: 'The material is interesting but I need more time for exercises.',
        sentiment: {
          score: 0.15,
          label: 'neutral',
          breakdown: {
            positive: 0.40,
            neutral: 0.45,
            negative: 0.15
          }
        },
        topics: ['material', 'time', 'exercises'],
        actionable: true,
        suggestion: 'Extend practice time by 15 minutes'
      },
      {
        id: 'fb-5',
        studentName: 'Hoàng Văn Em',
        classSession: 'Software Engineering - Session 6',
        date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        comment: 'Group project guidelines are confusing. Need clearer requirements.',
        sentiment: {
          score: -0.30,
          label: 'negative',
          breakdown: {
            positive: 0.15,
            neutral: 0.30,
            negative: 0.55
          }
        },
        topics: ['guidelines', 'requirements', 'clarity'],
        actionable: true,
        suggestion: 'Revise project documentation with explicit rubric'
      }
    ];

    // Calculate overall sentiment statistics
    const sentimentStats = {
      avgScore: feedbacks.reduce((sum, fb) => sum + fb.sentiment.score, 0) / feedbacks.length,
      distribution: {
        positive: feedbacks.filter(fb => fb.sentiment.label === 'positive').length,
        neutral: feedbacks.filter(fb => fb.sentiment.label === 'neutral').length,
        negative: feedbacks.filter(fb => fb.sentiment.label === 'negative').length
      },
      actionableCount: feedbacks.filter(fb => fb.actionable).length,
      totalCount: feedbacks.length
    };

    // Topic frequency analysis
    const topicFrequency: Record<string, number> = {};
    feedbacks.forEach(fb => {
      fb.topics.forEach(topic => {
        topicFrequency[topic] = (topicFrequency[topic] || 0) + 1;
      });
    });

    const topTopics = Object.entries(topicFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([topic, count]) => ({ topic, count }));

    return NextResponse.json({
      feedbacks,
      stats: sentimentStats,
      topTopics,
      aiInsight: {
        summary: sentimentStats.avgScore > 0.3 
          ? 'Overall positive feedback with room for improvement'
          : sentimentStats.avgScore > 0
          ? 'Mixed feedback - address negative comments priority'
          : 'Concerning feedback trend - immediate action recommended',
        recommendations: [
          'Focus on pace adjustments based on student feedback',
          'Increase practical examples in lectures',
          'Clarify project requirements and guidelines'
        ]
      }
    });
  } catch (error) {
    console.error('Error fetching feedback:', error);
    return NextResponse.json(
      { error: 'Failed to fetch feedback' },
      { status: 500 }
    );
  }
}
