
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { DynamicThemeProvider } from '@/lib/theme-provider-dynamic';
import { SessionProvider } from '@/components/providers/session-provider';
import { LanguageProvider } from '@/components/providers/language-provider';
import { ReactQueryProvider } from '@/components/providers/react-query-provider';

const inter = Inter({ subsets: ['latin', 'vietnamese'] });

export const metadata: Metadata = {
  title: 'HVHC BigData Management System',
  description: 'Hệ thống Quản lý BigData - Học viện Hậu cần',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Session strategy = JWT → getServerSession chỉ decode cookie (rẻ, không chạm DB).
  // Truyền session vào SessionProvider để client không phải fetch /api/auth/session khi mount,
  // tránh nhấp nháy nút Header (Đăng nhập ↔ Vào hệ thống) cho user đã đăng nhập.
  const session = await getServerSession(authOptions);

  return (
    <html lang="vi" suppressHydrationWarning>
      <body className={inter.className}>
        <SessionProvider session={session}>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
          >
            <DynamicThemeProvider>
              <LanguageProvider>
                <ReactQueryProvider>
                  {children}
                </ReactQueryProvider>
              </LanguageProvider>
            </DynamicThemeProvider>
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
