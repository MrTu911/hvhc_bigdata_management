'use client';

import { useEffect, useState } from 'react';
import { useLanguage } from '@/components/providers/language-provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  BarChart3,
  TrendingUp,
  Users,
  Database,
  Activity,
  Calendar,
  Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AnalyticsPage() {
  const { language } = useLanguage();
  const [timeRange, setTimeRange] = useState('7d');
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const translations = {
    vi: {
      pageTitle: 'Analytics & Báo cáo',
      pageDescription: 'Phân tích và báo cáo thống kê dữ liệu hệ thống',
      overview: 'Tổng quan',
      usage: 'Sử dụng',
      performance: 'Hiệu suất',
      reports: 'Báo cáo',
      timeRange: 'Khoảng thời gian',
      last7Days: '7 ngày qua',
      last30Days: '30 ngày qua',
      last90Days: '90 ngày qua',
      thisYear: 'Năm nay',
      totalQueries: 'Tổng số truy vấn',
      avgQueryTime: 'Thời gian truy vấn TB',
      dataUploaded: 'Dữ liệu tải lên',
      activeUsers: 'Người dùng hoạt động',
      exportReport: 'Xuất báo cáo',
      queryTrends: 'Xu hướng truy vấn',
      uploadTrends: 'Xu hướng tải lên',
      userActivity: 'Hoạt động người dùng',
      systemPerformance: 'Hiệu suất hệ thống',
      topDatasets: 'Dataset phổ biến',
      topUsers: 'Người dùng hoạt động nhất'
    },
    en: {
      pageTitle: 'Analytics & Reports',
      pageDescription: 'Analyze and report system data statistics',
      overview: 'Overview',
      usage: 'Usage',
      performance: 'Performance',
      reports: 'Reports',
      timeRange: 'Time Range',
      last7Days: 'Last 7 Days',
      last30Days: 'Last 30 Days',
      last90Days: 'Last 90 Days',
      thisYear: 'This Year',
      totalQueries: 'Total Queries',
      avgQueryTime: 'Avg Query Time',
      dataUploaded: 'Data Uploaded',
      activeUsers: 'Active Users',
      exportReport: 'Export Report',
      queryTrends: 'Query Trends',
      uploadTrends: 'Upload Trends',
      userActivity: 'User Activity',
      systemPerformance: 'System Performance',
      topDatasets: 'Top Datasets',
      topUsers: 'Top Users'
    }
  };

  const lang = language === 'en' ? 'en' : 'vi';
  const tr = translations[lang];

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/analytics/summary?timeRange=${timeRange}`);
      if (response.ok) {
        const data = await response.json();
        setAnalyticsData(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const stats = [
    {
      title: tr.totalQueries,
      value: analyticsData?.totalQueries || '1,234',
      change: '+12%',
      icon: <BarChart3 className="h-6 w-6" />,
      color: 'text-blue-600'
    },
    {
      title: tr.avgQueryTime,
      value: analyticsData?.avgQueryTime || '234ms',
      change: '-5%',
      icon: <Activity className="h-6 w-6" />,
      color: 'text-green-600'
    },
    {
      title: tr.dataUploaded,
      value: analyticsData?.dataUploaded || '125 GB',
      change: '+18%',
      icon: <Database className="h-6 w-6" />,
      color: 'text-purple-600'
    },
    {
      title: tr.activeUsers,
      value: analyticsData?.activeUsers || '48',
      change: '+8%',
      icon: <Users className="h-6 w-6" />,
      color: 'text-orange-600'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{tr.pageTitle}</h1>
          <p className="text-muted-foreground mt-2">{tr.pageDescription}</p>
        </div>

        <div className="flex items-center gap-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">{tr.last7Days}</SelectItem>
              <SelectItem value="30d">{tr.last30Days}</SelectItem>
              <SelectItem value="90d">{tr.last90Days}</SelectItem>
              <SelectItem value="1y">{tr.thisYear}</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            {tr.exportReport}
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <div className={stat.color}>
                {stat.icon}
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                <span className={stat.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}>
                  {stat.change}
                </span>
                {' '}
                {lang === 'vi' ? 'so với kỳ trước' : 'from last period'}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Detailed Analytics */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">{tr.overview}</TabsTrigger>
          <TabsTrigger value="usage">{tr.usage}</TabsTrigger>
          <TabsTrigger value="performance">{tr.performance}</TabsTrigger>
          <TabsTrigger value="reports">{tr.reports}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>{tr.queryTrends}</CardTitle>
                <CardDescription>
                  {lang === 'vi' ? 'Số lượng truy vấn theo thời gian' : 'Query volume over time'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] flex items-center justify-center border-2 border-dashed rounded-lg">
                  <div className="text-center text-muted-foreground">
                    <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">
                      {lang === 'vi' ? 'Biểu đồ xu hướng truy vấn' : 'Query trends chart'}
                    </p>
                    <p className="text-xs mt-1">
                      {lang === 'vi' ? 'Tích hợp với Chart.js hoặc Recharts' : 'Integrate with Chart.js or Recharts'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{tr.uploadTrends}</CardTitle>
                <CardDescription>
                  {lang === 'vi' ? 'Dung lượng dữ liệu tải lên' : 'Data upload volume'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] flex items-center justify-center border-2 border-dashed rounded-lg">
                  <div className="text-center text-muted-foreground">
                    <TrendingUp className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">
                      {lang === 'vi' ? 'Biểu đồ xu hướng tải lên' : 'Upload trends chart'}
                    </p>
                    <p className="text-xs mt-1">
                      {lang === 'vi' ? 'Hiển thị dữ liệu upload theo thời gian' : 'Display upload data over time'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>{tr.topDatasets}</CardTitle>
                <CardDescription>
                  {lang === 'vi' ? 'Dataset được truy cập nhiều nhất' : 'Most accessed datasets'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="text-sm font-medium">Dataset {i}</p>
                        <p className="text-xs text-muted-foreground">
                          {Math.floor(Math.random() * 1000)} {lang === 'vi' ? 'truy cập' : 'accesses'}
                        </p>
                      </div>
                      <Badge variant="secondary">{Math.floor(Math.random() * 100)} MB</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{tr.topUsers}</CardTitle>
                <CardDescription>
                  {lang === 'vi' ? 'Người dùng hoạt động nhiều nhất' : 'Most active users'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-medium">
                          U{i}
                        </div>
                        <div>
                          <p className="text-sm font-medium">User {i}</p>
                          <p className="text-xs text-muted-foreground">
                            {Math.floor(Math.random() * 50)} {lang === 'vi' ? 'hoạt động' : 'activities'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="usage">
          <Card>
            <CardHeader>
              <CardTitle>{tr.userActivity}</CardTitle>
              <CardDescription>
                {lang === 'vi' ? 'Phân tích hoạt động người dùng' : 'User activity analysis'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px] flex items-center justify-center border-2 border-dashed rounded-lg">
                <div className="text-center text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">
                    {lang === 'vi' ? 'Biểu đồ hoạt động người dùng' : 'User activity chart'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance">
          <Card>
            <CardHeader>
              <CardTitle>{tr.systemPerformance}</CardTitle>
              <CardDescription>
                {lang === 'vi' ? 'Phân tích hiệu suất hệ thống' : 'System performance analysis'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px] flex items-center justify-center border-2 border-dashed rounded-lg">
                <div className="text-center text-muted-foreground">
                  <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">
                    {lang === 'vi' ? 'Biểu đồ hiệu suất hệ thống' : 'System performance chart'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle>{tr.reports}</CardTitle>
              <CardDescription>
                {lang === 'vi' ? 'Báo cáo chi tiết và xuất dữ liệu' : 'Detailed reports and data export'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <Button variant="outline" className="h-24 flex flex-col gap-2">
                    <Download className="h-6 w-6" />
                    <span className="text-sm">
                      {lang === 'vi' ? 'Báo cáo tuần' : 'Weekly Report'}
                    </span>
                  </Button>
                  <Button variant="outline" className="h-24 flex flex-col gap-2">
                    <Download className="h-6 w-6" />
                    <span className="text-sm">
                      {lang === 'vi' ? 'Báo cáo tháng' : 'Monthly Report'}
                    </span>
                  </Button>
                  <Button variant="outline" className="h-24 flex flex-col gap-2">
                    <Download className="h-6 w-6" />
                    <span className="text-sm">
                      {lang === 'vi' ? 'Báo cáo tùy chỉnh' : 'Custom Report'}
                    </span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
