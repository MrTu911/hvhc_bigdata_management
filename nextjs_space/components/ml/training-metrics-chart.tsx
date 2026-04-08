
'use client';

/**
 * ML Training Metrics Chart
 * Visualizes training metrics (loss, accuracy, etc.) over epochs
 */

import { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, TrendingDown, TrendingUp } from 'lucide-react';

interface TrainingMetricsChartProps {
  runId: string;
  refreshInterval?: number; // Auto-refresh interval in ms
}

interface MetricData {
  epoch: number;
  step: number;
  value: number;
  timestamp: string;
}

interface ChartData {
  [metricName: string]: MetricData[];
}

export function TrainingMetricsChart({ runId, refreshInterval = 5000 }: TrainingMetricsChartProps) {
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<ChartData>({});
  const [selectedMetric, setSelectedMetric] = useState<string>('loss');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMetrics();

    // Auto-refresh if interval is set
    if (refreshInterval > 0) {
      const intervalId = setInterval(fetchMetrics, refreshInterval);
      return () => clearInterval(intervalId);
    }
  }, [runId, refreshInterval]);

  const fetchMetrics = async () => {
    try {
      const response = await fetch(`/api/ml/metrics?runId=${runId}`);
      const result = await response.json();

      if (result.success) {
        setChartData(result.chartData || {});
        
        // Set default metric if not set
        if (!selectedMetric && Object.keys(result.chartData).length > 0) {
          setSelectedMetric(Object.keys(result.chartData)[0]);
        }
      } else {
        setError(result.error || 'Failed to fetch metrics');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getMetricColor = (metricName: string): string => {
    const colorMap: { [key: string]: string } = {
      loss: '#ef4444',
      val_loss: '#f97316',
      accuracy: '#10b981',
      val_accuracy: '#06b6d4',
      precision: '#8b5cf6',
      recall: '#ec4899',
      f1_score: '#6366f1',
    };

    return colorMap[metricName.toLowerCase()] || '#6b7280';
  };

  const getMetricTrend = (data: MetricData[]): 'up' | 'down' | 'stable' => {
    if (data.length < 2) return 'stable';
    
    const first = data[0].value;
    const last = data[data.length - 1].value;
    const diff = ((last - first) / first) * 100;

    if (Math.abs(diff) < 1) return 'stable';
    return diff > 0 ? 'up' : 'down';
  };

  const formatMetricValue = (value: number): string => {
    return value.toFixed(6);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-[400px]">
          <p className="text-destructive">{error}</p>
        </CardContent>
      </Card>
    );
  }

  const metricNames = Object.keys(chartData);

  if (metricNames.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-[400px]">
          <p className="text-muted-foreground">No training metrics available yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Training Metrics</CardTitle>
        <CardDescription>
          Real-time visualization of training progress
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={selectedMetric} onValueChange={setSelectedMetric}>
          <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${metricNames.length}, 1fr)` }}>
            {metricNames.map((metric) => {
              const data = chartData[metric];
              const trend = getMetricTrend(data);
              const latestValue = data[data.length - 1]?.value;

              return (
                <TabsTrigger key={metric} value={metric} className="flex items-center gap-2">
                  {metric}
                  {trend === 'up' && <TrendingUp className="h-3 w-3 text-green-500" />}
                  {trend === 'down' && <TrendingDown className="h-3 w-3 text-red-500" />}
                  {latestValue !== undefined && (
                    <span className="text-xs text-muted-foreground ml-1">
                      {formatMetricValue(latestValue)}
                    </span>
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {metricNames.map((metric) => (
            <TabsContent key={metric} value={metric} className="mt-4">
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={chartData[metric]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="epoch"
                    label={{ value: 'Epoch', position: 'insideBottom', offset: -5 }}
                  />
                  <YAxis
                    label={{ value: metric, angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip
                    formatter={(value: any) => formatMetricValue((value as number) || 0)}
                    labelFormatter={(label) => `Epoch ${label}`}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke={getMetricColor(metric)}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                    name={metric}
                  />
                </LineChart>
              </ResponsiveContainer>

              <div className="mt-4 grid grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Latest Value</p>
                  <p className="font-semibold">
                    {formatMetricValue(chartData[metric][chartData[metric].length - 1]?.value || 0)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Best Value</p>
                  <p className="font-semibold">
                    {formatMetricValue(
                      Math.min(...chartData[metric].map((d) => d.value))
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Avg Value</p>
                  <p className="font-semibold">
                    {formatMetricValue(
                      chartData[metric].reduce((sum, d) => sum + d.value, 0) /
                        chartData[metric].length
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Total Epochs</p>
                  <p className="font-semibold">{chartData[metric].length}</p>
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}
