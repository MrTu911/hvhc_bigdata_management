
'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

// Type ngôn ngữ sở hữu tại tầng nhẹ (root) — KHÔNG import từ translations-data,
// để module này hoàn toàn độc lập với từ điển nặng, đảm bảo bundle public không kéo dict.
export type Language = 'vi' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

export const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Provider NHẸ đặt ở root layout: chỉ quản lý language state + localStorage.
// `t()` ở đây chỉ resolve 'code' (mã ngôn ngữ) cho các trang public; mọi key dịch thật
// được phục vụ bởi TranslationProvider (nạp từ điển 53KB) ở layout dashboard.
// Nhờ vậy bundle trang chủ/login không phải kéo theo toàn bộ từ điển.
export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>('vi');

  useEffect(() => {
    const savedLang = localStorage.getItem('language') as Language;
    if (savedLang) {
      setLanguage(savedLang);
    }
  }, []);

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('language', lang);
  };

  const t = (key: string): string => {
    // Trang public chỉ cần mã ngôn ngữ; các key khác không có ở tầng nhẹ này.
    if (key === 'code') return language;
    return key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}
