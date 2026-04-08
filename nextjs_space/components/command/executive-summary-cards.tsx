
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Users, 
  Building2, 
  GraduationCap, 
  Activity,
  TrendingUp,
  TrendingDown
} from 'lucide-react';

interface ExecutiveSummaryData {
  overview: {
    totalStaff: number;
    totalStudents: number;
    totalDepartments: number;
    totalServices: number;
  };
  training: {
    totalCourses: number;
    totalStudents: number;
    completionRate: number;
    averageGrade: number;
  };
  research: {
    totalProjects: number;
    activeProjects: number;
    completedProjects: number;
    publications: number;
  };
  system: {
    totalServices: number;
    healthyServices: number;
    uptime: number;
    cpuUsage: number;
    memoryUsage: number;
    totalModels: number;
    totalDatasets: number;
  };
}

interface Props {
  data: ExecutiveSummaryData;
}

export function ExecutiveSummaryCards({ data }: Props) {
  const cards = [
    {
      title: 'Cán bộ & Giảng viên',
      value: data.overview.totalStaff,
      subtitle: `${data.overview.totalDepartments} khoa/phòng`,
      icon: Users,
      gradient: 'from-blue-500 to-blue-600',
      trend: { value: 5.2, isPositive: true }
    },
    {
      title: 'Học viên & Sinh viên',
      value: data.overview.totalStudents,
      subtitle: `${data.training.totalCourses} khóa học`,
      icon: GraduationCap,
      gradient: 'from-emerald-500 to-emerald-600',
      trend: { value: 8.5, isPositive: true }
    },
    {
      title: 'Đề tài nghiên cứu',
      value: data.research.totalProjects,
      subtitle: `${data.research.activeProjects} đang thực hiện`,
      icon: Building2,
      gradient: 'from-purple-500 to-purple-600',
      trend: { value: 12.3, isPositive: true }
    },
    {
      title: 'Hệ thống BigData',
      value: `${data.system.uptime}%`,
      subtitle: `${data.system.totalServices} dịch vụ hoạt động`,
      icon: Activity,
      gradient: 'from-orange-500 to-red-500',
      trend: { value: 0.8, isPositive: false }
    }
  ];

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, index) => (
        <Card 
          key={index}
          className="relative overflow-hidden border-none shadow-lg hover:shadow-xl transition-all duration-300"
        >
          <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-10`}></div>
          <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.title}
            </CardTitle>
            <div className={`p-2 rounded-lg bg-gradient-to-br ${card.gradient} bg-opacity-20`}>
              <card.icon className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold mb-1">{card.value}</div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">{card.subtitle}</p>
              {card.trend && (
                <div className={`flex items-center text-xs font-medium ${
                  card.trend.isPositive ? 'text-green-600' : 'text-red-600'
                }`}>
                  {card.trend.isPositive ? (
                    <TrendingUp className="h-3 w-3 mr-1" />
                  ) : (
                    <TrendingDown className="h-3 w-3 mr-1" />
                  )}
                  {card.trend.value}%
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
