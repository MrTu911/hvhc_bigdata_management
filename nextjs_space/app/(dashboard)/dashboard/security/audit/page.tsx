'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Shield, AlertTriangle, User, MapPin, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import { toast } from 'sonner';

interface AuditLog {
  id: string;
  fileId: string;
  userId: string;
  action: string;
  success: boolean;
  ipAddress?: string;
  timestamp: string;
  file: {
    fileName: string;
    classification: string;
  };
}

const actionColors: Record<string, string> = {
  VIEW: 'bg-blue-500',
  DOWNLOAD: 'bg-green-500',
  EDIT: 'bg-yellow-500',
  DELETE: 'bg-red-500',
  SHARE: 'bg-purple-500',
};

export default function SecurityAuditPage() {
  const { data: session } = useSession() || {};
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [suspicious, setSuspicious] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('all');
  const [successFilter, setSuccessFilter] = useState('all');

  useEffect(() => {
    if (session?.user?.role === 'ADMIN' || session?.user?.role === 'NGHIEN_CUU_VIEN') {
      fetchAuditLogs();
      fetchSuspiciousActivities();
    }
  }, [session, actionFilter, successFilter]);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (actionFilter !== 'all') params.append('action', actionFilter);
      if (successFilter !== 'all') params.append('success', successFilter);

      const response = await fetch(`/api/audit/file-access?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setLogs(data.data);
      }
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      toast.error('Failed to fetch audit logs');
    } finally {
      setLoading(false);
    }
  };

  const fetchSuspiciousActivities = async () => {
    try {
      const response = await fetch('/api/audit/suspicious?hours=24');
      const data = await response.json();

      if (data.success) {
        setSuspicious(data.data);
      }
    } catch (error) {
      console.error('Error fetching suspicious activities:', error);
    }
  };

  if (session?.user?.role !== 'ADMIN' && session?.user?.role !== 'NGHIEN_CUU_VIEN') {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-bold mb-2">Không có quyền truy cập</h2>
            <p className="text-muted-foreground">
              Chỉ Admin và Nghiên cứu viên mới có thể xem audit logs
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8 text-red-600" />
            Security Audit Trail
          </h1>
          <p className="text-muted-foreground mt-1">
            Theo dõi hoạt động truy cập và phát hiện hành vi bất thường
          </p>
        </div>
      </div>

      {suspicious && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-red-200 bg-red-50">
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                Lỗi truy cập (24h)
              </CardDescription>
              <CardTitle className="text-3xl text-red-600">
                {suspicious.summary?.totalFailedAttempts || 0}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <User className="h-4 w-4 text-orange-600" />
                Người dùng đáng ngờ
              </CardDescription>
              <CardTitle className="text-3xl text-orange-600">
                {suspicious.suspiciousUsers?.length || 0}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-yellow-200 bg-yellow-50">
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-yellow-600" />
                IP đáng ngờ
              </CardDescription>
              <CardTitle className="text-3xl text-yellow-600">
                {suspicious.suspiciousIPs?.length || 0}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>
      )}

      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Hành động" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả hành động</SelectItem>
                <SelectItem value="VIEW">View</SelectItem>
                <SelectItem value="DOWNLOAD">Download</SelectItem>
                <SelectItem value="EDIT">Edit</SelectItem>
                <SelectItem value="DELETE">Delete</SelectItem>
                <SelectItem value="SHARE">Share</SelectItem>
              </SelectContent>
            </Select>
            <Select value={successFilter} onValueChange={setSuccessFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Kết quả" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="true">Thành công</SelectItem>
                <SelectItem value="false">Thất bại</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>File Access Logs</CardTitle>
          <CardDescription>Lịch sử truy cập tài liệu của hệ thống</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Đang tải...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Chưa có log nào</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Thời gian</TableHead>
                    <TableHead>Người dùng</TableHead>
                    <TableHead>Hành động</TableHead>
                    <TableHead>File</TableHead>
                    <TableHead>Phân loại</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Kết quả</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString('vi-VN')}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{log.userId.slice(0, 8)}...</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${actionColors[log.action]} text-white`}>
                          {log.action}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {log.file.fileName}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{log.file.classification}</Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {log.ipAddress || '-'}
                      </TableCell>
                      <TableCell>
                        {log.success ? (
                          <Badge className="bg-green-500 text-white">Thành công</Badge>
                        ) : (
                          <Badge className="bg-red-500 text-white">Thất bại</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {suspicious?.suspiciousUsers && suspicious.suspiciousUsers.length > 0 && (
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Người dùng có hoạt động đáng ngờ
            </CardTitle>
            <CardDescription>
              Người dùng có nhiều lần thất bại khi truy cập (&gt;5 lần trong 24h)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {suspicious.suspiciousUsers.map((user: any, idx: number) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 bg-red-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-red-600" />
                    <span className="font-medium">{user.userId}</span>
                  </div>
                  <Badge className="bg-red-600 text-white">
                    {user.failedAttempts} lần thất bại
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
