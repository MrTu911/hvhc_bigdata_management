'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/components/providers/language-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import {
  Server, HardDrive, Plus, RefreshCw, Wifi, WifiOff,
  Trash2, Edit, CheckCircle2, XCircle, AlertTriangle, Clock, Upload, Download,
  Cpu, MemoryStick, Database, FolderSync, Activity, ArrowLeft
} from 'lucide-react';
import Link from 'next/link';

interface InfraConfig {
  id: string;
  configType: string;
  name: string;
  description?: string;
  isEnabled: boolean;
  connectionUrl: string;
  protocol?: string;
  port?: number;
  username?: string;
  basePath?: string;
  gpuCount?: number;
  gpuType?: string;
  memoryGB?: number;
  storageGB?: number;
  syncEnabled: boolean;
  syncInterval?: number;
  syncDirection?: string;
  lastSyncAt?: string;
  lastSyncStatus?: string;
  lastHealthCheck?: string;
  healthStatus: string;
  healthMessage?: string;
  totalSyncs: number;
  createdAt: string;
}

interface SyncLog {
  id: string;
  syncType: string;
  direction: string;
  status: string;
  filesUploaded: number;
  filesDownloaded: number;
  bytesTransferred: string;
  duration: number;
  errorMessage?: string;
  createdAt: string;
  config: { name: string; configType: string };
}

const CONFIG_TYPES = [
  { value: 'NAS', label: 'NAS Storage', icon: HardDrive, description: 'Network Attached Storage cho lưu trữ nội bộ' },
  { value: 'TRAINING_SERVER', label: 'Training Server', icon: Cpu, description: 'Máy chủ GPU cho huấn luyện ML' },
  { value: 'BACKUP_SERVER', label: 'Backup Server', icon: Database, description: 'Máy chủ sao lưu dữ liệu' },
];

const PROTOCOLS = ['SMB', 'WebDAV', 'NFS', 'SSH', 'SFTP', 'FTP'];
const SYNC_DIRECTIONS = [
  { value: 'UPLOAD', label: 'Upload (Local → Remote)', icon: Upload },
  { value: 'DOWNLOAD', label: 'Download (Remote → Local)', icon: Download },
  { value: 'BIDIRECTIONAL', label: 'Hai chiều', icon: FolderSync },
];

