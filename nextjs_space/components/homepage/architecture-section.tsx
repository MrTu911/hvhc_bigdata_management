'use client';

import { useLanguage } from '@/components/providers/language-provider';
import { 
  Layers, Monitor, Cpu, Database, Server,
  ArrowDown, CheckCircle2, Zap
} from 'lucide-react';
import { useState, useEffect } from 'react';

export default function ArchitectureSection() {
  const { t } = useLanguage();
  const [mounted, setMounted] = useState(false);
  const [activeLayer, setActiveLayer] = useState<number | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const translations = {
    vi: {
      badge: 'Kiến trúc hệ thống',
      title: 'KIẾN TRÚC 4 TẦNG HIỆN ĐẠI',
      subtitle: 'Thiết kế theo mô hình phân lớp chuẩn enterprise, dễ mở rộng và bảo trì',
      layers: [
        {
          icon: Monitor,
          name: 'Presentation Layer',
          title: 'Tầng Giao diện',
          tech: ['Next.js 14', 'React 18', 'TailwindCSS', 'Shadcn/UI'],
          description: 'UI/UX hiện đại với 140+ trang, responsive design, dark mode.',
          color: 'from-blue-500 to-indigo-600',
          stats: '140+ Pages'
        },
        {
          icon: Cpu,
          name: 'Business Logic Layer',
          title: 'Tầng Nghiệp vụ',
          tech: ['RBAC Middleware', 'Widget Registry', 'AI Engine', 'Zustand'],
          description: 'Xử lý logic nghiệp vụ, phân quyền, AI/ML, state management.',
          color: 'from-purple-500 to-violet-600',
          stats: '4 AI Engines'
        },
        {
          icon: Server,
          name: 'Data Access Layer',
          title: 'Tầng Truy cập Dữ liệu',
          tech: ['Prisma ORM', 'Stats APIs', 'Audit Logger', 'SWR Cache'],
          description: '296+ API endpoints, 9 Stats APIs, caching với SWR.',
          color: 'from-emerald-500 to-teal-600',
          stats: '296+ APIs'
        },
        {
          icon: Database,
          name: 'Persistence Layer',
          title: 'Tầng Lưu trữ',
          tech: ['PostgreSQL', 'Redis Cache', 'AWS S3', '113 Models'],
          description: '113+ database models, caching với Redis, file storage S3.',
          color: 'from-amber-500 to-orange-600',
          stats: '113+ Models'
        },
      ],
      techHighlights: [
        { name: 'Next.js 14', desc: 'App Router, Server Components' },
        { name: 'TypeScript', desc: 'Type-safe development' },
        { name: 'Prisma 6.7', desc: 'Modern ORM' },
        { name: 'Abacus AI', desc: 'ML/Analysis engine' },
      ]
    },
    en: {
      badge: 'System Architecture',
      title: 'MODERN 4-LAYER ARCHITECTURE',
      subtitle: 'Designed with enterprise-grade layered model, easy to scale and maintain',
      layers: [
        {
          icon: Monitor,
          name: 'Presentation Layer',
          title: 'UI Layer',
          tech: ['Next.js 14', 'React 18', 'TailwindCSS', 'Shadcn/UI'],
          description: 'Modern UI/UX with 140+ pages, responsive design, dark mode.',
          color: 'from-blue-500 to-indigo-600',
          stats: '140+ Pages'
        },
        {
          icon: Cpu,
          name: 'Business Logic Layer',
          title: 'Logic Layer',
          tech: ['RBAC Middleware', 'Widget Registry', 'AI Engine', 'Zustand'],
          description: 'Business logic processing, authorization, AI/ML, state management.',
          color: 'from-purple-500 to-violet-600',
          stats: '4 AI Engines'
        },
        {
          icon: Server,
          name: 'Data Access Layer',
          title: 'Data Layer',
          tech: ['Prisma ORM', 'Stats APIs', 'Audit Logger', 'SWR Cache'],
          description: '296+ API endpoints, 9 Stats APIs, SWR caching.',
          color: 'from-emerald-500 to-teal-600',
          stats: '296+ APIs'
        },
        {
          icon: Database,
          name: 'Persistence Layer',
          title: 'Storage Layer',
          tech: ['PostgreSQL', 'Redis Cache', 'AWS S3', '113 Models'],
          description: '113+ database models, Redis caching, S3 file storage.',
          color: 'from-amber-500 to-orange-600',
          stats: '113+ Models'
        },
      ],
      techHighlights: [
        { name: 'Next.js 14', desc: 'App Router, Server Components' },
        { name: 'TypeScript', desc: 'Type-safe development' },
        { name: 'Prisma 6.7', desc: 'Modern ORM' },
        { name: 'Abacus AI', desc: 'ML/Analysis engine' },
      ]
    }
  };

  const lang = t('code') as 'vi' | 'en';
  const tr = translations[lang] || translations.vi;

  return (
    <section id="architecture" className="py-20 bg-slate-50 dark:bg-slate-900">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center space-x-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full px-4 py-2 mb-4">
            <Layers className="w-4 h-4" />
            <span className="text-sm font-medium">{tr.badge}</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
            {tr.title}
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
            {tr.subtitle}
          </p>
        </div>

        {/* Architecture Diagram */}
        <div className="max-w-4xl mx-auto">
          <div className="space-y-4">
            {tr.layers.map((layer, index) => (
              <div key={index}>
                {/* Layer Card */}
                <div 
                  className={`relative rounded-2xl border-2 transition-all duration-300 cursor-pointer overflow-hidden ${
                    activeLayer === index 
                      ? 'border-transparent shadow-xl scale-[1.02]' 
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                  onClick={() => setActiveLayer(activeLayer === index ? null : index)}
                >
                  {/* Gradient background when active */}
                  <div className={`absolute inset-0 bg-gradient-to-r ${layer.color} transition-opacity duration-300 ${
                    activeLayer === index ? 'opacity-100' : 'opacity-0'
                  }`} />
                  
                  <div className={`relative p-6 ${
                    activeLayer === index ? 'text-white' : 'bg-white dark:bg-slate-800'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                          activeLayer === index 
                            ? 'bg-white/20' 
                            : `bg-gradient-to-br ${layer.color}`
                        }`}>
                          <layer.icon className={`w-7 h-7 ${activeLayer === index ? 'text-white' : 'text-white'}`} />
                        </div>
                        <div>
                          <p className={`text-sm font-medium ${
                            activeLayer === index ? 'text-white/80' : 'text-slate-500 dark:text-slate-400'
                          }`}>
                            {layer.name}
                          </p>
                          <h3 className={`text-xl font-bold ${
                            activeLayer === index ? 'text-white' : 'text-slate-900 dark:text-white'
                          }`}>
                            {layer.title}
                          </h3>
                        </div>
                      </div>
                      <div className={`text-right ${
                        activeLayer === index ? 'text-white' : ''
                      }`}>
                        <span className={`text-2xl font-bold ${
                          activeLayer === index ? 'text-white' : 'text-slate-900 dark:text-white'
                        }`}>
                          {layer.stats}
                        </span>
                      </div>
                    </div>

                    {/* Expanded content */}
                    {activeLayer === index && (
                      <div className="mt-6 pt-6 border-t border-white/20">
                        <p className="text-white/90 mb-4">{layer.description}</p>
                        <div className="flex flex-wrap gap-2">
                          {layer.tech.map((tech, i) => (
                            <span key={i} className="text-sm bg-white/20 px-3 py-1 rounded-full">
                              {tech}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Arrow between layers */}
                {index < tr.layers.length - 1 && (
                  <div className="flex justify-center py-2">
                    <ArrowDown className="w-6 h-6 text-slate-400" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Tech Highlights */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4">
          {tr.techHighlights.map((tech, index) => (
            <div key={index} className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 text-center">
              <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
              <p className="font-bold text-slate-900 dark:text-white">{tech.name}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">{tech.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
