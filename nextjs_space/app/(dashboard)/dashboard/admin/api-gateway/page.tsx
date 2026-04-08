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
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import {
  Key, Plus, RefreshCw, Copy, Shield, Activity,
  Clock, AlertTriangle, CheckCircle2, XCircle, ArrowLeft
} from 'lucide-react';
import Link from 'next/link';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar
} from 'recharts';

interface ApiKey {
  id: string;
  name: string;
  description?: string;
  keyPrefix: string;
  permissions: string[];
  ipWhitelist: string[];
  rateLimit: number;
  dailyLimit: number;
  status: string;
  expiresAt?: string;
  lastUsedAt?: string;
  totalRequests: number;
  todayRequests: number;
  createdAt: string;
}

interface ApiStats {
  keys: { total: number; active: number; suspended: number; revoked: number };
  requests: { today: number; week: number; month: number; total: number };
  performance: { avgResponseTime: number; errorRate: number };
  topEndpoints: { endpoint: string; _count: number }[];
  topApiKeys: { apiKeyId: string; name: string; keyPrefix: string; _count: number }[];
  hourlyStats: { hour: string; count: number }[];
}

const AVAILABLE_PERMISSIONS = [
  { id: 'read:students', label: 'Đọc dữ liệu Học viên', icon: '🎓' },
  { id: 'read:faculty', label: 'Đọc dữ liệu Giảng viên', icon: '👨‍🏫' },
  { id: 'read:courses', label: 'Đọc dữ liệu Khóa học', icon: '📚' },
  { id: 'read:departments', label: 'Đọc dữ liệu Đơn vị', icon: '🏢' },
  { id: 'read:statistics', label: 'Đọc thống kê hệ thống', icon: '📊' },
  { id: 'read:research', label: 'Đọc nghiên cứu khoa học', icon: '🔬' },
  { id: 'write:data', label: 'Ghi dữ liệu', icon: '✍️' },
];

