
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface TrainingData {
  byDepartment: Array<{
    name: string;
    students: number;
    instructors: number;
    courses: number;
    completionRate: number;
  }>;
}

interface Props {
  data: TrainingData;
}

export function TrainingOverviewChart({ data }: Props) {
  const chartData = data.byDepartment.map(dept => ({
    name: dept.name,
    'Học viên': dept.students,
    'Giảng viên': dept.instructors,
    'Khóa học': dept.courses
  }));

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Tổng quan đào tạo theo khoa</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="name" 
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={100}
            />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="Học viên" fill="#3b82f6" radius={[8, 8, 0, 0]} />
            <Bar dataKey="Giảng viên" fill="#10b981" radius={[8, 8, 0, 0]} />
            <Bar dataKey="Khóa học" fill="#f59e0b" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
