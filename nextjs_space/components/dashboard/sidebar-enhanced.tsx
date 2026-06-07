/**
 * Enhanced Dashboard Sidebar
 * 
 * v8.4 OPTIMIZATION:
 * - Dùng session.user.functionCodes trực tiếp (từ JWT, instant)
 * - usePermissions() chỉ bổ sung thêm scope/positions data
 * - Giảm API call, tăng tốc render
 * - Chức năng thu gọn từng nhóm menu (collapsible groups)
 * - Lưu trạng thái vào localStorage
 * - Sửa lỗi icon màu trắng không nhìn thấy
 */
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/components/providers/language-provider';
import { useMemo, useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { usePermissions } from '@/hooks/use-permissions';
import { MENU_CONFIG, filterMenu, flattenMenuItems, MenuItem } from '@/lib/menu-config';
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Menu,
  ChevronsUpDown,
} from 'lucide-react';

// Re-export types for compatibility
interface NavItem extends MenuItem {}

// Auto-collapse timeout in milliseconds (30 seconds)
const IDLE_TIMEOUT = 30000;

// LocalStorage key for collapsed groups (gồm cả group cấp 1 và sub-section cấp 2)
const COLLAPSED_GROUPS_KEY = 'sidebar_collapsed_groups';

// Một item là sub-section (nhóm con cấp 2) khi có children và không có href trực tiếp.
function isSubSection(item: MenuItem): boolean {
  return Array.isArray(item.children) && item.children.length > 0;
}

/**
 * Tìm đường dẫn các sub-section chứa item đang active (href === pathname).
 * Trả về mảng tên sub-section trên đường đi, hoặc null nếu không thuộc group này.
 */
function findActiveSubsectionPath(items: MenuItem[], pathname: string): string[] | null {
  for (const item of items) {
    if (item.href === pathname) return [];
    if (item.children && item.children.length > 0) {
      const sub = findActiveSubsectionPath(item.children, pathname);
      if (sub) return [item.name, ...sub];
    }
  }
  return null;
}

