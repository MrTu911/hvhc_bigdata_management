'use client';

import { useEffect, useState, useRef } from 'react';
import { useLanguage } from '@/components/providers/language-provider';
import { 
  Users, Database, Code2, Shield, FileText, Brain, 
  TrendingUp, Server, CheckCircle2 
} from 'lucide-react';

interface StatItem {
  icon: React.ElementType;
  value: number;
  suffix: string;
  label: string;
  color: string;
}

function AnimatedCounter({ target, suffix }: { target: number; suffix: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;
    
    const duration = 2000;
    const steps = 60;
    const increment = target / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [target, isVisible]);

  return (
    <span ref={ref}>
      {count.toLocaleString()}{suffix}
    </span>
  );
}

export default function StatsSection() {
  const { t } = useLanguage();
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetch('/api/public/stats')
      .then(res => res.json())
      .then(data => setStats(data?.data))
      .catch(console.error);
  }, []);

  const translations = {
    vi: {
      badge: 'Thống kê hệ thống',
      title: 'CON SỐ ẤN TƯỢNG',
      subtitle: 'Dữ liệu thực từ hệ thống, cập nhật realtime',
      stats: [
        { icon: Users, value: stats?.totalPersonnel || 287, suffix: '+', label: 'Cán bộ, Giảng viên', color: 'from-blue-500 to-indigo-600' },
        { icon: Database, value: 8, suffix: '', label: 'Cơ sở dữ liệu', color: 'from-emerald-500 to-teal-600' },
        { icon: Code2, value: 296, suffix: '+', label: 'API Endpoints', color: 'from-purple-500 to-violet-600' },
        { icon: Shield, value: 88, suffix: '+', label: 'Function Codes RBAC', color: 'from-red-500 to-rose-600' },
        { icon: FileText, value: 140, suffix: '+', label: 'Trang chức năng', color: 'from-amber-500 to-orange-600' },
        { icon: Brain, value: 4, suffix: '', label: 'AI Engines', color: 'from-pink-500 to-rose-600' },
        { icon: Server, value: stats?.totalUnits || 50, suffix: '+', label: 'Đơn vị trực thuộc', color: 'from-cyan-500 to-blue-600' },
        { icon: CheckCircle2, value: 99, suffix: '%', label: 'System Uptime', color: 'from-green-500 to-emerald-600' },
      ],
    },
    en: {
      badge: 'System Statistics',
      title: 'IMPRESSIVE NUMBERS',
      subtitle: 'Real data from the system, updated in realtime',
      stats: [
        { icon: Users, value: stats?.totalPersonnel || 287, suffix: '+', label: 'Officers, Faculty', color: 'from-blue-500 to-indigo-600' },
        { icon: Database, value: 8, suffix: '', label: 'Databases', color: 'from-emerald-500 to-teal-600' },
        { icon: Code2, value: 296, suffix: '+', label: 'API Endpoints', color: 'from-purple-500 to-violet-600' },
        { icon: Shield, value: 88, suffix: '+', label: 'RBAC Function Codes', color: 'from-red-500 to-rose-600' },
        { icon: FileText, value: 140, suffix: '+', label: 'Feature Pages', color: 'from-amber-500 to-orange-600' },
        { icon: Brain, value: 4, suffix: '', label: 'AI Engines', color: 'from-pink-500 to-rose-600' },
        { icon: Server, value: stats?.totalUnits || 50, suffix: '+', label: 'Subordinate Units', color: 'from-cyan-500 to-blue-600' },
        { icon: CheckCircle2, value: 99, suffix: '%', label: 'System Uptime', color: 'from-green-500 to-emerald-600' },
      ],
    }
  };

  const lang = t('code') as 'vi' | 'en';
  const tr = translations[lang] || translations.vi;

  return (
    <section className="py-20 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }} />
      </div>

      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm text-white rounded-full px-4 py-2 mb-4">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-medium">{tr.badge}</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            {tr.title}
          </h2>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto">
            {tr.subtitle}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {tr.stats.map((stat, index) => (
            <div 
              key={index}
              className="group relative bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all duration-300 hover:bg-white/10"
            >
              {/* Icon */}
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              
              {/* Value */}
              <div className="text-3xl md:text-4xl font-bold text-white mb-2">
                <AnimatedCounter target={stat.value} suffix={stat.suffix} />
              </div>
              
              {/* Label */}
              <p className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors">
                {stat.label}
              </p>

              {/* Hover glow effect */}
              <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
