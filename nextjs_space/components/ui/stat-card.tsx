/**
 * Stat Card Component
 * Thẻ thống kê với icon và trend
 */

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card, CardContent } from './card';

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: ReactNode;
  trend?: {
    value: number;
    label?: string;
  };
  description?: string;
  className?: string;
  iconClassName?: string;
}

export function StatCard({
  title,
  value,
  icon,
  trend,
  description,
  className,
  iconClassName
}: StatCardProps) {
  const getTrendIcon = () => {
    if (!trend) return null;
    if (trend.value > 0) return <TrendingUp className="h-3 w-3" />;
    if (trend.value < 0) return <TrendingDown className="h-3 w-3" />;
    return <Minus className="h-3 w-3" />;
  };

  const getTrendColor = () => {
    if (!trend) return '';
    if (trend.value > 0) return 'text-green-600';
    if (trend.value < 0) return 'text-red-600';
    return 'text-gray-500';
  };

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold">{value}</p>
            {(trend || description) && (
              <div className="flex items-center gap-2">
                {trend && (
                  <span className={cn('flex items-center gap-1 text-xs font-medium', getTrendColor())}>
                    {getTrendIcon()}
                    {Math.abs(trend.value)}%
                    {trend.label && <span className="text-muted-foreground ml-1">{trend.label}</span>}
                  </span>
                )}
                {description && (
                  <span className="text-xs text-muted-foreground">{description}</span>
                )}
              </div>
            )}
          </div>
          {icon && (
            <div className={cn('p-3 rounded-lg bg-primary/10', iconClassName)}>
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default StatCard;
