'use client';

import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function FacultyEISChart() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/faculty/eis')
      .then((res) => res.json())
      .then((res) => {
        if (res.facultyEIS) {
          // Lấy top 10 giảng viên có EIS cao nhất
          const topFaculty = res.facultyEIS
            .sort((a: any, b: any) => b.EIS_Score - a.EIS_Score)
            .slice(0, 10);
          setData(topFaculty);
        }
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error loading EIS data:', error);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top Giảng viên – EIS Score</CardTitle>
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
        <CardTitle>Top 10 Giảng viên – EIS Score</CardTitle>
        <CardDescription>
          Đánh giá năng lực giảng viên dựa trên nghiên cứu, giảng dạy và kinh nghiệm
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11 }}
              angle={-45}
              textAnchor="end"
              height={100}
            />
            <YAxis domain={[0, 100]} />
            <Tooltip />
            <Legend />
            <Bar dataKey="EIS_Score" name="Điểm EIS" fill="#3b82f6" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
