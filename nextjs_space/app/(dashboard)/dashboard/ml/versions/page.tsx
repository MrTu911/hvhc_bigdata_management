
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
import { toast } from 'sonner';
import { 
  PackageCheck, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  GitBranch,
  Loader2,
  Rocket,
  Archive
} from 'lucide-react';

interface ModelVersion {
  id: string;
  model_id: string;
  version_number: number;
  description: string;
  status: string;
  stage: string;
  created_at: string;
  metrics?: any;
}

export default function ModelVersionsPage() {
  const { data: session } = useSession() || {};
  const [models, setModels] = useState<any[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [versions, setVersions] = useState<ModelVersion[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [newVersion, setNewVersion] = useState({
    description: '',
    experimentId: '',
    artifactPath: ''
  });

  useEffect(() => {
    if (session) {
      fetchModels();
    }
  }, [session]);

  useEffect(() => {
    if (selectedModel) {
      fetchVersions();
    }
  }, [selectedModel]);

  const fetchModels = async () => {
    try {
      const response = await fetch('/api/ml/models');
      const data = await response.json();
      setModels(data.models || []);
      if (data.models && data.models.length > 0) {
        setSelectedModel(data.models[0].id);
      }
    } catch (error) {
      console.error('Error fetching models:', error);
      toast.error('Không thể tải danh sách models');
    }
  };

  const fetchVersions = async () => {
    if (!selectedModel) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/ml/models/${selectedModel}/versions`);
      const data = await response.json();
      setVersions(data.versions || []);
    } catch (error) {
      console.error('Error fetching versions:', error);
      toast.error('Không thể tải danh sách versions');
    } finally {
      setLoading(false);
    }
  };

  const createVersion = async () => {
    if (!newVersion.description) {
      toast.error('Vui lòng nhập mô tả');
      return;
    }

    try {
      const response = await fetch(`/api/ml/models/${selectedModel}/versions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newVersion)
      });

      if (response.ok) {
        toast.success('Đã tạo version mới thành công');
        setNewVersion({ description: '', experimentId: '', artifactPath: '' });
        setIsDialogOpen(false);
        fetchVersions();
      } else {
        toast.error('Không thể tạo version');
      }
    } catch (error) {
      console.error('Error creating version:', error);
      toast.error('Đã xảy ra lỗi');
    }
  };

  const promoteVersion = async (versionId: string) => {
    try {
      const response = await fetch(`/api/ml/models/${selectedModel}/versions/${versionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: 'production' })
      });

      if (response.ok) {
        toast.success('Đã promote version lên production');
        fetchVersions();
      } else {
        toast.error('Không thể promote version');
      }
    } catch (error) {
      console.error('Error promoting version:', error);
      toast.error('Đã xảy ra lỗi');
    }
  };

  const archiveVersion = async (versionId: string) => {
    try {
      const response = await fetch(`/api/ml/models/${selectedModel}/versions/${versionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: 'archived' })
      });

      if (response.ok) {
        toast.success('Đã archive version');
        fetchVersions();
      } else {
        toast.error('Không thể archive version');
      }
    } catch (error) {
      console.error('Error archiving version:', error);
      toast.error('Đã xảy ra lỗi');
    }
  };

  const getStageBadge = (stage: string) => {
    const stageConfig: Record<string, { variant: any; icon: any }> = {
      production: { variant: 'success', icon: Rocket },
      staging: { variant: 'default', icon: GitBranch },
      development: { variant: 'secondary', icon: GitBranch },
      archived: { variant: 'outline', icon: Archive }
    };

    const config = stageConfig[stage] || stageConfig.development;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant as any} className="flex items-center gap-1 w-fit">
        <Icon className="w-3 h-3" />
        {stage}
      </Badge>
    );
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-military-dark">Model Versioning</h1>
          <p className="text-military-medium mt-1">
            Quản lý và theo dõi các phiên bản model
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button disabled={!selectedModel}>
              <PackageCheck className="w-4 h-4 mr-2" />
              Tạo Version Mới
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tạo Model Version Mới</DialogTitle>
              <DialogDescription>
                Tạo phiên bản mới cho model {models.find(m => m.id === selectedModel)?.name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="ver-desc">Mô Tả</Label>
                <Textarea
                  id="ver-desc"
                  value={newVersion.description}
                  onChange={(e) => setNewVersion({ ...newVersion, description: e.target.value })}
                  placeholder="Mô tả về version này"
                />
              </div>
              <div>
                <Label htmlFor="ver-exp">Experiment ID (Optional)</Label>
                <Input
                  id="ver-exp"
                  value={newVersion.experimentId}
                  onChange={(e) => setNewVersion({ ...newVersion, experimentId: e.target.value })}
                  placeholder="exp_xxx"
                />
              </div>
              <div>
                <Label htmlFor="ver-artifact">Artifact Path (Optional)</Label>
                <Input
                  id="ver-artifact"
                  value={newVersion.artifactPath}
                  onChange={(e) => setNewVersion({ ...newVersion, artifactPath: e.target.value })}
                  placeholder="s3://bucket/path/to/model"
                />
              </div>
              <Button onClick={createVersion} className="w-full">
                Tạo Version
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Model Versions</CardTitle>
              <CardDescription>Chọn model để xem các versions</CardDescription>
            </div>
            <Select value={selectedModel || undefined} onValueChange={setSelectedModel}>
              <SelectTrigger className="w-64">
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
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Version</TableHead>
                  <TableHead>Mô Tả</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ngày Tạo</TableHead>
                  <TableHead>Thao Tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {versions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-military-medium">
                      Chưa có versions nào
                    </TableCell>
                  </TableRow>
                ) : (
                  versions.map((ver) => (
                    <TableRow key={ver.id}>
                      <TableCell className="font-mono">v{ver.version_number}</TableCell>
                      <TableCell>{ver.description || 'Không có mô tả'}</TableCell>
                      <TableCell>{getStageBadge(ver.stage || 'development')}</TableCell>
                      <TableCell>
                        <Badge variant={ver.status === 'active' ? 'default' : 'secondary'}>
                          {ver.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(ver.created_at).toLocaleDateString('vi-VN')}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {ver.stage !== 'production' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => promoteVersion(ver.id)}
                            >
                              <ArrowUpCircle className="w-4 h-4 mr-1" />
                              Promote
                            </Button>
                          )}
                          {ver.stage !== 'archived' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => archiveVersion(ver.id)}
                            >
                              <Archive className="w-4 h-4 mr-1" />
                              Archive
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
