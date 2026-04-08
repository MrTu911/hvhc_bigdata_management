'use client';

import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/components/providers/language-provider';

interface DashboardHeaderProps {
  title: string;
  subtitle?: string;
  badge?: string;
  showLogo?: boolean;
  children?: React.ReactNode;
}

export default function DashboardHeader({ 
  title, 
  subtitle, 
  badge,
  showLogo = true,
  children 
}: DashboardHeaderProps) {
  const { t } = useLanguage();

  return (
    <div className="bg-gradient-to-r from-red-900 via-red-800 to-red-900 rounded-xl p-6 mb-6 text-white shadow-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {showLogo && (
            <div className="relative w-16 h-16 bg-white rounded-xl p-1 shadow-md">
              <Image
                src="/images/logo_hvhc.png"
                alt="Học viện Hậu cần"
                fill
                className="object-contain p-1"
                priority
              />
            </div>
          )}
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl md:text-3xl font-bold">{title}</h1>
              {badge && (
                <Badge className="bg-yellow-500 text-black font-bold">
                  {badge}
                </Badge>
              )}
            </div>
            {subtitle && (
              <p className="text-red-100 mt-1 text-sm md:text-base">
                {subtitle}
              </p>
            )}
            <p className="text-red-200 text-xs mt-1">
              HỌC VIỆN HẬU CẦN - BỘ QUỐC PHÒNG
            </p>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}
