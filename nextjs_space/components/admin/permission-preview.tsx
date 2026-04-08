/**
 * Permission Preview - Preview sidebar khi chọn quyền cho chức vụ
 * 
 * TÍNH NĂNG:
 * - Hiển thị preview sidebar dựa trên danh sách function codes
 * - Real-time update khi thay đổi quyền
 * - Hiển thị menu groups và items sẽ được hiển thị
 */

'use client';

import { useMemo } from 'react';
import { previewSidebar, MenuGroup, MenuItem } from '@/lib/menu-config';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ChevronRight, Eye, EyeOff, Monitor } from 'lucide-react';

interface PermissionPreviewProps {
  functionCodes: string[];
  className?: string;
}

export function PermissionPreview({ functionCodes, className }: PermissionPreviewProps) {
  const previewMenu = useMemo(() => {
    return previewSidebar(functionCodes);
  }, [functionCodes]);

  const totalItems = useMemo(() => {
    return previewMenu.reduce((acc, group) => acc + group.items.length, 0);
  }, [previewMenu]);

  return (
    <Card className={cn('h-full', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Monitor className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Preview Sidebar</CardTitle>
          </div>
          <Badge variant="secondary">{totalItems} menu</Badge>
        </div>
        <CardDescription>
          Dự đoán menu sẽ hiển thị với {functionCodes.length} quyền đã chọn
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          {previewMenu.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <EyeOff className="h-8 w-8 mb-2" />
              <p className="text-sm">Không có menu nào hiển thị</p>
              <p className="text-xs">Vui lòng chọn ít nhất 1 quyền</p>
            </div>
          ) : (
            <div className="space-y-4">
              {previewMenu.map((group, idx) => (
                <PreviewGroup key={idx} group={group} />
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

function PreviewGroup({ group }: { group: MenuGroup }) {
  return (
    <div className="space-y-1">
      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        {group.title.replace('nav.', '').replace(/([A-Z])/g, ' $1').trim()}
      </h4>
      <div className="space-y-0.5 pl-2 border-l-2 border-muted">
        {group.items.map((item, idx) => (
          <PreviewItem key={idx} item={item} />
        ))}
      </div>
    </div>
  );
}

function PreviewItem({ item }: { item: MenuItem }) {
  const Icon = item.icon;
  return (
    <div className="flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-muted/50 transition-colors">
      <div className={cn(
        'h-6 w-6 rounded flex items-center justify-center',
        item.gradient ? `bg-gradient-to-br ${item.gradient} text-white` : 'bg-muted'
      )}>
        <Icon className="h-3 w-3" />
      </div>
      <span className="text-sm flex-1 truncate">
        {item.name.replace('nav.', '').replace(/([A-Z])/g, ' $1').trim()}
      </span>
      {item.badge && (
        <Badge variant="outline" className="text-[10px] h-5">
          {item.badge}
        </Badge>
      )}
      <ChevronRight className="h-3 w-3 text-muted-foreground" />
    </div>
  );
}

/**
 * Compact version for inline preview
 */
export function PermissionPreviewCompact({ functionCodes }: { functionCodes: string[] }) {
  const previewMenu = useMemo(() => previewSidebar(functionCodes), [functionCodes]);
  const totalItems = previewMenu.reduce((acc, g) => acc + g.items.length, 0);
  const groups = previewMenu.length;

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <Eye className="h-4 w-4" />
      <span>
        {groups} nhóm menu, {totalItems} mục
      </span>
    </div>
  );
}
