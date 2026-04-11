'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * /dashboard/science/database/catalogs
 * Redirect về trang danh mục KH hiện có tại /dashboard/science/catalogs
 */
export default function DatabaseCatalogsRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard/science/catalogs');
  }, [router]);

  return (
    <div className="p-8 text-center text-gray-400 text-sm">Đang chuyển hướng...</div>
  );
}
