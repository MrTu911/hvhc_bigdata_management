'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Activity, RefreshCw, Download, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { toast } from 'react-hot-toast';
import KPICard from '@/components/kpis/KPICard';
import KPIChart from '@/components/kpis/KPIChart';
import KPIComparison from '@/components/kpis/KPIComparison';

interface KPIMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  change: number;
  prediction: number;
  status: 'excellent' | 'good' | 'warning' | 'danger';
}

export default function RealtimeKPIPage() {
  const [metrics, setMetrics] = useState<KPIMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchKPIs = useCallback(async () => {
    try {
      const response = await fetch('/api/dashboard/kpis/realtime');
      if (response.ok) {
        const data = await response.json();
        setMetrics(data.metrics || []);
        setLastUpdate(new Date(data.timestamp));
      } else {
        toast.error('Không thể tải KPIs');
      }
    } catch (error) {
      console.error('Error fetching KPIs:', error);
      toast.error('Lỗi khi tải KPIs');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchKPIs();
  }, [fetchKPIs]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchKPIs();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [autoRefresh, fetchKPIs]);

  const handleRefresh = () => {
    setLoading(true);
    fetchKPIs();
  };

  const handleExport = () => {
    if (metrics.length === 0) {
      toast.error('Không có dữ liệu để export');
      return;
    }

    // Export as CSV
    const headers = ['Tên KPI', 'Giá trị', 'Đơn vị', 'Xu hướng', 'Thay đổi (%)', 'Dự đoán', 'Trạng thái'];
    const rows = metrics.map(m => [
      m.name,
      m.value,
      m.unit,
      m.trend === 'up' ? 'Tăng' : m.trend === 'down' ? 'Giảm' : 'Ổn định',
      m.change,
      m.prediction,
      m.status,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `kpi-report-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Đã export KPI report');
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  if (loading && metrics.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center space-y-4">
          <RefreshCw className="h-12 w-12 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Đang tải KPIs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">KPI Realtime Dashboard</h1>
          <p className="text-muted-foreground">
            Chỉ số hiệu suất chính (KPIs) cập nhật theo thời gian thực
          </p>
        </div>
        <Activity className="h-8 w-8 text-muted-foreground" />
      </div>

      {/* Controls */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Làm mới
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAutoRefresh(!autoRefresh)}
              >
                {autoRefresh ? 'Tắt' : 'Bật'} tự động cập nhật
              </Button>
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
            {lastUpdate && (
              <div className="text-sm text-muted-foreground">
                Cập nhật lần cuối: {lastUpdate.toLocaleTimeString('vi-VN')}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {metrics.map((metric) => (
          <KPICard key={metric.id} metric={metric} />
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Xu hướng KPIs</CardTitle>
            <CardDescription>Biểu đồ xu hướng các KPI chính</CardDescription>
          </CardHeader>
          <CardContent>
            <KPIChart metrics={metrics} />
          </CardContent>
        </Card>

        {/* Comparison Chart */}
        <Card>
          <CardHeader>
            <CardTitle>So sánh Thực tế vs Dự đoán</CardTitle>
            <CardDescription>So sánh giá trị hiện tại với dự đoán</CardDescription>
          </CardHeader>
          <CardContent>
            <KPIComparison metrics={metrics} />
          </CardContent>
        </Card>
      </div>

      {/* Summary Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Tổng quan</CardTitle>
          <CardDescription>Thống kê tổng hợp về các KPIs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">Tổng số KPIs</div>
              <div className="text-3xl font-bold">{metrics.length}</div>
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <TrendingUp className="h-4 w-4 text-green-500" />
                Tăng
              </div>
              <div className="text-3xl font-bold text-green-600">
                {metrics.filter(m => m.trend === 'up').length}
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <TrendingDown className="h-4 w-4 text-red-500" />
                Giảm
              </div>
              <div className="text-3xl font-bold text-red-600">
                {metrics.filter(m => m.trend === 'down').length}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
