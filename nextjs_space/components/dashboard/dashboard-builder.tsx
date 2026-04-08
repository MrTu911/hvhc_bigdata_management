/**
 * DASHBOARD BUILDER - UI kéo thả widgets
 * 
 * Features:
 * - Widget palette (sidebar trái)
 * - Grid layout (main area)
 * - Drag & drop widgets
 * - Save/load layouts
 */

'use client';

import { useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Plus,
  Save,
  RotateCcw,
  Trash2,
  Edit3,
  Eye,
  Layout,
  Palette,
  Settings,
  Check,
  X,
} from 'lucide-react';
import { usePermissions } from '@/hooks/use-permissions';
import { useDashboardStore } from '@/lib/dashboard/dashboard-store';
import {
  WIDGET_REGISTRY,
  getAvailableWidgets,
  getAvailableModules,
  MODULE_INFO,
  type WidgetConfig,
  type DashboardLayout,
} from '@/lib/dashboard/widget-registry';
import { WidgetRenderer } from './widget-renderer';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export function DashboardBuilder() {
  const { permissions, isAdmin, isLoading } = usePermissions();
  const {
    currentLayout,
    isEditing,
    toggleEditMode,
    addWidget,
    removeWidget,
    resetToDefault,
    setCurrentLayout,
    saveLayout,
  } = useDashboardStore();

  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [layoutName, setLayoutName] = useState('');
  const [layoutDescription, setLayoutDescription] = useState('');
  const [selectedModule, setSelectedModule] = useState<string | null>(null);

  // Lấy danh sách widgets có thể sử dụng
  const userFunctions = useMemo(() => {
    if (isAdmin) {
      return new Set(WIDGET_REGISTRY.map(w => w.requiredFunction));
    }
    return new Set(permissions?.functionCodes || []);
  }, [permissions, isAdmin]);

  const availableWidgets = useMemo(() => {
    return getAvailableWidgets(userFunctions);
  }, [userFunctions]);

  const availableModules = useMemo(() => {
    return getAvailableModules(userFunctions);
  }, [userFunctions]);

  // Widgets đã sử dụng trong layout hiện tại
  const usedWidgetIds = useMemo(() => {
    return new Set(currentLayout?.widgets.map(w => w.widgetId) || []);
  }, [currentLayout]);

  // Widget chưa sử dụng
  const unusedWidgets = useMemo(() => {
    const moduleWidgets = selectedModule 
      ? availableWidgets.filter(w => w.module === selectedModule)
      : availableWidgets;
    return moduleWidgets.filter(w => !usedWidgetIds.has(w.id));
  }, [availableWidgets, usedWidgetIds, selectedModule]);

  // Handle add widget
  const handleAddWidget = useCallback((widget: WidgetConfig) => {
    // Tìm vị trí trống
    const existingWidgets = currentLayout?.widgets || [];
    let y = 0;
    if (existingWidgets.length > 0) {
      const maxY = Math.max(...existingWidgets.map(w => w.y + w.h));
      y = maxY;
    }
    addWidget(widget.id, 0, y);
    toast.success(`Đã thêm widget: ${widget.name}`);
  }, [currentLayout, addWidget]);

  // Handle save layout
  const handleSaveLayout = () => {
    if (!currentLayout) return;
    
    const newLayout: DashboardLayout = {
      ...currentLayout,
      id: layoutName.toLowerCase().replace(/\s+/g, '-') || 'custom-' + Date.now(),
      name: layoutName || 'Dashboard tùy chỉnh',
      description: layoutDescription || 'Layout do người dùng tạo',
      createdAt: new Date(),
    };
    
    saveLayout(newLayout);
    setCurrentLayout(newLayout);
    setShowSaveDialog(false);
    setLayoutName('');
    setLayoutDescription('');
    toast.success('Lưu layout thành công!');
  };

  // Handle reset
  const handleReset = () => {
    resetToDefault(Array.from(userFunctions));
    toast.info('Đã khôi phục layout mặc định');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex h-full gap-4">
      {/* === LEFT SIDEBAR - Widget Palette === */}
      {isEditing && (
        <Card className="w-80 shrink-0">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Widget Library
            </CardTitle>
            <CardDescription>
              Kéo thả widget vào dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="w-full justify-start px-4 mb-2">
                <TabsTrigger value="all" onClick={() => setSelectedModule(null)}>Tất cả</TabsTrigger>
                <TabsTrigger value="modules">Theo CSDL</TabsTrigger>
              </TabsList>
              
              <TabsContent value="all" className="mt-0">
                <ScrollArea className="h-[calc(100vh-320px)]">
                  <div className="p-4 space-y-2">
                    {unusedWidgets.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Đã sử dụng tất cả widgets
                      </p>
                    ) : (
                      unusedWidgets.map(widget => (
                        <WidgetPaletteItem
                          key={widget.id}
                          widget={widget}
                          onAdd={() => handleAddWidget(widget)}
                        />
                      ))
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="modules" className="mt-0">
                <ScrollArea className="h-[calc(100vh-320px)]">
                  <Accordion type="single" collapsible className="px-4">
                    {availableModules.map(module => {
                      const info = MODULE_INFO[module];
                      const moduleWidgets = availableWidgets.filter(
                        w => w.module === module && !usedWidgetIds.has(w.id)
                      );
                      const Icon = info?.icon;
                      
                      return (
                        <AccordionItem key={module} value={module}>
                          <AccordionTrigger className="hover:no-underline">
                            <div className="flex items-center gap-2">
                              {Icon && (
                                <div className={cn('p-1.5 rounded-md bg-gradient-to-br', info?.color)}>
                                  <Icon className="h-4 w-4 text-white" />
                                </div>
                              )}
                              <span>{info?.name || module}</span>
                              <Badge variant="secondary" className="ml-2">
                                {moduleWidgets.length}
                              </Badge>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="space-y-2 pl-2">
                              {moduleWidgets.length === 0 ? (
                                <p className="text-xs text-muted-foreground py-2">
                                  Đã sử dụng hết
                                </p>
                              ) : (
                                moduleWidgets.map(widget => (
                                  <WidgetPaletteItem
                                    key={widget.id}
                                    widget={widget}
                                    onAdd={() => handleAddWidget(widget)}
                                    compact
                                  />
                                ))
                              )}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      );
                    })}
                  </Accordion>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* === MAIN AREA - Dashboard Grid === */}
      <div className="flex-1 space-y-4">
        {/* Toolbar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">
              {currentLayout?.name || 'Dashboard'}
            </h2>
            {isEditing && (
              <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                <Edit3 className="h-3 w-3 mr-1" /> Chế độ chỉnh sửa
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <Button variant="outline" size="sm" onClick={handleReset}>
                  <RotateCcw className="h-4 w-4 mr-1" /> Reset
                </Button>
                <Button variant="outline" size="sm" onClick={() => setShowSaveDialog(true)}>
                  <Save className="h-4 w-4 mr-1" /> Lưu
                </Button>
                <Button size="sm" onClick={toggleEditMode}>
                  <Check className="h-4 w-4 mr-1" /> Xong
                </Button>
              </>
            ) : (
              <Button variant="outline" size="sm" onClick={toggleEditMode}>
                <Edit3 className="h-4 w-4 mr-1" /> Chỉnh sửa
              </Button>
            )}
          </div>
        </div>

        {/* Widget Grid */}
        <div className="grid grid-cols-12 gap-4 auto-rows-[120px]">
          {currentLayout?.widgets.map((item) => {
            const widget = WIDGET_REGISTRY.find(w => w.id === item.widgetId);
            if (!widget) return null;
            
            // Convert size to grid spans
            const colSpan = item.w || 3;
            const rowSpan = item.h || 1;
            
            return (
              <div
                key={item.widgetId}
                className={cn(
                  'transition-all',
                  isEditing && 'hover:ring-2 hover:ring-primary/50'
                )}
                style={{
                  gridColumn: `span ${colSpan}`,
                  gridRow: `span ${rowSpan}`,
                }}
              >
                <WidgetRenderer
                  widget={widget}
                  isEditing={isEditing}
                  onRemove={() => removeWidget(item.widgetId)}
                  className="h-full"
                />
              </div>
            );
          })}

          {/* Empty state */}
          {(!currentLayout?.widgets || currentLayout.widgets.length === 0) && (
            <div className="col-span-12 flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-lg">
              <Layout className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">Chưa có widget nào</p>
              <Button onClick={toggleEditMode}>
                <Plus className="h-4 w-4 mr-1" /> Thêm widget
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Save Layout Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Lưu Layout Dashboard</DialogTitle>
            <DialogDescription>
              Đặt tên và mô tả cho layout của bạn
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="layoutName">Tên Layout</Label>
              <Input
                id="layoutName"
                placeholder="VD: Dashboard Ban Giám đốc"
                value={layoutName}
                onChange={(e) => setLayoutName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="layoutDesc">Mô tả</Label>
              <Input
                id="layoutDesc"
                placeholder="Mô tả ngắn gọn..."
                value={layoutDescription}
                onChange={(e) => setLayoutDescription(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
              Hủy
            </Button>
            <Button onClick={handleSaveLayout}>
              <Save className="h-4 w-4 mr-1" /> Lưu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Widget Palette Item Component
function WidgetPaletteItem({
  widget,
  onAdd,
  compact = false,
}: {
  widget: WidgetConfig;
  onAdd: () => void;
  compact?: boolean;
}) {
  const Icon = widget.icon;
  
  return (
    <div
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 cursor-pointer transition-colors group',
        compact && 'p-2'
      )}
      onClick={onAdd}
    >
      <div className={cn('p-2 rounded-lg bg-gradient-to-br shrink-0', widget.color)}>
        <Icon className={cn('text-white', compact ? 'h-4 w-4' : 'h-5 w-5')} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn('font-medium truncate', compact && 'text-sm')}>
          {widget.name}
        </p>
        {!compact && (
          <p className="text-xs text-muted-foreground truncate">
            {widget.description}
          </p>
        )}
      </div>
      <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
}
