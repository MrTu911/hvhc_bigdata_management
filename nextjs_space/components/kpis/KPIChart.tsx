'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

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

interface KPIChartProps {
  metrics: KPIMetric[];
}

export default function KPIChart({ metrics }: KPIChartProps) {
  // Simulate historical data for demonstration
  // In real application, this would come from API
  const data = Array.from({ length: 7 }, (_, i) => {
    const day = new Date();
    day.setDate(day.getDate() - (6 - i));
    
    const entry: any = {
      date: day.toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' }),
    };

    // Add top 5 metrics to chart
    metrics.slice(0, 5).forEach((metric) => {
      // Simulate historical values with some variance
      const variance = (Math.random() - 0.5) * 0.2; // ±10% variance
      entry[metric.name] = Math.max(0, metric.value * (1 + variance * (6 - i) / 6));
    });

    return entry;
  });

  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <ResponsiveContainer width="100%" height={350}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis
          dataKey="date"
          stroke="hsl(var(--foreground))"
          fontSize={12}
          tickLine={false}
        />
        <YAxis
          stroke="hsl(var(--foreground))"
          fontSize={12}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--background))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '6px',
          }}
        />
        <Legend />
        {metrics.slice(0, 5).map((metric, index) => (
          <Line
            key={metric.id}
            type="monotone"
            dataKey={metric.name}
            stroke={colors[index]}
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
