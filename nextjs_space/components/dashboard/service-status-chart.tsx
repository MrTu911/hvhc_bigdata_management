
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { useLanguage } from '@/components/providers/language-provider';

interface ServiceStatusChartProps {
  data: {
    healthy: number;
    degraded: number;
    down: number;
  };
}

export function ServiceStatusChart({ data }: ServiceStatusChartProps) {
  const { t } = useLanguage();

  const chartData = [
    { name: t('dashboard.healthy'), value: data.healthy ?? 0, color: '#22c55e' },
    { name: t('dashboard.degraded'), value: data.degraded ?? 0, color: '#eab308' },
    { name: t('dashboard.down'), value: data.down ?? 0, color: '#ef4444' },
  ].filter(item => item.value > 0);

  return (
    <Card className="card-hover">
      <CardHeader>
        <CardTitle>{t('dashboard.serviceStatus')}</CardTitle>
        <CardDescription>
          {t('dashboard.services')} - {data.healthy + data.degraded + data.down} total
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={(entry: any) => `${entry.name}: ${(entry.percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
            <Legend 
              verticalAlign="top" 
              wrapperStyle={{ fontSize: 11 }}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
