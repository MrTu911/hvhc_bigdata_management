
'use client';

import { Card } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';

export function InstructorPerformanceView() {
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <TrendingUp className="w-6 h-6 text-primary" />
          <h2 className="text-2xl font-bold">Hiệu suất giảng dạy</h2>
        </div>
        <p className="text-muted-foreground">
          Module hiệu suất chi tiết đang được phát triển...
        </p>
      </Card>
    </div>
  );
}
