
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Play,
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Activity,
  Database,
  Upload,
  Trash2
} from 'lucide-react';
import { toast } from 'sonner';

interface ETLWorkflow {
  id: number;
  name: string;
  description?: string;
  workflow_type: string;
  schedule_cron?: string;
  is_active: boolean;
  priority: number;
}

interface ETLExecution {
  id: number;
  workflow_id: number;
  execution_status: string;
  started_at: string;
  completed_at?: string;
  duration_seconds?: number;
  records_processed: number;
  records_success: number;
  records_failed: number;
  triggered_by: string;
}

export default function ETLAutomationPage() {
  const [workflows, setWorkflows] = useState<ETLWorkflow[]>([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState<number | null>(null);
  const [executions, setExecutions] = useState<ETLExecution[]>([]);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  useEffect(() => {
    loadWorkflows();
  }, []);

  useEffect(() => {
    if (selectedWorkflow) {
      loadExecutionHistory(selectedWorkflow);
    }
  }, [selectedWorkflow]);

  const loadWorkflows = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/etl/workflows');
      const data = await response.json();
      
      if (data.success) {
        setWorkflows(data.data || []);
        if (data.data && data.data.length > 0 && !selectedWorkflow) {
          setSelectedWorkflow(data.data[0].id);
        }
      }
    } catch (error) {
      console.error('Error loading workflows:', error);
      toast.error('Failed to load workflows');
    } finally {
      setLoading(false);
    }
  };

  const loadExecutionHistory = async (workflowId: number) => {
    try {
      const response = await fetch(`/api/etl/workflows/${workflowId}/history`);
      const data = await response.json();
      
      if (data.success) {
        setExecutions(data.data || []);
      }
    } catch (error) {
      console.error('Error loading execution history:', error);
    }
  };

  const executeWorkflow = async (workflowId: number) => {
    try {
      setExecuting(true);
      const response = await fetch(`/api/etl/workflows/${workflowId}/execute`, {
        method: 'POST'
      });
      const data = await response.json();
      
      if (data.success) {
        toast.success(data.message || 'Workflow executed successfully');
        loadExecutionHistory(workflowId);
      } else {
        toast.error(data.message || 'Workflow execution failed');
      }
    } catch (error) {
      console.error('Error executing workflow:', error);
      toast.error('Failed to execute workflow');
    } finally {
      setExecuting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'running':
        return 'bg-blue-500';
      case 'failed':
        return 'bg-red-500';
      case 'pending':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'running':
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'failed':
        return <XCircle className="h-4 w-4" />;
      case 'pending':
        return <Clock className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getWorkflowTypeIcon = (type: string) => {
    switch (type) {
      case 'upload':
        return <Upload className="h-4 w-4" />;
      case 'clean':
        return <Trash2 className="h-4 w-4" />;
      case 'process':
        return <Activity className="h-4 w-4" />;
      case 'train':
        return <Database className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">ETL Automation</h1>
          <p className="text-muted-foreground mt-1">
            Automated ETL workflows and data processing pipelines
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Workflow
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create ETL Workflow</DialogTitle>
              <DialogDescription>
                Set up a new automated data processing workflow
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Workflow Name</Label>
                <Input id="name" placeholder="My Data Pipeline" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" placeholder="What does this workflow do?" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Workflow Type</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="upload">Upload</SelectItem>
                    <SelectItem value="clean">Clean</SelectItem>
                    <SelectItem value="process">Process</SelectItem>
                    <SelectItem value="train">Train</SelectItem>
                    <SelectItem value="hybrid">Hybrid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="schedule">Schedule (Cron)</Label>
                <Input id="schedule" placeholder="0 2 * * * (daily at 2 AM)" />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={() => {
                toast.success('Workflow created successfully');
                setShowCreateDialog(false);
                loadWorkflows();
              }}>
                Create
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Workflows</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{workflows.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Active pipelines</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today&apos;s Runs</CardTitle>
            <Play className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {executions.filter(e => 
                new Date(e.started_at).toDateString() === new Date().toDateString()
              ).length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Executed today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {executions.length > 0 
                ? `${((executions.filter(e => e.execution_status === 'completed').length / executions.length) * 100).toFixed(1)}%`
                : '0%'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Completion rate</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Records Processed</CardTitle>
            <Database className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {executions.reduce((sum, e) => sum + e.records_processed, 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Total records</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="workflows" className="w-full">
        <TabsList>
          <TabsTrigger value="workflows">
            <Activity className="mr-2 h-4 w-4" />
            Workflows
          </TabsTrigger>
          <TabsTrigger value="executions">
            <Clock className="mr-2 h-4 w-4" />
            Execution History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="workflows" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>ETL Workflows</CardTitle>
              <CardDescription>Manage your data processing pipelines</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {workflows.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No workflows found. Create your first workflow to get started.
                  </div>
                ) : (
                  workflows.map((workflow) => (
                    <div
                      key={workflow.id}
                      className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedWorkflow === workflow.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                      }`}
                      onClick={() => setSelectedWorkflow(workflow.id)}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="p-2 rounded-lg bg-primary/10">
                          {getWorkflowTypeIcon(workflow.workflow_type)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{workflow.name}</p>
                            <Badge variant={workflow.is_active ? 'default' : 'secondary'}>
                              {workflow.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              Priority: {workflow.priority}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {workflow.description || 'No description'}
                          </p>
                          {workflow.schedule_cron && (
                            <p className="text-xs text-muted-foreground mt-1">
                              <Clock className="inline h-3 w-3 mr-1" />
                              Schedule: {workflow.schedule_cron}
                            </p>
                          )}
                        </div>
                      </div>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          executeWorkflow(workflow.id);
                        }}
                        disabled={executing}
                        size="sm"
                      >
                        {executing ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Play className="mr-2 h-4 w-4" />
                            Execute
                          </>
                        )}
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="executions">
          <Card>
            <CardHeader>
              <CardTitle>Execution History</CardTitle>
              <CardDescription>
                {selectedWorkflow 
                  ? `History for ${workflows.find(w => w.id === selectedWorkflow)?.name}`
                  : 'Select a workflow to view history'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {executions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No execution history found.
                  </div>
                ) : (
                  executions.map((execution) => (
                    <div
                      key={execution.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center space-x-4">
                        <div className={`p-2 rounded-full ${getStatusColor(execution.execution_status)}`}>
                          {getStatusIcon(execution.execution_status)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <Badge className={getStatusColor(execution.execution_status)}>
                              {execution.execution_status}
                            </Badge>
                            <Badge variant="outline">
                              {execution.triggered_by}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            Started: {new Date(execution.started_at).toLocaleString()}
                          </p>
                          {execution.duration_seconds && (
                            <p className="text-sm text-muted-foreground">
                              Duration: {execution.duration_seconds}s
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right space-y-1">
                        <div className="text-sm">
                          <span className="text-muted-foreground">Processed:</span>
                          <span className="ml-2 font-medium">{execution.records_processed.toLocaleString()}</span>
                        </div>
                        <div className="text-sm">
                          <span className="text-green-600">{execution.records_success.toLocaleString()} ✓</span>
                          <span className="mx-2 text-muted-foreground">|</span>
                          <span className="text-red-600">{execution.records_failed.toLocaleString()} ✗</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
