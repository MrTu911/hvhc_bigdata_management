
'use client';

import React from 'react';
import { LanguageContext, useLanguage } from './language-provider';
import { translations } from './translations-data';

// Provider NẶNG (import từ điển 53KB). Đặt ở layout dashboard để từ điển chỉ vào chunk dashboard.
// Đọc language/setLanguage từ LanguageProvider gốc rồi override `t` bằng bản đầy đủ,
// nên mọi consumer dashboard dùng useLanguage() như cũ — không phải sửa code.
export function TranslationProvider({ children }: { children: React.ReactNode }) {
  const { language, setLanguage } = useLanguage();

  const t = (key: string): string => {
    return (translations[language] as Record<string, string>)[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}
