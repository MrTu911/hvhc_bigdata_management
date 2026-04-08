
'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Database, Users, HardDrive, Activity } from 'lucide-react';
import { useLanguage } from '@/components/providers/language-provider';

interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: string;
  suffix: string;
  delay: number;
}

function CountUpAnimation({ end, suffix, delay }: { end: number; suffix: string; delay: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      let start = 0;
      const duration = 2000;
      const increment = end / (duration / 16);

      const counter = setInterval(() => {
        start += increment;
        if (start >= end) {
          setCount(end);
          clearInterval(counter);
        } else {
          setCount(Math.floor(start));
        }
      }, 16);

      return () => clearInterval(counter);
    }, delay);

    return () => clearTimeout(timer);
  }, [end, delay]);

  return (
    <span>
      {count}
      {suffix}
    </span>
  );
}

function StatCard({ icon, title, value, suffix, delay }: StatCardProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <Card
      className={`p-6 transition-all duration-500 hover:shadow-lg hover:-translate-y-1 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="flex items-start space-x-4">
        <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg text-white">
          {icon}
        </div>
        <div className="flex-1">
          <p className="text-sm text-slate-700 dark:text-slate-200 mb-1 font-medium">{title}</p>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">
            <CountUpAnimation end={parseInt(value)} suffix={suffix} delay={delay} />
          </p>
        </div>
      </div>
    </Card>
  );
}

export default function OverviewStats() {
  const { t } = useLanguage();

  const translations = {
    vi: {
      sectionTitle: 'Tổng quan hệ thống',
      users: 'Người dùng',
      datasets: 'Dataset / Files',
      storage: 'Dung lượng lưu trữ',
      queries: 'Truy vấn / Phân tích'
    },
    en: {
      sectionTitle: 'System Overview',
      users: 'Users',
      datasets: 'Dataset / Files',
      storage: 'Storage Capacity',
      queries: 'Queries / Analytics'
    }
  };

  const lang = t('code') as 'vi' | 'en';
  const tr = translations[lang] || translations.vi;

  const stats = [
    {
      icon: <Users className="h-6 w-6" />,
      title: tr.users,
      value: '50',
      suffix: '+'
    },
    {
      icon: <Database className="h-6 w-6" />,
      title: tr.datasets,
      value: '150',
      suffix: '+'
    },
    {
      icon: <HardDrive className="h-6 w-6" />,
      title: tr.storage,
      value: '5',
      suffix: ' TB'
    },
    {
      icon: <Activity className="h-6 w-6" />,
      title: tr.queries,
      value: '1000',
      suffix: '+'
    }
  ];

  return (
    <section className="py-16 bg-slate-50 dark:bg-slate-900">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
            {tr.sectionTitle}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <StatCard
              key={index}
              icon={stat.icon}
              title={stat.title}
              value={stat.value}
              suffix={stat.suffix}
              delay={index * 100}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
