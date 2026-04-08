/**
 * AUTO DASHBOARD PAGE - Dashboard tự động theo quyền
 * 
 * Hiển thị dashboard tổng hợp các CSDL user có quyền
 */

import { AutoDashboard } from '@/components/dashboard/auto-dashboard';

export default function AutoDashboardPage() {
  return (
    <AutoDashboard 
      title="Dashboard Tổng hợp"
      description="Tự động hiển thị thống kê các CSDL bạn có quyền truy cập"
    />
  );
}
