'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Menu, X, ChevronDown } from 'lucide-react';
import { useLanguage } from '@/components/providers/language-provider';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { data: session, status } = useSession() || {};
  const { t } = useLanguage();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const translations = {
    vi: {
      home: 'Trang chủ',
      modules: 'Phân hệ',
      features: 'Tính năng',
      ai: 'AI/ML',
      security: 'Bảo mật',
      architecture: 'Kiến trúc',
      login: 'Đăng nhập',
      dashboard: 'Vào hệ thống',
      systemName: 'HỆ THỐNG CƠ SỞ DỮ LIỆU LỚN',
      academyName: 'HỌC VIỆN HẬU CẦN',
      subTitle: 'BIGDATA MANAGEMENT SYSTEM'
    },
    en: {
      home: 'Home',
      modules: 'Modules',
      features: 'Features',
      ai: 'AI/ML',
      security: 'Security',
      architecture: 'Architecture',
      login: 'Login',
      dashboard: 'Dashboard',
      systemName: 'BIGDATA MANAGEMENT SYSTEM',
      academyName: 'LOGISTICS ACADEMY',
      subTitle: 'RESEARCH & TRAINING PLATFORM'
    }
  };

  const lang = t('code') as 'vi' | 'en';
  const tr = translations[lang] || translations.vi;

  return (
    <header className={`fixed top-0 z-50 w-full transition-all duration-300 ${
      scrolled 
        ? 'bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-lg' 
        : 'bg-transparent'
    }`}>
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex h-20 items-center justify-between">
          {/* Logo and Title */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="relative w-14 h-14 transition-transform group-hover:scale-105">
              <Image
                src="/images/logo_hvhc.png"
                alt="Logo HVHC - Trang chủ"
                fill
                className="object-contain"
                priority
              />
            </div>
            <div className="hidden md:block">
              <div className={`text-base font-bold transition-colors ${
                scrolled ? 'text-red-700 dark:text-red-500' : 'text-white'
              }`}>
                {tr.academyName}
              </div>
              <div className={`text-xs font-medium tracking-wide transition-colors ${
                scrolled ? 'text-slate-600 dark:text-slate-400' : 'text-blue-100'
              }`}>
                {tr.subTitle}
              </div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-6">
            {[
              { href: '#home', label: tr.home },
              { href: '#modules', label: tr.modules },
              { href: '#features', label: tr.features },
              { href: '#ai', label: tr.ai },
              { href: '#security', label: tr.security },
              { href: '#architecture', label: tr.architecture },
            ].map((item) => (
              <Link 
                key={item.href}
                href={item.href} 
                className={`text-sm font-medium transition-all hover:scale-105 ${
                  scrolled 
                    ? 'text-slate-700 hover:text-red-600 dark:text-slate-200' 
                    : 'text-white/90 hover:text-white'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Login/Dashboard Button */}
          <div className="hidden md:flex items-center space-x-4">
            {status === 'authenticated' ? (
              <Link href="/dashboard">
                <Button className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg hover:shadow-xl transition-all">
                  {tr.dashboard}
                </Button>
              </Link>
            ) : (
              <Link href="/login">
                <Button className={`shadow-lg hover:shadow-xl transition-all ${
                  scrolled
                    ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white'
                    : 'bg-white text-red-700 hover:bg-red-50'
                }`}>
                  {tr.login}
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? (
              <X size={28} className={scrolled ? 'text-slate-900' : 'text-white'} />
            ) : (
              <Menu size={28} className={scrolled ? 'text-slate-900' : 'text-white'} />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="lg:hidden py-4 border-t bg-white dark:bg-slate-900 rounded-b-2xl shadow-xl">
            <nav className="flex flex-col space-y-4 px-4">
              {[
                { href: '#home', label: tr.home },
                { href: '#modules', label: tr.modules },
                { href: '#features', label: tr.features },
                { href: '#ai', label: tr.ai },
                { href: '#security', label: tr.security },
                { href: '#architecture', label: tr.architecture },
              ].map((item) => (
                <Link 
                  key={item.href}
                  href={item.href} 
                  className="text-sm font-medium text-slate-700 dark:text-slate-200 hover:text-red-600 py-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              {status === 'authenticated' ? (
                <Link href="/dashboard">
                  <Button className="w-full bg-gradient-to-r from-red-600 to-red-700">
                    {tr.dashboard}
                  </Button>
                </Link>
              ) : (
                <Link href="/login">
                  <Button className="w-full bg-gradient-to-r from-red-600 to-red-700">
                    {tr.login}
                  </Button>
                </Link>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
