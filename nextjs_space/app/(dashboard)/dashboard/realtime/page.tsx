'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/components/providers/language-provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, Cpu, Database, HardDrive, Network, TrendingUp, TrendingDown } from 'lucide-react';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface SystemMetrics {
  timestamp: string;
  cpu: number;
  memory: number;
  disk: number;
  network: number;
  queries: number;
}

export default function RealtimeDashboard() {
  const { t, language: locale } = useLanguage();
  const [metrics, setMetrics] = useState<SystemMetrics[]>([]);
  const [currentMetrics, setCurrentMetrics] = useState<SystemMetrics | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Simulate real-time data
    const interval = setInterval(() => {
      const newMetric: SystemMetrics = {
        timestamp: new Date().toLocaleTimeString(),
        cpu: Math.random() * 100,
        memory: Math.random() * 100,
        disk: Math.random() * 100,
        network: Math.random() * 1000,
        queries: Math.floor(Math.random() * 50),
      };

      setCurrentMetrics(newMetric);
      setMetrics((prev) => {
        const updated = [...prev, newMetric];
        return updated.slice(-20); // Keep last 20 points
      });
      setIsConnected(true);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const cpuChartData = {
    labels: metrics.map((m) => m.timestamp),
    datasets: [
      {
        label: 'CPU Usage (%)',
        data: metrics.map((m) => m.cpu),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const memoryChartData = {
    labels: metrics.map((m) => m.timestamp),
    datasets: [
      {
        label: 'Memory Usage (%)',
        data: metrics.map((m) => m.memory),
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const networkChartData = {
    labels: metrics.map((m) => m.timestamp),
    datasets: [
      {
        label: 'Network (MB/s)',
        data: metrics.map((m) => m.network),
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const queriesChartData = {
    labels: metrics.map((m) => m.timestamp),
    datasets: [
      {
        label: 'Queries/sec',
        data: metrics.map((m) => m.queries),
        backgroundColor: 'rgba(147, 51, 234, 0.8)',
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      x: {
        display: false,
      },
      y: {
        beginAtZero: true,
      },
    },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {locale === 'vi' ? 'Giám sát Real-time' : 'Real-time Monitoring'}
          </h1>
          <p className="text-muted-foreground">
            {locale === 'vi' ? 'Theo dõi hệ thống theo thời gian thực' : 'Monitor system in real-time'}
          </p>
        </div>
        <Badge variant={isConnected ? 'default' : 'destructive'}>
          <Activity className="mr-1 h-3 w-3" />
          {isConnected ? (locale === 'vi' ? 'Đang kết nối' : 'Connected') : locale === 'vi' ? 'Mất kết nối' : 'Disconnected'}
        </Badge>
      </div>

      {/* Current Metrics */}
      {currentMetrics && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">CPU</CardTitle>
              <Cpu className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{currentMetrics.cpu.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                {currentMetrics.cpu > 50 ? (
                  <>
                    <TrendingUp className="h-3 w-3 text-red-500" />
                    <span className="text-red-500">{locale === 'vi' ? 'Cao' : 'High'}</span>
                  </>
                ) : (
                  <>
                    <TrendingDown className="h-3 w-3 text-green-500" />
                    <span className="text-green-500">{locale === 'vi' ? 'Bình thường' : 'Normal'}</span>
                  </>
                )}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{locale === 'vi' ? 'Bộ nhớ' : 'Memory'}</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{currentMetrics.memory.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                {currentMetrics.memory > 50 ? (
                  <>
                    <TrendingUp className="h-3 w-3 text-red-500" />
                    <span className="text-red-500">{locale === 'vi' ? 'Cao' : 'High'}</span>
                  </>
                ) : (
                  <>
                    <TrendingDown className="h-3 w-3 text-green-500" />
                    <span className="text-green-500">{locale === 'vi' ? 'Bình thường' : 'Normal'}</span>
                  </>
                )}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{locale === 'vi' ? 'Mạng' : 'Network'}</CardTitle>
              <Network className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{currentMetrics.network.toFixed(1)} MB/s</div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                {currentMetrics.network > 500 ? (
                  <>
                    <TrendingUp className="h-3 w-3 text-red-500" />
                    <span className="text-red-500">{locale === 'vi' ? 'Cao' : 'High'}</span>
                  </>
                ) : (
                  <>
                    <TrendingDown className="h-3 w-3 text-green-500" />
                    <span className="text-green-500">{locale === 'vi' ? 'Bình thường' : 'Normal'}</span>
                  </>
                )}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{locale === 'vi' ? 'Truy vấn' : 'Queries'}</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{currentMetrics.queries}/s</div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                {currentMetrics.queries > 25 ? (
                  <>
                    <TrendingUp className="h-3 w-3 text-blue-500" />
                    <span className="text-blue-500">{locale === 'vi' ? 'Hoạt động tốt' : 'Active'}</span>
                  </>
                ) : (
                  <>
                    <TrendingDown className="h-3 w-3 text-gray-500" />
                    <span className="text-gray-500">{locale === 'vi' ? 'Ít hoạt động' : 'Low'}</span>
                  </>
                )}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Real-time Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{locale === 'vi' ? 'Sử dụng CPU' : 'CPU Usage'}</CardTitle>
            <CardDescription>{locale === 'vi' ? 'Theo thời gian thực' : 'Real-time monitoring'}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <Line data={cpuChartData} options={chartOptions} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{locale === 'vi' ? 'Bộ nhớ' : 'Memory Usage'}</CardTitle>
            <CardDescription>{locale === 'vi' ? 'Theo thời gian thực' : 'Real-time monitoring'}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <Line data={memoryChartData} options={chartOptions} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{locale === 'vi' ? 'Lưu lượng Mạng' : 'Network Traffic'}</CardTitle>
            <CardDescription>{locale === 'vi' ? 'Theo thời gian thực' : 'Real-time monitoring'}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <Line data={networkChartData} options={chartOptions} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{locale === 'vi' ? 'Truy vấn / giây' : 'Queries per Second'}</CardTitle>
            <CardDescription>{locale === 'vi' ? 'Theo thời gian thực' : 'Real-time monitoring'}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <Bar data={queriesChartData} options={chartOptions} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
