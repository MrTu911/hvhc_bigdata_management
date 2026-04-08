
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { 
  Workflow, 
  PlayCircle, 
  StopCircle,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  Plus,
  Trash2
} from 'lucide-react';

interface MLWorkflow {
  id: string;
  name: string;
  description: string;
  model_id: string;
  steps: any[];
  status: string;
  created_at: string;
}

interface WorkflowExecution {
  id: string;
  workflow_id: string;
  status: string;
  progress: number;
  current_step: number;
  started_at: string;
  completed_at?: string;
}

export default function WorkflowsPage() {
  const { data: session } = useSession() || {};
  const [workflows, setWorkflows] = useState<MLWorkflow[]>([]);
  const [models, setModels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWorkflow, setSelectedWorkflow] = useState<MLWorkflow | null>(null);
  const [executions, setExecutions] = useState<WorkflowExecution[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [newWorkflow, setNewWorkflow] = useState({
    name: '',
    description: '',
    modelId: '',
    steps: [
      { id: 1, name: 'Data Preparation', type: 'preprocessing' },
      { id: 2, name: 'Model Training', type: 'training' },
      { id: 3, name: 'Model Evaluation', type: 'evaluation' }
    ]
  });

  useEffect(() => {
    if (session) {
      fetchWorkflows();
      fetchModels();
    }
  }, [session]);

  const fetchWorkflows = async () => {
    try {
      const response = await fetch('/api/ml/workflows');
      const data = await response.json();
      setWorkflows(data.workflows || []);
    } catch (error) {
      console.error('Error fetching workflows:', error);
      toast.error('Không thể tải danh sách workflows');
    } finally {
      setLoading(false);
    }
  };

  const fetchModels = async () => {
    try {
      const response = await fetch('/api/ml/models');
      const data = await response.json();
      setModels(data.models || []);
    } catch (error) {
      console.error('Error fetching models:', error);
    }
  };

  const fetchExecutions = async (workflowId: string) => {
    try {
      const response = await fetch(`/api/ml/workflows/${workflowId}`);
      const data = await response.json();
      setExecutions(data.executions || []);
    } catch (error) {
      console.error('Error fetching executions:', error);
    }
  };

  const createWorkflow = async () => {
    if (!newWorkflow.name || !newWorkflow.modelId) {
      toast.error('Vui lòng nhập tên và chọn model');
      return;
    }

    try {
      const response = await fetch('/api/ml/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newWorkflow)
      });

      if (response.ok) {
        toast.success('Đã tạo workflow thành công');
        setNewWorkflow({
          name: '',
          description: '',
          modelId: '',
          steps: [
            { id: 1, name: 'Data Preparation', type: 'preprocessing' },
            { id: 2, name: 'Model Training', type: 'training' },
            { id: 3, name: 'Model Evaluation', type: 'evaluation' }
          ]
        });
        setIsDialogOpen(false);
        fetchWorkflows();
      } else {
        toast.error('Không thể tạo workflow');
      }
    } catch (error) {
      console.error('Error creating workflow:', error);
      toast.error('Đã xảy ra lỗi');
    }
  };

  const executeWorkflow = async (workflowId: string) => {
    try {
      const response = await fetch(`/api/ml/workflows/${workflowId}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parameters: {} })
      });

      if (response.ok) {
        toast.success('Đã bắt đầu thực thi workflow');
        fetchExecutions(workflowId);
      } else {
        toast.error('Không thể thực thi workflow');
      }
    } catch (error) {
      console.error('Error executing workflow:', error);
      toast.error('Đã xảy ra lỗi');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: any; icon: any }> = {
      running: { variant: 'default', icon: Loader2 },
      completed: { variant: 'success', icon: CheckCircle2 },
      failed: { variant: 'destructive', icon: XCircle },
      draft: { variant: 'secondary', icon: Clock }
    };

    const config = statusConfig[status] || statusConfig.draft;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant as any} className="flex items-center gap-1 w-fit">
        <Icon className="w-3 h-3" />
        {status}
      </Badge>
    );
  };

  const addStep = () => {
    const newId = Math.max(...newWorkflow.steps.map(s => s.id), 0) + 1;
    setNewWorkflow({
      ...newWorkflow,
      steps: [...newWorkflow.steps, { id: newId, name: '', type: 'custom' }]
    });
  };

  const removeStep = (id: number) => {
    setNewWorkflow({
      ...newWorkflow,
      steps: newWorkflow.steps.filter(s => s.id !== id)
    });
  };

  const updateStep = (id: number, field: string, value: string) => {
    setNewWorkflow({
      ...newWorkflow,
      steps: newWorkflow.steps.map(s => 
        s.id === id ? { ...s, [field]: value } : s
      )
    });
  };

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
          <h1 className="text-3xl font-bold text-military-dark">ML Training Workflows</h1>
          <p className="text-military-medium mt-1">
            Quản lý quy trình training tự động
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Workflow className="w-4 h-4 mr-2" />
              Tạo Workflow
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Tạo Training Workflow Mới</DialogTitle>
              <DialogDescription>
                Tạo quy trình training tự động với các bước tùy chỉnh
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="wf-name">Tên Workflow</Label>
                <Input
                  id="wf-name"
                  value={newWorkflow.name}
                  onChange={(e) => setNewWorkflow({ ...newWorkflow, name: e.target.value })}
                  placeholder="VD: Full Training Pipeline"
                />
              </div>
              <div>
                <Label htmlFor="wf-model">Model</Label>
                <Select
                  value={newWorkflow.modelId || undefined}
                  onValueChange={(value) => setNewWorkflow({ ...newWorkflow, modelId: value })}
                >
                  <SelectTrigger id="wf-model">
                    <SelectValue placeholder="Chọn model" />
                  </SelectTrigger>
                  <SelectContent>
                    {models.map((model) => (
                      <SelectItem key={model.id} value={model.id}>
                        {model.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="wf-desc">Mô Tả</Label>
                <Textarea
                  id="wf-desc"
                  value={newWorkflow.description}
                  onChange={(e) => setNewWorkflow({ ...newWorkflow, description: e.target.value })}
                  placeholder="Mô tả về workflow này"
                />
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Các Bước (Steps)</Label>
                  <Button type="button" size="sm" variant="outline" onClick={addStep}>
                    <Plus className="w-4 h-4 mr-1" />
                    Thêm Bước
                  </Button>
                </div>
                <div className="space-y-2">
                  {newWorkflow.steps.map((step, index) => (
                    <div key={step.id} className="flex items-center gap-2 p-3 border rounded-lg">
                      <span className="text-sm font-medium">{index + 1}.</span>
                      <Input
                        value={step.name}
                        onChange={(e) => updateStep(step.id, 'name', e.target.value)}
                        placeholder="Tên bước"
                        className="flex-1"
                      />
                      <Select
                        value={step.type}
                        onValueChange={(value) => updateStep(step.id, 'type', value)}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="preprocessing">Preprocessing</SelectItem>
                          <SelectItem value="training">Training</SelectItem>
                          <SelectItem value="evaluation">Evaluation</SelectItem>
                          <SelectItem value="deployment">Deployment</SelectItem>
                          <SelectItem value="custom">Custom</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => removeStep(step.id)}
                        disabled={newWorkflow.steps.length <= 1}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <Button onClick={createWorkflow} className="w-full">
                Tạo Workflow
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh Sách Workflows</CardTitle>
          <CardDescription>
            Tổng số {workflows.length} workflows
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tên</TableHead>
                <TableHead>Model</TableHead>
                <TableHead>Số Bước</TableHead>
                <TableHead>Trạng Thái</TableHead>
                <TableHead>Ngày Tạo</TableHead>
                <TableHead>Thao Tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {workflows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-military-medium">
                    Chưa có workflows nào
                  </TableCell>
                </TableRow>
              ) : (
                workflows.map((wf) => (
                  <TableRow key={wf.id}>
                    <TableCell className="font-medium">{wf.name}</TableCell>
                    <TableCell>{wf.model_id}</TableCell>
                    <TableCell>{Array.isArray(wf.steps) ? wf.steps.length : 0} bước</TableCell>
                    <TableCell>{getStatusBadge(wf.status)}</TableCell>
                    <TableCell>{new Date(wf.created_at).toLocaleDateString('vi-VN')}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedWorkflow(wf);
                            fetchExecutions(wf.id);
                          }}
                        >
                          Xem Chi Tiết
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => executeWorkflow(wf.id)}
                        >
                          <PlayCircle className="w-4 h-4 mr-1" />
                          Chạy
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {selectedWorkflow && (
        <Card>
          <CardHeader>
            <CardTitle>Chi Tiết Workflow: {selectedWorkflow.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label>Mô Tả</Label>
              <p className="text-sm text-military-medium">{selectedWorkflow.description || 'Không có mô tả'}</p>
            </div>

            <div>
              <Label>Các Bước</Label>
              <div className="mt-2 space-y-2">
                {Array.isArray(selectedWorkflow.steps) && selectedWorkflow.steps.map((step: any, index: number) => (
                  <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-medium">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{step.name}</p>
                      <p className="text-sm text-military-medium">{step.type}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label>Execution History</Label>
              {executions.length === 0 ? (
                <p className="text-sm text-military-medium mt-2">Chưa có lần thực thi nào</p>
              ) : (
                <div className="mt-2 space-y-2">
                  {executions.map((exec) => (
                    <div key={exec.id} className="p-3 border rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          {new Date(exec.started_at).toLocaleString('vi-VN')}
                        </span>
                        {getStatusBadge(exec.status)}
                      </div>
                      {exec.status === 'running' && (
                        <div>
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span>Progress</span>
                            <span>{exec.progress || 0}%</span>
                          </div>
                          <Progress value={exec.progress || 0} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
