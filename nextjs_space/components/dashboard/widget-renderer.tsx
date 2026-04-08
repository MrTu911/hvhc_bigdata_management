/**
 * WIDGET RENDERER - Render widget theo config
 * 
 * Hỗ trợ các loại: KPI, Pie, Bar, Line, Area, Table, List, Radar
 */

'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { X, GripVertical, Maximize2, Minimize2, RefreshCw } from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { WidgetConfig } from '@/lib/dashboard/widget-registry';
import { cn } from '@/lib/utils';

interface WidgetRendererProps {
  widget: WidgetConfig;
  isEditing?: boolean;
  onRemove?: () => void;
  className?: string;
}

const DEFAULT_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

export function WidgetRenderer({ widget, isEditing, onRemove, className }: WidgetRendererProps) {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(widget.apiEndpoint);
      if (!res.ok) {
        throw new Error(`API Error: ${res.status}`);
      }
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [widget.apiEndpoint]);

  const Icon = widget.icon;
  const chartData = widget.dataKey && data ? (data as Record<string, unknown>)[widget.dataKey] : null;
  const colors = widget.chartConfig?.colors || DEFAULT_COLORS;

  // Render content based on widget type
  const renderContent = () => {
    if (loading) {
      return <Skeleton className="w-full h-full min-h-[100px]" />;
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
          <p className="text-sm">{error}</p>
          <Button variant="ghost" size="sm" onClick={fetchData} className="mt-2">
            <RefreshCw className="h-4 w-4 mr-1" /> Thử lại
          </Button>
        </div>
      );
    }

    if (!chartData && widget.type !== 'kpi') {
      return (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          <p className="text-sm">Không có dữ liệu</p>
        </div>
      );
    }

    switch (widget.type) {
      case 'kpi':
        const kpiValue = widget.dataKey && data ? (data as Record<string, unknown>)[widget.dataKey] : 0;
        return (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold">
                {typeof kpiValue === 'number' 
                  ? kpiValue.toLocaleString('vi-VN')
                  : kpiValue?.toString() || '0'
                }
              </p>
              <p className="text-sm text-muted-foreground mt-1">{widget.description}</p>
            </div>
            <div className={cn('p-3 rounded-xl bg-gradient-to-br', widget.color)}>
              <Icon className="h-6 w-6 text-white" />
            </div>
          </div>
        );

      case 'pie':
        const pieData = chartData as Array<Record<string, unknown>>;
        return (
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey={widget.chartConfig?.valueKey || 'count'}
                nameKey={widget.chartConfig?.nameKey || 'name'}
                cx="50%"
                cy="50%"
                outerRadius={70}
                label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {pieData?.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );

      case 'bar':
        const barData = chartData as Array<Record<string, unknown>>;
        return (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey={widget.chartConfig?.xKey || 'name'} 
                fontSize={11}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis fontSize={11} />
              <Tooltip />
              <Bar 
                dataKey={widget.chartConfig?.yKey || 'count'} 
                fill={colors[0]}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'line':
        const lineData = chartData as Array<Record<string, unknown>>;
        return (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={lineData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={widget.chartConfig?.xKey || 'name'} fontSize={11} />
              <YAxis fontSize={11} />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey={widget.chartConfig?.yKey || 'count'}
                stroke={colors[0]}
                strokeWidth={2}
                dot={{ fill: colors[0] }}
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'area':
        const areaData = chartData as Array<Record<string, unknown>>;
        return (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={areaData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={widget.chartConfig?.xKey || 'name'} fontSize={11} />
              <YAxis fontSize={11} />
              <Tooltip />
              <Area
                type="monotone"
                dataKey={widget.chartConfig?.yKey || 'count'}
                stroke={colors[0]}
                fill={colors[0]}
                fillOpacity={0.3}
              />
            </AreaChart>
          </ResponsiveContainer>
        );

      case 'radar':
        const radarData = chartData as Array<Record<string, unknown>>;
        return (
          <ResponsiveContainer width="100%" height={200}>
            <RadarChart data={radarData} cx="50%" cy="50%" outerRadius={70}>
              <PolarGrid />
              <PolarAngleAxis dataKey="dimension" fontSize={10} />
              <PolarRadiusAxis fontSize={10} />
              <Radar
                name="Điểm"
                dataKey="value"
                stroke={colors[0]}
                fill={colors[0]}
                fillOpacity={0.5}
              />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        );

      case 'table':
        const tableData = chartData as Array<Record<string, unknown>>;
        if (!tableData || tableData.length === 0) {
          return <p className="text-sm text-muted-foreground">Không có dữ liệu</p>;
        }
        const columns = Object.keys(tableData[0] || {});
        return (
          <div className="overflow-auto max-h-[200px]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  {columns.map(col => (
                    <th key={col} className="text-left p-2 font-medium">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableData.slice(0, 10).map((row, i) => (
                  <tr key={i} className="border-b last:border-0">
                    {columns.map(col => (
                      <td key={col} className="p-2">{String(row[col] || '')}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      case 'list':
        const listData = chartData as Array<Record<string, unknown>>;
        if (!listData || listData.length === 0) {
          return <p className="text-sm text-muted-foreground">Không có dữ liệu</p>;
        }
        return (
          <div className="space-y-2 max-h-[200px] overflow-auto">
            {listData.slice(0, 10).map((item, i) => (
              <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {item.name?.toString() || item.title?.toString() || `Item ${i + 1}`}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {item.position?.toString() || item.description?.toString() || ''}
                  </p>
                </div>
              </div>
            ))}
          </div>
        );

      default:
        return <p className="text-sm text-muted-foreground">Loại widget không hỗ trợ</p>;
    }
  };

  return (
    <Card 
      className={cn(
        'relative overflow-hidden transition-all',
        isEditing && 'ring-2 ring-primary/50 cursor-move',
        isExpanded && 'fixed inset-4 z-50',
        className
      )}
    >
      {/* Edit Mode Controls */}
      {isEditing && (
        <div className="absolute top-2 left-2 z-10">
          <GripVertical className="h-5 w-5 text-muted-foreground" />
        </div>
      )}

      {/* Header */}
      <CardHeader className={cn('pb-2', isEditing && 'pl-8')}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn('p-1.5 rounded-lg bg-gradient-to-br', widget.color)}>
              <Icon className="h-4 w-4 text-white" />
            </div>
            <CardTitle className="text-sm font-medium">{widget.name}</CardTitle>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={fetchData}>
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
            </Button>
            {isEditing && onRemove && (
              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={onRemove}>
                <X className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      {/* Content */}
      <CardContent>
        {renderContent()}
      </CardContent>

      {/* Expanded Overlay */}
      {isExpanded && (
        <div 
          className="fixed inset-0 bg-black/50 -z-10" 
          onClick={() => setIsExpanded(false)} 
        />
      )}
    </Card>
  );
}
