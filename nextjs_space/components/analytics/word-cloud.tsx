
/**
 * Word Cloud Component
 * Displays frequently mentioned keywords
 */

'use client';

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface WordCloudProps {
  keywords: Array<{ keyword: string; count: number }>;
  maxWords?: number;
  title?: string;
}

export function WordCloud({ keywords, maxWords = 30, title = 'Từ khóa phổ biến' }: WordCloudProps) {
  const processedWords = useMemo(() => {
    if (!keywords || keywords.length === 0) return [];

    // Sort by count and take top N
    const sortedWords = [...keywords]
      .sort((a, b) => b.count - a.count)
      .slice(0, maxWords);

    if (sortedWords.length === 0) return [];

    // Calculate font sizes
    const maxCount = sortedWords[0].count;
    const minCount = sortedWords[sortedWords.length - 1].count;
    const countRange = maxCount - minCount || 1;

    return sortedWords.map((word, index) => {
      // Font size: 12px to 36px
      const fontSize = 12 + ((word.count - minCount) / countRange) * 24;
      
      // Color intensity based on frequency
      const intensity = ((word.count - minCount) / countRange);
      const hue = 200 + intensity * 60; // Blue to purple
      const color = `hsl(${hue}, 70%, 50%)`;

      return {
        ...word,
        fontSize: Math.round(fontSize),
        color,
        weight: Math.round(400 + intensity * 300) // Font weight 400-700
      };
    });
  }, [keywords, maxWords]);

  if (processedWords.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Chưa có dữ liệu từ khóa</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-3 items-center justify-center min-h-[200px] p-4">
          {processedWords.map((word, index) => (
            <span
              key={`${word.keyword}-${index}`}
              className="cursor-pointer transition-transform hover:scale-110"
              style={{
                fontSize: `${word.fontSize}px`,
                color: word.color,
                fontWeight: word.weight,
                lineHeight: 1.2
              }}
              title={`${word.keyword}: ${word.count} lần`}
            >
              {word.keyword}
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function KeywordTable({ keywords, title = 'Top Keywords' }: Omit<WordCloudProps, 'maxWords'>) {
  if (!keywords || keywords.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Chưa có dữ liệu</p>
        </CardContent>
      </Card>
    );
  }

  const sortedKeywords = [...keywords].sort((a, b) => b.count - a.count).slice(0, 10);
  const maxCount = sortedKeywords[0]?.count || 1;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {sortedKeywords.map((keyword, index) => {
            const percentage = (keyword.count / maxCount) * 100;
            
            return (
              <div key={`${keyword.keyword}-${index}`} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{keyword.keyword}</span>
                  <span className="text-muted-foreground">{keyword.count}</span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
