
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter } from 'recharts';
import { Activity, TrendingUp, Clock, Play, CheckCircle, XCircle, Download, RefreshCw, BarChart3 } from 'lucide-react';

interface MLRun {
  run_id: string;
  run_name: string;
  experiment_id: number;
  experiment_name: string;
  status: string;
  start_time: number;
  end_time?: number;
  user_id: number;
  tags?: any;
}

interface Metric {
  metric_key: string;
  metric_value: number;
  timestamp: number;
  step: number;
}

interface MetricSeries {
  step: number;
  [key: string]: number;
}

export default function MLTrackingPage() {
  const [runs, setRuns] = useState<MLRun[]>([]);
  const [selectedRun, setSelectedRun] = useState<string | null>(null);
  const [runDetails, setRunDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [experiments, setExperiments] = useState<any[]>([]);
  const [selectedExperiment, setSelectedExperiment] = useState<string>('all');
  const [chartType, setChartType] = useState<'line' | 'area' | 'scatter'>('line');
  const [autoRefresh, setAutoRefresh] = useState(false);

  useEffect(() => {
    loadExperiments();
    loadRuns();
  }, [selectedExperiment]);

  useEffect(() => {
    if (selectedRun) {
      loadRunDetails(selectedRun);
    }
  }, [selectedRun]);

  useEffect(() => {
    if (autoRefresh && selectedRun) {
      const interval = setInterval(() => {
        loadRunDetails(selectedRun);
      }, 5000); // Refresh every 5 seconds
      
      return () => clearInterval(interval);
    }
  }, [autoRefresh, selectedRun]);

  const loadExperiments = async () => {
    try {
      const res = await fetch('/api/ml/experiments');
      const data = await res.json();
      if (data.success) {
        setExperiments(data.experiments || []);
      }
    } catch (error) {
      console.error('Failed to load experiments:', error);
    }
  };

  const loadRuns = async () => {
    try {
      setLoading(true);
      const url = selectedExperiment !== 'all' 
        ? `/api/ml/tracking?experimentId=${selectedExperiment}`
        : '/api/ml/tracking';
      
      const res = await fetch(url);
      const data = await res.json();
      
      if (data.success) {
        setRuns(data.runs || []);
        if (data.runs?.length > 0 && !selectedRun) {
          setSelectedRun(data.runs[0].run_id);
        }
      }
    } catch (error) {
      console.error('Failed to load runs:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRunDetails = async (runId: string) => {
    try {
      const res = await fetch(`/api/ml/tracking?runId=${runId}`);
      const data = await res.json();
      if (data.success) {
        setRunDetails(data);
      }
    } catch (error) {
      console.error('Failed to load run details:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'RUNNING':
        return <Play className="h-4 w-4 text-blue-500" />;
      case 'FINISHED':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'FAILED':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: any = {
      RUNNING: 'default',
      FINISHED: 'secondary',
      FAILED: 'destructive',
      KILLED: 'secondary',
    };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  const formatDuration = (startTime: number, endTime?: number) => {
    const duration = (endTime || Date.now()) - startTime;
    const seconds = Math.floor(duration / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  // Prepare chart data from metrics
  const prepareChartData = (metrics: Metric[], metricKey: string) => {
    return metrics
      .filter(m => m.metric_key === metricKey)
      .sort((a, b) => a.step - b.step)
      .map(m => ({
        step: m.step,
        value: m.metric_value,
        timestamp: new Date(m.timestamp).toLocaleTimeString(),
      }));
  };

  const getMetricKeys = (): string[] => {
    if (!runDetails?.metrics) return [];
    return [...new Set(runDetails.metrics.map((m: Metric) => m.metric_key))] as string[];
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">ML Tracking</h2>
          <p className="text-muted-foreground">Monitor training runs and experiments</p>
        </div>
        <Select value={selectedExperiment} onValueChange={setSelectedExperiment}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select experiment" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Experiments</SelectItem>
            {experiments.map((exp) => (
              <SelectItem key={exp.id} value={String(exp.id)}>
                {exp.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Runs List */}
        <Card>
          <CardHeader>
            <CardTitle>Training Runs</CardTitle>
            <CardDescription>{runs.length} runs found</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {runs.map((run) => (
                <div
                  key={run.run_id}
                  className={`p-3 border rounded-lg cursor-pointer hover:bg-accent transition-colors ${
                    selectedRun === run.run_id ? 'bg-accent border-primary' : ''
                  }`}
                  onClick={() => setSelectedRun(run.run_id)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(run.status)}
                      <span className="font-medium">{run.run_name}</span>
                    </div>
                    {getStatusBadge(run.status)}
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <div>Experiment: {run.experiment_name}</div>
                    <div>Duration: {formatDuration(run.start_time, run.end_time)}</div>
                    <div>Started: {new Date(run.start_time).toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Run Details */}
        {runDetails && (
          <Card>
            <CardHeader>
              <CardTitle>Run Details</CardTitle>
              <CardDescription>
                {runDetails.run?.run_name} - {runDetails.run?.run_id?.slice(0, 8)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="metrics">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="metrics">Metrics</TabsTrigger>
                  <TabsTrigger value="params">Parameters</TabsTrigger>
                </TabsList>
                
                <TabsContent value="metrics" className="space-y-4">
                  {getMetricKeys().length === 0 ? (
                    <p className="text-sm text-muted-foreground">No metrics logged yet</p>
                  ) : (
                    getMetricKeys().map((metricKey) => {
                      const data = prepareChartData(runDetails.metrics, metricKey);
                      const latestValue = data[data.length - 1]?.value;
                      
                      return (
                        <div key={metricKey} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium capitalize">{metricKey.replace(/_/g, ' ')}</h4>
                            <Badge variant="outline">{latestValue?.toFixed(4)}</Badge>
                          </div>
                          <ResponsiveContainer width="100%" height={200}>
                            <LineChart data={data}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis 
                                dataKey="step" 
                                label={{ value: 'Step', position: 'insideBottom', offset: -5 }}
                              />
                              <YAxis />
                              <Tooltip />
                              <Line 
                                type="monotone" 
                                dataKey="value" 
                                stroke="#8884d8" 
                                strokeWidth={2}
                                dot={false}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      );
                    })
                  )}
                </TabsContent>
                
                <TabsContent value="params" className="space-y-2">
                  {runDetails.params?.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No parameters logged</p>
                  ) : (
                    <div className="space-y-2">
                      {runDetails.params?.map((param: any) => (
                        <div key={param.param_key} className="flex justify-between p-2 border rounded">
                          <span className="font-medium">{param.param_key}</span>
                          <span className="text-muted-foreground">{param.param_value}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Runs</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{runs.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Running</CardTitle>
            <Play className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {runs.filter(r => r.status === 'RUNNING').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {runs.filter(r => r.status === 'FINISHED').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {runs.filter(r => r.status === 'FAILED').length}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
