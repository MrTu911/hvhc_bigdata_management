
'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsCard3DProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  gradient?: string;
  iconBg?: string;
  className?: string;
}

export function StatsCard3D({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  gradient = 'from-blue-500 to-blue-600',
  iconBg = 'bg-blue-500/20',
  className,
}: StatsCard3DProps) {
  return (
    <Card 
      className={cn(
        'relative overflow-hidden transition-all duration-300',
        'hover:shadow-2xl hover:-translate-y-2 hover:scale-105',
        'border-0 bg-gradient-to-br',
        gradient,
        'group cursor-pointer',
        className
      )}
    >
      {/* Animated background glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      {/* Decorative circles */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
      <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/5 rounded-full blur-2xl" />
      
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
        <div className="flex items-center gap-3">
          <div className={cn(
            'h-12 w-12 rounded-xl flex items-center justify-center',
            'backdrop-blur-sm border border-white/20 shadow-lg',
            iconBg
          )}>
            <Icon className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="text-xs font-medium text-white/80 uppercase tracking-wider">
              {title}
            </p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="relative z-10">
        <div className="text-4xl font-bold text-white mb-2 drop-shadow-lg">
          {value}
        </div>
        {subtitle && (
          <p className="text-sm text-white/70 font-medium">{subtitle}</p>
        )}
        {trend && (
          <div className="flex items-center mt-3 pt-3 border-t border-white/20">
            <div className={cn(
              'flex items-center gap-1 text-sm font-semibold px-2 py-1 rounded-md',
              trend.isPositive 
                ? 'bg-green-500/20 text-green-100' 
                : 'bg-red-500/20 text-red-100'
            )}>
              <span>{trend.isPositive ? '↑' : '↓'}</span>
              <span>{Math.abs(trend.value)}%</span>
            </div>
            <span className="text-xs text-white/60 ml-2">
              vs tháng trước
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