export function DashboardSidebarEnhanced() {
  const pathname = usePathname();
  const { t } = useLanguage();
  const { data: session, status } = useSession() || {};
  
  // v8.3: Lấy functionCodes trực tiếp từ session (instant, no API call)
  const sessionFunctionCodes = session?.user?.functionCodes || [];
  const sessionPrimaryPosition = session?.user?.primaryPositionCode;
  
  const { isAdmin, permissions, isLoading, isApiLoaded } = usePermissions();
  
  // Sidebar collapse state
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  // Mobile menu state
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  
  // Collapsed groups state - lưu các nhóm đã thu gọn
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  
  // Load collapsed groups from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(COLLAPSED_GROUPS_KEY);
      if (saved) {
        setCollapsedGroups(new Set(JSON.parse(saved)));
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);
  
  // Save collapsed groups to localStorage
  const saveCollapsedGroups = useCallback((groups: Set<string>) => {
    try {
      localStorage.setItem(COLLAPSED_GROUPS_KEY, JSON.stringify(Array.from(groups)));
    } catch {
      // Ignore localStorage errors
    }
  }, []);
  
  // Toggle group collapse
  const toggleGroup = useCallback((groupTitle: string) => {
    setCollapsedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupTitle)) {
        newSet.delete(groupTitle);
      } else {
        newSet.add(groupTitle);
      }
      saveCollapsedGroups(newSet);
      return newSet;
    });
  }, [saveCollapsedGroups]);
  
  // Expand all groups
  const expandAllGroups = useCallback(() => {
    setCollapsedGroups(new Set());
    saveCollapsedGroups(new Set());
  }, [saveCollapsedGroups]);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);
  
  // Auto-expand group + sub-section containing current page (đệ quy children)
  useEffect(() => {
    if (!pathname) return;
    for (const group of MENU_CONFIG) {
      const subPath = findActiveSubsectionPath(group.items, pathname);
      if (subPath === null) continue;

      // Các key cần mở: group cấp 1 + tất cả sub-section trên đường đi
      const keysToOpen = [group.title, ...subPath];
      const needOpen = keysToOpen.some(k => collapsedGroups.has(k));
      if (needOpen) {
        setCollapsedGroups(prev => {
          const newSet = new Set(prev);
          keysToOpen.forEach(k => newSet.delete(k));
          saveCollapsedGroups(newSet);
          return newSet;
        });
      }
      break;
    }
  }, [pathname, saveCollapsedGroups]);

  // Auto-collapse when idle
  useEffect(() => {
    let idleTimer: NodeJS.Timeout;

    const resetIdleTimer = () => {
      clearTimeout(idleTimer);
      // Only expand if user is interacting with the sidebar area
      idleTimer = setTimeout(() => {
        if (!isHovering) {
          setIsCollapsed(true);
        }
      }, IDLE_TIMEOUT);
    };

    // Listen for user activity
    const events = ['mousemove', 'mousedown', 'keypress', 'touchstart', 'scroll'];
    events.forEach(event => {
      document.addEventListener(event, resetIdleTimer);
    });

    // Initial timer
    resetIdleTimer();

    return () => {
      clearTimeout(idleTimer);
      events.forEach(event => {
        document.removeEventListener(event, resetIdleTimer);
      });
    };
  }, [isHovering]);

  // Expand on hover
  const handleMouseEnter = useCallback(() => {
    setIsHovering(true);
    setIsCollapsed(false);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovering(false);
  }, []);

  // ============================================================================
  // Lọc menu theo quyền — v8.9
  // - Ưu tiên API data (isApiLoaded=true): phản ánh RBAC thực tế sau mọi thay đổi
  // - Fallback JWT chỉ khi API chưa load lần đầu
  // ============================================================================
  const filteredNavigationGroups = useMemo(() => {
    // Case 1: Chưa đăng nhập → chỉ hiện trang chủ
    if (status !== 'authenticated' || !session?.user) {
      return MENU_CONFIG
        .map(g => ({ ...g, items: g.items.filter(i => i.href === '/') }))
        .filter(g => g.items.length > 0);
    }

    // Case 2: Admin (SYSTEM_ADMIN position) → thấy tất cả
    // Check từ session trước (instant)
    if (sessionPrimaryPosition === 'SYSTEM_ADMIN' || isAdmin) {
      return MENU_CONFIG;
    }

    // Case 3: User bình thường
    // Khi API đã load (isApiLoaded=true): dùng API data kể cả khi rỗng (permissions bị thu hồi)
    // Khi API chưa load: dùng JWT session làm placeholder tạm thời
    const functionCodes = isApiLoaded
      ? (permissions?.functionCodes || [])  // API wins — phản ánh RBAC thực tế
      : sessionFunctionCodes;               // JWT fallback chỉ khi API chưa về
    
    // Nếu không có functionCodes và đang loading → menu tối thiểu
    if (functionCodes.length === 0 && isLoading) {
      return MENU_CONFIG
        .map(g => ({
          ...g,
          items: g.items.filter(i => 
            i.href === '/' || 
            i.href === '/dashboard' || 
            i.href === '/dashboard/profile'
          ),
        }))
        .filter(g => g.items.length > 0);
    }

    // Filter theo functionCodes
    const userFunctions = new Set(functionCodes);
    return filterMenu(MENU_CONFIG, userFunctions, false);
  }, [status, session?.user, sessionPrimaryPosition, sessionFunctionCodes, isAdmin, permissions?.functionCodes, isLoading, isApiLoaded]);

  // Collapse all groups - định nghĩa sau filteredNavigationGroups
  const collapseAllGroups = useCallback(() => {
    const allGroups = new Set(filteredNavigationGroups.map(g => g.title));
    setCollapsedGroups(allGroups);
    saveCollapsedGroups(allGroups);
  }, [filteredNavigationGroups, saveCollapsedGroups]);

  const renderNavItem = (item: NavItem, indented: boolean = false) => {
    const Icon = item.icon;
    const isActive = pathname === item.href;

    return (
      <Link
        key={item.href}
        href={item.href || '#'}
        className={cn(
          'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
          'hover:scale-[1.02]',
          isActive
            ? item.gradient
              ? `bg-gradient-to-r ${item.gradient} text-white shadow-lg shadow-primary/20`
              : 'bg-primary text-primary-foreground shadow-lg'
            : 'text-foreground hover:bg-gradient-to-r hover:from-primary/10 hover:to-primary/5',
          // Item nằm trong sub-section: thụt lề nhẹ để thấy phân cấp
          !isCollapsed && indented && 'ml-2.5 pl-2 border-l border-border/40',
          isCollapsed && 'justify-center px-2'
        )}
        title={isCollapsed ? t(item.name) : undefined}
      >
        <div className={cn(
          'h-8 w-8 rounded-lg flex items-center justify-center transition-all flex-shrink-0',
          isActive && item.gradient
            ? 'bg-white/30 shadow-inner' // Tăng độ đậm của nền trắng khi active
            : item.gradient
              ? `bg-gradient-to-br ${item.gradient} shadow-md`
              : 'bg-slate-200 dark:bg-slate-700' // Nền rõ ràng hơn cho icon không có gradient
        )}>
          <Icon className={cn(
            'h-4 w-4',
            // FIX v8.5: Sử dụng màu có độ tương phản cao cho tất cả trường hợp
            isActive && item.gradient
              ? 'text-white drop-shadow-sm' // Icon trắng với bóng đổ khi active
              : item.gradient
                ? 'text-white drop-shadow-sm' // Icon trắng với bóng đổ cho gradient
                : 'text-slate-700 dark:text-slate-200' // Màu tối/sáng cho icon không có gradient
          )} />
        </div>
        {!isCollapsed && (
          <>
            <span className="flex-1 truncate">{t(item.name)}</span>
            {item.badge && (
              <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                {item.badge}
              </span>
            )}
          </>
        )}
      </Link>
    );
  };

  // Render một sub-section (nhóm con cấp 2): header thu/mở + danh sách item lá
  const renderSubSection = (sub: NavItem) => {
    const SubIcon = sub.icon;
    const isSubCollapsed = collapsedGroups.has(sub.name);
    const children = sub.children ?? [];

    // Sidebar thu gọn (icon-only): bỏ header, render phẳng các item lá
    if (isCollapsed) {
      return (
        <div key={sub.name} className="space-y-1">
          {flattenMenuItems(children).map(leaf => renderNavItem(leaf))}
        </div>
      );
    }

    return (
      <div key={sub.name} className="space-y-1">
        <button
          onClick={() => toggleGroup(sub.name)}
          className="w-full flex items-center justify-between px-2.5 py-1 rounded-md hover:bg-muted/50 transition-colors group/sub"
        >
          <div className="flex items-center gap-2 min-w-0">
            <SubIcon className="h-3.5 w-3.5 text-muted-foreground/70 flex-shrink-0" />
            <span className={cn(
              'text-[11px] font-semibold truncate',
              isSubCollapsed ? 'text-muted-foreground/50' : 'text-muted-foreground'
            )}>
              {t(sub.name)}
            </span>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <span className="text-[9px] text-muted-foreground/40 opacity-0 group-hover/sub:opacity-100">
              {children.length}
            </span>
            {isSubCollapsed
              ? <ChevronDown className="h-3 w-3 text-muted-foreground/40" />
              : <ChevronUp className="h-3 w-3 text-muted-foreground/40" />}
          </div>
        </button>
        <div className={cn(
          'space-y-1 overflow-hidden transition-all duration-200',
          isSubCollapsed ? 'max-h-0 opacity-0' : 'max-h-[2000px] opacity-100'
        )}>
          {children.map(child => renderNavItem(child, true))}
        </div>
      </div>
    );
  };

  // Dispatcher: sub-section → accordion con; item lá → link
  const renderMenuItem = (item: NavItem) => (
    isSubSection(item) ? renderSubSection(item) : renderNavItem(item)
  );

  // Color accent per group
  const GROUP_ACCENTS: Record<string, { dot: string; text: string; bg: string }> = {
    // Tổng quan
    'nav.overview':               { dot: 'bg-violet-500',  text: 'text-violet-600',  bg: 'hover:bg-violet-50/60' },
    // Cá nhân
    'nav.personalSpace':          { dot: 'bg-cyan-500',    text: 'text-cyan-600',    bg: 'hover:bg-cyan-50/60' },
    'nav.myLearning':             { dot: 'bg-blue-400',    text: 'text-blue-500',    bg: 'hover:bg-blue-50/60' },
    'nav.myResearchSpace':        { dot: 'bg-indigo-400',  text: 'text-indigo-500',  bg: 'hover:bg-indigo-50/60' },
    // Nghiệp vụ
    'nav.personnelDatabase':      { dot: 'bg-blue-500',    text: 'text-blue-600',    bg: 'hover:bg-blue-50/60' },
    'nav.partyDatabase':          { dot: 'bg-red-500',     text: 'text-red-600',     bg: 'hover:bg-red-50/60' },
    'nav.policyDatabase':         { dot: 'bg-orange-500',  text: 'text-orange-600',  bg: 'hover:bg-orange-50/60' },
    'nav.policyWelfareAwards':    { dot: 'bg-amber-500',   text: 'text-amber-600',   bg: 'hover:bg-amber-50/60' },
    'nav.insuranceDatabase':      { dot: 'bg-teal-500',    text: 'text-teal-600',    bg: 'hover:bg-teal-50/60' },
    'nav.awardsDatabase':         { dot: 'bg-amber-500',   text: 'text-amber-600',   bg: 'hover:bg-amber-50/60' },
    // Giáo dục - Đào tạo
    'nav.educationModule':        { dot: 'bg-emerald-500', text: 'text-emerald-600', bg: 'hover:bg-emerald-50/60' },
    'nav.educationOverviewGroup': { dot: 'bg-blue-500',    text: 'text-blue-600',    bg: 'hover:bg-blue-50/60' },
    'nav.facultyManagementGroup': { dot: 'bg-violet-500',  text: 'text-violet-600',  bg: 'hover:bg-violet-50/60' },
    'nav.trainingSystemGroup':    { dot: 'bg-indigo-500',  text: 'text-indigo-600',  bg: 'hover:bg-indigo-50/60' },
    'nav.studentManagementGroup': { dot: 'bg-sky-500',     text: 'text-sky-600',     bg: 'hover:bg-sky-50/60' },
    'nav.educationProgramGroup':  { dot: 'bg-purple-500',  text: 'text-purple-600',  bg: 'hover:bg-purple-50/60' },
    // Nghiên cứu
    'nav.researchDatabase':       { dot: 'bg-cyan-500',    text: 'text-cyan-600',    bg: 'hover:bg-cyan-50/60' },
    'nav.scienceDatabase':        { dot: 'bg-violet-500',  text: 'text-violet-600',  bg: 'hover:bg-violet-50/60' },
    // IA v9 — nhóm cấp 1 mới
    'nav.educationDatabase':      { dot: 'bg-emerald-500', text: 'text-emerald-600', bg: 'hover:bg-emerald-50/60' },
    'nav.scienceTech':            { dot: 'bg-violet-500',  text: 'text-violet-600',  bg: 'hover:bg-violet-50/60' },
    'nav.analyticsAI':            { dot: 'bg-indigo-500',  text: 'text-indigo-600',  bg: 'hover:bg-indigo-50/60' },
    'nav.workflowDocuments':      { dot: 'bg-violet-400',  text: 'text-violet-500',  bg: 'hover:bg-violet-50/60' },
    'nav.bigdataInfra':           { dot: 'bg-slate-600',   text: 'text-slate-700',   bg: 'hover:bg-slate-100/60' },
    // Mẫu biểu & Xuất
    'nav.templateExport':         { dot: 'bg-blue-400',    text: 'text-blue-500',    bg: 'hover:bg-blue-50/60' },
    // AI & Phân tích
    'nav.analyticsReports':       { dot: 'bg-indigo-500',  text: 'text-indigo-600',  bg: 'hover:bg-indigo-50/60' },
    // Hạ tầng & Dữ liệu (tách 3 nhóm)
    'nav.dataManagement':         { dot: 'bg-slate-500',   text: 'text-slate-600',   bg: 'hover:bg-slate-100/60' },
    'nav.infrastructureGroup':    { dot: 'bg-slate-600',   text: 'text-slate-700',   bg: 'hover:bg-slate-100/60' },
    'nav.workflowDocGroup':       { dot: 'bg-violet-400',  text: 'text-violet-500',  bg: 'hover:bg-violet-50/60' },
    'nav.securityGovernanceGroup':{ dot: 'bg-rose-500',    text: 'text-rose-600',    bg: 'hover:bg-rose-50/60' },
    // Quản trị & Cài đặt
    'nav.systemAdmin':            { dot: 'bg-rose-500',    text: 'text-rose-600',    bg: 'hover:bg-rose-50/60' },
    'nav.settings':               { dot: 'bg-gray-400',    text: 'text-gray-500',    bg: 'hover:bg-gray-100/60' },
  };

  // Render group header with collapse toggle
  const renderGroupHeader = (group: { title: string; items: MenuItem[] }, isMobile: boolean = false) => {
    const isGroupCollapsed = collapsedGroups.has(group.title);
    const accent = GROUP_ACCENTS[group.title] ?? { dot: 'bg-slate-400', text: 'text-slate-500', bg: 'hover:bg-slate-50/60' };
    // Đếm số mục thực (item lá), không tính sub-section header
    const leafCount = flattenMenuItems(group.items).length;

    // Khi sidebar thu gọn, không hiển thị header
    if (isCollapsed && !isMobile) {
      return <div className="h-px bg-border/50 mx-3 my-1" />;
    }

    return (
      <button
        onClick={() => toggleGroup(group.title)}
        className={cn(
          'w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg transition-all',
          accent.bg,
          'group cursor-pointer'
        )}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', accent.dot)} />
          <h3 className={cn(
            'text-[11px] font-bold uppercase tracking-widest truncate',
            isGroupCollapsed ? 'text-muted-foreground/50' : accent.text
          )}>
            {t(group.title)}
          </h3>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className={cn(
            'text-[10px] font-medium px-1.5 py-0.5 rounded-full transition-opacity',
            isGroupCollapsed
              ? 'opacity-0 group-hover:opacity-100 bg-muted text-muted-foreground'
              : `opacity-0 group-hover:opacity-100 ${accent.text} bg-current/10`
          )}>
            {leafCount}
          </span>
          {isGroupCollapsed ? (
            <ChevronDown className={cn('h-3 w-3 transition-colors', isGroupCollapsed ? 'text-muted-foreground/40' : accent.text)} />
          ) : (
            <ChevronUp className={cn('h-3 w-3 transition-colors', accent.text, 'opacity-60 group-hover:opacity-100')} />
          )}
        </div>
      </button>
    );
  };

  return (
    <>
      {/* Mobile Menu Toggle Button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 h-10 w-10 rounded-lg bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:bg-primary/90 transition-colors"
        aria-label="Toggle menu"
      >
        {isMobileOpen ? (
          <ChevronLeft className="h-5 w-5" />
        ) : (
          <Menu className="h-5 w-5" />
        )}
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside 
        className={cn(
          'lg:hidden fixed inset-y-0 left-0 z-50 w-72 bg-gradient-to-b from-background to-muted/20 border-r shadow-xl transform transition-transform duration-300 ease-in-out overflow-y-auto',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        style={{ paddingTop: 'var(--top-chrome-h)' }}
      >
        {/* Mobile: Expand/Collapse All Button */}
        <div className="flex items-center justify-end gap-2 px-4 py-2 border-b">
          <button
            onClick={expandAllGroups}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            title="Mở tất cả"
          >
            <ChevronDown className="h-3 w-3" />
            <span>Mở</span>
          </button>
          <span className="text-muted-foreground/30">|</span>
          <button
            onClick={collapseAllGroups}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            title="Thu tất cả"
          >
            <ChevronUp className="h-3 w-3" />
            <span>Thu</span>
          </button>
        </div>
        
        <nav className="flex flex-col gap-0.5 p-3">
          {filteredNavigationGroups.map((group, idx) => {
            const isGroupCollapsed = collapsedGroups.has(group.title);
            return (
              <div key={group.title} className={cn('space-y-0.5', idx > 0 && 'mt-2')}>
                {renderGroupHeader(group, true)}
                <div 
                  className={cn(
                    'space-y-1 overflow-hidden transition-all duration-200',
                    isGroupCollapsed ? 'max-h-0 opacity-0' : 'max-h-[2000px] opacity-100'
                  )}
                >
                  {group.items.map(item => renderMenuItem(item))}
                </div>
              </div>
            );
          })}
        </nav>
      </aside>

      {/* Desktop Sidebar */}
      <aside 
        className={cn(
          'hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:block lg:overflow-y-auto lg:border-r lg:bg-gradient-to-b from-background to-muted/20 backdrop-blur-xl transition-all duration-300 ease-in-out',
          isCollapsed ? 'lg:w-20' : 'lg:w-64'
        )}
        style={{ paddingTop: 'var(--top-chrome-h)' }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Toggle Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-20 z-50 h-6 w-6 rounded-full border bg-background shadow-md flex items-center justify-center hover:bg-muted transition-colors"
          title={isCollapsed ? 'Mở rộng menu' : 'Thu gọn menu'}
        >
          {isCollapsed ? (
            <ChevronRight className="h-3 w-3" />
          ) : (
            <ChevronLeft className="h-3 w-3" />
          )}
        </button>
        
        {/* Desktop: Expand/Collapse All - chỉ hiện khi sidebar mở */}
        {!isCollapsed && (
          <div className="flex items-center justify-end gap-2 px-4 py-2 border-b mx-2">
            <button
              onClick={expandAllGroups}
              className="text-[10px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-0.5"
              title="Mở tất cả nhóm"
            >
              <ChevronDown className="h-3 w-3" />
              <span>Mở</span>
            </button>
            <span className="text-muted-foreground/30">|</span>
            <button
              onClick={collapseAllGroups}
              className="text-[10px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-0.5"
              title="Thu tất cả nhóm"
            >
              <ChevronUp className="h-3 w-3" />
              <span>Thu</span>
            </button>
          </div>
        )}

        <nav className="flex flex-col gap-0.5 p-3">
          {filteredNavigationGroups.map((group, idx) => {
            const isGroupCollapsed = collapsedGroups.has(group.title);
            return (
              <div key={group.title} className={cn('space-y-0.5', idx > 0 && 'mt-2')}>
                {renderGroupHeader(group, false)}
                <div 
                  className={cn(
                    'space-y-1 overflow-hidden transition-all duration-200',
                    // Khi sidebar collapsed, luôn hiện items
                    isCollapsed 
                      ? 'max-h-[2000px] opacity-100'
                      : isGroupCollapsed 
                        ? 'max-h-0 opacity-0' 
                        : 'max-h-[2000px] opacity-100'
                  )}
                >
                  {group.items.map(item => renderMenuItem(item))}
                </div>
              </div>
            );
          })}
        </nav>
        
        {/* Collapse indicator when collapsed */}
        {isCollapsed && (
          <div className="absolute bottom-4 left-0 right-0 flex justify-center">
            <div className="text-xs text-muted-foreground/50 flex flex-col items-center gap-1">
              <ChevronsUpDown className="h-4 w-4" />
            </div>
          </div>
        )}
      </aside>
    </>
  );
}