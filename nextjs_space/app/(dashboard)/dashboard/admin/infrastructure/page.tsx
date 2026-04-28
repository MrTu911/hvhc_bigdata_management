'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  Server, HardDrive, Plus, RefreshCw, Wifi, WifiOff,
  Trash2, Edit2, CheckCircle2, XCircle, AlertTriangle, Clock,
  Upload, Download, Cpu, MemoryStick, Database, FolderSync,
  Activity, ArrowLeft, Shield, Eye, EyeOff, Info, Zap,
  BarChart3, AlertCircle, CircleDot,
} from 'lucide-react';
import Link from 'next/link';

// ─── Types ────────────────────────────────────────────────────────────────────

interface InfraConfig {
  id: string;
  configType: 'NAS' | 'TRAINING_SERVER' | 'BACKUP_SERVER';
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
  healthStatus: 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY' | 'UNKNOWN';
  healthMessage?: string;
  totalSyncs: number;
  createdAt: string;
}

interface SyncLog {
  id: string;
  syncType: string;
  direction: string;
  status: 'SUCCESS' | 'FAILED';
  filesUploaded: number;
  filesDownloaded: number;
  bytesTransferred: string;
  duration: number;
  errorMessage?: string;
  createdAt: string;
  config: { name: string; configType: string };
}

interface FormData {
  configType: string;
  name: string;
  description: string;
  connectionUrl: string;
  protocol: string;
  port: number;
  username: string;
  password: string;
  basePath: string;
  gpuCount: number;
  gpuType: string;
  memoryGB: number;
  storageGB: number;
  syncEnabled: boolean;
  syncInterval: number;
  syncDirection: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CONFIG_TYPES = [
  { value: 'NAS',             label: 'NAS Storage',     icon: HardDrive, color: 'bg-blue-100 text-blue-600',    desc: 'Network Attached Storage' },
  { value: 'TRAINING_SERVER', label: 'Training Server', icon: Cpu,       color: 'bg-orange-100 text-orange-600', desc: 'Máy chủ GPU / ML' },
  { value: 'BACKUP_SERVER',   label: 'Backup Server',   icon: Database,  color: 'bg-violet-100 text-violet-600', desc: 'Sao lưu dữ liệu' },
];

const PROTOCOLS = ['SMB', 'WebDAV', 'NFS', 'SSH', 'SFTP', 'FTP'];

const SYNC_DIRECTIONS = [
  { value: 'UPLOAD',        label: 'Upload (Local → Remote)', icon: Upload },
  { value: 'DOWNLOAD',      label: 'Download (Remote → Local)', icon: Download },
  { value: 'BIDIRECTIONAL', label: 'Hai chiều',                icon: FolderSync },
];

const DEFAULT_FORM: FormData = {
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
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getHealthMeta(status: string) {
  const map: Record<string, { label: string; cls: string; icon: React.ElementType; dot: string }> = {
    HEALTHY:   { label: 'Hoạt động tốt',  cls: 'bg-emerald-100 text-emerald-700 border-emerald-200',  icon: CheckCircle2,   dot: 'bg-emerald-500' },
    DEGRADED:  { label: 'Có vấn đề',      cls: 'bg-amber-100 text-amber-700 border-amber-200',         icon: AlertTriangle,  dot: 'bg-amber-500' },
    UNHEALTHY: { label: 'Không kết nối',  cls: 'bg-red-100 text-red-700 border-red-200',               icon: XCircle,        dot: 'bg-red-500' },
    UNKNOWN:   { label: 'Chưa kiểm tra',  cls: 'bg-slate-100 text-slate-500 border-slate-200',         icon: Clock,          dot: 'bg-slate-400' },
  };
  return map[status] ?? map.UNKNOWN;
}

function formatBytes(raw: string | number | bigint) {
  const bytes = typeof raw === 'bigint' ? Number(raw) : typeof raw === 'string' ? parseInt(raw) : raw;
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function relativeTime(iso?: string): string {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Vừa xong';
  if (mins < 60) return `${mins} phút trước`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} giờ trước`;
  return `${Math.floor(hrs / 24)} ngày trước`;
}

function getConfigTypeMeta(type: string) {
  return CONFIG_TYPES.find(t => t.value === type) ?? CONFIG_TYPES[0];
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function HealthBadge({ status }: { status: string }) {
  const meta = getHealthMeta(status);
  const Icon = meta.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${meta.cls}`}>
      <Icon className="w-3 h-3" />
      {meta.label}
    </span>
  );
}

