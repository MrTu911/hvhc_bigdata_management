
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useLanguage } from '@/components/providers/language-provider';

interface ResourceUsageChartProps {
  data: {
    cpuUsage: number;
    memoryUsage: number;
    diskUsage: number;
  };
}

export function ResourceUsageChart({ data }: ResourceUsageChartProps) {
  const { t, language } = useLanguage();

  const chartData = [
    {
      name: 'CPU',
      usage: data.cpuUsage ?? 0,
    },
    {
      name: language === 'vi' ? 'Bộ nhớ' : 'Memory',
      usage: data.memoryUsage ?? 0,
    },
    {
      name: language === 'vi' ? 'Ổ đĩa' : 'Disk',
      usage: data.diskUsage ?? 0,
    },
  ];

  return (
    <Card className="card-hover">
      <CardHeader>
        <CardTitle>{t('dashboard.resourceUsage')}</CardTitle>
        <CardDescription>
          {language === 'vi' ? 'Tình trạng sử dụng tài nguyên hệ thống' : 'Current system resource utilization'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <XAxis 
              dataKey="name" 
              tickLine={false}
              tick={{ fontSize: 10 }}
            />
            <YAxis 
              tickLine={false}
              tick={{ fontSize: 10 }}
              label={{ 
                value: '%', 
                angle: -90, 
                position: 'insideLeft',
                style: { textAnchor: 'middle', fontSize: 11 }
              }}
            />
            <Tooltip
              contentStyle={{ fontSize: 11 }}
              formatter={(value) => [`${value}%`, language === 'vi' ? 'Sử dụng' : 'Usage']}
            />
            <Bar dataKey="usage" fill="#60B5FF" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
