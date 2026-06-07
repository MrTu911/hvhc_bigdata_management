'use client';

import { useEffect, useRef } from 'react';
import { InstitutionalBanner } from '@/components/dashboard/institutional-banner';
import { DashboardHeader } from '@/components/dashboard/header';

/**
 * Khối "top chrome" cố định trên cùng dashboard: dải banner định danh Học viện +
 * thanh điều hướng.
 *
 * Banner hiển thị đúng tỉ lệ gốc nên chiều cao thay đổi theo bề rộng màn hình.
 * Component này đo chiều cao thật của cả khối và ghi vào biến CSS `--top-chrome-h`
 * để `<main>` và sidebar luôn chừa đúng khoảng trống, không bị lệch khi resize.
 */
export function DashboardChrome() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const updateHeight = () => {
      document.documentElement.style.setProperty('--top-chrome-h', `${el.offsetHeight}px`);
    };

    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(el);

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="fixed top-0 inset-x-0 z-50">
      <InstitutionalBanner />
      <DashboardHeader />
    </div>
  );
}
