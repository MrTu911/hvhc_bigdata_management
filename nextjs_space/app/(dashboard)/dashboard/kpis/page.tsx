'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useLanguage } from '@/components/providers/language-provider';
import {
  TrendingUp,
  TrendingDown,
  Users,
  GraduationCap,
  BookOpen,
  Award,
  Target,
  Activity,
  CheckCircle,
  AlertTriangle,
  BarChart3,
  Server,
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, LineChart, Line, XAxis, YAxis } from 'recharts';

interface KPIMetric {
  id: string;
  name: string;
  value: number;
  target: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  trendValue: number;
  status: 'good' | 'warning' | 'danger';
  category: string;
  icon: React.ReactNode;
}

interface PieEntry {
  name: string;
  value: number;
  color: string;
}

export default function KPIsPage() {
  const { t } = useLanguage();
  const lang = t('code') as 'vi' | 'en';
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<KPIMetric[]>([]);
  const [pieData, setPieData] = useState<PieEntry[]>([]);

  useEffect(() => {
    setLoading(true);
    fetch('/api/dashboard/kpis/realtime')
      .then(r => r.json())
      .then(data => {
        if (!data.kpis) return;
        const {
          totalPersonnel,
          activeRate,
          avgGpa,
          researchTotal,
          rewardRate,
          uptimePct,
        } = data.kpis;

        setMetrics([
          {
            id: '1',
            name: lang === 'vi' ? 'Tổng cán bộ' : 'Total Personnel',
            value: totalPersonnel,
            target: Math.ceil(totalPersonnel * 1.15), // target = 115% of current
            unit: lang === 'vi' ? 'người' : 'people',
            trend: 'up',
            trendValue: 5.2,
            status: 'good',
            category: 'personnel',
            icon: <Users className="w-5 h-5" />,
          },
          {
            id: '2',
            name: lang === 'vi' ? 'Tỷ lệ cán bộ hoạt động' : 'Active Personnel Rate',
            value: Number(activeRate),
            target: 100,
            unit: '%',
            trend: activeRate >= 90 ? 'up' : 'down',
            trendValue: 2.1,
            status: activeRate >= 90 ? 'good' : activeRate >= 75 ? 'warning' : 'danger',
            category: 'quality',
            icon: <CheckCircle className="w-5 h-5" />,
          },
          {
            id: '3',
            name: lang === 'vi' ? 'Điểm TB học viên' : 'Student Avg GPA',
            value: avgGpa,
            target: 8.0,
            unit: '/10',
            trend: avgGpa >= 7.5 ? 'up' : 'stable',
            trendValue: 0.3,
            status: avgGpa >= 7.5 ? 'good' : avgGpa >= 6 ? 'warning' : 'danger',
            category: 'academic',
            icon: <GraduationCap className="w-5 h-5" />,
          },
          {
            id: '4',
            name: lang === 'vi' ? 'Công trình NCKH' : 'Research Works',
            value: researchTotal,
            target: Math.max(researchTotal, 50),
            unit: lang === 'vi' ? 'công trình' : 'works',
            trend: researchTotal > 0 ? 'up' : 'stable',
            trendValue: 0,
            status: 'good',
            category: 'research',
            icon: <BookOpen className="w-5 h-5" />,
          },
          {
            id: '5',
            name: lang === 'vi' ? 'Tỷ lệ khen thưởng' : 'Award Approval Rate',
            value: Number(rewardRate),
            target: 85,
            unit: '%',
            trend: rewardRate >= 75 ? 'up' : 'down',
            trendValue: 3.5,
            status: rewardRate >= 75 ? 'good' : rewardRate >= 50 ? 'warning' : 'danger',
            category: 'awards',
            icon: <Award className="w-5 h-5" />,
          },
          {
            id: '6',
            name: lang === 'vi' ? 'Uptime hệ thống' : 'System Uptime',
            value: Number(uptimePct),
            target: 99.9,
            unit: '%',
            trend: uptimePct >= 99 ? 'stable' : 'down',
            trendValue: 0.02,
            status: uptimePct >= 99 ? 'good' : uptimePct >= 95 ? 'warning' : 'danger',
            category: 'system',
            icon: <Server className="w-5 h-5" />,
          },
        ]);

        if (data.pieData) {
          const mapped = data.pieData.map((p: PieEntry) => ({
            ...p,
            name: lang === 'en'
              ? p.name === 'Xuất sắc' ? 'Excellent'
                : p.name === 'Giỏi' ? 'Good'
                : p.name === 'Khá' ? 'Average'
                : 'Pass'
              : p.name,
          }));
          setPieData(mapped);
        }
      })
      .catch(() => {
        // Fallback: empty metrics on error
      })
      .finally(() => setLoading(false));
  }, [lang]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good':    return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'warning': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
      case 'danger':  return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      default:        return 'bg-slate-100 text-slate-700';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':   return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'down': return <TrendingDown className="w-4 h-4 text-red-500" />;
      default:     return <Activity className="w-4 h-4 text-slate-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-violet-500 p-6 text-white shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-white/20 rounded-xl">
            <Target className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">
              {lang === 'vi' ? 'Chỉ số KPI' : 'KPI Metrics'}
            </h1>
            <p className="text-indigo-100 text-sm mt-0.5">
              {lang === 'vi' ? 'Theo dõi các chỉ số hiệu suất chính' : 'Monitor key performance indicators'}
            </p>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {metrics.map((metric) => (
          <Card key={metric.id} className="hover:shadow-lg transition-shadow bg-white shadow-md">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <span className="text-indigo-500">{metric.icon}</span>
                  {metric.name}
                </CardTitle>
                <Badge className={getStatusColor(metric.status)}>
                  {metric.status === 'good' ? (
                    <CheckCircle className="w-3 h-3 mr-1" />
                  ) : (
                    <AlertTriangle className="w-3 h-3 mr-1" />
                  )}
                  {metric.status === 'good'
                    ? (lang === 'vi' ? 'Đạt' : 'Good')
                    : metric.status === 'warning'
                      ? (lang === 'vi' ? 'Cần cải thiện' : 'Needs Improvement')
                      : (lang === 'vi' ? 'Nguy hiểm' : 'Critical')
                  }
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between mb-3">
                <div className="text-3xl font-bold text-slate-900 dark:text-white">
                  {metric.value.toLocaleString()}
                  <span className="text-lg font-normal text-muted-foreground ml-1">
                    {metric.unit}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-sm">
                  {getTrendIcon(metric.trend)}
                  <span className={metric.trend === 'up' ? 'text-green-600' : metric.trend === 'down' ? 'text-red-600' : 'text-slate-600'}>
                    {metric.trendValue > 0 ? '+' : ''}{metric.trendValue}%
                  </span>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{lang === 'vi' ? 'Tiến độ' : 'Progress'}</span>
                  <span>{Math.min(100, Math.round((metric.value / metric.target) * 100))}%</span>
                </div>
                <Progress value={Math.min(100, (metric.value / metric.target) * 100)} className="h-2" />
                <div className="text-xs text-muted-foreground">
                  {lang === 'vi' ? 'Mục tiêu' : 'Target'}: {metric.target.toLocaleString()} {metric.unit}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Grade Distribution Pie Chart */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="w-5 h-5 text-indigo-500" />
              {lang === 'vi' ? 'Phân bố học lực học viên' : 'Student Performance Distribution'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pieData.some(p => p.value > 0) ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}%`}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
                {lang === 'vi' ? 'Chưa có dữ liệu học lực' : 'No grade data available'}
              </div>
            )}
          </CardContent>
        </Card>

        {/* KPI Summary */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="w-5 h-5 text-indigo-500" />
              {lang === 'vi' ? 'Tổng quan chỉ số' : 'KPI Overview'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {metrics.map(metric => (
                <div key={metric.id} className="flex items-center gap-3">
                  <span className="text-indigo-500 flex-shrink-0">{metric.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-slate-700 truncate">{metric.name}</span>
                      <span className="text-sm font-bold text-slate-900 ml-2 flex-shrink-0">
                        {metric.value.toLocaleString()}{metric.unit}
                      </span>
                    </div>
                    <Progress
                      value={Math.min(100, (metric.value / metric.target) * 100)}
                      className="h-1.5"
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
