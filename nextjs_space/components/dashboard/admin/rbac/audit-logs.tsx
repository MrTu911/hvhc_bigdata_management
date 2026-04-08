
'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  Download, 
  Filter,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  resource: string;
  status: 'SUCCESS' | 'FAILED' | 'WARNING';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  ipAddress: string;
  details: string;
}

export function AuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');

  useEffect(() => {
    fetchLogs();
  }, [statusFilter, severityFilter]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (severityFilter !== 'all') params.append('severity', severityFilter);

      const response = await fetch(`/api/admin/rbac/audit-logs?${params}`);
      const data = await response.json();
      setLogs(data.logs || []);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log =>
    log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.resource.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'FAILED':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'WARNING':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      default:
        return <Info className="w-4 h-4 text-blue-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return <Badge>Thành công</Badge>;
      case 'FAILED':
        return <Badge variant="destructive">Thất bại</Badge>;
      case 'WARNING':
        return <Badge variant="secondary">Cảnh báo</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return <Badge variant="destructive">Nghiêm trọng</Badge>;
      case 'HIGH':
        return <Badge variant="destructive" className="bg-orange-600">Cao</Badge>;
      case 'MEDIUM':
        return <Badge variant="secondary">Trung bình</Badge>;
      case 'LOW':
        return <Badge variant="outline">Thấp</Badge>;
      default:
        return <Badge variant="outline">{severity}</Badge>;
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="flex flex-1 gap-3 w-full md:w-auto">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Tìm kiếm nhật ký..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="SUCCESS">Thành công</SelectItem>
                <SelectItem value="FAILED">Thất bại</SelectItem>
                <SelectItem value="WARNING">Cảnh báo</SelectItem>
              </SelectContent>
            </Select>
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Mức độ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="CRITICAL">Nghiêm trọng</SelectItem>
                <SelectItem value="HIGH">Cao</SelectItem>
                <SelectItem value="MEDIUM">Trung bình</SelectItem>
                <SelectItem value="LOW">Thấp</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button className="gap-2">
            <Download className="w-4 h-4" />
            Xuất nhật ký
          </Button>
        </div>
      </Card>

      {/* Logs List */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">
          Nhật ký hoạt động ({filteredLogs.length})
        </h3>
        <div className="space-y-3">
          {filteredLogs.map((log) => (
            <div key={log.id} className="border rounded-lg p-4 hover:bg-muted/50">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-start gap-3 flex-1">
                  <div className="mt-1">{getStatusIcon(log.status)}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold">{log.action}</h4>
                      {getStatusBadge(log.status)}
                      {getSeverityBadge(log.severity)}
                    </div>
                    <div className="text-sm space-y-1">
                      <p>
                        <span className="text-muted-foreground">Người dùng:</span>{' '}
                        <span className="font-medium">{log.user}</span>
                      </p>
                      <p>
                        <span className="text-muted-foreground">Tài nguyên:</span>{' '}
                        <span className="font-medium">{log.resource}</span>
                      </p>
                      <p>
                        <span className="text-muted-foreground">IP:</span>{' '}
                        <code className="text-xs bg-muted px-2 py-0.5 rounded">{log.ipAddress}</code>
                      </p>
                      {log.details && (
                        <p className="text-muted-foreground text-xs mt-2">
                          {log.details}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap ml-4">
                  {new Date(log.timestamp).toLocaleString('vi-VN')}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
