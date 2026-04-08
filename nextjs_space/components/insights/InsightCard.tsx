'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Brain, Loader2 } from 'lucide-react';

interface InsightCardProps {
  type: 'faculty' | 'student';
  id: string;
}

export default function InsightCard({ type, id }: InsightCardProps) {
  const [insight, setInsight] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  async function handleFetch() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/ai/insights/${type}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [`${type}Id`]: id }),
      });

      const data = await res.json();

      if (data.success) {
        setInsight(data.insight);
      } else {
        setError(data.error || 'Không thể tạo AI Insight');
      }
    } catch (err) {
      setError('Lỗi kết nối với AI service');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button
        onClick={handleFetch}
        disabled={loading || !!insight}
        size="sm"
        variant="outline"
        className="w-full"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Đang phân tích...
          </>
        ) : insight ? (
          <>
            <Brain className="h-4 w-4 mr-2" />
            Đã phân tích
          </>
        ) : (
          <>
            <Brain className="h-4 w-4 mr-2" />
            Phân tích AI
          </>
        )}
      </Button>

      {insight && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-4">
            <p className="text-sm text-slate-700 italic leading-relaxed">
              <Brain className="h-4 w-4 inline mr-2 text-blue-600" />
              {insight}
            </p>
          </CardContent>
        </Card>
      )}

      {error && (
        <div className="text-sm text-red-600 mt-2">⚠️ {error}</div>
      )}
    </div>
  );
}
