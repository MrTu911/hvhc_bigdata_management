'use client';

/**
 * SidebarPreviewTab - Xem trước Sidebar Menu theo Chức vụ
 *
 * Cho phép admin chọn một chức vụ và xem chính xác các menu item
 * mà chức vụ đó sẽ thấy sau khi qua filterMenu() của hệ thống.
 *
 * Reuses:
 * - previewSidebar() from lib/menu-config
 * - /api/admin/rbac/positions/[id] (đã có, trả functions[])
 * - useLanguage() để dịch nav.* keys
 */

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useLanguage } from '@/components/providers/language-provider';
import { previewSidebar, MenuGroup } from '@/lib/menu-config';
import {
  Eye, LayoutDashboard, ChevronDown, ChevronUp, Users,
  Shield, AlertCircle, ListChecks,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Position {
  id: string;
  code: string;
  name: string;
  positionScope: string;
  level: number;
  isActive: boolean;
  _count?: { positionFunctions: number; userPositions: number };
}

interface SidebarPreviewTabProps {
  positions: Position[];
}

// ─── Constants ───────────────────────────────────────────────────────────────

const SCOPE_CONFIG: Record<string, { label: string; badgeClass: string }> = {
  SELF:       { label: 'Cá nhân',    badgeClass: 'bg-slate-100 text-slate-700 border border-slate-300' },
  UNIT:       { label: 'Đơn vị',     badgeClass: 'bg-blue-100 text-blue-700 border border-blue-300' },
  DEPARTMENT: { label: 'Khoa/Phòng', badgeClass: 'bg-green-100 text-green-700 border border-green-300' },
  ACADEMY:    { label: 'Học viện',   badgeClass: 'bg-violet-100 text-violet-700 border border-violet-300' },
};

const GROUP_ACCENTS: Record<string, { dot: string; text: string; bg: string }> = {
  'nav.overview':          { dot: 'bg-violet-500', text: 'text-violet-700',  bg: 'bg-violet-50' },
  'nav.personalProfile':   { dot: 'bg-cyan-500',   text: 'text-cyan-700',    bg: 'bg-cyan-50' },
  'nav.personnelDatabase': { dot: 'bg-blue-500',   text: 'text-blue-700',    bg: 'bg-blue-50' },
  'nav.partyDatabase':     { dot: 'bg-red-500',    text: 'text-red-700',     bg: 'bg-red-50' },
  'nav.policyDatabase':    { dot: 'bg-orange-500', text: 'text-orange-700',  bg: 'bg-orange-50' },
  'nav.insuranceDatabase': { dot: 'bg-teal-500',   text: 'text-teal-700',    bg: 'bg-teal-50' },
  'nav.awardsDatabase':    { dot: 'bg-amber-500',  text: 'text-amber-700',   bg: 'bg-amber-50' },
  'nav.educationModule':   { dot: 'bg-emerald-500',text: 'text-emerald-700', bg: 'bg-emerald-50' },
  'nav.researchDatabase':  { dot: 'bg-cyan-500',   text: 'text-cyan-700',    bg: 'bg-cyan-50' },
  'nav.scienceDatabase':   { dot: 'bg-violet-500', text: 'text-violet-700',  bg: 'bg-violet-50' },
  'nav.analyticsReports':  { dot: 'bg-indigo-500', text: 'text-indigo-700',  bg: 'bg-indigo-50' },
  'nav.dataManagement':    { dot: 'bg-slate-500',  text: 'text-slate-700',   bg: 'bg-slate-100' },
  'nav.systemAdmin':       { dot: 'bg-rose-500',   text: 'text-rose-700',    bg: 'bg-rose-50' },
  'nav.settings':          { dot: 'bg-gray-400',   text: 'text-gray-600',    bg: 'bg-gray-100' },
};

// ─── Component ───────────────────────────────────────────────────────────────

export function SidebarPreviewTab({ positions }: SidebarPreviewTabProps) {
  const { t } = useLanguage();

  const [selectedPositionId, setSelectedPositionId] = useState<string>('');
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);
  const [functionCodes, setFunctionCodes] = useState<string[]>([]);
  const [previewGroups, setPreviewGroups] = useState<MenuGroup[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // Fetch function codes khi chọn chức vụ
  const loadPositionFunctions = useCallback(async (positionId: string) => {
    if (!positionId) {
      setFunctionCodes([]);
      setPreviewGroups([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/rbac/positions/${positionId}`);
      if (!res.ok) throw new Error('Không thể tải dữ liệu chức vụ');

      const data = await res.json();

      // API trả { position: {...}, functions: [{id, code, name, ...}], users: [...] }
      // functions là top-level field, không nằm trong position
      const codes: string[] = (data.functions ?? []).map(
        (f: { code: string }) => f.code
      );

      setFunctionCodes(codes);

      // Tính toán preview sidebar
      const groups = previewSidebar(codes);
      setPreviewGroups(groups);

      // Mặc định mở tất cả group
      setExpandedGroups(new Set(groups.map(g => g.title)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi không xác định');
      setFunctionCodes([]);
      setPreviewGroups([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Xử lý khi chọn chức vụ
  const handleSelectPosition = useCallback((posId: string) => {
    setSelectedPositionId(posId);
    const pos = positions.find(p => p.id === posId) ?? null;
    setSelectedPosition(pos);
    loadPositionFunctions(posId);
  }, [positions, loadPositionFunctions]);

  // Toggle group mở/đóng
  const toggleGroup = useCallback((title: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(title)) next.delete(title);
      else next.add(title);
      return next;
    });
  }, []);

  // Thống kê tổng
  const totalItems = previewGroups.reduce((sum, g) => sum + g.items.length, 0);
  const scopeMeta = selectedPosition
    ? SCOPE_CONFIG[selectedPosition.positionScope] ?? SCOPE_CONFIG.UNIT
    : null;

  // Sắp xếp positions theo level desc (cấp cao nhất trước)
  const sortedPositions = [...positions]
    .filter(p => p.isActive)
    .sort((a, b) => b.level - a.level);

  return (
    <div className="grid grid-cols-12 gap-5 items-start">

      {/* ── LEFT: Chọn chức vụ ────────────────────────────── */}
      <div className="col-span-12 lg:col-span-4 space-y-4">
        <Card className="shadow-sm">
          <CardHeader className="pb-3 px-4 pt-4">
            <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Shield className="h-4 w-4 text-indigo-500" />
              Chọn Chức vụ để Xem trước
            </CardTitle>
            <CardDescription className="text-xs">
              Chọn một chức vụ để xem chính xác menu sidebar mà người dùng sẽ thấy
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-3">
            <Select value={selectedPositionId} onValueChange={handleSelectPosition}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="-- Chọn chức vụ --" />
              </SelectTrigger>
              <SelectContent>
                {sortedPositions.map(pos => {
                  const scope = SCOPE_CONFIG[pos.positionScope] ?? SCOPE_CONFIG.UNIT;
                  return (
                    <SelectItem key={pos.id} value={pos.id}>
                      <div className="flex items-center gap-2">
                        <span>{pos.name}</span>
                        <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full font-medium', scope.badgeClass)}>
                          {scope.label}
                        </span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>

            {/* Thông tin chức vụ đã chọn */}
            {selectedPosition && (
              <div className="rounded-lg border bg-slate-50 p-3 space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 text-xs">Mã chức vụ</span>
                  <span className="font-mono text-xs font-semibold text-slate-700">
                    {selectedPosition.code}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 text-xs">Phạm vi</span>
                  <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', scopeMeta?.badgeClass)}>
                    {scopeMeta?.label}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 text-xs">Số quyền được gán</span>
                  <Badge variant="secondary" className="text-xs">
                    {functionCodes.length} function codes
                  </Badge>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 text-xs">Menu hiển thị</span>
                  <span className="font-medium text-xs text-indigo-700">
                    {previewGroups.length} nhóm / {totalItems} mục
                  </span>
                </div>
              </div>
            )}

            {!selectedPosition && (
              <div className="rounded-lg border border-dashed border-slate-200 p-6 flex flex-col items-center gap-2 text-slate-400">
                <Eye className="h-8 w-8 opacity-30" />
                <p className="text-xs text-center">Chọn một chức vụ để xem trước menu sidebar</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Giải thích */}
        <Card className="shadow-sm bg-blue-50 border-blue-200">
          <CardContent className="px-4 py-3">
            <div className="flex gap-2">
              <AlertCircle className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-blue-700 space-y-1">
                <p className="font-semibold">Lưu ý</p>
                <p>Kết quả preview phản ánh đúng logic <code className="bg-blue-100 px-1 rounded">filterMenu()</code> trong hệ thống thực.</p>
                <p>Menu item nào không yêu cầu quyền sẽ luôn hiện với tất cả chức vụ (Hồ sơ, Thông báo, Cài đặt).</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── RIGHT: Preview sidebar ──────────────────────── */}
      <div className="col-span-12 lg:col-span-8">
        <Card className="shadow-sm">
          <CardHeader className="pb-3 px-4 pt-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <LayoutDashboard className="h-4 w-4 text-indigo-500" />
                {selectedPosition
                  ? `Sidebar của: ${selectedPosition.name}`
                  : 'Xem trước Sidebar Menu'}
              </CardTitle>
              {selectedPosition && !isLoading && (
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs gap-1">
                    <ListChecks className="h-3 w-3" />
                    {previewGroups.length} nhóm
                  </Badge>
                  <Badge variant="outline" className="text-xs gap-1">
                    <Users className="h-3 w-3" />
                    {totalItems} mục
                  </Badge>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">

            {/* Loading */}
            {isLoading && (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-7 w-40" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                ))}
              </div>
            )}

            {/* Error */}
            {error && !isLoading && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-4 flex gap-2 items-center text-red-700 text-sm">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Empty — chưa chọn chức vụ */}
            {!selectedPosition && !isLoading && (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
                <LayoutDashboard className="h-12 w-12 opacity-20" />
                <p className="text-sm">Chưa chọn chức vụ</p>
                <p className="text-xs text-center max-w-xs">
                  Chọn một chức vụ ở bên trái để xem menu sidebar tương ứng
                </p>
              </div>
            )}

            {/* Preview content */}
            {!isLoading && !error && previewGroups.length > 0 && (
              <ScrollArea className="h-[560px] pr-2">
                <div className="space-y-2">
                  {previewGroups.map((group) => {
                    const accent = GROUP_ACCENTS[group.title] ?? {
                      dot: 'bg-slate-400', text: 'text-slate-700', bg: 'bg-slate-50',
                    };
                    const isExpanded = expandedGroups.has(group.title);

                    return (
                      <div key={group.title} className="rounded-lg border border-slate-200 overflow-hidden">
                        {/* Group header */}
                        <button
                          type="button"
                          onClick={() => toggleGroup(group.title)}
                          className={cn(
                            'w-full flex items-center justify-between px-3 py-2.5 transition-colors',
                            accent.bg,
                            'hover:brightness-95'
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <span className={cn('w-2 h-2 rounded-full', accent.dot)} />
                            <span className={cn('text-xs font-bold uppercase tracking-wider', accent.text)}>
                              {t(group.title)}
                            </span>
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                              {group.items.length}
                            </Badge>
                          </div>
                          {isExpanded
                            ? <ChevronUp className={cn('h-3.5 w-3.5', accent.text, 'opacity-60')} />
                            : <ChevronDown className={cn('h-3.5 w-3.5', accent.text, 'opacity-60')} />
                          }
                        </button>

                        {/* Group items */}
                        {isExpanded && (
                          <div className="divide-y divide-slate-100">
                            {group.items.map((item) => (
                              <div
                                key={item.href ?? item.name}
                                className="flex items-center gap-3 px-4 py-2.5 bg-white hover:bg-slate-50 transition-colors"
                              >
                                <item.icon className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <span className="text-sm text-slate-700 truncate block">
                                    {t(item.name)}
                                  </span>
                                  {item.href && (
                                    <span className="text-[10px] font-mono text-slate-400 truncate block">
                                      {item.href}
                                    </span>
                                  )}
                                </div>
                                {item.functions.length === 0 && (
                                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-slate-300 text-slate-500 flex-shrink-0">
                                    Mở
                                  </Badge>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            )}

            {/* Chức vụ không có quyền nào */}
            {!isLoading && !error && selectedPosition && previewGroups.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
                <AlertCircle className="h-10 w-10 opacity-30" />
                <p className="text-sm font-medium">Không có menu nào</p>
                <p className="text-xs text-center max-w-xs">
                  Chức vụ này chưa được gán function code nào, hoặc không có menu item khớp với các quyền đã gán.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
