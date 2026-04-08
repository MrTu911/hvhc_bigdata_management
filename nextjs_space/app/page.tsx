'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import HeroSection from '@/components/homepage/hero-section';
import StatsSection from '@/components/homepage/stats-section';
import ModulesSection from '@/components/homepage/modules-section';
import FeaturesSection from '@/components/homepage/features-section';
import AICapabilitiesSection from '@/components/homepage/ai-capabilities-section';
import SecuritySection from '@/components/homepage/security-section';
import ArchitectureSection from '@/components/homepage/architecture-section';
import CTASection from '@/components/homepage/cta-section';
import Footer from '@/components/homepage/footer';
import Header from '@/components/homepage/header';

export default function HomePage() {
  const { status } = useSession() || {};
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-red-900 via-red-800 to-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-white border-t-transparent mx-auto mb-4"></div>
          <p className="text-white/80 text-sm">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      <Header />
      <main>
        {/* Hero: Giới thiệu chính */}
        <HeroSection />
        
        {/* Stats: Thống kê ấn tượng với animation counter */}
        <StatsSection />
        
        {/* Modules: 8 CSDL chính */}
        <ModulesSection />
        
        {/* Features: Nền tảng BigData 6 lớp */}
        <FeaturesSection />
        
        {/* AI: 4 Engine AI/ML */}
        <AICapabilitiesSection />
        
        {/* Security: RBAC Function-based */}
        <SecuritySection />
        
        {/* Architecture: Kiến trúc 4 tầng */}
        <ArchitectureSection />
        
        {/* CTA: Call to Action */}
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
