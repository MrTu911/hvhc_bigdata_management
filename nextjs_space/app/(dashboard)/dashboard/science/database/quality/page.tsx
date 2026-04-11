'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * /dashboard/science/database/quality
 * Redirect về trang chất lượng dữ liệu tại /dashboard/science/data-quality
 */
export default function DatabaseQualityRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard/science/data-quality');
  }, [router]);

  return (
    <div className="p-8 text-center text-gray-400 text-sm">Đang chuyển hướng...</div>
  );
}
