
'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { useTheme } from 'next-themes';
import { useLanguage } from '@/components/providers/language-provider';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Moon,
  Sun,
  Languages,
  User,
  LogOut,
  Star,
  Bell,
  Settings,
  ChevronDown,
} from 'lucide-react';
import { CommandSearch } from '@/components/dashboard/command-search';

// Thẻ phiên bản hiển thị dưới tên hệ thống — không phải dữ liệu i18n nên giữ là hằng số.
const SYSTEM_TAGLINE = 'BIGDATA · MAL · V4.2';

export function DashboardHeader() {
  const { data: session } = useSession() || {};
  const { theme, setTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const toggleLanguage = () => {
    setLanguage(language === 'vi' ? 'en' : 'vi');
  };

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/login' });
  };

  // Dòng tên hiển thị: ghép cấp bậc + họ tên nếu có (vd "Đ.tá Nguyễn Văn Hùng").
  const displayName = [session?.user?.rank, session?.user?.name]
    .filter(Boolean)
    .join(' ');

  return (
    <header className="w-full border-b border-white/10 bg-gradient-to-r from-[#1b4fbf] to-[#2563eb] text-white shadow-sm">
      <div className="container mx-auto max-w-7xl flex h-16 items-center gap-3 px-4">
        {/* Nhận diện hệ thống */}
        <Link href="/dashboard" className="flex items-center gap-3 min-w-0 shrink-0">
          <div className="relative w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
            <Star className="w-5 h-5 text-amber-300 fill-amber-300" />
          </div>
          <div className="hidden sm:block min-w-0">
            <h1 className="text-base font-bold leading-tight truncate">
              {t('dashboard.title')}
            </h1>
            <p className="text-[10px] font-medium tracking-[0.18em] text-blue-200/80">
              {SYSTEM_TAGLINE}
            </p>
          </div>
        </Link>

        {/* Tìm kiếm nhanh (Cmd/Ctrl+K) — nới rộng, dồn ra sát cụm bên phải */}
        <div className="flex flex-1 justify-end">
          <div className="hidden md:block w-full max-w-sm">
            <CommandSearch
              triggerClassName="w-full border-white/25 bg-white/10 text-blue-50 hover:bg-white/20 hover:text-white"
              placeholder="Tìm kiếm dữ liệu, hồ sơ, báo cáo…"
            />
          </div>
        </div>

        {/* Hành động + người dùng */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Đổi ngôn ngữ */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleLanguage}
            className="hidden sm:inline-flex text-white hover:bg-white/10 hover:text-white"
            title={language === 'vi' ? 'English' : 'Tiếng Việt'}
          >
            <Languages className="h-5 w-5" />
          </Button>

          {/* Đổi giao diện sáng/tối */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="hidden sm:inline-flex text-white hover:bg-white/10 hover:text-white"
            title={theme === 'dark' ? 'Sáng' : 'Tối'}
          >
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>

          {/* Cảnh báo / Thông báo */}
          <Button
            asChild
            variant="ghost"
            size="icon"
            className="relative text-white hover:bg-white/10 hover:text-white"
            title="Cảnh báo hệ thống"
          >
            <Link href="/dashboard/alerts">
              <Bell className="h-5 w-5" />
              <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-amber-300" />
            </Link>
          </Button>

          {/* Cài đặt */}
          <Button
            asChild
            variant="ghost"
            size="icon"
            className="hidden md:inline-flex text-white hover:bg-white/10 hover:text-white"
            title="Cài đặt"
          >
            <Link href="/dashboard/settings">
              <Settings className="h-5 w-5" />
            </Link>
          </Button>

          {/* Người dùng */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded-full pl-1 pr-2 py-1 hover:bg-white/10 transition-colors">
                <Avatar className="h-9 w-9 border border-white/20">
                  <AvatarImage src={session?.user?.avatar} alt={session?.user?.name} />
                  <AvatarFallback className="bg-amber-400 text-amber-950 text-sm font-semibold">
                    {getInitials(session?.user?.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden lg:block text-left leading-tight">
                  <p className="text-sm font-semibold max-w-[180px] truncate">
                    {displayName || session?.user?.email}
                  </p>
                  {session?.user?.role && (
                    <p className="text-[10px] uppercase tracking-wide text-blue-200/80">
                      {session.user.role}
                    </p>
                  )}
                </div>
                <ChevronDown className="hidden lg:block h-4 w-4 text-blue-200/80" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{displayName || session?.user?.name}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {session?.user?.email}
                  </p>
                  {session?.user?.rank && (
                    <p className="text-xs leading-none text-primary">
                      {session.user.rank}
                    </p>
                  )}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/dashboard/profile">
                  <User className="mr-2 h-4 w-4" />
                  <span>{t('common.profile')}</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                <span>{t('common.logout')}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
