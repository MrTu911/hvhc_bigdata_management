'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, TrendingUp, AlertCircle } from 'lucide-react';

interface Suggestion {
  priority: 'high' | 'medium' | 'low';
  category: string;
  suggestion: string;
  impact: string;
}

interface AISuggestionsProps {
  suggestions: Suggestion[];
}

export default function AISuggestions({ suggestions }: AISuggestionsProps) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'low':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'Cao';
      case 'medium':
        return 'Trung bình';
      case 'low':
        return 'Thấp';
      default:
        return priority;
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return <AlertCircle className="h-4 w-4" />;
      case 'medium':
        return <TrendingUp className="h-4 w-4" />;
      case 'low':
        return <Lightbulb className="h-4 w-4" />;
      default:
        return <Lightbulb className="h-4 w-4" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-yellow-500" />
          Gợi ý cải thiện từ AI
        </CardTitle>
        <CardDescription>
          Các đề xuất dựa trên phân tích phản hồi học viên
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              className="p-4 border rounded-lg hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded ${getPriorityColor(suggestion.priority)} text-white`}>
                    {getPriorityIcon(suggestion.priority)}
                  </div>
                  <div>
                    <Badge variant="secondary">{suggestion.category}</Badge>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className={`${getPriorityColor(suggestion.priority)} text-white border-0`}
                >
                  {getPriorityLabel(suggestion.priority)}
                </Badge>
              </div>
              <p className="text-sm font-medium mb-2">{suggestion.suggestion}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3" />
                <span>{suggestion.impact}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