export default function ApiGatewayPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const { t } = useLanguage();

  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [stats, setStats] = useState<ApiStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showKeyDialog, setShowKeyDialog] = useState(false);
  const [newApiKey, setNewApiKey] = useState<{ plainKey: string; name: string } | null>(null);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Form state for creating API key
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permissions: [] as string[],
    ipWhitelist: '',
    rateLimit: 100,
    dailyLimit: 10000,
    expiresAt: '',
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchData();
    }
  }, [status]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [keysRes, statsRes] = await Promise.all([
        fetch(`/api/admin/api-gateway/keys?status=${statusFilter}&search=${searchQuery}`),
        fetch('/api/admin/api-gateway/stats'),
      ]);

      if (keysRes.ok) {
        const keysData = await keysRes.json();
        setKeys(keysData.keys);
      }
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Lỗi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateKey = async () => {
    if (!formData.name || formData.permissions.length === 0) {
      toast.error('Vui lòng nhập tên và chọn quyền');
      return;
    }

    try {
      const res = await fetch('/api/admin/api-gateway/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          ipWhitelist: formData.ipWhitelist ? formData.ipWhitelist.split(',').map(ip => ip.trim()) : [],
          expiresAt: formData.expiresAt || null,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setNewApiKey({ plainKey: data.apiKey.plainKey, name: data.apiKey.name });
        setShowCreateDialog(false);
        setShowKeyDialog(true);
        setFormData({
          name: '',
          description: '',
          permissions: [],
          ipWhitelist: '',
          rateLimit: 100,
          dailyLimit: 10000,
          expiresAt: '',
        });
        fetchData();
        toast.success('Tạo API key thành công!');
      } else {
        toast.error(data.error || 'Lỗi tạo API key');
      }
    } catch (error) {
      toast.error('Lỗi server');
    }
  };

  const handleRevokeKey = async (id: string, name: string) => {
    if (!confirm(`Bạn có chắc chắn muốn thu hồi API key "${name}"?`)) return;

    try {
      const res = await fetch(`/api/admin/api-gateway/keys?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Thu hồi API key thành công');
        fetchData();
      } else {
        toast.error('Lỗi thu hồi API key');
      }
    } catch (error) {
      toast.error('Lỗi server');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Đã sao chép!');
  };

  const getStatusBadge = (status: string) => {
    const styles: { [key: string]: string } = {
      ACTIVE: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      SUSPENDED: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      REVOKED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      EXPIRED: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
    };
    const labels: { [key: string]: string } = {
      ACTIVE: 'Hoạt động',
      SUSPENDED: 'Tạm ngưng',
      REVOKED: 'Thu hồi',
      EXPIRED: 'Hết hạn',
    };
    return <Badge className={styles[status]}>{labels[status]}</Badge>;
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
        <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-10"><Key className="h-24 w-24" /></div>
        <div className="relative px-8 py-6">
          <Link href="/dashboard/admin"
            className="inline-flex items-center gap-1.5 text-indigo-100 hover:text-white text-sm mb-3 transition-colors">
            <ArrowLeft className="h-4 w-4" />Quản trị hệ thống
          </Link>
          <div className="flex items-end justify-between">
            <div>
              <h1 className="text-2xl font-bold">External API Gateway</h1>
              <p className="text-indigo-100 text-sm mt-1">Quản lý API keys cho ứng dụng bên ngoài truy cập dữ liệu hệ thống</p>
            </div>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button className="bg-white text-indigo-700 hover:bg-indigo-50 font-semibold">
                  <Plus className="w-4 h-4 mr-2" />Tạo API Key mới
                </Button>
              </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Tạo API Key mới</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>Tên ứng dụng / Đối tác *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ví dụ: Hệ thống quản lý nhân sự"
                  />
                </div>
                <div className="col-span-2">
                  <Label>Mô tả</Label>
                  <Input
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Mục đích sử dụng API"
                  />
                </div>
              </div>

              <div>
                <Label className="mb-3 block">Quyền truy cập *</Label>
                <div className="grid grid-cols-2 gap-2">
                  {AVAILABLE_PERMISSIONS.map((perm) => (
                    <div key={perm.id} className="flex items-center gap-2 p-2 rounded border">
                      <Checkbox
                        id={perm.id}
                        checked={formData.permissions.includes(perm.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setFormData({ ...formData, permissions: [...formData.permissions, perm.id] });
                          } else {
                            setFormData({
                              ...formData,
                              permissions: formData.permissions.filter((p) => p !== perm.id),
                            });
                          }
                        }}
                      />
                      <Label htmlFor={perm.id} className="cursor-pointer flex items-center gap-2">
                        <span>{perm.icon}</span>
                        <span className="text-sm">{perm.label}</span>
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Rate Limit (requests/phút)</Label>
                  <Input
                    type="number"
                    value={formData.rateLimit}
                    onChange={(e) => setFormData({ ...formData, rateLimit: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>Daily Limit (requests/ngày)</Label>
                  <Input
                    type="number"
                    value={formData.dailyLimit}
                    onChange={(e) => setFormData({ ...formData, dailyLimit: parseInt(e.target.value) })}
                  />
                </div>
              </div>

              <div>
                <Label>IP Whitelist (cách nhau bởi dấu phẩy, để trống = cho phép tất cả)</Label>
                <Input
                  value={formData.ipWhitelist}
                  onChange={(e) => setFormData({ ...formData, ipWhitelist: e.target.value })}
                  placeholder="192.168.1.1, 10.0.0.0/24"
                />
              </div>

              <div>
                <Label>Ngày hết hạn (để trống = vĩnh viễn)</Label>
                <Input
                  type="date"
                  value={formData.expiresAt}
                  onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Hủy</Button>
              <Button onClick={handleCreateKey}>Tạo API Key</Button>
            </DialogFooter>
            </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Show new API key dialog */}
      <Dialog open={showKeyDialog} onOpenChange={setShowKeyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              API Key đã được tạo!
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200">
              <p className="text-sm text-yellow-800 dark:text-yellow-200 font-medium">
                ⚠️ Lưu ý: API key chỉ hiển thị một lần duy nhất!
              </p>
            </div>
            <div>
              <Label>Tên: {newApiKey?.name}</Label>
              <div className="flex gap-2 mt-2">
                <Input value={newApiKey?.plainKey || ''} readOnly className="font-mono text-sm" />
                <Button variant="outline" onClick={() => copyToClipboard(newApiKey?.plainKey || '')}>
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowKeyDialog(false)}>Đã lưu</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* KPI Tiles */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-xl border bg-white p-4 flex items-start gap-3 shadow-sm">
            <div className="rounded-lg p-2.5 bg-indigo-100 text-indigo-600"><Key className="h-5 w-5" /></div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stats.keys.total}</p>
              <p className="text-sm text-slate-500">Tổng API Keys</p>
              <div className="flex gap-1.5 mt-1">
                <span className="text-xs bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full">{stats.keys.active} active</span>
                <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full">{stats.keys.revoked} revoked</span>
              </div>
            </div>
          </div>
          <div className="rounded-xl border bg-white p-4 flex items-start gap-3 shadow-sm">
            <div className="rounded-lg p-2.5 bg-emerald-100 text-emerald-600"><Activity className="h-5 w-5" /></div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stats.requests.today.toLocaleString()}</p>
              <p className="text-sm text-slate-500">Requests hôm nay</p>
              <p className="text-xs text-slate-400 mt-0.5">Tuần: {stats.requests.week.toLocaleString()}</p>
            </div>
          </div>
          <div className="rounded-xl border bg-white p-4 flex items-start gap-3 shadow-sm">
            <div className="rounded-lg p-2.5 bg-violet-100 text-violet-600"><Clock className="h-5 w-5" /></div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stats.performance.avgResponseTime}ms</p>
              <p className="text-sm text-slate-500">Avg Response Time</p>
            </div>
          </div>
          <div className="rounded-xl border bg-white p-4 flex items-start gap-3 shadow-sm">
            <div className={`rounded-lg p-2.5 ${stats.performance.errorRate > 5 ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stats.performance.errorRate}%</p>
              <p className="text-sm text-slate-500">Error Rate (7 ngày)</p>
            </div>
          </div>
        </div>
      )}

      <Tabs defaultValue="keys" className="space-y-4">
        <TabsList className="bg-slate-100">
          <TabsTrigger value="keys">API Keys</TabsTrigger>
          <TabsTrigger value="analytics">Phân tích</TabsTrigger>
          <TabsTrigger value="docs">Tài liệu API</TabsTrigger>
        </TabsList>

        <TabsContent value="keys" className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-slate-50 rounded-xl border p-4 flex flex-wrap gap-3 items-center">
            <div className="flex-1 min-w-[200px]">
              <Input placeholder="Tìm kiếm theo tên, mô tả..."
                value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-white" />
            </div>
            <div className="w-40">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="bg-white"><SelectValue placeholder="Trạng thái" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tất cả</SelectItem>
                  <SelectItem value="ACTIVE">Hoạt động</SelectItem>
                  <SelectItem value="SUSPENDED">Tạm ngưng</SelectItem>
                  <SelectItem value="REVOKED">Thu hồi</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" onClick={fetchData} className="bg-white">
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>

          {/* Keys List */}
          <div className="space-y-4">
            {keys.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Key className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Chưa có API key nào</p>
                </CardContent>
              </Card>
            ) : (
              keys.map((key) => (
                <Card key={key.id}>
                  <CardContent className="pt-4">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-lg">{key.name}</h3>
                          {getStatusBadge(key.status)}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{key.description}</p>
                        <div className="flex flex-wrap items-center gap-4 mt-3 text-sm">
                          <span className="font-mono bg-muted px-2 py-1 rounded">{key.keyPrefix}</span>
                          <span className="flex items-center gap-1">
                            <Activity className="w-4 h-4" />
                            {key.todayRequests} hôm nay / {key.totalRequests} tổng
                          </span>
                          <span className="flex items-center gap-1">
                            <Shield className="w-4 h-4" />
                            {key.rateLimit}/phút
                          </span>
                          {key.lastUsedAt && (
                            <span className="text-muted-foreground">
                              Sử dụng cuối: {new Date(key.lastUsedAt).toLocaleString('vi-VN')}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {key.permissions.map((p) => (
                            <Badge key={p} variant="outline" className="text-xs">{p}</Badge>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {key.status === 'ACTIVE' && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleRevokeKey(key.id, key.name)}
                          >
                            <XCircle className="w-4 h-4 mr-1" /> Thu hồi
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="analytics">
          {stats && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Requests theo giờ (24h qua)</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={stats.hourlyStats}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="hour" fontSize={12} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Top Endpoints (7 ngày)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {stats.topEndpoints.map((ep, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <span className="font-mono text-sm">{ep.endpoint}</span>
                        <Badge variant="secondary">{ep._count} requests</Badge>
                      </div>
                    ))}
                    {stats.topEndpoints.length === 0 && (
                      <p className="text-muted-foreground text-center py-4">Chưa có dữ liệu</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Top API Keys (7 ngày)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {stats.topApiKeys.map((key, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div>
                          <p className="font-medium">{key.name}</p>
                          <p className="text-sm text-muted-foreground font-mono">{key.keyPrefix}</p>
                        </div>
                        <Badge>{key._count} requests</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="docs">
          <Card>
            <CardHeader>
              <CardTitle>Tài liệu API cho đối tác bên ngoài</CardTitle>
              <CardDescription>
                Hướng dẫn sử dụng External API Gateway
              </CardDescription>
            </CardHeader>
            <CardContent className="prose dark:prose-invert max-w-none">
              <h3>Base URL</h3>
              <pre className="bg-muted p-4 rounded-lg overflow-x-auto">
                <code>https://bigdatahvhc.abacusai.app/api/external/v1</code>
              </pre>

              <h3>Authentication</h3>
              <p>Sử dụng Bearer token trong header:</p>
              <pre className="bg-muted p-4 rounded-lg overflow-x-auto">
                <code>{`Authorization: Bearer hvhc_your_api_key_here`}</code>
              </pre>

              <h3>Available Endpoints</h3>
              <table className="w-full">
                <thead>
                  <tr>
                    <th>Endpoint</th>
                    <th>Permission</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><code>/students</code></td>
                    <td><Badge>read:students</Badge></td>
                    <td>Danh sách học viên</td>
                  </tr>
                  <tr>
                    <td><code>/faculty</code></td>
                    <td><Badge>read:faculty</Badge></td>
                    <td>Danh sách giảng viên</td>
                  </tr>
                  <tr>
                    <td><code>/courses</code></td>
                    <td><Badge>read:courses</Badge></td>
                    <td>Danh sách khóa học</td>
                  </tr>
                  <tr>
                    <td><code>/departments</code></td>
                    <td><Badge>read:departments</Badge></td>
                    <td>Danh sách đơn vị</td>
                  </tr>
                  <tr>
                    <td><code>/statistics</code></td>
                    <td><Badge>read:statistics</Badge></td>
                    <td>Thống kê hệ thống</td>
                  </tr>
                  <tr>
                    <td><code>/research</code></td>
                    <td><Badge>read:research</Badge></td>
                    <td>Đề tài nghiên cứu công khai</td>
                  </tr>
                </tbody>
              </table>

              <h3>Query Parameters</h3>
              <ul>
                <li><code>limit</code> - Số bản ghi tối đa (max: 100)</li>
                <li><code>offset</code> - Bỏ qua số bản ghi đầu tiên</li>
              </ul>

              <h3>Example Request</h3>
              <pre className="bg-muted p-4 rounded-lg overflow-x-auto">
                <code>{`curl -X GET "https://bigdatahvhc.abacusai.app/api/external/v1/students?limit=10" \\
  -H "Authorization: Bearer hvhc_your_api_key_here"`}</code>
              </pre>

              <h3>Response Headers</h3>
              <ul>
                <li><code>X-RateLimit-Limit</code> - Giới hạn requests/phút</li>
                <li><code>X-RateLimit-Remaining</code> - Số requests còn lại</li>
                <li><code>X-Response-Time</code> - Thời gian xử lý</li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
