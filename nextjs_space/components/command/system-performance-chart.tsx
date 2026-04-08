
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface SystemPerformanceData {
  performance: {
    timeline: Array<{
      time: string;
      queries: number;
      cpu: number;
      memory: number;
      responseTime: number;
    }>;
  };
}

interface Props {
  data: SystemPerformanceData;
}

export function SystemPerformanceChart({ data }: Props) {
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Hiệu suất hệ thống (24h qua)</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={data.performance.timeline}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="time" 
              tick={{ fontSize: 11 }}
              angle={-45}
              textAnchor="end"
              height={70}
            />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip />
            <Legend />
            <Line 
              yAxisId="left"
              type="monotone" 
              dataKey="cpu" 
              stroke="#3b82f6" 
              strokeWidth={2}
              name="CPU (%)"
            />
            <Line 
              yAxisId="left"
              type="monotone" 
              dataKey="memory" 
              stroke="#10b981" 
              strokeWidth={2}
              name="Memory (%)"
            />
            <Line 
              yAxisId="right"
              type="monotone" 
              dataKey="queries" 
              stroke="#f59e0b" 
              strokeWidth={2}
              name="Queries"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
