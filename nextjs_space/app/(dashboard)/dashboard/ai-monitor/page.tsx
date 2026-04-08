'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Activity,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  Server,
  AlertTriangle,
  RefreshCw,
  Zap,
  Eye,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { toast } from 'react-hot-toast';

interface Stats {
  summary: {
    totalCalls: number;
    successCalls: number;
    failedCalls: number;
    successRate: number;
    avgResponseTime: number;
  };
  providerStats: Record<string, number>;
  endpointStats: Record<string, number>;
  hourlyStats: Array<{
    hour: number;
    totalCalls: number;
    successCalls: number;
    failedCalls: number;
    avgResponseTime: number;
  }>;
  recentErrors: Array<{
    id: string;
    provider: string;
    endpoint: string;
    errorMessage: string;
    createdAt: string;
  }>;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function AIMonitorPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('24'); // hours
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [alerts, setAlerts] = useState<string[]>([]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    loadStats();
  }, [timeRange]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(() => {
        loadStats();
      }, 30000); // Refresh every 30 seconds
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const loadStats = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/ai/monitor/stats?hours=${timeRange}`);
      if (response.ok) {
        const data = await response.json();
        setStats(data);
        
        // Check for alerts
        const newAlerts: string[] = [];
        if (data.summary.successRate < 80) {
          newAlerts.push(`⚠️ Tỷ lệ thành công thấp: ${data.summary.successRate.toFixed(1)}%`);
        }
        if (data.summary.avgResponseTime > 5000) {
          newAlerts.push(`⏱️ Response time cao: ${data.summary.avgResponseTime}ms`);
        }
        if (data.summary.failedCalls > 10) {
          newAlerts.push(`❌ Số lượng lỗi cao: ${data.summary.failedCalls} calls`);
        }
        if (data.recentErrors && data.recentErrors.length > 5) {
          newAlerts.push(`🔴 ${data.recentErrors.length} lỗi trong thời gian gần đây`);
        }
        setAlerts(newAlerts);
        
        // Show toast for critical alerts
        if (newAlerts.length > 0 && autoRefresh) {
          toast.error(`${newAlerts.length} cảnh báo mới!`);
        }
      } else {
        toast.error('Không thể tải thống kê AI');
      }
    } catch (error) {
      console.error('Error loading AI stats:', error);
      toast.error('Lỗi kết nối');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-2">
          <RefreshCw className="h-6 w-6 animate-spin" />
          <span>Đang tải...</span>
        </div>
      </div>
    );
  }

  const providerData = Object.entries(stats?.providerStats || {}).map(([name, value]) => ({
    name: name.toUpperCase(),
    value,
  }));

  const endpointData = Object.entries(stats?.endpointStats || {})
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([name, value]) => ({
      name: name.split('/').pop() || name,
      value,
    }));

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            AI Service Monitor
          </h1>
          <p className="text-muted-foreground mt-1">
            Giám sát hiệu suất và sức khỏe của AI service
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 giờ</SelectItem>
              <SelectItem value="6">6 giờ</SelectItem>
              <SelectItem value="12">12 giờ</SelectItem>
              <SelectItem value="24">24 giờ</SelectItem>
              <SelectItem value="72">3 ngày</SelectItem>
              <SelectItem value="168">7 ngày</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant={autoRefresh ? 'default' : 'outline'}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            {autoRefresh ? (
              <>
                <Activity className="h-4 w-4 mr-2 animate-pulse" />
                Auto Refresh
              </>
            ) : (
              <>
                <Eye className="h-4 w-4 mr-2" />
                Manual
              </>
            )}
          </Button>
          <Button variant="outline" size="sm" onClick={loadStats}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Làm mới
          </Button>
        </div>
      </div>

      {/* Alert Panel */}
      {alerts.length > 0 && (
        <Card className="border-red-300 bg-red-50 dark:bg-red-950">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600 animate-pulse" />
              <CardTitle className="text-red-900 dark:text-red-100">
                Cảnh báo hệ thống ({alerts.length})
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {alerts.map((alert, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 p-2 bg-white dark:bg-red-900 rounded border border-red-200 dark:border-red-800"
                >
                  <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0" />
                  <span className="text-sm text-red-900 dark:text-red-100">{alert}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">
                Tổng API Calls
              </CardTitle>
              <Activity className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-900 dark:text-blue-100">
              {stats?.summary.totalCalls.toLocaleString() || 0}
            </div>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
              Trong {timeRange} giờ qua
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300">
                Thành công
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-900 dark:text-green-100">
              {stats?.summary.successCalls.toLocaleString() || 0}
            </div>
            <p className="text-xs text-green-600 dark:text-green-400 mt-1">
              {stats?.summary.successRate.toFixed(1)}% success rate
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-red-700 dark:text-red-300">
                Thất bại
              </CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-900 dark:text-red-100">
              {stats?.summary.failedCalls.toLocaleString() || 0}
            </div>
            <p className="text-xs text-red-600 dark:text-red-400 mt-1">
              {((stats?.summary.failedCalls || 0) / (stats?.summary.totalCalls || 1) * 100).toFixed(1)}% failure rate
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-amber-700 dark:text-amber-300">
                Response Time
              </CardTitle>
              <Clock className="h-4 w-4 text-amber-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-900 dark:text-amber-100">
              {stats?.summary.avgResponseTime || 0}ms
            </div>
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
              Trung bình
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300">
                Provider
              </CardTitle>
              <Server className="h-4 w-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-900 dark:text-purple-100">
              {Object.keys(stats?.providerStats || {}).length}
            </div>
            <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
              Đang sử dụng
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hourly Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Hiệu suất theo giờ
            </CardTitle>
            <CardDescription>API calls và response time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stats?.hourlyStats || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" label={{ value: 'Giờ', position: 'insideBottom', offset: -5 }} />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="totalCalls"
                  stroke="#3b82f6"
                  name="Tổng calls"
                  strokeWidth={2}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="avgResponseTime"
                  stroke="#f59e0b"
                  name="Avg Response (ms)"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Success vs Failed Calls */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Thành công vs Thất bại
            </CardTitle>
            <CardDescription>Phân tích theo giờ</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats?.hourlyStats || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="successCalls" name="Thành công" fill="#10b981" stackId="a" />
                <Bar dataKey="failedCalls" name="Thất bại" fill="#ef4444" stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Provider Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              Phân bố Provider
            </CardTitle>
            <CardDescription>Số lượng calls theo provider</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={providerData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {providerData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Endpoints */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Top Endpoints
            </CardTitle>
            <CardDescription>5 endpoint được sử dụng nhiều nhất</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={endpointData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Recent Errors */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Lỗi gần đây
            </CardTitle>
            <CardDescription>10 lỗi mới nhất</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {stats?.recentErrors && stats.recentErrors.length > 0 ? (
                stats.recentErrors.map((error) => (
                  <div key={error.id} className="border-l-4 border-red-500 bg-red-50 dark:bg-red-950 p-3 rounded">
                    <div className="flex items-center justify-between mb-1">
                      <Badge variant="destructive" className="text-xs">
                        {error.provider.toUpperCase()}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(error.createdAt).toLocaleString('vi-VN')}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-red-900 dark:text-red-100">
                      {error.endpoint}
                    </p>
                    <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                      {error.errorMessage}
                    </p>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
                  <p>Không có lỗi nào!</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
