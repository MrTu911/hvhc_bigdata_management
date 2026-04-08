'use client';

import { useLanguage } from '@/components/providers/language-provider';
import { Button } from '@/components/ui/button';
import { ArrowRight, Play, Shield, Zap, Users } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function CTASection() {
  const { t } = useLanguage();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const translations = {
    vi: {
      title: 'SẴN SÀNG TRẢI NGHIỆM?',
      subtitle: 'Khám phá hệ thống quản lý BigData hiện đại nhất dành cho Học viện Hậu cần',
      primaryBtn: 'Đăng nhập hệ thống',
      secondaryBtn: 'Khám phá phân hệ',
      features: [
        { icon: Shield, text: 'Bảo mật đa lớp' },
        { icon: Zap, text: 'Realtime updates' },
        { icon: Users, text: '287+ người dùng' },
      ],
      note: 'Liên hệ quản trị viên để được cấp tài khoản'
    },
    en: {
      title: 'READY TO EXPERIENCE?',
      subtitle: 'Explore the most modern BigData management system for Logistics Academy',
      primaryBtn: 'Login to System',
      secondaryBtn: 'Explore Modules',
      features: [
        { icon: Shield, text: 'Multi-layer security' },
        { icon: Zap, text: 'Realtime updates' },
        { icon: Users, text: '287+ users' },
      ],
      note: 'Contact administrator for account access'
    }
  };

  const lang = t('code') as 'vi' | 'en';
  const tr = translations[lang] || translations.vi;

  return (
    <section className="py-20 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-red-900 via-red-800 to-slate-900" />
      
      {/* Pattern overlay */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
          backgroundSize: '30px 30px'
        }} />
      </div>

      {/* Glow effects */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-yellow-500/20 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-red-500/20 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Title */}
          <h2 className={`text-3xl md:text-5xl font-bold text-white mb-6 transition-all duration-700 ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
          }`}>
            {tr.title}
          </h2>

          {/* Subtitle */}
          <p className={`text-xl text-white/80 mb-8 max-w-2xl mx-auto transition-all duration-700 delay-100 ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
          }`}>
            {tr.subtitle}
          </p>

          {/* Feature pills */}
          <div className={`flex flex-wrap justify-center gap-4 mb-10 transition-all duration-700 delay-200 ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
          }`}>
            {tr.features.map((feature, idx) => (
              <div key={idx} className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20">
                <feature.icon className="w-4 h-4 text-yellow-400" />
                <span className="text-sm text-white font-medium">{feature.text}</span>
              </div>
            ))}
          </div>

          {/* Buttons */}
          <div className={`flex flex-col sm:flex-row justify-center gap-4 mb-8 transition-all duration-700 delay-300 ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
          }`}>
            <Link href="/login">
              <Button size="lg" className="bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-slate-900 font-bold px-8 py-6 text-lg">
                {tr.primaryBtn}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link href="#modules">
              <Button size="lg" variant="outline" className="border-white/30 bg-white/10 text-white hover:bg-white/20 px-8 py-6 text-lg">
                <Play className="w-5 h-5 mr-2" />
                {tr.secondaryBtn}
              </Button>
            </Link>
          </div>

          {/* Note */}
          <p className={`text-sm text-white/60 transition-all duration-700 delay-400 ${
            mounted ? 'opacity-100' : 'opacity-0'
          }`}>
            {tr.note}
          </p>
        </div>
      </div>
    </section>
  );
}
