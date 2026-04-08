'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

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

interface KPIComparisonProps {
  metrics: KPIMetric[];
}

export default function KPIComparison({ metrics }: KPIComparisonProps) {
  // Prepare data for comparison
  const data = metrics.slice(0, 6).map((metric) => ({
    name: metric.name.length > 20 ? metric.name.substring(0, 20) + '...' : metric.name,
    'Thực tế': metric.value,
    'Dự đoán': metric.prediction,
  }));

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis
          dataKey="name"
          stroke="hsl(var(--foreground))"
          fontSize={12}
          tickLine={false}
          angle={-45}
          textAnchor="end"
          height={100}
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
        <Bar dataKey="Thực tế" fill="#3b82f6" radius={[4, 4, 0, 0]} />
        <Bar dataKey="Dự đoán" fill="#10b981" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
