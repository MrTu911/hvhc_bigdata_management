
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { DashboardChrome } from '@/components/dashboard/dashboard-chrome';
import { DashboardSidebarEnhanced } from '@/components/dashboard/sidebar-enhanced';
import { ForcePasswordChangeGuard } from '@/components/auth/force-password-change-guard';
import { TranslationProvider } from '@/components/providers/translation-provider';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as SonnerToaster } from '@/components/ui/sonner';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/login');
  }

  return (
    // TranslationProvider nạp từ điển i18n đầy đủ cho toàn khu dashboard (đồng bộ trong chunk dashboard).
    <TranslationProvider>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <ForcePasswordChangeGuard />
        {/* Top chrome cố định (banner + thanh điều hướng); tự đo chiều cao -> biến --top-chrome-h */}
        <DashboardChrome />
        <DashboardSidebarEnhanced />
        {/* Chừa đúng chiều cao top chrome (banner tỉ lệ gốc nên cao thay đổi theo bề rộng) */}
        <main
          className="lg:pl-[var(--sidebar-width)] page-enter"
          style={{ paddingTop: 'var(--top-chrome-h)' }}
        >
          <div className="container mx-auto max-w-7xl p-4 md:p-6 lg:p-8">
            {children}
          </div>
        </main>
        {/* Toast viewport dùng chung: radix (use-toast) + sonner (toast từ 'sonner') */}
        <Toaster />
        <SonnerToaster />
      </div>
    </TranslationProvider>
  );
}
