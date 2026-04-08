/**
 * Policy List Page - Danh sách hồ sơ chế độ chính sách
 * RBAC: POLICY.VIEW
 */

'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  FileText, Search, Plus, Filter, ChevronLeft, ChevronRight,
  Eye, Edit, MoreHorizontal, RefreshCw, Calendar, Users, DollarSign
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Link from 'next/link';

interface PolicyRecord {
  id: string;
  decisionNumber?: string;
  recordType: string;
  title: string;
  reason?: string;
  status: string;         // PolicyRecordStatus: ACTIVE | EXPIRED | VOIDED
  workflowStatus: string; // AwardWorkflowStatus: PROPOSED | UNDER_REVIEW | APPROVED | REJECTED | CANCELLED
  effectiveDate?: string;
  expiryDate?: string;
  level?: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    militaryId?: string;
    rank?: string;
    unitRelation?: { name: string };
  };
}

const workflowStatusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  PROPOSED: { label: 'Đề xuất', variant: 'secondary' },
  UNDER_REVIEW: { label: 'Đang xét duyệt', variant: 'outline' },
  APPROVED: { label: 'Đã duyệt', variant: 'default' },
  REJECTED: { label: 'Từ chối', variant: 'destructive' },
  CANCELLED: { label: 'Đã hủy', variant: 'secondary' },
};

const recordTypeLabels: Record<string, string> = {
  EMULATION: 'Thi đua',
  REWARD: 'Khen thưởng',
  DISCIPLINE: 'Kỷ luật',
};

export default function PolicyListPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [records, setRecords] = useState<PolicyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [recordType, setRecordType] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 20;

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  useEffect(() => {
    fetchRecords();
  }, [currentPage, recordType, statusFilter]);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
        ...(search && { search }),
        ...(recordType && recordType !== 'ALL' && { recordType }),
        ...(statusFilter && statusFilter !== 'ALL' && { status: statusFilter }),
      });
      const res = await fetch(`/api/policy/records?${params}`);
      const data = await res.json();
      if (data.records) {
        setRecords(data.records);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotalCount(data.pagination?.total || 0);
      } else if (data.data) {
        setRecords(data.data);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotalCount(data.pagination?.total || 0);
      } else {
        setRecords([]);
      }
    } catch (error) {
      console.error('Error fetching policy records:', error);
      toast.error('Lỗi tải dữ liệu');
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchRecords();
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('vi-VN');
  };

  if (status === 'loading') {
    return (
      <div className="container mx-auto p-6 space-y-4">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="rounded-xl bg-gradient-to-r from-teal-500 via-emerald-500 to-green-500 p-6 text-white shadow-md">
        <div className="flex flex-col md:flex-row justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-white">
            <FileText className="h-6 w-6 text-white" />
            Danh sách Hồ sơ Chính sách
          </h1>
          <p className="text-teal-100">Quản lý và theo dõi các hồ sơ chế độ chính sách</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchRecords} className="bg-white/20 border-white/40 text-white hover:bg-white/30">
            <RefreshCw className="h-4 w-4 mr-2" />Làm mới
          </Button>
          <Link href="/dashboard/policy/create">
            <Button className="bg-white text-teal-700 hover:bg-white/90">
              <Plus className="h-4 w-4 mr-2" />Tạo hồ sơ mới
            </Button>
          </Link>
        </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg"><FileText className="h-5 w-5 text-blue-600" /></div>
              <div>
                <p className="text-2xl font-bold">{totalCount}</p>
                <p className="text-sm text-muted-foreground">Tổng hồ sơ</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg"><Calendar className="h-5 w-5 text-yellow-600" /></div>
              <div>
                <p className="text-2xl font-bold">{records.filter(r => r.workflowStatus === 'UNDER_REVIEW').length}</p>
                <p className="text-sm text-muted-foreground">Đang xét duyệt</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg"><Users className="h-5 w-5 text-green-600" /></div>
              <div>
                <p className="text-2xl font-bold">{records.filter(r => r.workflowStatus === 'APPROVED').length}</p>
                <p className="text-sm text-muted-foreground">Đã duyệt</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg"><DollarSign className="h-5 w-5 text-amber-600" /></div>
              <div>
                <p className="text-2xl font-bold">{records.filter(r => r.workflowStatus === 'PROPOSED').length}</p>
                <p className="text-sm text-muted-foreground">Mới đề xuất</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 flex gap-2">
              <Input
                placeholder="Tìm theo số hồ sơ, tên, mã quân nhân..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="max-w-md"
              />
              <Button variant="outline" onClick={handleSearch}>
                <Search className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex gap-2">
              <Select value={recordType} onValueChange={(v) => { setRecordType(v); setCurrentPage(1); }}>
                <SelectTrigger className="w-40">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Loại hồ sơ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tất cả loại</SelectItem>
                  {Object.entries(recordTypeLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tất cả</SelectItem>
                  {Object.entries(workflowStatusConfig).map(([key, { label }]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : records.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium">Không có hồ sơ nào</p>
              <p className="text-muted-foreground">Thử thay đổi bộ lọc hoặc tạo hồ sơ mới</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Số QĐ</TableHead>
                  <TableHead>Loại</TableHead>
                  <TableHead>Tiêu đề</TableHead>
                  <TableHead>Cán bộ</TableHead>
                  <TableHead>Đơn vị</TableHead>
                  <TableHead>Cấp</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Ngày tạo</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium text-xs">{record.decisionNumber || '-'}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{recordTypeLabels[record.recordType] || record.recordType}</Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{record.title}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{record.user?.name}</p>
                        <p className="text-xs text-muted-foreground">{record.user?.rank || record.user?.militaryId}</p>
                      </div>
                    </TableCell>
                    <TableCell>{record.user?.unitRelation?.name || '-'}</TableCell>
                    <TableCell className="text-xs">{record.level || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={workflowStatusConfig[record.workflowStatus]?.variant || 'outline'}>
                        {workflowStatusConfig[record.workflowStatus]?.label || record.workflowStatus}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(record.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/policy/requests/${record.id}`}>
                              <Eye className="h-4 w-4 mr-2" />Xem chi tiết
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/policy/requests/${record.id}/edit`}>
                              <Edit className="h-4 w-4 mr-2" />Chỉnh sửa
                            </Link>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Hiển thị {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, totalCount)} / {totalCount} hồ sơ
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="flex items-center px-3 text-sm">
              Trang {currentPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
