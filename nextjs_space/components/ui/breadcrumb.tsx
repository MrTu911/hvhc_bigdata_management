/**
 * Breadcrumb Navigation Component
 * Hiển thị đường dẫn điều hướng
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items?: BreadcrumbItem[];
  className?: string;
}

// Map pathname segments to Vietnamese labels
const pathLabels: Record<string, string> = {
  dashboard: 'Dashboard',
  admin: 'Quản trị',
  rbac: 'Phân quyền RBAC',
  positions: 'Chức vụ',
  functions: 'Chức năng',
  users: 'Người dùng',
  faculty: 'Giảng viên',
  student: 'Học viên',
  policy: 'Chính sách',
  insurance: 'Bảo hiểm',
  party: 'Công tác Đảng',
  research: 'NCKH',
  training: 'Đào tạo',
  awards: 'Thi đua - Khen thưởng',
  settings: 'Cài đặt',
  profile: 'Hồ sơ',
  list: 'Danh sách',
  stats: 'Thống kê',
  overview: 'Tổng quan',
  reports: 'Báo cáo',
  'he-so-mon-hoc': 'Hệ số môn học',
  'ai-settings': 'Cấu hình AI',
  'my-students': 'Học viên của tôi',
  'teaching-analytics': 'Phân tích giảng dạy',
};

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  const pathname = usePathname();
  
  // Auto-generate breadcrumbs from pathname if items not provided
  const breadcrumbItems: BreadcrumbItem[] = items || (() => {
    const segments = pathname.split('/').filter(Boolean);
    return segments.map((segment, index) => {
      const href = '/' + segments.slice(0, index + 1).join('/');
      const label = pathLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
      return { label, href: index < segments.length - 1 ? href : undefined };
    });
  })();

  if (breadcrumbItems.length === 0) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn(
        'flex items-center space-x-1 text-sm text-muted-foreground mb-4',
        className
      )}
    >
      <Link
        href="/dashboard"
        className="flex items-center hover:text-foreground transition-colors"
      >
        <Home className="h-4 w-4" />
      </Link>
      
      {breadcrumbItems.map((item, index) => (
        <div key={index} className="flex items-center">
          <ChevronRight className="h-4 w-4 mx-1" />
          {item.href ? (
            <Link
              href={item.href}
              className="hover:text-foreground transition-colors"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-foreground font-medium">{item.label}</span>
          )}
        </div>
      ))}
    </nav>
  );
}

export default Breadcrumb;
