
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

interface ThemeContextType {
  themeConfig: any;
  updateTheme: (config: any) => void;
  applyTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function DynamicThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeConfig, setThemeConfig] = useState<any>({});

  useEffect(() => {
    // Load theme from localStorage or API
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const response = await fetch('/api/theme/settings');
      const result = await response.json();
      
      if (result.success) {
        const config = convertSettingsToConfig(result.data.all);
        setThemeConfig(config);
        applyThemeToDOM(config);
      }
    } catch (error) {
      console.error('Error loading theme:', error);
    }
  };

  const updateTheme = (config: any) => {
    setThemeConfig(config);
    applyThemeToDOM(config);
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
