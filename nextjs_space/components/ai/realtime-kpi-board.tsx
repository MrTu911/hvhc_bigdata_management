
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

interface KPIMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  change: number;
  prediction: number;
  status: 'excellent' | 'good' | 'warning' | 'critical';
}

interface RealtimeKPIBoardProps {
  className?: string;
}

export function RealtimeKPIBoard({ className }: RealtimeKPIBoardProps) {
  const [metrics, setMetrics] = useState<KPIMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    fetchRealtimeKPIs();
    const interval = setInterval(fetchRealtimeKPIs, 30000); // Update every 30s
    return () => clearInterval(interval);
  }, []);

  const fetchRealtimeKPIs = async () => {
    try {
      const response = await fetch('/api/dashboard/kpis/realtime');
      if (response.ok) {
        const data = await response.json();
        setMetrics(data.metrics || []);
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error('Error fetching realtime KPIs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <Minus className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'good':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <Card className={cn('card-hover', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary animate-pulse" />
            Real-time KPI Monitoring
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            Updated: {lastUpdate.toLocaleTimeString('vi-VN')}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {metrics.map((metric) => (
              <div
                key={metric.id}
                className={cn(
                  'p-4 rounded-lg border-2 transition-all hover:shadow-md',
                  getStatusColor(metric.status)
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">{metric.name}</span>
                  {getTrendIcon(metric.trend)}
                </div>
                <div className="text-2xl font-bold mb-1">
                  {metric.value.toLocaleString('vi-VN')}
                  <span className="text-sm ml-1">{metric.unit}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className={cn(
                    'font-medium',
                    metric.trend === 'up' ? 'text-green-600' : 
                    metric.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                  )}>
                    {metric.change > 0 ? '+' : ''}{metric.change}%
                  </span>
                  <span className="text-muted-foreground">
                    Predict: {metric.prediction.toLocaleString('vi-VN')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
