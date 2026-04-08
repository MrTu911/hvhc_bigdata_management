
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from 'recharts';

interface WorkloadData {
  name: string;
  hours: number;
  classes: number;
}

interface WorkloadChartProps {
  data: WorkloadData[];
}

export function WorkloadChart({ data }: WorkloadChartProps) {
  const STANDARD_HOURS = 180;

  const chartData = data.map(item => ({
    name: item.name.split(' ').slice(-2).join(' '), // Lấy 2 từ cuối của tên
    'Số tiết': item.hours,
    'Định mức': STANDARD_HOURS,
    'Số lớp': item.classes
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Phân bổ Khối lượng Giảng dạy</CardTitle>
        <CardDescription>
          So sánh khối lượng giảng dạy của giảng viên với định mức chuẩn (180 tiết/năm)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={chartData}>
            <XAxis 
              dataKey="name" 
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${value}`}
            />
            <Tooltip />
            <Legend />
            <Bar 
              dataKey="Số tiết" 
              fill="#3b82f6" 
              radius={[4, 4, 0, 0]}
            />
            <Bar 
              dataKey="Định mức" 
              fill="#94a3b8" 
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
