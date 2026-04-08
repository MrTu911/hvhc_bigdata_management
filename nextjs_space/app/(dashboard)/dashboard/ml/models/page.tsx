'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
  Brain,
  Plus,
  Search,
  Eye,
  Play,
  RefreshCw,
  Cpu,
  Zap,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { KPICard, PageHeader, FilterBar, StatusBadge } from '@/components/ui/enhanced-data-card';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

interface MLModel {
  id: string;
  name: string;
  description?: string;
  modelType: string;
  framework: string;
  status: string;
  classification: string;
  accuracy?: number;
  version: string;
  createdAt: string;
  trainingJobs: any[];
}

const statusColors: Record<string, string> = {
  DRAFT: 'bg-gray-500',
  TRAINING: 'bg-blue-500 animate-pulse',
  TRAINED: 'bg-green-500',
  DEPLOYED: 'bg-purple-500',
  FAILED: 'bg-red-500',
  DEPRECATED: 'bg-orange-500',
};

const classificationColors: Record<string, string> = {
  PUBLIC: 'bg-green-600',
  INTERNAL: 'bg-yellow-600',
  CONFIDENTIAL: 'bg-red-600',
};

export default function MLModelsPage() {
  const { data: session } = useSession() || {};
  const [models, setModels] = useState<MLModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [creating, setCreating] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    modelType: 'CLASSIFICATION',
    framework: 'TENSORFLOW',
    classification: 'INTERNAL',
    tags: '',
  });

  useEffect(() => {
    fetchModels();
  }, [statusFilter, typeFilter]);

  const fetchModels = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (typeFilter !== 'all') params.append('modelType', typeFilter);

      const response = await fetch(`/api/ml/models?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setModels(data.data);
      } else {
        toast.error(data.error || 'Failed to fetch models');
      }
    } catch (error) {
      console.error('Error fetching models:', error);
      toast.error('Failed to fetch models');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateModel = async () => {
    try {
      setCreating(true);

      const response = await fetch('/api/ml/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          tags: formData.tags.split(',').map((t) => t.trim()).filter(Boolean),
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Model created successfully!');
        setShowCreateDialog(false);
        setFormData({
          name: '',
          description: '',
          modelType: 'CLASSIFICATION',
          framework: 'TENSORFLOW',
          classification: 'INTERNAL',
          tags: '',
        });
        fetchModels();
      } else {
        toast.error(data.error || 'Failed to create model');
      }
    } catch (error) {
      console.error('Error creating model:', error);
      toast.error('Failed to create model');
    } finally {
      setCreating(false);
    }
  };

  const filteredModels = models.filter((model) =>
    model.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate stats
  const totalModels = models.length;
  const trainedModels = models.filter(m => m.status === 'TRAINED' || m.status === 'DEPLOYED').length;
  const deployedModels = models.filter(m => m.status === 'DEPLOYED').length;
  const avgAccuracy = models.filter(m => m.accuracy).reduce((sum, m) => sum + (m.accuracy || 0), 0) / (models.filter(m => m.accuracy).length || 1);

  return (
    <div className="p-6 space-y-6">
      {/* Enhanced Page Header */}
      <PageHeader
        title="ML Models Registry"
        subtitle="Quản lý và theo dõi các mô hình học máy"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => fetchModels()}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Làm mới
            </Button>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Tạo mô hình mới
                </Button>
              </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Tạo mô hình học máy mới</DialogTitle>
              <DialogDescription>
                Nhập thông tin cơ bản cho mô hình của bạn
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Tên mô hình *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="VD: Sentiment Analysis Model"
                />
              </div>
              <div>
                <Label htmlFor="description">Mô tả</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Mô tả chi tiết về mô hình..."
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="modelType">Loại mô hình</Label>
                  <Select
                    value={formData.modelType}
                    onValueChange={(value) =>
                      setFormData({ ...formData, modelType: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CLASSIFICATION">Classification</SelectItem>
                      <SelectItem value="REGRESSION">Regression</SelectItem>
                      <SelectItem value="CLUSTERING">Clustering</SelectItem>
                      <SelectItem value="NEURAL_NETWORK">Neural Network</SelectItem>
                      <SelectItem value="DEEP_LEARNING">Deep Learning</SelectItem>
                      <SelectItem value="NLP">NLP</SelectItem>
                      <SelectItem value="COMPUTER_VISION">Computer Vision</SelectItem>
                      <SelectItem value="TIME_SERIES">Time Series</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="framework">Framework</Label>
                  <Select
                    value={formData.framework}
                    onValueChange={(value) =>
                      setFormData({ ...formData, framework: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TENSORFLOW">TensorFlow</SelectItem>
                      <SelectItem value="PYTORCH">PyTorch</SelectItem>
                      <SelectItem value="KERAS">Keras</SelectItem>
                      <SelectItem value="SCIKIT_LEARN">Scikit-Learn</SelectItem>
                      <SelectItem value="XGBOOST">XGBoost</SelectItem>
                      <SelectItem value="LIGHTGBM">LightGBM</SelectItem>
                      <SelectItem value="CATBOOST">CatBoost</SelectItem>
                      <SelectItem value="HUGGINGFACE">HuggingFace</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="classification">Phân loại bảo mật</Label>
                <Select
                  value={formData.classification}
                  onValueChange={(value) =>
                    setFormData({ ...formData, classification: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PUBLIC">Public</SelectItem>
                    <SelectItem value="INTERNAL">Internal</SelectItem>
                    <SelectItem value="CONFIDENTIAL">Confidential</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="tags">Tags (phân cách bằng dấu phẩy)</Label>
                <Input
                  id="tags"
                  value={formData.tags}
                  onChange={(e) =>
                    setFormData({ ...formData, tags: e.target.value })
                  }
                  placeholder="VD: nlp, sentiment, research"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowCreateDialog(false)}
                >
                  Hủy
                </Button>
                <Button onClick={handleCreateModel} disabled={creating}>
                  {creating ? 'Đang tạo...' : 'Tạo mô hình'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
          </div>
        }
      />

      {/* Enhanced KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <KPICard
          title="Tổng số mô hình"
          value={totalModels}
          subtitle="Models trong hệ thống"
          icon={Brain}
          variant="info"
        />
        <KPICard
          title="Đã huấn luyện"
          value={trainedModels}
          subtitle="Models đã train"
          icon={CheckCircle2}
          variant="success"
        />
        <KPICard
          title="Đã triển khai"
          value={deployedModels}
          subtitle="Đang production"
          icon={Zap}
          variant="warning"
        />
        <KPICard
          title="Độ chính xác TB"
          value={avgAccuracy > 0 ? `${(avgAccuracy * 100).toFixed(1)}%` : 'N/A'}
          subtitle="Trung bình accuracy"
          icon={Cpu}
          variant="default"
        />
      </div>

      {/* Keep the rest of the original Card structure for backward compatibility */}
      <div className="hidden">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Đã triển khai</CardDescription>
            <CardTitle className="text-3xl">
              {models.filter((m) => m.status === 'DEPLOYED').length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Độ chính xác TB</CardDescription>
            <CardTitle className="text-3xl">
              {models.length > 0 && models.filter((m) => m.accuracy).length > 0
                ? (
                    models.reduce((sum, m) => sum + (m.accuracy || 0), 0) /
                    models.filter((m) => m.accuracy).length
                  ).toFixed(1)
                : 0}
              %
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Enhanced Filters */}
      <FilterBar>
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Tìm kiếm mô hình..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white dark:bg-slate-900"
          />
        </div>
        <div className="w-[180px]">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="bg-white dark:bg-slate-900">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả trạng thái</SelectItem>
              <SelectItem value="DRAFT">Draft</SelectItem>
              <SelectItem value="TRAINING">Training</SelectItem>
              <SelectItem value="TRAINED">Trained</SelectItem>
              <SelectItem value="DEPLOYED">Deployed</SelectItem>
              <SelectItem value="FAILED">Failed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="w-[180px]">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="bg-white dark:bg-slate-900">
              <SelectValue placeholder="Loại mô hình" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả loại</SelectItem>
              <SelectItem value="CLASSIFICATION">Classification</SelectItem>
              <SelectItem value="REGRESSION">Regression</SelectItem>
              <SelectItem value="NLP">NLP</SelectItem>
              <SelectItem value="COMPUTER_VISION">Computer Vision</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </FilterBar>

      {/* Models List */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Đang tải...</p>
        </div>
      ) : filteredModels.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Brain className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Chưa có mô hình nào</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredModels.map((model) => (
            <Card key={model.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{model.name}</CardTitle>
                    <CardDescription className="mt-1">
                      {model.description || 'Không có mô tả'}
                    </CardDescription>
                  </div>
                  <Badge
                    className={`${
                      classificationColors[model.classification]
                    } text-white`}
                  >
                    {model.classification}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Trạng thái:</span>
                  <Badge
                    className={`${statusColors[model.status]} text-white`}
                  >
                    {model.status}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Loại:</span>
                  <span className="font-medium">{model.modelType}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Framework:</span>
                  <span className="font-medium">{model.framework}</span>
                </div>
                {model.accuracy && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Độ chính xác:</span>
                    <span className="font-medium text-green-600">
                      {model.accuracy}%
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Version:</span>
                  <span className="font-medium">{model.version}</span>
                </div>
                <div className="pt-4 flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1">
                    <Eye className="h-4 w-4 mr-1" />
                    Chi tiết
                  </Button>
                  {model.status === 'TRAINED' && (
                    <Button size="sm" variant="default" className="flex-1">
                      <Play className="h-4 w-4 mr-1" />
                      Deploy
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
