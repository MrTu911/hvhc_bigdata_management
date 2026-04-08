'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus, Target } from 'lucide-react';

interface KPIMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  change: number;
  prediction: number;
  status: 'excellent' | 'good' | 'warning' | 'danger';
}

interface KPICardProps {
  metric: KPIMetric;
}

export default function KPICard({ metric }: KPICardProps) {
  const getTrendIcon = () => {
    switch (metric.trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4" />;
      case 'down':
        return <TrendingDown className="h-4 w-4" />;
      default:
        return <Minus className="h-4 w-4" />;
    }
  };

  const getTrendColor = () => {
    switch (metric.trend) {
      case 'up':
        return 'text-green-600 bg-green-50';
      case 'down':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusColor = () => {
    switch (metric.status) {
      case 'excellent':
        return 'bg-green-500';
      case 'good':
        return 'bg-blue-500';
      case 'warning':
        return 'bg-yellow-500';
      case 'danger':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusLabel = () => {
    switch (metric.status) {
      case 'excellent':
        return 'Xuất sắc';
      case 'good':
        return 'Tốt';
      case 'warning':
        return 'Cảnh báo';
      case 'danger':
        return 'Nguy hiểm';
      default:
        return metric.status;
    }
  };

  return (
    <Card className="relative overflow-hidden">
      {/* Status Indicator */}
      <div className={`absolute top-0 left-0 w-1 h-full ${getStatusColor()}`} />

      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {metric.name}
          </CardTitle>
          <Badge variant="secondary" className="text-xs">
            {getStatusLabel()}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Main Value */}
        <div className="flex items-baseline gap-2">
          <div className="text-3xl font-bold">
            {metric.value.toLocaleString('vi-VN')}
          </div>
          <div className="text-sm text-muted-foreground">{metric.unit}</div>
        </div>

        {/* Trend and Change */}
        <div className="flex items-center justify-between">
          <div className={`flex items-center gap-1 text-sm font-medium rounded-full px-2 py-1 ${getTrendColor()}`}>
            {getTrendIcon()}
            <span>
              {metric.change > 0 ? '+' : ''}{metric.change.toFixed(1)}%
            </span>
          </div>

          {/* Prediction */}
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Target className="h-3 w-3" />
            <span>{metric.prediction.toLocaleString('vi-VN')}</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Hiện tại</span>
            <span>Mục tiêu</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full ${getStatusColor()} transition-all duration-500`}
              style={{
                width: `${Math.min((metric.value / metric.prediction) * 100, 100)}%`,
              }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
