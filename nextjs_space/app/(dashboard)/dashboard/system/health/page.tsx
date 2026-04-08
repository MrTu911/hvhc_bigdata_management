'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import {
  Activity,
  CheckCircle2,
  AlertCircle,
  XCircle,
  RefreshCw,
  Database,
  HardDrive,
  Cpu,
  Server
} from 'lucide-react';
import { toast } from 'sonner';

interface HealthCheck {
  service_name: string;
  check_type: string;
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  response_time_ms?: number;
  error_message?: string;
  checked_at: string;
}

interface SystemMetric {
  metric_category: string;
  metric_name: string;
  metric_value: number;
  metric_unit: string;
  recorded_at: string;
}

export default function SystemHealthPage() {
  const [health, setHealth] = useState<{
    overall_status: string;
    checks: HealthCheck[];
    unhealthy_services: string[];
  } | null>(null);
  const [metrics, setMetrics] = useState<SystemMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadHealthStatus();
    loadMetrics();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      loadHealthStatus();
      loadMetrics();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const loadHealthStatus = async () => {
    try {
      const response = await fetch('/api/system/health?detailed=true');
      const data = await response.json();
      
      if (data.success) {
        setHealth(data.data);
      }
    } catch (error) {
      console.error('Error loading health status:', error);
      toast.error('Failed to load health status');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadMetrics = async () => {
    try {
      const response = await fetch('/api/system/metrics?hours=1');
      const data = await response.json();
      
      if (data.success) {
        setMetrics(data.data || []);
      }
    } catch (error) {
      console.error('Error loading metrics:', error);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadHealthStatus();
    loadMetrics();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'degraded':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'unhealthy':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-500/10 text-green-700 border-green-200';
      case 'degraded':
        return 'bg-yellow-500/10 text-yellow-700 border-yellow-200';
      case 'unhealthy':
        return 'bg-red-500/10 text-red-700 border-red-200';
      default:
        return 'bg-gray-500/10 text-gray-700 border-gray-200';
    }
  };

  const getServiceIcon = (checkType: string) => {
    switch (checkType) {
      case 'database':
        return <Database className="h-5 w-5" />;
      case 'cache':
        return <Server className="h-5 w-5" />;
      case 'storage':
        return <HardDrive className="h-5 w-5" />;
      case 'api':
        return <Activity className="h-5 w-5" />;
      case 'ml_engine':
        return <Cpu className="h-5 w-5" />;
      default:
        return <Activity className="h-5 w-5" />;
    }
  };

  const prepareMetricChart = (category: string, name: string) => {
    const filteredMetrics = metrics
      .filter(m => m.metric_category === category && m.metric_name === name)
      .sort((a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime())
      .map(m => ({
        time: new Date(m.recorded_at).toLocaleTimeString(),
        value: m.metric_value
      }));
    
    return filteredMetrics;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Activity className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">System Health</h1>
          <p className="text-muted-foreground mt-1">
            Monitor system health and performance metrics
          </p>
        </div>
        <Button onClick={handleRefresh} disabled={refreshing}>
          <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Overall Status */}
      <Card className={`border-2 ${getStatusColor(health?.overall_status || 'unknown')}`}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {getStatusIcon(health?.overall_status || 'unknown')}
              <div>
                <h2 className="text-2xl font-bold capitalize">
                  {health?.overall_status || 'Unknown'}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  System Status
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Last check</p>
              <p className="text-sm font-medium">
                {health?.checks[0] ? new Date(health.checks[0].checked_at).toLocaleTimeString() : 'N/A'}
              </p>
            </div>
          </div>
          
          {health && health.unhealthy_services.length > 0 && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm font-medium text-red-800">
                ⚠️ {health.unhealthy_services.length} service(s) need attention:
              </p>
              <ul className="mt-2 text-sm text-red-700 space-y-1">
                {health.unhealthy_services.map((service, idx) => (
                  <li key={idx}>• {service}</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Service Health Checks */}
      <Card>
        <CardHeader>
          <CardTitle>Service Health Checks</CardTitle>
          <CardDescription>Status of critical system components</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {health?.checks.map((check, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center space-x-4">
                  <div className={`p-2 rounded-lg ${getStatusColor(check.status)}`}>
                    {getServiceIcon(check.check_type)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{check.service_name}</p>
                      <Badge className={getStatusColor(check.status)}>
                        {check.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Type: {check.check_type}
                    </p>
                    {check.error_message && (
                      <p className="text-sm text-red-600 mt-1">
                        Error: {check.error_message}
                      </p>
                    )}
                  </div>
                </div>
                {check.response_time_ms !== undefined && (
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Response Time</p>
                    <p className="text-lg font-semibold">
                      {check.response_time_ms}ms
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* System Metrics */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>CPU Usage</CardTitle>
            <CardDescription>Processor utilization over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={prepareMetricChart('cpu', 'usage_percent')}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip formatter={(value: any) => `${value}%`} />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Memory Usage</CardTitle>
            <CardDescription>RAM utilization over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={prepareMetricChart('memory', 'usage_percent')}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip formatter={(value: any) => `${value}%`} />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>API Requests</CardTitle>
            <CardDescription>Requests per minute</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={prepareMetricChart('api', 'requests_per_minute')}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#f59e0b" 
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Database Connections</CardTitle>
            <CardDescription>Active database connections</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={prepareMetricChart('database', 'active_connections')}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#8b5cf6" 
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
