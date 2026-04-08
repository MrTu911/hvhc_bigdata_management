
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className={inter.className}>
        <SessionProvider>
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