export default function InfrastructurePage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const { t } = useLanguage();

  const [configs, setConfigs] = useState<InfraConfig[]>([]);
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingConfig, setEditingConfig] = useState<InfraConfig | null>(null);
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [testingConnection, setTestingConnection] = useState<string | null>(null);
  const [syncing, setSyncing] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    configType: 'NAS',
    name: '',
    description: '',
    connectionUrl: '',
    protocol: 'SMB',
    port: 445,
    username: '',
    password: '',
    basePath: '',
    gpuCount: 1,
    gpuType: '',
    memoryGB: 64,
    storageGB: 1000,
    syncEnabled: false,
    syncInterval: 60,
    syncDirection: 'UPLOAD',
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchData();
    }
  }, [status, typeFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [configsRes, logsRes] = await Promise.all([
        fetch(`/api/admin/infrastructure?type=${typeFilter}`),
        fetch('/api/admin/infrastructure/sync?limit=20'),
      ]);

      if (configsRes.ok) {
        const data = await configsRes.json();
        setConfigs(data.configs);
      }
      if (logsRes.ok) {
        const data = await logsRes.json();
        setSyncLogs(data.logs);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Lỗi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = async () => {
    if (!formData.name || !formData.connectionUrl) {
      toast.error('Vui lòng nhập tên và URL kết nối');
      return;
    }

    try {
      const method = editingConfig ? 'PUT' : 'POST';
      const body = editingConfig ? { ...formData, id: editingConfig.id } : formData;

      const res = await fetch('/api/admin/infrastructure', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        toast.success(editingConfig ? 'Cập nhật thành công!' : 'Tạo cấu hình thành công!');
        setShowCreateDialog(false);
        setEditingConfig(null);
        resetForm();
        fetchData();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Lỗi lưu cấu hình');
      }
    } catch (error) {
      toast.error('Lỗi server');
    }
  };

  const handleDeleteConfig = async (id: string, name: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa cấu hình "${name}"?`)) return;

    try {
      const res = await fetch(`/api/admin/infrastructure?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Xóa cấu hình thành công');
        fetchData();
      } else {
        toast.error('Lỗi xóa cấu hình');
      }
    } catch (error) {
      toast.error('Lỗi server');
    }
  };

  const handleToggleEnabled = async (config: InfraConfig) => {
    try {
      const res = await fetch('/api/admin/infrastructure', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: config.id, isEnabled: !config.isEnabled }),
      });

      if (res.ok) {
        toast.success(config.isEnabled ? 'Đã tắt cấu hình' : 'Đã bật cấu hình');
        fetchData();
      }
    } catch (error) {
      toast.error('Lỗi server');
    }
  };

  const handleTestConnection = async (id: string) => {
    setTestingConnection(id);
    try {
      const res = await fetch('/api/admin/infrastructure/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(`Kết nối thành công! (${data.latency}ms)`);
      } else {
        toast.error(data.message || 'Kết nối thất bại');
      }
      fetchData();
    } catch (error) {
      toast.error('Lỗi server');
    } finally {
      setTestingConnection(null);
    }
  };

  const handleSync = async (configId: string, direction?: string) => {
    setSyncing(configId);
    try {
      const res = await fetch('/api/admin/infrastructure/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ configId, direction }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success('Đồng bộ thành công!');
        fetchData();
      } else {
        toast.error(data.error || 'Đồng bộ thất bại');
      }
    } catch (error) {
      toast.error('Lỗi server');
    } finally {
      setSyncing(null);
    }
  };

  const resetForm = () => {
    setFormData({
      configType: 'NAS',
      name: '',
      description: '',
      connectionUrl: '',
      protocol: 'SMB',
      port: 445,
      username: '',
      password: '',
      basePath: '',
      gpuCount: 1,
      gpuType: '',
      memoryGB: 64,
      storageGB: 1000,
      syncEnabled: false,
      syncInterval: 60,
      syncDirection: 'UPLOAD',
    });
  };

  const openEditDialog = (config: InfraConfig) => {
    setEditingConfig(config);
    setFormData({
      configType: config.configType,
      name: config.name,
      description: config.description || '',
      connectionUrl: config.connectionUrl,
      protocol: config.protocol || 'SMB',
      port: config.port || 445,
      username: '',
      password: '',
      basePath: config.basePath || '',
      gpuCount: config.gpuCount || 1,
      gpuType: config.gpuType || '',
      memoryGB: config.memoryGB || 64,
      storageGB: config.storageGB || 1000,
      syncEnabled: config.syncEnabled,
      syncInterval: config.syncInterval || 60,
      syncDirection: config.syncDirection || 'UPLOAD',
    });
    setShowCreateDialog(true);
  };

  const getHealthBadge = (status: string) => {
    const styles: { [key: string]: { bg: string; icon: any } } = {
      HEALTHY: { bg: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400', icon: CheckCircle2 },
      DEGRADED: { bg: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400', icon: AlertTriangle },
      UNHEALTHY: { bg: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400', icon: XCircle },
      UNKNOWN: { bg: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400', icon: Clock },
    };
    const labels: { [key: string]: string } = {
      HEALTHY: 'Hoạt động tốt',
      DEGRADED: 'Có vấn đề',
      UNHEALTHY: 'Không kết nối',
      UNKNOWN: 'Chưa kiểm tra',
    };
    const Icon = styles[status]?.icon || Clock;
    return (
      <Badge className={`${styles[status]?.bg} flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {labels[status]}
      </Badge>
    );
  };

  const getConfigTypeIcon = (type: string) => {
    const typeConfig = CONFIG_TYPES.find(t => t.value === type);
    const Icon = typeConfig?.icon || Server;
    return <Icon className="w-5 h-5" />;
  };

  const formatBytes = (bytes: string | number) => {
    const b = typeof bytes === 'string' ? parseInt(bytes) : bytes;
    if (b === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(b) / Math.log(k));
    return parseFloat((b / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Indigo Banner */}
      <div className="relative rounded-2xl overflow-hidden text-white bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,.05) 10px, rgba(255,255,255,.05) 20px)' }} />
        <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-10"><Server className="h-24 w-24" /></div>
        <div className="relative px-8 py-6">
          <Link href="/dashboard/admin"
            className="inline-flex items-center gap-1.5 text-indigo-100 hover:text-white text-sm mb-3 transition-colors">
            <ArrowLeft className="h-4 w-4" />Quản trị hệ thống
          </Link>
          <div className="flex items-end justify-between">
            <div>
              <h1 className="text-2xl font-bold">Infrastructure Configuration</h1>
              <p className="text-indigo-100 text-sm mt-1">Cấu hình NAS, máy chủ huấn luyện và đồng bộ dữ liệu</p>
            </div>
            <Dialog open={showCreateDialog} onOpenChange={(open) => {
              setShowCreateDialog(open);
              if (!open) { setEditingConfig(null); resetForm(); }
            }}>
              <DialogTrigger asChild>
                <Button className="bg-white text-indigo-700 hover:bg-indigo-50 font-semibold">
                  <Plus className="w-4 h-4 mr-2" />Thêm cấu hình mới
                </Button>
              </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingConfig ? 'Chỉnh sửa cấu hình' : 'Thêm cấu hình mới'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Loại cấu hình *</Label>
                <Select
                  value={formData.configType}
                  onValueChange={(v) => setFormData({ ...formData, configType: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CONFIG_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <type.icon className="w-4 h-4" />
                          <span>{type.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>Tên cấu hình *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ví dụ: NAS Chính, Server GPU A100"
                  />
                </div>
                <div className="col-span-2">
                  <Label>Mô tả</Label>
                  <Input
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Mô tả chi tiết về cấu hình"
                  />
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">Thông tin kết nối</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label>URL/IP kết nối *</Label>
                    <Input
                      value={formData.connectionUrl}
                      onChange={(e) => setFormData({ ...formData, connectionUrl: e.target.value })}
                      placeholder="192.168.1.100 hoặc nas.hvhc.local"
                    />
                  </div>
                  <div>
                    <Label>Protocol</Label>
                    <Select
                      value={formData.protocol}
                      onValueChange={(v) => setFormData({ ...formData, protocol: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PROTOCOLS.map((p) => (
                          <SelectItem key={p} value={p}>{p}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Port</Label>
                    <Input
                      type="number"
                      value={formData.port}
                      onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label>Username</Label>
                    <Input
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      placeholder="admin"
                    />
                  </div>
                  <div>
                    <Label>Password</Label>
                    <Input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder={editingConfig ? 'Để trống nếu không thay đổi' : ''}
                    />
                  </div>
                  <div className="col-span-2">
                    <Label>Đường dẫn gốc</Label>
                    <Input
                      value={formData.basePath}
                      onChange={(e) => setFormData({ ...formData, basePath: e.target.value })}
                      placeholder="/data/hvhc hoặc /mnt/nas"
                    />
                  </div>
                </div>
              </div>

              {formData.configType === 'TRAINING_SERVER' && (
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3">Cấu hình GPU Server</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Số GPU</Label>
                      <Input
                        type="number"
                        value={formData.gpuCount}
                        onChange={(e) => setFormData({ ...formData, gpuCount: parseInt(e.target.value) })}
                      />
                    </div>
                    <div>
                      <Label>Loại GPU</Label>
                      <Input
                        value={formData.gpuType}
                        onChange={(e) => setFormData({ ...formData, gpuType: e.target.value })}
                        placeholder="RTX 4090, A100, V100..."
                      />
                    </div>
                    <div>
                      <Label>RAM (GB)</Label>
                      <Input
                        type="number"
                        value={formData.memoryGB}
                        onChange={(e) => setFormData({ ...formData, memoryGB: parseInt(e.target.value) })}
                      />
                    </div>
                    <div>
                      <Label>Storage (GB)</Label>
                      <Input
                        type="number"
                        value={formData.storageGB}
                        onChange={(e) => setFormData({ ...formData, storageGB: parseInt(e.target.value) })}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium">Đồng bộ dữ liệu</h4>
                  <Switch
                    checked={formData.syncEnabled}
                    onCheckedChange={(v) => setFormData({ ...formData, syncEnabled: v })}
                  />
                </div>
                {formData.syncEnabled && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Hướng đồng bộ</Label>
                      <Select
                        value={formData.syncDirection}
                        onValueChange={(v) => setFormData({ ...formData, syncDirection: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {SYNC_DIRECTIONS.map((d) => (
                            <SelectItem key={d.value} value={d.value}>
                              <div className="flex items-center gap-2">
                                <d.icon className="w-4 h-4" />
                                <span>{d.label}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Tần suất (phút)</Label>
                      <Input
                        type="number"
                        value={formData.syncInterval}
                        onChange={(e) => setFormData({ ...formData, syncInterval: parseInt(e.target.value) })}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setShowCreateDialog(false);
                setEditingConfig(null);
                resetForm();
              }}>Hủy</Button>
              <Button onClick={handleSaveConfig}>
                {editingConfig ? 'Cập nhật' : 'Tạo cấu hình'}
              </Button>
            </DialogFooter>
          </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* KPI Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Tổng cấu hình', value: configs.length, icon: Server, color: 'bg-indigo-100 text-indigo-600' },
          { label: 'Đang hoạt động', value: configs.filter(c => c.isEnabled).length, icon: Wifi, color: 'bg-emerald-100 text-emerald-600' },
          { label: 'NAS Servers', value: configs.filter(c => c.configType === 'NAS').length, icon: HardDrive, color: 'bg-blue-100 text-blue-600' },
          { label: 'Training Servers', value: configs.filter(c => c.configType === 'TRAINING_SERVER').length, icon: Cpu, color: 'bg-orange-100 text-orange-600' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-xl border bg-white p-4 flex items-start gap-3 shadow-sm">
            <div className={`rounded-lg p-2.5 ${color}`}><Icon className="h-5 w-5" /></div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{value}</p>
              <p className="text-sm text-slate-500 mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </div>

      <Tabs defaultValue="configs" className="space-y-4">
        <TabsList className="bg-slate-100">
          <TabsTrigger value="configs">Cấu hình</TabsTrigger>
          <TabsTrigger value="sync-logs">Lịch sử đồng bộ</TabsTrigger>
        </TabsList>

        <TabsContent value="configs" className="space-y-4">
          {/* Filter */}
          <div className="bg-slate-50 rounded-xl border p-4 flex gap-3 items-center">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-48 bg-white"><SelectValue placeholder="Loại cấu hình" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tất cả</SelectItem>
                {CONFIG_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={fetchData} className="bg-white">
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>

          {/* Configs List */}
          <div className="space-y-4">
            {configs.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Server className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Chưa có cấu hình nào</p>
                </CardContent>
              </Card>
            ) : (
              configs.map((config) => (
                <Card key={config.id}>
                  <CardContent className="pt-4">
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className={`p-2 rounded-lg ${
                            config.configType === 'NAS' ? 'bg-blue-100 text-blue-600' :
                            config.configType === 'TRAINING_SERVER' ? 'bg-orange-100 text-orange-600' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {getConfigTypeIcon(config.configType)}
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg flex items-center gap-2">
                              {config.name}
                              {config.isEnabled ? (
                                <Wifi className="w-4 h-4 text-green-500" />
                              ) : (
                                <WifiOff className="w-4 h-4 text-gray-400" />
                              )}
                            </h3>
                            <p className="text-sm text-muted-foreground">{config.description}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">URL</p>
                            <p className="font-mono">{config.connectionUrl}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Protocol</p>
                            <p>{config.protocol}:{config.port}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Trạng thái</p>
                            {getHealthBadge(config.healthStatus)}
                          </div>
                          <div>
                            <p className="text-muted-foreground">Kiểm tra cuối</p>
                            <p>{config.lastHealthCheck ? new Date(config.lastHealthCheck).toLocaleString('vi-VN') : 'Chưa kiểm tra'}</p>
                          </div>
                        </div>

                        {config.configType === 'TRAINING_SERVER' && (
                          <div className="flex gap-4 mt-3">
                            {config.gpuCount && (
                              <Badge variant="outline" className="flex items-center gap-1">
                                <Cpu className="w-3 h-3" />
                                {config.gpuCount}x {config.gpuType || 'GPU'}
                              </Badge>
                            )}
                            {config.memoryGB && (
                              <Badge variant="outline" className="flex items-center gap-1">
                                <MemoryStick className="w-3 h-3" />
                                {config.memoryGB} GB RAM
                              </Badge>
                            )}
                            {config.storageGB && (
                              <Badge variant="outline" className="flex items-center gap-1">
                                <HardDrive className="w-3 h-3" />
                                {config.storageGB} GB
                              </Badge>
                            )}
                          </div>
                        )}

                        {config.syncEnabled && (
                          <div className="flex items-center gap-4 mt-3 text-sm">
                            <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
                              <FolderSync className="w-3 h-3 mr-1" />
                              Sync: {config.syncDirection} / {config.syncInterval}ph
                            </Badge>
                            {config.lastSyncAt && (
                              <span className="text-muted-foreground">
                                Sync cuối: {new Date(config.lastSyncAt).toLocaleString('vi-VN')}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Switch
                          checked={config.isEnabled}
                          onCheckedChange={() => handleToggleEnabled(config)}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleTestConnection(config.id)}
                          disabled={testingConnection === config.id}
                        >
                          {testingConnection === config.id ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <Activity className="w-4 h-4" />
                          )}
                          Test
                        </Button>
                        {config.syncEnabled && config.isEnabled && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSync(config.id)}
                            disabled={syncing === config.id}
                          >
                            {syncing === config.id ? (
                              <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                              <FolderSync className="w-4 h-4" />
                            )}
                            Sync
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(config)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteConfig(config.id, config.name)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="sync-logs">
          <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 border-b">
              <h3 className="font-semibold text-slate-800">Lịch sử đồng bộ gần đây</h3>
            </div>
            <div className="p-4">
              {syncLogs.length === 0 ? (
                <div className="text-center py-12">
                  <FolderSync className="mx-auto h-10 w-10 text-slate-300 mb-2" />
                  <p className="text-slate-400">Chưa có lịch sử đồng bộ</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {syncLogs.map((log) => (
                    <div key={log.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border">
                      <div className="flex items-center gap-4">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${log.status === 'SUCCESS' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                          {log.status}
                        </span>
                        <div>
                          <p className="font-medium text-slate-800">{log.config.name}</p>
                          <p className="text-xs text-slate-500">{log.direction} | {log.syncType} | {log.duration}s</p>
                        </div>
                      </div>
                      <div className="text-right text-sm">
                        <p className="text-slate-700">↑ {log.filesUploaded} | ↓ {log.filesDownloaded}</p>
                        <p className="text-xs text-slate-500">{formatBytes(log.bytesTransferred)}</p>
                        <p className="text-xs text-slate-400">{new Date(log.createdAt).toLocaleString('vi-VN')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
