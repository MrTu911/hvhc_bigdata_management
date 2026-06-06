
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { DashboardHeader } from '@/components/dashboard/header';
import { DashboardSidebarEnhanced } from '@/components/dashboard/sidebar-enhanced';
import { ForcePasswordChangeGuard } from '@/components/auth/force-password-change-guard';
import { TranslationProvider } from '@/components/providers/translation-provider';

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
        <DashboardHeader />
        <DashboardSidebarEnhanced />
        <main className="lg:pl-[var(--sidebar-width)] pt-16 page-enter">
          <div className="container mx-auto max-w-7xl p-4 md:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </TranslationProvider>
  );
}
