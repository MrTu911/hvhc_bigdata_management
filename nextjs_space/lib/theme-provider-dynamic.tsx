
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

interface ThemeContextType {
  themeConfig: any;
  updateTheme: (config: any) => void;
  applyTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Theme động chỉ phục vụ khu vực dashboard (admin tùy biến màu/layout).
// Trang public dùng branding cố định nên không cần gọi /api/theme/settings.
const THEME_CACHE_KEY = 'dynamic-theme-config';
const PUBLIC_PATH_PREFIXES = ['/login', '/signup', '/forgot-password', '/reset-password'];

function isPublicPath(pathname: string): boolean {
  return pathname === '/' || PUBLIC_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function readCachedTheme(): any | null {
  try {
    const raw = localStorage.getItem(THEME_CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeCachedTheme(config: any): void {
  try {
    localStorage.setItem(THEME_CACHE_KEY, JSON.stringify(config));
  } catch {
    // Bỏ qua lỗi quota/private mode
  }
}

export function DynamicThemeProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [themeConfig, setThemeConfig] = useState<any>({});

  useEffect(() => {
    // Trang public: bỏ qua hẳn request theme động để giảm 1 round-trip khi vào trang chủ/login.
    if (isPublicPath(pathname)) {
      return;
    }

    // Áp cache trước để tránh nhấp nháy theme, sau đó revalidate từ API ở nền.
    const cached = readCachedTheme();
    if (cached) {
      setThemeConfig(cached);
      applyThemeToDOM(cached);
    }

    loadTheme();
  }, [pathname]);

  const loadTheme = async () => {
    try {
      const response = await fetch('/api/theme/settings');
      const result = await response.json();

      if (result.success) {
        const config = convertSettingsToConfig(result.data.all);
        setThemeConfig(config);
        applyThemeToDOM(config);
        writeCachedTheme(config);
      }
    } catch (error) {
      console.error('Error loading theme:', error);
    }
  };

  const updateTheme = (config: any) => {
    setThemeConfig(config);
    applyThemeToDOM(config);
    writeCachedTheme(config);
  };

  const applyTheme = () => {
    applyThemeToDOM(themeConfig);
  };

  const applyThemeToDOM = (config: any) => {
    const root = document.documentElement;

    // Apply color variables
    if (config.colors) {
      Object.entries(config.colors).forEach(([key, value]) => {
        root.style.setProperty(`--${key.replace(/_/g, '-')}`, value as string);
      });
    }

    // Apply layout variables
    if (config.layout) {
      Object.entries(config.layout).forEach(([key, value]) => {
        const cssVar = `--${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
        root.style.setProperty(cssVar, typeof value === 'number' ? `${value}px` : value as string);
      });
    }
  };

  return (
    <ThemeContext.Provider value={{ themeConfig, updateTheme, applyTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useDynamicTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useDynamicTheme must be used within DynamicThemeProvider');
  }
  return context;
}

function convertSettingsToConfig(settings: any[]) {
  const config: any = {
    colors: {},
    typography: {},
    layout: {},
    branding: {}
  };

  settings.forEach((setting: any) => {
    const category = setting.category;
    const key = setting.setting_key;
    let value = setting.setting_value;

    // Convert number strings to numbers
    if (setting.setting_type === 'number') {
      value = parseInt(value, 10);
    }

    config[category][key] = value;
  });

  return config;
}
