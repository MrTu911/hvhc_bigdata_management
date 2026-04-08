/**
 * Trang Nhật ký Hoạt động (Audit Logs)
 * Hiển thị lịch sử thao tác trong hệ thống
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
} from '@/components/ui/dialog';
import {
  ScrollText,
  Search,
  RefreshCw,
  Download,
  Eye,
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  User,
  MapPin,
  FileText,
  ArrowLeft,
  AlertTriangle
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

interface AuditLog {
  id: string;
  userId: string;
  functionCode: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  oldValue?: any;
  newValue?: any;
  result: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
  user?: {
    name: string;
    email: string;
  };
}

const ACTIONS = [
  { value: 'all', label: 'Tất cả thao tác' },
  { value: 'CREATE', label: 'Tạo mới' },
  { value: 'UPDATE', label: 'Cập nhật' },
  { value: 'DELETE', label: 'Xóa' },
  { value: 'VIEW', label: 'Xem' },
  { value: 'LOGIN', label: 'Đăng nhập' },
  { value: 'LOGOUT', label: 'Đăng xuất' },
  { value: 'EXPORT', label: 'Xuất dữ liệu' },
];

const RESULTS = [
  { value: 'all', label: 'Tất cả kết quả' },
  { value: 'SUCCESS', label: 'Thành công' },
  { value: 'FAILURE', label: 'Thất bại' },
  { value: 'DENIED', label: 'Từ chối' },
];

const RESOURCE_TYPES = [
  { value: 'all', label: 'Tất cả' },
  { value: 'USER', label: 'Người dùng' },
  { value: 'POSITION', label: 'Chức danh' },
  { value: 'FUNCTION', label: 'Chức năng' },
  { value: 'USER_POSITION', label: 'Gán chức danh' },
  { value: 'POSITION_FUNCTION', label: 'Gán quyền' },
  { value: 'UNIT', label: 'Đơn vị' },
  { value: 'RESEARCH_PROJECT', label: 'Dự án NCKH' },
  { value: 'GRADE', label: 'Điểm' },
  { value: 'POLICY', label: 'Chính sách' },
];

export default function AuditLogsPage() {
  const { toast } = useToast();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [resultFilter, setResultFilter] = useState('all');
  const [resourceFilter, setResourceFilter] = useState('all');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (searchTerm) params.append('search', searchTerm);
      if (actionFilter !== 'all') params.append('action', actionFilter);
      if (resultFilter !== 'all') params.append('result', resultFilter);
      if (resourceFilter !== 'all') params.append('resourceType', resourceFilter);

      const res = await fetch(`/api/audit?${params}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
        setTotal(data.total || 0);
      }
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể tải nhật ký hoạt động',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [page, searchTerm, actionFilter, resultFilter, resourceFilter, toast]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleExport = async () => {
    try {
      const params = new URLSearchParams({ format: 'csv' });
      if (actionFilter !== 'all') params.append('action', actionFilter);
      if (resultFilter !== 'all') params.append('result', resultFilter);
      
      const res = await fetch(`/api/audit/export?${params}`);
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        toast({
          title: 'Thành công',
          description: 'Xuất nhật ký thành công',
        });
      }
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: 'Không thể xuất nhật ký',
        variant: 'destructive'
      });
    }
  };

  const getResultBadge = (result: string) => {
    switch (result) {
      case 'SUCCESS':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Thành công</Badge>;
      case 'FAILURE':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Thất bại</Badge>;
      case 'DENIED':
        return <Badge variant="secondary"><Shield className="h-3 w-3 mr-1" />Từ chối</Badge>;
      default:
        return <Badge variant="outline">{result}</Badge>;
    }
  };

  const getActionLabel = (action: string) => {
    const found = ACTIONS.find(a => a.value === action);
    return found?.label || action;
  };

  const getResourceLabel = (resource: string) => {
    const found = RESOURCE_TYPES.find(r => r.value === resource);
    return found?.label || resource;
  };

  const totalPages = Math.ceil(total / limit);

  if (loading && logs.length === 0) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-32 w-full rounded-2xl" />
        <div className="grid grid-cols-4 gap-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
        <Skeleton className="h-[400px] w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Indigo Banner */}
      <div className="relative rounded-2xl overflow-hidden text-white bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,.05) 10px, rgba(255,255,255,.05) 20px)' }} />
        <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-10"><ScrollText className="h-24 w-24" /></div>
        <div className="relative px-8 py-6">
          <Link href="/dashboard/admin"
            className="inline-flex items-center gap-1.5 text-indigo-100 hover:text-white text-sm mb-3 transition-colors">
            <ArrowLeft className="h-4 w-4" />Quản trị hệ thống
          </Link>
          <div className="flex items-end justify-between">
            <div>
              <h1 className="text-2xl font-bold">Nhật ký Hoạt động</h1>
              <p className="text-indigo-100 text-sm mt-1">Theo dõi lịch sử thao tác và sự kiện trong hệ thống</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={fetchLogs}
                className="border-white/40 bg-white/20 text-white hover:bg-white/30">
                <RefreshCw className="h-4 w-4 mr-2" />Làm mới
              </Button>
              <Button onClick={handleExport}
                className="bg-white text-indigo-700 hover:bg-indigo-50 font-semibold">
                <Download className="h-4 w-4 mr-2" />Xuất CSV
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Tổng bản ghi', value: total.toLocaleString(), icon: FileText, color: 'bg-indigo-100 text-indigo-600' },
          { label: 'Thành công', value: logs.filter(l => l.result === 'SUCCESS').length, icon: CheckCircle, color: 'bg-emerald-100 text-emerald-600' },
          { label: 'Thất bại', value: logs.filter(l => l.result === 'FAILURE').length, icon: XCircle, color: 'bg-red-100 text-red-600' },
          { label: 'Từ chối', value: logs.filter(l => l.result === 'DENIED').length, icon: Shield, color: 'bg-orange-100 text-orange-600' },
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

      {/* Filter Bar */}
      <div className="bg-slate-50 rounded-xl border p-4 flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input placeholder="Tìm kiếm theo email, tài nguyên..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
            className="pl-10 bg-white" />
        </div>
        <div className="w-[160px]">
          <Select value={actionFilter} onValueChange={(v) => { setActionFilter(v); setPage(1); }}>
            <SelectTrigger className="bg-white"><SelectValue placeholder="Thao tác" /></SelectTrigger>
            <SelectContent>{ACTIONS.map(a => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="w-[160px]">
          <Select value={resultFilter} onValueChange={(v) => { setResultFilter(v); setPage(1); }}>
            <SelectTrigger className="bg-white"><SelectValue placeholder="Kết quả" /></SelectTrigger>
            <SelectContent>{RESULTS.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="w-[160px]">
          <Select value={resourceFilter} onValueChange={(v) => { setResourceFilter(v); setPage(1); }}>
            <SelectTrigger className="bg-white"><SelectValue placeholder="Tài nguyên" /></SelectTrigger>
            <SelectContent>{RESOURCE_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b flex items-center justify-between">
          <h3 className="font-semibold text-slate-800">Danh sách Nhật ký</h3>
          <span className="text-sm text-slate-500">Hiển thị {logs.length} / {total} bản ghi</span>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead className="font-semibold text-slate-600">Thời gian</TableHead>
              <TableHead className="font-semibold text-slate-600">Người thực hiện</TableHead>
              <TableHead className="font-semibold text-slate-600">Thao tác</TableHead>
              <TableHead className="font-semibold text-slate-600">Tài nguyên</TableHead>
              <TableHead className="font-semibold text-slate-600">Kết quả</TableHead>
              <TableHead className="font-semibold text-slate-600">IP</TableHead>
              <TableHead className="font-semibold text-slate-600 text-right">Chi tiết</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-14">
                  <ScrollText className="mx-auto h-10 w-10 text-slate-300 mb-2" />
                  <p className="text-slate-400">Không có dữ liệu nhật ký</p>
                </TableCell>
              </TableRow>
            ) : logs.map((log) => (
              <TableRow key={log.id} className="hover:bg-slate-50 transition-colors">
                <TableCell className="text-sm text-slate-600">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3 text-slate-400" />
                    {new Date(log.timestamp).toLocaleString('vi-VN')}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 text-sm">
                    <User className="h-3 w-3 text-slate-400" />
                    {log.user?.email || log.userId}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-xs border rounded-full px-2 py-0.5 text-slate-600">{getActionLabel(log.action)}</span>
                </TableCell>
                <TableCell className="text-sm text-slate-700">
                  {getResourceLabel(log.resourceType)}
                  {log.resourceId && <span className="text-xs text-slate-400 ml-1">#{log.resourceId.slice(0,8)}</span>}
                </TableCell>
                <TableCell>{getResultBadge(log.result)}</TableCell>
                <TableCell className="text-xs text-slate-400">
                  {log.ipAddress && <div className="flex items-center gap-1"><MapPin className="h-3 w-3" />{log.ipAddress}</div>}
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => { setSelectedLog(log); setDetailOpen(true); }}
                    className="hover:bg-indigo-50">
                    <Eye className="h-4 w-4 text-indigo-600" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3.5 border-t bg-slate-50">
            <span className="text-sm text-slate-500">Trang {page} / {totalPages}</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Trước</Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Sau</Button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Chi tiết Nhật ký</DialogTitle>
            <DialogDescription>
              Thông tin chi tiết về thao tác trong hệ thống
            </DialogDescription>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Thời gian</p>
                  <p className="font-medium">{new Date(selectedLog.timestamp).toLocaleString('vi-VN')}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Người thực hiện</p>
                  <p className="font-medium">{selectedLog.user?.name || selectedLog.userId}</p>
                  <p className="text-xs text-muted-foreground">{selectedLog.user?.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Thao tác</p>
                  <Badge variant="outline">{getActionLabel(selectedLog.action)}</Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Kết quả</p>
                  {getResultBadge(selectedLog.result)}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Loại tài nguyên</p>
                  <p className="font-medium">{getResourceLabel(selectedLog.resourceType)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">ID Tài nguyên</p>
                  <p className="font-mono text-sm">{selectedLog.resourceId || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Địa chỉ IP</p>
                  <p className="font-mono text-sm">{selectedLog.ipAddress || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Mã chức năng</p>
                  <p className="font-mono text-sm">{selectedLog.functionCode}</p>
                </div>
              </div>
              
              {selectedLog.oldValue && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Giá trị cũ</p>
                  <pre className="bg-muted p-3 rounded text-xs overflow-auto max-h-32">
                    {typeof selectedLog.oldValue === 'string' 
                      ? selectedLog.oldValue 
                      : JSON.stringify(selectedLog.oldValue, null, 2)}
                  </pre>
                </div>
              )}
              
              {selectedLog.newValue && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Giá trị mới</p>
                  <pre className="bg-muted p-3 rounded text-xs overflow-auto max-h-32">
                    {typeof selectedLog.newValue === 'string' 
                      ? selectedLog.newValue 
                      : JSON.stringify(selectedLog.newValue, null, 2)}
                  </pre>
                </div>
              )}
              
              {selectedLog.userAgent && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">User Agent</p>
                  <p className="text-xs text-muted-foreground break-all">{selectedLog.userAgent}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
