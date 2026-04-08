'use client';

import { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function StudentPerformanceChart() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/student/performance-analysis')
      .then((res) => res.json())
      .then((res) => {
        if (res.performance) {
          // Lấy top 15 học viên có GPA cao nhất
          const topStudents = res.performance
            .sort((a: any, b: any) => b.avgGPA - a.avgGPA)
            .slice(0, 15);
          setData(topStudents);
        }
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error loading performance data:', error);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Xu hướng học tập</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top 15 Học viên – GPA Trung bình</CardTitle>
        <CardDescription>
          Phân tích xu hướng học tập và hiệu suất của học viên
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="hoTen"
              tick={{ fontSize: 10 }}
              angle={-45}
              textAnchor="end"
              height={100}
            />
            <YAxis domain={[0, 10]} />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="avgGPA"
              name="GPA Trung bình"
              stroke="#10b981"
              strokeWidth={2}
              dot={{ fill: '#10b981', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
