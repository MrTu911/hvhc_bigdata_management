'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'sonner';
import {
  ArrowLeft,
  FileText,
  Upload,
  Save,
  History,
  Eye,
  Download,
  RefreshCw,
  CheckCircle,
  XCircle,
  Edit,
  Code,
  Layers,
  Users,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';

interface Template {
  id: string;
  code: string;
  name: string;
  description?: string;
  category?: string;
  moduleSource: string[];
  outputFormats: string[];
  version: number;
  isActive: boolean;
  rbacCode: string;
  fileKey?: string;
  dataMap?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

interface VersionRecord {
  version: number;
  fileKey?: string;
  changedBy?: string;
  changedAt?: string;
  changeNote?: string;
}

interface ExportJob {
  id: string;
  entityType: string;
  outputFormat: string;
  status: string;
  progress: number;
  successCount: number;
  failCount: number;
  signedUrl?: string;
  urlExpiresAt?: string;
  createdAt: string;
  completedAt?: string;
}

const CATEGORIES: Record<string, string> = {
  NHAN_SU: 'Nhân sự',
  DANG_VIEN: 'Đảng viên',
  BAO_HIEM: 'Bảo hiểm',
  CHE_DO: 'Chế độ',
  KHEN_THUONG: 'Khen thưởng',
  DAO_TAO: 'Đào tạo',
  NCKH: 'NCKH',
  TONG_HOP: 'Tổng hợp',
};

const FORMAT_COLORS: Record<string, string> = {
  PDF: 'bg-red-100 text-red-700',
  DOCX: 'bg-blue-100 text-blue-700',
  XLSX: 'bg-green-100 text-green-700',
  HTML: 'bg-purple-100 text-purple-700',
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  PROCESSING: 'bg-blue-100 text-blue-700',
  DONE: 'bg-green-100 text-green-700',
  FAILED: 'bg-red-100 text-red-700',
  PARTIAL: 'bg-orange-100 text-orange-700',
};

export default function TemplateDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const [template, setTemplate] = useState<Template | null>(null);
  const [versions, setVersions] = useState<VersionRecord[]>([]);
  const [recentJobs, setRecentJobs] = useState<ExportJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('info');

  // Edit form
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    category: '',
    rbacCode: '',
    isActive: true,
    outputFormats: [] as string[],
    moduleSource: [] as string[],
  });

  // Data map editor
  const [dataMapText, setDataMapText] = useState('{}');
  const [dataMapError, setDataMapError] = useState('');

  // Preview dialog
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewEntityId, setPreviewEntityId] = useState('');
  const [previewEntityType, setPreviewEntityType] = useState('personnel');
  const [previewFormat, setPreviewFormat] = useState('PDF');
  const [previewing, setPreviewing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');

  // Export dialog
  const [exportOpen, setExportOpen] = useState(false);
  const [exportEntityId, setExportEntityId] = useState('');
  const [exportEntityType, setExportEntityType] = useState('personnel');
  const [exportFormat, setExportFormat] = useState('PDF');
  const [exporting, setExporting] = useState(false);

  const fetchTemplate = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/templates/${id}`);
      if (!res.ok) throw new Error('Không tìm thấy template');
      const json = await res.json();
      const t = json.data as Template;
      setTemplate(t);
      setEditForm({
        name: t.name,
        description: t.description || '',
        category: t.category || '',
        rbacCode: t.rbacCode,
        isActive: t.isActive,
        outputFormats: t.outputFormats,
        moduleSource: t.moduleSource,
      });
      setDataMapText(JSON.stringify(t.dataMap || {}, null, 2));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Lỗi tải template');
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchVersions = useCallback(async () => {
    try {
      const res = await fetch(`/api/templates/${id}/versions`);
      if (!res.ok) return;
      const json = await res.json();
      setVersions(json.data?.versions || []);
    } catch {
      // ignore
    }
  }, [id]);

  const fetchRecentJobs = useCallback(async () => {
    try {
      const res = await fetch(`/api/templates/export/jobs?templateId=${id}&limit=10`);
      if (!res.ok) return;
      const json = await res.json();
      setRecentJobs(json.data || []);
    } catch {
      // ignore
    }
  }, [id]);

  useEffect(() => {
    fetchTemplate();
    fetchVersions();
    fetchRecentJobs();
  }, [fetchTemplate, fetchVersions, fetchRecentJobs]);

  const handleSaveInfo = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/templates/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      if (!res.ok) throw new Error('Lỗi cập nhật');
      toast.success('Đã lưu thông tin template');
      setEditMode(false);
      fetchTemplate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Lỗi lưu');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveDataMap = async () => {
    try {
      JSON.parse(dataMapText);
      setDataMapError('');
    } catch {
      setDataMapError('JSON không hợp lệ – vui lòng kiểm tra cú pháp');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/templates/${id}/datamap`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataMap: JSON.parse(dataMapText) }),
      });
      if (!res.ok) throw new Error('Lỗi lưu data map');
      toast.success('Đã lưu Data Map');
      fetchTemplate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Lỗi lưu data map');
    } finally {
      setSaving(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowed = [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/html',
    ];
    if (!allowed.includes(file.type) && !file.name.match(/\.(docx|xlsx|html)$/i)) {
      toast.error('Chỉ chấp nhận file .docx, .xlsx hoặc .html');
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const format = file.name.endsWith('.docx') ? 'DOCX' : file.name.endsWith('.xlsx') ? 'XLSX' : 'HTML';
      formData.append('format', format);

      const res = await fetch(`/api/templates/${id}/upload`, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error('Lỗi upload file');
      toast.success('Upload file thành công – phiên bản đã được cập nhật');
      fetchTemplate();
      fetchVersions();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Lỗi upload');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleRollback = async (targetVersion: number) => {
    if (!confirm(`Rollback về phiên bản v${targetVersion}?`)) return;
    try {
      const res = await fetch(`/api/templates/${id}/rollback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetVersion, reason: 'Manual rollback' }),
      });
      if (!res.ok) throw new Error('Lỗi rollback');
      toast.success(`Đã rollback về v${targetVersion}`);
      fetchTemplate();
      fetchVersions();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Lỗi rollback');
    }
  };

  const handlePreview = async () => {
    if (!previewEntityId) {
      toast.error('Nhập Entity ID để preview');
      return;
    }
    setPreviewing(true);
    setPreviewUrl('');
    try {
      const res = await fetch(`/api/templates/${id}/preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entityId: previewEntityId,
          entityType: previewEntityType,
          outputFormat: previewFormat,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Lỗi preview');
      if (json.data?.previewUrl) setPreviewUrl(json.data.previewUrl);
      else toast.success('Preview đã được tạo');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Lỗi preview');
    } finally {
      setPreviewing(false);
    }
  };

  const handleExport = async () => {
    if (!exportEntityId) {
      toast.error('Nhập Entity ID để xuất');
      return;
    }
    setExporting(true);
    try {
      const res = await fetch('/api/templates/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: id,
          entityId: exportEntityId,
          entityType: exportEntityType,
          outputFormat: exportFormat,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Lỗi xuất file');
      if (json.data?.downloadUrl) {
        window.open(json.data.downloadUrl, '_blank');
        toast.success('Xuất file thành công');
      } else {
        toast.success(`Đã tạo job xuất (ID: ${json.data?.jobId})`);
      }
      setExportOpen(false);
      fetchRecentJobs();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Lỗi xuất file');
    } finally {
      setExporting(false);
    }
  };

  const toggleFormat = (fmt: string) => {
    setEditForm(prev => ({
      ...prev,
      outputFormats: prev.outputFormats.includes(fmt)
        ? prev.outputFormats.filter(f => f !== fmt)
        : [...prev.outputFormats, fmt],
    }));
  };

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!template) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500">Không tìm thấy template</p>
        <Button className="mt-4" onClick={() => router.push('/dashboard/templates')}>
          <ArrowLeft className="mr-2 h-4 w-4" />Quay lại
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/templates')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold">{template.name}</h1>
              {template.isActive ? (
                <Badge className="bg-green-100 text-green-700 border-0">
                  <CheckCircle className="h-3 w-3 mr-1" />Hoạt động
                </Badge>
              ) : (
                <Badge className="bg-gray-100 text-gray-500 border-0">
                  <XCircle className="h-3 w-3 mr-1" />Vô hiệu
                </Badge>
              )}
            </div>
            <p className="text-xs text-gray-400 font-mono mt-0.5">
              {template.code} · v{template.version}
              {template.category && ` · ${CATEGORIES[template.category] || template.category}`}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/dashboard/templates/batch?templateId=${id}`)}
          >
            <Users className="h-4 w-4 mr-1" />Xuất hàng loạt
          </Button>
          <Button variant="outline" size="sm" onClick={() => setPreviewOpen(true)}>
            <Eye className="h-4 w-4 mr-1" />Preview
          </Button>
          <Button size="sm" onClick={() => setExportOpen(true)}>
            <Download className="h-4 w-4 mr-1" />Xuất file
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="info">
            <FileText className="h-4 w-4 mr-1" />Thông tin
          </TabsTrigger>
          <TabsTrigger value="datamap">
            <Code className="h-4 w-4 mr-1" />Data Map
          </TabsTrigger>
          <TabsTrigger value="versions">
            <Layers className="h-4 w-4 mr-1" />Phiên bản ({versions.length})
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className="h-4 w-4 mr-1" />Lịch sử xuất ({recentJobs.length})
          </TabsTrigger>
        </TabsList>

        {/* Info Tab */}
        <TabsContent value="info" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Thông tin mẫu biểu</CardTitle>
              {!editMode ? (
                <Button variant="outline" size="sm" onClick={() => setEditMode(true)}>
                  <Edit className="h-4 w-4 mr-1" />Chỉnh sửa
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setEditMode(false)}>Hủy</Button>
                  <Button size="sm" onClick={handleSaveInfo} disabled={saving}>
                    <Save className="h-4 w-4 mr-1" />{saving ? 'Đang lưu...' : 'Lưu'}
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent>
              {editMode ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label>Tên mẫu biểu</Label>
                      <Input
                        value={editForm.name}
                        onChange={e => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Nhóm nghiệp vụ</Label>
                      <Select
                        value={editForm.category}
                        onValueChange={v => setEditForm(prev => ({ ...prev, category: v }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn nhóm" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(CATEGORIES).map(([k, v]) => (
                            <SelectItem key={k} value={k}>{v}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label>Mô tả</Label>
                    <Textarea
                      value={editForm.description}
                      onChange={e => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                      rows={2}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>RBAC Function Code</Label>
                    <Input
                      value={editForm.rbacCode}
                      onChange={e => setEditForm(prev => ({ ...prev, rbacCode: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Định dạng xuất</Label>
                    <div className="flex gap-4">
                      {['PDF', 'DOCX', 'XLSX', 'HTML'].map(fmt => (
                        <label key={fmt} className="flex items-center gap-2 cursor-pointer">
                          <Checkbox
                            checked={editForm.outputFormats.includes(fmt)}
                            onCheckedChange={() => toggleFormat(fmt)}
                          />
                          <span className={`text-sm px-2 py-0.5 rounded font-medium ${FORMAT_COLORS[fmt] || ''}`}>
                            {fmt}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={editForm.isActive}
                      onCheckedChange={v => setEditForm(prev => ({ ...prev, isActive: !!v }))}
                    />
                    <Label>Kích hoạt template</Label>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
                  <div>
                    <p className="text-xs text-gray-500">Mã template</p>
                    <p className="font-mono font-medium">{template.code}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Nhóm nghiệp vụ</p>
                    <p>{template.category ? (CATEGORIES[template.category] || template.category) : '–'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Định dạng xuất</p>
                    <div className="flex gap-1 mt-1">
                      {template.outputFormats.map(f => (
                        <span key={f} className={`text-xs px-2 py-0.5 rounded font-medium ${FORMAT_COLORS[f] || ''}`}>{f}</span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Module nguồn</p>
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {template.moduleSource.map(m => (
                        <Badge key={m} variant="secondary" className="text-xs">{m}</Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">RBAC Code</p>
                    <p className="font-mono">{template.rbacCode}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Phiên bản</p>
                    <p>v{template.version}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-gray-500">Mô tả</p>
                    <p>{template.description || '–'}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upload file */}
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-base">Upload file mẫu (.docx / .xlsx / .html)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed rounded-lg p-8 text-center">
                <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm text-gray-500 mb-3">
                  File hiện tại: {template.fileKey ? (
                    <span className="font-mono text-blue-600">{template.fileKey.split('/').pop()}</span>
                  ) : <span className="italic">Chưa có file</span>}
                </p>
                <label className="cursor-pointer">
                  <Button variant="outline" size="sm" disabled={uploading} asChild>
                    <span>
                      {uploading ? (
                        <><RefreshCw className="h-4 w-4 mr-2 animate-spin" />Đang upload...</>
                      ) : (
                        <><Upload className="h-4 w-4 mr-2" />Chọn file upload</>
                      )}
                    </span>
                  </Button>
                  <input
                    type="file"
                    accept=".docx,.xlsx,.html"
                    className="hidden"
                    onChange={handleUpload}
                    disabled={uploading}
                  />
                </label>
                <p className="text-xs text-gray-400 mt-2">Tối đa 20MB. Upload sẽ tăng phiên bản.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Data Map Tab */}
        <TabsContent value="datamap" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">Data Map – Ánh xạ Placeholder → Field</CardTitle>
                <p className="text-xs text-gray-500 mt-1">
                  Dùng Visual Editor để ánh xạ placeholder theo từng field. Raw JSON bên dưới để chỉnh sửa nâng cao.
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/dashboard/templates/${id}/datamap`)}
                >
                  <Code className="h-4 w-4 mr-1" />Visual Editor
                </Button>
                <Button size="sm" onClick={handleSaveDataMap} disabled={saving}>
                  <Save className="h-4 w-4 mr-1" />{saving ? 'Đang lưu...' : 'Lưu JSON'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {dataMapError && (
                <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-600">
                  {dataMapError}
                </div>
              )}
              <div className="text-xs text-gray-500 mb-2">
                Raw JSON – format: <code className="bg-gray-100 px-1 rounded">{`{"hoTen": "hoTen", "ngaySinh": "ngaySinh"}`}</code>
              </div>
              <textarea
                className="w-full font-mono text-sm border rounded-md p-3 min-h-[400px] focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                value={dataMapText}
                onChange={e => {
                  setDataMapText(e.target.value);
                  setDataMapError('');
                }}
                spellCheck={false}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Versions Tab */}
        <TabsContent value="versions" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Lịch sử phiên bản</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Phiên bản</TableHead>
                    <TableHead>File</TableHead>
                    <TableHead>Người thay đổi</TableHead>
                    <TableHead>Thời gian</TableHead>
                    <TableHead>Ghi chú</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {versions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-400">
                        Chưa có lịch sử phiên bản
                      </TableCell>
                    </TableRow>
                  ) : (
                    versions.map(v => (
                      <TableRow key={v.version}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge variant={v.version === template.version ? 'default' : 'outline'}>
                              v{v.version}
                            </Badge>
                            {v.version === template.version && (
                              <span className="text-xs text-green-600">Hiện tại</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-xs text-gray-500">
                          {v.fileKey?.split('/').pop() || '–'}
                        </TableCell>
                        <TableCell className="text-sm">{v.changedBy || '–'}</TableCell>
                        <TableCell className="text-xs text-gray-500">
                          {v.changedAt ? new Date(v.changedAt).toLocaleString('vi-VN') : '–'}
                        </TableCell>
                        <TableCell className="text-sm">{v.changeNote || '–'}</TableCell>
                        <TableCell className="text-right">
                          {v.version !== template.version && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRollback(v.version)}
                            >
                              Rollback
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Lịch sử xuất file gần đây</CardTitle>
              <Button variant="outline" size="sm" onClick={() => router.push(`/dashboard/templates/export-jobs?templateId=${id}`)}>
                Xem tất cả
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Loại entity</TableHead>
                    <TableHead>Định dạng</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Thành công / Lỗi</TableHead>
                    <TableHead>Thời gian tạo</TableHead>
                    <TableHead className="text-right">Download</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentJobs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-400">
                        Chưa có lịch sử xuất file
                      </TableCell>
                    </TableRow>
                  ) : (
                    recentJobs.map(job => (
                      <TableRow key={job.id}>
                        <TableCell className="capitalize">{job.entityType}</TableCell>
                        <TableCell>
                          <span className={`text-xs px-2 py-0.5 rounded font-medium ${FORMAT_COLORS[job.outputFormat] || 'bg-gray-100 text-gray-700'}`}>
                            {job.outputFormat}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={`text-xs px-2 py-0.5 rounded font-medium ${STATUS_COLORS[job.status] || 'bg-gray-100 text-gray-700'}`}>
                            {job.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm">
                          <span className="text-green-600">{job.successCount} ✓</span>
                          {job.failCount > 0 && <span className="text-red-600 ml-2">{job.failCount} ✗</span>}
                        </TableCell>
                        <TableCell className="text-xs text-gray-500">
                          {new Date(job.createdAt).toLocaleString('vi-VN')}
                        </TableCell>
                        <TableCell className="text-right">
                          {job.signedUrl && job.urlExpiresAt && new Date(job.urlExpiresAt) > new Date() ? (
                            <Button variant="ghost" size="sm" onClick={() => window.open(job.signedUrl!, '_blank')}>
                              <Download className="h-4 w-4" />
                            </Button>
                          ) : (
                            <span className="text-xs text-gray-400">Hết hạn</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Preview mẫu biểu</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label>Entity ID (mã cán bộ/học viên)</Label>
              <Input
                placeholder="Nhập ID để lấy dữ liệu thực..."
                value={previewEntityId}
                onChange={e => setPreviewEntityId(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Loại entity</Label>
                <Select value={previewEntityType} onValueChange={setPreviewEntityType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="personnel">Cán bộ (Personnel)</SelectItem>
                    <SelectItem value="student">Học viên (Student)</SelectItem>
                    <SelectItem value="faculty">Giảng viên (Faculty)</SelectItem>
                    <SelectItem value="party_member">Đảng viên</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Định dạng</Label>
                <Select value={previewFormat} onValueChange={setPreviewFormat}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {template.outputFormats.map(f => (
                      <SelectItem key={f} value={f}>{f}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {previewUrl && (
              <div className="p-3 bg-green-50 border border-green-200 rounded text-sm">
                <p className="text-green-700 font-medium mb-1">Preview đã sẵn sàng</p>
                <Button size="sm" onClick={() => window.open(previewUrl, '_blank')}>
                  <Eye className="h-4 w-4 mr-1" />Mở preview
                </Button>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewOpen(false)}>Đóng</Button>
            <Button onClick={handlePreview} disabled={previewing}>
              {previewing ? 'Đang tạo...' : 'Tạo preview'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Export Dialog */}
      <Dialog open={exportOpen} onOpenChange={setExportOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Xuất file từ mẫu biểu</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label>Entity ID <span className="text-red-500">*</span></Label>
              <Input
                placeholder="Nhập ID cán bộ/học viên..."
                value={exportEntityId}
                onChange={e => setExportEntityId(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Loại entity</Label>
                <Select value={exportEntityType} onValueChange={setExportEntityType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="personnel">Cán bộ</SelectItem>
                    <SelectItem value="student">Học viên</SelectItem>
                    <SelectItem value="faculty">Giảng viên</SelectItem>
                    <SelectItem value="party_member">Đảng viên</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Định dạng xuất</Label>
                <Select value={exportFormat} onValueChange={setExportFormat}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {template.outputFormats.map(f => (
                      <SelectItem key={f} value={f}>{f}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExportOpen(false)}>Hủy</Button>
            <Button onClick={handleExport} disabled={exporting}>
              <Download className="h-4 w-4 mr-1" />
              {exporting ? 'Đang xuất...' : 'Xuất file'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
