
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  BarChart3,
  PieChart,
  Activity,
  Loader2,
  Database,
  Cpu,
  HardDrive
} from 'lucide-react';

export default function AdvancedAnalyticsPage() {
  const { data: session } = useSession() || {};
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');
  const [chartData, setChartData] = useState<any>(null);

  useEffect(() => {
    if (session) {
      fetchChartData();
    }
  }, [session, timeRange]);

  const fetchChartData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/analytics/charts?timeRange=${timeRange}`);
      const data = await response.json();
      setChartData(data.data);
    } catch (error) {
      console.error('Error fetching chart data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Mock data for demonstrations
  const modelPerformanceData = [
    { name: 'Jan', accuracy: 85, precision: 82, recall: 88 },
    { name: 'Feb', accuracy: 87, precision: 84, recall: 89 },
    { name: 'Mar', accuracy: 89, precision: 86, recall: 91 },
    { name: 'Apr', accuracy: 91, precision: 88, recall: 92 },
    { name: 'May', accuracy: 93, precision: 90, recall: 94 },
    { name: 'Jun', accuracy: 94, precision: 91, recall: 95 }
  ];

  const resourceUtilizationData = [
    { time: '00:00', cpu: 45, memory: 62, storage: 78 },
    { time: '04:00', cpu: 42, memory: 58, storage: 78 },
    { time: '08:00', cpu: 68, memory: 72, storage: 79 },
    { time: '12:00', cpu: 75, memory: 78, storage: 80 },
    { time: '16:00', cpu: 82, memory: 85, storage: 82 },
    { time: '20:00', cpu: 71, memory: 75, storage: 81 }
  ];

  const dataQualityData = [
    { name: 'Completeness', value: 95.5, color: '#22c55e' },
    { name: 'Accuracy', value: 98.2, color: '#3b82f6' },
    { name: 'Consistency', value: 96.8, color: '#a855f7' },
    { name: 'Timeliness', value: 94.3, color: '#f59e0b' },
    { name: 'Validity', value: 97.6, color: '#ec4899' }
  ];

  const experimentMetricsData = [
    { epoch: 1, loss: 0.89, val_loss: 0.92, accuracy: 0.72 },
    { epoch: 2, loss: 0.76, val_loss: 0.81, accuracy: 0.78 },
    { epoch: 3, loss: 0.65, val_loss: 0.73, accuracy: 0.83 },
    { epoch: 4, loss: 0.58, val_loss: 0.68, accuracy: 0.87 },
    { epoch: 5, loss: 0.52, val_loss: 0.64, accuracy: 0.89 },
    { epoch: 6, loss: 0.48, val_loss: 0.62, accuracy: 0.91 }
  ];

  const userActivityData = [
    { date: '01/10', queries: 45, uploads: 12, downloads: 28 },
    { date: '02/10', queries: 52, uploads: 15, downloads: 32 },
    { date: '03/10', queries: 48, uploads: 18, downloads: 35 },
    { date: '04/10', queries: 65, uploads: 22, downloads: 41 },
    { date: '05/10', queries: 58, uploads: 20, downloads: 38 }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-military-dark">Advanced Analytics</h1>
          <p className="text-military-medium mt-1">
            Phân tích và trực quan hóa dữ liệu nâng cao
          </p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="24h">24 Giờ</SelectItem>
            <SelectItem value="7d">7 Ngày</SelectItem>
            <SelectItem value="30d">30 Ngày</SelectItem>
            <SelectItem value="90d">90 Ngày</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="models" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="models">Model Performance</TabsTrigger>
          <TabsTrigger value="experiments">Experiments</TabsTrigger>
          <TabsTrigger value="quality">Data Quality</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
          <TabsTrigger value="activity">User Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="models" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Model Performance Trends</CardTitle>
                  <CardDescription>
                    Theo dõi hiệu suất model theo thời gian
                  </CardDescription>
                </div>
                <TrendingUp className="w-5 h-5 text-military-medium" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="w-full h-[400px] flex items-center justify-center bg-muted rounded-lg">
                <div className="text-center">
                  <BarChart3 className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Model Performance Chart
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Accuracy, Precision, Recall trends
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Average Accuracy</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">90.2%</div>
                <p className="text-sm text-military-medium mt-1">+2.3% from last period</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Average Precision</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">87.5%</div>
                <p className="text-sm text-military-medium mt-1">+1.8% from last period</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Average Recall</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600">91.5%</div>
                <p className="text-sm text-military-medium mt-1">+1.5% from last period</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="experiments" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Experiment Training Metrics</CardTitle>
                  <CardDescription>
                    Loss và accuracy theo epoch
                  </CardDescription>
                </div>
                <Activity className="w-5 h-5 text-military-medium" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="w-full h-[400px] flex items-center justify-center bg-muted rounded-lg">
                <div className="text-center">
                  <Activity className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Experiment Training Metrics
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Loss and accuracy by epoch
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quality" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Data Quality Metrics</CardTitle>
                    <CardDescription>
                      Chất lượng dữ liệu theo các tiêu chí
                    </CardDescription>
                  </div>
                  <Database className="w-5 h-5 text-military-medium" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="w-full h-[300px] flex items-center justify-center bg-muted rounded-lg">
                  <div className="text-center">
                    <Database className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Data Quality Bar Chart
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quality Score Distribution</CardTitle>
                <CardDescription>
                  Phân bố điểm chất lượng
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dataQualityData.map((item) => (
                    <div key={item.name} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{item.name}</span>
                        <span className="text-sm font-bold" style={{ color: item.color }}>
                          {item.value}%
                        </span>
                      </div>
                      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full" 
                          style={{ 
                            width: `${item.value}%`,
                            backgroundColor: item.color
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="resources" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Resource Utilization</CardTitle>
                  <CardDescription>
                    Sử dụng tài nguyên hệ thống theo thời gian
                  </CardDescription>
                </div>
                <Cpu className="w-5 h-5 text-military-medium" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="w-full h-[400px] flex items-center justify-center bg-muted rounded-lg">
                <div className="text-center">
                  <Cpu className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Resource Utilization Chart
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    CPU, Memory, Storage usage over time
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">CPU Usage</CardTitle>
                <Cpu className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">68%</div>
                <p className="text-xs text-muted-foreground">
                  Average over last 24h
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
                <Activity className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">72%</div>
                <p className="text-xs text-muted-foreground">
                  Average over last 24h
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Storage Usage</CardTitle>
                <HardDrive className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">79%</div>
                <p className="text-xs text-muted-foreground">
                  Current usage
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Activity Overview</CardTitle>
              <CardDescription>
                Hoạt động người dùng trong hệ thống
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="w-full h-[400px] flex items-center justify-center bg-muted rounded-lg">
                <div className="text-center">
                  <Activity className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    User Activity Chart
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Queries, Uploads, Downloads trends
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
