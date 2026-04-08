'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, User, Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface Feedback {
  id: string;
  student: string;
  class: string;
  date: string;
  text: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  confidence: number;
  keywords: string[];
}

interface RecentFeedbackListProps {
  feedback: Feedback[];
}

export default function RecentFeedbackList({ feedback }: RecentFeedbackListProps) {
  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'negative':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'neutral':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSentimentLabel = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return 'Tích cực';
      case 'negative':
        return 'Tiêu cực';
      case 'neutral':
        return 'Trung tính';
      default:
        return sentiment;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Phản hồi gần đây
        </CardTitle>
        <CardDescription>
          Các phản hồi mới nhất đã được phân tích
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {feedback.map((item) => (
            <div
              key={item.id}
              className="p-4 border rounded-lg hover:bg-accent/50 transition-colors"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span className="font-medium">{item.student}</span>
                  <span>•</span>
                  <span>{item.class}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={getSentimentColor(item.sentiment)}
                  >
                    {getSentimentLabel(item.sentiment)}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {(item.confidence * 100).toFixed(0)}%
                  </span>
                </div>
              </div>

              {/* Content */}
              <p className="text-sm mb-3 line-clamp-2">{item.text}</p>

              {/* Footer */}
              <div className="flex items-center justify-between">
                {/* Keywords */}
                <div className="flex flex-wrap gap-1">
                  {item.keywords.slice(0, 4).map((keyword, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {keyword}
                    </Badge>
                  ))}
                </div>

                {/* Date */}
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>{format(new Date(item.date), 'dd/MM/yyyy')}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
