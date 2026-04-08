
/**
 * NLP Sentiment Analysis Panel for Instructor Dashboard
 * Displays student feedback sentiment analysis with AI insights
 */

'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  MessageSquare, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Lightbulb,
  RefreshCw,
  Download
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const SENTIMENT_COLORS = {
  positive: '#10b981',
  neutral: '#f59e0b',
  negative: '#ef4444'
};

interface SentimentData {
  summary: {
    total: number;
    distribution: {
      positive: number;
      neutral: number;
      negative: number;
    };
    positiveRate: string;
    lastUpdated: string;
  };
  recentFeedback: Array<{
    id: string;
    student: string;
    class: string;
    date: string;
    text: string;
    sentiment: 'positive' | 'neutral' | 'negative';
    confidence: number;
    keywords: string[];
  }>;
  sentimentTrend: Array<{
    month: string;
    positive: number;
    neutral: number;
    negative: number;
  }>;
  topKeywords: {
    positive: Array<{ word: string; count: number }>;
    negative: Array<{ word: string; count: number }>;
    neutral: Array<{ word: string; count: number }>;
  };
  aiSuggestions: Array<{
    priority: 'high' | 'medium' | 'low';
    category: string;
    suggestion: string;
    impact: string;
  }>;
}

export function NLPSentimentPanel() {
  const [data, setData] = useState<SentimentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchSentimentData();
  }, []);

  const fetchSentimentData = async () => {
    try {
      setRefreshing(true);
      const response = await fetch('/api/nlp/feedback-sentiment');
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Error fetching sentiment data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Card>
    );
  }

  if (!data) return null;

  const pieData = [
    { name: 'Tích cực', value: data.summary.distribution.positive },
    { name: 'Trung lập', value: data.summary.distribution.neutral },
    { name: 'Tiêu cực', value: data.summary.distribution.negative }
  ];

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return <TrendingUp className="w-4 h-4" />;
      case 'negative':
        return <TrendingDown className="w-4 h-4" />;
      default:
        return <Minus className="w-4 h-4" />;
    }
  };

  const getSentimentColor = (sentiment: string) => {
    return SENTIMENT_COLORS[sentiment as keyof typeof SENTIMENT_COLORS];
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MessageSquare className="w-6 h-6 text-primary" />
          <div>
            <h2 className="text-2xl font-bold">Phân tích phản hồi học viên (AI)</h2>
            <p className="text-sm text-muted-foreground">
              Cập nhật lần cuối: {new Date(data.summary.lastUpdated).toLocaleString('vi-VN')}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchSentimentData}
            disabled={refreshing}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Làm mới
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="w-4 h-4" />
            Xuất báo cáo
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground mb-2">Tổng phản hồi</p>
          <h3 className="text-3xl font-bold">{data.summary.total}</h3>
        </Card>
        <Card className="p-4 bg-green-50 dark:bg-green-950">
          <p className="text-sm text-muted-foreground mb-2">Tích cực</p>
          <h3 className="text-3xl font-bold text-green-600 dark:text-green-400">
            {data.summary.distribution.positive}
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            {((data.summary.distribution.positive / data.summary.total) * 100).toFixed(1)}%
          </p>
        </Card>
        <Card className="p-4 bg-orange-50 dark:bg-orange-950">
          <p className="text-sm text-muted-foreground mb-2">Trung lập</p>
          <h3 className="text-3xl font-bold text-orange-600 dark:text-orange-400">
            {data.summary.distribution.neutral}
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            {((data.summary.distribution.neutral / data.summary.total) * 100).toFixed(1)}%
          </p>
        </Card>
        <Card className="p-4 bg-red-50 dark:bg-red-950">
          <p className="text-sm text-muted-foreground mb-2">Tiêu cực</p>
          <h3 className="text-3xl font-bold text-red-600 dark:text-red-400">
            {data.summary.distribution.negative}
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            {((data.summary.distribution.negative / data.summary.total) * 100).toFixed(1)}%
          </p>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sentiment Distribution Pie Chart */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Phân bố cảm xúc</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }: any) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={Object.values(SENTIMENT_COLORS)[index]} 
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Sentiment Trend Line Chart */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Xu hướng theo thời gian</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.sentimentTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="positive" 
                name="Tích cực"
                stroke={SENTIMENT_COLORS.positive} 
                strokeWidth={2}
              />
              <Line 
                type="monotone" 
                dataKey="neutral" 
                name="Trung lập"
                stroke={SENTIMENT_COLORS.neutral} 
                strokeWidth={2}
              />
              <Line 
                type="monotone" 
                dataKey="negative" 
                name="Tiêu cực"
                stroke={SENTIMENT_COLORS.negative} 
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Top Keywords */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Từ khóa phổ biến</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Positive Keywords */}
          <div>
            <h4 className="text-sm font-medium text-green-600 dark:text-green-400 mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Tích cực
            </h4>
            <div className="space-y-2">
              {data.topKeywords.positive.map((keyword, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <span className="text-sm">{keyword.word}</span>
                  <Badge variant="outline">{keyword.count}</Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Neutral Keywords */}
          <div>
            <h4 className="text-sm font-medium text-orange-600 dark:text-orange-400 mb-3 flex items-center gap-2">
              <Minus className="w-4 h-4" />
              Trung lập
            </h4>
            <div className="space-y-2">
              {data.topKeywords.neutral.map((keyword, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <span className="text-sm">{keyword.word}</span>
                  <Badge variant="outline">{keyword.count}</Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Negative Keywords */}
          <div>
            <h4 className="text-sm font-medium text-red-600 dark:text-red-400 mb-3 flex items-center gap-2">
              <TrendingDown className="w-4 h-4" />
              Tiêu cực
            </h4>
            <div className="space-y-2">
              {data.topKeywords.negative.map((keyword, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <span className="text-sm">{keyword.word}</span>
                  <Badge variant="outline">{keyword.count}</Badge>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* AI Suggestions */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-yellow-500" />
          Gợi ý cải thiện từ AI
        </h3>
        <div className="space-y-3">
          {data.aiSuggestions.map((suggestion, idx) => (
            <div key={idx} className="border rounded-lg p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Badge variant={getPriorityColor(suggestion.priority)}>
                    {suggestion.priority === 'high' ? 'Cao' : 
                     suggestion.priority === 'medium' ? 'Trung bình' : 'Thấp'}
                  </Badge>
                  <span className="font-medium">{suggestion.category}</span>
                </div>
              </div>
              <p className="text-sm mb-2">{suggestion.suggestion}</p>
              <p className="text-xs text-muted-foreground italic">
                💡 Tác động dự kiến: {suggestion.impact}
              </p>
            </div>
          ))}
        </div>
      </Card>

      {/* Recent Feedback */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Phản hồi gần đây</h3>
        <div className="space-y-3">
          {data.recentFeedback.map((feedback) => (
            <div key={feedback.id} className="border rounded-lg p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{feedback.student}</span>
                  <Badge variant="outline">{feedback.class}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Badge 
                    style={{ 
                      backgroundColor: `${getSentimentColor(feedback.sentiment)}20`,
                      color: getSentimentColor(feedback.sentiment)
                    }}
                    className="gap-1"
                  >
                    {getSentimentIcon(feedback.sentiment)}
                    {feedback.sentiment === 'positive' ? 'Tích cực' :
                     feedback.sentiment === 'negative' ? 'Tiêu cực' : 'Trung lập'}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {(feedback.confidence * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
              <p className="text-sm mb-2">{feedback.text}</p>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Từ khóa:</span>
                {feedback.keywords.map((keyword, idx) => (
                  <Badge key={idx} variant="secondary" className="text-xs">
                    {keyword}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
