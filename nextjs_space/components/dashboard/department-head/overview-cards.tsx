'use client';

import { Card, CardContent } from '@/components/ui/card';
import { BookOpen, Users, GraduationCap, FlaskConical, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OverviewCardsProps {
  overview: {
    coursesCount: number;
    instructorsCount: number;
    classesCount: number;
    projectsCount: number;
  };
}

export function OverviewCards({ overview }: OverviewCardsProps) {
  const cards = [
    {
      title: 'Môn học',
      value: overview.coursesCount,
      icon: BookOpen,
      description: 'Tổng số môn học',
      gradient: 'from-blue-500 to-blue-600',
      bgLight: 'bg-blue-50',
      textColor: 'text-blue-600'
    },
    {
      title: 'Giảng viên',
      value: overview.instructorsCount,
      icon: Users,
      description: 'Số giảng viên bộ môn',
      gradient: 'from-emerald-500 to-emerald-600',
      bgLight: 'bg-emerald-50',
      textColor: 'text-emerald-600'
    },
    {
      title: 'Lớp đang dạy',
      value: overview.classesCount,
      icon: GraduationCap,
      description: 'Lớp học hoạt động',
      gradient: 'from-amber-500 to-amber-600',
      bgLight: 'bg-amber-50',
      textColor: 'text-amber-600'
    },
    {
      title: 'Dự án nghiên cứu',
      value: overview.projectsCount,
      icon: FlaskConical,
      description: 'Dự án đang thực hiện',
      gradient: 'from-purple-500 to-purple-600',
      bgLight: 'bg-purple-50',
      textColor: 'text-purple-600'
    }
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <Card key={index} className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            {/* Gradient Background Accent */}
            <div className={cn(
              "absolute top-0 left-0 w-full h-1 bg-gradient-to-r",
              card.gradient
            )} />
            
            <CardContent className="pt-6 pb-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    {card.title}
                  </p>
                  <p className={cn("text-3xl font-bold", card.textColor)}>
                    {card.value.toLocaleString('vi-VN')}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {card.description}
                  </p>
                </div>
                <div className={cn(
                  "h-12 w-12 rounded-xl flex items-center justify-center",
                  card.bgLight
                )}>
                  <Icon className={cn("h-6 w-6", card.textColor)} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
