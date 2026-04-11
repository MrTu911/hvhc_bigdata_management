'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * /dashboard/science/database/search
 * Redirect về trang tìm kiếm khoa học hiện có tại /dashboard/science/search
 */
export default function DatabaseSearchRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard/science/search');
  }, [router]);

  return (
    <div className="p-8 text-center text-gray-400 text-sm">Đang chuyển hướng...</div>
  );
}
