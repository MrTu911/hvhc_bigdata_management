'use client';

import { Button } from '@/components/ui/button';
import { ArrowRight, Play, Shield, Database, Users, Brain, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useLanguage } from '@/components/providers/language-provider';
import { useEffect, useState } from 'react';

interface PublicStats {
  success: boolean;
  data: {
    totalPersonnel: number;
    totalUnits: number;
    totalDatabases: number;
    totalCourses: number;
    totalProjects: number;
    totalStudents: number;
    activeUsers: number;
    lastUpdated: string;
  };
}

export default function HeroSection() {
  const { t } = useLanguage();
  const [mounted, setMounted] = useState(false);
  const [publicStats, setPublicStats] = useState<PublicStats | null>(null);

  useEffect(() => {
    setMounted(true);
    
    // Fetch stats function
    const fetchStats = () => {
      fetch('/api/public/stats')
        .then(res => res.json())
        .then(data => setPublicStats(data))
        .catch(console.error);
    };
    
    // Initial fetch
    fetchStats();
    
    // Auto-refresh every 60 seconds (D3.4)
    const interval = setInterval(fetchStats, 60000);
    
    return () => clearInterval(interval);
  }, []);

  const translations = {
    vi: {
      badge: 'Hệ thống Quản lý Dữ liệu Lớn',
      title1: 'HỆ THỐNG',
      title2: 'QUẢN LÝ DỮ LIỆU LỚN',
      subtitle: 'Nền tảng nghiên cứu & huấn luyện tại Học viện Hậu cần',
      description: 'Quản lý toàn diện 8 cơ sở dữ liệu: Quân nhân, Đảng viên, Thi đua Khen thưởng, Chính sách, Bảo hiểm XH, Giảng viên, Học viên quân sự và Đào tạo - Huấn luyện.',
      getStarted: 'Truy cập hệ thống',
      learnMore: 'Xem demo',
      features: [
        { icon: Shield, text: `${publicStats?.data?.totalDatabases || 8} Cơ sở dữ liệu` },
        { icon: Users, text: `${publicStats?.data?.totalPersonnel || '264'}+ Cán bộ, Giảng viên` },
        { icon: Brain, text: 'Tích hợp AI/ML' },
        { icon: Database, text: `${publicStats?.data?.totalUnits || '50'}+ Đơn vị trực thuộc` },
      ],
      stats: [
        { value: publicStats?.data?.totalPersonnel?.toLocaleString() || '264', label: 'Cán bộ', key: 'personnel' },
        { value: publicStats?.data?.totalUnits?.toLocaleString() || '50+', label: 'Đơn vị', key: 'departments' },
        { value: String(publicStats?.data?.totalDatabases || 8), label: 'CSDL', key: 'databases' },
        { value: '99.9%', label: 'Uptime', key: 'uptime' },
      ]
    },
    en: {
      badge: 'BigData Management System',
      title1: 'BIGDATA',
      title2: 'MANAGEMENT SYSTEM',
      subtitle: 'Research & Training Platform at Logistics Academy',
      description: 'Comprehensive management of 8 databases: Military Personnel, Party Members, Awards, Policies, Social Insurance, Faculty, Military Students, and Education & Training.',
      getStarted: 'Access System',
      learnMore: 'View Demo',
      features: [
        { icon: Shield, text: `${publicStats?.data?.totalDatabases || 8} Databases` },
        { icon: Users, text: `${publicStats?.data?.totalPersonnel || '264'}+ Officers, Faculty` },
        { icon: Brain, text: 'AI/ML Integration' },
        { icon: Database, text: `${publicStats?.data?.totalUnits || '50'}+ Subordinate Units` },
      ],
      stats: [
        { value: publicStats?.data?.totalPersonnel?.toLocaleString() || '264', label: 'Personnel', key: 'personnel' },
        { value: publicStats?.data?.totalUnits?.toLocaleString() || '50+', label: 'Units', key: 'departments' },
        { value: String(publicStats?.data?.totalDatabases || 8), label: 'Databases', key: 'databases' },
        { value: '99.9%', label: 'Uptime', key: 'uptime' },
      ]
    }
  };

  const lang = t('code') as 'vi' | 'en';
  const tr = translations[lang] || translations.vi;

  return (
    <section id="home" className="relative min-h-screen overflow-hidden">
      {/* Background với gradient và pattern */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-red-900 via-red-800 to-slate-900"></div>
        {/* Pattern overlay */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='https://static.vecteezy.com/system/resources/previews/002/438/776/non_2x/abstract-white-and-gray-subtle-lattice-pattern-background-modern-style-with-monochrome-trellis-repeat-geometric-grid-vector.jpg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
        {/* Light rays */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-to-b from-yellow-500/20 via-transparent to-transparent rounded-full blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 lg:px-8 pt-28 pb-16">
        <div className="grid lg:grid-cols-2 gap-12 items-center min-h-[80vh]">
          {/* Left Content */}
          <div className="space-y-8">
            {/* Badge */}
            <div className={`inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 transition-all duration-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              <span className="text-sm text-white font-medium">{tr.badge}</span>
            </div>

            {/* Main Title */}
            <div className={`space-y-2 transition-all duration-700 delay-100 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
                {tr.title1}
              </h1>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                <span className="bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-500 bg-clip-text text-transparent">
                  {tr.title2}
                </span>
              </h1>
            </div>

            {/* Subtitle */}
            <p className={`text-xl md:text-2xl text-red-100 font-medium transition-all duration-700 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
              {tr.subtitle}
            </p>

            {/* Description */}
            <p className={`text-base text-white/80 max-w-xl leading-relaxed transition-all duration-700 delay-300 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
              {tr.description}
            </p>

            {/* Feature pills */}
            <div className={`flex flex-wrap gap-3 transition-all duration-700 delay-400 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
              {tr.features.map((feature, idx) => (
                <div key={idx} className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20">
                  <feature.icon className="w-4 h-4 text-yellow-400" />
                  <span className="text-sm text-white font-medium">{feature.text}</span>
                </div>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className={`flex flex-col sm:flex-row gap-4 pt-4 transition-all duration-700 delay-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
              <Link href="/login">
                <Button size="lg" className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-slate-900 font-bold shadow-lg hover:shadow-xl transition-all group">
                  {tr.getStarted}
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="#features">
                <Button size="lg" variant="outline" className="border-2 border-white text-white bg-white/10 hover:bg-white hover:text-red-900 transition-all group">
                  <Play className="mr-2 h-5 w-5" />
                  {tr.learnMore}
                </Button>
              </Link>
            </div>
          </div>

          {/* Right Content - Building Image & Stats */}
          <div className={`relative transition-all duration-1000 delay-300 ${mounted ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}`}>
            {/* Ảnh Tòa nhà Học viện */}
            <div className="relative w-full aspect-[16/10] mb-8 rounded-2xl overflow-hidden shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-10" />
              <Image
                src="/images/hvhc_building.jpg"
                alt="Học viện Hậu cần"
                fill
                className="object-cover"
                priority
              />
              {/* Badge trên ảnh */}
              <div className="absolute bottom-4 left-4 right-4 z-20">
                <div className="bg-white/90 backdrop-blur-sm rounded-xl px-4 py-3 shadow-lg">
                  <p className="text-red-800 font-bold text-center text-sm md:text-base">
                    HỌC VIỆN HẬU CẦN - BỘ QUỐC PHÒNG
                  </p>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              {tr.stats.map((stat, index) => (
                <div 
                  key={index} 
                  className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 text-center hover:bg-white/20 transition-all hover:scale-105 cursor-default"
                >
                  <div className="text-3xl lg:text-4xl font-bold text-white mb-1">{stat.value}</div>
                  <div className="text-sm text-red-100 font-medium">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Decorative Bottom Wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 120" className="w-full h-16 md:h-24">
          <path
            fill="currentColor"
            className="text-white dark:text-slate-900"
            d="M0,64L80,69.3C160,75,320,85,480,80C640,75,800,53,960,48C1120,43,1280,53,1360,58.7L1440,64L1440,120L1360,120C1280,120,1120,120,960,120C800,120,640,120,480,120C320,120,160,120,80,120L0,120Z"
          ></path>
        </svg>
      </div>
    </section>
  );
}