function StatusDot({ status }: { status: string }) {
  const meta = getHealthMeta(status);
  return (
    <span className="relative flex h-2.5 w-2.5">
      {status === 'HEALTHY' && (
        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${meta.dot} opacity-50`} />
      )}
      <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${meta.dot}`} />
    </span>
  );
}

function KpiCard({ label, value, icon: Icon, colorCls }: {
  label: string; value: number; icon: React.ElementType; colorCls: string;
}) {
  return (
    <div className="rounded-xl border bg-white p-4 flex items-start gap-3 shadow-sm hover:shadow-md transition-shadow">
      <div className={`rounded-lg p-2.5 ${colorCls}`}><Icon className="h-5 w-5" /></div>
      <div>
        <p className="text-2xl font-bold text-slate-900">{value}</p>
        <p className="text-sm text-slate-500 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

// ─── ConfigCard ───────────────────────────────────────────────────────────────

function ConfigCard({
  config,
  onToggle, onTestConnection, onSync, onEdit, onDelete,
  testingId, syncingId,
}: {
  config: InfraConfig;
  onToggle: (c: InfraConfig) => void;
  onTestConnection: (id: string) => void;
  onSync: (id: string) => void;
  onEdit: (c: InfraConfig) => void;
  onDelete: (c: InfraConfig) => void;
  testingId: string | null;
  syncingId: string | null;
}) {
  const typeMeta = getConfigTypeMeta(config.configType);
  const healthMeta = getHealthMeta(config.healthStatus);
  const TypeIcon = typeMeta.icon;

  return (
    <Card className="hover:shadow-md transition-shadow border-slate-200">
      <CardContent className="p-5">
        {/* Header row */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${typeMeta.color}`}>
              <TypeIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-slate-900">{config.name}</h3>
                <StatusDot status={config.healthStatus} />
              </div>
              <p className="text-xs text-slate-500 mt-0.5">{config.description || typeMeta.desc}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-slate-400">{config.isEnabled ? 'Đang bật' : 'Đã tắt'}</span>
            <Switch
              checked={config.isEnabled}
              onCheckedChange={() => onToggle(config)}
              className="data-[state=checked]:bg-emerald-500"
            />
          </div>
        </div>

        <Separator className="mb-4" />

        {/* Info grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-3 text-sm mb-4">
          <div>
            <p className="text-xs text-slate-400 mb-0.5">URL / IP</p>
            <p className="font-mono text-slate-700 text-xs">{config.connectionUrl}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 mb-0.5">Protocol</p>
            <p className="text-slate-700 text-xs font-medium">
              {config.protocol}<span className="text-slate-400">:{config.port}</span>
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400 mb-0.5">Trạng thái</p>
            <HealthBadge status={config.healthStatus} />
          </div>
          <div>
            <p className="text-xs text-slate-400 mb-0.5">Kiểm tra cuối</p>
            <p className="text-slate-700 text-xs">{relativeTime(config.lastHealthCheck)}</p>
          </div>
        </div>

        {/* Health message */}
        {config.healthMessage && (
          <div className={`flex items-start gap-2 rounded-lg px-3 py-2 text-xs mb-4 border ${
            config.healthStatus === 'HEALTHY'   ? 'bg-emerald-50 border-emerald-100 text-emerald-700' :
            config.healthStatus === 'DEGRADED'  ? 'bg-amber-50 border-amber-100 text-amber-700' :
            config.healthStatus === 'UNHEALTHY' ? 'bg-red-50 border-red-100 text-red-700' :
            'bg-slate-50 border-slate-100 text-slate-500'
          }`}>
            <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            <span>{config.healthMessage}</span>
          </div>
        )}

        {/* GPU badges */}
        {config.configType === 'TRAINING_SERVER' && (
          <div className="flex flex-wrap gap-2 mb-4">
            {config.gpuCount && (
              <Badge variant="outline" className="text-xs">
                <Cpu className="w-3 h-3 mr-1" />
                {config.gpuCount}× {config.gpuType || 'GPU'}
              </Badge>
            )}
            {config.memoryGB && (
              <Badge variant="outline" className="text-xs">
                <MemoryStick className="w-3 h-3 mr-1" />
                {config.memoryGB} GB RAM
              </Badge>
            )}
            {config.storageGB && (
              <Badge variant="outline" className="text-xs">
                <HardDrive className="w-3 h-3 mr-1" />
                {config.storageGB >= 1000 ? `${(config.storageGB / 1000).toFixed(1)} TB` : `${config.storageGB} GB`}
              </Badge>
            )}
          </div>
        )}

        {/* Storage badges (NAS / Backup) */}
        {config.configType !== 'TRAINING_SERVER' && config.storageGB && (
          <div className="flex flex-wrap gap-2 mb-4">
            <Badge variant="outline" className="text-xs">
              <HardDrive className="w-3 h-3 mr-1" />
              {config.storageGB >= 1000 ? `${(config.storageGB / 1000).toFixed(0)} TB` : `${config.storageGB} GB`} storage
            </Badge>
          </div>
        )}

        {/* Sync info */}
        {config.syncEnabled && (
          <div className="flex flex-wrap items-center gap-3 text-xs mb-4">
            <Badge className="bg-violet-100 text-violet-700 border-violet-200 border text-xs font-normal">
              <FolderSync className="w-3 h-3 mr-1" />
              {config.syncDirection} · mỗi {config.syncInterval}ph
            </Badge>
            {config.lastSyncAt && (
              <span className="text-slate-400">
                Sync cuối: <span className="text-slate-600">{relativeTime(config.lastSyncAt)}</span>
                {config.lastSyncStatus && (
                  <span className={`ml-1.5 font-medium ${config.lastSyncStatus === 'SUCCESS' ? 'text-emerald-600' : 'text-red-600'}`}>
                    ({config.lastSyncStatus === 'SUCCESS' ? 'Thành công' : 'Thất bại'})
                  </span>
                )}
              </span>
            )}
            <span className="text-slate-400">{config.totalSyncs} lần sync</span>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-100">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onTestConnection(config.id)}
            disabled={testingId === config.id}
            className="h-8 text-xs"
          >
            {testingId === config.id
              ? <><RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />Đang test...</>
              : <><Activity className="w-3.5 h-3.5 mr-1.5" />Kiểm tra kết nối</>
            }
          </Button>

          {config.syncEnabled && config.isEnabled && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onSync(config.id)}
              disabled={syncingId === config.id}
              className="h-8 text-xs"
            >
              {syncingId === config.id
                ? <><RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />Đang sync...</>
                : <><FolderSync className="w-3.5 h-3.5 mr-1.5" />Đồng bộ ngay</>
              }
            </Button>
          )}

          <div className="ml-auto flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(config)}
              className="h-8 text-xs text-slate-600 hover:text-slate-900"
            >
              <Edit2 className="w-3.5 h-3.5 mr-1" />Sửa
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(config)}
              className="h-8 text-xs text-red-500 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1" />Xóa
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── ConfigForm ───────────────────────────────────────────────────────────────

function ConfigForm({
  open,
  editing,
  form,
  onChange,
  onSave,
  onClose,
  saving,
}: {
  open: boolean;
  editing: InfraConfig | null;
  form: FormData;
  onChange: (patch: Partial<FormData>) => void;
  onSave: () => void;
  onClose: () => void;
  saving: boolean;
}) {
  const [showPw, setShowPw] = useState(false);

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-indigo-600" />
            {editing ? 'Chỉnh sửa cấu hình' : 'Thêm cấu hình hạ tầng mới'}
          </DialogTitle>
          <DialogDescription>
            {editing
              ? `Cập nhật thông tin kết nối cho "${editing.name}"`
              : 'Cấu hình kết nối tới NAS, máy chủ GPU hoặc server sao lưu'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Loại cấu hình */}
          <div className="grid grid-cols-3 gap-3">
            {CONFIG_TYPES.map((type) => {
              const Icon = type.icon;
              const active = form.configType === type.value;
              return (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => onChange({ configType: type.value })}
                  className={`flex flex-col items-center gap-2 rounded-xl border-2 p-3 text-sm transition-all ${
                    active
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-slate-200 hover:border-slate-300 text-slate-600'
                  }`}
                >
                  <div className={`rounded-lg p-2 ${active ? 'bg-indigo-100' : 'bg-slate-100'}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="font-medium text-xs">{type.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tên & Mô tả */}
          <div className="grid gap-3">
            <div>
              <Label className="text-xs font-medium text-slate-700 mb-1.5 block">
                Tên cấu hình <span className="text-red-500">*</span>
              </Label>
              <Input
                value={form.name}
                onChange={(e) => onChange({ name: e.target.value })}
                placeholder="Ví dụ: NAS Chính, Server GPU A100"
                className="h-9"
              />
            </div>
            <div>
              <Label className="text-xs font-medium text-slate-700 mb-1.5 block">Mô tả</Label>
              <Input
                value={form.description}
                onChange={(e) => onChange({ description: e.target.value })}
                placeholder="Mô tả ngắn về thiết bị / mục đích sử dụng"
                className="h-9"
              />
            </div>
          </div>

          {/* Kết nối */}
          <div className="space-y-3 rounded-xl border border-slate-200 p-4">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Thông tin kết nối</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label className="text-xs mb-1.5 block">URL / IP <span className="text-red-500">*</span></Label>
                <Input
                  value={form.connectionUrl}
                  onChange={(e) => onChange({ connectionUrl: e.target.value })}
                  placeholder="192.168.1.100 hoặc nas.hvhc.local"
                  className="h-9 font-mono text-sm"
                />
              </div>
              <div>
                <Label className="text-xs mb-1.5 block">Protocol</Label>
                <Select value={form.protocol} onValueChange={(v) => onChange({ protocol: v })}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PROTOCOLS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs mb-1.5 block">Port</Label>
                <Input
                  type="number"
                  value={form.port}
                  onChange={(e) => onChange({ port: parseInt(e.target.value) || 0 })}
                  className="h-9"
                />
              </div>
              <div>
                <Label className="text-xs mb-1.5 block">Username</Label>
                <Input
                  value={form.username}
                  onChange={(e) => onChange({ username: e.target.value })}
                  placeholder="admin"
                  className="h-9"
                />
              </div>
              <div>
                <Label className="text-xs mb-1.5 block">
                  Password {editing && <span className="text-slate-400 font-normal">(trống = giữ nguyên)</span>}
                </Label>
                <div className="relative">
                  <Input
                    type={showPw ? 'text' : 'password'}
                    value={form.password}
                    onChange={(e) => onChange({ password: e.target.value })}
                    placeholder={editing ? '••••••••' : 'Nhập password'}
                    className="h-9 pr-9"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(s => !s)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="col-span-2">
                <Label className="text-xs mb-1.5 block">Đường dẫn gốc</Label>
                <Input
                  value={form.basePath}
                  onChange={(e) => onChange({ basePath: e.target.value })}
                  placeholder="/data/hvhc hoặc /mnt/nas"
                  className="h-9 font-mono text-sm"
                />
              </div>
            </div>
          </div>

          {/* GPU / Training Server */}
          {form.configType === 'TRAINING_SERVER' && (
            <div className="space-y-3 rounded-xl border border-orange-200 bg-orange-50/40 p-4">
              <h4 className="text-xs font-semibold text-orange-600 uppercase tracking-wide">Cấu hình GPU Server</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs mb-1.5 block">Số GPU</Label>
                  <Input
                    type="number"
                    value={form.gpuCount}
                    onChange={(e) => onChange({ gpuCount: parseInt(e.target.value) || 1 })}
                    className="h-9"
                    min={1}
                  />
                </div>
                <div>
                  <Label className="text-xs mb-1.5 block">Loại GPU</Label>
                  <Input
                    value={form.gpuType}
                    onChange={(e) => onChange({ gpuType: e.target.value })}
                    placeholder="RTX 4090, A100, V100..."
                    className="h-9"
                  />
                </div>
                <div>
                  <Label className="text-xs mb-1.5 block">RAM (GB)</Label>
                  <Input
                    type="number"
                    value={form.memoryGB}
                    onChange={(e) => onChange({ memoryGB: parseInt(e.target.value) || 0 })}
                    className="h-9"
                  />
                </div>
                <div>
                  <Label className="text-xs mb-1.5 block">Storage (GB)</Label>
                  <Input
                    type="number"
                    value={form.storageGB}
                    onChange={(e) => onChange({ storageGB: parseInt(e.target.value) || 0 })}
                    className="h-9"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Đồng bộ */}
          <div className="space-y-3 rounded-xl border border-slate-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-semibold text-slate-600">Đồng bộ dữ liệu tự động</h4>
                <p className="text-xs text-slate-400 mt-0.5">Bật để lên lịch sync định kỳ</p>
              </div>
              <Switch
                checked={form.syncEnabled}
                onCheckedChange={(v) => onChange({ syncEnabled: v })}
              />
            </div>
            {form.syncEnabled && (
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                <div>
                  <Label className="text-xs mb-1.5 block">Hướng đồng bộ</Label>
                  <Select value={form.syncDirection} onValueChange={(v) => onChange({ syncDirection: v })}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {SYNC_DIRECTIONS.map(d => (
                        <SelectItem key={d.value} value={d.value}>
                          <div className="flex items-center gap-2">
                            <d.icon className="w-3.5 h-3.5" />
                            {d.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs mb-1.5 block">Tần suất (phút)</Label>
                  <Input
                    type="number"
                    value={form.syncInterval}
                    onChange={(e) => onChange({ syncInterval: parseInt(e.target.value) || 60 })}
                    className="h-9"
                    min={5}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Hủy</Button>
          <Button onClick={onSave} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700">
            {saving ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : null}
            {editing ? 'Lưu thay đổi' : 'Tạo cấu hình'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── DeleteConfirmDialog ──────────────────────────────────────────────────────

function DeleteConfirmDialog({
  config,
  onConfirm,
  onCancel,
  deleting,
}: {
  config: InfraConfig | null;
  onConfirm: () => void;
  onCancel: () => void;
  deleting: boolean;
}) {
  if (!config) return null;
  return (
    <Dialog open={!!config} onOpenChange={(o) => { if (!o) onCancel(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertCircle className="w-5 h-5" />
            Xác nhận xóa cấu hình
          </DialogTitle>
          <DialogDescription>
            Hành động này không thể hoàn tác. Tất cả lịch sử đồng bộ liên quan cũng sẽ bị xóa.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-3 rounded-lg bg-red-50 border border-red-100 p-3 my-2">
          <div className={`p-2 rounded-lg ${getConfigTypeMeta(config.configType).color}`}>
            {(() => { const Icon = getConfigTypeMeta(config.configType).icon; return <Icon className="w-4 h-4" />; })()}
          </div>
          <div>
            <p className="font-medium text-slate-900 text-sm">{config.name}</p>
            <p className="text-xs text-slate-500">{config.connectionUrl} · {config.totalSyncs} sync logs</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>Hủy</Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={deleting}
          >
            {deleting ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
            Xóa cấu hình
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── SyncLogRow ───────────────────────────────────────────────────────────────

function SyncLogRow({ log }: { log: SyncLog }) {
  const isSuccess = log.status === 'SUCCESS';
  return (
    <div className="flex items-start justify-between p-3.5 hover:bg-slate-50 rounded-lg transition-colors border border-transparent hover:border-slate-100">
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 rounded-full p-1 ${isSuccess ? 'bg-emerald-100' : 'bg-red-100'}`}>
          {isSuccess
            ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            : <XCircle className="w-3.5 h-3.5 text-red-500" />
          }
        </div>
        <div>
          <p className="text-sm font-medium text-slate-800">{log.config.name}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-slate-400">{log.direction}</span>
            <CircleDot className="w-1 h-1 text-slate-300" />
            <span className="text-xs text-slate-400">{log.syncType === 'MANUAL' ? 'Thủ công' : 'Tự động'}</span>
            <CircleDot className="w-1 h-1 text-slate-300" />
            <span className="text-xs text-slate-400">{log.duration}s</span>
          </div>
          {log.errorMessage && (
            <p className="text-xs text-red-500 mt-1">{log.errorMessage}</p>
          )}
        </div>
      </div>
      <div className="text-right shrink-0">
        <p className="text-xs font-medium text-slate-700">
          ↑ {log.filesUploaded} &nbsp;↓ {log.filesDownloaded}
        </p>
        <p className="text-xs text-slate-400">{formatBytes(log.bytesTransferred)}</p>
        <p className="text-xs text-slate-400 mt-0.5">{relativeTime(log.createdAt)}</p>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function InfrastructurePage() {
  const { status } = useSession() || {};
  const router = useRouter();

  const [configs, setConfigs] = useState<InfraConfig[]>([]);
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('ALL');

  const [showForm, setShowForm] = useState(false);
  const [editingConfig, setEditingConfig] = useState<InfraConfig | null>(null);
  const [deletingConfig, setDeletingConfig] = useState<InfraConfig | null>(null);
  const [formData, setFormData] = useState<FormData>(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [testingId, setTestingId] = useState<string | null>(null);
  const [syncingId, setSyncingId] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
    else if (status === 'authenticated') fetchData();
  }, [status, typeFilter]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [cfgRes, logRes] = await Promise.all([
        fetch(`/api/admin/infrastructure?type=${typeFilter}`),
        fetch('/api/admin/infrastructure/sync?limit=20'),
      ]);
      if (cfgRes.ok) setConfigs((await cfgRes.json()).configs ?? []);
      if (logRes.ok) setSyncLogs((await logRes.json()).logs ?? []);
    } catch {
      toast.error('Lỗi tải dữ liệu hạ tầng');
    } finally {
      setLoading(false);
    }
  }, [typeFilter]);

  // Form helpers
  const patchForm = (patch: Partial<FormData>) => setFormData(prev => ({ ...prev, ...patch }));

  const openCreate = () => {
    setEditingConfig(null);
    setFormData(DEFAULT_FORM);
    setShowForm(true);
  };

  const openEdit = (config: InfraConfig) => {
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
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingConfig(null);
    setFormData(DEFAULT_FORM);
  };

  // CRUD actions
  const handleSave = async () => {
    if (!formData.name.trim() || !formData.connectionUrl.trim()) {
      toast.error('Vui lòng nhập tên và URL kết nối');
      return;
    }
    setSaving(true);
    try {
      const method = editingConfig ? 'PUT' : 'POST';
      const body = editingConfig ? { ...formData, id: editingConfig.id } : formData;
      const res = await fetch('/api/admin/infrastructure', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(editingConfig ? 'Cập nhật thành công!' : 'Tạo cấu hình thành công!');
        closeForm();
        fetchData();
      } else {
        toast.error(data.error || 'Lỗi lưu cấu hình');
      }
    } catch {
      toast.error('Lỗi server');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingConfig) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/infrastructure?id=${deletingConfig.id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Đã xóa cấu hình');
        setDeletingConfig(null);
        fetchData();
      } else {
        toast.error('Lỗi xóa cấu hình');
      }
    } catch {
      toast.error('Lỗi server');
    } finally {
      setDeleting(false);
    }
  };

  const handleToggle = async (config: InfraConfig) => {
    const next = !config.isEnabled;
    try {
      const res = await fetch('/api/admin/infrastructure', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: config.id, isEnabled: next }),
      });
      if (res.ok) {
        toast.success(next ? 'Đã bật cấu hình' : 'Đã tắt cấu hình');
        setConfigs(prev => prev.map(c => c.id === config.id ? { ...c, isEnabled: next } : c));
      }
    } catch {
      toast.error('Lỗi server');
    }
  };

  const handleTestConnection = async (id: string) => {
    setTestingId(id);
    try {
      const res = await fetch('/api/admin/infrastructure/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Kết nối thành công (${data.latency}ms)`);
      } else {
        toast.warning(data.message || 'Không kết nối được');
      }
      fetchData();
    } catch {
      toast.error('Lỗi server');
    } finally {
      setTestingId(null);
    }
  };

  const handleSync = async (configId: string) => {
    setSyncingId(configId);
    try {
      const res = await fetch('/api/admin/infrastructure/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ configId }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Đồng bộ thành công!');
        fetchData();
      } else {
        toast.error(data.error || 'Đồng bộ thất bại');
      }
    } catch {
      toast.error('Lỗi server');
    } finally {
      setSyncingId(null);
    }
  };

  // Derived stats
  const healthCounts = {
    healthy:   configs.filter(c => c.healthStatus === 'HEALTHY').length,
    degraded:  configs.filter(c => c.healthStatus === 'DEGRADED').length,
    unhealthy: configs.filter(c => c.healthStatus === 'UNHEALTHY').length,
    unknown:   configs.filter(c => c.healthStatus === 'UNKNOWN').length,
  };

  const filteredConfigs = typeFilter === 'ALL'
    ? configs
    : configs.filter(c => c.configType === typeFilter);

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <RefreshCw className="w-8 h-8 animate-spin text-indigo-600 mx-auto" />
          <p className="text-sm text-slate-500">Đang tải dữ liệu hạ tầng...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">

      {/* Banner */}
      <div className="relative rounded-2xl overflow-hidden text-white bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,.06) 10px, rgba(255,255,255,.06) 20px)' }} />
        <div className="absolute right-8 top-1/2 -translate-y-1/2 opacity-[0.07]">
          <Server className="h-36 w-36" />
        </div>
        <div className="relative px-8 py-6">
          <Link
            href="/dashboard/admin"
            className="inline-flex items-center gap-1.5 text-indigo-200 hover:text-white text-sm mb-3 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />Quản trị hệ thống
          </Link>
          <div className="flex items-end justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Infrastructure Configuration</h1>
              <p className="text-indigo-200 text-sm mt-1">
                Quản lý NAS, máy chủ huấn luyện AI và cấu hình đồng bộ dữ liệu
              </p>
            </div>
            <Button
              onClick={openCreate}
              className="bg-white text-indigo-700 hover:bg-indigo-50 font-semibold shadow-md"
            >
              <Plus className="w-4 h-4 mr-2" />Thêm cấu hình
            </Button>
          </div>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Tổng cấu hình"   value={configs.length}                                          icon={Server}   colorCls="bg-indigo-100 text-indigo-600" />
        <KpiCard label="Đang bật"         value={configs.filter(c => c.isEnabled).length}                 icon={Wifi}     colorCls="bg-emerald-100 text-emerald-600" />
        <KpiCard label="Healthy"          value={healthCounts.healthy}                                    icon={Zap}      colorCls="bg-green-100 text-green-600" />
        <KpiCard label="Cần chú ý"        value={healthCounts.degraded + healthCounts.unhealthy}          icon={AlertTriangle} colorCls="bg-amber-100 text-amber-600" />
      </div>

      {/* Health bar summary */}
      {configs.length > 0 && (
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-slate-400" />Tình trạng tổng quan
            </h3>
            <span className="text-xs text-slate-400">{configs.length} thiết bị</span>
          </div>
          <div className="flex gap-4 text-sm">
            {[
              { label: 'Healthy',    count: healthCounts.healthy,   cls: 'text-emerald-600' },
              { label: 'Degraded',   count: healthCounts.degraded,  cls: 'text-amber-600' },
              { label: 'Unhealthy',  count: healthCounts.unhealthy, cls: 'text-red-600' },
              { label: 'Chưa check', count: healthCounts.unknown,   cls: 'text-slate-400' },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-1.5">
                <span className={`font-bold text-base ${item.cls}`}>{item.count}</span>
                <span className="text-xs text-slate-400">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <Tabs defaultValue="configs" className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList className="bg-slate-100 p-1 rounded-lg">
            <TabsTrigger value="configs" className="text-sm">
              <Server className="w-3.5 h-3.5 mr-1.5" />Cấu hình ({filteredConfigs.length})
            </TabsTrigger>
            <TabsTrigger value="sync-logs" className="text-sm">
              <FolderSync className="w-3.5 h-3.5 mr-1.5" />Lịch sử đồng bộ ({syncLogs.length})
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ── Configs tab ── */}
        <TabsContent value="configs" className="space-y-4">
          {/* Filter bar */}
          <div className="flex gap-3 items-center bg-slate-50 rounded-xl border p-3">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-48 bg-white h-9 text-sm">
                <SelectValue placeholder="Loại thiết bị" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tất cả loại</SelectItem>
                {CONFIG_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={fetchData} className="h-9 bg-white">
              <RefreshCw className="w-4 h-4" />
            </Button>
            <span className="text-xs text-slate-400 ml-auto">
              {filteredConfigs.filter(c => c.isEnabled).length} / {filteredConfigs.length} đang bật
            </span>
          </div>

          {filteredConfigs.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-16 text-center">
                <Server className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                <p className="text-slate-500 font-medium">Chưa có cấu hình nào</p>
                <p className="text-sm text-slate-400 mt-1">Nhấn "Thêm cấu hình" để bắt đầu</p>
                <Button className="mt-4" onClick={openCreate} variant="outline">
                  <Plus className="w-4 h-4 mr-2" />Thêm cấu hình đầu tiên
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredConfigs.map(config => (
                <ConfigCard
                  key={config.id}
                  config={config}
                  onToggle={handleToggle}
                  onTestConnection={handleTestConnection}
                  onSync={handleSync}
                  onEdit={openEdit}
                  onDelete={setDeletingConfig}
                  testingId={testingId}
                  syncingId={syncingId}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── Sync logs tab ── */}
        <TabsContent value="sync-logs">
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <FolderSync className="w-4 h-4 text-slate-400" />
                Lịch sử đồng bộ gần đây
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {syncLogs.length === 0 ? (
                <div className="py-16 text-center">
                  <FolderSync className="mx-auto h-10 w-10 text-slate-300 mb-3" />
                  <p className="text-slate-400">Chưa có lịch sử đồng bộ</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-50 px-4 pb-4">
                  {syncLogs.map(log => <SyncLogRow key={log.id} log={log} />)}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <ConfigForm
        open={showForm}
        editing={editingConfig}
        form={formData}
        onChange={patchForm}
        onSave={handleSave}
        onClose={closeForm}
        saving={saving}
      />

      <DeleteConfirmDialog
        config={deletingConfig}
        onConfirm={handleDelete}
        onCancel={() => setDeletingConfig(null)}
        deleting={deleting}
      />
    </div>
  );
}
