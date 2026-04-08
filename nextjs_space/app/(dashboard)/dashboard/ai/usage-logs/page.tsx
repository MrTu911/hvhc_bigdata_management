'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useLanguage } from '@/components/providers/language-provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Brain,
  Search,
  Filter,
  Download,
  Calendar,
  User,
  Activity,
  TrendingUp,
  BarChart3,
  Users,
  Clock,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface AIUsageLog {
  id: string;
  userId: string;
  promptVersion?: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  inputHash?: string;
  success: boolean;
  errorMessage?: string;
  estimatedCost: number;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

interface UsageStats {
  total: number;
  byModel: Record<string, {
    count: number;
    totalInputTokens: number;
    totalOutputTokens: number;
    totalCost: number;
  }>;
  topUsers: Array<{
    user: {
      id: string;
      name: string;
      email: string;
      role: string;
    };
    count: number;
  }>;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export default function AIUsageLogsPage() {
  const { t, language } = useLanguage();
  const { data: session } = useSession();
  const [logs, setLogs] = useState<AIUsageLog[]>([]);
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modelFilter, setModelFilter] = useState('ALL');
  const [userFilter, setUserFilter] = useState('ALL');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0,
  });

  const fetchLogs = async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });

      if (search) params.append('userId', search);
      if (modelFilter !== 'ALL') params.append('model', modelFilter);
      if (dateRange?.from) params.append('startDate', dateRange.from.toISOString());
      if (dateRange?.to) params.append('endDate', dateRange.to.toISOString());

      const response = await fetch(`/api/ai/usage-logs?${params}`);
      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs);
        setStats(data.stats);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Failed to fetch AI usage logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [modelFilter, dateRange]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.pages) {
      fetchLogs(newPage);
    }
  };

  const handleExport = async () => {
    try {
      const params = new URLSearchParams({
        page: '1',
        limit: '1000', // Export more records
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });

      if (modelFilter !== 'ALL') params.append('model', modelFilter);
      if (dateRange?.from) params.append('startDate', dateRange.from.toISOString());
      if (dateRange?.to) params.append('endDate', dateRange.to.toISOString());

      const response = await fetch(`/api/ai/usage-logs?${params}`);
      if (response.ok) {
        const data = await response.json();
        const csvContent = convertToCSV(data.logs);
        downloadCSV(csvContent, 'ai-usage-logs.csv');
      }
    } catch (error) {
      console.error('Failed to export logs:', error);
    }
  };

  const convertToCSV = (logs: AIUsageLog[]) => {
    const headers = ['Timestamp', 'User', 'Email', 'Model', 'Input Tokens', 'Output Tokens', 'Total Tokens', 'Cost', 'Success', 'Error Message'];
    const rows = logs.map(log => [
      new Date(log.createdAt).toLocaleString(),
      log.user.name,
      log.user.email,
      log.model,
      log.inputTokens.toString(),
      log.outputTokens.toString(),
      (log.inputTokens + log.outputTokens).toString(),
      log.estimatedCost.toString(),
      log.success.toString(),
      log.errorMessage || '',
    ]);

    return [headers, ...rows].map(row => row.map(field => `"${field}"`).join(',')).join('\n');
  };

  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: vi });
  };

  if (loading && logs.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">AI Usage Logs</h1>
            <p className="text-muted-foreground mt-2">
              {language === 'vi' ? 'Theo dõi hoạt động sử dụng AI' : 'Monitor AI usage activity'}
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  <Skeleton className="h-4 w-24" />
                </CardTitle>
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-1" />
                <Skeleton className="h-3 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              <Skeleton className="h-6 w-48" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {language === 'vi' ? 'Nhật ký sử dụng AI' : 'AI Usage Logs'}
          </h1>
          <p className="text-muted-foreground mt-2">
            {language === 'vi'
              ? 'Theo dõi và phân tích hoạt động sử dụng AI trong hệ thống'
              : 'Monitor and analyze AI usage activity in the system'
            }
          </p>
        </div>

        <Button onClick={handleExport} variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          {language === 'vi' ? 'Xuất CSV' : 'Export CSV'}
        </Button>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {language === 'vi' ? 'Tổng hoạt động' : 'Total Activities'}
              </CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {language === 'vi' ? 'lượt sử dụng AI' : 'AI usages'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {language === 'vi' ? 'Mô hình AI' : 'AI Models'}
              </CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Object.keys(stats.byModel).length}</div>
              <p className="text-xs text-muted-foreground">
                {language === 'vi' ? 'mô hình khác nhau' : 'different models'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {language === 'vi' ? 'Người dùng hoạt động' : 'Active Users'}
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.topUsers.length}</div>
              <p className="text-xs text-muted-foreground">
                {language === 'vi' ? 'người dùng' : 'users'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {language === 'vi' ? 'Tổng chi phí' : 'Total Cost'}
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${Object.values(stats.byModel).reduce((sum: number, model: any) => sum + model.totalCost, 0).toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                {language === 'vi' ? 'ước tính' : 'estimated'}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            {language === 'vi' ? 'Bộ lọc' : 'Filters'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {language === 'vi' ? 'Tìm kiếm người dùng' : 'Search User'}
              </label>
              <Input
                placeholder={language === 'vi' ? 'Nhập tên hoặc email...' : 'Enter name or email...'}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && fetchLogs()}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                {language === 'vi' ? 'Mô hình AI' : 'AI Model'}
              </label>
              <Select value={modelFilter} onValueChange={setModelFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">
                    {language === 'vi' ? 'Tất cả' : 'All'}
                  </SelectItem>
                  <SelectItem value="gpt-4">GPT-4</SelectItem>
                  <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                  <SelectItem value="claude-3">Claude-3</SelectItem>
                  <SelectItem value="gemini-pro">Gemini Pro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                {language === 'vi' ? 'Khoảng thời gian' : 'Date Range'}
              </label>
              <DateRangePicker
                value={dateRange}
                onChange={setDateRange}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium invisible">Action</label>
              <Button onClick={() => fetchLogs()} className="w-full">
                <Search className="h-4 w-4 mr-2" />
                {language === 'vi' ? 'Tìm kiếm' : 'Search'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Users */}
      {stats && stats.topUsers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>
              {language === 'vi' ? 'Người dùng hoạt động nhiều nhất' : 'Most Active Users'}
            </CardTitle>
            <CardDescription>
              {language === 'vi'
                ? 'Top 10 người dùng sử dụng AI nhiều nhất'
                : 'Top 10 users with most AI usage'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.topUsers.map((item, index) => (
                <div key={item.user.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-medium">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{item.user.name}</p>
                      <p className="text-sm text-muted-foreground">{item.user.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{item.count}</p>
                    <p className="text-sm text-muted-foreground">
                      {language === 'vi' ? 'hoạt động' : 'activities'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            {language === 'vi' ? 'Nhật ký hoạt động' : 'Activity Logs'}
          </CardTitle>
          <CardDescription>
            {language === 'vi'
              ? `Hiển thị ${logs.length} trên tổng số ${pagination.total} hoạt động`
              : `Showing ${logs.length} of ${pagination.total} activities`
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    {language === 'vi' ? 'Thời gian' : 'Time'}
                  </TableHead>
                  <TableHead>
                    {language === 'vi' ? 'Người dùng' : 'User'}
                  </TableHead>
                  <TableHead>
                    {language === 'vi' ? 'Mô hình' : 'Model'}
                  </TableHead>
                  <TableHead>
                    {language === 'vi' ? 'Tokens' : 'Tokens'}
                  </TableHead>
                  <TableHead>
                    {language === 'vi' ? 'Chi phí' : 'Cost'}
                  </TableHead>
                  <TableHead>
                    {language === 'vi' ? 'Trạng thái' : 'Status'}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-mono text-sm">
                      {formatDate(log.createdAt)}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{log.user.name}</p>
                        <p className="text-sm text-muted-foreground">{log.user.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{log.model}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p>{log.inputTokens} in / {log.outputTokens} out</p>
                        <p className="text-muted-foreground">Total: {log.inputTokens + log.outputTokens}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono">${log.estimatedCost.toFixed(4)}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={log.success ? 'default' : 'destructive'}>
                        {log.success ? (language === 'vi' ? 'Thành công' : 'Success') : (language === 'vi' ? 'Lỗi' : 'Error')}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                {language === 'vi'
                  ? `Trang ${pagination.page} của ${pagination.pages}`
                  : `Page ${pagination.page} of ${pagination.pages}`
                }
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  {language === 'vi' ? 'Trước' : 'Previous'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page >= pagination.pages}
                >
                  {language === 'vi' ? 'Sau' : 'Next'}
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}