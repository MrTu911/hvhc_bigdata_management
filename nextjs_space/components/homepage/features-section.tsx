'use client';

import { Card } from '@/components/ui/card';
import { useLanguage } from '@/components/providers/language-provider';
import { 
  Upload, Search, BarChart3, Shield, Zap, Lock, 
  RefreshCw, Globe, Smartphone, CheckCircle
} from 'lucide-react';
import { useEffect, useState } from 'react';

export default function FeaturesSection() {
  const { t } = useLanguage();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const translations = {
    vi: {
      sectionBadge: 'Tính năng',
      sectionTitle: 'NỀN TẢNG BIGDATA HIỆN ĐẠI',
      sectionSubtitle: 'Được xây dựng theo kiến trúc 6 lớp chuẩn BigData',
      features: [
        {
          icon: Upload,
          title: 'Thu thập dữ liệu',
          description: 'Import dữ liệu từ Excel, CSV, JSON với kiểm tra tự động, loại bỏ trùng lặp, chuẩn hóa format.',
          highlight: 'Data Ingestion Layer',
          color: 'from-emerald-500 to-teal-600'
        },
        {
          icon: Search,
          title: 'Truy vấn thông minh',
          description: 'Tìm kiếm nâng cao với bộ lọc đa chiều, phân trang, sắp xếp theo nhiều tiêu chí.',
          highlight: 'Query Engine',
          color: 'from-blue-500 to-indigo-600'
        },
        {
          icon: BarChart3,
          title: 'Phân tích & Báo cáo',
          description: 'Dashboard trực quan với biểu đồ đa dạng, xuất báo cáo Excel, PDF tự động.',
          highlight: 'Analytics Layer',
          color: 'from-purple-500 to-violet-600'
        },
        {
          icon: Shield,
          title: 'Bảo mật đa lớp',
          description: 'RBAC với 10 vai trò, mã hóa mật khẩu, audit log, kiểm soát truy cập theo đơn vị.',
          highlight: 'Security Layer',
          color: 'from-red-500 to-rose-600'
        },
        {
          icon: Zap,
          title: 'Xử lý thời gian thực',
          description: '199 API endpoints RESTful, cập nhật dữ liệu tức thì qua WebSocket/SSE.',
          highlight: 'Real-time Processing',
          color: 'from-amber-500 to-orange-600'
        },
        {
          icon: Lock,
          title: 'Kiểm soát truy cập',
          description: 'Phân quyền theo vai trò, đơn vị, cấp bậc. Mỗi người chỉ xem dữ liệu thuộc phạm vi.',
          highlight: 'Access Control',
          color: 'from-slate-500 to-slate-700'
        },
      ],
      techStack: [
        'Next.js 14', 'PostgreSQL', 'Prisma ORM', 'TypeScript', 
        'TailwindCSS', 'Abacus AI', 'AWS S3', 'Redis Cache'
      ]
    },
    en: {
      sectionBadge: 'Features',
      sectionTitle: 'MODERN BIGDATA PLATFORM',
      sectionSubtitle: 'Built on standard 6-layer BigData architecture',
      features: [
        {
          icon: Upload,
          title: 'Data Collection',
          description: 'Import data from Excel, CSV, JSON with auto-validation, deduplication, format standardization.',
          highlight: 'Data Ingestion Layer',
          color: 'from-emerald-500 to-teal-600'
        },
        {
          icon: Search,
          title: 'Smart Query',
          description: 'Advanced search with multi-dimensional filters, pagination, sorting by multiple criteria.',
          highlight: 'Query Engine',
          color: 'from-blue-500 to-indigo-600'
        },
        {
          icon: BarChart3,
          title: 'Analytics & Reports',
          description: 'Visual dashboards with diverse charts, automatic Excel/PDF report generation.',
          highlight: 'Analytics Layer',
          color: 'from-purple-500 to-violet-600'
        },
        {
          icon: Shield,
          title: 'Multi-layer Security',
          description: 'RBAC with 10 roles, password encryption, audit log, unit-based access control.',
          highlight: 'Security Layer',
          color: 'from-red-500 to-rose-600'
        },
        {
          icon: Zap,
          title: 'Real-time Processing',
          description: '199 RESTful API endpoints, instant data updates via WebSocket/SSE.',
          highlight: 'Real-time Processing',
          color: 'from-amber-500 to-orange-600'
        },
        {
          icon: Lock,
          title: 'Access Control',
          description: 'Permission by role, unit, rank. Each user only sees data within their scope.',
          highlight: 'Access Control',
          color: 'from-slate-500 to-slate-700'
        },
      ],
      techStack: [
        'Next.js 14', 'PostgreSQL', 'Prisma ORM', 'TypeScript', 
        'TailwindCSS', 'Abacus AI', 'AWS S3', 'Redis Cache'
      ]
    }
  };

  const lang = t('code') as 'vi' | 'en';
  const tr = translations[lang] || translations.vi;

  return (
    <section id="features" className="py-20 bg-white dark:bg-slate-950">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center space-x-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full px-4 py-2 mb-4">
            <Zap className="w-4 h-4" />
            <span className="text-sm font-medium">{tr.sectionBadge}</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
            {tr.sectionTitle}
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
            {tr.sectionSubtitle}
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {tr.features.map((feature, index) => (
            <Card
              key={index}
              className={`group relative overflow-hidden p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-2 ${
                mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              {/* Background gradient on hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 transition-opacity`} />
              
              {/* Icon */}
              <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <feature.icon className="w-7 h-7 text-white" />
              </div>

              {/* Highlight Badge */}
              <div className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
                {feature.highlight}
              </div>

              {/* Title */}
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3">
                {feature.title}
              </h3>

              {/* Description */}
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {feature.description}
              </p>
            </Card>
          ))}
        </div>

        {/* Tech Stack */}
        <div className="bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 rounded-2xl p-8">
          <h3 className="text-lg font-bold text-center text-slate-900 dark:text-white mb-6">
            {lang === 'vi' ? 'Công nghệ sử dụng' : 'Technology Stack'}
          </h3>
          <div className="flex flex-wrap justify-center gap-4">
            {tr.techStack.map((tech, idx) => (
              <div 
                key={idx} 
                className="flex items-center space-x-2 bg-white dark:bg-slate-700 px-4 py-2 rounded-full shadow-sm hover:shadow-md transition-shadow"
              >
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{tech}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
