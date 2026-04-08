/**
 * ADMIN DASHBOARD MANAGEMENT - Quản lý Dashboard cho Admin
 * 
 * Features:
 * - Xem tất cả widgets có sẵn
 * - Tạo template dashboard cho các chức vụ
 * - Xem trước dashboard theo quyền
 */

'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  LayoutDashboard,
  Blocks,
  Eye,
  Search,
  Filter,
  Plus,
} from 'lucide-react';
import {
  WIDGET_REGISTRY,
  MODULE_INFO,
  type WidgetConfig,
} from '@/lib/dashboard/widget-registry';
import { WidgetRenderer } from '@/components/dashboard/widget-renderer';
import { usePermissions } from '@/hooks/use-permissions';
import { cn } from '@/lib/utils';

export default function DashboardManagementPage() {
  const { isAdmin } = usePermissions();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [selectedWidgets, setSelectedWidgets] = useState<Set<string>>(new Set());
  const [previewMode, setPreviewMode] = useState(false);

  // Lấy danh sách modules
  const modules = useMemo(() => {
    return Object.keys(MODULE_INFO);
  }, []);

  // Lọc widgets
  const filteredWidgets = useMemo(() => {
    return WIDGET_REGISTRY.filter(widget => {
      const matchesSearch = searchTerm === '' || 
        widget.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        widget.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesModule = !selectedModule || widget.module === selectedModule;
      
      return matchesSearch && matchesModule;
    });
  }, [searchTerm, selectedModule]);

  // Group widgets by module
  const widgetsByModule = useMemo(() => {
    const grouped: Record<string, WidgetConfig[]> = {};
    filteredWidgets.forEach(widget => {
      if (!grouped[widget.module]) {
        grouped[widget.module] = [];
      }
      grouped[widget.module].push(widget);
    });
    return grouped;
  }, [filteredWidgets]);

  // Toggle widget selection
  const toggleWidget = (widgetId: string) => {
    const newSet = new Set(selectedWidgets);
    if (newSet.has(widgetId)) {
      newSet.delete(widgetId);
    } else {
      newSet.add(widgetId);
    }
    setSelectedWidgets(newSet);
  };

  // Select all widgets from a module
  const selectAllFromModule = (module: string) => {
    const moduleWidgets = WIDGET_REGISTRY.filter(w => w.module === module);
    const newSet = new Set(selectedWidgets);
    moduleWidgets.forEach(w => newSet.add(w.id));
    setSelectedWidgets(newSet);
  };

  // Preview selected widgets
  const selectedWidgetConfigs = useMemo(() => {
    return WIDGET_REGISTRY.filter(w => selectedWidgets.has(w.id));
  }, [selectedWidgets]);

  if (!isAdmin) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Bạn không có quyền truy cập trang này</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <LayoutDashboard className="h-6 w-6" />
            Quản lý Dashboard Widgets
          </h1>
          <p className="text-muted-foreground mt-1">
            Xem và quản lý tất cả {WIDGET_REGISTRY.length} widgets của hệ thống
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">
            {selectedWidgets.size} widget đã chọn
          </Badge>
          {selectedWidgets.size > 0 && (
            <Button onClick={() => setPreviewMode(!previewMode)}>
              <Eye className="h-4 w-4 mr-2" />
              {previewMode ? 'Ẩn preview' : 'Preview'}
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="widgets" className="space-y-4">
        <TabsList>
          <TabsTrigger value="widgets">
            <Blocks className="h-4 w-4 mr-2" />
            Tất cả Widgets ({WIDGET_REGISTRY.length})
          </TabsTrigger>
          <TabsTrigger value="by-module">
            <Filter className="h-4 w-4 mr-2" />
            Theo CSDL
          </TabsTrigger>
          <TabsTrigger value="preview" disabled={selectedWidgets.size === 0}>
            <Eye className="h-4 w-4 mr-2" />
            Preview ({selectedWidgets.size})
          </TabsTrigger>
        </TabsList>

        {/* Tab: All Widgets */}
        <TabsContent value="widgets" className="space-y-4">
          {/* Search & Filter */}
          <Card>
            <CardContent className="py-4">
              <div className="flex items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Tìm kiếm widget..."
                    className="pl-9"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Label>CSDL:</Label>
                  <select
                    className="border rounded-md px-3 py-2 text-sm"
                    value={selectedModule || ''}
                    onChange={(e) => setSelectedModule(e.target.value || null)}
                  >
                    <option value="">Tất cả</option>
                    {modules.map(module => (
                      <option key={module} value={module}>
                        {MODULE_INFO[module]?.name || module}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Widgets Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={filteredWidgets.every(w => selectedWidgets.has(w.id))}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            const newSet = new Set(selectedWidgets);
                            filteredWidgets.forEach(w => newSet.add(w.id));
                            setSelectedWidgets(newSet);
                          } else {
                            const newSet = new Set(selectedWidgets);
                            filteredWidgets.forEach(w => newSet.delete(w.id));
                            setSelectedWidgets(newSet);
                          }
                        }}
                      />
                    </TableHead>
                    <TableHead>Widget</TableHead>
                    <TableHead>CSDL</TableHead>
                    <TableHead>Loại</TableHead>
                    <TableHead>Kích thước</TableHead>
                    <TableHead>Quyền</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredWidgets.map(widget => {
                    const moduleInfo = MODULE_INFO[widget.module];
                    const Icon = widget.icon;
                    
                    return (
                      <TableRow key={widget.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedWidgets.has(widget.id)}
                            onCheckedChange={() => toggleWidget(widget.id)}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className={cn('p-2 rounded-lg bg-gradient-to-br', widget.color)}>
                              <Icon className="h-4 w-4 text-white" />
                            </div>
                            <div>
                              <p className="font-medium">{widget.name}</p>
                              <p className="text-xs text-muted-foreground">{widget.description}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {moduleInfo?.name || widget.module}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{widget.type}</Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">{widget.size}</span>
                        </TableCell>
                        <TableCell>
                          <code className="text-xs bg-muted px-2 py-1 rounded">
                            {widget.requiredFunction}
                          </code>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: By Module */}
        <TabsContent value="by-module" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {modules.map(module => {
              const info = MODULE_INFO[module];
              const widgets = widgetsByModule[module] || [];
              const Icon = info?.icon;
              
              return (
                <Card key={module}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {Icon && (
                          <div className={cn('p-2 rounded-lg bg-gradient-to-br', info?.color)}>
                            <Icon className="h-5 w-5 text-white" />
                          </div>
                        )}
                        <CardTitle className="text-base">{info?.name || module}</CardTitle>
                      </div>
                      <Badge variant="secondary">{widgets.length}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {widgets.map(widget => (
                        <div 
                          key={widget.id}
                          className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted cursor-pointer"
                          onClick={() => toggleWidget(widget.id)}
                        >
                          <Checkbox checked={selectedWidgets.has(widget.id)} />
                          <span className="text-sm flex-1">{widget.name}</span>
                          <Badge variant="outline" className="text-xs">{widget.type}</Badge>
                        </div>
                      ))}
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full mt-3"
                      onClick={() => selectAllFromModule(module)}
                    >
                      <Plus className="h-4 w-4 mr-1" /> Chọn tất cả
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Tab: Preview */}
        <TabsContent value="preview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Preview Dashboard</CardTitle>
              <CardDescription>
                Xem trước các widgets đã chọn ({selectedWidgets.size} widgets)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedWidgetConfigs.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Chọn ít nhất 1 widget để xem preview
                </p>
              ) : (
                <div className="space-y-6">
                  {/* KPIs */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {selectedWidgetConfigs
                      .filter(w => w.type === 'kpi')
                      .map(widget => (
                        <WidgetRenderer key={widget.id} widget={widget} />
                      ))}
                  </div>
                  
                  {/* Charts */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {selectedWidgetConfigs
                      .filter(w => ['pie', 'bar', 'line', 'area', 'radar'].includes(w.type))
                      .map(widget => (
                        <WidgetRenderer key={widget.id} widget={widget} />
                      ))}
                  </div>
                  
                  {/* Lists & Tables */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {selectedWidgetConfigs
                      .filter(w => ['list', 'table'].includes(w.type))
                      .map(widget => (
                        <WidgetRenderer key={widget.id} widget={widget} />
                      ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
