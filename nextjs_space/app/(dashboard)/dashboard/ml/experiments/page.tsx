
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { 
  PlayCircle, 
  StopCircle, 
  GitCompare, 
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2
} from 'lucide-react';

interface Experiment {
  id: string;
  name: string;
  description: string;
  model_id: string;
  parameters: any;
  status: string;
  created_at: string;
  results?: any;
}

export default function ExperimentsPage() {
  const { data: session } = useSession() || {};
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [models, setModels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedExperiment, setSelectedExperiment] = useState<Experiment | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [newExperiment, setNewExperiment] = useState({
    name: '',
    description: '',
    modelId: '',
    parameters: {}
  });

  useEffect(() => {
    if (session) {
      fetchExperiments();
      fetchModels();
    }
  }, [session]);

  const fetchExperiments = async () => {
    try {
      const response = await fetch('/api/ml/experiments');
      const data = await response.json();
      setExperiments(data.experiments || []);
    } catch (error) {
      console.error('Error fetching experiments:', error);
      toast.error('Không thể tải danh sách experiments');
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

  const createExperiment = async () => {
    if (!newExperiment.name || !newExperiment.modelId) {
      toast.error('Vui lòng nhập tên và chọn model');
      return;
    }

    try {
      const response = await fetch('/api/ml/experiments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newExperiment)
      });

      if (response.ok) {
        toast.success('Đã tạo experiment thành công');
        setNewExperiment({ name: '', description: '', modelId: '', parameters: {} });
        setIsDialogOpen(false);
        fetchExperiments();
      } else {
        toast.error('Không thể tạo experiment');
      }
    } catch (error) {
      console.error('Error creating experiment:', error);
      toast.error('Đã xảy ra lỗi');
    }
  };

  const compareExperiments = async () => {
    if (selectedForCompare.length < 2) {
      toast.error('Vui lòng chọn ít nhất 2 experiments để so sánh');
      return;
    }

    try {
      const response = await fetch('/api/ml/experiments/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ experimentIds: selectedForCompare })
      });

      const data = await response.json();
      // Hiển thị kết quả so sánh
      toast.success('Đã tải dữ liệu so sánh');
      console.log('Comparison data:', data);
    } catch (error) {
      console.error('Error comparing experiments:', error);
      toast.error('Không thể so sánh experiments');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: any; icon: any }> = {
      running: { variant: 'default', icon: Loader2 },
      completed: { variant: 'success', icon: CheckCircle2 },
      failed: { variant: 'destructive', icon: XCircle },
      pending: { variant: 'secondary', icon: Clock }
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant as any} className="flex items-center gap-1 w-fit">
        <Icon className="w-3 h-3" />
        {status}
      </Badge>
    );
  };

  const toggleSelectForCompare = (id: string) => {
    setSelectedForCompare(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
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
          <h1 className="text-3xl font-bold text-military-dark">Experiment Tracking</h1>
          <p className="text-military-medium mt-1">
            Theo dõi và quản lý các thí nghiệm ML
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={compareMode ? 'default' : 'outline'}
            onClick={() => {
              setCompareMode(!compareMode);
              if (!compareMode) setSelectedForCompare([]);
            }}
          >
            <GitCompare className="w-4 h-4 mr-2" />
            {compareMode ? 'Hủy So Sánh' : 'So Sánh'}
          </Button>
          {compareMode && (
            <Button onClick={compareExperiments} disabled={selectedForCompare.length < 2}>
              So Sánh {selectedForCompare.length} Experiments
            </Button>
          )}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlayCircle className="w-4 h-4 mr-2" />
                Tạo Experiment
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Tạo Experiment Mới</DialogTitle>
                <DialogDescription>
                  Tạo experiment mới để theo dõi quá trình training
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="exp-name">Tên Experiment</Label>
                  <Input
                    id="exp-name"
                    value={newExperiment.name}
                    onChange={(e) => setNewExperiment({ ...newExperiment, name: e.target.value })}
                    placeholder="VD: BERT-finetuning-v1"
                  />
                </div>
                <div>
                  <Label htmlFor="exp-model">Model</Label>
                  <Select
                    value={newExperiment.modelId || undefined}
                    onValueChange={(value) => setNewExperiment({ ...newExperiment, modelId: value })}
                  >
                    <SelectTrigger id="exp-model">
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
                  <Label htmlFor="exp-desc">Mô Tả</Label>
                  <Textarea
                    id="exp-desc"
                    value={newExperiment.description}
                    onChange={(e) => setNewExperiment({ ...newExperiment, description: e.target.value })}
                    placeholder="Mô tả về experiment này"
                  />
                </div>
                <Button onClick={createExperiment} className="w-full">
                  Tạo Experiment
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh Sách Experiments</CardTitle>
          <CardDescription>
            Tổng số {experiments.length} experiments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                {compareMode && <TableHead className="w-12"></TableHead>}
                <TableHead>Tên</TableHead>
                <TableHead>Model</TableHead>
                <TableHead>Trạng Thái</TableHead>
                <TableHead>Ngày Tạo</TableHead>
                <TableHead>Thao Tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {experiments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={compareMode ? 6 : 5} className="text-center text-military-medium">
                    Chưa có experiments nào
                  </TableCell>
                </TableRow>
              ) : (
                experiments.map((exp) => (
                  <TableRow key={exp.id}>
                    {compareMode && (
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedForCompare.includes(exp.id)}
                          onChange={() => toggleSelectForCompare(exp.id)}
                          className="w-4 h-4"
                        />
                      </TableCell>
                    )}
                    <TableCell className="font-medium">{exp.name}</TableCell>
                    <TableCell>{exp.model_id}</TableCell>
                    <TableCell>{getStatusBadge(exp.status)}</TableCell>
                    <TableCell>{new Date(exp.created_at).toLocaleDateString('vi-VN')}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedExperiment(exp)}
                      >
                        Xem Chi Tiết
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {selectedExperiment && (
        <Card>
          <CardHeader>
            <CardTitle>Chi Tiết Experiment: {selectedExperiment.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="info">
              <TabsList>
                <TabsTrigger value="info">Thông Tin</TabsTrigger>
                <TabsTrigger value="metrics">Metrics</TabsTrigger>
                <TabsTrigger value="params">Parameters</TabsTrigger>
              </TabsList>
              <TabsContent value="info" className="space-y-4">
                <div>
                  <Label>Mô Tả</Label>
                  <p className="text-sm text-military-medium">{selectedExperiment.description || 'Không có mô tả'}</p>
                </div>
                <div>
                  <Label>Trạng Thái</Label>
                  <div className="mt-1">{getStatusBadge(selectedExperiment.status)}</div>
                </div>
              </TabsContent>
              <TabsContent value="metrics">
                <p className="text-sm text-military-medium">Metrics sẽ được hiển thị ở đây</p>
              </TabsContent>
              <TabsContent value="params">
                <pre className="bg-muted p-4 rounded-md text-sm overflow-auto">
                  {JSON.stringify(selectedExperiment.parameters, null, 2)}
                </pre>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
