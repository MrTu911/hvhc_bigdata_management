
/**
 * Sentiment Analysis Chart Component
 * Displays sentiment distribution and trends
 */

'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { TrendingUp, TrendingDown, MessageCircle, ThumbsUp, ThumbsDown, Lightbulb, Minus } from 'lucide-react';

interface SentimentData {
  sentiment: 'positive' | 'negative' | 'neutral' | 'constructive';
  count: number;
  percentage?: number;
}

interface SentimentChartProps {
  data: SentimentData[];
  total?: number;
  title?: string;
  showTrend?: boolean;
}

const SENTIMENT_COLORS = {
  positive: '#10b981', // green
  negative: '#ef4444', // red
  neutral: '#6b7280', // gray
  constructive: '#3b82f6' // blue
};

const SENTIMENT_ICONS = {
  positive: ThumbsUp,
  negative: ThumbsDown,
  neutral: Minus,
  constructive: Lightbulb
};

const SENTIMENT_LABELS = {
  positive: 'Tích cực',
  negative: 'Tiêu cực',
  neutral: 'Trung tính',
  constructive: 'Góp ý xây dựng'
};

export function SentimentPieChart({ data, total, title = 'Phân bố cảm xúc' }: SentimentChartProps) {
  const chartData = data.map(item => ({
    name: SENTIMENT_LABELS[item.sentiment],
    value: item.count,
    percentage: total ? ((item.count / total) * 100).toFixed(1) : item.percentage?.toFixed(1) || '0'
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          {title}
        </CardTitle>
        <CardDescription>
          Tổng số phản hồi: {total || data.reduce((sum, item) => sum + item.count, 0)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={(entry: any) => `${entry.name}: ${entry.percent ? (entry.percent * 100).toFixed(0) : 0}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={SENTIMENT_COLORS[entry.sentiment]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: any, name: any, props: any) => [
                `${(value as number) || 0} phản hồi (${props.payload.percentage}%)`,
                name || ''
              ]}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function SentimentBarChart({ data, title = 'Thống kê cảm xúc' }: SentimentChartProps) {
  const chartData = data.map(item => ({
    sentiment: SENTIMENT_LABELS[item.sentiment],
    count: item.count,
    fill: SENTIMENT_COLORS[item.sentiment]
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="sentiment" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#8884d8" label={{ position: 'top' }}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function SentimentSummaryCards({ data, total }: { data: SentimentData[]; total?: number }) {
  const totalCount = total || data.reduce((sum, item) => sum + item.count, 0);
  
  const positiveCount = data.find(d => d.sentiment === 'positive')?.count || 0;
  const negativeCount = data.find(d => d.sentiment === 'negative')?.count || 0;
  const constructiveCount = data.find(d => d.sentiment === 'constructive')?.count || 0;
  const neutralCount = data.find(d => d.sentiment === 'neutral')?.count || 0;

  const sentimentScore = totalCount > 0 
    ? ((positiveCount + constructiveCount * 0.7 - negativeCount * 0.5) / totalCount) * 100
    : 0;

  const cards = [
    {
      sentiment: 'positive' as const,
      count: positiveCount,
      label: 'Tích cực',
      description: 'Phản hồi tốt'
    },
    {
      sentiment: 'constructive' as const,
      count: constructiveCount,
      label: 'Góp ý',
      description: 'Xây dựng'
    },
    {
      sentiment: 'neutral' as const,
      count: neutralCount,
      label: 'Trung tính',
      description: 'Bình thường'
    },
    {
      sentiment: 'negative' as const,
      count: negativeCount,
      label: 'Tiêu cực',
      description: 'Cần cải thiện'
    }
  ];

  return (
    <div className="space-y-4">
      {/* Overall Sentiment Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Điểm cảm xúc tổng thể</span>
            {sentimentScore >= 50 ? (
              <TrendingUp className="h-5 w-5 text-green-600" />
            ) : (
              <TrendingDown className="h-5 w-5 text-red-600" />
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold" style={{ 
            color: sentimentScore >= 70 ? SENTIMENT_COLORS.positive : 
                   sentimentScore >= 40 ? SENTIMENT_COLORS.constructive : 
                   SENTIMENT_COLORS.negative 
          }}>
            {sentimentScore.toFixed(0)}/100
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            {sentimentScore >= 70 ? '🎉 Phản hồi rất tích cực!' :
             sentimentScore >= 40 ? '👍 Phản hồi khá tốt' :
             '⚠️ Cần cải thiện'}
          </p>
        </CardContent>
      </Card>

      {/* Individual Sentiment Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {cards.map(({ sentiment, count, label, description }) => {
          const Icon = SENTIMENT_ICONS[sentiment];
          const percentage = totalCount > 0 ? (count / totalCount) * 100 : 0;

          return (
            <Card key={sentiment}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{label}</CardTitle>
                <Icon className="h-4 w-4" style={{ color: SENTIMENT_COLORS[sentiment] }} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{count}</div>
                <p className="text-xs text-muted-foreground">
                  {percentage.toFixed(1)}% • {description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
