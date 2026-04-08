
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Brain, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

interface AIInsight {
  id: string;
  type: 'success' | 'warning' | 'info' | 'danger';
  title: string;
  message: string;
  confidence: number;
  timestamp: Date;
}

interface AISummaryBoardProps {
  role: string;
  className?: string;
}

export function AISummaryBoard({ role, className }: AISummaryBoardProps) {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAIInsights();
  }, [role]);

  const fetchAIInsights = async () => {
    try {
      const response = await fetch(`/api/ai/insights?role=${role}`);
      if (response.ok) {
        const data = await response.json();
        setInsights(data.insights || []);
      }
    } catch (error) {
      console.error('Error fetching AI insights:', error);
    } finally {
      setLoading(false);
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'danger':
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      default:
        return <TrendingUp className="h-5 w-5 text-blue-600" />;
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'danger':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  return (
    <Card className={cn('card-hover', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          AI Insights Dashboard
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : insights.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No AI insights available at the moment
          </div>
        ) : (
          <div className="space-y-3">
            {insights.slice(0, 5).map((insight) => (
              <div
                key={insight.id}
                className={cn(
                  'p-4 rounded-lg border-2 transition-all hover:shadow-md',
                  getInsightColor(insight.type)
                )}
              >
                <div className="flex items-start gap-3">
                  {getInsightIcon(insight.type)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-semibold text-sm">{insight.title}</h4>
                      <Badge variant="outline" className="text-xs">
                        {Math.round(insight.confidence * 100)}% confident
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {insight.message}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
